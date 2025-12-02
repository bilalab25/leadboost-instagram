import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useNewMessageListener } from "@/hooks/useSocket";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Instagram, Mail, Twitter, Star, Archive } from "lucide-react";
import { SiWhatsapp, SiTiktok, SiFacebook } from "react-icons/si";
import { cn } from "@/lib/utils";
import ConversationPanel from "@/components/ConversationPanel";
import { useBrand } from "@/contexts/BrandContext";

const platformIcons = {
  instagram: Instagram,
  instagram_direct: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
  tiktok: SiTiktok,
  facebook: SiFacebook,
  twitter: Twitter,
  threads: Twitter,
};

const platformColors = {
  instagram: "bg-pink-500",
  instagram_direct: "bg-pink-500",
  whatsapp: "bg-green-500",
  email: "bg-primary",
  tiktok: "bg-gray-800",
  facebook: "bg-primary",
  twitter: "bg-sky-500",
  threads: "bg-blue-500",
};

interface Conversation {
  id: string;
  integrationId: string;
  userId: string;
  brandId: string;
  metaConversationId: string;
  platform: string;
  contactName: string | null;
  lastMessage: string | null;
  lastMessageAt: Date;
  unreadCount: number;
  flag: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageListProps {
  limit?: number;
  showHeader?: boolean;
  platform?: string;
  flagFilter?: "all" | "none" | "important" | "archived";
  searchQuery?: string;
}

export default function MessageList({
  limit = 50,
  showHeader = true,
  platform,
  flagFilter = "all",
  searchQuery = "",
}: MessageListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeBrandId } = useBrand();

  const [activeConversation, setActiveConversation] = useState<{
    id: string;
    name: string;
    platform: string;
  } | null>(null);

  // ✅ Fetch conversations using TanStack Query (brand-scoped)
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ["/api/conversations", activeBrandId],
    queryFn: async () => {
      const url = `/api/conversations?brandId=${activeBrandId}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch conversations");

      const data = await res.json();
      return data.conversations;
    },
    enabled: !!activeBrandId,
  });

  // ✅ Mark conversation as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!activeBrandId) throw new Error("No active brand");
      await apiRequest(
        "PATCH",
        `/api/conversations/${conversationId}/read?brandId=${activeBrandId}`,
      );
    },
    onSuccess: (_, conversationId) => {
      // Invalidate conversations list to refresh unread counts
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", activeBrandId],
      });
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", conversationId, "messages"],
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

  // ✅ Socket.IO: Listen for new messages and update conversations
  const handleNewMessage = useCallback(
    (event: any) => {
      console.log("💬 New message received via Socket.IO:", event);

      const { provider, conversationId, message } = event;

      // Update the conversations query cache with brandId
      queryClient.setQueryData(
        ["/api/conversations", activeBrandId, platform],
        (oldData: Conversation[] | undefined) => {
          if (!oldData) return oldData;

          // Find if conversation already exists
          const existingIndex = oldData.findIndex(
            (c) => c.metaConversationId === conversationId,
          );

          if (existingIndex >= 0) {
            // Update existing conversation
            const updated = [...oldData];
            updated[existingIndex] = {
              ...updated[existingIndex],
              lastMessage: message.textContent || null,
              lastMessageAt: new Date(message.timestamp || new Date()),
              unreadCount: updated[existingIndex].unreadCount + 1,
            };
            // Move to top
            const [conv] = updated.splice(existingIndex, 1);
            return [conv, ...updated];
          }

          return oldData;
        },
      );

      // Invalidate to ensure data consistency (brand-scoped)
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", activeBrandId],
      });

      // If this is the active conversation, invalidate its messages
      if (activeConversation?.id === conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/conversations", conversationId, "messages"],
        });
      }

      // Show toast notification
      toast({
        title: "New Message",
        description: `${message.contactName || "Contact"}: ${(message.textContent || "").substring(0, 50)}${message.textContent?.length > 50 ? "..." : ""}`,
      });
    },
    [toast, queryClient, platform, activeBrandId, activeConversation],
  );

  useNewMessageListener(handleNewMessage);

  // ✅ Filter conversations by platform and flag
  const conversations = conversationsData || [];
  let filteredConversations = platform
    ? conversations.filter((c) => c.platform === platform)
    : conversations;

  // Apply flag filter
  if (flagFilter !== "all") {
    filteredConversations = filteredConversations.filter(
      (c) => c.flag === flagFilter || (!c.flag && flagFilter === "none"),
    );
  }

  // Apply search filter
  if (searchQuery && searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase().trim();
    filteredConversations = filteredConversations.filter((c) => {
      const contactName = (c.contactName || "").toLowerCase();
      const lastMessage = (c.lastMessage || "").toLowerCase();
      return contactName.includes(query) || lastMessage.includes(query);
    });
  }

  // Sort by most recent and limit
  const displayedConversations = filteredConversations
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    )
    .slice(0, limit);

  return (
    <>
      {/* Left Panel - Conversation List */}
      <div className="w-[35%] bg-white border-r border-gray-200 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            // Loading skeleton
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
          ) : displayedConversations.length === 0 ? (
            // Empty state
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No conversations found</p>
              </div>
            </div>
          ) : (
            // Conversations list
            displayedConversations.map((conversation) => {
              const PlatformIcon =
                platformIcons[
                  conversation.platform as keyof typeof platformIcons
                ];
              const platformBg =
                platformColors[
                  conversation.platform as keyof typeof platformColors
                ];
              const isActive = activeConversation?.id === conversation.id;
              const hasUnread = conversation.unreadCount > 0;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100",
                    // Important conversations get yellow background
                    conversation.flag === "important" &&
                      hasUnread &&
                      "bg-amber-50 border-l-4 border-l-yellow-500",
                    conversation.flag === "important" &&
                      !hasUnread &&
                      "bg-white border-l-4 border-l-yellow-400",
                    // Archived conversations are muted (no unread highlight)
                    conversation.flag === "archived" &&
                      "bg-gray-50 border-l-4 border-l-gray-300 opacity-75",
                    // Normal conversations (no flag)
                    (!conversation.flag || conversation.flag === "none") &&
                      hasUnread &&
                      "bg-blue-50/50",
                    // Active conversation highlight
                    isActive && "bg-gray-100 border-l-4 border-l-primary",
                  )}
                  onClick={() => {
                    setActiveConversation({
                      id: conversation.id,
                      name: conversation.contactName || "Contact",
                      platform: conversation.platform,
                    });

                    // Mark as read if unread
                    if (hasUnread) {
                      markAsReadMutation.mutate(conversation.id);
                    }
                  }}
                  data-testid={`conversation-${conversation.id}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(conversation.contactName || "?")
                            .charAt(0)
                            .toUpperCase()}
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
                            hasUnread && "font-semibold",
                            conversation.flag === "archived" && "text-gray-500",
                          )}
                        >
                          {conversation.contactName || "Contact"}
                        </p>

                        <div className="flex items-center gap-2">
                          {/* Flag icon */}
                          {conversation.flag === "important" && (
                            <Star
                              className="h-4 w-4 text-yellow-500 fill-yellow-500"
                              data-testid={`flag-icon-important-${conversation.id}`}
                              aria-label="Important conversation"
                            />
                          )}
                          {conversation.flag === "archived" && (
                            <Archive
                              className="h-4 w-4 text-gray-400"
                              data-testid={`flag-icon-archived-${conversation.id}`}
                              aria-label="Archived conversation"
                            />
                          )}

                          {hasUnread && (
                            <Badge
                              className="bg-primary text-white text-xs h-5 min-w-5 flex items-center justify-center rounded-full px-1.5"
                              data-testid={`badge-unread-${conversation.id}`}
                            >
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <span
                            className={cn(
                              "text-xs text-gray-500",
                              conversation.flag === "archived" &&
                                "text-gray-400",
                            )}
                          >
                            {formatDistanceToNow(
                              new Date(conversation.lastMessageAt),
                              {
                                addSuffix: false,
                                locale: es,
                              },
                            )}
                          </span>
                        </div>
                      </div>

                      <p
                        className={cn(
                          "text-sm text-gray-600 line-clamp-2",
                          hasUnread && "font-medium text-gray-900",
                        )}
                      >
                        {conversation.lastMessage || "(no message)"}
                      </p>
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
