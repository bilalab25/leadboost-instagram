import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Instagram,
  Reply,
  Tag,
  Calendar,
  Handshake,
  Mail,
  Twitter,
} from "lucide-react";
import { SiWhatsapp, SiTiktok, SiFacebook } from "react-icons/si";
import { cn } from "@/lib/utils";
import ConversationPanel from "@/components/ConversationPanel";

const platformIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
  tiktok: SiTiktok,
  facebook: SiFacebook,
  twitter: Twitter,
};

const platformColors = {
  instagram: "bg-pink-500",
  whatsapp: "bg-green-500",
  email: "bg-primary",
  tiktok: "bg-gray-800",
  facebook: "bg-primary",
  twitter: "bg-sky-500",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  normal: "",
  high: "bg-yellow-100 text-yellow-800",
  urgent: "bg-red-100 text-red-800",
};

export default function MessageList({
  limit = 50,
  showHeader = true,
  platform,
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeConversation, setActiveConversation] = useState<{
    id: string;
    name: string;
    platform: string;
  } | null>(null);
  const [facebookMessages, setFacebookMessages] = useState<any[]>([]);

  // 🔹 Trae mensajes locales (por ejemplo del backend interno)
  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/messages", { limit, platform }],
    retry: false,
  });

  // 🔹 Cargar mensajes desde el Graph API (Facebook)
  useEffect(() => {
    async function loadFacebookMessages() {
      try {
        const res = await fetch("/api/facebook/conversations");
        const data = await res.json();
        const conversations = data.conversations || data.data || [];

        const formatted = conversations.map((c: any) => ({
          id: c.id,
          conversationId: c.id,
          senderId: c.senders?.data?.[0]?.id || "fb_user",
          senderName: c.senders?.data?.[0]?.name || "Facebook User",
          senderAvatar: "",
          content: c.snippet || "(sin mensaje)",
          priority: "normal",
          isRead: true,
          createdAt: c.updated_time,
          socialAccount: {
            platform: "facebook",
            accountName: "Facebook Page",
          },
        }));

        setFacebookMessages(formatted);
      } catch (err) {
        console.error("❌ Error cargando mensajes de Facebook:", err);
        toast({
          title: "Error",
          description: "No se pudieron cargar los mensajes de Facebook.",
          variant: "destructive",
        });
      }
    }

    if (!platform || platform === "facebook") {
      loadFacebookMessages();
    }
  }, [platform, toast]);

  // 🔹 Combinar mensajes locales + Facebook
  const mergedMessages = [...(messages || []), ...(facebookMessages || [])];

  const filteredMessages =
    mergedMessages.filter(
      (m) => !platform || m.socialAccount?.platform === platform,
    ) || [];

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("PATCH", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="divide-y divide-gray-200">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6">
            <div className="flex items-start space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!filteredMessages.length) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No se encontraron mensajes</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {filteredMessages.slice(0, limit).map((message) => {
        const PlatformIcon =
          platformIcons[
            message.socialAccount.platform as keyof typeof platformIcons
          ];
        const platformBg =
          platformColors[
            message.socialAccount.platform as keyof typeof platformColors
          ];
        const priorityClass =
          priorityColors[message.priority as keyof typeof priorityColors];

        return (
          <div
            key={message.id}
            className={cn(
              "p-6 hover:bg-gray-50 cursor-pointer transition-colors",
              !message.isRead && "bg-primary/5",
            )}
            onClick={() =>
              !message.isRead && markAsReadMutation.mutate(message.id)
            }
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={message.senderAvatar}
                    alt={message.senderName}
                  />
                  <AvatarFallback>
                    {message.senderName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {PlatformIcon && (
                  <div
                    className={cn(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                      platformBg,
                    )}
                  >
                    <PlatformIcon className="text-white text-xs h-2.5 w-2.5" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "text-sm text-gray-900",
                      !message.isRead && "font-semibold",
                    )}
                  >
                    {message.senderName}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                    {message.priority !== "normal" && (
                      <Badge className={priorityClass}>
                        {message.priority === "high"
                          ? "Alta"
                          : message.priority === "urgent"
                            ? "Urgente"
                            : message.priority === "low"
                              ? "Baja"
                              : "Normal"}
                      </Badge>
                    )}
                  </div>
                </div>

                <p
                  className={cn(
                    "mt-1 text-sm text-gray-600 line-clamp-2",
                    !message.isRead && "font-medium",
                  )}
                >
                  {message.content}
                </p>

                <div className="mt-2 flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveConversation({
                        id: message.conversationId || message.id,
                        name: message.senderName,
                        platform: message.socialAccount.platform,
                      });
                    }}
                  >
                    <Reply className="mr-1 h-3 w-3" />
                    Responder
                  </Button>
                  <Button variant="outline" size="sm">
                    <Tag className="mr-1 h-3 w-3" />
                    Etiquetar
                  </Button>
                  {message.socialAccount.platform !== "email" && (
                    <Button variant="outline" size="sm">
                      <Handshake className="mr-1 h-3 w-3" />
                      Convertir Lead
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {activeConversation && (
        <ConversationPanel
          conversationId={activeConversation.id}
          participantName={activeConversation.name}
          platform={activeConversation.platform}
          onClose={() => setActiveConversation(null)}
        />
      )}
    </div>
  );
}
