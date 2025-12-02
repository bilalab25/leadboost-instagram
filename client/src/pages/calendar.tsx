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
} from "lucide-react";
import { SiWhatsapp, SiTiktok, SiFacebook, SiLinkedin } from "react-icons/si";
import { Instagram } from "lucide-react";
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
    queryKey: ["/api/brands", activeBrandId, "design"],
    queryFn: async () => {
      if (!activeBrandId) return null;
      const res = await fetch(`/api/brands/${activeBrandId}/design`, {
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

  // Determine if AI generation is available
  const canGenerateAiPosts = hasSocialIntegrations && hasBrandDesign && hasPostingFrequency && !hasAiPostsForCurrentMonth;

  // Get the reason why generation is disabled
  const getDisabledReason = (): string => {
    if (!hasSocialIntegrations) return "Connect Instagram or Facebook to generate AI posts";
    if (!hasBrandDesign) return "Create your brand design first";
    if (!hasPostingFrequency) return "Set your posting frequency first";
    if (hasAiPostsForCurrentMonth) return `Posts already exist for ${format(currentDate, "MMMM yyyy")}`;
    return "";
  };

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

  // Mutation to update AI post status
  const updatePostStatusMutation = useMutation({
    mutationFn: async ({
      postId,
      status,
    }: {
      postId: string;
      status: "accepted" | "rejected";
    }) => {
      const response = await fetch(`/api/ai-posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update post status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-posts"] });
    },
  });

  // AI Post Generator Mutation
  const generatePostsMutation = useMutation({
    mutationFn: async () => {
      if (!activeBrandId) {
        throw new Error("No brand selected");
      }

      const response = await fetch(`/api/post-generator/${activeBrandId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
  // 🔹 Mock posts
  const mockContentPosts: ContentPost[] = [
    {
      id: "1",
      title: "Product Launch",
      platform: "instagram",
      scheduledFor: "2025-09-27T14:00:00Z",
      status: "scheduled",
      content: "🎉 Our new product is finally here!",
      imageUrl:
        "https://img.freepik.com/free-psd/male-grooming-template-design_23-2150195492.jpg?semt=ais_incoming&w=740&q=80",
    },
    {
      id: "2",
      title: "Customer Testimonial",
      platform: "facebook",
      scheduledFor: "2025-09-28T10:30:00Z",
      status: "draft",
      content: "Here is what our clients are saying ❤️",
      imageUrl:
        "https://img.freepik.com/premium-psd/aesthetic-fashion-social-media-instagram-post-template-premium-psd_20692-42.jpg",
    },
    {
      id: "3",
      title: "Behind the Scenes",
      platform: "tiktok",
      scheduledFor: "2025-09-28T16:00:00Z",
      status: "scheduled",
      content: "🎬 A look behind our daily operations",
      imageUrl:
        "https://img.freepik.com/premium-psd/minimalist-aesthetic-fashion-social-media-instagram-post-template_20692-45.jpg",
    },
    {
      id: "4",
      title: "Holiday Promo",
      platform: "whatsapp",
      scheduledFor: "2025-09-29T09:00:00Z",
      status: "published",
      content: "🎄 Special offers for the holiday season!",
      imageUrl:
        "https://img.freepik.com/premium-psd/new-year-mega-sale-women-fashion-product-minimalist-social-media-template_524105-401.jpg",
    },
    {
      id: "5",
      title: "GLOWING SKIN FACIAL",
      platform: "instagram",
      scheduledFor: "2025-11-26T17:00:00Z",
      status: "published",
      content:
        "Unveil your natural radiance. ✨ Experience deep hydration, rejuvenation, and a flawless complexion with our signature facial treatment.",
      imageUrl:
        "https://res.cloudinary.com/dgujs7cy9/image/upload/v1764131141/Gemini_Generated_Image_loy3jsloy3jsloy3_yucbls.png",
    },
  ];

  // Convert AI posts to ContentPost format and combine with mock posts
  const aiContentPosts = useMemo(() => {
    if (!aiPendingPosts || aiPendingPosts.length === 0) return [];
    return convertAiPostsToContentPosts(aiPendingPosts);
  }, [aiPendingPosts, currentDate]);

  // Combine all posts (mock + AI) for calendar display
  const allPosts = useMemo(() => {
    const manualPosts = mockContentPosts.map(post => ({ ...post, source: "manual" as const }));
    return [...manualPosts, ...aiContentPosts];
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

  // 🔹 Bulk approve
  const handleApproveMonth = () => {
    toast({
      title: "Approved all posts",
      description: `All posts scheduled for ${format(
        currentDate,
        "MMMM yyyy",
      )} have been approved.`,
    });
  };

  const handleApproveDay = () => {
    if (!selectedDate) return;
    toast({
      title: "Approved all posts",
      description: `All posts for ${format(selectedDate, "MMMM d")} approved.`,
    });
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
                              <CalendarIcon className="h-6 w-6 text-brand-600" />
                              <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
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
                                      variant={canGenerateAiPosts ? "default" : "outline"}
                                      onClick={() => generatePostsMutation.mutate()}
                                      disabled={
                                        generatePostsMutation.isPending ||
                                        !activeBrandId ||
                                        !canGenerateAiPosts
                                      }
                                      className={canGenerateAiPosts 
                                        ? "bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white" 
                                        : "opacity-60 cursor-not-allowed"
                                      }
                                      data-testid="button-generate-ai-posts"
                                    >
                                      {generatePostsMutation.isPending ? (
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
                                {!canGenerateAiPosts && (
                                  <TooltipContent>
                                    <p>{getDisabledReason()}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleApproveMonth}
                                className="text-green-700 border-green-300 hover:bg-green-50"
                                data-testid="button-approve-month"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve Month
                              </Button>
                            </div>

                            {/* Pause/Autopost toggle */}
                            <div
                              onClick={handleToggle}
                              className={`relative flex w-36 h-9 rounded-full cursor-pointer select-none transition-all duration-300 shadow-inner ${
                                isPaused ? "bg-gray-200" : "bg-gradient-to-r from-brand-100 to-green-100"
                              }`}
                            >
                              <span
                                className={`absolute top-1 left-1 h-7 w-[calc(50%-4px)] rounded-full shadow-md transform transition-all duration-300 ${
                                  isPaused
                                    ? "translate-x-0 bg-gray-400"
                                    : "translate-x-full bg-gradient-to-r from-brand-500 to-green-500"
                                }`}
                              ></span>
                              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-semibold">
                                <span className={`transition-colors ${isPaused ? "text-gray-700" : "text-gray-400"}`}>
                                  Pause
                                </span>
                                <span className={`transition-colors ${!isPaused ? "text-green-700" : "text-gray-400"}`}>
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
                                    return (
                                      <div
                                        key={post.id}
                                        data-testid={`calendar-post-${post.id}`}
                                        className={`text-xs px-2 py-1 rounded truncate flex items-center gap-1 ${platformColors[post.platform as keyof typeof platformColors]} ${isAiPost ? "ring-1 ring-purple-300" : ""}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenPost(post);
                                        }}
                                      >
                                        {isAiPost && <Sparkles className="inline w-3 h-3 text-purple-500 flex-shrink-0" />}
                                        <PlatformIcon className="inline w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{post.title}</span>
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
                      <CardHeader className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {selectedDate
                            ? format(selectedDate, "EEEE, MMMM d")
                            : "Select a date"}
                        </CardTitle>
                        {/* ✅ Approve all posts for the day */}
                        {selectedDate && selectedDatePosts.length > 0 && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={handleApproveDay}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve day
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
                              return (
                                <div
                                  key={post.id}
                                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${isAiPost ? "border-purple-200 bg-gradient-to-br from-purple-50/50 to-white" : ""}`}
                                  data-testid={`post-preview-${post.id}`}
                                >
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

                    {/* AI Suggestions Card */}
                    {aiPendingPosts.length > 0 && (
                      <Card className="border-2 border-brand-200 bg-brand-50/30 lg:col-span-3">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-brand-600" />
                            AI Suggested Posts ({aiPendingPosts.length})
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Review and approve/reject AI-generated posts before
                            publishing
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {aiPendingPosts.map((post) => (
                              <div
                                key={post.id}
                                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
                              >
                                {/* Image */}
                                {post.imageUrl && (
                                  <img
                                    src={post.imageUrl}
                                    alt={post.titulo}
                                    className="w-full h-48 object-cover"
                                  />
                                )}

                                {/* Content */}
                                <div className="p-4 space-y-3">
                                  {/* Platform Badge */}
                                  <div className="flex items-start justify-between gap-2">
                                    <Badge
                                      className={
                                        platformColors[
                                          post.platform as keyof typeof platformColors
                                        ] || "bg-gray-100"
                                      }
                                    >
                                      {post.platform}
                                    </Badge>
                                    <span className="text-xs text-gray-500 capitalize">
                                      {post.dia}
                                    </span>
                                  </div>

                                  {/* Title */}
                                  <h4 className="font-semibold text-sm line-clamp-2">
                                    {post.titulo}
                                  </h4>

                                  {/* Content */}
                                  <p className="text-sm text-gray-600 line-clamp-3">
                                    {post.content}
                                  </p>

                                  {/* Hashtags */}
                                  {post.hashtags && (
                                    <p className="text-xs text-blue-600 line-clamp-1">
                                      {post.hashtags}
                                    </p>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="flex gap-2 pt-2 border-t">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-red-600 hover:text-red-700"
                                      onClick={() =>
                                        updatePostStatusMutation.mutate({
                                          postId: post.id,
                                          status: "rejected",
                                        })
                                      }
                                      disabled={
                                        updatePostStatusMutation.isPending
                                      }
                                      data-testid={`button-reject-post-${post.id}`}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="flex-1 bg-green-600 hover:bg-green-700"
                                      onClick={() =>
                                        updatePostStatusMutation.mutate({
                                          postId: post.id,
                                          status: "accepted",
                                        })
                                      }
                                      disabled={
                                        updatePostStatusMutation.isPending
                                      }
                                      data-testid={`button-accept-post-${post.id}`}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Accept
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Modal Meta Ads Style */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Post Preview & Edit</DialogTitle>
          </DialogHeader>

          {editPost && (
            <div className="grid grid-cols-2 gap-6">
              {/* Live Preview */}
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={editPost.imageUrl}
                  alt={editPost.title}
                  className="w-full object-cover"
                />
                <div className="p-4">
                  <p className="font-semibold">{editPost.title}</p>
                  <p className="text-sm text-gray-700 mt-2">
                    {editPost.content}
                  </p>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <Input
                  value={editPost.title}
                  onChange={(e) =>
                    setEditPost((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev,
                    )
                  }
                  placeholder="Title"
                />
                <Textarea
                  value={editPost.content}
                  onChange={(e) =>
                    setEditPost((prev) =>
                      prev ? { ...prev, content: e.target.value } : prev,
                    )
                  }
                  placeholder="Post text"
                />
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
                />

                {/* Image Controls */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" /> Post image
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <Button variant="outline">
                      <Wand2 className="w-4 h-4 mr-1" /> Edit image
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload or edit the post image.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between mt-4">
            <Button variant="destructive">
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
            <Button>
              <CheckCircle className="w-4 h-4 mr-1" /> Approve
            </Button>
          </DialogFooter>
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
      <Dialog open={showGeneratingLoader} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary"></div>
            </div>
            <DialogTitle className="text-center text-xl mb-2">
              🤖 Generating AI Posts
            </DialogTitle>
            <p className="text-center text-gray-600 mb-4">
              Our AI is analyzing your brand data and creating personalized post
              suggestions...
            </p>
            <p className="text-center text-sm text-gray-500 mb-4">
              This may take up to 10 minutes. Please don't close this window.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full animate-pulse"
                style={{ width: "66%" }}
              ></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
