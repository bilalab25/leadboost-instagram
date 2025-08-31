import { useState } from 'react';
import { MessageCircle, X, Send, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  action?: 'schedule_appointment' | 'handoff_to_human' | 'show_services';
  schedulingData?: {
    service: string;
    preferredDate?: string;
    preferredTime?: string;
  };
}

interface AIChatbotProps {
  brandId: string;
  customerIdentifier: string;
  platform: string;
}

export function AIChatbot({ brandId, customerIdentifier, platform }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '¡Hola! Soy el asistente virtual de Renuve. ¿En qué puedo ayudarte hoy?',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const chatMutation = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      return apiRequest('/api/chatbot/message', 'POST', { message, brandId, customerIdentifier, platform });
    },
    onSuccess: (response: any) => {
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        text: response.message || 'Lo siento, no pude procesar tu mensaje.',
        isBot: true,
        timestamp: new Date(),
        action: response.action,
        schedulingData: response.schedulingData
      };
      setMessages(prev => [...prev, botMessage]);
    },
    onError: () => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: 'Lo siento, hay un problema técnico. Un representante se conectará contigo pronto.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to chatbot
    chatMutation.mutate({ message: inputMessage });
    
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-16 h-16 bg-blue-600 hover:bg-blue-700 shadow-lg"
          data-testid="button-open-chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] bg-white rounded-lg shadow-xl border">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-blue-600 text-white rounded-t-lg">
          <div>
            <CardTitle className="text-lg">Asistente Renuve</CardTitle>
            <div className="flex items-center gap-1 text-sm opacity-90">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              En línea
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-blue-700"
            data-testid="button-close-chatbot"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 max-h-96">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.isBot
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                  
                  {/* Action buttons */}
                  {message.action === 'schedule_appointment' && message.schedulingData && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {message.schedulingData.service}
                        </span>
                      </div>
                      {message.schedulingData.preferredDate && (
                        <div className="flex items-center gap-2 text-xs text-blue-700">
                          <Clock className="h-3 w-3" />
                          {message.schedulingData.preferredDate}
                          {message.schedulingData.preferredTime && ` a las ${message.schedulingData.preferredTime}`}
                        </div>
                      )}
                      <Button size="sm" className="mt-2 w-full">
                        Confirmar Cita
                      </Button>
                    </div>
                  )}
                  
                  {message.action === 'show_services' && (
                    <div className="mt-2 space-y-1">
                      <Badge variant="secondary">Botox - $300</Badge>
                      <Badge variant="secondary">Facial - $150</Badge>
                      <Badge variant="secondary">Rellenos - $400</Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1"
                disabled={chatMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                disabled={!inputMessage.trim() || chatMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Powered by LeadBoost AI
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}