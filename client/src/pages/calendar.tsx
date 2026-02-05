import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/contexts/BrandContext";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Wand2,
  Settings,
  Sparkles,
  Link2,
  Palette,
  CalendarDays,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
  CalendarCheck,
  Facebook,
  Instagram,
  RssIcon,
  AlertCircle,
  Check,
  ArrowRight,
} from "lucide-react";
import { SiWhatsapp, SiTiktok, SiFacebook, SiLinkedin } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
  isWithinInterval,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";
import PostingFrequencyModal from "@/components/PostingFrequencyModal";
import ImageEditorDialog from "@/components/ImageEditorDialog";
import { useImageEditorDialog } from "@/hooks/useImageEditorDialog";
import { apiRequest } from "@/lib/queryClient";

interface ContentPost {
  id: string;
  title: string;
  platform: string;
  scheduledFor: string;
  status:
    | "draft"
    | "scheduled"
    | "published"
    | "pending"
    | "accepted"
    | "rejected"
    | "skipped_auto_post_disabled";
  content: string;
  imageUrl?: string;
  source?: "manual" | "ai";
  hashtags?: string;
  scheduledPublishTime?: string;
  publishedAt?: string;
  createdAt?: string;
  dia?: string;
}

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  instagram_story: Instagram,
  instagram_reel: Instagram,
  whatsapp: SiWhatsapp,
  facebook: SiFacebook,
  tiktok: SiTiktok,
  linkedin: SiLinkedin,
};

const platformColors: Record<string, string> = {
  instagram:
    "bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100",
  instagram_story:
    "bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-100",
  instagram_reel:
    "bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100",
  whatsapp:
    "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100",
  facebook: "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100",
  tiktok: "bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200",
  linkedin: "bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100",
};

const platformIconColors: Record<string, string> = {
  instagram: "text-pink-500",
  instagram_story: "text-pink-400",
  instagram_reel: "text-purple-500",
  whatsapp: "text-green-500",
  facebook: "text-blue-600",
  tiktok: "text-gray-800",
  linkedin: "text-sky-600",
};

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-primary/10 text-primary",
  published: "bg-green-100 text-green-800",
};

export default function ContentCalendar() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { activeBrandId } = useBrand();
  const { isSpanish } = useLanguage();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [editPost, setEditPost] = useState<ContentPost | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showAutoPostConfirm, setShowAutoPostConfirm] = useState(false);
  const [imageEditorScheduledFor, setImageEditorScheduledFor] = useState<
    string | null
  >(null);

  const imageEditorDialog = useImageEditorDialog();
  const [isFrequencyModalOpen, setIsFrequencyModalOpen] = useState(false);
  const [postingSchedule, setPostingSchedule] = useState<Array<{
    platform: string;
    postsPerWeek: number;
    selectedDays: string[];
  }> | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [suggestedPosts, setSuggestedPosts] = useState<ContentPost[]>([]);
  const [showGeneratingLoader, setShowGeneratingLoader] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [showPaymentRequiredModal, setShowPaymentRequiredModal] =
    useState(false);
  const [, setLocation] = useLocation();
  const [aiPendingPosts, setAiPendingPosts] = useState<any[]>([]);
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Record<string, boolean>
  >({});

  // Query to fetch integrations for the brand
  const { data: integrations, isLoading: integrationsLoading } = useQuery<
    any[]
  >({
    queryKey: ["/api/integrations", activeBrandId],
    queryFn: async () => {
      if (!activeBrandId) return [];
      const res = await fetch(`/api/integrations?brandId=${activeBrandId}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!activeBrandId,
    staleTime: 60000,
  });

  // Query to fetch brand design
  const { data: brandDesign, isLoading: brandDesignLoading } = useQuery<any>({
    queryKey: ["/api/brand-design", activeBrandId],
    queryFn: async () => {
      if (!activeBrandId) return null;
      const res = await fetch(`/api/brand-design?brandId=${activeBrandId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!activeBrandId,
    staleTime: 60000,
  });

  // Query to fetch posting frequency
  const { data: postingFrequencyData, isLoading: postingFrequencyLoading } =
    useQuery<any[]>({
      queryKey: ["/api/posting-frequency", activeBrandId],
      queryFn: async () => {
        if (!activeBrandId) return [];
        const res = await fetch(
          `/api/posting-frequency?brandId=${activeBrandId}`,
          {
            credentials: "include",
          },
        );
        if (!res.ok) return [];
        return res.json();
      },
      enabled: !!activeBrandId,
      staleTime: 60000,
    });

  // Query to fetch brand data (for autoPostEnabled)
  const { data: brandData } = useQuery<any>({
    queryKey: ["/api/brands", activeBrandId],
    queryFn: async () => {
      if (!activeBrandId) return null;
      const res = await fetch(`/api/brands/${activeBrandId}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!activeBrandId,
    staleTime: 60000,
  });

  // Query to fetch brand assets for image editor
  const { data: brandAssets } = useQuery<any[]>({
    queryKey: [
      `/api/brand-assets?brandDesignId=${brandDesign?.id}&brandId=${activeBrandId}`,
    ],
    enabled: !!brandDesign?.id,
    staleTime: 60000,
  });

  // Initialize isPaused from brand data
  useEffect(() => {
    if (brandData?.autoPostEnabled !== undefined) {
      setIsPaused(!brandData.autoPostEnabled);
    }
  }, [brandData?.autoPostEnabled]);

  // Mutation to update auto-post setting
  const autoPostMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest(
        "PATCH",
        `/api/brands/${activeBrandId}/auto-post`,
        { enabled },
      );
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/brands", activeBrandId],
      });
      const newIsPaused = !data.autoPostEnabled;
      setIsPaused(newIsPaused);
      toast({
        title: newIsPaused ? "Posting Paused" : "Posting Enabled",
        description: newIsPaused
          ? "Automatic posting has been paused. Scheduled posts will not be published."
          : "Automatic posting has been enabled. Scheduled posts will be published automatically.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update auto-post setting",
        variant: "destructive",
      });
    },
  });

  // Computed validation states
  const hasSocialIntegrations = useMemo(() => {
    if (!integrations) return false;
    return integrations.some(
      (int: any) =>
        int.provider === "instagram" ||
        int.provider === "instagram_direct" ||
        int.provider === "facebook",
    );
  }, [integrations]);

  const connectedPlatforms = useMemo(() => {
    if (!integrations) return [];
    return integrations
      .filter(
        (int: any) =>
          int.provider === "instagram" ||
          int.provider === "instagram_direct" ||
          int.provider === "facebook",
      )
      .map((int: any) => int.provider);
  }, [integrations]);

  const hasBrandDesign = useMemo(() => {
    return !!brandDesign && brandDesign.id;
  }, [brandDesign]);

  const hasPostingFrequency = useMemo(() => {
    return postingFrequencyData && postingFrequencyData.length > 0;
  }, [postingFrequencyData]);

  // Check if AI posts exist for current month
  const currentMonthAiPosts = useMemo(() => {
    if (!aiPendingPosts || aiPendingPosts.length === 0) return [];
    return aiPendingPosts.filter((post: any) => {
      if (!post.dia) return false;
      const postDate = new Date(post.dia);
      return isSameMonth(postDate, currentDate);
    });
  }, [aiPendingPosts, currentDate]);

  const hasAiPostsForCurrentMonth = currentMonthAiPosts.length > 0;

  // Check if viewing a past month (cannot generate AI content for past months)
  const isPastMonth = useMemo(() => {
    const now = new Date();
    const currentViewYear = currentDate.getFullYear();
    const currentViewMonth = currentDate.getMonth();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();

    return (
      currentViewYear < nowYear ||
      (currentViewYear === nowYear && currentViewMonth < nowMonth)
    );
  }, [currentDate]);

  // Helper function to convert day name to dates in current month
  const getDatesForDayOfWeek = (dayName: string): Date[] => {
    const dayMap: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const targetDay = dayMap[dayName.toLowerCase()];
    if (targetDay === undefined) return [];

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const dates: Date[] = [];

    let current = new Date(monthStart);
    while (current <= monthEnd) {
      if (current.getDay() === targetDay) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  // Helper function to convert AI generated posts to ContentPost[]
  const convertAiPostsToContentPosts = (aiPosts: any[]): ContentPost[] => {
    const posts: ContentPost[] = [];

    aiPosts.forEach((post) => {
      // Use scheduledPublishTime if available, otherwise parse from dia field
      let scheduledDate: Date;

      if (post.scheduledPublishTime) {
        // Use the exact scheduled publish time
        scheduledDate = new Date(post.scheduledPublishTime);
      } else if (post.dia && post.dia.includes("-")) {
        // ISO date format
        scheduledDate = new Date(post.dia + "T10:00:00");
      } else {
        // Day name format - get first occurrence in current month
        const datesForDay = getDatesForDayOfWeek(post.dia || "monday");
        scheduledDate = datesForDay[0] || new Date();
        scheduledDate.setHours(10, 0, 0, 0);
      }

      posts.push({
        id: post.id,
        title: post.titulo,
        platform: post.platform,
        scheduledFor: scheduledDate.toISOString(),
        status: post.status || "pending",
        content: post.content,
        imageUrl: post.imageUrl,
        source: "ai",
        hashtags: post.hashtags,
        scheduledPublishTime: post.scheduledPublishTime || undefined,
        publishedAt: post.publishedAt || undefined,
        createdAt: post.createdAt || undefined,
        dia: post.dia || undefined,
      });
    });

    return posts;
  };

  // Fetch AI generated posts from database
  const fetchAiGeneratedPosts = async (): Promise<ContentPost[]> => {
    if (!activeBrandId) return [];

    try {
      const response = await fetch(`/api/ai-generated-posts/${activeBrandId}`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      const aiPosts = await response.json();
      return convertAiPostsToContentPosts(aiPosts);
    } catch (error) {
      console.error("Error fetching AI posts:", error);
      return [];
    }
  };

  // Query to load existing AI posts on page mount
  const existingAiPostsQuery = useQuery({
    queryKey: ["/api/ai-generated-posts", activeBrandId],
    queryFn: async () => {
      if (!activeBrandId) return [];
      const response = await fetch(`/api/ai-generated-posts/${activeBrandId}`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!activeBrandId,
  });

  // Query to check if there's an active job running for this brand
  const activeJobQuery = useQuery({
    queryKey: ["/api/post-generator/active", activeBrandId],
    queryFn: async () => {
      if (!activeBrandId) return { hasActiveJob: false, job: null };
      const response = await fetch(
        `/api/post-generator/active/${activeBrandId}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) return { hasActiveJob: false, job: null };
      return response.json();
    },
    enabled: !!activeBrandId,
    refetchInterval: 5000, // Check every 5 seconds to detect when job finishes
  });

  // If there's an active job found on page load, start tracking it
  // This effect only runs ONCE when a new active job is detected
  const activeJobId = activeJobQuery.data?.job?.id;
  useEffect(() => {
    if (
      activeJobQuery.data?.hasActiveJob &&
      activeJobQuery.data?.job &&
      !currentJobId
    ) {
      const job = activeJobQuery.data.job;
      if (job.status === "pending" || job.status === "processing") {
        setCurrentJobId(job.id);
        setShowGeneratingLoader(true);
      } else if (job.status === "payment_required") {
        // 💳 If page loads with payment_required status, show modal immediately
        setShowPaymentRequiredModal(true);
      }
    }
  }, [activeJobId]); // Only depend on job ID, not the entire data object

  // Check if there's an active job running (must be after activeJobQuery is defined)
  // Exclude payment_required status - job is not "actively generating" anymore
  const jobStatus = activeJobQuery.data?.job?.status;
  const isJobActuallyProcessing =
    activeJobQuery.data?.hasActiveJob &&
    jobStatus !== "payment_required" &&
    jobStatus !== "completed" &&
    jobStatus !== "failed";
  const hasActiveJob =
    isJobActuallyProcessing || showGeneratingLoader || !!currentJobId;

  // Check if AI posts are still loading
  const isLoadingAiPosts =
    existingAiPostsQuery.isLoading || existingAiPostsQuery.isFetching;

  // Determine if AI generation is available
  const canGenerateAiPosts =
    hasSocialIntegrations &&
    hasBrandDesign &&
    hasPostingFrequency &&
    !hasAiPostsForCurrentMonth &&
    !isPastMonth &&
    !hasActiveJob;

  // Get the reason why generation is disabled
  const getDisabledReason = (): string => {
    if (hasActiveJob)
      return "Content is being generated. You can close this page and come back later.";
    if (isPastMonth) return "Cannot generate AI content for past months";
    if (!hasSocialIntegrations)
      return "Connect Instagram or Facebook to generate AI posts";
    if (!hasBrandDesign) return "Create your brand design first";
    if (!hasPostingFrequency) return "Set your posting frequency first";
    if (hasAiPostsForCurrentMonth)
      return `Posts already exist for ${format(currentDate, "MMMM yyyy")}`;
    return "";
  };

  // Set aiPendingPosts when existing posts are loaded
  useEffect(() => {
    if (existingAiPostsQuery.data && existingAiPostsQuery.data.length > 0) {
      setAiPendingPosts(existingAiPostsQuery.data);
    }
  }, [existingAiPostsQuery.data]);

  // Polling query for job status
  const jobStatusQuery = useQuery({
    queryKey: ["/api/post-generator/jobs", currentJobId],
    queryFn: async () => {
      if (!currentJobId) return null;
      const response = await fetch(`/api/post-generator/jobs/${currentJobId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch job status");
      return response.json();
    },
    refetchInterval: currentJobId ? 2000 : false, // Poll every 2 seconds when jobId exists
    enabled: !!currentJobId,
  });

  // Effect to handle job completion
  useEffect(() => {
    const job = jobStatusQuery.data;
    if (!job || !currentJobId) return;

    if (job.status === "completed") {
      setShowGeneratingLoader(false);

      // Refetch posts from the database after job completion
      queryClient.invalidateQueries({
        queryKey: ["/api/ai-generated-posts", activeBrandId],
      });

      // Also fetch directly to show toast with count
      fetchAiGeneratedPosts().then((newPosts) => {
        setSuggestedPosts(newPosts);
        setAiSuggestions(job);

        toast({
          title: `✨ AI Generated ${newPosts.length} Suggestions!`,
          description: `${newPosts.length} posts ready for your approval across ${new Set(newPosts.map((p) => p.platform)).size} platforms.`,
        });
      });

      setCurrentJobId(null); // Stop polling
    } else if (job.status === "payment_required") {
      // 💳 Payment required - user ran out of free images during generation
      setShowGeneratingLoader(false);
      setShowPaymentRequiredModal(true);

      // Refetch any posts that were generated before hitting the limit
      queryClient.invalidateQueries({
        queryKey: ["/api/ai-generated-posts", activeBrandId],
      });

      const result = job.result as {
        postsGenerated?: number;
        totalPlanned?: number;
      } | null;
      const generatedCount = result?.postsGenerated || 0;
      const totalPlanned = result?.totalPlanned || 0;

      if (generatedCount > 0) {
        toast({
          title: isSpanish ? "⚠️ Generación Pausada" : "⚠️ Generation Paused",
          description: isSpanish
            ? `Se generaron ${generatedCount} de ${totalPlanned} imágenes. Agrega un método de pago para continuar.`
            : `Generated ${generatedCount} of ${totalPlanned} images. Add a payment method to continue.`,
          variant: "destructive",
        });
      }

      setCurrentJobId(null); // Stop polling
    } else if (job.status === "failed") {
      setShowGeneratingLoader(false);
      toast({
        title: "Generation Failed",
        description: job.error || "Failed to generate post suggestions",
        variant: "destructive",
      });
      setCurrentJobId(null);
    }
  }, [jobStatusQuery.data, currentJobId, activeBrandId]);

  // Mutation to update AI post status (single post)
  const updatePostStatusMutation = useMutation({
    mutationFn: async ({
      postId,
      status,
      scheduledPublishTime,
    }: {
      postId: string;
      status: "accepted" | "rejected" | "pending";
      scheduledPublishTime?: string;
    }) => {
      const response = await fetch(`/api/ai-posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status,
          brandId: activeBrandId,
          scheduledPublishTime,
        }),
      });
      if (!response.ok) throw new Error("Failed to update post status");
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Immediately update local state for instant UI feedback
      setAiPendingPosts((prev) =>
        prev.map((post) =>
          post.id === variables.postId
            ? { ...post, status: variables.status }
            : post,
        ),
      );
      // Also update editPost if it's the same post
      setEditPost((prev) =>
        prev && prev.id === variables.postId
          ? { ...prev, status: variables.status }
          : prev,
      );
      // Invalidate queries for consistency
      queryClient.invalidateQueries({ queryKey: ["/api/ai-posts"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/ai-generated-posts", activeBrandId],
      });
    },
  });

  // Mutation to bulk update AI post status (multiple posts)
  const bulkUpdatePostStatusMutation = useMutation({
    mutationFn: async ({
      postIds,
      status,
    }: {
      postIds: string[];
      status: "accepted" | "rejected" | "pending";
    }) => {
      const response = await fetch(`/api/ai-posts/bulk-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postIds, status, brandId: activeBrandId }),
      });
      if (!response.ok) throw new Error("Failed to bulk update post status");
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Immediately update local state for instant UI feedback
      setAiPendingPosts((prev) =>
        prev.map((post) =>
          variables.postIds.includes(post.id)
            ? { ...post, status: variables.status }
            : post,
        ),
      );
      // Invalidate queries for consistency
      queryClient.invalidateQueries({ queryKey: ["/api/ai-posts"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/ai-generated-posts", activeBrandId],
      });
      toast({
        title:
          variables.status === "accepted" ? "Posts Approved" : "Posts Rejected",
        description: `${data.updatedCount} post(s) have been ${variables.status}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update posts",
        variant: "destructive",
      });
    },
  });

  // AI Post Generator Mutation
  const generatePostsMutation = useMutation({
    mutationFn: async () => {
      if (!activeBrandId) {
        throw new Error("No brand selected");
      }

      // Send the month and year that the user is currently viewing
      const targetMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      const targetYear = currentDate.getFullYear();

      const response = await fetch(`/api/post-generator/${activeBrandId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ month: targetMonth, year: targetYear }),
      });

      // Check for 402 status FIRST (before parsing JSON)
      if (response.status === 402) {
        throw new Error("PAYMENT_REQUIRED");
      }

      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Error processing server response");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to start post generation");
      }

      return data;
    },
    onMutate: () => {
      setShowGeneratingLoader(true);
    },
    onSuccess: (data) => {
      // Start polling with the jobId
      if (data.jobId) {
        setCurrentJobId(data.jobId);
        console.log("Job started with ID:", data.jobId);
      }
    },
    onError: (error: any) => {
      setShowGeneratingLoader(false);

      // Check if it's a payment required error
      if (error.message === "PAYMENT_REQUIRED") {
        setShowPaymentRequiredModal(true);
        return;
      }

      toast({
        title: "Generation Failed",
        description: error.message || "Failed to start post generation",
        variant: "destructive",
      });
    },
  });

  // Mutation to upload edited image and accept post
  const uploadEditedImageMutation = useMutation({
    mutationFn: async ({
      postId,
      imageDataUrl,
      scheduledFor,
    }: {
      postId: string;
      imageDataUrl: string;
      scheduledFor: string;
    }) => {
      // First upload the image to server (which will upload to Cloudinary)
      const uploadRes = await apiRequest("POST", "/api/upload-edited-image", {
        postId,
        imageDataUrl,
      });
      if (!uploadRes.ok) {
        throw new Error("Failed to upload edited image");
      }
      const uploadData = await uploadRes.json();

      // Convert local time to UTC ISO string for scheduling
      const localDate = new Date(scheduledFor);
      const scheduledPublishTime = localDate.toISOString();

      // Then update the post status to accepted with scheduling
      const statusRes = await apiRequest(
        "PATCH",
        `/api/ai-generated-posts/${postId}/status`,
        {
          status: "accepted",
          imageUrl: uploadData.imageUrl,
          scheduledPublishTime,
        },
      );
      if (!statusRes.ok) {
        throw new Error("Failed to update post status");
      }
      return statusRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/ai-generated-posts", activeBrandId],
      });
      toast({
        title: "Post Approved",
        description: "The post has been edited and approved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save edited image",
        variant: "destructive",
      });
    },
  });

  // Open image editor before accepting a post
  const handleEditBeforeAccept = (post: ContentPost) => {
    if (post.imageUrl) {
      setImageEditorScheduledFor(post.scheduledFor);
      imageEditorDialog.open({ id: post.id, imageUrl: post.imageUrl });
    } else {
      // No image, just accept directly
      handleUpdatePostStatus(post.id, "accepted");
    }
  };

  // Save edited image and accept post
  const handleSaveEditedImage = async (dataUrl: string) => {
    if (!imageEditorDialog.post || !imageEditorScheduledFor) return;
    try {
      await uploadEditedImageMutation.mutateAsync({
        postId: imageEditorDialog.post.id,
        imageDataUrl: dataUrl,
        scheduledFor: imageEditorScheduledFor,
      });
      imageEditorDialog.saveEdit(dataUrl);
      imageEditorDialog.close();
      setImageEditorScheduledFor(null);
    } catch (error) {
      // Error is handled by mutation onError, don't close dialog
    }
  };

  // Skip editing and accept as-is
  const handleAcceptWithoutEdit = () => {
    if (!imageEditorDialog.post || !imageEditorScheduledFor) return;
    const localDate = new Date(imageEditorScheduledFor);
    updatePostStatusMutation.mutate({
      postId: imageEditorDialog.post.id,
      status: "accepted",
      scheduledPublishTime: localDate.toISOString(),
    });
    imageEditorDialog.close();
    setImageEditorScheduledFor(null);
  };

  const handleToggle = () => {
    setShowAutoPostConfirm(true);
  };

  const confirmAutoPostToggle = () => {
    const newEnabled = isPaused; // If paused, we're enabling; if not paused, we're disabling
    autoPostMutation.mutate(newEnabled);
    setShowAutoPostConfirm(false);
  };

  // Convert AI posts to ContentPost format
  const aiContentPosts = useMemo(() => {
    if (!aiPendingPosts || aiPendingPosts.length === 0) return [];
    return convertAiPostsToContentPosts(aiPendingPosts);
  }, [aiPendingPosts, currentDate]);

  // All posts from database only
  const allPosts = useMemo(() => {
    return aiContentPosts;
  }, [aiContentPosts]);

  // Calculate this week's stats from real data
  const thisWeekStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 }); // Saturday

    const thisWeekPosts = allPosts.filter((post) => {
      const postDate = new Date(post.scheduledFor);
      return isWithinInterval(postDate, { start: weekStart, end: weekEnd });
    });

    const pending = thisWeekPosts.filter((p) => p.status === "pending").length;
    const accepted = thisWeekPosts.filter(
      (p) => p.status === "accepted",
    ).length;
    const published = thisWeekPosts.filter(
      (p) => p.status === "published",
    ).length;
    const rejected = thisWeekPosts.filter(
      (p) => p.status === "rejected",
    ).length;
    const total = thisWeekPosts.length;

    return { pending, accepted, published, rejected, total };
  }, [allPosts]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getPostsForDate = (date: Date) =>
    allPosts.filter((post) => isSameDay(new Date(post.scheduledFor), date));

  const handleDateClick = (date: Date) => {
    setSelectedDate(
      selectedDate && isSameDay(selectedDate, date) ? null : date,
    );
  };

  const handleOpenPost = (post: ContentPost) => {
    setSelectedPost(post);
    // Use scheduledPublishTime for scheduledFor if available
    const scheduledFor =
      post.scheduledPublishTime ||
      post.scheduledFor ||
      post.createdAt ||
      new Date().toISOString();
    setEditPost({ ...post, scheduledFor }); // clone to edit
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setEditPost((prev) => (prev ? { ...prev, imageUrl: url } : prev));
    }
  };

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  // Get AI posts for the current month
  const getAiPostsForMonth = () => {
    return aiPendingPosts.filter((post) => {
      // Use scheduledPublishTime if available, otherwise fall back to createdAt
      const postDate = new Date(post.scheduledPublishTime || post.createdAt);
      return isSameMonth(postDate, currentDate);
    });
  };

  // Check if there are pending posts for the current month
  const hasPendingPostsForMonth = useMemo(() => {
    const monthPosts = getAiPostsForMonth();
    return monthPosts.some((post) => post.status === "pending");
  }, [aiPendingPosts, currentDate]);

  // Get AI posts for the selected day
  const getAiPostsForDay = (date: Date) => {
    return aiPendingPosts.filter((post) => {
      // If post has scheduledPublishTime, use that for exact date matching
      if (post.scheduledPublishTime) {
        const scheduledDate = new Date(post.scheduledPublishTime);
        return isSameDay(scheduledDate, date);
      }
      // Otherwise fall back to matching by day name within the month
      const dayName = format(date, "EEEE").toLowerCase();
      return (
        post.dia?.toLowerCase() === dayName &&
        isSameMonth(new Date(post.createdAt), currentDate)
      );
    });
  };

  // 🔹 Bulk approve/reject for month
  const handleApproveMonth = (status: "accepted" | "rejected" = "accepted") => {
    const monthPosts = getAiPostsForMonth();
    const pendingPosts = monthPosts.filter((p) => p.status === "pending");

    if (pendingPosts.length === 0) {
      toast({
        title: "No pending posts",
        description: "There are no pending posts to update for this month.",
      });
      return;
    }

    const postIds = pendingPosts.map((p) => p.id);
    bulkUpdatePostStatusMutation.mutate({ postIds, status });
  };

  // 🔹 Bulk approve/reject for day
  const handleApproveDay = (status: "accepted" | "rejected" = "accepted") => {
    if (!selectedDate) return;

    const dayPosts = getAiPostsForDay(selectedDate);
    const pendingPosts = dayPosts.filter((p) => p.status === "pending");

    if (pendingPosts.length === 0) {
      toast({
        title: "No pending posts",
        description: "There are no pending posts to update for this day.",
      });
      return;
    }

    const postIds = pendingPosts.map((p) => p.id);
    bulkUpdatePostStatusMutation.mutate({ postIds, status });
  };

  // Handle single post status update
  const handleUpdatePostStatus = (
    postId: string,
    status: "accepted" | "rejected",
  ) => {
    updatePostStatusMutation.mutate(
      { postId, status },
      {
        onSuccess: () => {
          toast({
            title: status === "accepted" ? "Post Approved" : "Post Rejected",
            description: `The post has been ${status}.`,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Update Failed",
            description: error.message || "Failed to update post status",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleSavePostingSchedule = (
    schedule: Array<{
      platform: string;
      postsPerWeek: number;
      selectedDays: string[];
    }>,
  ) => {
    setPostingSchedule(schedule);
    // Here you could also save to backend API if needed
    console.log("Posting schedule saved:", schedule);
  };

  return (
    <TooltipProvider>
      {/* Payment Required Modal - Large and prominent */}
      <Dialog
        open={showPaymentRequiredModal}
        onOpenChange={setShowPaymentRequiredModal}
      >
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-white" />
              </div>
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-center text-white">
                {isSpanish
                  ? "¡Tus Créditos Gratuitos Se Agotaron!"
                  : "Your Free Credits Are Used Up!"}
              </DialogTitle>
              <DialogDescription className="text-center text-white/90 text-lg mt-3">
                {isSpanish
                  ? "Has utilizado tus 10 imágenes gratuitas. ¡Pero no te preocupes! Puedes continuar creando contenido increíble."
                  : "You've used your 10 free images. But don't worry! You can continue creating amazing content."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Pricing info */}
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
              <div className="text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  {isSpanish ? "Precio por imagen" : "Price per image"}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl font-bold text-primary">$0.12</span>
                  <span className="text-xl text-muted-foreground">USD</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {isSpanish
                    ? "Los cargos se procesan automáticamente cada 2 días"
                    : "Charges are processed automatically every 2 days"}
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-base">
                  {isSpanish
                    ? "Imágenes de alta calidad generadas con IA"
                    : "High-quality AI-generated images"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-base">
                  {isSpanish
                    ? "Contenido personalizado para tu marca"
                    : "Personalized content for your brand"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-base">
                  {isSpanish
                    ? "Cancela cuando quieras, sin compromisos"
                    : "Cancel anytime, no commitments"}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                size="lg"
                onClick={() => {
                  setShowPaymentRequiredModal(false);
                  setLocation("/settings?tab=payment");
                }}
                className="w-full text-lg py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                {isSpanish ? "Agregar Método de Pago" : "Add Payment Method"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setShowPaymentRequiredModal(false)}
                className="w-full text-muted-foreground"
              >
                {isSpanish ? "Quizás más tarde" : "Maybe later"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <div className="flex flex-col w-0 flex-1 overflow-hidden">
            <main className="flex-1 relative overflow-y-auto focus:outline-none">
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                  {/* Alert Banners for Missing Requirements */}
                  <div className="space-y-3 mb-6">
                    {/* No integrations banner */}
                    {!integrationsLoading && !hasSocialIntegrations && (
                      <Alert className="border-amber-200 bg-amber-50">
                        <Link2 className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">
                          {isSpanish
                            ? "Conecta tus redes sociales"
                            : "Connect your social accounts"}
                        </AlertTitle>
                        <AlertDescription className="text-amber-700">
                          {isSpanish
                            ? "Para generar posts con AI, conecta primero tu cuenta de instagram o facebook"
                            : "To generate AI posts, connect your Instagram or Facebook account first."}
                          <Link href="/integrations">
                            <Button
                              variant="link"
                              className="text-amber-800 font-semibold p-0 h-auto ml-1"
                              data-testid="link-connect-integrations"
                            >
                              {isSpanish ? "Conectar ahora →" : "Connect now →"}
                            </Button>
                          </Link>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* No brand design banner */}
                    {!brandDesignLoading &&
                      hasSocialIntegrations &&
                      !hasBrandDesign && (
                        <Alert className="border-purple-200 bg-purple-50">
                          <Palette className="h-4 w-4 text-purple-600" />
                          <AlertTitle className="text-purple-800">
                            Create your brand design
                          </AlertTitle>
                          <AlertDescription className="text-purple-700">
                            Define your brand colors, fonts, and style to enable
                            AI post generation.
                            <Link href="/brand-studio">
                              <Button
                                variant="link"
                                className="text-purple-800 font-semibold p-0 h-auto ml-1"
                                data-testid="link-brand-studio"
                              >
                                Go to Brand Studio →
                              </Button>
                            </Link>
                          </AlertDescription>
                        </Alert>
                      )}

                    {/* No posting frequency banner */}
                    {!postingFrequencyLoading &&
                      hasSocialIntegrations &&
                      hasBrandDesign &&
                      !hasPostingFrequency && (
                        <Alert className="border-blue-200 bg-blue-50">
                          <CalendarDays className="h-4 w-4 text-blue-600" />
                          <AlertTitle className="text-blue-800">
                            Set your posting frequency
                          </AlertTitle>
                          <AlertDescription className="text-blue-700">
                            Configure how often you want to post on each
                            platform to generate the right amount of content.
                            <Button
                              variant="link"
                              className="text-blue-800 font-semibold p-0 h-auto ml-1"
                              onClick={() => setIsFrequencyModalOpen(true)}
                              data-testid="link-set-frequency"
                            >
                              Set frequency →
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}

                    {/* Posts already exist for month */}
                    {hasAiPostsForCurrentMonth && (
                      <Alert className="border-purple-200 bg-purple-50">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <AlertTitle className="text-purple-800">
                          {isSpanish
                            ? `Posts de IA listos para ${format(currentDate, "MMMM yyyy")}`
                            : `AI posts ready for ${format(currentDate, "MMMM yyyy")}`}
                        </AlertTitle>
                        <AlertDescription className="text-purple-700">
                          {isSpanish
                            ? `Tienes ${currentMonthAiPosts.length} posts generados por la IA para este mes. Revísalos en el calendario de abajo.`
                            : `You have ${currentMonthAiPosts.length} AI-generated posts for this month. Review them in the calendar below.`}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Consolidated Control Panel */}
                  <Card className="shadow-sm border mb-6">
                    <CardContent className="py-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* This Week Summary */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarDays className="h-5 w-5 text-gray-500" />
                            <span className="font-semibold text-gray-800">
                              {isSpanish ? "Esta Semana" : "This Week"}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              {thisWeekStats.total} posts
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                              <span className="text-gray-600">
                                {thisWeekStats.pending}{" "}
                                {isSpanish ? "pendientes" : "pending"}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              <span className="text-gray-600">
                                {thisWeekStats.accepted}{" "}
                                {isSpanish ? "aceptados" : "accepted"}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              <span className="text-gray-600">
                                {thisWeekStats.published}{" "}
                                {isSpanish ? "publicados" : "published"}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap items-center gap-4">
                          {/* Edit Frequency */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsFrequencyModalOpen(true)}
                            className={
                              !hasPostingFrequency
                                ? "border-blue-300 text-blue-700 hover:bg-blue-50"
                                : ""
                            }
                            data-testid="button-set-posting-frequency-panel"
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            {hasPostingFrequency
                              ? isSpanish
                                ? "Editar Frecuencia"
                                : "Edit Frequency"
                              : isSpanish
                                ? "Establecer Frecuencia"
                                : "Set Frequency"}
                          </Button>

                          {/* Auto-posting Toggle */}
                          <div className="flex items-center gap-3">
                            <div
                              onClick={handleToggle}
                              role="switch"
                              aria-checked={!isPaused}
                              className={`relative flex w-14 h-7 rounded-full cursor-pointer border transition-all duration-300 ease-out ${
                                isPaused
                                  ? "bg-gray-100 border-gray-300"
                                  : "bg-green-50 border-green-300"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md border transform transition-all duration-300 ease-out ${
                                  isPaused
                                    ? "translate-x-0 border-gray-300"
                                    : "translate-x-7 border-green-300"
                                }`}
                              />
                            </div>
                            <span
                              className={`text-sm transition-colors duration-200 ${
                                isPaused
                                  ? "text-gray-500"
                                  : "text-green-700 font-medium"
                              }`}
                            >
                              {isPaused ? "Auto-post OFF" : "Auto-post ON"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 📅 Calendar */}
                    <div className="lg:col-span-2">
                      <Card className="shadow-sm border">
                        <CardHeader className="bg-white border-b">
                          <div className="flex flex-col gap-4">
                            {/* Header with title and navigation */}
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <CalendarIcon className="h-6 w-6 text-gray-500" />
                                <span className="text-gray-800">
                                  {format(currentDate, "MMMM yyyy")}
                                </span>
                              </CardTitle>
                              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-white"
                                  onClick={() =>
                                    setCurrentDate(
                                      new Date(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth() - 1,
                                      ),
                                    )
                                  }
                                  data-testid="button-prev-month"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 hover:bg-white text-xs font-medium"
                                  onClick={() => setCurrentDate(new Date())}
                                  data-testid="button-today"
                                >
                                  {isSpanish ? "Hoy" : "Today"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-white"
                                  onClick={() =>
                                    setCurrentDate(
                                      new Date(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth() + 1,
                                      ),
                                    )
                                  }
                                  data-testid="button-next-month"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Action buttons row */}
                            <div className="flex flex-wrap items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="sm"
                                      variant={
                                        hasActiveJob || isLoadingAiPosts
                                          ? "outline"
                                          : canGenerateAiPosts
                                            ? "default"
                                            : "outline"
                                      }
                                      onClick={() =>
                                        generatePostsMutation.mutate()
                                      }
                                      disabled={
                                        generatePostsMutation.isPending ||
                                        !activeBrandId ||
                                        !canGenerateAiPosts ||
                                        hasActiveJob ||
                                        isLoadingAiPosts
                                      }
                                      className={
                                        hasActiveJob || isLoadingAiPosts
                                          ? "bg-purple-100 border-purple-300 text-purple-700"
                                          : canGenerateAiPosts
                                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                                            : "opacity-60 cursor-not-allowed"
                                      }
                                      data-testid="button-generate-ai-posts"
                                    >
                                      {isLoadingAiPosts ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                          Loading...
                                        </>
                                      ) : generatePostsMutation.isPending ||
                                        hasActiveJob ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                          {isSpanish
                                            ? "Generando..."
                                            : "Generating..."}
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-4 h-4 mr-1" />
                                          {isSpanish
                                            ? "Generar Posts con IA"
                                            : "Generate AI Posts"}
                                        </>
                                      )}
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {(!canGenerateAiPosts ||
                                  hasActiveJob ||
                                  isLoadingAiPosts) && (
                                  <TooltipContent>
                                    <p>
                                      {isLoadingAiPosts
                                        ? "Loading existing posts..."
                                        : getDisabledReason()}
                                    </p>
                                  </TooltipContent>
                                )}
                              </Tooltip>

                              {/* Only show Approve Month button if there are pending posts */}
                              {hasPendingPostsForMonth && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleApproveMonth("accepted")
                                        }
                                        disabled={
                                          isPastMonth ||
                                          bulkUpdatePostStatusMutation.isPending ||
                                          isLoadingAiPosts ||
                                          !hasPostingFrequency
                                        }
                                        className={
                                          isPastMonth || isLoadingAiPosts
                                            ? "opacity-60 cursor-not-allowed bg-gray-200"
                                            : "bg-gray-800 hover:bg-gray-900 text-white"
                                        }
                                        data-testid="button-approve-month"
                                      >
                                        {isLoadingAiPosts ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                            Loading...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            {isSpanish
                                              ? "Aprobar Mes"
                                              : "Approve Month"}
                                          </>
                                        )}
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {(isPastMonth || isLoadingAiPosts) && (
                                    <TooltipContent>
                                      <p>
                                        {isLoadingAiPosts
                                          ? "Loading posts..."
                                          : "Cannot approve past months"}
                                      </p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          {/* Week headers */}
                          <div className="grid grid-cols-7 gap-2 mb-4">
                            {[
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                            ].map((day) => (
                              <div
                                key={day}
                                className="text-center text-sm font-medium text-gray-500 py-2"
                              >
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Days */}
                          <div className="grid grid-cols-7 gap-2">
                            {daysInMonth.map((day) => {
                              const postsForDay = getPostsForDate(day);
                              const isSelected =
                                selectedDate && isSameDay(selectedDate, day);
                              return (
                                <div
                                  key={day.toISOString()}
                                  className={`p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors ${
                                    isToday(day)
                                      ? "bg-purple-50 border-purple-200"
                                      : "bg-white border-gray-200"
                                  } ${isSelected ? "ring-2 ring-gray-400" : ""}`}
                                  onClick={() => handleDateClick(day)}
                                >
                                  <div className="text-sm font-medium text-gray-900">
                                    {format(day, "d")}
                                  </div>
                                  <div className="mt-1 space-y-1">
                                    {postsForDay.slice(0, 2).map((post) => {
                                      const PlatformIcon =
                                        platformIcons[
                                          post.platform as keyof typeof platformIcons
                                        ];
                                      const isAiPost = post.source === "ai";
                                      const postStatus = post.status as
                                        | "pending"
                                        | "accepted"
                                        | "rejected"
                                        | "published"
                                        | "skipped_auto_post_disabled";

                                      const iconColor =
                                        platformIconColors[
                                          post.platform as keyof typeof platformIconColors
                                        ] || "text-gray-600";

                                      return (
                                        <div
                                          key={post.id}
                                          data-testid={`calendar-post-${post.id}`}
                                          className={`text-xs px-2 py-1.5 rounded-md truncate flex items-center gap-1.5 shadow-sm hover:shadow transition-shadow cursor-pointer ${platformColors[post.platform as keyof typeof platformColors]} ${postStatus === "rejected" ? "opacity-50" : ""}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenPost(post);
                                          }}
                                        >
                                          <PlatformIcon
                                            className={`inline w-3 h-3 flex-shrink-0 ${iconColor}`}
                                          />
                                          <span className="truncate font-medium text-gray-700">
                                            {post.title}
                                          </span>
                                          {isAiPost &&
                                            postStatus === "accepted" && (
                                              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                            )}

                                          {isAiPost &&
                                            postStatus === "published" && (
                                              <RssIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                                            )}
                                          {isAiPost &&
                                            postStatus === "pending" && (
                                              <Clock className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                            )}
                                          {isAiPost &&
                                            postStatus ===
                                              "skipped_auto_post_disabled" && (
                                              <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                                            )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 📊 Sidebar */}
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {selectedDate
                                ? format(selectedDate, "EEEE, MMMM d")
                                : isSpanish
                                  ? "Selecciona una fecha"
                                  : "Select a date"}
                            </CardTitle>
                          </div>
                          {/* ✅ Approve all posts for the day - only show if there are pending posts */}
                          {selectedDate &&
                            selectedDatePosts.length > 0 &&
                            selectedDatePosts.some(
                              (post) => post.status === "pending",
                            ) && (
                              <Button
                                size="sm"
                                className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                                onClick={() => handleApproveDay("accepted")}
                                disabled={
                                  bulkUpdatePostStatusMutation.isPending ||
                                  !hasPostingFrequency
                                }
                                data-testid="button-approve-day"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                Day
                              </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                          {selectedDatePosts.length > 0 ? (
                            <div className="space-y-4">
                              {selectedDatePosts.map((post) => {
                                const PlatformIcon =
                                  platformIcons[
                                    post.platform as keyof typeof platformIcons
                                  ];
                                const isImageLoading =
                                  imageLoadingStates[post.id] !== false;
                                const isAiPost = post.source === "ai";
                                const postStatus = post.status as
                                  | "pending"
                                  | "accepted"
                                  | "rejected"
                                  | "published"
                                  | "skipped_auto_post_disabled";

                                const statusConfig = {
                                  pending: {
                                    bg: "bg-yellow-100",
                                    text: "text-yellow-800",
                                    border: "border-yellow-200",
                                    icon: Clock,
                                    label: "Pending",
                                  },
                                  accepted: {
                                    bg: "bg-green-100",
                                    text: "text-green-800",
                                    border: "border-green-200",
                                    icon: CheckCircle,
                                    label: "Approved",
                                  },
                                  rejected: {
                                    bg: "bg-red-100",
                                    text: "text-red-800",
                                    border: "border-red-200",
                                    icon: XCircle,
                                    label: "Rejected",
                                  },
                                  published: {
                                    bg: "bg-green-100",
                                    text: "text-green-800",
                                    border: "border-green-200",
                                    icon: RssIcon,
                                    label: "Published",
                                  },
                                  skipped_auto_post_disabled: {
                                    bg: "bg-red-100",
                                    text: "text-red-800",
                                    border: "border-red-200",
                                    icon: XCircle,
                                    label: "Skipped",
                                  },
                                };

                                const currentStatus =
                                  statusConfig[postStatus] ||
                                  statusConfig.pending;
                                const StatusIcon = currentStatus.icon;

                                return (
                                  <div
                                    key={post.id}
                                    className={`border rounded-lg p-4 transition-all hover:shadow-md relative ${
                                      isAiPost
                                        ? postStatus === "accepted"
                                          ? "border-green-300 bg-gradient-to-br from-green-50/50 to-white"
                                          : postStatus === "rejected" ||
                                              postStatus ===
                                                "skipped_auto_post_disabled"
                                            ? "border-red-300 bg-gradient-to-br from-red-50/50 to-white opacity-60"
                                            : "border-purple-200 bg-gradient-to-br from-purple-50/50 to-white"
                                        : ""
                                    }`}
                                    data-testid={`post-preview-${post.id}`}
                                  >
                                    {/* Status Badge - Top Right Corner */}
                                    {isAiPost && (
                                      <div
                                        className={`absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded-full ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} border`}
                                        data-testid={`post-status-${post.id}`}
                                      >
                                        <StatusIcon className="w-3 h-3" />
                                        <span className="font-medium">
                                          {currentStatus.label}
                                        </span>
                                      </div>
                                    )}

                                    {/* AI Badge */}
                                    {isAiPost && (
                                      <div className="flex items-center gap-1 text-xs text-purple-600 mb-2">
                                        <Sparkles className="w-3 h-3" />
                                        <span className="font-medium">
                                          AI Generated
                                        </span>
                                      </div>
                                    )}

                                    {/* Image with loading state */}
                                    <div className="relative w-full h-32 mb-2 rounded overflow-hidden bg-gray-100">
                                      {isImageLoading && post.imageUrl && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <Skeleton className="w-full h-full" />
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                          </div>
                                        </div>
                                      )}
                                      {post.imageUrl ? (
                                        <img
                                          src={post.imageUrl}
                                          alt={post.title}
                                          className={`w-full h-full object-cover transition-opacity duration-300 ${isImageLoading ? "opacity-0" : "opacity-100"}`}
                                          onLoad={() =>
                                            setImageLoadingStates((prev) => ({
                                              ...prev,
                                              [post.id]: false,
                                            }))
                                          }
                                          onError={() =>
                                            setImageLoadingStates((prev) => ({
                                              ...prev,
                                              [post.id]: false,
                                            }))
                                          }
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                          <ImageIcon className="w-8 h-8 text-gray-300" />
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between mb-1">
                                      <p className="font-medium text-sm line-clamp-1">
                                        {post.title}
                                      </p>
                                      <div
                                        className={`flex items-center text-xs px-2 py-1 rounded flex-shrink-0 ml-2 ${platformColors[post.platform as keyof typeof platformColors]}`}
                                      >
                                        <PlatformIcon className="w-3 h-3 mr-1" />
                                        {post.platform.charAt(0).toUpperCase() +
                                          post.platform.slice(1)}
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {format(
                                        new Date(post.scheduledFor),
                                        "h:mm a",
                                      )}
                                    </p>
                                    <p className="text-sm text-gray-700 line-clamp-2">
                                      {post.content}
                                    </p>

                                    {/* Action buttons */}
                                    <div className="flex gap-2 mt-3">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => handleOpenPost(post)}
                                        data-testid={`button-view-post-${post.id}`}
                                      >
                                        <Eye className="w-3 h-3 mr-1" /> View
                                      </Button>
                                      {/*  <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setEditPost({ ...post })}
                                        data-testid={`button-edit-post-${post.id}`}
                                      >
                                        <Edit className="w-3 h-3 mr-1" /> Edit
                                      </Button> */}
                                    </div>

                                    {/* Individual Approve button for AI posts */}
                                    {isAiPost && postStatus === "pending" && (
                                      <div className="mt-2 pt-2 border-t border-gray-100">
                                        <Button
                                          size="sm"
                                          className="w-full bg-gray-800 hover:bg-gray-900 text-white"
                                          onClick={() =>
                                            handleUpdatePostStatus(
                                              post.id,
                                              "accepted",
                                            )
                                          }
                                          disabled={
                                            updatePostStatusMutation.isPending ||
                                            !hasPostingFrequency
                                          }
                                          data-testid={`button-approve-post-${post.id}`}
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                          Approve & Schedule
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-8">
                              {selectedDate
                                ? isSpanish
                                  ? "No hay posts para este día"
                                  : "No posts for this day"
                                : isSpanish
                                  ? "Selecciona una fecha para ver los posts"
                                  : "Select a date to view posts"}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Modal Meta Ads Style */}
        <Dialog
          open={!!selectedPost}
          onOpenChange={() => setSelectedPost(null)}
        >
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            {editPost && (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <DialogTitle className="text-lg font-semibold">
                          {isSpanish ? "Editar Publicación" : "Edit Post"}
                        </DialogTitle>
                        <p className="text-sm text-gray-500">
                          {isSpanish
                            ? "Vista previa y personaliza tu contenido"
                            : "Preview and customize your content"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mr-4">
                      {editPost.platform === "instagram" ||
                      editPost.platform === "instagram_direct" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium">
                          <Instagram className="w-4 h-4" /> Instagram
                        </span>
                      ) : editPost.platform === "facebook" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                          <Facebook className="w-4 h-4" /> Facebook
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium capitalize">
                          {editPost.platform}
                        </span>
                      )}
                      {/* Status badge next to platform */}
                      {editPost.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium border border-purple-200">
                          <Clock className="w-4 h-4" />{" "}
                          {isSpanish ? "Pendiente" : "Pending"}
                        </span>
                      )}
                      {editPost.status === "accepted" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium border border-green-200">
                          <CheckCircle className="w-4 h-4" />{" "}
                          {isSpanish ? "Aprobado" : "Approved"}
                        </span>
                      )}
                      {editPost.status === "published" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium border border-green-200">
                          <RssIcon className="w-4 h-4" />{" "}
                          {isSpanish ? "Publicado" : "Published"}
                        </span>
                      )}
                      {editPost.status === "skipped_auto_post_disabled" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium border border-red-200">
                          <XCircle className="w-4 h-4" /> Skipped (Auto-post
                          disabled)
                        </span>
                      )}
                      {editPost.status === "rejected" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium border border-red-200">
                          <XCircle className="w-4 h-4" />{" "}
                          {isSpanish ? "Rechazado" : "Rejected"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-5 gap-0">
                  {/* Live Preview - Left Side */}
                  <div className="col-span-2 bg-gray-50 p-6 border-r">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                      Live Preview
                    </p>
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
                      {/* Image */}
                      <div className="aspect-square relative bg-gray-100">
                        <img
                          src={editPost.imageUrl}
                          alt={editPost.title}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() =>
                            editPost.imageUrl &&
                            setFullscreenImage(editPost.imageUrl)
                          }
                          title="Click to view full size"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1 pointer-events-none">
                          <Eye className="w-3 h-3" />
                          Click to enlarge
                        </div>
                      </div>
                      {/* Content */}
                      <div className="p-4">
                        <p className="font-semibold text-gray-900 line-clamp-2">
                          {editPost.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-4">
                          {editPost.content}
                        </p>
                      </div>
                    </div>

                    {/* Schedule Badge */}
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border">
                      <CalendarCheck className="w-4 h-4 text-primary" />
                      <span>
                        Scheduled for{" "}
                        {format(
                          new Date(editPost.scheduledFor),
                          "MMM d, yyyy 'at' h:mm a",
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Edit Form - Right Side */}
                  <div className="col-span-3 p-6 space-y-5">
                    {/* Title */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Post Title
                      </label>
                      <Input
                        value={editPost.title}
                        onChange={(e) =>
                          setEditPost((prev) =>
                            prev ? { ...prev, title: e.target.value } : prev,
                          )
                        }
                        placeholder="Enter a catchy title..."
                        className="h-11"
                        disabled={
                          editPost.status === "rejected" ||
                          editPost.status === "published" ||
                          editPost.status === "skipped_auto_post_disabled"
                        }
                        data-testid="input-post-title"
                      />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Caption
                        </label>
                        <span className="text-xs text-gray-400">
                          {editPost.content?.length || 0} / 2,200
                        </span>
                      </div>
                      <Textarea
                        value={editPost.content}
                        onChange={(e) =>
                          setEditPost((prev) =>
                            prev ? { ...prev, content: e.target.value } : prev,
                          )
                        }
                        style={{ fontSize: ".6rem" }}
                        placeholder="Write your caption..."
                        className="min-h-[120px] resize-none"
                        disabled={
                          editPost.status === "rejected" ||
                          editPost.status === "published" ||
                          editPost.status === "skipped_auto_post_disabled"
                        }
                        data-testid="input-post-content"
                      />
                    </div>

                    {/* Hashtags */}
                    {editPost.hashtags && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Hashtags
                        </label>
                        <Textarea
                          value={editPost.hashtags}
                          onChange={(e) =>
                            setEditPost((prev) =>
                              prev
                                ? { ...prev, hashtags: e.target.value }
                                : prev,
                            )
                          }
                          placeholder="#hashtag1 #hashtag2..."
                          className="min-h-[60px] resize-none text-sm text-blue-600"
                          disabled={
                            editPost.status === "rejected" ||
                            editPost.status === "published" ||
                            editPost.status === "skipped_auto_post_disabled"
                          }
                          data-testid="input-post-hashtags"
                        />
                      </div>
                    )}

                    {/* Date & Time */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Schedule Date & Time
                      </label>
                      <Input
                        type="datetime-local"
                        value={format(
                          new Date(editPost.scheduledFor),
                          "yyyy-MM-dd'T'HH:mm",
                        )}
                        onChange={(e) =>
                          setEditPost((prev) =>
                            prev
                              ? { ...prev, scheduledFor: e.target.value }
                              : prev,
                          )
                        }
                        className="h-11"
                        disabled={
                          editPost.status === "rejected" ||
                          editPost.status === "published" ||
                          editPost.status === "skipped_auto_post_disabled"
                        }
                        data-testid="input-post-schedule"
                      />
                    </div>

                    {/* Published At - Show when post is published */}
                    {editPost.status === "published" &&
                      editPost.publishedAt && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Published At
                          </label>
                          <div className="flex items-center gap-2 h-11 px-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700">
                              {format(
                                new Date(editPost.publishedAt),
                                "PPP 'at' p",
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Image Controls */}
                    {/*<div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Post Image
                      </label>
                      <div className="flex gap-2">
                        <label
                          className={`flex-1 ${
                            editPost.status === "published" ||
                            editPost.status === "rejected"
                              ? "pointer-events-none cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center gap-2 h-11 px-4 border-2 border-dashed rounded-lg transition-colors
                              ${
                                editPost.status === "published" ||
                                editPost.status === "rejected"
                                  ? "border-gray-200 bg-gray-100 text-gray-400"
                                  : "border-gray-300 hover:border-primary hover:bg-gray-50"
                              }
                            `}
                          >
                            <Upload
                              className={`w-4 h-4 ${
                                editPost.status === "published" ||
                                editPost.status === "rejected"
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            />
                            <span className="text-sm">Upload new image</span>
                          </div>

                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={
                              editPost.status === "published" ||
                              editPost.status === "rejected"
                            }
                            className="hidden"
                            data-testid="input-post-image"
                          />
                        </label>
                        <Button
                          variant="outline"
                          className="h-11 gap-2"
                          data-testid="button-edit-image"
                          disabled={
                            editPost.status === "published" ||
                            editPost.status === "rejected"
                          }
                        >
                          <Wand2 className="w-4 h-4" /> Edit with AI
                        </Button>
                      </div>
                    </div>*/}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-white flex items-center justify-between">
                  {/* Show reject button only for pending posts */}
                  {editPost.status === "pending" ? (
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (selectedPost) {
                          updatePostStatusMutation.mutate({
                            postId: selectedPost.id,
                            status: "rejected",
                          });
                        }
                        setSelectedPost(null);
                      }}
                      data-testid="button-reject-post"
                      disabled={!hasPostingFrequency}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject Post
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPost(null)}
                      data-testid="button-cancel-edit"
                    >
                      {editPost.status === "pending" ? "Cancel" : "Close"}
                    </Button>
                    {editPost.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            if (selectedPost && editPost) {
                              setSelectedPost(null);
                              handleEditBeforeAccept(editPost);
                            }
                          }}
                          data-testid="button-edit-image"
                        >
                          <Edit className="w-4 h-4" /> Edit Image
                        </Button>
                        <Button
                          className="bg-gray-800 hover:bg-gray-900 text-white"
                          onClick={() => {
                            if (selectedPost && editPost) {
                              const localDate = new Date(editPost.scheduledFor);
                              updatePostStatusMutation.mutate({
                                postId: selectedPost.id,
                                status: "accepted",
                                scheduledPublishTime: localDate.toISOString(),
                              });
                            }
                            setSelectedPost(null);
                          }}
                          data-testid="button-approve-post"
                          disabled={!hasPostingFrequency}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Posting Frequency Modal */}
        <PostingFrequencyModal
          isOpen={isFrequencyModalOpen}
          onClose={() => setIsFrequencyModalOpen(false)}
          currentSchedule={postingSchedule}
          onSaveSchedule={handleSavePostingSchedule}
        />

        {/* Auto-Post Confirmation Dialog */}
        <AlertDialog
          open={showAutoPostConfirm}
          onOpenChange={setShowAutoPostConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isPaused
                  ? "Enable Automatic Posting?"
                  : "Disable Automatic Posting?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isPaused
                  ? "When enabled, your approved posts will be automatically published at their scheduled times."
                  : "When disabled, scheduled posts will NOT be published automatically. You can still manually publish them."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAutoPostToggle}
                disabled={autoPostMutation.isPending}
                className={
                  isPaused
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {autoPostMutation.isPending
                  ? "Saving..."
                  : isPaused
                    ? "Enable"
                    : "Disable"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Image Editor Modal */}
        <ImageEditorDialog
          show={imageEditorDialog.show}
          post={imageEditorDialog.post}
          brandAssets={(brandAssets || []).map((asset: any) => ({
            id: asset.id,
            url: asset.url,
            name: asset.filename || asset.name || "Asset",
          }))}
          onClose={() => {
            imageEditorDialog.close();
            setImageEditorScheduledFor(null);
          }}
          onSave={handleSaveEditedImage}
          onAcceptWithoutEdit={handleAcceptWithoutEdit}
          isUploading={uploadEditedImageMutation.isPending}
        />

        {/* AI Generation Loading Modal */}
        <Dialog
          open={showGeneratingLoader}
          onOpenChange={(open) => {
            if (!open) {
              setShowGeneratingLoader(false);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary"></div>
              </div>
              <DialogTitle className="text-center text-xl mb-2">
                Generating AI Posts
              </DialogTitle>
              <p className="text-center text-gray-600 mb-4">
                Our AI is analyzing your brand data and creating personalized
                post suggestions...
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-center text-sm text-blue-700">
                  <strong>You can close this window!</strong>
                  <br />
                  Generation continues in the background. Come back anytime to
                  see your posts.
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-primary h-2 rounded-full animate-pulse"
                  style={{ width: "66%" }}
                ></div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGeneratingLoader(false)}
                className="text-gray-600"
              >
                Close and continue working
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fullscreen Image Viewer */}
        <Dialog
          open={!!fullscreenImage}
          onOpenChange={() => setFullscreenImage(null)}
        >
          <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
            <div className="relative">
              <img
                src={fullscreenImage || ""}
                alt="Full size preview"
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              />
              <button
                onClick={() => setFullscreenImage(null)}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
