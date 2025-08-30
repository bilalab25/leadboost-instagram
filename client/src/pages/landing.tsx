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
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-brand-25 to-brand-100 relative overflow-hidden">
      {/* Header */}
      <header className="relative z-50 bg-gradient-to-br from-brand-50 via-brand-25 to-brand-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center space-x-3">
              <img 
                src={leadBoostLogo} 
                alt="CampAIgner Logo" 
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
                className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 text-white font-bold px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group border border-emerald-400/30"
                data-testid="button-pricing-cta"
                onClick={() => window.location.href = '/pricing'}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                <div className="absolute inset-0 rounded-full">
                  <div className="absolute top-1 right-2 w-1 h-1 bg-white rounded-full animate-ping opacity-75"></div>
                  <div className="absolute top-3 left-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute bottom-2 right-4 w-0.5 h-0.5 bg-emerald-200 rounded-full animate-ping" style={{animationDelay: '500ms'}}></div>
                </div>
                <span className="relative z-10 flex items-center">
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  {isSpanish ? '¡Ver Precios!' : 'See Pricing!'}
                </span>
              </Button>
              
              <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                {isSpanish ? 'Iniciar Sesión' : 'Sign In'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="py-16 text-center">
        <h1 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-4 leading-[0.9] tracking-tight">
          {isSpanish ? 'Conoce CampAIgner' : 'Meet CampAIgner'}
        </h1>
        <div className="text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-cyan-500 mb-8">
          {isSpanish ? 'Tu marca → EN TODOS LADOS' : 'Your brand → EVERYWHERE'}
        </div>
        <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed font-medium max-w-4xl mx-auto">
          {isSpanish ? 'CampAIgner transforma los datos de tu negocio en campañas poderosas — perfectamente dimensionadas para 21+ plataformas en un clic.' : 'CampAIgner transforms your business data into powerful campaigns — perfectly sized for 21+ platforms in one click.'}
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <img 
                src={leadBoostLogo} 
                alt="CampAIgner Logo" 
                className="h-96 w-auto object-contain"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
            <p className="text-gray-400 mb-6">
              {isSpanish ? 'La herramienta que revoluciona la gestión de redes sociales' : 'The tool that revolutionizes social media management'}
            </p>
            <div className="flex justify-center space-x-6">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                {isSpanish ? 'Política de Privacidad' : 'Privacy Policy'}
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                {isSpanish ? 'Términos de Servicio' : 'Terms of Service'}
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                {isSpanish ? 'Contacto' : 'Contact'}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}