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
  Image as ImageIcon,
  Smile,
  Instagram,
  Mail,
  MessageCircle,
  Linkedin,
  Youtube,
  Twitter,
  Check,
  CheckCheck,
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
  attachments?: {
    id: string;
    type: string;
    url: string;
    fileName?: string;
  }[];
}

interface ConversationThread {
  id: string;
  participantName: string;
  participantAvatar?: string;
  platform: string;
}

interface ConversationPanelProps {
  conversationId: string;
  onClose: () => void;
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

export default function ConversationPanel({
  conversationId,
  onClose,
}: ConversationPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversation details
  const { data: conversation, isLoading: conversationLoading } =
    useQuery<ConversationThread>({
      queryKey: ["/api/conversations", conversationId],
      retry: false,
    });

  // Fetch messages in conversation
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", conversationId, "messages"],
    retry: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; attachments?: File[] }) => {
      // For now, just send the text content
      // File uploads can be implemented later with multipart/form-data
      return await apiRequest(
        "POST",
        `/api/conversations/${conversationId}/messages`,
        { content: data.content }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", conversationId, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
      setAttachments([]);
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
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

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() && attachments.length === 0) return;

    sendMessageMutation.mutate({
      content: messageText,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const PlatformIcon = conversation
    ? platformIcons[conversation.platform as keyof typeof platformIcons]
    : null;
  const platformBg = conversation
    ? platformColors[conversation.platform as keyof typeof platformColors]
    : "";

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-[100] flex flex-col">
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
                  alt={conversation?.participantName}
                />
                <AvatarFallback>
                  {conversation?.participantName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {PlatformIcon && (
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white",
                    platformBg
                  )}
                >
                  <PlatformIcon className="text-white text-xs h-3 w-3" />
                </div>
              )}
            </div>
            <div>
              <h3
                className="font-semibold text-gray-900"
                data-testid="conversation-participant-name"
              >
                {conversation?.participantName}
              </h3>
              <p className="text-xs text-gray-500 capitalize">
                {conversation?.platform}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          data-testid="button-close-conversation"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messagesLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-16 w-64 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-end space-x-2",
                  message.direction === "outbound" && "flex-row-reverse space-x-reverse"
                )}
                data-testid={`message-${message.id}`}
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
                    message.direction === "outbound" && "items-end"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2 rounded-2xl",
                      message.direction === "inbound"
                        ? "bg-white text-gray-900"
                        : "bg-primary text-white"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="rounded-lg overflow-hidden"
                          >
                            {attachment.type === "image" ? (
                              <img
                                src={attachment.url}
                                alt={attachment.fileName || "Attachment"}
                                className="max-w-full rounded-lg"
                              />
                            ) : (
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                              >
                                <Paperclip className="h-4 w-4" />
                                <span className="text-sm truncate">
                                  {attachment.fileName || "File"}
                                </span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
                        {message.status === "read" ? (
                          <CheckCheck className="h-3 w-3 text-primary" />
                        ) : message.status === "delivered" ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No messages yet</p>
          </div>
        )}
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Paperclip className="h-3 w-3" />
              <span>{attachments.length} file(s)</span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAttachments([])}
              data-testid="button-clear-attachments"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Message Composer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-attach-file"
          >
            <Paperclip className="h-5 w-5 text-gray-500" />
          </Button>
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="w-full bg-transparent border-none outline-none resize-none text-sm max-h-32"
              rows={1}
              data-testid="input-message-text"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={
              (!messageText.trim() && attachments.length === 0) ||
              sendMessageMutation.isPending
            }
            className="rounded-full"
            size="icon"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
