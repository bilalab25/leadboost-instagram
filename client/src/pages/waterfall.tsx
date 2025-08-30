import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Target, ArrowRight, Zap, Upload, Settings, 
  Calendar, Eye, Download, Share2, BarChart3
} from "lucide-react";
import { 
  SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, 
  SiLinkedin, SiYoutube, SiX, SiTelegram 
} from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function LeadBoost() {
  const { language, isSpanish } = useLanguage();
  const [campaignIdea, setCampaignIdea] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    // Simulate generation process
    setTimeout(() => {
      setGenerating(false);
    }, 3000);
  };

  const platforms = [
    { name: "Instagram", icon: SiInstagram, color: "text-pink-500", posts: "3 posts" },
    { name: "TikTok", icon: SiTiktok, color: "text-gray-800", posts: "5 videos" },
    { name: "Facebook", icon: SiFacebook, color: "text-blue-600", posts: "2 posts" },
    { name: "WhatsApp", icon: SiWhatsapp, color: "text-green-500", posts: "1 status" },
    { name: "LinkedIn", icon: SiLinkedin, color: "text-blue-700", posts: "1 article" },
    { name: "YouTube", icon: SiYoutube, color: "text-red-600", posts: "1 short" },
    { name: "X (Twitter)", icon: SiX, color: "text-gray-800", posts: "3 tweets" },
    { name: "Telegram", icon: SiTelegram, color: "text-blue-500", posts: "2 posts" },
  ];

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
                    {isSpanish ? 'Sistema Lead Boost' : 'Lead Boost System'}
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
          
          {/* Campaign Input */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                {isSpanish ? 'Describe tu idea de campaña' : 'Describe your campaign idea'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {isSpanish ? 'Título de la campaña' : 'Campaign title'}
                </label>
                <Input 
                  placeholder={isSpanish ? 'Ej: Lanzamiento del nuevo producto' : 'e.g. New product launch'} 
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {isSpanish ? 'Descripción detallada' : 'Detailed description'}
                </label>
                <Textarea 
                  placeholder={isSpanish 
                    ? 'Describe tu campaña, público objetivo, mensaje clave, tono de voz...'
                    : 'Describe your campaign, target audience, key message, tone of voice...'
                  }
                  value={campaignIdea}
                  onChange={(e) => setCampaignIdea(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <Button 
                  size="lg" 
                  onClick={handleGenerate}
                  disabled={!campaignIdea.trim() || generating}
                  className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isSpanish ? 'Generando...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      {isSpanish ? 'Generar Campaña Lead Boost' : 'Generate Lead Boost Campaign'}
                    </>
                  )}
                </Button>
                
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  {isSpanish ? 'Subir Imágenes' : 'Upload Images'}
                </Button>
                
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  {isSpanish ? 'Configuración' : 'Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lead Boost Flow Visualization */}
          <div className="mb-8">
            <Card className="bg-gradient-to-br from-brand-50 to-purple-50 border-brand-200">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'El Proceso Lead Boost' : 'The Lead Boost Process'}
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
                      {platforms.slice(0, 8).map((platform, index) => (
                        <div key={index} className={`w-6 h-6 rounded flex items-center justify-center ${
                          platform.name === 'Instagram' ? 'bg-pink-500' :
                          platform.name === 'TikTok' ? 'bg-black' :
                          platform.name === 'Facebook' ? 'bg-blue-600' :
                          platform.name === 'WhatsApp' ? 'bg-green-500' :
                          platform.name === 'LinkedIn' ? 'bg-blue-700' :
                          platform.name === 'YouTube' ? 'bg-red-600' :
                          platform.name === 'X (Twitter)' ? 'bg-gray-800' :
                          'bg-blue-500'
                        }`}>
                          <platform.icon className="h-3 w-3 text-white" />
                        </div>
                      ))}
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
                  {platforms.map((platform, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center mb-2">
                        <platform.icon className={`h-5 w-5 mr-2 ${platform.color}`} />
                        <span className="font-medium text-sm">{platform.name}</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <p className="text-xs text-gray-500 mt-2">{platform.posts}</p>
                    </div>
                  ))}
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
        </main>
      </div>
    </div>
  );
}