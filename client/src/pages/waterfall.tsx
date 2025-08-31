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
              {/* Campaign Input */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                {isSpanish ? 'Describe tu idea de campaña' : 'Describe your campaign idea'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    {isSpanish ? 'Título de la campaña' : 'Campaign title'}
                  </label>
                  <Input 
                    placeholder={isSpanish ? 'Ej: Lanzamiento del nuevo producto' : 'e.g. New product launch'} 
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
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {isSpanish ? 'Descripción detallada' : 'Detailed description'}
                </label>
                <Textarea 
                  placeholder={isSpanish 
                    ? 'Describe tu campaña, público objetivo, mensaje clave, tono de voz, objetivos específicos...'
                    : 'Describe your campaign, target audience, key message, tone of voice, specific goals...'
                  }
                  value={campaignIdea}
                  onChange={(e) => setCampaignIdea(e.target.value)}
                  className="min-h-[120px]"
                  data-testid="textarea-campaign-description"
                />
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

            <TabsContent value="planner" className="space-y-8">
              {/* 30-Day Planner Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Business Data Input */}
                <div className="lg:col-span-2">
                  <Card className="border-2 border-brand-200 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bot className="mr-2 h-5 w-5 text-brand-600" />
                        {isSpanish ? 'Datos de tu Negocio' : 'Your Business Data'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          {isSpanish ? 'Industria' : 'Industry'}
                        </label>
                        <Select value={businessData.industry} onValueChange={(value) => setBusinessData(prev => ({ ...prev, industry: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder={isSpanish ? "Selecciona tu industria" : "Select your industry"} />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((industry) => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          {isSpanish ? 'Productos/Servicios Principales' : 'Top Products/Services'}
                        </label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder={isSpanish ? "Ej: Facial antienvejecimiento" : "e.g. Anti-aging facial"}
                            value={newProduct}
                            onChange={(e) => setNewProduct(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addProduct()}
                            className="flex-1"
                          />
                          <Button onClick={addProduct} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
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

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          {isSpanish ? 'Estacionalidad' : 'Seasonality'}
                        </label>
                        <Select value={businessData.seasonality} onValueChange={(value) => setBusinessData(prev => ({ ...prev, seasonality: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder={isSpanish ? "¿Cuándo es tu temporada alta?" : "When is your peak season?"} />
                          </SelectTrigger>
                          <SelectContent>
                            {seasons.map((season) => (
                              <SelectItem key={season} value={season}>
                                {season}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Generate Plan */}
                <div>
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-800">
                        {isSpanish ? 'Generar Plan' : 'Generate Plan'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          {isSpanish ? 'Mes' : 'Month'}
                        </label>
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
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          {isSpanish ? 'Año' : 'Year'}
                        </label>
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
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {generatePlanMutation.isPending 
                          ? (isSpanish ? 'Generando...' : 'Generating...') 
                          : (isSpanish ? 'Generar Plan IA' : 'Generate AI Plan')
                        }
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Existing Plans */}
              {contentPlans && contentPlans.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-brand-600" />
                      {isSpanish ? 'Planes Existentes' : 'Existing Plans'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {contentPlans.map((plan) => (
                        <Card key={plan.id} className="border border-gray-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{plan.title}</CardTitle>
                            <p className="text-sm text-gray-600">
                              {new Date(2024, plan.month - 1).toLocaleString('default', { month: 'long' })} {plan.year}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {plan.posts.length} {isSpanish ? 'posts' : 'posts'}
                              </span>
                              <Button size="sm" variant="outline">
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
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}