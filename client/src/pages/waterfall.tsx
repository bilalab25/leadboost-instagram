import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Target,
  ArrowRight,
  Zap,
  Upload,
  Settings,
  Calendar,
  Eye,
  Download,
  Share2,
  BarChart3,
  DollarSign,
  Bot,
  TrendingUp,
  Globe,
  Flame,
  Video,
  Play,
  Film,
} from "lucide-react";
import {
  SiInstagram,
  SiTiktok,
  SiFacebook,
  SiLinkedin,
  SiYoutube,
  SiX,
  SiPinterest,
  SiSnapchat,
} from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { platformAdFormats, type AdFormat } from "@/constants/adFormats";
import ContentCalendar from "@/pages/calendar";

interface SelectedPlatform {
  platform: string;
  selectedFormats: string[];
  budget?: number;
  adType: "organic" | "paid" | "both";
}

interface BusinessData {
  industry: string;
  topProducts: string[];
  seasonality: string;
}

interface ContentPlan {
  id: string;
  title: string;
  description: string;
  month: number;
  year: number;
  posts: Array<{
    id: string;
    title: string;
    description: string;
    platform: string;
    scheduledDate: string;
    status: "draft" | "scheduled" | "published";
  }>;
  createdAt: string;
}

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
  "Other",
];

const seasons = [
  "Q1 - New Year & Spring",
  "Q2 - Spring & Summer",
  "Q3 - Summer & Back to School",
  "Q4 - Fall & Holiday Season",
];

export default function CampAIgner() {
  const { language, isSpanish } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Campaign Creator State
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignIdea, setCampaignIdea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    SelectedPlatform[]
  >([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Video Generation State
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoStyle, setVideoStyle] = useState("cinematic");
  const [videoDuration, setVideoDuration] = useState("5");
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");

  // 30-Day Planner State
  const [businessData, setBusinessData] = useState<BusinessData>({
    industry: "",
    topProducts: [],
    seasonality: "",
  });
  const [newProduct, setNewProduct] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Queries and Mutations
  const { data: contentPlans, isLoading: plansLoading } = useQuery<
    ContentPlan[]
  >({
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

  // Video Generation Mutation
  const generateVideoMutation = useMutation({
    mutationFn: async ({
      prompt,
      style,
      duration,
    }: {
      prompt: string;
      style: string;
      duration: string;
    }) => {
      const response = await apiRequest("POST", "/api/generate-video", {
        prompt,
        style,
        duration: parseInt(duration),
        aspectRatio: "16:9",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedVideoUrl(data.videoUrl);
      setGeneratingVideo(false);
      toast({
        title: isSpanish ? "¡Video Generado!" : "Video Generated!",
        description: isSpanish
          ? "Tu video está listo para usar en campañas"
          : "Your video is ready for campaign use",
      });
    },
    onError: (error: Error) => {
      setGeneratingVideo(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions for planner
  const addProduct = () => {
    if (
      newProduct.trim() &&
      !businessData.topProducts.includes(newProduct.trim())
    ) {
      setBusinessData((prev) => ({
        ...prev,
        topProducts: [...prev.topProducts, newProduct.trim()],
      }));
      setNewProduct("");
    }
  };

  const removeProduct = (product: string) => {
    setBusinessData((prev) => ({
      ...prev,
      topProducts: prev.topProducts.filter((p) => p !== product),
    }));
  };

  const handleGenerate = () => {
    if (
      !campaignTitle.trim() ||
      !campaignIdea.trim() ||
      selectedPlatforms.length === 0
    ) {
      return;
    }
    setGenerating(true);
    // Simulate generation process
    setTimeout(() => {
      setGenerating(false);
    }, 3000);
  };

  const handleGenerateVideo = () => {
    if (!videoPrompt.trim()) {
      toast({
        title: "Error",
        description: isSpanish
          ? "Por favor ingresa una descripción del video"
          : "Please enter a video description",
        variant: "destructive",
      });
      return;
    }

    setGeneratingVideo(true);
    generateVideoMutation.mutate({
      prompt: videoPrompt,
      style: videoStyle,
      duration: videoDuration,
    });
  };

  const platformIconMap: Record<string, any> = {
    instagram: SiInstagram,
    facebook: SiFacebook,
    tiktok: SiTiktok,
    youtube: SiYoutube,
    linkedin: SiLinkedin,
    twitter: SiX,
    pinterest: SiPinterest,
    snapchat: SiSnapchat,
  };

  const togglePlatform = (platformName: string) => {
    const exists = selectedPlatforms.find((p) => p.platform === platformName);

    if (exists) {
      setSelectedPlatforms((prev) =>
        prev.filter((p) => p.platform !== platformName),
      );
    } else {
      const platformData = platformAdFormats.find(
        (p) => p.platform === platformName,
      );
      if (platformData) {
        setSelectedPlatforms((prev) => [
          ...prev,
          {
            platform: platformName,
            selectedFormats: [platformData.formats[0]?.id || ""],
            adType: "both",
            budget: 100,
          },
        ]);
      }
    }
  };

  const updatePlatformFormat = (
    platformName: string,
    formatId: string,
    checked: boolean,
  ) => {
    setSelectedPlatforms((prev) =>
      prev.map((p) => {
        if (p.platform === platformName) {
          if (checked) {
            return { ...p, selectedFormats: [...p.selectedFormats, formatId] };
          } else {
            return {
              ...p,
              selectedFormats: p.selectedFormats.filter((f) => f !== formatId),
            };
          }
        }
        return p;
      }),
    );
  };

  const updatePlatformAdType = (
    platformName: string,
    adType: "organic" | "paid" | "both",
  ) => {
    setSelectedPlatforms((prev) =>
      prev.map((p) => {
        if (p.platform === platformName) {
          return { ...p, adType };
        }
        return p;
      }),
    );
  };

  const updatePlatformBudget = (platformName: string, budget: number) => {
    setSelectedPlatforms((prev) =>
      prev.map((p) => {
        if (p.platform === platformName) {
          return { ...p, budget };
        }
        return p;
      }),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader
        pageName={isSpanish ? "Conoce CampAIgner" : "Meet CampAIgner"}
      />
      <div className="flex bg-gray-50">
        <Sidebar />

        <div className="flex-1">
          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Tabbed Interface */}
            <Tabs defaultValue="campaigns" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="campaigns" className="flex items-center">
                  <Zap className="mr-2 h-4 w-4" />
                  {isSpanish ? "Creador de Campañas" : "Campaign Creator"}
                </TabsTrigger>
                <TabsTrigger value="planner" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  {isSpanish ? "Planificador 30 Días" : "30-Day Planner"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="campaigns" className="space-y-8">
                {/* AI-Powered Quick Campaign Generator */}
                <Card className="mb-8 border-2 border-brand-200 bg-gradient-to-r from-brand-50 to-purple-50 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-brand-100 to-purple-100">
                    <CardTitle className="flex items-center justify-center text-center">
                      <div className="bg-gradient-to-br from-brand-600 to-purple-600 p-3 rounded-xl mr-4 shadow-lg">
                        <Bot className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-gray-900">
                          {isSpanish
                            ? "🚀 IA Hace Todo por Ti"
                            : "🚀 AI Does Everything For You"}
                        </div>
                        <div className="text-sm text-brand-600 font-semibold">
                          {isSpanish
                            ? "Tus datos de negocio → IA crea campaña completa"
                            : "Your business data → AI creates complete campaign"}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center bg-white/70 rounded-xl p-6 border border-brand-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {isSpanish
                          ? "⚡ Generación Automática Completa"
                          : "⚡ Complete Auto-Generation"}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {isSpanish
                          ? "IA analiza tus datos de POS y comportamiento del negocio para sugerir estrategias que maximizan ventas y ingresos. Selecciona plataformas, crea contenido y configura campañas basándose en lo que realmente funciona para tu negocio."
                          : "AI analyzes your POS data and business behavior to suggest strategies that maximize sales and revenue. Selects platforms, creates content, and sets up campaigns based on what actually works for your business."}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Globe className="h-6 w-6 text-white" />
                          </div>
                          <div className="font-semibold">
                            {isSpanish ? "+21 Plataformas" : "+21 Platforms"}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Flame className="h-6 w-6 text-white" />
                          </div>
                          <div className="font-semibold">
                            {isSpanish ? "Campaña Viral" : "Viral Campaign"}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <TrendingUp className="h-6 w-6 text-white" />
                          </div>
                          <div className="font-semibold">
                            {isSpanish ? "Más Ventas" : "More Sales"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-lg font-bold text-gray-900 mb-3 block flex items-center">
                        <Bot className="mr-2 h-5 w-5 text-brand-600" />
                        {isSpanish
                          ? "Cuéntale a la IA sobre tu campaña:"
                          : "Tell AI about your campaign:"}
                      </label>
                      <Textarea
                        placeholder={
                          isSpanish
                            ? '💬 Ejemplo: "Quiero aumentar mis ventas pero no sé por dónde empezar. Mi negocio necesita más clientes y visibilidad." \n\n¡La IA se encarga del resto - selecciona plataformas, crea contenido, elige formatos!'
                            : '💬 Example: "I want to boost my sales but I don\'t know where to start. My business needs more customers and visibility." \n\nAI handles the rest - selects platforms, creates content, chooses formats!'
                        }
                        value={campaignIdea}
                        onChange={(e) => setCampaignIdea(e.target.value)}
                        className="min-h-[150px] text-lg border-2 border-brand-200 focus:border-brand-400"
                        data-testid="textarea-ai-campaign-input"
                      />
                    </div>

                    <div className="flex justify-center">
                      <Button
                        size="lg"
                        disabled={generating || !campaignIdea.trim()}
                        onClick={() => {
                          setGenerating(true);
                          // Simulate AI generation
                          setTimeout(() => {
                            setGenerating(false);
                            toast({
                              title: "¡Campaña Generada!",
                              description:
                                "La IA ha creado tu campaña completa automáticamente",
                            });
                          }, 3000);
                        }}
                        className="bg-gradient-to-r from-brand-600 via-purple-600 to-cyan-600 hover:from-brand-700 hover:via-purple-700 hover:to-cyan-700 text-white font-bold py-4 px-12 text-xl rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 min-w-[300px]"
                        data-testid="button-generate-ai-campaign"
                      >
                        {generating ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                            {isSpanish
                              ? "IA Generando Campaña..."
                              : "AI Generating Campaign..."}
                          </>
                        ) : (
                          <>
                            <Bot className="mr-3 h-6 w-6" />
                            {isSpanish
                              ? "🚀 ¡IA, Crea Mi Campaña!"
                              : "🚀 AI, Create My Campaign!"}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* OR Divider */}
                <div className="flex items-center justify-center my-8">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <div className="px-4 text-gray-500 font-medium bg-gray-50 rounded-full px-6 py-2">
                    {isSpanish
                      ? "O personaliza manualmente"
                      : "OR customize manually"}
                  </div>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Manual Campaign Input - Now Secondary */}
                <Card className="mb-8 border border-gray-300">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-600">
                      <Settings className="mr-2 h-5 w-5" />
                      {isSpanish
                        ? "Configuración Manual (Opcional)"
                        : "Manual Setup (Optional)"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-6">
                      <div className="flex items-center mb-2">
                        <Bot className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">
                          {isSpanish
                            ? "IA te ayuda con el diseño"
                            : "AI helps you with the design"}
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">
                        {isSpanish
                          ? "Solo necesita tu idea, ¡la IA se encarga del resto!"
                          : "All it needs is your idea, AI handles the rest!"}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          {isSpanish ? "Tu idea simple" : "Your simple idea"}
                        </label>
                        <Input
                          placeholder={
                            isSpanish
                              ? "Ej: Quiero avisar que ahora abro los domingos"
                              : "e.g. I want to tell clients I open on Sundays now"
                          }
                          value={campaignTitle}
                          onChange={(e) => setCampaignTitle(e.target.value)}
                          className="w-full"
                          data-testid="input-campaign-title"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          {isSpanish ? "Tipo de contenido" : "Content type"}
                        </label>
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-blue-50"
                          >
                            {isSpanish ? "Promocional" : "Promotional"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-green-50"
                          >
                            {isSpanish ? "Educativo" : "Educational"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-purple-50"
                          >
                            {isSpanish ? "Entretenimiento" : "Entertainment"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Selection */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Share2 className="mr-2 h-5 w-5" />
                        {isSpanish
                          ? "Selecciona plataformas"
                          : "Select platforms"}
                      </div>
                      <Badge variant="secondary">
                        {selectedPlatforms.length}{" "}
                        {isSpanish ? "seleccionadas" : "selected"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
                      {platformAdFormats.map((platform) => {
                        const Icon = platformIconMap[platform.platform];
                        const isSelected = selectedPlatforms.find(
                          (p) => p.platform === platform.platform,
                        );

                        return (
                          <div
                            key={platform.platform}
                            onClick={() => togglePlatform(platform.platform)}
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:scale-105 ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 shadow-lg"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            data-testid={`platform-${platform.platform}`}
                          >
                            <div className="flex items-center mb-2">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-white shadow-sm">
                                <Icon
                                  className="h-5 w-5"
                                  style={{ color: platform.color }}
                                />
                              </div>
                              <span className="font-semibold capitalize">
                                {platform.platform}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {platform.formats.length}{" "}
                              {isSpanish
                                ? "formatos disponibles"
                                : "formats available"}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Advanced Options for Selected Platforms */}
                    {selectedPlatforms.length > 0 && (
                      <div className="space-y-6 border-t pt-6">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">
                            {isSpanish
                              ? "Configuración por plataforma"
                              : "Platform configuration"}
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            data-testid="button-toggle-advanced"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            {showAdvanced
                              ? isSpanish
                                ? "Ocultar"
                                : "Hide"
                              : isSpanish
                                ? "Configurar"
                                : "Configure"}
                          </Button>
                        </div>

                        {showAdvanced &&
                          selectedPlatforms.map((selectedPlatform) => {
                            const platformData = platformAdFormats.find(
                              (p) => p.platform === selectedPlatform.platform,
                            );
                            const Icon =
                              platformIconMap[selectedPlatform.platform];

                            if (!platformData) return null;

                            return (
                              <Card
                                key={selectedPlatform.platform}
                                className="border border-gray-200"
                              >
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-lg flex items-center">
                                    <Icon
                                      className="h-5 w-5 mr-2"
                                      style={{ color: platformData.color }}
                                    />
                                    <span className="capitalize">
                                      {selectedPlatform.platform}
                                    </span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {/* Ad Type Selection */}
                                  <div>
                                    <Label className="text-sm font-medium">
                                      {isSpanish
                                        ? "Tipo de publicación"
                                        : "Post type"}
                                    </Label>
                                    <div className="flex gap-2 mt-2">
                                      {["organic", "paid", "both"].map(
                                        (type) => (
                                          <Button
                                            key={type}
                                            variant={
                                              selectedPlatform.adType === type
                                                ? "default"
                                                : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                              updatePlatformAdType(
                                                selectedPlatform.platform,
                                                type as any,
                                              )
                                            }
                                            data-testid={`button-adtype-${type}`}
                                          >
                                            {type === "organic" &&
                                              (isSpanish
                                                ? "Orgánico"
                                                : "Organic")}
                                            {type === "paid" &&
                                              (isSpanish ? "Pagado" : "Paid")}
                                            {type === "both" &&
                                              (isSpanish ? "Ambos" : "Both")}
                                          </Button>
                                        ),
                                      )}
                                    </div>
                                  </div>

                                  {/* Format Selection */}
                                  <div>
                                    <Label className="text-sm font-medium mb-3 block">
                                      {isSpanish
                                        ? "Formatos de anuncio"
                                        : "Ad formats"}
                                    </Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {platformData.formats
                                        .filter((format) => {
                                          if (
                                            selectedPlatform.adType ===
                                            "organic"
                                          )
                                            return format.isOrganic;
                                          if (
                                            selectedPlatform.adType === "paid"
                                          )
                                            return format.isPaid;
                                          return true;
                                        })
                                        .map((format) => (
                                          <div
                                            key={format.id}
                                            className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                                          >
                                            <Checkbox
                                              id={`${selectedPlatform.platform}-${format.id}`}
                                              checked={selectedPlatform.selectedFormats.includes(
                                                format.id,
                                              )}
                                              onCheckedChange={(checked) =>
                                                updatePlatformFormat(
                                                  selectedPlatform.platform,
                                                  format.id,
                                                  !!checked,
                                                )
                                              }
                                              data-testid={`checkbox-format-${format.id}`}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <Label
                                                htmlFor={`${selectedPlatform.platform}-${format.id}`}
                                                className="text-sm font-medium cursor-pointer"
                                              >
                                                {format.name}
                                              </Label>
                                              <p className="text-xs text-gray-600 mt-1">
                                                {format.description}
                                              </p>
                                              {format.dimensions && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                  📐 {format.dimensions}
                                                </p>
                                              )}
                                              <div className="flex gap-2 mt-2">
                                                {format.isPaid && (
                                                  <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                  >
                                                    <DollarSign className="h-3 w-3 mr-1" />
                                                    {isSpanish
                                                      ? "Pagado"
                                                      : "Paid"}
                                                  </Badge>
                                                )}
                                                {format.isOrganic && (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                  >
                                                    {isSpanish
                                                      ? "Orgánico"
                                                      : "Organic"}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>

                                  {/* Budget for Paid Formats */}
                                  {selectedPlatform.adType !== "organic" && (
                                    <div>
                                      <Label className="text-sm font-medium">
                                        {isSpanish
                                          ? "Presupuesto diario (USD)"
                                          : "Daily budget (USD)"}
                                      </Label>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <DollarSign className="h-4 w-4 text-gray-500" />
                                        <Input
                                          type="number"
                                          min="10"
                                          max="10000"
                                          value={selectedPlatform.budget || 100}
                                          onChange={(e) =>
                                            updatePlatformBudget(
                                              selectedPlatform.platform,
                                              parseInt(e.target.value) || 100,
                                            )
                                          }
                                          className="w-32"
                                          data-testid={`input-budget-${selectedPlatform.platform}`}
                                        />
                                        <span className="text-sm text-gray-600">
                                          {isSpanish ? "por día" : "per day"}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Midjourney Video Generation */}
                <Card className="mb-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                  <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100">
                    <CardTitle className="flex items-center text-lg">
                      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-3 rounded-xl mr-4 shadow-lg">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-gray-900 font-bold text-xl">
                          {isSpanish
                            ? "Generador de Videos AI"
                            : "AI Video Generator"}
                        </div>
                        <div className="text-sm text-purple-600 font-medium">
                          {isSpanish
                            ? "Powered by Midjourney"
                            : "Powered by Midjourney"}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-purple-200">
                      <div className="space-y-4">
                        {/* Video Prompt */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="video-prompt"
                            className="text-sm font-semibold text-gray-700"
                          >
                            {isSpanish
                              ? "Descripción del Video"
                              : "Video Description"}
                          </Label>
                          <textarea
                            id="video-prompt"
                            value={videoPrompt}
                            onChange={(e) => setVideoPrompt(e.target.value)}
                            placeholder={
                              isSpanish
                                ? "Describe el video que quieres crear, ej: 'Un video promocional de productos de belleza con ambiente elegante y colores suaves'"
                                : "Describe the video you want to create, e.g. 'A promotional video of beauty products with elegant atmosphere and soft colors'"
                            }
                            className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            data-testid="textarea-video-prompt"
                          />
                        </div>

                        {/* Video Style and Duration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                              {isSpanish ? "Estilo Visual" : "Visual Style"}
                            </Label>
                            <Select
                              value={videoStyle}
                              onValueChange={setVideoStyle}
                            >
                              <SelectTrigger data-testid="select-video-style">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cinematic">
                                  {isSpanish ? "Cinematográfico" : "Cinematic"}
                                </SelectItem>
                                <SelectItem value="commercial">
                                  {isSpanish ? "Comercial" : "Commercial"}
                                </SelectItem>
                                <SelectItem value="animated">
                                  {isSpanish ? "Animado" : "Animated"}
                                </SelectItem>
                                <SelectItem value="minimalist">
                                  {isSpanish ? "Minimalista" : "Minimalist"}
                                </SelectItem>
                                <SelectItem value="vibrant">
                                  {isSpanish ? "Vibrante" : "Vibrant"}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">
                              {isSpanish
                                ? "Duración (segundos)"
                                : "Duration (seconds)"}
                            </Label>
                            <Select
                              value={videoDuration}
                              onValueChange={setVideoDuration}
                            >
                              <SelectTrigger data-testid="select-video-duration">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3s</SelectItem>
                                <SelectItem value="5">5s</SelectItem>
                                <SelectItem value="10">10s</SelectItem>
                                <SelectItem value="15">15s</SelectItem>
                                <SelectItem value="30">30s</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Generate Video Button */}
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-gray-600">
                            {isSpanish
                              ? "Crea videos profesionales para tus campañas en segundos"
                              : "Create professional videos for your campaigns in seconds"}
                          </div>
                          <Button
                            onClick={handleGenerateVideo}
                            disabled={!videoPrompt.trim() || generatingVideo}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2 disabled:opacity-50"
                            data-testid="button-generate-video"
                          >
                            {generatingVideo ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {isSpanish ? "Generando..." : "Generating..."}
                              </>
                            ) : (
                              <>
                                <Film className="mr-2 h-4 w-4" />
                                {isSpanish ? "Generar Video" : "Generate Video"}
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Generated Video Preview */}
                        {generatedVideoUrl && (
                          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center mb-3">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                                <Play className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-green-800">
                                  {isSpanish
                                    ? "¡Video Generado!"
                                    : "Video Generated!"}
                                </h4>
                                <p className="text-sm text-green-600">
                                  {isSpanish
                                    ? "Tu video está listo para usar"
                                    : "Your video is ready to use"}
                                </p>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-green-300">
                              <video
                                src={generatedVideoUrl}
                                controls
                                className="w-full max-w-md mx-auto rounded-lg"
                                data-testid="video-preview"
                              />
                              <div className="mt-3 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    window.open(generatedVideoUrl, "_blank")
                                  }
                                  data-testid="button-download-video"
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  {isSpanish ? "Descargar" : "Download"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      generatedVideoUrl,
                                    );
                                    toast({
                                      title: isSpanish
                                        ? "Enlace copiado"
                                        : "Link copied",
                                      description: isSpanish
                                        ? "URL del video copiada al portapapeles"
                                        : "Video URL copied to clipboard",
                                    });
                                  }}
                                  data-testid="button-copy-video-link"
                                >
                                  <Share2 className="mr-2 h-4 w-4" />
                                  {isSpanish ? "Copiar Link" : "Copy Link"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Campaign */}
                <Card className="mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          {isSpanish
                            ? "¿Listo para generar?"
                            : "Ready to generate?"}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {isSpanish
                            ? `Se crearán contenidos para ${selectedPlatforms.length} plataformas con formatos específicos.`
                            : `Content will be created for ${selectedPlatforms.length} platforms with specific formats.`}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={handleGenerate}
                        disabled={
                          !campaignTitle.trim() ||
                          !campaignIdea.trim() ||
                          selectedPlatforms.length === 0 ||
                          generating
                        }
                        className="bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600 text-white disabled:opacity-50"
                        data-testid="button-generate-campaign"
                      >
                        {generating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {isSpanish ? "Generando..." : "Generating..."}
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            {isSpanish ? "CampAIgner" : "CampAIgner"}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* CampAIgner Flow Visualization */}
                <div className="mb-8">
                  <Card className="bg-gradient-to-br from-brand-50 to-purple-50 border-brand-200">
                    <CardContent className="p-8">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {isSpanish
                            ? "El Proceso CampAIgner"
                            : "The CampAIgner Process"}
                        </h2>
                        <p className="text-gray-600">
                          {isSpanish
                            ? "Tu idea se transforma automáticamente en contenido optimizado para cada plataforma"
                            : "Your idea automatically transforms into optimized content for each platform"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        {/* Input */}
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                            <Target className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-green-600 mb-1">
                            {isSpanish ? "TU IDEA" : "YOUR IDEA"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isSpanish
                              ? "Una descripción simple"
                              : "A simple description"}
                          </p>
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center">
                          <ArrowRight className="h-6 w-6 text-brand-400 hidden md:block" />
                        </div>

                        {/* Output */}
                        <div className="text-center">
                          <div className="grid grid-cols-4 gap-1 mb-3 max-w-32 mx-auto">
                            {platformAdFormats
                              .slice(0, 8)
                              .map((platform, index) => {
                                const Icon = platformIconMap[platform.platform];
                                return (
                                  <div
                                    key={index}
                                    className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500"
                                  >
                                    {Icon && (
                                      <Icon className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                          <h3 className="text-lg font-bold text-purple-600 mb-1">
                            {isSpanish ? "CONTENIDO LISTO" : "READY CONTENT"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isSpanish
                              ? "21+ formatos perfectos"
                              : "21+ perfect formats"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Generated Content Preview */}
                {generating && (
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle>
                        {isSpanish
                          ? "Generando contenido..."
                          : "Generating content..."}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {selectedPlatforms.map((selectedPlatform, index) => {
                          const platformData = platformAdFormats.find(
                            (p) => p.platform === selectedPlatform.platform,
                          );
                          const Icon =
                            platformIconMap[selectedPlatform.platform];
                          return (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                            >
                              <div className="flex items-center mb-2">
                                {Icon && (
                                  <Icon
                                    className="h-5 w-5 mr-2"
                                    style={{ color: platformData?.color }}
                                  />
                                )}
                                <span className="font-medium text-sm capitalize">
                                  {selectedPlatform.platform}
                                </span>
                              </div>
                              <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                              <p className="text-xs text-gray-500 mt-2">
                                {selectedPlatform.selectedFormats.length}{" "}
                                {isSpanish ? "formatos" : "formats"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-auto flex-col py-6">
                    <Calendar className="h-8 w-8 mb-2 text-blue-500" />
                    <span className="font-medium">
                      {isSpanish ? "Programar" : "Schedule"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {isSpanish ? "Publicación automática" : "Auto publishing"}
                    </span>
                  </Button>

                  <Button variant="outline" className="h-auto flex-col py-6">
                    <Eye className="h-8 w-8 mb-2 text-green-500" />
                    <span className="font-medium">
                      {isSpanish ? "Vista Previa" : "Preview"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {isSpanish
                        ? "Ver antes de publicar"
                        : "Review before posting"}
                    </span>
                  </Button>

                  <Button variant="outline" className="h-auto flex-col py-6">
                    <Download className="h-8 w-8 mb-2 text-purple-500" />
                    <span className="font-medium">
                      {isSpanish ? "Descargar" : "Download"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {isSpanish ? "Exportar contenido" : "Export content"}
                    </span>
                  </Button>

                  <Button variant="outline" className="h-auto flex-col py-6">
                    <BarChart3 className="h-8 w-8 mb-2 text-orange-500" />
                    <span className="font-medium">
                      {isSpanish ? "Analizar" : "Analytics"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {isSpanish
                        ? "Métricas y rendimiento"
                        : "Metrics & performance"}
                    </span>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="planner" className="space-y-0">
                <ContentCalendar />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}
