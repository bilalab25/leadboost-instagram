import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield, ArrowDown, ArrowRight, Sparkles, Target, Globe, TrendingUp, Play, Volume2, Settings, Maximize } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube, SiX } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";
import leadBoostLogo from "@assets/logo azul sin fondo_1756140873617.png";

export default function Landing() {
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-brand-25 to-brand-100">
      {/* Header */}
      <header className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center space-x-3">
              <img 
                src={leadBoostLogo} 
                alt="LeadBoost Logo" 
                className="h-[366px] w-auto object-contain"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={toggleLanguage}
                className="text-sm font-medium"
              >
                {isSpanish ? '🇺🇸 English' : '🇪🇸 Español'}
              </Button>
              
              <Button 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-full"
                onClick={() => window.location.href = '/pricing'}
              >
                {isSpanish ? '¡Ver Precios!' : 'See Pricing!'}
              </Button>
              
              <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                {isSpanish ? 'Iniciar Sesión' : 'Sign In'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-4">
            {isSpanish ? 'Conoce LeadBoost' : 'Meet LeadBoost'}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {isSpanish 
              ? 'LeadBoost transforma los datos de tu negocio en campañas poderosas usando CampAIgner — perfectamente dimensionadas para 21+ plataformas en un clic.'
              : 'LeadBoost transforms your business data into powerful campaigns using CampAIgner — perfectly sized for 21+ platforms in one click.'}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">
            {isSpanish ? 'Plataforma Completa' : 'Complete Platform'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-brand-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {isSpanish ? 'Bandeja Unificada' : 'Unified Inbox'}
              </h3>
              <p className="text-gray-600">
                {isSpanish ? 'Gestiona todos tus mensajes' : 'Manage all your messages'}
              </p>
            </Card>
            <Card className="p-8 text-center">
              <Bot className="h-12 w-12 text-brand-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {isSpanish ? 'IA Avanzada' : 'Advanced AI'}
              </h3>
              <p className="text-gray-600">
                {isSpanish ? 'Generación automática de contenido' : 'Automated content generation'}
              </p>
            </Card>
            <Card className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-brand-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">
                {isSpanish ? 'Analíticas' : 'Analytics'}
              </h3>
              <p className="text-gray-600">
                {isSpanish ? 'Métricas de rendimiento' : 'Performance metrics'}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img 
            src={leadBoostLogo} 
            alt="LeadBoost Logo" 
            className="h-24 w-auto mx-auto mb-4 object-contain"
          />
          <p className="text-gray-400 mb-6">
            {isSpanish 
              ? 'La herramienta que revoluciona la gestión de redes sociales'
              : 'The tool that revolutionizes social media management'}
          </p>
        </div>
      </footer>
    </div>
  );
}