import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  AlertCircle,
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
} from "lucide-react";
import { SiWhatsapp, SiTiktok, SiFacebook, SiLinkedin } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
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
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PauseCircle, PlayCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Pause, Play } from "lucide-react";
import { Link } from "wouter";
import PostingFrequencyModal from "@/components/PostingFrequencyModal";

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
    | "rejected";
  content: string;
  imageUrl?: string;
  source?: "manual" | "ai";
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
  instagram: "text-pink-500 bg-pink-50",
  instagram_story: "text-pink-400 bg-pink-50",
  instagram_reel: "text-pink-600 bg-pink-50",
  whatsapp: "text-green-500 bg-green-50",
  facebook: "text-blue-600 bg-blue-50",
  tiktok: "text-gray-800 bg-gray-50",
  linkedin: "text-sky-600 bg-sky-50",
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

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [editPost, setEditPost] = useState<ContentPost | null>(null);
  const [isPaused, setIsPaused] = useState(false);
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
      // Parse the date from dia field (could be "monday" or "2025-01-15")
      let scheduledDate: Date;

      if (post.dia && post.dia.includes("-")) {
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
      }
    }
  }, [activeJobId]); // Only depend on job ID, not the entire data object

  // Check if there's an active job running (must be after activeJobQuery is defined)
  const hasActiveJob =
    activeJobQuery.data?.hasActiveJob || showGeneratingLoader || !!currentJobId;

  // Check if AI posts are still loading
  const isLoadingAiPosts = existingAiPostsQuery.isLoading || existingAiPostsQuery.isFetching;

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
    }: {
      postId: string;
      status: "accepted" | "rejected" | "pending";
    }) => {
      const response = await fetch(`/api/ai-posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, brandId: activeBrandId }),
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
            : post
        )
      );
      // Also update editPost if it's the same post
      setEditPost((prev) =>
        prev && prev.id === variables.postId
          ? { ...prev, status: variables.status }
          : prev
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
            : post
        )
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

      if (!response.ok) {
        const text = (await response.text()) || response.statusText;
        throw new Error(`${response.status}: ${text}`);
      }

      const data = await response.json();
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
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to start post generation",
        variant: "destructive",
      });
    },
  });

  const handleToggle = () => {
    setIsPaused((prev) => {
      const newState = !prev;
      toast({
        title: newState ? "Posting Paused" : "Posting Resumed",
        description: newState
          ? "Automatic posting has been paused."
          : "Automatic posting has been resumed.",
      });
      return newState;
    });
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
    setEditPost({ ...post }); // clone to edit
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
      const postDate = new Date(post.createdAt);
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
    const dayName = format(date, "EEEE").toLowerCase();
    return aiPendingPosts.filter((post) => {
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
      <div className="min-h-screen bg-background">
        <div className="flex h-screen overflow-hidden">
          <div className="flex flex-col w-0 flex-1 overflow-hidden">
            <main className="flex-1 relative overflow-y-auto focus:outline-none">
              <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {/* Onboarding alerts */}
                  <div className="space-y-2 mb-6">
                    {!integrationsLoading && !hasSocialIntegrations && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50/50 border border-amber-200/50">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                          <Link2 className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Connect your social accounts</p>
                          <p className="text-xs text-muted-foreground">Connect Instagram or Facebook to generate AI posts.</p>
                        </div>
                        <Link href="/integrations">
                          <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100" data-testid="link-connect-integrations">
                            Connect
                          </Button>
                        </Link>
                      </div>
                    )}

                    {!brandDesignLoading && hasSocialIntegrations && !hasBrandDesign && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-violet-50/50 border border-violet-200/50">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                          <Palette className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Create your brand design</p>
                          <p className="text-xs text-muted-foreground">Define your brand colors and style for AI posts.</p>
                        </div>
                        <Link href="/brand-studio">
                          <Button size="sm" variant="outline" className="text-violet-700 border-violet-300 hover:bg-violet-100" data-testid="link-brand-studio">
                            Create
                          </Button>
                        </Link>
                      </div>
                    )}

                    {!postingFrequencyLoading && hasSocialIntegrations && hasBrandDesign && !hasPostingFrequency && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Set your posting frequency</p>
                          <p className="text-xs text-muted-foreground">Configure how often you want to post on each platform.</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setIsFrequencyModalOpen(true)} data-testid="link-set-frequency">
                          Configure
                        </Button>
                      </div>
                    )}

                    {hasAiPostsForCurrentMonth && (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{currentMonthAiPosts.length} AI posts ready</p>
                          <p className="text-xs text-muted-foreground">Review and approve your posts in the calendar below.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <div className="lg:col-span-2">
                      <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-4">
                          <div className="flex flex-col gap-4">
                            {/* Header with title and navigation */}
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-2xl font-semibold text-foreground">
                                {format(currentDate, "MMMM yyyy")}
                              </CardTitle>
                              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-background"
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
                                  className="h-8 px-3 hover:bg-background text-xs font-medium"
                                  onClick={() => setCurrentDate(new Date())}
                                  data-testid="button-today"
                                >
                                  Today
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-background"
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
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsFrequencyModalOpen(true)}
                                className="text-muted-foreground"
                                data-testid="button-set-posting-frequency"
                              >
                                <Settings className="w-4 h-4" />
                                {hasPostingFrequency ? "Frequency" : "Set Frequency"}
                              </Button>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="sm"
                                      onClick={() => generatePostsMutation.mutate()}
                                      disabled={
                                        generatePostsMutation.isPending ||
                                        !activeBrandId ||
                                        !canGenerateAiPosts ||
                                        hasActiveJob ||
                                        isLoadingAiPosts
                                      }
                                      className={
                                        canGenerateAiPosts && !hasActiveJob && !isLoadingAiPosts
                                          ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                          : ""
                                      }
                                      variant={canGenerateAiPosts && !hasActiveJob && !isLoadingAiPosts ? "default" : "outline"}
                                      data-testid="button-generate-ai-posts"
                                    >
                                      {isLoadingAiPosts || hasActiveJob || generatePostsMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Sparkles className="w-4 h-4" />
                                      )}
                                      {isLoadingAiPosts ? "Loading..." : hasActiveJob || generatePostsMutation.isPending ? "Generating..." : "Generate"}
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {(!canGenerateAiPosts || hasActiveJob || isLoadingAiPosts) && (
                                  <TooltipContent>
                                    <p>{isLoadingAiPosts ? "Loading existing posts..." : getDisabledReason()}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>

                              {hasPendingPostsForMonth && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveMonth("accepted")}
                                  disabled={isPastMonth || bulkUpdatePostStatusMutation.isPending || isLoadingAiPosts}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                  data-testid="button-approve-month"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Approve All
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          {/* Week headers */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2 uppercase tracking-wide">
                                {day}
                              </div>
                            ))}
                          </div>

                          {/* Days */}
                          <div className="grid grid-cols-7 gap-1">
                            {daysInMonth.map((day) => {
                              const postsForDay = getPostsForDate(day);
                              const isSelected = selectedDate && isSameDay(selectedDate, day);
                              const hasApprovedPosts = postsForDay.some((p) => p.status === "accepted");
                              const hasPendingPosts = postsForDay.some((p) => p.status === "pending");
                              
                              return (
                                <div
                                  key={day.toISOString()}
                                  className={`p-2 min-h-[90px] rounded-lg cursor-pointer transition-all duration-200 border ${
                                    isSelected
                                      ? "bg-primary/5 border-primary ring-1 ring-primary"
                                      : isToday(day)
                                        ? "bg-primary/5 border-primary/30"
                                        : "bg-card hover:bg-muted/50 border-border"
                                  }`}
                                  onClick={() => handleDateClick(day)}
                                >
                                  <div className={`text-sm font-medium mb-1 ${
                                    isToday(day) ? "text-primary" : "text-foreground"
                                  }`}>
                                    {format(day, "d")}
                                  </div>
                                  <div className="space-y-1">
                                    {postsForDay.slice(0, 2).map((post) => {
                                      const PlatformIcon = platformIcons[post.platform as keyof typeof platformIcons];
                                      const postStatus = post.status as "pending" | "accepted" | "rejected";
                                      
                                      return (
                                        <div
                                          key={post.id}
                                          data-testid={`calendar-post-${post.id}`}
                                          className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                                            postStatus === "accepted"
                                              ? "bg-emerald-100 text-emerald-800"
                                              : postStatus === "rejected"
                                                ? "bg-red-50 text-red-600 opacity-60"
                                                : "bg-amber-100 text-amber-800"
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenPost(post);
                                          }}
                                        >
                                          <PlatformIcon className="w-3 h-3 flex-shrink-0" />
                                          <span className="truncate text-[10px]">{post.title.slice(0, 12)}...</span>
                                        </div>
                                      );
                                    })}
                                    {postsForDay.length > 2 && (
                                      <div className="text-[10px] text-muted-foreground text-center">
                                        +{postsForDay.length - 2} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                      <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-foreground">
                              {selectedDate
                                ? format(selectedDate, "EEEE, MMM d")
                                : "Select a date"}
                            </CardTitle>
                            {selectedDate && selectedDatePosts.length > 0 && 
                              selectedDatePosts.some((post) => post.status === "pending") && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleApproveDay("accepted")}
                                disabled={bulkUpdatePostStatusMutation.isPending}
                                data-testid="button-approve-day"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {selectedDatePosts.length > 0 ? (
                            <div className="space-y-3">
                              {selectedDatePosts.map((post) => {
                                const PlatformIcon = platformIcons[post.platform as keyof typeof platformIcons];
                                const isImageLoading = imageLoadingStates[post.id] !== false;
                                const isAiPost = post.source === "ai";
                                const postStatus = post.status as "pending" | "accepted" | "rejected";

                                const statusStyles = {
                                  pending: "border-l-amber-400 bg-amber-50/30",
                                  accepted: "border-l-emerald-500 bg-emerald-50/30",
                                  rejected: "border-l-red-400 bg-red-50/30 opacity-60",
                                };

                                return (
                                  <div
                                    key={post.id}
                                    className={`rounded-lg overflow-hidden border border-border bg-card cursor-pointer transition-all hover:shadow-md ${
                                      isAiPost ? `border-l-4 ${statusStyles[postStatus]}` : ""
                                    }`}
                                    onClick={() => handleOpenPost(post)}
                                    data-testid={`post-preview-${post.id}`}
                                  >
                                    {/* Image */}
                                    <div className="relative w-full h-28 bg-muted">
                                      {isImageLoading && post.imageUrl && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <Skeleton className="w-full h-full" />
                                        </div>
                                      )}
                                      {post.imageUrl ? (
                                        <img
                                          src={post.imageUrl}
                                          alt={post.title}
                                          className={`w-full h-full object-cover transition-opacity duration-300 ${isImageLoading ? "opacity-0" : "opacity-100"}`}
                                          onLoad={() => setImageLoadingStates((prev) => ({ ...prev, [post.id]: false }))}
                                          onError={() => setImageLoadingStates((prev) => ({ ...prev, [post.id]: false }))}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                                        </div>
                                      )}
                                      {/* Platform badge on image */}
                                      <div className="absolute top-2 left-2 flex items-center gap-1 text-xs bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                                        <PlatformIcon className="w-3 h-3" />
                                        <span className="font-medium capitalize">{post.platform}</span>
                                      </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-3">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="font-medium text-sm text-foreground line-clamp-1">{post.title}</p>
                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                          {format(new Date(post.scheduledFor), "h:mm a")}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                                    </div>

                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                              <p className="text-muted-foreground text-sm">
                                {selectedDate ? "No posts scheduled" : "Select a date to view posts"}
                              </p>
                            </div>
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

        {/* Post Detail Modal */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            {editPost && (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b bg-card">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-lg font-semibold text-foreground">Edit Post</DialogTitle>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                        editPost.platform === "instagram" || editPost.platform === "instagram_direct"
                          ? "bg-pink-100 text-pink-700"
                          : editPost.platform === "facebook"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {platformIcons[editPost.platform as keyof typeof platformIcons] && (
                          (() => {
                            const Icon = platformIcons[editPost.platform as keyof typeof platformIcons];
                            return <Icon className="w-4 h-4" />;
                          })()
                        )}
                        <span className="capitalize">{editPost.platform.replace("_", " ")}</span>
                      </span>
                      {editPost.status === "accepted" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {editPost.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-5 gap-0">
                  {/* Preview */}
                  <div className="col-span-2 bg-muted/30 p-6 border-r">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Preview</p>
                    <div className="bg-card rounded-xl shadow-sm overflow-hidden border">
                      <div className="aspect-square relative bg-muted">
                        {editPost.imageUrl ? (
                          <img src={editPost.imageUrl} alt={editPost.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-medium text-foreground line-clamp-2">{editPost.title}</p>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{editPost.content}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-card rounded-lg px-3 py-2 border">
                      <CalendarCheck className="w-4 h-4 text-primary" />
                      <span>{format(new Date(editPost.scheduledFor), "MMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="col-span-3 p-6 space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Title</label>
                      <Input
                        value={editPost.title}
                        onChange={(e) => setEditPost((prev) => prev ? { ...prev, title: e.target.value } : prev)}
                        placeholder="Post title..."
                        data-testid="input-post-title"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Caption</label>
                        <span className="text-xs text-muted-foreground">{editPost.content?.length || 0} / 2,200</span>
                      </div>
                      <Textarea
                        value={editPost.content}
                        onChange={(e) => setEditPost((prev) => prev ? { ...prev, content: e.target.value } : prev)}
                        placeholder="Write your caption..."
                        className="min-h-[120px] resize-none text-sm"
                        data-testid="input-post-content"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Schedule</label>
                      <Input
                        type="datetime-local"
                        value={format(new Date(editPost.scheduledFor), "yyyy-MM-dd'T'HH:mm")}
                        onChange={(e) => setEditPost((prev) => prev ? { ...prev, scheduledFor: e.target.value } : prev)}
                        data-testid="input-post-schedule"
                      />
                    </div>

                    {/* Image */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Image</label>
                      <div className="flex gap-2">
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center gap-2 h-10 px-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors">
                            <Upload className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Upload image</span>
                          </div>
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" data-testid="input-post-image" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedPost(null)} data-testid="button-cancel-edit">
                    {editPost.status === "pending" ? "Cancel" : "Close"}
                  </Button>
                  {editPost.status === "pending" && (
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        if (selectedPost) {
                          updatePostStatusMutation.mutate({ postId: selectedPost.id, status: "accepted" });
                        }
                        setSelectedPost(null);
                      }}
                      data-testid="button-approve-post"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </Button>
                  )}
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

        {/* AI Generation Loading Modal */}
        <Dialog open={showGeneratingLoader} onOpenChange={(open) => !open && setShowGeneratingLoader(false)}>
          <DialogContent className="max-w-sm">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="mb-5">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-muted border-t-primary"></div>
              </div>
              <DialogTitle className="text-center text-lg font-semibold mb-2">Generating Posts</DialogTitle>
              <p className="text-center text-muted-foreground text-sm mb-4">
                AI is creating personalized content for your brand...
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 w-full">
                <p className="text-center text-xs text-primary">
                  You can close this window. Generation continues in the background.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowGeneratingLoader(false)} className="text-muted-foreground">
                Continue working
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
