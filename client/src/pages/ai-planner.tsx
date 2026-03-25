import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import { translations, industriesSpanish, seasonsSpanish, getTranslation } from "@/lib/translations";
import { useBrand } from "@/contexts/BrandContext";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertCircle, Bell, Bot, Calendar, Check, CheckCircle, Image, Lightbulb, Loader2, RefreshCw, Sparkles, TrendingUp, Users, Video, BarChart3, Instagram, Brain, Zap, Target, Wand2, Star, ChevronRight, ChevronLeft, ArrowRight, X, ExternalLink, Clock } from "lucide-react";
import { SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";
import { cn } from "@/lib/utils";
import { Link, useLocation, useSearch } from "wouter";

interface ContentPlan {
  id: string;
  title: string;
  month: number;
  year: number;
  strategy: string;
  insights: {
    insights: string[];
    recommendations: string[];
    posts: Array<{
      date: string;
      platform: string;
      contentType: string;
      title: string;
      description: string;
      hashtags: string[];
      optimalTime: string;
    }>;
  };
  status: "draft" | "approved" | "published";
  createdAt: string;
}

interface BusinessData {
  industry: string;
  topProducts: string[];
  salesData?: any;
  customerInsights?: any;
  seasonality: string;
}

interface AiGeneratedPost {
  id: string;
  jobId: string;
  brandId: string;
  platform: string;
  titulo: string;
  content: string | null;
  imageUrl: string | null;
  dia: string;
  hashtags: string | null;
  status: "pending" | "accepted" | "rejected";
  isSample?: boolean;
  createdAt: string;
}

interface PostGeneratorJob {
  id: string;
  brandId: string;
  status: "pending" | "processing" | "completed" | "failed";
  result: any;
  error: string | null;
  createdAt: string;
}

interface ValidationResult {
  valid: boolean;
  message?: string;
}

const platformColors = {
  instagram: "bg-pink-100 text-pink-800",
  whatsapp: "bg-green-100 text-green-800",
  tiktok: "bg-purple-100 text-purple-800",
  email: "bg-primary/10 text-primary",
  multi: "bg-red-100 text-red-800",
};

const industries = [
  "Retail & E-commerce",
  "Food & Beverage",
  "Beauty & Cosmetics",
  "Fashion & Apparel",
  "Health & Fitness",
  "Technology",
  "Professional Services",
  "Real Estate",
  "Travel & Tourism",
  "Education",
  "Other"
];

const seasons = [
  "Q1 - New Year & Spring",
  "Q2 - Spring & Summer",
  "Q3 - Summer & Back to School", 
  "Q4 - Fall & Holiday Season"
];

export default function AIPlanner() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const { activeBrand } = useBrand() as any;
  const queryClient = useQueryClient();
  const t = translations[language];
  
  const [businessData, setBusinessData] = useState<BusinessData>({
    industry: "",
    topProducts: [],
    seasonality: "",
  });
  const [newProduct, setNewProduct] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showPaymentRequiredModal, setShowPaymentRequiredModal] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  // Redirect to home if not authenticated
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

  const { data: contentPlans, isLoading: plansLoading } = useQuery<ContentPlan[]>({
    queryKey: ["/api/content-plans"],
    retry: false,
  });

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/content-plans/generate", {
        month: selectedMonth,
        year: selectedYear,
        businessData,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-plans"] });
      toast({
        title: "Success",
        description: "AI content plan generated successfully!",
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

  // Validate if post generation is available (brand design + social integrations)
  const { data: validationResult, isLoading: validationLoading } = useQuery<ValidationResult>({
    queryKey: ["/api/post-generator/validate", activeBrand?.id],
    queryFn: async () => {
      if (!activeBrand?.id) return { valid: false, message: "No brand selected" };
      const res = await fetch(`/api/post-generator/validate/${activeBrand.id}`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: !!activeBrand?.id,
    staleTime: 60000,
  });

  // Fetch AI generated posts for the current brand
  const { data: aiGeneratedPosts, isLoading: postsLoading, refetch: refetchPosts } = useQuery<AiGeneratedPost[]>({
    queryKey: ["/api/ai-generated-posts", activeBrand?.id],
    queryFn: async () => {
      if (!activeBrand?.id) return [];
      const res = await fetch(`/api/ai-generated-posts/${activeBrand.id}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!activeBrand?.id,
  });

  // Poll job status when generating
  const { data: jobStatus } = useQuery<PostGeneratorJob>({
    queryKey: ["/api/post-generator/jobs", currentJobId],
    queryFn: async () => {
      if (!currentJobId) return null;
      const res = await fetch(`/api/post-generator/jobs/${currentJobId}`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: pollingEnabled && !!currentJobId,
    refetchInterval: pollingEnabled ? 3000 : false,
  });

  // Handle job completion
  useEffect(() => {
    if (jobStatus?.status === "completed") {
      setPollingEnabled(false);
      setCurrentJobId(null);
      refetchPosts();
      toast({
        title: isSpanish ? "Publicaciones generadas" : "Posts Generated",
        description: isSpanish 
          ? "Tus publicaciones con IA han sido creadas exitosamente" 
          : "Your AI posts have been generated successfully",
      });
    } else if (jobStatus?.status === "failed") {
      setPollingEnabled(false);
      setCurrentJobId(null);
      toast({
        title: isSpanish ? "Error" : "Error",
        description: jobStatus.error || (isSpanish ? "Error al generar publicaciones" : "Failed to generate posts"),
        variant: "destructive",
      });
    }
  }, [jobStatus?.status, isSpanish, refetchPosts, toast]);

  // Check for showWelcome or showSamples query parameter from onboarding completion
  const [isShowingSamples, setIsShowingSamples] = useState(false);
  const [pendingShowSamples, setPendingShowSamples] = useState(false);
  const [pendingShowWelcome, setPendingShowWelcome] = useState(false);
  
  // Detect query params and store intent
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const showWelcome = params.get("showWelcome") === "true";
    const showSamples = params.get("showSamples") === "true";
    
    if (showWelcome || showSamples) {
      setPendingShowWelcome(showWelcome);
      setPendingShowSamples(showSamples);
      // Remove the query param from URL immediately
      setLocation("/ai-planner", { replace: true });
      // Force refetch to get latest posts
      refetchPosts();
    }
  }, [searchString, setLocation, refetchPosts]);
  
  // Open modal once posts are loaded and we have pending request
  useEffect(() => {
    if ((pendingShowWelcome || pendingShowSamples) && aiGeneratedPosts && aiGeneratedPosts.length > 0 && !postsLoading) {
      setIsShowingSamples(pendingShowSamples);
      setShowWelcomeModal(true);
      setCarouselIndex(0);
      setPendingShowWelcome(false);
      setPendingShowSamples(false);
    }
  }, [pendingShowWelcome, pendingShowSamples, aiGeneratedPosts, postsLoading]);

  // Get posts for the carousel - for sample posts, show all samples; otherwise show pending posts
  const samplePosts = aiGeneratedPosts?.filter(post => post.isSample) || [];
  const pendingPosts = aiGeneratedPosts?.filter(post => post.status === "pending") || [];
  const carouselPosts = isShowingSamples && samplePosts.length > 0 ? samplePosts : pendingPosts;

  // Carousel navigation
  const nextSlide = () => {
    if (carouselPosts.length > 0) {
      setCarouselIndex((prev) => (prev + 1) % carouselPosts.length);
    }
  };

  const prevSlide = () => {
    if (carouselPosts.length > 0) {
      setCarouselIndex((prev) => (prev - 1 + carouselPosts.length) % carouselPosts.length);
    }
  };

  // Start AI post generation
  const generatePostsMutation = useMutation({
    mutationFn: async () => {
      if (!activeBrand?.id) throw new Error("No brand selected");
      
      // Make request manually to handle 402 payment required
      const res = await fetch(`/api/post-generator/${activeBrand.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
        credentials: "include",
      });
      
      // Check for 402 status FIRST (before parsing JSON)
      if (res.status === 402) {
        throw new Error("PAYMENT_REQUIRED");
      }
      
      // Try to parse JSON response
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Error al procesar la respuesta del servidor");
      }
      
      if (!res.ok) {
        throw new Error(data.message || "Error generating posts");
      }
      
      return data;
    },
    onSuccess: (data) => {
      if (data.jobId) {
        setCurrentJobId(data.jobId);
        setPollingEnabled(true);
        toast({
          title: isSpanish ? "Generando publicaciones" : "Generating Posts",
          description: isSpanish 
            ? "Estamos creando tus publicaciones con IA. Esto puede tomar unos minutos..." 
            : "We're creating your AI posts. This may take a few minutes...",
        });
      }
    },
    onError: (error: Error) => {
      // Check if it's a payment required error
      if (error.message === "PAYMENT_REQUIRED") {
        setShowPaymentRequiredModal(true);
        return;
      }
      
      toast({
        title: isSpanish ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update post status (accept/reject)
  const updatePostStatusMutation = useMutation({
    mutationFn: async ({ postId, status }: { postId: string; status: "accepted" | "rejected" }) => {
      const response = await apiRequest("PATCH", `/api/ai-generated-posts/${postId}/status`, {
        status,
      });
      return response.json();
    },
    onSuccess: () => {
      refetchPosts();
      toast({
        title: isSpanish ? "Estado actualizado" : "Status Updated",
        description: isSpanish ? "El estado de la publicación ha sido actualizado" : "Post status has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isGenerating = generatePostsMutation.isPending || pollingEnabled;

  const addProduct = () => {
    if (newProduct.trim() && !businessData.topProducts.includes(newProduct.trim())) {
      setBusinessData(prev => ({
        ...prev,
        topProducts: [...prev.topProducts, newProduct.trim()]
      }));
      setNewProduct("");
    }
  };

  const removeProduct = (product: string) => {
    setBusinessData(prev => ({
      ...prev,
      topProducts: prev.topProducts.filter(p => p !== product)
    }));
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const currentPlan = contentPlans?.find(plan => 
    plan.month === selectedMonth && plan.year === selectedYear
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName={t.sidebar.aiPlanner} />
      
      {/* Payment Required Modal - Large and prominent */}
      <Dialog open={showPaymentRequiredModal} onOpenChange={setShowPaymentRequiredModal}>
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
                {isSpanish ? "¡Tus Créditos Gratuitos Se Agotaron!" : "Your Free Credits Are Used Up!"}
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
      
      {/* Welcome Carousel Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl md:text-3xl font-bold text-center text-white flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8" />
                {isSpanish ? "¡Tu contenido está listo!" : "Your content is ready!"}
              </DialogTitle>
              <DialogDescription className="text-center text-white/90 text-lg mt-2">
                {isSpanish 
                  ? "Hemos creado publicaciones personalizadas para tu marca. ¡Revísalas!" 
                  : "We've created personalized posts for your brand. Take a look!"}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {carouselPosts.length > 0 && (
            <div className="p-6">
              {/* Carousel */}
              <div className="relative">
                {/* Main Image */}
                <div className="relative aspect-square max-h-[400px] mx-auto rounded-xl overflow-hidden bg-gray-100 mb-4">
                  {carouselPosts[carouselIndex]?.imageUrl ? (
                    <img
                      src={carouselPosts[carouselIndex].imageUrl}
                      alt={carouselPosts[carouselIndex].titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Platform badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className={cn("text-sm font-semibold", platformColors[carouselPosts[carouselIndex]?.platform as keyof typeof platformColors] || "bg-gray-100 text-gray-800")}>
                      {carouselPosts[carouselIndex]?.platform === "instagram" && <SiInstagram className="w-3 h-3 mr-1" />}
                      {carouselPosts[carouselIndex]?.platform === "facebook" && <SiFacebook className="w-3 h-3 mr-1" />}
                      {carouselPosts[carouselIndex]?.platform === "tiktok" && <SiTiktok className="w-3 h-3 mr-1" />}
                      {carouselPosts[carouselIndex]?.platform}
                    </Badge>
                  </div>
                  
                  {/* Sample Post Badge */}
                  {carouselPosts[carouselIndex]?.isSample && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
                        <Star className="mr-1 h-3 w-3" />
                        {isSpanish ? "Muestra" : "Sample"}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Navigation Arrows */}
                {carouselPosts.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors"
                      data-testid="carousel-prev"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-colors"
                      data-testid="carousel-next"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Post Content */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900">
                    {carouselPosts[carouselIndex]?.titulo}
                  </h3>
                  {carouselPosts[carouselIndex]?.content && (
                    <p className="text-gray-600 line-clamp-3">
                      {carouselPosts[carouselIndex].content}
                    </p>
                  )}
                  {carouselPosts[carouselIndex]?.hashtags && (
                    <p className="text-indigo-600 text-sm">
                      {carouselPosts[carouselIndex].hashtags}
                    </p>
                  )}
                </div>

                {/* Dots indicator */}
                {carouselPosts.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {carouselPosts.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCarouselIndex(idx)}
                        className={cn(
                          "w-2.5 h-2.5 rounded-full transition-all",
                          idx === carouselIndex 
                            ? "bg-indigo-600 w-6" 
                            : "bg-gray-300 hover:bg-gray-400"
                        )}
                        data-testid={`carousel-dot-${idx}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Counter */}
              <p className="text-center text-gray-500 mt-4">
                {carouselIndex + 1} / {carouselPosts.length} {isSpanish ? "publicaciones" : "posts"}
              </p>

              {/* Action Button */}
              <div className="mt-6 text-center">
                <Button 
                  onClick={() => { setShowWelcomeModal(false); setIsShowingSamples(false); }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                  data-testid="button-view-calendar"
                >
                  {isSpanish ? "Ver Calendario de Contenido" : "View Content Calendar"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {carouselPosts.length === 0 && (
            <div className="p-6 text-center">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600 mb-4" />
              <p className="text-gray-600">
                {isSpanish ? "Cargando publicaciones..." : "Loading posts..."}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <div className="flex bg-gray-50">
        <Sidebar />
      
        {/* Main Content */}
        <div className="flex flex-col w-0 flex-1">

        {/* AI Planner Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-cyan-500 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 relative">
              <div className="text-center">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
                  <Brain className="mr-2 h-5 w-5" />
                  {t.aiPlanner.poweredByAI}
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">{t.aiPlanner.heroTitle}</h2>
                <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                  {t.aiPlanner.heroSubtitle}
                </p>
                <div className="mt-8">
                  <Button 
                    size="lg" 
                    className="bg-white text-brand-600 hover:bg-white/90 px-8 py-4 text-lg font-bold shadow-xl rounded-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Zap className="mr-2 h-6 w-6" />
                    Start Planning Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              
              <Tabs defaultValue="ai-posts" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="ai-posts" data-testid="tab-ai-posts" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {isSpanish ? "Publicaciones IA" : "AI Posts"}
                  </TabsTrigger>
                  <TabsTrigger value="generator" data-testid="tab-generator">{t.aiPlanner.contentGenerator}</TabsTrigger>
                  <TabsTrigger value="plans" data-testid="tab-plans">{t.aiPlanner.existingPlans}</TabsTrigger>
                  <TabsTrigger value="insights" data-testid="tab-insights">{t.aiPlanner.aiInsights}</TabsTrigger>
                </TabsList>

                {/* AI Posts Tab - Generate posts with Gemini */}
                <TabsContent value="ai-posts" className="space-y-6">
                  {/* Validation / Requirements Check */}
                  {!validationResult?.valid && !validationLoading && (
                    <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="bg-amber-100 p-3 rounded-xl">
                            <AlertCircle className="h-6 w-6 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              {isSpanish ? "Configuración requerida" : "Setup Required"}
                            </h3>
                            <p className="text-gray-700 mb-4">
                              {validationResult?.message || (isSpanish 
                                ? "Por favor completa la configuración antes de generar publicaciones con IA" 
                                : "Please complete setup before generating AI posts")}
                            </p>
                            <div className="flex flex-wrap gap-3">
                              <Link href="/brand-studio">
                                <Button variant="outline" className="border-amber-300 hover:bg-amber-100">
                                  <Wand2 className="mr-2 h-4 w-4" />
                                  {isSpanish ? "Crear Brand Design" : "Create Brand Design"}
                                </Button>
                              </Link>
                              <Link href="/integrations">
                                <Button variant="outline" className="border-amber-300 hover:bg-amber-100">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  {isSpanish ? "Conectar Instagram/Facebook" : "Connect Instagram/Facebook"}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Generation Controls */}
                  {validationResult?.valid && (
                    <Card className="border-2 border-brand-200 bg-gradient-to-r from-brand-50 to-purple-50">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-brand-600 to-purple-600 p-3 rounded-xl shadow-lg">
                              <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {isSpanish ? "Generador de Publicaciones con IA" : "AI Post Generator"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {isSpanish 
                                  ? "Genera publicaciones con imágenes personalizadas usando tu Brand Design e insights de Meta" 
                                  : "Generate posts with custom images using your Brand Design and Meta insights"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Select 
                                value={selectedMonth.toString()} 
                                onValueChange={(value) => setSelectedMonth(parseInt(value))}
                              >
                                <SelectTrigger className="w-32" data-testid="select-month-ai">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                      {new Date(2024, i).toLocaleString(isSpanish ? 'es' : 'en', { month: 'short' })}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select 
                                value={selectedYear.toString()} 
                                onValueChange={(value) => setSelectedYear(parseInt(value))}
                              >
                                <SelectTrigger className="w-24" data-testid="select-year-ai">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="2024">2024</SelectItem>
                                  <SelectItem value="2025">2025</SelectItem>
                                  <SelectItem value="2026">2026</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Button
                              onClick={() => generatePostsMutation.mutate()}
                              disabled={isGenerating || !validationResult?.valid}
                              className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white font-bold px-6 py-2 shadow-lg"
                              data-testid="button-generate-ai-posts"
                            >
                              {isGenerating ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  {isSpanish ? "Generando..." : "Generating..."}
                                </>
                              ) : (
                                <>
                                  <Brain className="mr-2 h-5 w-5" />
                                  {isSpanish ? "Generar Publicaciones" : "Generate Posts"}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {isGenerating && (
                          <div className="mt-4 p-4 bg-white/50 rounded-lg border border-brand-200">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
                                  <Loader2 className="h-6 w-6 text-brand-600 animate-spin" />
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {jobStatus?.status === "processing" 
                                    ? (isSpanish ? "Generando contenido e imágenes..." : "Generating content and images...")
                                    : (isSpanish ? "Iniciando generación..." : "Starting generation...")}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {isSpanish 
                                    ? "Esto puede tomar 2-3 minutos. No cierres esta página." 
                                    : "This may take 2-3 minutes. Please don't close this page."}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Generated Posts Grid */}
                  {postsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <div className="aspect-square bg-gray-200 animate-pulse" />
                          <CardContent className="p-4 space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : aiGeneratedPosts && aiGeneratedPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {aiGeneratedPosts.map((post) => (
                        <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                          {/* Image Section */}
                          <div className="relative aspect-square bg-gray-100">
                            {post.imageUrl ? (
                              <img 
                                src={post.imageUrl} 
                                alt={post.titulo}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                <Image className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            
                            {/* Platform Badge */}
                            <div className="absolute top-3 left-3">
                              <Badge className={cn(
                                "shadow-md",
                                post.platform === "instagram" && "bg-gradient-to-r from-pink-500 to-purple-500 text-white",
                                post.platform === "facebook" && "bg-blue-600 text-white",
                                post.platform === "tiktok" && "bg-black text-white"
                              )}>
                                {post.platform === "instagram" && <SiInstagram className="mr-1 h-3 w-3" />}
                                {post.platform === "facebook" && <SiFacebook className="mr-1 h-3 w-3" />}
                                {post.platform === "tiktok" && <SiTiktok className="mr-1 h-3 w-3" />}
                                {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                              </Badge>
                            </div>
                            
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                              <Badge className={cn(
                                post.status === "pending" && "bg-amber-100 text-amber-800",
                                post.status === "accepted" && "bg-green-100 text-green-800",
                                post.status === "rejected" && "bg-red-100 text-red-800"
                              )}>
                                {post.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                                {post.status === "accepted" && <CheckCircle className="mr-1 h-3 w-3" />}
                                {post.status === "rejected" && <X className="mr-1 h-3 w-3" />}
                                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                              </Badge>
                            </div>
                            
                            {/* AI Badge */}
                            <div className="absolute bottom-3 right-3">
                              <Badge className="bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md">
                                <Sparkles className="mr-1 h-3 w-3" />
                                AI
                              </Badge>
                            </div>
                            
                            {/* Sample Post Badge */}
                            {post.isSample && (
                              <div className="absolute bottom-3 left-3">
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
                                  <Star className="mr-1 h-3 w-3" />
                                  {isSpanish ? "Muestra" : "Sample"}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {/* Content Section */}
                          <CardContent className="p-4 space-y-3">
                            <div>
                              <h4 className="font-bold text-gray-900 line-clamp-1">{post.titulo}</h4>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(post.dia).toLocaleDateString(isSpanish ? 'es' : 'en', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            
                            {post.content && (
                              <p className="text-sm text-gray-600 line-clamp-3">{post.content}</p>
                            )}
                            
                            {post.hashtags && (
                              <p className="text-xs text-brand-600 line-clamp-1">{post.hashtags}</p>
                            )}
                            
                            {/* Action Buttons */}
                            {post.status === "pending" && (
                              <div className="flex gap-2 pt-2 border-t">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                                  onClick={() => updatePostStatusMutation.mutate({ postId: post.id, status: "accepted" })}
                                  disabled={updatePostStatusMutation.isPending}
                                  data-testid={`button-accept-${post.id}`}
                                >
                                  <Check className="mr-1 h-4 w-4" />
                                  {isSpanish ? "Aprobar" : "Accept"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => updatePostStatusMutation.mutate({ postId: post.id, status: "rejected" })}
                                  disabled={updatePostStatusMutation.isPending}
                                  data-testid={`button-reject-${post.id}`}
                                >
                                  <X className="mr-1 h-4 w-4" />
                                  {isSpanish ? "Rechazar" : "Reject"}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : validationResult?.valid && (
                    <Card className="border-2 border-dashed border-gray-200">
                      <CardContent className="p-12 text-center">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {isSpanish ? "No hay publicaciones generadas" : "No Generated Posts Yet"}
                        </h3>
                        <p className="text-gray-500 mb-4 max-w-md mx-auto">
                          {isSpanish 
                            ? "Haz clic en 'Generar Publicaciones' para crear contenido con IA basado en tu marca" 
                            : "Click 'Generate Posts' to create AI-powered content based on your brand"}
                        </p>
                        <Button
                          onClick={() => generatePostsMutation.mutate()}
                          disabled={isGenerating}
                          className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700"
                          data-testid="button-generate-first-posts"
                        >
                          <Brain className="mr-2 h-5 w-5" />
                          {isSpanish ? "Generar mi primer lote" : "Generate my first batch"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Content Generator Tab */}
                <TabsContent value="generator" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Business Data Input */}
                    <div className="lg:col-span-2">
                      <Card className="border-2 border-brand-200 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                        <CardHeader className="bg-gradient-to-r from-brand-50 to-cyan-50 group-hover:from-brand-100 group-hover:to-cyan-100 transition-all duration-300">
                          <CardTitle className="flex items-center text-lg">
                            <div className="bg-gradient-to-br from-brand-600 to-cyan-500 p-3 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-gray-900 font-bold text-xl">{t.aiPlanner.businessDataInput}</div>
                              <div className="text-sm text-gray-600 font-medium">{t.aiPlanner.businessDataSubtitle}</div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          
                          {/* Industry Selection */}
                          <div className="space-y-2">
                            <Label htmlFor="industry">{t.aiPlanner.industry}</Label>
                            <Select 
                              value={businessData.industry} 
                              onValueChange={(value) => setBusinessData(prev => ({ ...prev, industry: value }))}
                            >
                              <SelectTrigger data-testid="select-industry">
                                <SelectValue placeholder={t.aiPlanner.industryPlaceholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {(isSpanish ? industriesSpanish : industries).map((industry) => (
                                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Top Products */}
                          <div className="space-y-2">
                            <Label>{t.aiPlanner.topProducts}</Label>
                            <div className="flex space-x-2">
                              <Input
                                placeholder={t.aiPlanner.productPlaceholder}
                                value={newProduct}
                                onChange={(e) => setNewProduct(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addProduct()}
                                data-testid="input-new-product"
                              />
                              <Button onClick={addProduct} data-testid="button-add-product">{t.aiPlanner.addButton}</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {businessData.topProducts.map((product) => (
                                <Badge 
                                  key={product} 
                                  variant="secondary" 
                                  className="cursor-pointer hover:bg-red-100"
                                  onClick={() => removeProduct(product)}
                                  data-testid={`product-${product}`}
                                >
                                  {product} ×
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* POS Integration */}
                          <div className="space-y-4 bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border-2 border-emerald-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="bg-gradient-to-br from-emerald-600 to-green-600 p-2 rounded-lg mr-3">
                                  <BarChart3 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <div className="text-gray-900 font-bold text-lg">{t.aiPlanner.posIntegration}</div>
                                  <div className="text-sm text-gray-600">{t.aiPlanner.posSubtitle}</div>
                                </div>
                              </div>
                              <Badge className="bg-red-100 text-red-700">
                                {t.aiPlanner.posDisconnected}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {t.aiPlanner.posDataHelp}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <Button 
                                variant="outline" 
                                className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                                data-testid="button-connect-square"
                              >
                                <div className="w-4 h-4 bg-emerald-600 rounded mr-2"></div>
                                {t.aiPlanner.connectSquare}
                              </Button>
                              <Button 
                                variant="outline" 
                                className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                                data-testid="button-connect-shopify"
                              >
                                <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
                                {t.aiPlanner.connectShopify}
                              </Button>
                              <Button 
                                variant="outline" 
                                className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                                data-testid="button-connect-clover"
                              >
                                <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                                {t.aiPlanner.connectClover}
                              </Button>
                              <Button 
                                variant="outline" 
                                className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                                data-testid="button-connect-other"
                              >
                                <Target className="w-4 h-4 mr-2" />
                                {t.aiPlanner.connectOther}
                              </Button>
                            </div>
                            
                            <div className="bg-white/70 rounded-lg p-4 border border-emerald-100">
                              <h4 className="text-sm font-bold text-gray-900 mb-2">{t.aiPlanner.aiPosInsights}</h4>
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="text-center">
                                  <div className="text-emerald-600 font-bold text-lg">$0</div>
                                  <div className="text-gray-600">{t.aiPlanner.avgOrderValue}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-emerald-600 font-bold text-lg">0%</div>
                                  <div className="text-gray-600">{t.aiPlanner.recurrencyRate}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-emerald-600 font-bold text-lg">--</div>
                                  <div className="text-gray-600">{t.aiPlanner.peakSalesHours}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Seasonality */}
                          <div className="space-y-2">
                            <Label htmlFor="seasonality">{t.aiPlanner.seasonalFocus}</Label>
                            <Select 
                              value={businessData.seasonality} 
                              onValueChange={(value) => setBusinessData(prev => ({ ...prev, seasonality: value }))}
                            >
                              <SelectTrigger data-testid="select-seasonality">
                                <SelectValue placeholder={t.aiPlanner.seasonalPlaceholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {(isSpanish ? seasonsSpanish : seasons).map((season) => (
                                  <SelectItem key={season} value={season}>{season}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Month/Year Selection */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t.aiPlanner.month}</Label>
                              <Select 
                                value={selectedMonth.toString()} 
                                onValueChange={(value) => setSelectedMonth(parseInt(value))}
                              >
                                <SelectTrigger data-testid="select-month">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>{t.aiPlanner.year}</Label>
                              <Select 
                                value={selectedYear.toString()} 
                                onValueChange={(value) => setSelectedYear(parseInt(value))}
                              >
                                <SelectTrigger data-testid="select-year">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="2024">2024</SelectItem>
                                  <SelectItem value="2025">2025</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Generate Button */}
                          <div className="bg-gradient-to-r from-brand-50 to-cyan-50 p-6 rounded-xl border-2 border-brand-200 hover:border-brand-300 transition-colors duration-300">
                            <div className="flex items-center mb-4">
                              <Wand2 className="h-6 w-6 text-brand-600 mr-3" />
                              <span className="text-lg font-bold text-gray-900">{t.aiPlanner.readyToGenerate}</span>
                            </div>
                            <Button
                              onClick={() => generatePlanMutation.mutate()}
                              disabled={generatePlanMutation.isPending || !businessData.industry}
                              className="w-full bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600 text-white font-bold py-4 text-xl shadow-xl rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                              data-testid="button-generate-plan"
                            >
                              {generatePlanMutation.isPending ? (
                                <>
                                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                  <span>{t.aiPlanner.generatingText}</span>
                                </>
                              ) : (
                                <>
                                  <Brain className="mr-2 h-5 w-5" />
                                  <span>{t.aiPlanner.generateButton}</span>
                                  <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                              )}
                            </Button>
                            {!businessData.industry && (
                              <p className="text-sm text-brand-700 mt-3 text-center font-medium">
                                {t.aiPlanner.selectIndustryHint}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* AI Preview */}
                    <div>
                      <Card className="border-2 border-brand-200 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                        <CardHeader className="bg-gradient-to-r from-brand-50 to-cyan-50 group-hover:from-brand-100 group-hover:to-cyan-100 transition-all duration-300">
                          <CardTitle className="flex items-center text-lg">
                            <div className="bg-gradient-to-br from-brand-600 to-cyan-500 p-3 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Brain className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-gray-900 font-bold text-xl">{t.aiPlanner.aiStrategyPreview}</div>
                              <div className="text-sm text-gray-600 font-medium">{t.aiPlanner.aiStrategySubtitle}</div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {currentPlan ? (
                            <div className="space-y-4">
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <div className="bg-green-100 p-1.5 rounded-full mr-2">
                                      <Star className="h-4 w-4 text-green-600" />
                                    </div>
                                    <p className="text-sm text-green-800 font-semibold">{t.aiPlanner.aiStrategyGenerated}</p>
                                  </div>
                                  <Badge className="bg-green-100 text-green-800">
                                    <Zap className="mr-1 h-3 w-3" />
                                    {t.common.aiPowered}
                                  </Badge>
                                </div>
                                <p className="text-sm text-green-700 font-medium">
                                  {currentPlan.insights?.posts?.length || 0} {t.aiPlanner.postsPlanned} {new Date(selectedYear, selectedMonth - 1).toLocaleString(isSpanish ? 'es' : 'en', { month: 'long', year: 'numeric' })}
                                </p>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-white/50 rounded p-2">
                                    <Target className="h-3 w-3 text-green-600 mb-1" />
                                    <div className="font-medium text-green-800">{t.aiPlanner.platformMix}</div>
                                    <div className="text-green-600">Instagram, TikTok, Email</div>
                                  </div>
                                  <div className="bg-white/50 rounded p-2">
                                    <TrendingUp className="h-3 w-3 text-green-600 mb-1" />
                                    <div className="font-medium text-green-800">{t.aiPlanner.optimization}</div>
                                    <div className="text-green-600">{t.aiPlanner.peakEngagement}</div>
                                  </div>
                                </div>
                              </div>
                              
                              {currentPlan.insights?.insights && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Key Insights:</h4>
                                  {currentPlan.insights.insights.slice(0, 2).map((insight, index) => (
                                    <p key={index} className="text-xs text-gray-600" data-testid={`preview-insight-${index}`}>
                                      • {insight}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-6 rounded-xl mb-4">
                                <Brain className="mx-auto h-12 w-12 text-primary mb-4" />
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-gray-800" data-testid="text-no-preview">
                                    {t.aiPlanner.noPreview}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {t.aiPlanner.completeProfile}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-3 text-xs">
                                <div className="flex items-center justify-center text-gray-500">
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  Content themes based on your industry
                                </div>
                                <div className="flex items-center justify-center text-gray-500">
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  Platform-optimized posting schedule
                                </div>
                                <div className="flex items-center justify-center text-gray-500">
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  Trending hashtags and keywords
                                </div>
                                
                                {/* POS Enhancement Preview */}
                                <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                  <div className="flex items-center mb-2">
                                    <BarChart3 className="h-4 w-4 text-emerald-600 mr-2" />
                                    <span className="text-emerald-700 font-bold text-sm">With POS Data Integration</span>
                                  </div>
                                  <div className="space-y-1 text-emerald-600">
                                    <div className="flex items-center">
                                      <ChevronRight className="h-3 w-3 mr-1" />
                                      Campaigns based on best-selling products
                                    </div>
                                    <div className="flex items-center">
                                      <ChevronRight className="h-3 w-3 mr-1" />
                                      Peak sales hours for optimal posting
                                    </div>
                                    <div className="flex items-center">
                                      <ChevronRight className="h-3 w-3 mr-1" />
                                      Customer recurrency patterns analysis
                                    </div>
                                    <div className="flex items-center">
                                      <ChevronRight className="h-3 w-3 mr-1" />
                                      Profit margin-optimized promotions
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Existing Plans Tab */}
                <TabsContent value="plans" className="space-y-6">
                  {plansLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                          <CardHeader>
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
                              <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : contentPlans && contentPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {contentPlans.map((plan) => (
                        <Card key={plan.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{plan.title}</CardTitle>
                              <Badge 
                                className={cn(
                                  plan.status === "approved" ? "bg-green-100 text-green-800" :
                                  plan.status === "published" ? "bg-primary/10 text-primary" :
                                  "bg-gray-100 text-gray-800"
                                )}
                                data-testid={`plan-status-${plan.id}`}
                              >
                                {plan.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(plan.year, plan.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="text-sm">
                                <span className="font-medium">{plan.insights?.posts?.length || 0}</span> posts planned
                              </div>
                              
                              {plan.insights?.insights && (
                                <div>
                                  <h4 className="text-sm font-medium mb-1">AI Insights:</h4>
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {plan.insights.insights[0]}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(plan.createdAt).toLocaleDateString()}
                                </span>
                                <Button size="sm" variant="outline" data-testid={`button-view-plan-${plan.id}`}>
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-no-plans">
                          {t.aiPlanner.noPlanTitle}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {t.aiPlanner.noPlanText}
                        </p>
                        <Button 
                          onClick={() => {
                            // Switch to generator tab
                            const tab = document.querySelector('[data-state="active"][value="generator"]') as HTMLElement;
                            if (tab) tab.click();
                          }}
                          data-testid="button-create-first-plan"
                        >
                          {t.aiPlanner.createFirstPlan}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* AI Insights Tab */}
                <TabsContent value="insights" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Industry Trends */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                          {t.aiPlanner.industryTrends}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Video Content Dominance</p>
                              <p className="text-xs text-gray-600">Short-form videos see 2.5x higher engagement across all platforms</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Authentic Storytelling</p>
                              <p className="text-xs text-gray-600">Behind-the-scenes content drives 40% more customer trust</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Interactive Features</p>
                              <p className="text-xs text-gray-600">Polls, Q&As, and live sessions boost engagement by 65%</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Best Practices */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Users className="mr-2 h-5 w-5 text-primary" />
                          {t.aiPlanner.aiRecommendations}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Optimal Posting Times</p>
                              <p className="text-xs text-gray-600">Peak engagement: 6-8 PM on weekdays, 2-4 PM weekends</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Content Mix Strategy</p>
                              <p className="text-xs text-gray-600">70% educational, 20% promotional, 10% entertainment</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Cross-Platform Synergy</p>
                              <p className="text-xs text-gray-600">Repurpose content with platform-specific adaptations</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Content Performance */}
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BarChart3 className="mr-2 h-5 w-5 text-purple-600" />
                          Content Performance Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-pink-50 rounded-lg">
                            <Instagram className="mx-auto h-8 w-8 text-pink-500 mb-2" />
                            <p className="text-sm font-medium">Instagram</p>
                            <p className="text-xs text-gray-600">Visual storytelling performs best</p>
                            <p className="text-lg font-bold text-pink-600">85% engagement</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Video className="mx-auto h-8 w-8 text-purple-500 mb-2" />
                            <p className="text-sm font-medium">TikTok</p>
                            <p className="text-xs text-gray-600">Trending audio + content</p>
                            <p className="text-lg font-bold text-purple-600">92% reach</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <Users className="mx-auto h-8 w-8 text-green-500 mb-2" />
                            <p className="text-sm font-medium">WhatsApp</p>
                            <p className="text-xs text-gray-600">Direct customer support</p>
                            <p className="text-lg font-bold text-green-600">98% read rate</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
              
            </div>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
