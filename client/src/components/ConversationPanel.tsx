import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { X, Send, CheckCheck, Instagram, Mail, Twitter } from "lucide-react";
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
  imageUrl?: string | null;
  direction: "inbound" | "outbound";
  status: "sent" | "delivered" | "read" | "failed";
  createdAt: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [canSendFacebookMessage, setCanSendFacebookMessage] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isFacebookConversation = platform === "facebook";

  // 🔹 Load messages from unified endpoint
  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        if (!platform) return;

        const res = await fetch(`/api/messages/${platform}/${conversationId}`);
        const data = await res.json();

        console.log("📩 pageId:", data.pageId);
        console.log("📬 first message:", data.messages?.[0]);

        if (!res.ok) throw new Error(data.error || "Error loading messages");

        const msgs = data.messages || [];

        // 🔹 Detectar ventana de 24 h solo para Facebook
        if (platform === "facebook" && msgs.length > 0) {
          const lastInbound = msgs
            .filter((m: any) => m.fromId !== data.pageId)
            .sort(
              (a: any, b: any) =>
                new Date(b.created_time).getTime() -
                new Date(a.created_time).getTime(),
            )[0];

          if (lastInbound?.created_time) {
            const hours = differenceInHours(
              new Date(),
              new Date(lastInbound.created_time),
            );
            setCanSendFacebookMessage(hours <= 24);
          }
        }

        const formatted = msgs.map((msg: any) => ({
          id: msg.id,
          conversationId,
          senderId: msg.fromId,
          senderName: msg.from,
          content: msg.text || "(sin mensaje)",
          imageUrl: msg.imageUrl || null,
          direction:
            msg.direction ||
            (msg.fromId === data.accountId ? "outbound" : "inbound"), // ✅ usa el backend si existe
          createdAt: msg.created_time,
          status: "read",
        }));

        // 🔹 Orden cronológico
        setMessages(formatted.reverse());
      } catch (err) {
        console.error(`❌ Error loading ${platform} messages:`, err);
        toast({
          title: "Error",
          description: `No se pudieron cargar los mensajes de ${platform}.`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [conversationId, platform, toast]);

  // 🔹 Enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const res = await fetch(
        `/api/${platform}/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: data.content }),
        },
      );

      if (!res.ok) throw new Error("Error al enviar mensaje");
      return res.json();
    },
    onMutate: async (data) => {
      setMessages((prev) => [
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
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
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    if (isFacebookConversation && !canSendFacebookMessage) {
      toast({
        title: "Restricción de 24 h",
        description:
          "No puedes enviar mensajes porque han pasado más de 24 horas desde el último mensaje del usuario.",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate({ content: messageText });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const PlatformIcon =
    platform && platformIcons[platform as keyof typeof platformIcons];
  const platformBg =
    platform && platformColors[platform as keyof typeof platformColors];
  const displayName = participantName || "Usuario";
  const displayPlatform = platform || "facebook";

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
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage alt={displayName} />
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
        {isDrawer && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
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
        ) : !messages.length ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No hay mensajes aún</p>
          </div>
        ) : (
          messages.map((message) => (
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
                  <div className="space-y-2">
                    {message.content && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Imagen adjunta"
                        className="rounded-lg max-w-xs border border-gray-200 cursor-pointer transition-transform hover:scale-[1.02]"
                        loading="lazy"
                        onClick={() => setPreviewImage(message.imageUrl!)}
                      />
                    )}
                  </div>
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
            disabled={
              !messageText.trim() ||
              sendMessageMutation.isPending ||
              (isFacebookConversation && !canSendFacebookMessage)
            }
            className="rounded-full"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Vista previa"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl border border-white"
          />
        </div>
      )}
    </div>
  );
}
