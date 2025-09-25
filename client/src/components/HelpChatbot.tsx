import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Send } from "lucide-react";

// 👉 Importa la mascota localmente
import boosty from "./boosty.png"; // ajusta la ruta según tu proyecto

interface HelpChatbotProps {
  isSpanish: boolean;
  toggleLanguage: () => void;
  mascot?: string; // opcional: por si quieres otra imagen
}

export default function HelpChatbot({
  isSpanish,
  toggleLanguage,
  mascot,
}: HelpChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ id: string; text: string; isBot: boolean; timestamp: Date }>
  >([
    {
      id: "1",
      text: isSpanish
        ? "¡Hola! Soy tu asistente de LeadBoost. ¿En qué puedo ayudarte?"
        : "Hi! I'm your LeadBoost assistant. How can I help you?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulación de respuesta
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: isSpanish
            ? "Estoy pensando en ideas para ti 🚀"
            : "I'm brainstorming ideas for you 🚀",
          isBot: true,
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 1000);

    setInputMessage("");
  };

  // Si está cerrado → solo muestra la mascota flotante
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {/* Globito */}
        <div className="bg-white shadow-md px-3 py-2 rounded-lg text-sm text-gray-700 border border-gray-200">
          👋 {isSpanish ? "¿Necesitas ayuda?" : "Need help?"}
        </div>
        {/* Mascota */}
        <button
          onClick={() => setIsOpen(true)}
          className="w-36 h-48 hover:scale-110 transition-transform"
        >
          <img
            src={mascot || boosty}
            alt="LeadBoost Assistant"
            className="w-36 h-48 rounded-full"
          />
        </button>
      </div>
    );
  }

  // Si está abierto → muestra la ventana de chat
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[500px] bg-white rounded-lg shadow-xl border">
      <Card className="h-full flex flex-col">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-brand-600 text-white rounded-t-lg">
          <div>
            <CardTitle className="text-lg">
              {isSpanish ? "Asistente LeadBoost" : "LeadBoost Assistant"}
            </CardTitle>
            <div className="flex items-center gap-1 text-sm opacity-90">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              {isSpanish ? "En línea" : "Online"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-white hover:bg-brand-700 text-xs px-2"
            >
              {isSpanish ? "🇺🇸 EN" : "🇪🇸 ES"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-brand-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 flex flex-col p-0 max-h-80">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.isBot
                      ? "bg-gray-100 text-gray-800"
                      : "bg-brand-600 text-white"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg animate-pulse">
                  ...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  isSpanish ? "Escribe tu pregunta..." : "Type your question..."
                }
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                disabled={!inputMessage.trim() || isLoading}
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
