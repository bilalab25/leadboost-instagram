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
  status: "draft" | "scheduled" | "published" | "pending" | "accepted" | "rejected";
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
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});

  // Query to fetch integrations for the brand
  const { data: integrations, isLoading: integrationsLoading } = useQuery<any[]>({
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
  const { data: postingFrequencyData, isLoading: postingFrequencyLoading } = useQuery<any[]>({
    queryKey: ["/api/posting-frequency", activeBrandId],
    queryFn: async () => {
      if (!activeBrandId) return [];
      const res = await fetch(`/api/posting-frequency?brandId=${activeBrandId}`, {
        credentials: "include",
      });
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
        int.provider === "facebook"
    );
  }, [integrations]);

  const connectedPlatforms = useMemo(() => {
    if (!integrations) return [];
    return integrations
      .filter((int: any) => 
        int.provider === "instagram" || 
        int.provider === "instagram_direct" || 
        int.provider === "facebook"
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
    
    return currentViewYear < nowYear || (currentViewYear === nowYear && currentViewMonth < nowMonth);
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
      const response = await fetch(`/api/post-generator/active/${activeBrandId}`, {
        credentials: "include",
      });
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
    if (activeJobQuery.data?.hasActiveJob && activeJobQuery.data?.job && !currentJobId) {
      const job = activeJobQuery.data.job;
      if (job.status === "pending" || job.status === "processing") {
        setCurrentJobId(job.id);
        setShowGeneratingLoader(true);
      }
    }
  }, [activeJobId]); // Only depend on job ID, not the entire data object

  // Check if there's an active job running (must be after activeJobQuery is defined)
  const hasActiveJob = activeJobQuery.data?.hasActiveJob || showGeneratingLoader || !!currentJobId;

  // Determine if AI generation is available
  const canGenerateAiPosts = hasSocialIntegrations && hasBrandDesign && hasPostingFrequency && !hasAiPostsForCurrentMonth && !isPastMonth && !hasActiveJob;

  // Get the reason why generation is disabled
  const getDisabledReason = (): string => {
    if (hasActiveJob) return "Content is being generated. You can close this page and come back later.";
    if (isPastMonth) return "Cannot generate AI content for past months";
    if (!hasSocialIntegrations) return "Connect Instagram or Facebook to generate AI posts";
    if (!hasBrandDesign) return "Create your brand design first";
    if (!hasPostingFrequency) return "Set your posting frequency first";
    if (hasAiPostsForCurrentMonth) return `Posts already exist for ${format(currentDate, "MMMM yyyy")}`;
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
      queryClient.invalidateQueries({ queryKey: ["/api/ai-generated-posts", activeBrandId] });
      
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-generated-posts", activeBrandId] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/ai-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-generated-posts", activeBrandId] });
      toast({
        title: variables.status === "accepted" ? "Posts Approved" : "Posts Rejected",
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
    allPosts.filter((post) =>
      isSameDay(new Date(post.scheduledFor), date),
    );

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

  // Get AI posts for the selected day
  const getAiPostsForDay = (date: Date) => {
    const dayName = format(date, "EEEE").toLowerCase();
    return aiPendingPosts.filter((post) => {
      return post.dia?.toLowerCase() === dayName && isSameMonth(new Date(post.createdAt), currentDate);
    });
  };

  // 🔹 Bulk approve/reject for month
  const handleApproveMonth = (status: "accepted" | "rejected" = "accepted") => {
    const monthPosts = getAiPostsForMonth();
    const pendingPosts = monthPosts.filter(p => p.status === "pending");
    
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
    const pendingPosts = dayPosts.filter(p => p.status === "pending");
    
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
  const handleUpdatePostStatus = (postId: string, status: "accepted" | "rejected") => {
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
      }
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
                      <AlertTitle className="text-amber-800">Connect your social accounts</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        To generate AI posts, connect your Instagram or Facebook account first.
                        <Link href="/integrations">
                          <Button variant="link" className="text-amber-800 font-semibold p-0 h-auto ml-1" data-testid="link-connect-integrations">
                            Connect now →
                          </Button>
                        </Link>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* No brand design banner */}
                  {!brandDesignLoading && hasSocialIntegrations && !hasBrandDesign && (
                    <Alert className="border-purple-200 bg-purple-50">
                      <Palette className="h-4 w-4 text-purple-600" />
                      <AlertTitle className="text-purple-800">Create your brand design</AlertTitle>
                      <AlertDescription className="text-purple-700">
                        Define your brand colors, fonts, and style to enable AI post generation.
                        <Link href="/brand-studio">
                          <Button variant="link" className="text-purple-800 font-semibold p-0 h-auto ml-1" data-testid="link-brand-studio">
                            Go to Brand Studio →
                          </Button>
                        </Link>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* No posting frequency banner */}
                  {!postingFrequencyLoading && hasSocialIntegrations && hasBrandDesign && !hasPostingFrequency && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <CalendarDays className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Set your posting frequency</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        Configure how often you want to post on each platform to generate the right amount of content.
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
                    <Alert className="border-green-200 bg-green-50">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">AI posts ready for {format(currentDate, "MMMM yyyy")}</AlertTitle>
                      <AlertDescription className="text-green-700">
                        You have {currentMonthAiPosts.length} AI-generated posts for this month. Review them in the calendar below.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 📅 Calendar */}
                  <div className="lg:col-span-2">
                    <Card className="shadow-lg border-0">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
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
                                Today
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
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsFrequencyModalOpen(true)}
                                className={!hasPostingFrequency ? "border-blue-300 text-blue-700 hover:bg-blue-50" : ""}
                                data-testid="button-set-posting-frequency"
                              >
                                <Settings className="w-4 h-4 mr-1" />
                                {hasPostingFrequency ? "Edit Frequency" : "Set Frequency"}
                              </Button>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="sm"
                                      variant={hasActiveJob ? "outline" : canGenerateAiPosts ? "default" : "outline"}
                                      onClick={() => generatePostsMutation.mutate()}
                                      disabled={
                                        generatePostsMutation.isPending ||
                                        !activeBrandId ||
                                        !canGenerateAiPosts ||
                                        hasActiveJob
                                      }
                                      className={hasActiveJob
                                        ? "bg-gradient-to-r from-brand-100 to-purple-100 border-brand-300"
                                        : canGenerateAiPosts 
                                          ? "bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white" 
                                          : "opacity-60 cursor-not-allowed"
                                      }
                                      data-testid="button-generate-ai-posts"
                                    >
                                      {hasActiveJob || generatePostsMutation.isPending ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles className="w-4 h-4 mr-1" />
                                          AI Suggestions
                                        </>
                                      )}
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {(!canGenerateAiPosts || hasActiveJob) && (
                                  <TooltipContent>
                                    <p>{getDisabledReason()}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveMonth("accepted")}
                                      disabled={isPastMonth || bulkUpdatePostStatusMutation.isPending}
                                      className={isPastMonth 
                                        ? "opacity-60 cursor-not-allowed bg-gray-300" 
                                        : "bg-green-500 hover:bg-green-600 text-white"
                                      }
                                      data-testid="button-approve-month"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approve Month
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {isPastMonth && (
                                  <TooltipContent>
                                    <p>Cannot approve past months</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </div>

                            {/* Pause/Autopost toggle */}
                            <div
                              onClick={handleToggle}
                              className={`relative flex w-36 h-9 rounded-full cursor-pointer select-none transition-all duration-300 border ${
                                isPaused ? "bg-gray-100 border-gray-300" : "bg-gray-100 border-gray-300"
                              }`}
                            >
                              <span
                                className={`absolute top-1 left-1 h-7 w-[calc(50%-4px)] rounded-full shadow-sm transform transition-all duration-300 ${
                                  isPaused
                                    ? "translate-x-0 bg-white border border-gray-300"
                                    : "translate-x-full bg-white border border-gray-300"
                                }`}
                              ></span>
                              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                                <span className={`transition-colors ${isPaused ? "text-gray-800" : "text-gray-400"}`}>
                                  Pause
                                </span>
                                <span className={`transition-colors ${!isPaused ? "text-gray-800" : "text-gray-400"}`}>
                                  Auto
                                </span>
                              </div>
                            </div>
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
                                    ? "bg-brand-50 border-brand-200"
                                    : "bg-white border-gray-200"
                                } ${isSelected ? "ring-2 ring-brand-500" : ""}`}
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
                                    const postStatus = post.status as "pending" | "accepted" | "rejected";
                                    
                                    const getStatusBorder = () => {
                                      if (!isAiPost) return "";
                                      if (postStatus === "accepted") return "ring-2 ring-green-400 ring-offset-1";
                                      if (postStatus === "rejected") return "ring-2 ring-red-400 ring-offset-1 opacity-50";
                                      return "ring-2 ring-yellow-400 ring-offset-1";
                                    };
                                    
                                    return (
                                      <div
                                        key={post.id}
                                        data-testid={`calendar-post-${post.id}`}
                                        className={`text-xs px-2 py-1 rounded truncate flex items-center gap-1 ${platformColors[post.platform as keyof typeof platformColors]} ${getStatusBorder()}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenPost(post);
                                        }}
                                      >
                                        <PlatformIcon className="inline w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{post.title}</span>
                                        {isAiPost && postStatus === "accepted" && (
                                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                        )}
                                        {isAiPost && postStatus === "rejected" && (
                                          <XCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
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
                              : "Select a date"}
                          </CardTitle>
                        </div>
                        {/* ✅ Approve all posts for the day */}
                        {selectedDate && selectedDatePosts.length > 0 && (
                          <Button
                            size="sm"
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => handleApproveDay("accepted")}
                            disabled={bulkUpdatePostStatusMutation.isPending}
                            data-testid="button-approve-day"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve Day
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
                              const isImageLoading = imageLoadingStates[post.id] !== false;
                              const isAiPost = post.source === "ai";
                              const postStatus = post.status as "pending" | "accepted" | "rejected";
                              
                              const statusConfig = {
                                pending: { 
                                  bg: "bg-yellow-100", 
                                  text: "text-yellow-800", 
                                  border: "border-yellow-200",
                                  icon: Clock,
                                  label: "Pending"
                                },
                                accepted: { 
                                  bg: "bg-green-100", 
                                  text: "text-green-800", 
                                  border: "border-green-200",
                                  icon: CheckCircle,
                                  label: "Approved"
                                },
                                rejected: { 
                                  bg: "bg-red-100", 
                                  text: "text-red-800", 
                                  border: "border-red-200",
                                  icon: XCircle,
                                  label: "Rejected"
                                }
                              };

                              const currentStatus = statusConfig[postStatus] || statusConfig.pending;
                              const StatusIcon = currentStatus.icon;
                              
                              return (
                                <div
                                  key={post.id}
                                  className={`border rounded-lg p-4 transition-all hover:shadow-md relative ${
                                    isAiPost 
                                      ? postStatus === "accepted" 
                                        ? "border-green-300 bg-gradient-to-br from-green-50/50 to-white"
                                        : postStatus === "rejected"
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
                                      <span className="font-medium">{currentStatus.label}</span>
                                    </div>
                                  )}
                                  
                                  {/* AI Badge */}
                                  {isAiPost && (
                                    <div className="flex items-center gap-1 text-xs text-purple-600 mb-2">
                                      <Sparkles className="w-3 h-3" />
                                      <span className="font-medium">AI Generated</span>
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
                                        onLoad={() => setImageLoadingStates(prev => ({ ...prev, [post.id]: false }))}
                                        onError={() => setImageLoadingStates(prev => ({ ...prev, [post.id]: false }))}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="font-medium text-sm line-clamp-1">{post.title}</p>
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
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => setEditPost({ ...post })}
                                      data-testid={`button-edit-post-${post.id}`}
                                    >
                                      <Edit className="w-3 h-3 mr-1" /> Edit
                                    </Button>
                                  </div>
                                  
                                  {/* Individual Approve button for AI posts */}
                                  {isAiPost && postStatus === "pending" && (
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                      <Button
                                        size="sm"
                                        className="w-full bg-green-500 hover:bg-green-600 text-white"
                                        onClick={() => handleUpdatePostStatus(post.id, "accepted")}
                                        disabled={updatePostStatusMutation.isPending}
                                        data-testid={`button-approve-post-${post.id}`}
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" /> Approve & Schedule
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
                              ? "No posts for this day"
                              : "Click on a day to view posts"}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">This Week</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Scheduled
                            </span>
                            <span className="font-medium">3</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Published
                            </span>
                            <span className="font-medium">1</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Drafts
                            </span>
                            <span className="font-medium">1</span>
                          </div>
                        </div>
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
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {editPost && (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-semibold">Edit Post</DialogTitle>
                      <p className="text-sm text-gray-500">Preview and customize your content</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editPost.platform === "instagram" || editPost.platform === "instagram_direct" ? (
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
                    {editPost.status === "accepted" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium border border-green-200">
                        <CheckCircle className="w-4 h-4" /> Approved
                      </span>
                    )}
                    {editPost.status === "rejected" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium border border-red-200">
                        <XCircle className="w-4 h-4" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="grid grid-cols-5 gap-0">
                {/* Live Preview - Left Side */}
                <div className="col-span-2 bg-gray-50 p-6 border-r">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Live Preview</p>
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
                    {/* Image */}
                    <div className="aspect-square relative bg-gray-100">
                      <img
                        src={editPost.imageUrl}
                        alt={editPost.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Content */}
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 line-clamp-2">{editPost.title}</p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-4">
                        {editPost.content}
                      </p>
                    </div>
                  </div>
                  
                  {/* Schedule Badge */}
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border">
                    <CalendarCheck className="w-4 h-4 text-primary" />
                    <span>Scheduled for {format(new Date(editPost.scheduledFor), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                </div>

                {/* Edit Form - Right Side */}
                <div className="col-span-3 p-6 space-y-5">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Post Title</label>
                    <Input
                      value={editPost.title}
                      onChange={(e) =>
                        setEditPost((prev) =>
                          prev ? { ...prev, title: e.target.value } : prev,
                        )
                      }
                      placeholder="Enter a catchy title..."
                      className="h-11"
                      data-testid="input-post-title"
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Caption</label>
                      <span className="text-xs text-gray-400">{editPost.content?.length || 0} / 2,200</span>
                    </div>
                    <Textarea
                      value={editPost.content}
                      onChange={(e) =>
                        setEditPost((prev) =>
                          prev ? { ...prev, content: e.target.value } : prev,
                        )
                      }
                      placeholder="Write your caption..."
                      className="min-h-[120px] resize-none"
                      data-testid="input-post-content"
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Schedule Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={format(
                        new Date(editPost.scheduledFor),
                        "yyyy-MM-dd'T'HH:mm",
                      )}
                      onChange={(e) =>
                        setEditPost((prev) =>
                          prev ? { ...prev, scheduledFor: e.target.value } : prev,
                        )
                      }
                      className="h-11"
                      data-testid="input-post-schedule"
                    />
                  </div>

                  {/* Image Controls */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Post Image</label>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 h-11 px-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-gray-50 transition-colors">
                          <Upload className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Upload new image</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          data-testid="input-post-image"
                        />
                      </label>
                      <Button variant="outline" className="h-11 gap-2" data-testid="button-edit-image">
                        <Wand2 className="w-4 h-4" /> Edit with AI
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
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
                    <Button 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      onClick={() => {
                        if (selectedPost) {
                          updatePostStatusMutation.mutate({
                            postId: selectedPost.id,
                            status: "accepted",
                          });
                        }
                        setSelectedPost(null);
                      }}
                      data-testid="button-approve-post"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve & Schedule
                    </Button>
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

      {/* AI Generation Loading Modal */}
      <Dialog open={showGeneratingLoader} onOpenChange={(open) => {
        if (!open) {
          setShowGeneratingLoader(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary"></div>
            </div>
            <DialogTitle className="text-center text-xl mb-2">
              Generating AI Posts
            </DialogTitle>
            <p className="text-center text-gray-600 mb-4">
              Our AI is analyzing your brand data and creating personalized post
              suggestions...
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-center text-sm text-blue-700">
                <strong>You can close this window!</strong><br />
                Generation continues in the background. Come back anytime to see your posts.
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
    </div>
    </TooltipProvider>
  );
}
