import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Calendar, 
  Zap, 
  Sparkles, 
  TrendingUp,
  Users,
  MessageSquare,
  Bot
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import ContentCalendar from "@/pages/calendar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiRequest } from "@/lib/queryClient";
import { useBrand } from "@/contexts/BrandContext";
import { useLanguage } from "@/hooks/useLanguage";
import boosty_face from "./boosty_face.png";

interface BrandContext {
  brand: {
    name: string;
    industry?: string;
  };
  design: {
    brandStyle?: string;
    colors: {
      primary?: string;
    };
  } | null;
  sales: {
    last30Days: {
      totalRevenue: number;
      transactionCount: number;
    };
    customerCount: number;
  } | null;
  integrations: {
    connected: string[];
  };
  conversations: {
    unreadCount: number;
  };
}

export default function Waterfall() {
  const { activeBrandId } = useBrand();
  const { language } = useLanguage();
  
  const getWelcomeMessage = () => {
    return language === "es"
      ? "¡Hola! Soy Boosty, tu estratega de marketing con IA 🚀. Estoy aquí para ayudarte a diseñar estrategias, crear contenido y lanzar publicaciones que hagan crecer tu marca. ¿En qué puedo ayudarte hoy?"
      : "Welcome! I'm Boosty, your AI-powered marketing strategist 🚀. I'm here to help you design strategies, create content, and launch posts that grow your brand. How can I help you today?";
  };

  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; image?: string }[]
  >([
    {
      role: "assistant",
      content: getWelcomeMessage(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { data: contextData } = useQuery<{ context: BrandContext }>({
    queryKey: ["/api/boosty/context", activeBrandId],
    queryFn: async () => {
      const response = await fetch(`/api/boosty/context?brandId=${activeBrandId}`);
      if (!response.ok) throw new Error("Failed to fetch context");
      return response.json();
    },
    enabled: !!activeBrandId
  });

  const { data: suggestionsData } = useQuery<{ suggestions: string[] }>({
    queryKey: ["/api/boosty/suggestions", activeBrandId, language],
    queryFn: async () => {
      const response = await fetch(`/api/boosty/suggestions?brandId=${activeBrandId}&language=${language}`);
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      return response.json();
    },
    enabled: !!activeBrandId
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/boosty/chat", {
        brandId: activeBrandId,
        message,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        language
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response,
        image: data.image
      }]);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: language === "es" 
          ? "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo."
          : "Sorry, there was an error processing your message. Please try again."
      }]);
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending || !activeBrandId) return;
    const userInput = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userInput }]);
    setInput("");
    chatMutation.mutate(userInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  const suggestions = suggestionsData?.suggestions || [
    language === "es" ? "Genera una imagen para mi próximo post de Instagram" : "Generate an image for my next Instagram post",
    language === "es" ? "Crea un diseño promocional para mi marca" : "Create a promotional design for my brand",
    language === "es" ? "Genera una estrategia de redes sociales para Q4" : "Generate a comprehensive Q4 social media strategy",
    language === "es" ? "Ayúdame a escribir un post para Instagram" : "Help me write an Instagram post",
  ];

  const context = contextData?.context;

  const t = {
    noBrand: language === "es" 
      ? "Por favor selecciona una marca para comenzar a chatear con Boosty"
      : "Please select a brand to start chatting with Boosty",
    typing: language === "es" ? "Boosty está pensando..." : "Boosty is thinking...",
    placeholder: language === "es" 
      ? "Escribe tu mensaje a Boosty..."
      : "Type your message to Boosty...",
    stats: {
      revenue: language === "es" ? "Ingresos" : "Revenue",
      customers: language === "es" ? "Clientes" : "Customers",
      unread: language === "es" ? "Sin leer" : "Unread"
    },
    quickActions: language === "es" ? "Acciones rápidas" : "Quick actions"
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopHeader pageName="Meet CampAIgner" />

      <div className="flex bg-gray-50 dark:bg-gray-900 h-[calc(100vh-64px)]">
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <main className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Tabs
              defaultValue="campaigns"
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4 p-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <TabsTrigger
                  value="campaigns"
                  className="flex items-center gap-2 rounded-lg data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-600 data-[state=active]:to-cyan-500"
                  data-testid="tab-campaigns"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Strategize with</span> Boosty
                </TabsTrigger>
                <TabsTrigger
                  value="planner"
                  className="flex items-center gap-2 rounded-lg"
                  data-testid="tab-planner"
                >
                  <Calendar className="h-4 w-4" />
                  30-Day Planner
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="campaigns"
                className="flex-1 flex flex-col h-full mt-0"
              >
                {!activeBrandId ? (
                  <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-4 p-8"
                    >
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center mx-auto shadow-xl">
                        <Sparkles className="w-12 h-12 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-cyan-500 bg-clip-text text-transparent">
                        Boosty AI
                      </h2>
                      <p className="text-muted-foreground max-w-md">{t.noBrand}</p>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                    {/* Header with brand context */}
                    <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.05, 1],
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity,
                              repeatDelay: 3
                            }}
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center shadow-lg"
                          >
                            <Sparkles className="w-6 h-6 text-white" />
                          </motion.div>
                          <div>
                            <h2 className="font-bold text-lg bg-gradient-to-r from-brand-600 to-cyan-500 bg-clip-text text-transparent">
                              Boosty AI
                            </h2>
                            {context && (
                              <p className="text-sm text-muted-foreground">
                                {language === "es" ? "Asistente de" : "Assistant for"} <span className="font-medium text-brand-600">{context.brand.name}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {context && (
                          <div className="hidden md:flex items-center gap-3">
                            {context.sales && (
                              <>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                    ${context.sales.last30Days.totalRevenue.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                  <Users className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                    {context.sales.customerCount}
                                  </span>
                                </div>
                              </>
                            )}
                            {context.conversations.unreadCount > 0 && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {context.conversations.unreadCount}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat messages */}
                    <ScrollArea ref={scrollRef} className="flex-1 p-6">
                      <div className="space-y-4 max-w-3xl mx-auto">
                        <AnimatePresence>
                          {messages.map((msg, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex items-start gap-3 ${
                                msg.role === "user" ? "justify-end" : "justify-start"
                              }`}
                              data-testid={`message-${msg.role}-${i}`}
                            >
                              {msg.role === "assistant" && (
                                <img
                                  src={boosty_face}
                                  alt="Boosty"
                                  className="w-9 h-9 rounded-full shadow-md flex-shrink-0"
                                />
                              )}
                              <div
                                className={`px-4 py-3 max-w-[80%] text-sm leading-relaxed ${
                                  msg.role === "user"
                                    ? "bg-gradient-to-r from-brand-600 to-cyan-500 text-white rounded-2xl rounded-br-sm shadow-md"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-sm"
                                }`}
                              >
                                {msg.role === "assistant" ? (
                                  <>
                                    {msg.image && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mb-4"
                                      >
                                        <div className="relative group">
                                          <img
                                            src={msg.image}
                                            alt="Generated content"
                                            className="w-full max-w-md rounded-xl shadow-lg object-cover cursor-pointer hover:shadow-xl transition-shadow"
                                            style={{ maxHeight: "400px" }}
                                            data-testid="generated-image"
                                            onClick={() => window.open(msg.image, '_blank')}
                                          />
                                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Badge className="bg-gradient-to-r from-brand-600 to-cyan-500 text-white text-xs">
                                              <Sparkles className="w-3 h-3 mr-1" />
                                              {language === "es" ? "IA Generada" : "AI Generated"}
                                            </Badge>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        p: (props) => (
                                          <p className="mb-2 last:mb-0" {...props} />
                                        ),
                                        strong: (props) => (
                                          <strong className="font-semibold" {...props} />
                                        ),
                                        em: (props) => (
                                          <em className="italic" {...props} />
                                        ),
                                        ul: (props) => (
                                          <ul className="list-disc ml-5 my-2" {...props} />
                                        ),
                                        ol: (props) => (
                                          <ol className="list-decimal ml-5 my-2" {...props} />
                                        ),
                                        li: (props) => <li className="my-1" {...props} />,
                                        a: (props) => (
                                          <a
                                            className="text-brand-600 dark:text-cyan-400 underline"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            {...props}
                                          />
                                        ),
                                        code: (props) => (
                                          <code className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-sm" {...props} />
                                        ),
                                        hr: (props) => (
                                          <hr className="my-3 border-t border-gray-300 dark:border-gray-600" {...props} />
                                        ),
                                        img: ({ src, alt }) => (
                                          <img
                                            src={src}
                                            alt={alt || "Preview"}
                                            className="w-full max-w-md rounded-lg shadow-md my-3 object-cover"
                                            style={{ maxHeight: "400px" }}
                                            data-testid="image-preview"
                                          />
                                        ),
                                      }}
                                    >
                                      {msg.content}
                                    </ReactMarkdown>
                                  </>
                                ) : (
                                  <span className="whitespace-pre-wrap">{msg.content}</span>
                                )}
                              </div>
                              {msg.role === "user" && (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center shadow-md flex-shrink-0">
                                  <span className="text-white text-sm font-medium">
                                    {language === "es" ? "Tú" : "You"}
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {chatMutation.isPending && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3"
                          >
                            <img
                              src={boosty_face}
                              alt="Boosty"
                              className="w-9 h-9 rounded-full shadow-md"
                            />
                            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 bg-brand-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                              <span className="text-sm text-muted-foreground ml-2">{t.typing}</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Quick suggestions */}
                    {messages.length <= 2 && (
                      <div className="px-6 py-3 border-t bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {t.quickActions}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.slice(0, 4).map((s, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestionClick(s)}
                              disabled={chatMutation.isPending}
                              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-300 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-cyan-400 transition-all disabled:opacity-50"
                              data-testid={`suggestion-${i}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Input area */}
                    <div className="p-4 border-t bg-white dark:bg-gray-800">
                      <div className="max-w-3xl mx-auto flex items-end gap-3">
                        <div className="flex-1 relative">
                          <Textarea
                            ref={textareaRef}
                            placeholder={t.placeholder}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="min-h-[48px] max-h-[120px] resize-none rounded-xl border-gray-200 dark:border-gray-600 pr-12 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            disabled={chatMutation.isPending}
                            rows={1}
                            data-testid="input-chat"
                          />
                        </div>
                        <Button
                          onClick={handleSend}
                          disabled={chatMutation.isPending || !input.trim()}
                          className="h-12 w-12 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600 shadow-lg"
                          data-testid="button-send"
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="planner" className="flex-1 mt-0">
                <ContentCalendar />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}
