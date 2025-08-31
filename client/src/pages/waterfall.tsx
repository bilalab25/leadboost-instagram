import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sparkles, Target, ArrowRight, Zap, Upload, Settings, 
  Calendar, Eye, Download, Share2, BarChart3, DollarSign, Users, Bot, Plus
} from "lucide-react";
import { 
  SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, 
  SiLinkedin, SiYoutube, SiX, SiTelegram, SiPinterest, SiSnapchat
} from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import { platformAdFormats, type AdFormat } from "@/constants/adFormats";

interface SelectedPlatform {
  platform: string;
  selectedFormats: string[];
  budget?: number;
  adType: 'organic' | 'paid' | 'both';
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
    status: 'draft' | 'scheduled' | 'published';
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
  "Other"
];

const seasons = [
  "Q1 - New Year & Spring",
  "Q2 - Spring & Summer", 
  "Q3 - Summer & Back to School",
  "Q4 - Fall & Holiday Season"
];

export default function CampAIgner() {
  const { language, isSpanish } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Campaign Creator State
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignIdea, setCampaignIdea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SelectedPlatform[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
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

  // Helper functions for planner
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

  const handleGenerate = () => {
    if (!campaignTitle.trim() || !campaignIdea.trim() || selectedPlatforms.length === 0) {
      return;
    }
    setGenerating(true);
    // Simulate generation process
    setTimeout(() => {
      setGenerating(false);
    }, 3000);
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
    const exists = selectedPlatforms.find(p => p.platform === platformName);
    
    if (exists) {
      setSelectedPlatforms(prev => prev.filter(p => p.platform !== platformName));
    } else {
      const platformData = platformAdFormats.find(p => p.platform === platformName);
      if (platformData) {
        setSelectedPlatforms(prev => [...prev, {
          platform: platformName,
          selectedFormats: [platformData.formats[0]?.id || ''],
          adType: 'both',
          budget: 100
        }]);
      }
    }
  };

  const updatePlatformFormat = (platformName: string, formatId: string, checked: boolean) => {
    setSelectedPlatforms(prev => prev.map(p => {
      if (p.platform === platformName) {
        if (checked) {
          return { ...p, selectedFormats: [...p.selectedFormats, formatId] };
        } else {
          return { ...p, selectedFormats: p.selectedFormats.filter(f => f !== formatId) };
        }
      }
      return p;
    }));
  };

  const updatePlatformAdType = (platformName: string, adType: 'organic' | 'paid' | 'both') => {
    setSelectedPlatforms(prev => prev.map(p => {
      if (p.platform === platformName) {
        return { ...p, adType };
      }
      return p;
    }));
  };

  const updatePlatformBudget = (platformName: string, budget: number) => {
    setSelectedPlatforms(prev => prev.map(p => {
      if (p.platform === platformName) {
        return { ...p, budget };
      }
      return p;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gray-900">
                    {isSpanish ? 'Conoce CampAIgner' : 'Meet CampAIgner'}
                  </h1>
                  <p className="text-brand-600 font-semibold">
                    {isSpanish ? 'Una idea → Todos lados' : 'One idea → Everywhere'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Tabbed Interface */}
          <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="campaigns" className="flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                {isSpanish ? 'Creador de Campañas' : 'Campaign Creator'}
              </TabsTrigger>
              <TabsTrigger value="planner" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {isSpanish ? 'Planificador 30 Días' : '30-Day Planner'}
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
                        {isSpanish ? '🚀 IA Hace Todo por Ti' : '🚀 AI Does Everything For You'}
                      </div>
                      <div className="text-sm text-brand-600 font-semibold">
                        {isSpanish ? 'Tus datos de negocio → IA crea campaña completa' : 'Your business data → AI creates complete campaign'}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center bg-white/70 rounded-xl p-6 border border-brand-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {isSpanish ? '⚡ Generación Automática Completa' : '⚡ Complete Auto-Generation'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {isSpanish 
                        ? 'IA analiza tus datos de POS y comportamiento del negocio para sugerir estrategias que maximizan ventas y ingresos. Selecciona plataformas, crea contenido y configura campañas basándose en lo que realmente funciona para tu negocio.'
                        : 'AI analyzes your POS data and business behavior to suggest strategies that maximize sales and revenue. Selects platforms, creates content, and sets up campaigns based on what actually works for your business.'
                      }
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <div className="font-semibold">{isSpanish ? 'Plataformas IA' : 'AI Platforms'}</div>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div className="font-semibold">{isSpanish ? 'Contenido IA' : 'AI Content'}</div>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Settings className="h-6 w-6 text-white" />
                        </div>
                        <div className="font-semibold">{isSpanish ? 'Formatos IA' : 'AI Formats'}</div>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div className="font-semibold">{isSpanish ? 'Presupuesto IA' : 'AI Budget'}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-lg font-bold text-gray-900 mb-3 block flex items-center">
                      <Bot className="mr-2 h-5 w-5 text-brand-600" />
                      {isSpanish ? 'Cuéntale a la IA sobre tu campaña:' : 'Tell AI about your campaign:'}
                    </label>
                    <Textarea 
                      placeholder={isSpanish 
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
                            description: "La IA ha creado tu campaña completa automáticamente",
                          });
                        }, 3000);
                      }}
                      className="bg-gradient-to-r from-brand-600 via-purple-600 to-cyan-600 hover:from-brand-700 hover:via-purple-700 hover:to-cyan-700 text-white font-bold py-4 px-12 text-xl rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 min-w-[300px]"
                      data-testid="button-generate-ai-campaign"
                    >
                      {generating ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          {isSpanish ? 'IA Generando Campaña...' : 'AI Generating Campaign...'}
                        </>
                      ) : (
                        <>
                          <Bot className="mr-3 h-6 w-6" />
                          {isSpanish ? '🚀 ¡IA, Crea Mi Campaña!' : '🚀 AI, Create My Campaign!'}
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
                  {isSpanish ? 'O personaliza manualmente' : 'OR customize manually'}
                </div>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Manual Campaign Input - Now Secondary */}
              <Card className="mb-8 border border-gray-300">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-600">
                    <Settings className="mr-2 h-5 w-5" />
                    {isSpanish ? 'Configuración Manual (Opcional)' : 'Manual Setup (Optional)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-6">
                    <div className="flex items-center mb-2">
                      <Bot className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">{isSpanish ? 'IA te ayuda con el diseño' : 'AI helps you with the design'}</span>
                    </div>
                    <p className="text-xs text-blue-700">{isSpanish ? 'Solo necesita tu idea, ¡la IA se encarga del resto!' : 'All it needs is your idea, AI handles the rest!'}</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {isSpanish ? 'Tu idea simple' : 'Your simple idea'}
                      </label>
                      <Input 
                        placeholder={isSpanish ? 'Ej: Quiero avisar que ahora abro los domingos' : 'e.g. I want to tell clients I open on Sundays now'} 
                        value={campaignTitle}
                        onChange={(e) => setCampaignTitle(e.target.value)}
                        className="w-full"
                        data-testid="input-campaign-title"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {isSpanish ? 'Tipo de contenido' : 'Content type'}
                      </label>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
                          {isSpanish ? 'Promocional' : 'Promotional'}
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-green-50">
                          {isSpanish ? 'Educativo' : 'Educational'}
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-purple-50">
                          {isSpanish ? 'Entretenimiento' : 'Entertainment'}
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
                  {isSpanish ? 'Selecciona plataformas' : 'Select platforms'}
                </div>
                <Badge variant="secondary">
                  {selectedPlatforms.length} {isSpanish ? 'seleccionadas' : 'selected'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
                {platformAdFormats.map((platform) => {
                  const Icon = platformIconMap[platform.platform];
                  const isSelected = selectedPlatforms.find(p => p.platform === platform.platform);
                  
                  return (
                    <div
                      key={platform.platform}
                      onClick={() => togglePlatform(platform.platform)}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:scale-105 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid={`platform-${platform.platform}`}
                    >
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-white shadow-sm">
                          <Icon className="h-5 w-5" style={{ color: platform.color }} />
                        </div>
                        <span className="font-semibold capitalize">{platform.platform}</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {platform.formats.length} {isSpanish ? 'formatos disponibles' : 'formats available'}
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
                      {isSpanish ? 'Configuración por plataforma' : 'Platform configuration'}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      data-testid="button-toggle-advanced"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {showAdvanced 
                        ? (isSpanish ? 'Ocultar' : 'Hide') 
                        : (isSpanish ? 'Configurar' : 'Configure')
                      }
                    </Button>
                  </div>

                  {showAdvanced && selectedPlatforms.map((selectedPlatform) => {
                    const platformData = platformAdFormats.find(p => p.platform === selectedPlatform.platform);
                    const Icon = platformIconMap[selectedPlatform.platform];
                    
                    if (!platformData) return null;

                    return (
                      <Card key={selectedPlatform.platform} className="border border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center">
                            <Icon className="h-5 w-5 mr-2" style={{ color: platformData.color }} />
                            <span className="capitalize">{selectedPlatform.platform}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Ad Type Selection */}
                          <div>
                            <Label className="text-sm font-medium">
                              {isSpanish ? 'Tipo de publicación' : 'Post type'}
                            </Label>
                            <div className="flex gap-2 mt-2">
                              {['organic', 'paid', 'both'].map((type) => (
                                <Button
                                  key={type}
                                  variant={selectedPlatform.adType === type ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => updatePlatformAdType(selectedPlatform.platform, type as any)}
                                  data-testid={`button-adtype-${type}`}
                                >
                                  {type === 'organic' && (isSpanish ? 'Orgánico' : 'Organic')}
                                  {type === 'paid' && (isSpanish ? 'Pagado' : 'Paid')}
                                  {type === 'both' && (isSpanish ? 'Ambos' : 'Both')}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Format Selection */}
                          <div>
                            <Label className="text-sm font-medium mb-3 block">
                              {isSpanish ? 'Formatos de anuncio' : 'Ad formats'}
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {platformData.formats
                                .filter(format => {
                                  if (selectedPlatform.adType === 'organic') return format.isOrganic;
                                  if (selectedPlatform.adType === 'paid') return format.isPaid;
                                  return true;
                                })
                                .map((format) => (
                                  <div key={format.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                    <Checkbox
                                      id={`${selectedPlatform.platform}-${format.id}`}
                                      checked={selectedPlatform.selectedFormats.includes(format.id)}
                                      onCheckedChange={(checked) => 
                                        updatePlatformFormat(selectedPlatform.platform, format.id, !!checked)
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
                                          <Badge variant="secondary" className="text-xs">
                                            <DollarSign className="h-3 w-3 mr-1" />
                                            {isSpanish ? 'Pagado' : 'Paid'}
                                          </Badge>
                                        )}
                                        {format.isOrganic && (
                                          <Badge variant="outline" className="text-xs">
                                            {isSpanish ? 'Orgánico' : 'Organic'}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Budget for Paid Formats */}
                          {selectedPlatform.adType !== 'organic' && (
                            <div>
                              <Label className="text-sm font-medium">
                                {isSpanish ? 'Presupuesto diario (USD)' : 'Daily budget (USD)'}
                              </Label>
                              <div className="flex items-center space-x-2 mt-2">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <Input
                                  type="number"
                                  min="10"
                                  max="10000"
                                  value={selectedPlatform.budget || 100}
                                  onChange={(e) => updatePlatformBudget(selectedPlatform.platform, parseInt(e.target.value) || 100)}
                                  className="w-32"
                                  data-testid={`input-budget-${selectedPlatform.platform}`}
                                />
                                <span className="text-sm text-gray-600">
                                  {isSpanish ? 'por día' : 'per day'}
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

          {/* Generate Campaign */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isSpanish ? '¿Listo para generar?' : 'Ready to generate?'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {isSpanish 
                      ? `Se crearán contenidos para ${selectedPlatforms.length} plataformas con formatos específicos.`
                      : `Content will be created for ${selectedPlatforms.length} platforms with specific formats.`
                    }
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleGenerate}
                  disabled={!campaignTitle.trim() || !campaignIdea.trim() || selectedPlatforms.length === 0 || generating}
                  className="bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600 text-white disabled:opacity-50"
                  data-testid="button-generate-campaign"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isSpanish ? 'Generando...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      {isSpanish ? 'CampAIgner' : 'CampAIgner'}
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
                    {isSpanish ? 'El Proceso CampAIgner' : 'The CampAIgner Process'}
                  </h2>
                  <p className="text-gray-600">
                    {isSpanish 
                      ? 'Tu idea se transforma automáticamente en contenido optimizado para cada plataforma'
                      : 'Your idea automatically transforms into optimized content for each platform'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  {/* Input */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-green-600 mb-1">
                      {isSpanish ? 'TU IDEA' : 'YOUR IDEA'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isSpanish ? 'Una descripción simple' : 'A simple description'}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-brand-400 hidden md:block" />
                  </div>
                  
                  {/* Output */}
                  <div className="text-center">
                    <div className="grid grid-cols-4 gap-1 mb-3 max-w-32 mx-auto">
                      {platformAdFormats.slice(0, 8).map((platform, index) => {
                        const Icon = platformIconMap[platform.platform];
                        return (
                          <div key={index} className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500">
                            {Icon && <Icon className="h-3 w-3 text-white" />}
                          </div>
                        );
                      })}
                    </div>
                    <h3 className="text-lg font-bold text-purple-600 mb-1">
                      {isSpanish ? 'CONTENIDO LISTO' : 'READY CONTENT'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isSpanish ? '21+ formatos perfectos' : '21+ perfect formats'}
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
                  {isSpanish ? 'Generando contenido...' : 'Generating content...'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedPlatforms.map((selectedPlatform, index) => {
                    const platformData = platformAdFormats.find(p => p.platform === selectedPlatform.platform);
                    const Icon = platformIconMap[selectedPlatform.platform];
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center mb-2">
                          {Icon && <Icon className="h-5 w-5 mr-2" style={{ color: platformData?.color }} />}
                          <span className="font-medium text-sm capitalize">{selectedPlatform.platform}</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <p className="text-xs text-gray-500 mt-2">
                          {selectedPlatform.selectedFormats.length} {isSpanish ? 'formatos' : 'formats'}
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
              <span className="font-medium">{isSpanish ? 'Programar' : 'Schedule'}</span>
              <span className="text-sm text-gray-500">{isSpanish ? 'Publicación automática' : 'Auto publishing'}</span>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col py-6">
              <Eye className="h-8 w-8 mb-2 text-green-500" />
              <span className="font-medium">{isSpanish ? 'Vista Previa' : 'Preview'}</span>
              <span className="text-sm text-gray-500">{isSpanish ? 'Ver antes de publicar' : 'Review before posting'}</span>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col py-6">
              <Download className="h-8 w-8 mb-2 text-purple-500" />
              <span className="font-medium">{isSpanish ? 'Descargar' : 'Download'}</span>
              <span className="text-sm text-gray-500">{isSpanish ? 'Exportar contenido' : 'Export content'}</span>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col py-6">
              <BarChart3 className="h-8 w-8 mb-2 text-orange-500" />
              <span className="font-medium">{isSpanish ? 'Analizar' : 'Analytics'}</span>
              <span className="text-sm text-gray-500">{isSpanish ? 'Métricas y rendimiento' : 'Metrics & performance'}</span>
            </Button>
          </div>
            </TabsContent>

            <TabsContent value="planner" className="space-y-0">
              {/* Hero Section */}
              <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-cyan-500 relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 mb-6">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute bottom-10 left-10 w-48 h-48 bg-white rounded-full blur-2xl"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 relative">
                  <div className="text-center">
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
                      <Bot className="mr-2 h-5 w-5" />
                      {isSpanish ? 'Impulsado por IA' : 'Powered by AI'}
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
                      {isSpanish ? 'Planificador Inteligente 30 Días' : 'Smart 30-Day Content Planner'}
                    </h2>
                    <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                      {isSpanish ? 'Crea estrategias de contenido personalizadas que impulsen tu negocio con inteligencia artificial' : 'Create personalized content strategies that boost your business with artificial intelligence'}
                    </p>
                    <div className="mt-8">
                      <Button 
                        size="lg" 
                        className="bg-white text-brand-600 hover:bg-white/90 px-8 py-4 text-lg font-bold shadow-xl rounded-2xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Zap className="mr-2 h-6 w-6" />
                        {isSpanish ? 'Comenzar Ahora' : 'Start Planning Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="space-y-6">
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
                            <div className="text-gray-900 font-bold text-xl">
                              {isSpanish ? 'Datos de tu Negocio' : 'Your Business Data'}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                              {isSpanish ? 'Cuéntanos sobre tu negocio para generar contenido personalizado' : 'Tell us about your business to generate personalized content'}
                            </div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        
                        {/* Industry Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="industry">{isSpanish ? 'Industria' : 'Industry'}</Label>
                          <Select 
                            value={businessData.industry} 
                            onValueChange={(value) => setBusinessData(prev => ({ ...prev, industry: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={isSpanish ? "Selecciona tu industria" : "Select your industry"} />
                            </SelectTrigger>
                            <SelectContent>
                              {industries.map((industry) => (
                                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Top Products */}
                        <div className="space-y-2">
                          <Label>{isSpanish ? 'Productos/Servicios Principales' : 'Top Products/Services'}</Label>
                          <div className="flex space-x-2">
                            <Input
                              placeholder={isSpanish ? "Ej: Facial antienvejecimiento" : "e.g. Anti-aging facial"}
                              value={newProduct}
                              onChange={(e) => setNewProduct(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addProduct()}
                            />
                            <Button onClick={addProduct}>{isSpanish ? 'Agregar' : 'Add'}</Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {businessData.topProducts.map((product) => (
                              <Badge 
                                key={product} 
                                variant="secondary" 
                                className="cursor-pointer hover:bg-red-100"
                                onClick={() => removeProduct(product)}
                              >
                                {product} ×
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Seasonality */}
                        <div className="space-y-2">
                          <Label>{isSpanish ? 'Estacionalidad' : 'Seasonality'}</Label>
                          <Select 
                            value={businessData.seasonality} 
                            onValueChange={(value) => setBusinessData(prev => ({ ...prev, seasonality: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={isSpanish ? "¿Cuándo es tu temporada alta?" : "When is your peak season?"} />
                            </SelectTrigger>
                            <SelectContent>
                              {seasons.map((season) => (
                                <SelectItem key={season} value={season}>{season}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* POS Integration */}
                        <div className="space-y-4 bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border-2 border-emerald-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="bg-gradient-to-br from-emerald-600 to-green-600 p-2 rounded-lg mr-3">
                                <BarChart3 className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="text-gray-900 font-bold text-lg">{isSpanish ? 'Integración POS' : 'POS Integration'}</div>
                                <div className="text-sm text-gray-600">{isSpanish ? 'Conecta tu sistema de ventas' : 'Connect your sales system'}</div>
                              </div>
                            </div>
                            <Badge className="bg-red-100 text-red-700">
                              {isSpanish ? 'Desconectado' : 'Disconnected'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {isSpanish ? 'Conecta tu POS para obtener datos reales de ventas y generar contenido más preciso basado en tus productos más vendidos.' : 'Connect your POS to get real sales data and generate more accurate content based on your best-selling products.'}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline" 
                              className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                            >
                              <div className="w-4 h-4 bg-emerald-600 rounded mr-2"></div>
                              {isSpanish ? 'Conectar Square' : 'Connect Square'}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                            >
                              <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
                              {isSpanish ? 'Conectar Shopify' : 'Connect Shopify'}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                            >
                              <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                              {isSpanish ? 'Conectar Clover' : 'Connect Clover'}
                            </Button>
                            <Button 
                              variant="outline" 
                              className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                            >
                              <Target className="w-4 h-4 mr-2" />
                              {isSpanish ? 'Otro Sistema' : 'Other System'}
                            </Button>
                          </div>
                          
                          <div className="bg-white/70 rounded-lg p-4 border border-emerald-100">
                            <h4 className="text-sm font-bold text-gray-900 mb-2">{isSpanish ? 'Insights de IA con POS' : 'AI POS Insights'}</h4>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div className="text-center">
                                <div className="text-emerald-600 font-bold text-lg">$0</div>
                                <div className="text-gray-600">{isSpanish ? 'Valor Promedio' : 'Avg Order Value'}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-emerald-600 font-bold text-lg">0</div>
                                <div className="text-gray-600">{isSpanish ? 'Productos Top' : 'Top Products'}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-emerald-600 font-bold text-lg">0%</div>
                                <div className="text-gray-600">{isSpanish ? 'Crecimiento' : 'Growth'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Generate Plan */}
                  <div>
                    <Card className="border-2 border-green-200 bg-green-50 shadow-xl">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                        <CardTitle className="flex items-center text-green-800">
                          <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-xl mr-3 shadow-lg">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-lg">{isSpanish ? 'Generar Plan' : 'Generate Plan'}</div>
                            <div className="text-sm text-green-600 font-medium">{isSpanish ? 'Crea tu estrategia' : 'Create your strategy'}</div>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            {isSpanish ? 'Mes' : 'Month'}
                          </Label>
                          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                            <SelectTrigger>
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

                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            {isSpanish ? 'Año' : 'Year'}
                          </Label>
                          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[2024, 2025, 2026].map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button 
                          onClick={() => generatePlanMutation.mutate()}
                          disabled={generatePlanMutation.isPending || !businessData.industry}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105"
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                          {generatePlanMutation.isPending 
                            ? (isSpanish ? 'Generando Plan IA...' : 'Generating AI Plan...') 
                            : (isSpanish ? 'Generar Plan IA' : 'Generate AI Plan')
                          }
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Existing Plans */}
                {contentPlans && contentPlans.length > 0 && (
                  <Card className="shadow-xl border-2 border-gray-200">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <CardTitle className="flex items-center">
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl mr-4 shadow-lg">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-gray-900 font-bold text-xl">
                            {isSpanish ? 'Planes Existentes' : 'Existing Plans'}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            {isSpanish ? 'Tus estrategias de contenido generadas' : 'Your generated content strategies'}
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {contentPlans.map((plan) => (
                          <Card key={plan.id} className="border-2 border-gray-200 hover:border-brand-300 hover:shadow-lg transition-all duration-300 group">
                            <CardHeader className="pb-3 group-hover:bg-brand-50 transition-all duration-300">
                              <CardTitle className="text-lg font-bold text-gray-900">{plan.title}</CardTitle>
                              <p className="text-sm text-brand-600 font-semibold">
                                {new Date(2024, plan.month - 1).toLocaleString('default', { month: 'long' })} {plan.year}
                              </p>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{plan.description}</p>
                              <div className="flex items-center justify-between">
                                <Badge className="bg-brand-100 text-brand-700 font-medium">
                                  {plan.posts.length} {isSpanish ? 'posts' : 'posts'}
                                </Badge>
                                <Button size="sm" className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white">
                                  {isSpanish ? 'Ver Detalles' : 'View Details'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}