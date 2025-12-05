import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Loader2,
  Lightbulb,
  TrendingUp,
  MessageSquare,
  Palette,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

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

export default function BoostyPage() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: suggestionsData } = useQuery<{ suggestions: string[] }>({
    queryKey: ["/api/boosty/suggestions", language],
    queryFn: async () => {
      const response = await fetch(`/api/boosty/suggestions?language=${language}`);
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      return response.json();
    }
  });

  const { data: contextData } = useQuery<{ context: BrandContext }>({
    queryKey: ["/api/boosty/context"],
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/boosty/chat", {
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
        timestamp: new Date()
      }]);
    }
  });

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    
    chatMutation.mutate(userMessage.content);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const context = contextData?.context;
  const suggestions = suggestionsData?.suggestions || [];

  const t = {
    title: language === "es" ? "Boosty" : "Boosty",
    subtitle: language === "es" 
      ? "Tu asistente de marketing con IA" 
      : "Your AI marketing assistant",
    placeholder: language === "es" 
      ? "Escribe tu mensaje..." 
      : "Type your message...",
    send: language === "es" ? "Enviar" : "Send",
    thinking: language === "es" ? "Pensando..." : "Thinking...",
    suggestions: language === "es" ? "Sugerencias rápidas" : "Quick suggestions",
    welcome: language === "es"
      ? "¡Hola! Soy Boosty, tu asistente de marketing. 🚀 Conozco todo sobre tu marca y estoy listo para ayudarte. ¿En qué puedo asistirte hoy?"
      : "Hello! I'm Boosty, your marketing assistant. 🚀 I know everything about your brand and I'm ready to help. How can I assist you today?",
    stats: {
      revenue: language === "es" ? "Ingresos (30 días)" : "Revenue (30 days)",
      customers: language === "es" ? "Clientes" : "Customers",
      unread: language === "es" ? "Sin leer" : "Unread",
      integrations: language === "es" ? "Integraciones" : "Integrations"
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {t.title}
              </h1>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>

          {context && (
            <div className="hidden md:flex items-center gap-4">
              {context.sales && (
                <>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t.stats.revenue}</p>
                    <p className="font-semibold text-green-600">
                      ${context.sales.last30Days.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t.stats.customers}</p>
                    <p className="font-semibold">{context.sales.customerCount}</p>
                  </div>
                </>
              )}
              {context.conversations.unreadCount > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  {context.conversations.unreadCount} {t.stats.unread}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {t.welcome}
                      </p>
                      {context && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {context.brand.name && (
                            <Badge variant="outline" className="bg-white/50">
                              <Palette className="w-3 h-3 mr-1" />
                              {context.brand.name}
                            </Badge>
                          )}
                          {context.sales && (
                            <Badge variant="outline" className="bg-white/50">
                              <ShoppingBag className="w-3 h-3 mr-1" />
                              {context.sales.last30Days.transactionCount} ventas
                            </Badge>
                          )}
                          {context.integrations.connected.length > 0 && (
                            <Badge variant="outline" className="bg-white/50">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {context.integrations.connected.length} plataformas
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {suggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    {t.suggestions}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-left p-3 rounded-xl bg-white dark:bg-gray-800 border hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 text-sm"
                      >
                        <MessageSquare className="w-4 h-4 inline mr-2 text-purple-500" />
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                      : "bg-white dark:bg-gray-800 border shadow-sm"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {chatMutation.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.thinking}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            className="min-h-[50px] max-h-[150px] resize-none rounded-xl"
            rows={1}
            data-testid="boosty-input"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-6"
            data-testid="boosty-send"
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
