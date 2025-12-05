import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Calendar, Zap, Image as ImageIcon, Mic, Sparkles } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import ContentCalendar from "@/pages/calendar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiRequest } from "@/lib/queryClient";
import { useBrand } from "@/contexts/BrandContext";
import { useLanguage } from "@/hooks/useLanguage";
import boosty from "./boosty.png";
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
      ? "¡Hola! Soy Boosty, tu estratega de marketing con IA 🚀. Estoy aquí para ayudarte a diseñar estrategias, crear contenido y lanzar publicaciones que hagan crecer tu marca. ¿Te gustaría que te guíe en tu primera campaña de este mes?"
      : "Welcome! I'm Boosty, your AI-powered marketing strategist 🚀. I'm here to help you design strategies, create content, and launch posts that grow your brand. Would you like me to walk you through your first campaign this month?";
  };

  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content: getWelcomeMessage(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
        content: data.response
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  const suggestions = suggestionsData?.suggestions || [
    language === "es" ? "Genera una estrategia de redes sociales para Q4" : "Generate a comprehensive Q4 social media strategy report",
    language === "es" ? "Analiza el rendimiento de mis competidores" : "Analyze competitor performance data (top 3 trends)",
    language === "es" ? "Crea un calendario de publicaciones para 7 días" : "Model a 7-day high-conversion posting calendar",
    language === "es" ? "Ayúdame a escribir un post para Instagram" : "Help me write an Instagram post",
  ];

  const context = contextData?.context;

  const t = {
    noBrand: language === "es" 
      ? "Por favor selecciona una marca para comenzar a chatear con Boosty"
      : "Please select a brand to start chatting with Boosty",
    typing: language === "es" ? "Boosty está pensando..." : "Boosty is thinking...",
    placeholder: language === "es" 
      ? "Formula tu solicitud o directiva de campaña..."
      : "Formulate your request or campaign directive...",
    strategyTip: language === "es" 
      ? "💡 ¿Necesitas ayuda con estrategia?"
      : "💡 Need high-level strategy input?",
    stats: {
      revenue: language === "es" ? "Ingresos (30d)" : "Revenue (30d)",
      customers: language === "es" ? "Clientes" : "Customers",
      unread: language === "es" ? "Sin leer" : "Unread"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName="Meet CampAIgner" />

      <div className="flex bg-gray-50 h-[calc(100vh-64px)]">
        <Sidebar />
        <div className="flex-1">
          <main className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
            <Tabs
              defaultValue="campaigns"
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger
                  value="campaigns"
                  className="flex items-center data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#0891b2] data-[state=active]:to-[hsl(210,70%,45%)]"
                  data-testid="tab-campaigns"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Strategize with Boosty
                </TabsTrigger>
                <TabsTrigger
                  value="planner"
                  className="flex items-center"
                  data-testid="tab-planner"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  30-Day Content Planner
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="campaigns"
                className="flex-1 flex flex-col h-full"
              >
                {!activeBrandId ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto shadow-xl">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-muted-foreground">{t.noBrand}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {context && (
                      <div className="mb-4 flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                        <span className="font-medium text-purple-700">{context.brand.name}</span>
                        {context.sales && (
                          <>
                            <span className="text-sm text-gray-500">|</span>
                            <span className="text-sm text-green-600 font-medium">
                              {t.stats.revenue}: ${context.sales.last30Days.totalRevenue.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-500">|</span>
                            <span className="text-sm">
                              {t.stats.customers}: {context.sales.customerCount}
                            </span>
                          </>
                        )}
                        {context.conversations.unreadCount > 0 && (
                          <>
                            <span className="text-sm text-gray-500">|</span>
                            <span className="text-sm text-orange-600">
                              {context.conversations.unreadCount} {t.stats.unread}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
                      {messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 ${
                            msg.role === "user" ? "justify-end" : "justify-start"
                          }`}
                          data-testid={`message-${msg.role}-${i}`}
                        >
                          {msg.role === "assistant" && (
                            <img
                              src={boosty_face}
                              alt="Boosty"
                              className="w-10 h-10 rounded-full shadow-sm"
                            />
                          )}
                          <div
                            className={`px-4 py-3 max-w-[75%] text-sm leading-relaxed ${
                              msg.role === "user"
                                ? "bg-blue-600 text-white rounded-2xl rounded-br-none shadow-md"
                                : "bg-white text-gray-900 rounded-2xl rounded-bl-none shadow-sm border border-gray-200"
                            }`}
                          >
                            {msg.role === "assistant" ? (
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
                                    <ul
                                      className="list-disc ml-5 my-2"
                                      {...props}
                                    />
                                  ),
                                  ol: (props) => (
                                    <ol
                                      className="list-decimal ml-5 my-2"
                                      {...props}
                                    />
                                  ),
                                  li: (props) => <li className="my-1" {...props} />,
                                  a: (props) => (
                                    <a
                                      className="text-blue-600 underline"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      {...props}
                                    />
                                  ),
                                  code: (props) => (
                                    <code
                                      className="bg-gray-100 px-1 rounded text-sm"
                                      {...props}
                                    />
                                  ),
                                  hr: (props) => (
                                    <hr
                                      className="my-3 border-t border-gray-300"
                                      {...props}
                                    />
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
                            ) : (
                              <span className="whitespace-pre-wrap">
                                {msg.content}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t bg-white">
                      {chatMutation.isPending && (
                        <div
                          className="flex items-center gap-2 px-6 pt-4"
                          data-testid="typing-indicator"
                        >
                          <img
                            src={boosty_face}
                            alt="Boosty"
                            className="w-6 h-6 rounded-full"
                          />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                          <span className="text-xs text-gray-400 ml-1">
                            {t.typing}
                          </span>
                        </div>
                      )}

                      <div className="p-4 flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-100 rounded-full"
                          data-testid="button-attach-image"
                        >
                          <ImageIcon className="h-5 w-5 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-100 rounded-full"
                          data-testid="button-voice"
                        >
                          <Mic className="h-5 w-5 text-gray-500" />
                        </Button>
                        <div className="flex-1 relative">
                          <Input
                            placeholder={t.placeholder}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            className="w-full rounded-full border-gray-300 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500"
                            disabled={chatMutation.isPending}
                            data-testid="input-chat"
                          />
                          <button
                            onClick={handleSend}
                            disabled={chatMutation.isPending}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-full p-2 shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            data-testid="button-send"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {suggestions.slice(0, 4).map((s, i) => (
                          <button
                            key={i}
                            onClick={() => setInput(s)}
                            disabled={chatMutation.isPending}
                            className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                            data-testid={`suggestion-${i}`}
                          >
                            <Zap className="h-4 w-4 inline-block text-blue-500 mr-2" />
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="planner" className="h-full">
                <ContentCalendar />
              </TabsContent>
            </Tabs>

            <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
              <div className="bg-white shadow-lg px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200">
                {t.strategyTip}
              </div>
              <img
                src={boosty}
                alt="LeadBoost Assistant"
                className="w-36 h-48 cursor-pointer hover:scale-105 transition-transform"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
