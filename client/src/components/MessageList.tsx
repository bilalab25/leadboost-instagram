import { useEffect, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useNewMessageListener } from "@/hooks/useSocket";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Instagram, Mail, Twitter } from "lucide-react";
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

interface MessageListProps {
  limit?: number;
  showHeader?: boolean;
  platform?: string;
}

export default function MessageList({
  limit = 50,
  showHeader = true,
  platform,
}: MessageListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeConversation, setActiveConversation] = useState<{
    id: string;
    name: string;
    platform: string;
  } | null>(null);

  const [unifiedMessages, setUnifiedMessages] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Callback to refresh messages list (called when conversation is opened)
  const handleConversationOpened = (platform: string, conversationId: string) => {
    // Optimistically clear the unread count for this conversation
    const unreadKey = `${platform}-${conversationId}`;
    setUnreadCounts(prev => {
      const updated = { ...prev };
      delete updated[unreadKey];
      return updated;
    });
  };

  // ✅ NEW: Cargar mensajes de TODAS las plataformas conectadas usando endpoint unificado
  useEffect(() => {
    async function loadAllMessages() {
      try {
        setLoading(true);

        // Try unified aggregation endpoint first
        const res = await fetch("/api/conversations/messages/all");

        if (!res.ok) {
          console.error(
            "❌ Unified endpoint failed, falling back to Facebook only",
          );
          // Fallback to Facebook only
          const fbRes = await fetch("/api/facebook/conversations");
          const fbData = await fbRes.json();
          const conversations = fbData.conversations || fbData.data || [];

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

          setUnifiedMessages(formatted);
          return;
        }

        const data = await res.json();
        const messages = data.messages || [];
        const counts = data.unreadCounts || {};

        // Transform unified messages to component format
        const formatted = messages.map((m: any) => ({
          id: m.id,
          conversationId: m.conversationId, // CRITICAL: Use server-provided conversation ID, not message ID
          senderId: m.fromId,
          senderName: m.from,
          senderAvatar: "",
          content: m.text || "(sin mensaje)",
          priority: "normal",
          isRead: true,
          createdAt: m.created_time,
          socialAccount: {
            platform: m.provider,
            accountName: `${m.provider.charAt(0).toUpperCase() + m.provider.slice(1)}`,
          },
        }));

        setUnifiedMessages(formatted);
        setUnreadCounts(counts);
      } catch (err) {
        console.error("❌ Error loading unified messages:", err);
        toast({
          title: "Error",
          description: "Could not load messages from connected platforms.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadAllMessages();
  }, [toast]); // Removed platform dependency to load all on mount

  // ✅ Socket.IO: Listen for new messages in real-time
  const handleNewMessage = useCallback((event: any) => {
    console.log("💬 New message received via Socket.IO:", event);

    const { provider, conversationId, message } = event;

    // Format the message to match the component's expected format
    const formattedMessage = {
      id: message.id,
      conversationId: conversationId,
      senderId: message.senderId,
      senderName: message.contactName || "Unknown User",
      senderAvatar: "",
      content: message.textContent || "(sin mensaje)",
      priority: "normal",
      isRead: false,
      createdAt: message.timestamp || new Date().toISOString(),
      socialAccount: {
        platform: provider,
        accountName: `${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
      },
    };

    // Add the new message to the unified messages list
    setUnifiedMessages(prev => {
      // Check if message already exists (prevent duplicates)
      const exists = prev.some(m => m.id === formattedMessage.id);
      if (exists) return prev;
      
      return [formattedMessage, ...prev];
    });

    // Update unread count
    const unreadKey = `${provider}-${conversationId}`;
    setUnreadCounts(prev => ({
      ...prev,
      [unreadKey]: (prev[unreadKey] || 0) + 1
    }));

    // Show toast notification
    toast({
      title: "New Message",
      description: `${formattedMessage.senderName}: ${formattedMessage.content.substring(0, 50)}${formattedMessage.content.length > 50 ? '...' : ''}`,
    });
  }, [toast]);

  useNewMessageListener(handleNewMessage);

  // ✅ Filter messages by selected platform
  console.log(unifiedMessages, "mensajes");
  const filteredMessages =
    unifiedMessages.filter(
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

  // ✅ Agrupar mensajes por conversaciónId
  const groupedConversations = Object.values(
    filteredMessages.reduce((acc: any, msg: any) => {
      const convoId = msg.conversationId || msg.id;
      if (!acc[convoId]) {
        acc[convoId] = {
          ...msg,
          messages: [msg],
        };
      } else {
        acc[convoId].messages.push(msg);
        // si este mensaje es más reciente, actualiza los datos principales
        if (new Date(msg.createdAt) > new Date(acc[convoId].createdAt)) {
          acc[convoId] = { ...acc[convoId], ...msg };
        }
      }
      return acc;
    }, {}),
  );

  return (
    <>
      {console.log(groupedConversations, "conversaciones")}
      {/* Left Panel - Conversation List */}
      <div className="w-[35%] bg-white border-r border-gray-200 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            // 🔹 Loader mientras se cargan las conversaciones
            <div className="divide-y divide-gray-100 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 flex items-start space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : !filteredMessages.length ? (
            // 🔹 Empty State
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No messages found</p>
              </div>
            </div>
          ) : (
            // 🔹 Lista de conversaciones
            groupedConversations
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .slice(0, limit)
              .map((message) => {
                const PlatformIcon =
                  platformIcons[
                    message.socialAccount.platform as keyof typeof platformIcons
                  ];
                const platformBg =
                  platformColors[
                    message.socialAccount
                      .platform as keyof typeof platformColors
                  ];
                const isActive =
                  activeConversation?.id ===
                  (message.conversationId || message.id);

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100",
                      !message.isRead && "bg-blue-50/50",
                      isActive && "bg-gray-100 border-l-4 border-l-primary",
                    )}
                    onClick={() => {
                      const convoId = message.conversationId || message.id;
                      const platform = message.socialAccount.platform;
                      
                      setActiveConversation({
                        id: convoId,
                        name: message.senderName,
                        platform: platform,
                      });
                      
                      // Clear unread badge immediately
                      handleConversationOpened(platform, convoId);
                      
                      if (!message.isRead) {
                        markAsReadMutation.mutate(message.id);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={message.senderAvatar}
                            alt={message.senderName}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {message.senderName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {PlatformIcon && (
                          <div
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white",
                              platformBg,
                            )}
                          >
                            <PlatformIcon className="text-white text-xs h-3 w-3" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p
                            className={cn(
                              "text-sm text-gray-900 truncate",
                              !message.isRead && "font-semibold",
                            )}
                          >
                            {message.senderName}
                          </p>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const unreadKey = `${message.socialAccount.platform}-${message.conversationId || message.id}`;
                              const unreadCount = unreadCounts[unreadKey] || 0;
                              return unreadCount > 0 ? (
                                <Badge 
                                  className="bg-primary text-white text-xs h-5 min-w-5 flex items-center justify-center rounded-full px-1.5"
                                  data-testid={`badge-unread-${message.conversationId}`}
                                >
                                  {unreadCount}
                                </Badge>
                              ) : null;
                            })()}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(message.createdAt), {
                                addSuffix: false,
                                locale: es,
                              })}
                            </span>
                          </div>
                        </div>

                        <p
                          className={cn(
                            "text-sm text-gray-600 line-clamp-2",
                            !message.isRead && "font-medium text-gray-900",
                          )}
                        >
                          {message.content}
                        </p>

                        {!message.isRead && false && (
                          <div className="mt-1">
                            <Badge className="bg-primary text-white text-xs">
                              New
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Right Panel - Conversation or Empty State */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        {activeConversation ? (
          <div className="w-full h-full">
            <ConversationPanel
              conversationId={activeConversation.id}
              participantName={activeConversation.name}
              platform={activeConversation.platform}
              onClose={() => setActiveConversation(null)}
              isDrawer={false}
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-200 mb-4">
              <Mail className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select a conversation
            </h3>
            <p className="text-sm text-gray-500">
              Choose a conversation from the list to view messages
            </p>
          </div>
        )}
      </div>
    </>
  );
}
