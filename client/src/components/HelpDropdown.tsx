import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle, Bot, FileText, Send, User, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface HelpDropdownProps {
  isSpanish?: boolean;
}

const faqs = {
  en: [
    {
      question: "How does CampAIgner work?",
      answer: "CampAIgner uses AI to automatically generate marketing campaigns based on your business data. Simply describe your business, and our AI creates custom content for 21+ platforms including Instagram, TikTok, Facebook, LinkedIn, and more."
    },
    {
      question: "What platforms does CampAIgner support?",
      answer: "We support 21+ platforms including Instagram (Posts & Stories), TikTok, Facebook, LinkedIn, Twitter/X, YouTube, Pinterest, Snapchat, WhatsApp, Email marketing, and many more. Each platform gets optimized content with perfect dimensions."
    },
    {
      question: "How much does CampAIgner cost?",
      answer: "We offer a 14-day free trial with no credit card required. After that, our plans start at $29/month for small businesses, with enterprise options available. All plans include unlimited campaign generation and multi-platform publishing."
    },
    {
      question: "Can I customize the AI-generated content?",
      answer: "Absolutely! All AI-generated campaigns can be fully customized. You can edit captions, swap images, adjust targeting, modify schedules, and fine-tune everything before publishing to ensure it matches your brand voice."
    },
    {
      question: "Do you integrate with my existing tools?",
      answer: "Yes! CampAIgner integrates with popular tools like Shopify, WooCommerce, Google Analytics, Facebook Business Manager, Canva, and many more. We also offer API access for custom integrations."
    },
    {
      question: "Is there customer support available?",
      answer: "We provide 24/7 customer support via live chat, email, and phone. Plus, you have access to our AI assistant for instant help, comprehensive documentation, and video tutorials."
    }
  ],
  es: [
    {
      question: "¿Cómo funciona CampAIgner?",
      answer: "CampAIgner utiliza IA para generar automáticamente campañas de marketing basadas en los datos de tu negocio. Simplemente describe tu negocio y nuestra IA crea contenido personalizado para más de 21 plataformas incluyendo Instagram, TikTok, Facebook, LinkedIn y más."
    },
    {
      question: "¿Qué plataformas soporta CampAIgner?",
      answer: "Soportamos más de 21 plataformas incluyendo Instagram (Posts y Stories), TikTok, Facebook, LinkedIn, Twitter/X, YouTube, Pinterest, Snapchat, WhatsApp, marketing por email y muchas más. Cada plataforma recibe contenido optimizado con dimensiones perfectas."
    },
    {
      question: "¿Cuánto cuesta CampAIgner?",
      answer: "Ofrecemos una prueba gratuita de 14 días sin tarjeta de crédito requerida. Después, nuestros planes comienzan en $29/mes para pequeñas empresas, con opciones empresariales disponibles. Todos los planes incluyen generación ilimitada de campañas y publicación multiplataforma."
    },
    {
      question: "¿Puedo personalizar el contenido generado por IA?",
      answer: "¡Por supuesto! Todas las campañas generadas por IA pueden ser completamente personalizadas. Puedes editar subtítulos, cambiar imágenes, ajustar segmentación, modificar horarios y ajustar todo antes de publicar para asegurar que coincida con la voz de tu marca."
    },
    {
      question: "¿Se integra con mis herramientas existentes?",
      answer: "¡Sí! CampAIgner se integra con herramientas populares como Shopify, WooCommerce, Google Analytics, Facebook Business Manager, Canva y muchas más. También ofrecemos acceso API para integraciones personalizadas."
    },
    {
      question: "¿Hay soporte al cliente disponible?",
      answer: "Proporcionamos soporte al cliente 24/7 vía chat en vivo, email y teléfono. Además, tienes acceso a nuestro asistente de IA para ayuda instantánea, documentación completa y tutoriales en video."
    }
  ]
};

export function HelpDropdown({ isSpanish = false }: HelpDropdownProps) {
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: isSpanish 
        ? '¡Hola! Soy el asistente de IA de CampAIgner. ¿En qué puedo ayudarte hoy?'
        : 'Hello! I\'m the CampAIgner AI assistant. How can I help you today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/chat', {
        message,
        language: isSpanish ? 'es' : 'en'
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: isSpanish 
          ? 'Lo siento, hubo un error. Por favor, intenta de nuevo o contacta soporte.'
          : 'Sorry, there was an error. Please try again or contact support.',
        role: 'assistant',
        timestamp: new Date()
      }]);
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage('');
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
            {isSpanish ? 'Ayuda' : 'Help'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowChatbot(true)}>
            <Bot className="h-4 w-4 mr-2" />
            {isSpanish ? 'Chat con IA' : 'AI Chat'}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileText className="h-4 w-4 mr-2" />
            {isSpanish ? 'Preguntas Frecuentes' : 'FAQs'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            {isSpanish ? 'Documentación' : 'Documentation'}
          </DropdownMenuItem>
          <DropdownMenuItem>
            {isSpanish ? 'Contactar Soporte' : 'Contact Support'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              {isSpanish ? 'Asistente IA - CampAIgner' : 'AI Assistant - CampAIgner'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="chat" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                {isSpanish ? 'Chat IA' : 'AI Chat'}
              </TabsTrigger>
              <TabsTrigger value="faqs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {isSpanish ? 'Preguntas Frecuentes' : 'FAQs'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="h-[500px] flex flex-col">
              <ScrollArea className="flex-1 p-4 border rounded-lg mb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                          )}
                          {message.role === 'user' && (
                            <User className="h-4 w-4 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
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
                            {isSpanish ? 'Escribiendo...' : 'Typing...'}
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
                  placeholder={isSpanish ? 'Escribe tu mensaje...' : 'Type your message...'}
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

            <TabsContent value="faqs" className="h-[500px]">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {currentFaqs.map((faq, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
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