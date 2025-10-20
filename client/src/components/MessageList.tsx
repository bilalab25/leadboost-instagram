import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Instagram, Reply, Tag, Calendar, Handshake, Mail, MessageCircle, Linkedin, Youtube, Twitter } from "lucide-react";
import { SiWhatsapp, SiTiktok, SiFacebook, SiTelegram, SiDiscord } from "react-icons/si";
import { cn } from "@/lib/utils";
import ConversationPanel from "@/components/ConversationPanel";

interface Message {
  id: string;
  conversationId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  isRead: boolean;
  createdAt: string;
  socialAccount: {
    platform: string;
    accountName: string;
  };
}

interface MessageListProps {
  limit?: number;
  showHeader?: boolean;
  platform?: string;
}

const platformIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
  tiktok: SiTiktok,
  facebook: SiFacebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
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
  linkedin: "bg-primary",
  youtube: "bg-red-600",
  telegram: "bg-primary",
  discord: "bg-indigo-600",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  normal: "",
  high: "bg-yellow-100 text-yellow-800",
  urgent: "bg-red-100 text-red-800",
};

export default function MessageList({ limit = 50, showHeader = true, platform }: MessageListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", { limit, platform }],
    retry: false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("PATCH", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ messageId, priority }: { messageId: string; priority: string }) => {
      await apiRequest("PATCH", `/api/messages/${messageId}/priority`, { priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Success",
        description: "Message priority updated",
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

  const filteredMessages = messages?.filter(message => 
    !platform || message.socialAccount.platform === platform
  ) || [];

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
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
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
        <p className="text-gray-500" data-testid="text-no-messages">No messages found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <Button variant={!platform ? "default" : "ghost"} size="sm" data-testid="filter-all">
              All ({filteredMessages.length})
            </Button>
            <Button variant={platform === "instagram" ? "default" : "ghost"} size="sm" data-testid="filter-instagram">
              <Instagram className="mr-2 h-4 w-4 text-pink-500" />
              Instagram
            </Button>
            <Button variant={platform === "tiktok" ? "default" : "ghost"} size="sm" data-testid="filter-tiktok">
              <SiTiktok className="mr-2 h-4 w-4 text-gray-800" />
              TikTok
            </Button>
            <Button variant={platform === "facebook" ? "default" : "ghost"} size="sm" data-testid="filter-facebook">
              <SiFacebook className="mr-2 h-4 w-4 text-primary" />
              Facebook
            </Button>
            <Button variant={platform === "whatsapp" ? "default" : "ghost"} size="sm" data-testid="filter-whatsapp">
              <SiWhatsapp className="mr-2 h-4 w-4 text-green-500" />
              WhatsApp
            </Button>
            <Button variant={platform === "twitter" ? "default" : "ghost"} size="sm" data-testid="filter-twitter">
              <Twitter className="mr-2 h-4 w-4 text-sky-500" />
              Twitter
            </Button>
            <Button variant={platform === "email" ? "default" : "ghost"} size="sm" data-testid="filter-email">
              <Mail className="mr-2 h-4 w-4 text-primary" />
              Email
            </Button>
          </div>
        </div>
      )}

      {filteredMessages.slice(0, limit).map((message) => {
        const PlatformIcon = platformIcons[message.socialAccount.platform as keyof typeof platformIcons];
        const platformBg = platformColors[message.socialAccount.platform as keyof typeof platformColors];
        const priorityClass = priorityColors[message.priority];
        
        return (
          <div 
            key={message.id} 
            className={cn(
              "p-6 hover:bg-gray-50 cursor-pointer transition-colors",
              !message.isRead && "bg-primary/5"
            )}
            onClick={() => !message.isRead && markAsReadMutation.mutate(message.id)}
            data-testid={`message-${message.id}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                  <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
                {PlatformIcon && (
                  <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center", platformBg)}>
                    <PlatformIcon className="text-white text-xs h-2.5 w-2.5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-sm text-gray-900",
                    !message.isRead && "font-semibold"
                  )} data-testid={`message-sender-${message.id}`}>
                    {message.senderName}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span data-testid={`message-time-${message.id}`}>
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: es })}
                    </span>
                    {message.priority !== "normal" && (
                      <Badge className={priorityClass} data-testid={`message-priority-${message.id}`}>
                        {message.priority === 'high' ? 'Alta' : message.priority === 'urgent' ? 'Urgente' : message.priority === 'low' ? 'Baja' : 'Normal'}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className={cn(
                  "mt-1 text-sm text-gray-600 line-clamp-2",
                  !message.isRead && "font-medium"
                )} data-testid={`message-content-${message.id}`}>
                  {message.content}
                </p>
                
                <div className="mt-2 flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveConversationId(message.conversationId || message.id);
                    }}
                    data-testid={`button-reply-${message.id}`}
                  >
                    <Reply className="mr-1 h-3 w-3" />
                    Responder
                  </Button>
                  <Button variant="outline" size="sm" data-testid={`button-tag-${message.id}`}>
                    <Tag className="mr-1 h-3 w-3" />
                    Etiquetar
                  </Button>
                  {message.socialAccount.platform !== "email" && (
                    <Button variant="outline" size="sm" data-testid={`button-convert-${message.id}`}>
                      <Handshake className="mr-1 h-3 w-3" />
                      Convertir Lead
                    </Button>
                  )}
                  {message.content.toLowerCase().includes("schedule") && (
                    <Button variant="outline" size="sm" data-testid={`button-schedule-${message.id}`}>
                      <Calendar className="mr-1 h-3 w-3" />
                      Agendar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {filteredMessages.length > limit && (
        <div className="px-6 py-3 border-t border-gray-200 text-center">
          <Button variant="ghost" data-testid="button-view-all-messages">
            Ver Todos los Mensajes ({filteredMessages.length})
          </Button>
        </div>
      )}

      {/* Conversation Panel Slide-over */}
      {activeConversationId && (
        <ConversationPanel
          conversationId={activeConversationId}
          onClose={() => setActiveConversationId(null)}
        />
      )}
    </div>
  );
}
