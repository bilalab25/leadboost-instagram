import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Palette, Type, Image, Sparkles, Upload, Download, 
  Settings, Eye, Edit, Trash2, Plus, Link, Check 
} from "lucide-react";
import { Brush } from "lucide-react";

interface BrandDesign {
  id: string;
  brandStyle: string | null;
  colorPalette: any;
  typography: any;
  logoUrl: string | null;
  isDesignStudioEnabled: boolean;
  brandKit: any;
}

const brandStyles = [
  { id: "minimalist", name: "Minimalist", description: "Clean, simple, modern", color: "bg-gray-100" },
  { id: "luxury", name: "Luxury", description: "Elegant, premium, sophisticated", color: "bg-amber-100" },
  { id: "fun", name: "Fun & Playful", description: "Vibrant, energetic, creative", color: "bg-pink-100" },
  { id: "corporate", name: "Corporate", description: "Professional, trustworthy", color: "bg-blue-100" },
  { id: "creative", name: "Creative", description: "Artistic, unique, bold", color: "bg-purple-100" },
  { id: "bold", name: "Bold & Edgy", description: "Strong, impactful, modern", color: "bg-red-100" },
];

const colorPalettes = {
  minimalist: { primary: "#000000", secondary: "#666666", accent: "#ffffff", neutral: "#f5f5f5" },
  luxury: { primary: "#1a1a1a", secondary: "#d4af37", accent: "#ffffff", neutral: "#f8f8f8" },
  fun: { primary: "#ff6b6b", secondary: "#4ecdc4", accent: "#45b7d1", neutral: "#fff9e6" },
  corporate: { primary: "#2563eb", secondary: "#1e40af", accent: "#60a5fa", neutral: "#f1f5f9" },
  creative: { primary: "#8b5cf6", secondary: "#ec4899", accent: "#f59e0b", neutral: "#fdf4ff" },
  bold: { primary: "#dc2626", secondary: "#000000", accent: "#fbbf24", neutral: "#fef2f2" },
};

const fontPairings = {
  minimalist: { primary: "Inter", secondary: "Source Sans Pro" },
  luxury: { primary: "Playfair Display", secondary: "Lato" },
  fun: { primary: "Poppins", secondary: "Open Sans" },
  corporate: { primary: "Roboto", secondary: "Arial" },
  creative: { primary: "Montserrat", secondary: "Nunito" },
  bold: { primary: "Oswald", secondary: "Roboto Condensed" },
};

export default function BrandStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, isSpanish } = useLanguage();
  const queryClient = useQueryClient();
  
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [customColors, setCustomColors] = useState(colorPalettes.minimalist);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Fetch brand design
  const { data: brandDesign, isLoading } = useQuery<BrandDesign>({
    queryKey: ["/api/brand-design"],
    retry: false,
  });

  // Design Studio activation
  const activateDesignStudioMutation = useMutation({
    mutationFn: async () => {
      // Activate native LeadBoost Design Studio
      const response = await apiRequest("POST", "/api/brand-design/activate-studio");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-design"] });
      toast({
        title: isSpanish ? "¡Activado!" : "Activated!",
        description: isSpanish ? "Design Studio activado exitosamente" : "Design Studio activated successfully",
      });
    },
  });

  // Save brand design
  const saveBrandDesignMutation = useMutation({
    mutationFn: async (designData: any) => {
      const response = await apiRequest("POST", "/api/brand-design", designData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-design"] });
      toast({
        title: isSpanish ? "¡Guardado!" : "Saved!",
        description: isSpanish ? "Diseño de marca guardado" : "Brand design saved",
      });
    },
  });

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    setCustomColors(colorPalettes[styleId as keyof typeof colorPalettes]);
  };

  const handleSaveBrandDesign = () => {
    const designData = {
      brandStyle: selectedStyle,
      colorPalette: customColors,
      typography: fontPairings[selectedStyle as keyof typeof fontPairings],
      logoUrl: logoFile ? URL.createObjectURL(logoFile) : null,
    };
    saveBrandDesignMutation.mutate(designData);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <TopHeader pageName={isSpanish ? "Estudio de Marca" : "Brand Studio"} />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName={isSpanish ? "Estudio de Marca" : "Brand Studio"} />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
      
        <div className="flex flex-col w-0 flex-1 overflow-hidden">

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              
              <Tabs defaultValue="brand-identity" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="brand-identity" data-testid="tab-brand-identity">
                    {isSpanish ? "Identidad" : "Identity"}
                  </TabsTrigger>
                  <TabsTrigger value="design-editor" data-testid="tab-design-editor">
                    {isSpanish ? "Editor" : "Editor"}
                  </TabsTrigger>
                  <TabsTrigger value="assets" data-testid="tab-assets">
                    {isSpanish ? "Recursos" : "Assets"}
                  </TabsTrigger>
                  <TabsTrigger value="design-studio" data-testid="tab-design-studio">
                    Design Studio
                  </TabsTrigger>
                </TabsList>

                {/* Brand Identity Tab */}
                <TabsContent value="brand-identity" className="space-y-6">
                  
                  {/* Brand Style Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Sparkles className="mr-2 h-5 w-5" />
                        {isSpanish ? "Estilo de Marca" : "Brand Style"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {brandStyles.map((style) => (
                          <div
                            key={style.id}
                            onClick={() => handleStyleSelect(style.id)}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                              selectedStyle === style.id 
                                ? 'border-brand-500 ring-2 ring-brand-200' 
                                : 'border-gray-200'
                            } ${style.color}`}
                            data-testid={`style-${style.id}`}
                          >
                            <h3 className="font-semibold text-gray-900 mb-1">{style.name}</h3>
                            <p className="text-sm text-gray-600">{style.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Color Palette */}
                  {selectedStyle && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Palette className="mr-2 h-5 w-5" />
                          {isSpanish ? "Paleta de Colores" : "Color Palette"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {Object.entries(customColors).map(([key, color]) => (
                            <div key={key} className="space-y-2">
                              <Label className="capitalize">{key}</Label>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-12 h-12 rounded-lg border-2 border-gray-200"
                                  style={{ backgroundColor: color }}
                                />
                                <Input
                                  type="color"
                                  value={color}
                                  onChange={(e) => setCustomColors(prev => ({ ...prev, [key]: e.target.value }))}
                                  className="w-16 h-10 p-1"
                                  data-testid={`color-${key}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Typography */}
                  {selectedStyle && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Type className="mr-2 h-5 w-5" />
                          {isSpanish ? "Tipografía" : "Typography"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <Label>{isSpanish ? "Fuente Principal" : "Primary Font"}</Label>
                            <div 
                              className="mt-2 p-4 border rounded-lg text-2xl font-bold"
                              style={{ fontFamily: fontPairings[selectedStyle as keyof typeof fontPairings]?.primary }}
                            >
                              {fontPairings[selectedStyle as keyof typeof fontPairings]?.primary}
                            </div>
                          </div>
                          <div>
                            <Label>{isSpanish ? "Fuente Secundaria" : "Secondary Font"}</Label>
                            <div 
                              className="mt-2 p-4 border rounded-lg text-lg"
                              style={{ fontFamily: fontPairings[selectedStyle as keyof typeof fontPairings]?.secondary }}
                            >
                              {fontPairings[selectedStyle as keyof typeof fontPairings]?.secondary}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Logo Upload */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Image className="mr-2 h-5 w-5" />
                        Logo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <Label htmlFor="logo-upload" className="cursor-pointer">
                              <span className="font-medium text-brand-600 hover:text-brand-500">
                                {isSpanish ? "Subir logo" : "Upload logo"}
                              </span>
                              <input
                                id="logo-upload"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                data-testid="input-logo-upload"
                              />
                            </Label>
                          </div>
                          {logoFile && (
                            <div className="mt-4">
                              <Badge variant="secondary">{logoFile.name}</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveBrandDesign}
                      disabled={!selectedStyle || saveBrandDesignMutation.isPending}
                      className="bg-gradient-to-r from-brand-500 to-purple-600 text-white"
                      data-testid="button-save-brand-design"
                    >
                      {saveBrandDesignMutation.isPending 
                        ? (isSpanish ? "Guardando..." : "Saving...")
                        : (isSpanish ? "Guardar Diseño" : "Save Design")
                      }
                    </Button>
                  </div>
                </TabsContent>

                {/* Design Editor Tab */}
                <TabsContent value="design-editor" className="space-y-6">
                  
                  {/* Platform-Specific Templates */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Edit className="mr-2 h-5 w-5" />
                        {isSpanish ? "Plantillas por Plataforma" : "Platform Templates"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { platform: "Instagram Post", size: "1080×1080", color: "bg-gradient-to-br from-purple-500 to-pink-500" },
                          { platform: "Instagram Story", size: "1080×1920", color: "bg-gradient-to-br from-orange-500 to-red-500" },
                          { platform: "TikTok", size: "1080×1920", color: "bg-gradient-to-br from-black to-gray-800" },
                          { platform: "Facebook Post", size: "1200×630", color: "bg-gradient-to-br from-blue-600 to-blue-800" },
                          { platform: "LinkedIn", size: "1200×627", color: "bg-gradient-to-br from-blue-700 to-indigo-800" },
                          { platform: "YouTube Thumb", size: "1280×720", color: "bg-gradient-to-br from-red-600 to-red-800" },
                          { platform: "Email Header", size: "600×200", color: "bg-gradient-to-br from-green-600 to-emerald-700" },
                          { platform: "Pinterest", size: "1000×1500", color: "bg-gradient-to-br from-red-500 to-pink-600" },
                        ].map((template) => (
                          <div
                            key={template.platform}
                            className="group cursor-pointer"
                            data-testid={`template-${template.platform.toLowerCase().replace(' ', '-')}`}
                          >
                            <div className={`${template.color} rounded-lg p-6 mb-3 aspect-square flex items-center justify-center transition-transform group-hover:scale-105`}>
                              <div className="text-white text-center">
                                <h4 className="font-semibold text-sm">{template.platform}</h4>
                                <p className="text-xs opacity-90 mt-1">{template.size}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full">
                              <Plus className="mr-2 h-3 w-3" />
                              {isSpanish ? "Crear" : "Create"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Design Tools */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{isSpanish ? "Herramientas de Diseño" : "Design Tools"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
                          <Palette className="mx-auto h-8 w-8 text-brand-600 mb-3" />
                          <h4 className="font-semibold mb-2">{isSpanish ? "Paletas Pro" : "Pro Palettes"}</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            {isSpanish ? "Paletas profesionales para marcas de lujo" : "Professional palettes for luxury brands"}
                          </p>
                          <Button variant="outline" size="sm" data-testid="button-pro-palettes">
                            {isSpanish ? "Explorar" : "Explore"}
                          </Button>
                        </div>
                        
                        <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
                          <Type className="mx-auto h-8 w-8 text-brand-600 mb-3" />
                          <h4 className="font-semibold mb-2">{isSpanish ? "Tipografías Premium" : "Premium Fonts"}</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            {isSpanish ? "Fuentes de calidad para marcas exclusivas" : "Quality fonts for exclusive brands"}
                          </p>
                          <Button variant="outline" size="sm" data-testid="button-premium-fonts">
                            {isSpanish ? "Ver Catálogo" : "View Catalog"}
                          </Button>
                        </div>
                        
                        <div className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
                          <Sparkles className="mx-auto h-8 w-8 text-brand-600 mb-3" />
                          <h4 className="font-semibold mb-2">{isSpanish ? "IA Generativa" : "AI Generator"}</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            {isSpanish ? "Genera logos y diseños con IA" : "Generate logos and designs with AI"}
                          </p>
                          <Button variant="outline" size="sm" data-testid="button-ai-generator">
                            {isSpanish ? "Generar" : "Generate"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Assets Tab */}
                <TabsContent value="assets" className="space-y-6">
                  
                  {/* Logo Variations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Image className="mr-2 h-5 w-5" />
                        {isSpanish ? "Variaciones de Logo" : "Logo Variations"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { name: "Primary Logo", usage: "Main usage", bg: "bg-white" },
                          { name: "Logo Dark", usage: "Dark backgrounds", bg: "bg-gray-900" },
                          { name: "Logo Mark", usage: "Small spaces", bg: "bg-gray-100" },
                          { name: "Logo White", usage: "Light on dark", bg: "bg-brand-600" },
                        ].map((logo, index) => (
                          <div key={index} className="border rounded-lg overflow-hidden">
                            <div className={`${logo.bg} h-24 flex items-center justify-center`}>
                              <div className={`w-8 h-8 rounded ${logo.bg === 'bg-white' || logo.bg === 'bg-gray-100' ? 'bg-gray-400' : 'bg-white'}`} />
                            </div>
                            <div className="p-3">
                              <h4 className="font-medium text-sm">{logo.name}</h4>
                              <p className="text-xs text-gray-500">{logo.usage}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="flex items-center justify-center" data-testid="button-upload-logo">
                          <Upload className="mr-2 h-4 w-4" />
                          {isSpanish ? "Subir Nuevo Logo" : "Upload New Logo"}
                        </Button>
                        <Button variant="outline" className="flex items-center justify-center" data-testid="button-download-package">
                          <Download className="mr-2 h-4 w-4" />
                          {isSpanish ? "Descargar Paquete" : "Download Package"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Brand Guidelines */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{isSpanish ? "Guías de Marca" : "Brand Guidelines"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-3">{isSpanish ? "Espaciado y Proporción" : "Spacing & Proportion"}</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">{isSpanish ? "Margen mínimo del logo" : "Logo minimum margin"}</span>
                                <span className="text-sm font-medium">2x height</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">{isSpanish ? "Tamaño mínimo" : "Minimum size"}</span>
                                <span className="text-sm font-medium">24px height</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-3">{isSpanish ? "Uso de Color" : "Color Usage"}</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">{isSpanish ? "Color primario" : "Primary color"}</span>
                                <span className="text-sm font-medium">60% uso</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">{isSpanish ? "Color secundario" : "Secondary color"}</span>
                                <span className="text-sm font-medium">30% uso</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">{isSpanish ? "Color de acento" : "Accent color"}</span>
                                <span className="text-sm font-medium">10% uso</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <h4 className="font-semibold mb-3">{isSpanish ? "Lo que NO hacer" : "Don'ts"}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-800">
                                {isSpanish ? "❌ No distorsionar el logo" : "❌ Don't distort the logo"}
                              </p>
                            </div>
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-800">
                                {isSpanish ? "❌ No usar colores no aprobados" : "❌ Don't use unapproved colors"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Canva Sync Tab */}
                <TabsContent value="design-studio">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Brush className="mr-2 h-5 w-5" />
                        {isSpanish ? "LeadBoost Design Studio" : "LeadBoost Design Studio"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {brandDesign?.isDesignStudioEnabled ? (
                        <div className="space-y-6">
                          <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                            <Check className="h-5 w-5 text-green-500 mr-3" />
                            <span className="text-green-800 font-medium">
                              {isSpanish ? "Design Studio activado exitosamente" : "Design Studio activated successfully"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-brand-200 hover:border-brand-300 transition-colors">
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                  <Image className="mr-2 h-5 w-5 text-brand-600" />
                                  {isSpanish ? "Editor Visual" : "Visual Editor"}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-gray-600 mb-4">
                                  {isSpanish ? "Editor drag-and-drop profesional con IA integrada" : "Professional drag-and-drop editor with integrated AI"}
                                </p>
                                <Button className="w-full bg-gradient-to-r from-brand-500 to-brand-600">
                                  <Edit className="mr-2 h-4 w-4" />
                                  {isSpanish ? "Abrir Editor" : "Open Editor"}
                                </Button>
                              </CardContent>
                            </Card>

                            <Card className="border-purple-200 hover:border-purple-300 transition-colors">
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                  <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
                                  {isSpanish ? "IA Generativa" : "AI Generator"}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-gray-600 mb-4">
                                  {isSpanish ? "Genera imágenes y videos con IA para tus campañas" : "Generate AI images and videos for your campaigns"}
                                </p>
                                <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600">
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  {isSpanish ? "Generar IA" : "Generate AI"}
                                </Button>
                              </CardContent>
                            </Card>

                            <Card className="border-cyan-200 hover:border-cyan-300 transition-colors">
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                  <Type className="mr-2 h-5 w-5 text-cyan-600" />
                                  {isSpanish ? "Plantillas Pro" : "Pro Templates"}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-gray-600 mb-4">
                                  {isSpanish ? "Miles de plantillas profesionales para cada plataforma" : "Thousands of professional templates for every platform"}
                                </p>
                                <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600">
                                  <Eye className="mr-2 h-4 w-4" />
                                  {isSpanish ? "Ver Plantillas" : "View Templates"}
                                </Button>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="bg-gradient-to-r from-brand-50 to-cyan-50 p-6 rounded-lg border border-brand-200">
                            <h4 className="font-semibold text-brand-900 mb-2">
                              {isSpanish ? "🚀 Próximamente: Video IA" : "🚀 Coming Soon: AI Video"}
                            </h4>
                            <p className="text-brand-700">
                              {isSpanish ? "Creación automática de videos profesionales con avatares IA y efectos avanzados" : "Automatic professional video creation with AI avatars and advanced effects"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Brush className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {isSpanish ? "Activa Design Studio" : "Activate Design Studio"}
                          </h3>
                          <p className="text-gray-500 mb-6">
                            {isSpanish 
                              ? "Activa el estudio de diseño nativo de LeadBoost para crear contenido visual profesional sin depender de herramientas externas." 
                              : "Activate LeadBoost's native design studio to create professional visual content without relying on external tools."
                            }
                          </p>
                          <Button 
                            onClick={() => activateDesignStudioMutation.mutate()}
                            disabled={activateDesignStudioMutation.isPending}
                            className="bg-gradient-to-r from-brand-500 to-brand-600 text-white"
                          >
                            <Brush className="mr-2 h-4 w-4" />
                            {activateDesignStudioMutation.isPending 
                              ? (isSpanish ? "Activando..." : "Activating...")
                              : (isSpanish ? "Activar Design Studio" : "Activate Design Studio")
                            }
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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