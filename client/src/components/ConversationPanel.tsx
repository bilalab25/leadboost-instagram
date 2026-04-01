import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useNewMessageListener } from "@/hooks/useSocket";
import { formatDistanceToNow, differenceInHours } from "date-fns";
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
  Eye,
  Paperclip,
  Mic,
  StopCircle,
  Trash2,
  Image as ImageIcon,
  FileIcon,
  MessageCircle,
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
  attachments: {
    id: string;
    type: "image" | "video" | "audio" | "file";
    url: string;
    mimeType?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
  }[];
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
  contactProfilePictureProp?: string | null;
}

const platformIcons = {
  instagram: Instagram,
  instagram_direct: Instagram,
  whatsapp: SiWhatsapp,
  whatsapp_baileys: SiWhatsapp,
  email: Mail,
  tiktok: SiTiktok,
  facebook: SiFacebook,
  twitter: Twitter,
  telegram: SiTelegram,
  discord: SiDiscord,
  threads: MessageCircle,
};

const platformColors = {
  instagram: "bg-pink-500",
  instagram_direct: "bg-pink-500",
  whatsapp: "bg-green-500",
  whatsapp_baileys: "bg-green-500",
  email: "bg-primary",
  tiktok: "bg-gray-800",
  facebook: "bg-primary",
  twitter: "bg-sky-500",
  telegram: "bg-primary",
  discord: "bg-indigo-600",
  threads: "bg-gray-800",
};

const platformLabels: Record<string, string> = {
  whatsapp_baileys: "WhatsApp",
  instagram_direct: "Instagram",
};

export default function ConversationPanel({
  conversationId,
  participantName,
  platform,
  contactProfilePictureProp,
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
  // State used for display logic and disabling send controls
  const [canSendFacebookMessage, setCanSendFacebookMessage] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [conversationFlag, setConversationFlag] = useState<
    "none" | "important" | "archived"
  >("none");
  const [contactProfilePicture, setContactProfilePicture] = useState<
    string | null
  >(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup recording interval on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Fetch linked customer for this conversation (brand-scoped)
  const { data: linkedCustomer } = useQuery<Customer>({
    queryKey: ["/api/customers/by-conversation", activeBrandId, conversationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/customers/by-conversation/${conversationId}?brandId=${activeBrandId}`,
        { credentials: "include" },
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
  const isMetaConversation =
    platform === "facebook" ||
    platform === "instagram" ||
    platform === "instagram_direct";

  // Load messages from conversations endpoint
  useEffect(() => {
    let aborted = false;

    async function loadMessages() {
      try {
        setLoading(true);
        if (!conversationId) return;

        // Fetch conversation details first to get the flag
        const conversationRes = await fetch(
          `/api/conversations/${conversationId}?brandId=${activeBrandId}`,
          { credentials: "include" },
        );
        if (aborted) return;
        const conversationData = await conversationRes.json();
        if (aborted) return;
        if (conversationData.conversation) {
          setConversationFlag(conversationData.conversation.flag || "none");
          if (conversationData.conversation.contactProfilePicture) {
            setContactProfilePicture(
              conversationData.conversation.contactProfilePicture,
            );
          }
        }

        const res = await fetch(
          `/api/conversations/${conversationId}/messages?brandId=${activeBrandId}`,
          { credentials: "include" },
        );
        if (aborted) return;
        const data = await res.json();
        if (aborted) return;

        if (!res.ok) throw new Error(data.error || "Error loading messages");

        const msgs = data.messages || [];

        // Extract metaConversationId from messages (needed for sending)
        if (msgs.length > 0 && msgs[0].metaConversationId) {
          setMetaConversationId(msgs[0].metaConversationId);
        }

        // Detect 24h window for Meta conversations only
        if (isMetaConversation && msgs.length > 0) {
          // Find the last inbound message (from the user)
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
            // Update state
            setCanSendFacebookMessage(hours <= 24);
          } else {
            // If no inbound messages, assume we cannot send
            setCanSendFacebookMessage(false);
          }
        }

        const formatted: Message[] = msgs.map((msg: any) => ({
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          senderName: msg.contact_name || msg.sender_id || "User",
          content: msg.text_content || "",
          direction: msg.direction,
          createdAt: msg.timestamp,
          status: msg.is_read ? "read" : "delivered",
          attachments: msg.attachments || [],
        }));

        // Backend now returns messages in chronological order (oldest first)
        if (!aborted) {
          setMessages(formatted);
        }
      } catch (err) {
        if (aborted) return;
        console.error(`[ConversationPanel] Error loading ${platform} messages:`, err);
        toast({
          title: "Error",
          description: `Failed to load messages from ${platform}.`,
          variant: "destructive",
        });
      } finally {
        if (!aborted) {
          setLoading(false);
        }
      }
    }

    loadMessages();
    return () => { aborted = true; };
  }, [conversationId, platform, activeBrandId]);

  // Mark conversation as read mutation (using new conversation API)
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
      console.error("[ConversationPanel] Error marking conversation as read:", error);
    },
  });

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (!conversationId || !activeBrandId) {
      return;
    }
    markAsReadMutation.mutate(conversationId);
  }, [conversationId, activeBrandId]); // markAsReadMutation is stable from useMutation

  // Socket.IO: Listen for new messages in real-time for this conversation
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
          content: message.textContent || "(no message)",
          attachments: message.attachments || [],
          direction: "inbound",
          status: "read",
          createdAt: message.timestamp || new Date().toISOString(),
        };

        // Add the new message to the conversation
        setMessages((prev) => {
          // Check if message already exists (prevent duplicates)
          const exists = prev.some((m) => m.id === formattedMessage.id);
          if (exists) return prev;

          // Update 24h window logic on new inbound message
          if (isMetaConversation && formattedMessage.direction === "inbound") {
            setCanSendFacebookMessage(true);
          }

          return [...prev, formattedMessage];
        });
      }
    },
    [platform, conversationId, isMetaConversation, activeBrandId],
  );

  useNewMessageListener(handleNewMessage);

  // Mutation to update conversation flag
  const updateFlagMutation = useMutation({
    mutationFn: async (flag: "none" | "important" | "archived") => {
      if (!activeBrandId) throw new Error("No active brand");

      const res = await fetch(
        `/api/conversations/${conversationId}/flag?brandId=${activeBrandId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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

  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      attachmentUrl?: string;
      attachmentType?: string;
    }) => {
      if (!activeBrandId) throw new Error("No active brand");

      // Use metaConversationId if available (for Facebook)
      const targetConversationId = metaConversationId || conversationId;
      const res = await fetch(
        `/api/${platform}/conversations/${targetConversationId}/messages?brandId=${activeBrandId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            content: data.content,
            conversationId: conversationId,
            attachmentUrl: data.attachmentUrl,
            attachmentType: data.attachmentType,
          }),
        },
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error sending message");

      return result;
    },

    onMutate: async (data) => {
      // Add optimistic local message
      setMessages((prev: any) => [
        ...prev,
        {
          id: "temp_" + Date.now(),
          conversationId,
          senderId: "me",
          senderName: "You",
          content: data.content,
          direction: "outbound",
          status: "sent",
          createdAt: new Date().toISOString(),
          attachments: [],
        },
      ] as any);
    },

    onSuccess: () => {
      setMessageText("");
      setAttachments([]);
      toast({
        title: "Message sent",
        description: `Message sent to ${platform} successfully.`,
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", activeBrandId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", conversationId, "messages"],
      });
    },

    onError: (error: Error) => {
      // Optionally handle 24h restriction error specifically here
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  useEffect(() => {
    setContactProfilePicture(null);
    if (contactProfilePictureProp) {
      setContactProfilePicture(contactProfilePictureProp);
    }
    setConversationFlag("none");
    setCanSendFacebookMessage(true); // Reset 24h restriction until new messages load
    setMessages([]);
    setMessageText("");
    setAttachments([]);
  }, [conversationId, contactProfilePictureProp]);
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() && attachments.length === 0) return;

    // If there are attachments, upload them first then send URLs
    let attachmentUrl: string | undefined;
    let attachmentType: string | undefined;

    if (attachments.length > 0) {
      const file = attachments[0]; // Send first attachment
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (cloudName && uploadPreset) {
        try {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("upload_preset", uploadPreset);
          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
            { method: "POST", body: fd },
          );
          const uploadData = await uploadRes.json();
          if (uploadData.secure_url) {
            attachmentUrl = uploadData.secure_url;
            attachmentType = file.type.startsWith("image/")
              ? "image"
              : file.type.startsWith("audio/")
                ? "audio"
                : file.type.startsWith("video/")
                  ? "video"
                  : "file";
          }
        } catch (err) {
          console.error("Attachment upload failed:", err);
        }
      }
    }

    sendMessageMutation.mutate({
      content: messageText || (attachmentUrl ? "" : ""),
      attachmentUrl,
      attachmentType,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Also enforce the restriction for the Enter key
      if (!isMetaConversation || canSendFacebookMessage) {
        handleSendMessage();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File(
          [audioBlob],
          `voice-note-${Date.now()}.webm`,
          { type: "audio/webm" },
        );
        setAttachments((prev) => [...prev, audioFile]);
        setAudioChunks([]);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("[ConversationPanel] Error accessing microphone:", err);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      setAudioChunks([]);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isSafeUrl = (url: string) => {
    try { return ['http:', 'https:'].includes(new URL(url).protocol); }
    catch { return false; }
  };

  const PlatformIcon =
    platform && platformIcons[platform as keyof typeof platformIcons];
  const platformBg =
    platform && platformColors[platform as keyof typeof platformColors];
  const displayName = (participantName && participantName.trim()) || "Unknown";
  const displayPlatform = platform
    ? platformLabels[platform] ||
      platform.charAt(0).toUpperCase() + platform.slice(1)
    : "Facebook";

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
                {/* Only show image if there is a valid URL */}
                {contactProfilePicture && contactProfilePicture !== "" && (
                  <AvatarImage
                    referrerPolicy="no-referrer"
                    src={contactProfilePicture}
                    alt={displayName}
                  />
                )}
                {/* Fallback must always be present */}
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
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
              <p className="text-xs text-gray-500">{displayPlatform}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
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

        {/* Messages */}
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
              <p className="text-gray-500 text-sm">No messages yet</p>
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
                  <Avatar className="h-8 w-8 flex-shrink-0" aria-label={displayName || "Contact"}>
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
                      {message.attachments?.length > 0 && (
                        <div className="space-y-2">
                          {message.attachments.map((att) => {
                            if (att.type === "image") {
                              return isSafeUrl(att.url) ? (
                                <img
                                  key={att.id}
                                  src={att.url}
                                  alt={att.fileName || "Image attachment"}
                                  className="rounded-lg max-w-xs border cursor-pointer hover:opacity-90"
                                  loading="lazy"
                                  onClick={() => setPreviewImage(att.url)}
                                />
                              ) : null;
                            }

                            if (att.type === "video") {
                              return isSafeUrl(att.url) ? (
                                <video
                                  key={att.id}
                                  controls
                                  className="rounded-lg max-w-xs border"
                                >
                                  <source
                                    src={att.url}
                                    type={att.mimeType || "video/mp4"}
                                  />
                                </video>
                              ) : null;
                            }

                            if (att.type === "audio") {
                              return isSafeUrl(att.url) ? (
                                <div
                                  key={att.id}
                                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 max-w-xs"
                                >
                                  <audio
                                    controls
                                    className="w-full"
                                    preload="metadata"
                                  >
                                    <source
                                      src={att.url}
                                      type={att.mimeType || "audio/mpeg"}
                                    />
                                    Your browser does not support the audio
                                    element.
                                  </audio>
                                </div>
                              ) : null;
                            }

                            // file
                            return (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                              >
                                <Paperclip className="h-3 w-3 inline-block mr-1" />{att.fileName || "Attachment"}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 mt-1 px-2">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
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

        {/* Message Composer */}
        <div className="bg-white border-t border-gray-200 p-4">
          {/* 24-hour restriction alert */}
          {isMetaConversation && !canSendFacebookMessage && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                <b>24h restriction:</b> More than 24 hours have passed since the
                user's last message. Standard reply messages can only be sent
                within this window.
              </p>
            </div>
          )}

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="relative group flex items-center gap-2 p-2 bg-gray-100 rounded-lg max-w-xs"
                >
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  ) : file.type.startsWith("audio/") ? (
                    <Mic className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  ) : (
                    <FileIcon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                  )}
                  <span className="text-xs text-gray-700 truncate max-w-[150px]">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recording UI */}
          {isRecording && (
            <div className="mb-3 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-700">
                  Recording... {formatRecordingTime(recordingTime)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelRecording}
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700"
              >
                <StopCircle className="h-4 w-4 mr-1" />
                Stop
              </Button>
            </div>
          )}

          <div className="flex items-end space-x-2">
            {/* File attachment button */}
            <input
              id="dm-file-input"
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isMetaConversation && !canSendFacebookMessage}
            />

            <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  isMetaConversation && !canSendFacebookMessage
                    ? "Cannot reply (24h restriction)"
                    : "Type a message..."
                }
                className={cn(
                  "w-full bg-transparent border-none outline-none resize-none text-sm max-h-32",
                  isMetaConversation &&
                    !canSendFacebookMessage &&
                    "cursor-not-allowed text-gray-500",
                )}
                rows={1}
                disabled={
                  isRecording || (isMetaConversation && !canSendFacebookMessage)
                }
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              onClick={() => {
                const input = document.getElementById("dm-file-input") as HTMLInputElement;
                input?.click();
              }}
              disabled={isRecording || (isMetaConversation && !canSendFacebookMessage)}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            {!isRecording ? (
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                onClick={startRecording}
                disabled={isMetaConversation && !canSendFacebookMessage}
                title="Record voice"
              >
                <Mic className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 text-red-500 hover:text-red-700 animate-pulse"
                onClick={stopRecording}
                title="Stop recording"
              >
                <MicOff className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleSendMessage}
              disabled={
                (!messageText.trim() && attachments.length === 0) ||
                sendMessageMutation.isPending ||
                isRecording ||
                (isMetaConversation && !canSendFacebookMessage)
              }
              className="rounded-full flex-shrink-0"
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
              alt="Preview"
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
            {contactProfilePicture && contactProfilePicture !== "" ? (
              <AvatarImage
                referrerPolicy="no-referrer"
                src={contactProfilePicture}
                alt={displayName}
              />
            ) : null}
            <AvatarFallback className="text-2xl bg-gray-200 text-gray-600 font-bold">
              {displayName.charAt(0).toUpperCase()}
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
            <p className="text-sm text-gray-500">{displayPlatform}</p>
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
