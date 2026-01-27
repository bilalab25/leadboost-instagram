import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, Bot, FileText, Send, User, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface HelpDropdownProps {
  isSpanish?: boolean;
}

const faqs = {
  en: [
    {
      question: "What is LeadBoost?",
      answer:
        "LeadBoost is an AI-powered platform that creates high-quality marketing content for your business in seconds. Describe your products or services, and our AI generates posts, images, and captions ready to publish across 21+ platforms, saving you hours of work.",
    },
    {
      question: "Which platforms can I publish to?",
      answer:
        "LeadBoost supports Instagram, TikTok, Facebook, LinkedIn, Twitter/X, YouTube, Pinterest, Snapchat, WhatsApp, Email marketing, and more. Every post is optimized for the right format, size, and style for each platform, ensuring maximum engagement.",
    },
    {
      question: "Can I schedule posts in advance?",
      answer:
        "Absolutely! LeadBoost lets you plan and schedule campaigns days, weeks, or even months ahead. Once scheduled, posts are published automatically, so you can focus on growing your business instead of managing multiple platforms.",
    },
    {
      question: "Can I customize the AI-generated content?",
      answer:
        "Yes! You have full control to edit captions, images, hashtags, and posting times. Tailor every campaign to match your brand’s voice and style while still benefiting from AI’s speed and creativity.",
    },
    {
      question: "Does LeadBoost integrate with other tools?",
      answer:
        "Yes! Connect LeadBoost with Shopify, WooCommerce, Google Analytics, Canva, and many more. API access is also available for custom integrations and automated workflows.",
    },
    {
      question: "Do you offer customer support?",
      answer:
        "LeadBoost offers 24/7 support via chat, email, and phone. Plus, our AI assistant is always available to guide you, along with tutorials and documentation to make your campaigns effortless.",
    },
  ],
  es: [
    {
      question: "¿Qué es LeadBoost?",
      answer:
        "LeadBoost es una plataforma impulsada por IA que crea contenido de marketing de alta calidad para tu negocio en segundos. Describe tus productos o servicios y nuestra IA genera publicaciones, imágenes y textos listos para publicar en más de 21 plataformas, ahorrándote horas de trabajo.",
    },
    {
      question: "¿En qué plataformas puedo publicar?",
      answer:
        "LeadBoost soporta Instagram, TikTok, Facebook, LinkedIn, Twitter/X, YouTube, Pinterest, Snapchat, WhatsApp, marketing por email y más. Cada publicación se optimiza con el formato, tamaño y estilo correctos para cada plataforma, garantizando el máximo engagement.",
    },
    {
      question: "¿Puedo programar publicaciones con anticipación?",
      answer:
        "¡Por supuesto! LeadBoost te permite planificar y programar campañas por días, semanas o incluso meses. Una vez programadas, las publicaciones se publican automáticamente, para que puedas enfocarte en hacer crecer tu negocio.",
    },
    {
      question: "¿Puedo personalizar el contenido generado por IA?",
      answer:
        "¡Sí! Tienes control total para editar subtítulos, imágenes, hashtags y horarios de publicación. Ajusta cada campaña al estilo y voz de tu marca mientras aprovechas la rapidez y creatividad de la IA.",
    },
    {
      question: "¿Se integra LeadBoost con otras herramientas?",
      answer:
        "¡Sí! Conecta LeadBoost con Shopify, WooCommerce, Google Analytics, Canva y muchas más. También ofrecemos acceso API para integraciones personalizadas y automatización avanzada.",
    },
    {
      question: "¿Hay soporte al cliente disponible?",
      answer:
        "LeadBoost ofrece soporte 24/7 vía chat, email y teléfono. Además, nuestro asistente de IA está siempre disponible para guiarte, junto con tutoriales y documentación para que tus campañas sean fáciles y efectivas.",
    },
  ],
};

export function HelpDropdown({ isSpanish = false }: HelpDropdownProps) {
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: isSpanish
        ? "¡Hola! Soy el asistente de IA de CampAIgner. ¿En qué puedo ayudarte hoy?"
        : "Hello! I'm the CampAIgner AI assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", {
        message,
        language: isSpanish ? "es" : "en",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: data.response,
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: isSpanish
            ? "Lo siento, hubo un error. Por favor, intenta de nuevo o contacta soporte."
            : "Sorry, there was an error. Please try again or contact support.",
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const currentFaqs = isSpanish ? faqs.es : faqs.en;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            data-testid="button-help-dropdown"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            {isSpanish ? "Ayuda" : "Help"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowChatbot(true)}>
            <Bot className="h-4 w-4 mr-2" />
            {isSpanish ? "Chat con IA" : "AI Chat"}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileText className="h-4 w-4 mr-2" />
            {isSpanish ? "Preguntas Frecuentes" : "FAQs"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            {isSpanish ? "Documentación" : "Documentation"}
          </DropdownMenuItem>
          <DropdownMenuItem>
            {isSpanish ? "Contactar Soporte" : "Contact Support"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              {isSpanish
                ? "Asistente IA - CampAIgner"
                : "AI Assistant - CampAIgner"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="chat" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                {isSpanish ? "Chat IA" : "AI Chat"}
              </TabsTrigger>
              <TabsTrigger value="faqs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {isSpanish ? "Preguntas Frecuentes" : "FAQs"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="h-[500px] flex flex-col">
              <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === "assistant" && (
                            <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                          )}
                          {message.role === "user" && (
                            <User className="h-4 w-4 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.role === "user"
                                  ? "text-blue-100"
                                  : "text-gray-500"
                              }`}
                            >
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600">
                            {isSpanish ? "Escribiendo..." : "Typing..."}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    isSpanish ? "Escribe tu mensaje..." : "Type your message..."
                  }
                  disabled={chatMutation.isPending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={chatMutation.isPending || !inputMessage.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="faqs" className="h-[500px] mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-1">
                  {currentFaqs.map((faq, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-gray-900">
                          {faq.question}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default HelpDropdown;
