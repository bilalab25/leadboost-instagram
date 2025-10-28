import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  X,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Instagram,
  Mail,
  Twitter,
} from "lucide-react";
import {
  SiWhatsapp,
  SiTiktok,
  SiFacebook,
  SiTelegram,
  SiDiscord,
} from "react-icons/si";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  direction: "inbound" | "outbound";
  status: "sent" | "delivered" | "read" | "failed";
  createdAt: string;
}

interface ConversationThread {
  id: string;
  participantName: string;
  participantAvatar?: string;
  platform: string;
}

interface ConversationPanelProps {
  conversationId: string;
  participantName?: string;
  platform?: string;
  onClose: () => void;
  isDrawer?: boolean;
}

const platformIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
  tiktok: SiTiktok,
  facebook: SiFacebook,
  twitter: Twitter,
  telegram: SiTelegram,
  discord: SiDiscord,
};

const platformColors = {
  instagram: "bg-pink-500",
  whatsapp: "bg-green-500",
  email: "bg-primary",
  tiktok: "bg-gray-800",
  facebook: "bg-primary",
  twitter: "bg-sky-500",
  telegram: "bg-primary",
  discord: "bg-indigo-600",
};

export default function ConversationPanel({
  conversationId,
  participantName,
  platform,
  onClose,
  isDrawer = true,
}: ConversationPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [facebookMessages, setFacebookMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [facebookLoading, setFacebookLoading] = useState(false);

  // 🔹 Detectar si es conversación de Facebook
  const isFacebookConversation = conversationId.startsWith("t_");

  // 🔹 Fetch de conversación normal (no Facebook)
  const { data: conversation, isLoading: conversationLoading } =
    useQuery<ConversationThread>({
      queryKey: ["/api/conversations", conversationId],
      queryFn: async () => {
        if (isFacebookConversation) {
          // Si es de Facebook, construimos un "mock" básico
          return {
            id: conversationId,
            participantName: "Facebook User",
            platform: "facebook",
          };
        }

        const response = await fetch(`/api/conversations/${conversationId}`);
        if (!response.ok) throw new Error("Failed to fetch conversation");
        return response.json();
      },
      retry: false,
    });

  // 🔹 Fetch de mensajes normales (solo si NO es Facebook)
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", conversationId, "messages"],
    queryFn: async () => {
      if (isFacebookConversation) return []; // evitamos llamadas duplicadas
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    retry: false,
  });

  useEffect(() => {
    async function loadFacebookConversationMessages() {
      try {
        setFacebookLoading(true);
        const res = await fetch(
          `/api/facebook/conversations/${conversationId}/messages`,
        );
        const data = await res.json();

        const pageId = data.pageId;
        const messagesArray = data.messages || [];

        // ✅ 1. Detectar dinámicamente el fromId más frecuente (probablemente el de la página)
        const frequency: Record<string, number> = {};
        for (const msg of messagesArray) {
          const id = msg.fromId || msg.from?.id;
          if (!id) continue;
          frequency[id] = (frequencxy[id] || 0) + 1;
        }
        // ✅ 3. Formatear mensajes usando el pageId dinámico

        const formatted = messagesArray.map((msg: any) => ({
          id: msg.id,
          conversationId,
          senderId: msg.fromId,
          senderName: msg.from,
          content: msg.text || "(sin mensaje)",
          direction: msg.fromId === pageId ? "outbound" : "inbound",
          createdAt: msg.created_time,
          status: "read",
        }));

        setFacebookMessages(formatted.reverse());
      } catch (err) {
        console.error("❌ Error cargando mensajes de Facebook:", err);
        toast({
          title: "Error",
          description: "No se pudieron cargar los mensajes de Facebook.",
          variant: "destructive",
        });
      } finally {
        setFacebookLoading(false);
      }
    }

    if (isFacebookConversation) loadFacebookConversationMessages();
  }, [conversationId, isFacebookConversation, toast]);

  // 🔹 Enviar mensajes
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      if (isFacebookConversation) {
        const res = await fetch(
          `/api/facebook/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: data.content }),
          },
        );

        if (!res.ok) throw new Error("Error al enviar mensaje de Facebook");
        const result = await res.json();
        return result;
      }

      // Caso normal (mensajes internos)
      return await apiRequest(
        "POST",
        `/api/conversations/${conversationId}/messages`,
        {
          content: data.content,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", conversationId, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
      setAttachments([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 🔹 Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, facebookMessages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate({ content: messageText });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  onMutate: async (data) => {
    if (isFacebookConversation) {
      setFacebookMessages((prev) => [
        ...prev,
        {
          id: "temp_" + Date.now(),
          conversationId,
          senderId: "me",
          senderName: "Tú",
          content: data.content,
          direction: "outbound",
          status: "sent",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  },

  const displayedMessages = isFacebookConversation
    ? facebookMessages
    : messages || [];

  const PlatformIcon = conversation
    ? platformIcons[conversation.platform as keyof typeof platformIcons]
    : null;
  const platformBg = conversation
    ? platformColors[conversation.platform as keyof typeof platformColors]
    : "";
  const displayName =
    participantName || conversation?.participantName || "Usuario";
  const displayPlatform = platform || conversation?.platform || "facebook";
  return (
    <div
      className={cn(
        "bg-white flex flex-col",
        isDrawer
          ? "fixed inset-y-0 right-0 w-full sm:w-[500px] shadow-2xl z-[100]"
          : "h-full",
      )}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        {conversationLoading ? (
          <div className="flex items-center space-x-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={conversation?.participantAvatar}
                  alt={displayName}
                />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              {PlatformIcon && (
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white",
                    platformBg,
                  )}
                >
                  <PlatformIcon className="text-white text-xs h-3 w-3" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{displayName}</h3>
              <p className="text-xs text-gray-500 capitalize">
                {displayPlatform}
              </p>
            </div>
          </div>
        )}
        {isDrawer && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* 🔹 Loader de carga Facebook */}
        {facebookLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-16 w-64 rounded-2xl" />
              </div>
            ))}
            <div className="flex items-center justify-center pt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
            </div>
          </div>
        ) : !displayedMessages?.length ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No hay mensajes aún</p>
          </div>
        ) : (
          displayedMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-end space-x-2",
                message.direction === "outbound" &&
                  "flex-row-reverse space-x-reverse",
              )}
            >
              {message.direction === "inbound" && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage
                    src={message.senderAvatar}
                    alt={message.senderName}
                  />
                  <AvatarFallback>
                    {message.senderName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "flex flex-col max-w-[70%]",
                  message.direction === "outbound" && "items-end",
                )}
              >
                <div
                  className={cn(
                    "px-4 py-2 rounded-2xl",
                    message.direction === "inbound"
                      ? "bg-white text-gray-900"
                      : "bg-primary text-white",
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
                <div className="flex items-center space-x-1 mt-1 px-2">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                  {message.direction === "outbound" && (
                    <span className="text-xs text-gray-500">
                      <CheckCheck className="h-3 w-3 text-primary" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe un mensaje..."
              className="w-full bg-transparent border-none outline-none resize-none text-sm max-h-32"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="rounded-full"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
