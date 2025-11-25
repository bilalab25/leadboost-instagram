import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useNewMessageListener } from "@/hooks/useSocket";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import {
  X,
  Send,
  CheckCheck,
  Instagram,
  Mail,
  Twitter,
  AlertTriangle,
  Flag,
  Archive,
  Star,
  UserPlus,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  SiWhatsapp,
  SiTiktok,
  SiFacebook,
  SiTelegram,
  SiDiscord,
} from "react-icons/si";
import { cn } from "@/lib/utils";
import type { Customer } from "@shared/schema";
import { useBrand } from "@/contexts/BrandContext";
import { apiRequest } from "@/lib/queryClient";

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
  const { activeBrandId } = useBrand();
  const [metaConversationId, setMetaConversationId] = useState<string | null>(
    null,
  );
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  // Mantener el estado, pero ahora solo se usará para la lógica de visualización y deshabilitación
  const [canSendFacebookMessage, setCanSendFacebookMessage] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [conversationFlag, setConversationFlag] = useState<
    "none" | "important" | "archived"
  >("none");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch linked customer for this conversation (brand-scoped)
  const { data: linkedCustomer } = useQuery<Customer>({
    queryKey: ["/api/customers/by-conversation", activeBrandId, conversationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/customers/by-conversation/${conversationId}?brandId=${activeBrandId}`,
      );
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch customer");
      }
      return res.json();
    },
    enabled: !!activeBrandId,
    retry: false,
  });

  const isFacebookConversation = platform === "facebook";

  // 🔹 Load messages from conversations endpoint
  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        if (!conversationId) return;

        // Fetch conversation details first to get the flag
        const conversationRes = await fetch(
          `/api/conversations/${conversationId}?brandId=${activeBrandId}`,
        );
        const conversationData = await conversationRes.json();
        if (conversationData.conversation) {
          setConversationFlag(conversationData.conversation.flag || "none");
        }

        const res = await fetch(
          `/api/conversations/${conversationId}/messages?brandId=${activeBrandId}`,
        );
        const data = await res.json();

        console.log("DATA, trayendo todos los mensajes: ", data);

        if (!res.ok) throw new Error(data.error || "Error loading messages");

        const msgs = data.messages || [];

        // 🔹 Extract metaConversationId from messages (needed for sending)
        if (msgs.length > 0 && msgs[0].metaConversationId) {
          setMetaConversationId(msgs[0].metaConversationId);
        }

        // 🔹 Detectar ventana de 24 h solo para Facebook
        if (platform === "facebook" && msgs.length > 0) {
          // Busca el último mensaje entrante (del usuario)
          const lastInbound = msgs
            .filter((m: any) => m.direction === "inbound")
            .sort(
              (a: any, b: any) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            )[0];

          if (lastInbound?.timestamp) {
            const hours = differenceInHours(
              new Date(),
              new Date(lastInbound.timestamp),
            );
            // Actualización del estado
            setCanSendFacebookMessage(hours <= 24);
          } else {
            // Si no hay mensajes entrantes, asumimos que no se puede enviar
            setCanSendFacebookMessage(false);
          }
        }

        const formatted = msgs.map((msg: any) => ({
          id: msg.id,
          conversationId,
          senderId: msg.senderId,
          senderName: msg.contactName || msg.senderId || "User",
          content: msg.textContent || "(sin mensaje)",
          imageUrl: null, // Will need to fetch attachments separately
          direction: msg.direction, // Already set by backend
          createdAt: msg.timestamp,
          status: msg.isRead ? "read" : "delivered",
        }));

        // 🔹 Backend now returns messages in chronological order (oldest first)
        setMessages(formatted);
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

  // ✅ Mark conversation as read mutation (using new conversation API)
  const markAsReadMutation = useMutation({
    mutationFn: async (convId: string) => {
      if (!activeBrandId) throw new Error("No active brand");
      await apiRequest(
        "PATCH",
        `/api/conversations/${convId}/read?brandId=${activeBrandId}`,
      );
    },
    onSuccess: (_, convId) => {
      // Invalidate conversations list to refresh unread counts
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", activeBrandId],
      });
    },
    onError: (error: Error) => {
      console.error("❌ Error marking conversation as read:", error);
    },
  });

  // 🔹 Mark messages as read when conversation is opened
  useEffect(() => {
    if (!conversationId) return;
    markAsReadMutation.mutate(conversationId);
  }, [conversationId]);

  // 🔹 Mark messages as read when conversation is opened
  useEffect(() => {
    // 💡 Asegúrate de que ambos, conversationId Y activeBrandId, existan
    if (!conversationId || !activeBrandId) {
      console.log("markAsRead skipped:", { conversationId, activeBrandId });
      return;
    }
    console.log(
      `Executing markAsRead for ${conversationId} with brand ${activeBrandId}`,
    );
    markAsReadMutation.mutate(conversationId);
  }, [conversationId, activeBrandId]);

  // ✅ Socket.IO: Listen for new messages in real-time for this conversation
  const handleNewMessage = useCallback(
    (event: any) => {
      const { provider, conversationId: msgConvoId, message } = event;

      // Only add message if it belongs to this conversation
      if (provider === platform && msgConvoId === conversationId) {
        const formattedMessage: Message = {
          id: message.id,
          conversationId: conversationId,
          senderId: message.senderId,
          senderName: message.contactName || "Unknown User",
          content: message.textContent || "(sin mensaje)",
          imageUrl: null,
          direction: "inbound",
          status: "read",
          createdAt: message.timestamp || new Date().toISOString(),
        };

        // Add the new message to the conversation
        setMessages((prev) => {
          // Check if message already exists (prevent duplicates)
          const exists = prev.some((m) => m.id === formattedMessage.id);
          if (exists) return prev;

          // **ACTUALIZAR LÓGICA DE 24H AL RECIBIR NUEVO MENSAJE INBOUND**
          if (
            isFacebookConversation &&
            formattedMessage.direction === "inbound"
          ) {
            setCanSendFacebookMessage(true);
          }

          return [...prev, formattedMessage];
        });
      }
    },
    [platform, conversationId, isFacebookConversation, activeBrandId],
  );

  useNewMessageListener(handleNewMessage);

  // 🏁 Mutation to update conversation flag
  const updateFlagMutation = useMutation({
    mutationFn: async (flag: "none" | "important" | "archived") => {
      if (!activeBrandId) throw new Error("No active brand");

      const res = await fetch(
        `/api/conversations/${conversationId}/flag?brandId=${activeBrandId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flag }),
        },
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error updating flag");

      return result;
    },
    onSuccess: (data) => {
      setConversationFlag(data.conversation.flag);
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", activeBrandId],
      });
      toast({
        title: "Flag updated",
        description: `Conversation marked as ${data.conversation.flag}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 🏁 Mutation to create customer lead
  const createLeadMutation = useMutation({
    mutationFn: async () => {
      if (!activeBrandId) throw new Error("No active brand");

      // Extract phone number from metaConversationId for WhatsApp
      let phone = null;
      if (platform === "whatsapp" && metaConversationId) {
        // metaConversationId format: "PHONE_NUMBER_ID_SENDER_PHONE"
        // Extract the sender phone (everything after the last underscore)
        const parts = metaConversationId.split("_");
        if (parts.length >= 2) {
          phone = parts[parts.length - 1]; // Get the last part (sender's phone)
        }
      }

      const res = await fetch(`/api/customers?brandId=${activeBrandId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: participantName || "Unknown Contact",
          phone,
          platform,
          conversationId, // Pass the database conversation ID
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("Customer already exists");
        }
        throw new Error(result.message || "Error creating customer");
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/customers", activeBrandId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/customers/by-conversation?brandId=${activeBrandId}`,
          activeBrandId,
          conversationId,
        ],
      });
      toast({
        title: "Lead Created!",
        description: `${data.name} has been added to your customers`,
      });
    },
    onError: (error: Error) => {
      toast({
        title:
          error.message === "Customer already exists"
            ? "Already a Customer"
            : "Error",
        description:
          error.message === "Customer already exists"
            ? "This contact is already in your customer list"
            : error.message,
        variant:
          error.message === "Customer already exists"
            ? "default"
            : "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      if (!activeBrandId) throw new Error("No active brand");

      // ⚙️ Usa metaConversationId si existe (para Facebook)
      const targetConversationId = metaConversationId || conversationId;
      const res = await fetch(
        `/api/${platform}/conversations/${targetConversationId}/messages?brandId=${activeBrandId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: data.content,
            conversationId: conversationId,
          }),
        },
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al enviar mensaje");

      return result;
    },

    onMutate: async (data) => {
      // Agrega mensaje local optimista
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
      setMessageText("");
      toast({
        title: "✅ Mensaje enviado",
        description: `Tu mensaje fue enviado correctamente a ${platform}.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", activeBrandId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", conversationId, "messages"],
      });
    },

    onError: (error: Error) => {
      // Opcionalmente, puedes manejar el mensaje de error específico de la restricción de 24h aquí.
      toast({
        title: "Error al enviar mensaje",
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
    // La restricción ahora es solo para deshabilitar el botón/input visualmente,
    // el backend debería aplicar la restricción.
    // **QUITAMOS EL TOAST Y EL RETURN DE LA LÓGICA DEL BOTÓN**
    // if (isFacebookConversation && !canSendFacebookMessage) {
    //   toast({ ... });
    //   return;
    // }
    sendMessageMutation.mutate({ content: messageText });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // También se debe verificar la restricción para la tecla Enter
      if (!isFacebookConversation || canSendFacebookMessage) {
        handleSendMessage();
      }
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
        "bg-white flex",
        isDrawer
          ? "fixed inset-y-0 right-0 w-full sm:w-[900px] shadow-2xl z-[100]"
          : "h-full",
      )}
    >
      {/* Main conversation area - Left column */}
      <div className="flex-1 flex flex-col">
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

          <div className="flex items-center gap-1">
            {/* Create Lead Button - disabled if customer exists */}
            {!linkedCustomer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => createLeadMutation.mutate()}
                disabled={createLeadMutation.isPending}
                data-testid="button-create-lead"
                title="Create Lead"
              >
                <UserPlus className="h-4 w-4 text-green-600" />
              </Button>
            )}

            {/* Flag Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={updateFlagMutation.isPending}
                  data-testid="button-flag-dropdown"
                >
                  {conversationFlag === "important" && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                  {conversationFlag === "archived" && (
                    <Archive className="h-4 w-4 text-gray-500" />
                  )}
                  {conversationFlag === "none" && (
                    <Flag className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => updateFlagMutation.mutate("none")}
                  data-testid="flag-option-none"
                >
                  <Flag className="h-4 w-4 mr-2 text-gray-400" />
                  None
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateFlagMutation.mutate("important")}
                  data-testid="flag-option-important"
                >
                  <Star className="h-4 w-4 mr-2 text-yellow-500" />
                  Important
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateFlagMutation.mutate("archived")}
                  data-testid="flag-option-archived"
                >
                  <Archive className="h-4 w-4 mr-2 text-gray-500" />
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isDrawer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-panel"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Mensajes */}
        {/* ... (código de mensajes sin cambios) */}
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
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
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

        {/* Composer MODIFICADO */}
        <div className="bg-white border-t border-gray-200 p-4">
          {/* Bloque de alerta de 24 horas */}
          {isFacebookConversation && !canSendFacebookMessage && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                **Restricción de 24 h:** Han pasado más de 24 horas desde el
                último mensaje del usuario. Solo se pueden enviar mensajes de
                respuesta estándar dentro de este plazo.
              </p>
            </div>
          )}

          <div className="flex items-end space-x-2">
            <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  isFacebookConversation && !canSendFacebookMessage
                    ? "No se puede responder (Restricción de 24 h)"
                    : "Escribe un mensaje..."
                }
                className={cn(
                  "w-full bg-transparent border-none outline-none resize-none text-sm max-h-32",
                  isFacebookConversation &&
                    !canSendFacebookMessage &&
                    "cursor-not-allowed text-gray-500",
                )}
                rows={1}
                disabled={isFacebookConversation && !canSendFacebookMessage} // Deshabilitar el input
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={
                !messageText.trim() ||
                sendMessageMutation.isPending ||
                (isFacebookConversation && !canSendFacebookMessage) // Deshabilitar el botón
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

      {/* Right column - Participant/Customer Info */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col overflow-y-auto">
        {/* Participant Info Header */}
        <div className="p-6 border-b border-gray-200 flex flex-col items-center">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage alt={displayName} />
            <AvatarFallback className="text-2xl">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg text-gray-900">{displayName}</h3>
          <div className="flex items-center gap-2 mt-1">
            {PlatformIcon && (
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  platformBg,
                )}
              >
                <PlatformIcon className="text-white text-xs h-3 w-3" />
              </div>
            )}
            <p className="text-sm text-gray-500 capitalize">
              {displayPlatform}
            </p>
          </div>
        </div>

        {/* Customer Details Section */}
        {linkedCustomer ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">
                Customer Information
              </h4>
              <Badge
                variant={
                  linkedCustomer.status === "active"
                    ? "default"
                    : linkedCustomer.status === "inactive"
                      ? "secondary"
                      : "outline"
                }
              >
                {linkedCustomer.status}
              </Badge>
            </div>

            {linkedCustomer.email && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Email
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {linkedCustomer.email}
                </p>
              </div>
            )}

            {linkedCustomer.phone && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Phone
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {linkedCustomer.phone}
                </p>
              </div>
            )}

            {linkedCustomer.company && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Company
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {linkedCustomer.company}
                </p>
              </div>
            )}

            {linkedCustomer.totalInvoiced !== undefined &&
              linkedCustomer.totalInvoiced !== null && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Total Invoiced
                  </label>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    ${(linkedCustomer.totalInvoiced / 100).toFixed(2)}
                  </p>
                </div>
              )}

            {linkedCustomer.address && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Address
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {linkedCustomer.address}
                </p>
              </div>
            )}

            {linkedCustomer.notes && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Notes
                </label>
                <p className="text-sm text-gray-700 mt-1">
                  {linkedCustomer.notes}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-500 uppercase">
                Customer Since
              </label>
              <p className="text-sm text-gray-600 mt-1">
                {linkedCustomer.createdAt &&
                  new Date(linkedCustomer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-sm text-gray-500 text-center">
              No customer information available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
