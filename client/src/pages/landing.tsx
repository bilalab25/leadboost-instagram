import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquare, Bot, BarChart3, ArrowRight, Star, Check, Play, Zap, TrendingUp, Users, Globe, Shield, Clock, ChevronDown } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube, SiX } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { HelpDropdown } from "@/components/HelpDropdown";
import leadBoostLogo from "@assets/Lead Boost (500 x 200 px) (500 x 160 px)_1756873932398.png";

export default function Landing() {
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [circleScale, setCircleScale] = useState(0.1);
  const [, navigate] = useLocation();

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      const heroSection = document.querySelector('section');
      const circleSection = document.getElementById('circle-section');
      
      if (heroSection && circleSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const circleTop = circleSection.offsetTop;
        const circleBottom = circleTop + circleSection.offsetHeight;
        const scrollY = window.scrollY;
        
        // Calculate progress from end of hero to start of circle section
        const totalDistance = circleBottom - heroBottom;
        const currentProgress = Math.max(0, scrollY - heroBottom);
        const progress = Math.min(1, currentProgress / totalDistance);
        
        // Scale from 0.1 to 1.8 based on scroll progress (almost full screen)
        const newScale = 0.1 + (progress * 1.7);
        setCircleScale(newScale);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative text-gray-900 overflow-hidden" style={{backgroundColor: '#F8F8FA'}}>
      {/* Header */}
      <header className="relative z-50 backdrop-blur-md border-b border-gray-200 shadow-sm" style={{backgroundColor: 'rgba(248, 248, 250, 0.95)'}}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img 
                src={leadBoostLogo} 
                alt="CampAIgner" 
                className="h-8 w-auto" 
              />
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors p-0 h-auto"
                  >
                    {isSpanish ? 'Características' : 'Features'}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80">
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish ? 'Campañas IA Automatizadas' : 'AI Automated Campaigns'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish ? 'IA crea contenido basado en datos reales' : 'AI creates content based on real data'}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <MessageSquare className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish ? 'Bandeja Unificada' : 'Unified Inbox'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish ? 'Gestiona todos los mensajes desde un lugar' : 'Manage all messages from one place'}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish ? 'Análisis en Tiempo Real' : 'Real-Time Analytics'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish ? 'Métricas de ventas y ROI automáticas' : 'Automatic sales and ROI metrics'}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <Globe className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish ? '21+ Plataformas' : '21+ Platforms'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish ? 'Instagram, TikTok, Facebook, LinkedIn y más' : 'Instagram, TikTok, Facebook, LinkedIn and more'}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <Users className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish ? 'CRM Inteligente' : 'Smart CRM'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish ? 'Gestión automática de leads y clientes' : 'Automatic lead and customer management'}
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-start gap-3 p-4">
                    <Shield className="h-5 w-5 text-cyan-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {isSpanish ? 'Seguridad Empresarial' : 'Enterprise Security'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {isSpanish ? 'Cifrado, GDPR y backups automáticos' : 'Encryption, GDPR and automatic backups'}
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                {isSpanish ? 'Testimonios' : 'Testimonials'}
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                {isSpanish ? 'Precios' : 'Pricing'}
              </a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <HelpDropdown isSpanish={isSpanish} />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-gray-600 hover:text-gray-900"
              >
                <Globe className="h-4 w-4 mr-2" />
                {isSpanish ? 'EN' : 'ES'}
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
                data-testid="button-login"
                onClick={() => navigate("/login")}
              >
                {isSpanish ? 'Iniciar Sesión' : 'Login'}
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
                data-testid="button-header-cta"
                onClick={() => navigate("/login")}
              >
                {isSpanish ? 'Empezar Gratis' : 'Start Free'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Apple/Squarespace Inspired */}
      <section className="relative py-16 sm:py-20 lg:py-24 pb-4 overflow-hidden" style={{backgroundColor: '#F8F8FA'}}>
        
        {/* AI Assistant Background Figure */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none hidden lg:block">
          <div className="relative">
            <img 
              src={`/@assets/Gemini_Generated_Image_7mymyh7mymyh7mym_1757463993365.png`}
              alt="AI Assistant"
              className="w-96 h-96 object-contain"
            />
            {/* LeadBoost Arrows on the tablet */}
            <div className="absolute top-[45%] left-[35%] transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex items-center justify-center space-x-1">
                <div className="flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[8px] border-l-transparent border-r-transparent border-b-blue-600 animate-bounce"></div>
                  <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[6px] border-l-transparent border-r-transparent border-b-blue-600 animate-bounce" style={{animationDelay: '0.1s'}}></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[10px] border-l-transparent border-r-transparent border-b-green-600 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[8px] border-l-transparent border-r-transparent border-b-green-600 animate-bounce" style={{animationDelay: '0.3s'}}></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[12px] border-l-transparent border-r-transparent border-b-blue-600 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[10px] border-l-transparent border-r-transparent border-b-blue-600 animate-bounce" style={{animationDelay: '0.5s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 text-center z-10">
          {/* Trust Badge - Slogan Style */}
          <div className={`inline-flex items-center gap-3 mb-8 px-6 py-3 rounded-full border border-gray-200 shadow-lg transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{backgroundColor: '#F8F8FA'}}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
{isSpanish ? 'Tu Proceso Completo de Marketing, en IA' : 'Your Complete Marketing Process, on AI'}
            </span>
          </div>
          
          {/* Main Headline - Premium Typography */}
          <h1 className={`text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold leading-[0.9] tracking-tight mb-12 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-700 bg-clip-text text-transparent transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {isSpanish ? (
              <>
                Haz Crecer Tus Ventas,
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Automáticamente
                </span>
              </>
            ) : (
              <>
                Grow Your Sales,
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Automatically
                </span>
              </>
            )}
          </h1>
          
          {/* Subtitle - Enhanced */}
          <p className={`text-xl sm:text-2xl lg:text-3xl text-gray-600 mb-16 max-w-5xl mx-auto leading-relaxed font-light transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {isSpanish 
              ? 'La única plataforma que recopila tus datos empresariales, construye campañas inteligentes que se ejecutan automáticamente, y cierra ventas—todo sin esfuerzo manual.' 
              : 'The only platform that collects your business data, builds intelligent campaigns that run automatically, and closes sales—all without manual effort.'
            }
          </p>

          
          {/* Primary CTA - Apple Style */}
          <div className={`flex flex-col items-center gap-6 mb-20 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-16 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1"
              data-testid="button-start-free-trial"
              onClick={() => navigate("/login")}
            >
              {isSpanish ? 'Comenzar Gratis Ahora' : 'Start Free Now'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-gray-500 text-sm">
              {isSpanish ? 'Prueba gratis por 14 días • No se requiere tarjeta de crédito' : 'Free 14-day trial • No credit card required'}
            </p>
          </div>

        </div>
      </section>

      {/* AI Process Circle Section */}
      <section id="circle-section" className="relative pt-0 pb-8 overflow-hidden" style={{backgroundColor: '#F8F8FA'}}>
        
        {/* Background tech pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 25px 25px, #3b82f6 1px, transparent 1px)', backgroundSize: '50px 50px'}}></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animation: `float ${4 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>

        {/* Enhanced Circular AI Process */}
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 h-[600px] flex items-center justify-center">
          <div 
            className="transform transition-transform duration-700 ease-out"
            style={{ transform: `scale(${circleScale})` }}
          >
          
            {/* Center text with enhanced design */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
            <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {isSpanish ? 'más ventas' : 'more sales'}
            </div>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            <div className="text-sm text-gray-500 mt-3 font-medium">
              {isSpanish ? 'Resultado Final' : 'End Result'}
            </div>
          </div>

          {/* Step 1: Data Collection - Top center of circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group" style={{transform: 'translate(-50%, -50%) translateY(-240px)'}}>
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl hover:scale-110 transition-all duration-500 group-hover:shadow-blue-500/50">
              <div className="relative">
                <div className="w-5 h-5 bg-white rounded-lg shadow-inner"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-300 rounded-full animate-ping"></div>
              </div>
            </div>
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center w-32">
              <div className="text-sm font-mono text-blue-600 mb-2 font-bold">01</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isSpanish ? 'Recolección' : 'Data Collection'}
              </h3>
              <p className="text-xs text-gray-600 leading-tight">
                {isSpanish ? 'Captura automática de datos' : 'Auto capture business data'}
              </p>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-24 h-24 bg-blue-400 rounded-full opacity-20 animate-pulse group-hover:opacity-30 transition-opacity"></div>
          </div>

          {/* Step 2: AI Processing - Top right of circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group" style={{transform: 'translate(-50%, -50%) rotate(72deg) translateY(-240px) rotate(-72deg)'}}>
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl hover:scale-110 transition-all duration-500 group-hover:shadow-purple-500/50">
              <div className="relative">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse shadow-lg"></div>
                <div className="absolute inset-0 w-4 h-4 border-2 border-white/30 rounded-full animate-spin" style={{animationDuration: '3s'}}></div>
              </div>
            </div>
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center w-32">
              <div className="text-sm font-mono text-purple-600 mb-2 font-bold">02</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isSpanish ? 'Procesamiento IA' : 'AI Processing'}
              </h3>
              <p className="text-xs text-gray-600 leading-tight">
                {isSpanish ? 'Análisis inteligente' : 'Smart content creation'}
              </p>
            </div>
            <div className="absolute inset-0 w-24 h-24 bg-purple-400 rounded-full opacity-20 animate-pulse group-hover:opacity-30 transition-opacity"></div>
          </div>

          {/* Step 3: Campaign Deploy - Bottom right of circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group" style={{transform: 'translate(-50%, -50%) rotate(144deg) translateY(-240px) rotate(-144deg)'}}>
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl hover:scale-110 transition-all duration-500 group-hover:shadow-emerald-500/50">
              <div className="relative">
                <div className="w-5 h-3 bg-white rounded-lg shadow-inner"></div>
                {/* Signal waves */}
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`absolute -top-1 -right-1 w-3 h-3 border border-white/60 rounded-full animate-ping`} style={{
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: '2s'
                  }}></div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center w-32">
              <div className="text-sm font-mono text-emerald-600 mb-2 font-bold">03</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isSpanish ? 'Despliegue' : 'Campaign Deploy'}
              </h3>
              <p className="text-xs text-gray-600 leading-tight">
                {isSpanish ? 'Publicación multicanal' : '21+ platform publishing'}
              </p>
            </div>
            <div className="absolute inset-0 w-24 h-24 bg-emerald-400 rounded-full opacity-20 animate-pulse group-hover:opacity-30 transition-opacity"></div>
          </div>

          {/* Step 4: Sales Conversion - Bottom left of circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group" style={{transform: 'translate(-50%, -50%) rotate(216deg) translateY(-240px) rotate(-216deg)'}}>
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl hover:scale-110 transition-all duration-500 group-hover:shadow-orange-500/50">
              <div className="relative">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-white rounded-full shadow-inner animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-3 bg-white/80 rounded-lg"></div>
              </div>
            </div>
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center w-32">
              <div className="text-sm font-mono text-orange-600 mb-2 font-bold">04</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isSpanish ? 'Conversión' : 'Sales Conversion'}
              </h3>
              <p className="text-xs text-gray-600 leading-tight">
                {isSpanish ? 'Chat bot inteligente' : 'AI chatbot closes deals'}
              </p>
            </div>
            <div className="absolute inset-0 w-24 h-24 bg-orange-400 rounded-full opacity-20 animate-pulse group-hover:opacity-30 transition-opacity"></div>
          </div>

          {/* Step 5: Customer Retention - Top left of circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group" style={{transform: 'translate(-50%, -50%) rotate(288deg) translateY(-240px) rotate(-288deg)'}}>
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-2xl hover:scale-110 transition-all duration-500 group-hover:shadow-indigo-500/50">
              <div className="relative">
                <div className="w-5 h-5 border-3 border-white rounded-full shadow-inner"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center w-32">
              <div className="text-sm font-mono text-indigo-600 mb-2 font-bold">05</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isSpanish ? 'Retención' : 'Customer Retention'}
              </h3>
              <p className="text-xs text-gray-600 leading-tight">
                {isSpanish ? 'Re-targeting automático' : 'Smart retargeting campaigns'}
              </p>
            </div>
            <div className="absolute inset-0 w-24 h-24 bg-indigo-400 rounded-full opacity-20 animate-pulse group-hover:opacity-30 transition-opacity"></div>
          </div>

          {/* Enhanced circle paths with multiple rings */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-[480px] h-[480px] border-2 border-gray-300/50 rounded-full"></div>
            <div className="absolute inset-0 w-[480px] h-[480px] border border-blue-200/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-4 w-[464px] h-[464px] border border-purple-200/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>

          {/* Enhanced connecting flow arrows */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="absolute" style={{
                top: '50%', 
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 72 + 36}deg) translateY(-210px) rotate(-${i * 72 + 36}deg)`
              }}>
                <div className="flex items-center">
                  <div className="w-8 h-px bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" style={{animationDelay: `${i * 0.4}s`}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-1" style={{
                    animationDelay: `${i * 0.4}s`,
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
          </div>

        </div>
      </section>

      {/* Meet LeadBoost Section */}
      <section className="relative py-24" style={{backgroundColor: '#F8F8FA'}}>
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
              {isSpanish ? 'Conoce LeadBoost' : 'Meet LeadBoost'}
            </span>
            <span className="text-gray-900">
              {isSpanish 
                ? ', el primer motor de marketing IA integral del mundo: analizando, creando, publicando, convirtiendo y cerrando—todo por ti.'
                : ', the world\'s first end-to-end AI marketing engine: analyzing, creating, posting, converting, and closing—all for you.'
              }
            </span>
          </h2>
        </div>
      </section>

      {/* Interactive Demo Section - Premium Style */}
      <section className="relative py-32 bg-gradient-to-b from-blue-50/30 via-white to-slate-50/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          {/* Demo Container with Premium Styling */}
          <div className="backdrop-blur-sm border border-white/50 rounded-3xl shadow-2xl p-8 lg:p-12" style={{backgroundColor: 'rgba(248, 248, 250, 0.8)'}}>
            <InteractiveDemo isSpanish={isSpanish} />
          </div>
        </div>
      </section>

      {/* Features Section - Squarespace Style */}
      <section className="relative py-32 bg-gradient-to-b via-slate-50/30" style={{backgroundColor: '#F8F8FA'}}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-b from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
              {isSpanish ? 'Todo Lo Que Necesitas Para Vender Más' : 'Everything You Need To Sell More'}
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto font-light leading-relaxed">
              {isSpanish 
                ? 'Una plataforma completa que automatiza tu marketing y ventas mientras tú te enfocas en hacer crecer tu negocio.'
                : 'A complete platform that automates your marketing and sales while you focus on growing your business.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            <div className="group backdrop-blur-sm border border-white/40 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2" style={{backgroundColor: 'rgba(248, 248, 250, 0.7)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.7)'}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 group-hover:text-blue-600 transition-colors duration-300">
                {isSpanish ? 'Campañas IA Automatizadas' : 'AI Automated Campaigns'}
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {isSpanish 
                  ? 'IA crea y publica contenido de marketing basado en datos reales de tu negocio - inventario, ventas, eventos.'
                  : 'AI creates and posts marketing content based on real business data - inventory, sales, events.'
                }
              </p>
            </div>

            <div className="group backdrop-blur-sm border border-white/40 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2" style={{backgroundColor: 'rgba(248, 248, 250, 0.7)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.7)'}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 group-hover:text-green-600 transition-colors duration-300">
                {isSpanish ? 'Bandeja de Entrada Unificada' : 'Unified Inbox'}
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {isSpanish 
                  ? 'Gestiona todos los mensajes de redes sociales desde un solo lugar con respuestas automáticas inteligentes.'
                  : 'Manage all social media messages from one place with intelligent automatic responses.'
                }
              </p>
            </div>

            <div className="group backdrop-blur-sm border border-white/40 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2" style={{backgroundColor: 'rgba(248, 248, 250, 0.7)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.7)'}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 group-hover:text-purple-600 transition-colors duration-300">
                {isSpanish ? 'Análisis en Tiempo Real' : 'Real-Time Analytics'}
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {isSpanish 
                  ? 'Dashboard con métricas de ventas, engagement y ROI para optimizar tu estrategia automáticamente.'
                  : 'Dashboard with sales, engagement and ROI metrics to optimize your strategy automatically.'
                }
              </p>
            </div>

            <div className="group backdrop-blur-sm border border-white/40 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2" style={{backgroundColor: 'rgba(248, 248, 250, 0.7)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.7)'}>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 group-hover:text-orange-600 transition-colors duration-300">
                {isSpanish ? '21+ Plataformas Conectadas' : '21+ Connected Platforms'}
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {isSpanish 
                  ? 'Publica automáticamente en Instagram, Facebook, TikTok, LinkedIn y más plataformas simultáneamente.'
                  : 'Automatically post to Instagram, Facebook, TikTok, LinkedIn and more platforms simultaneously.'
                }
              </p>
            </div>

            <div className="group backdrop-blur-sm border border-white/40 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2" style={{backgroundColor: 'rgba(248, 248, 250, 0.7)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.7)'}>
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 group-hover:text-red-600 transition-colors duration-300">
                {isSpanish ? 'CRM Inteligente' : 'Smart CRM'}
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {isSpanish 
                  ? 'Gestión automática de leads y clientes con seguimiento inteligente y nurturing personalizado.'
                  : 'Automatic lead and customer management with intelligent tracking and personalized nurturing.'
                }
              </p>
            </div>

            <div className="group backdrop-blur-sm border border-white/40 rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2" style={{backgroundColor: 'rgba(248, 248, 250, 0.7)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.7)'}>
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 group-hover:text-cyan-600 transition-colors duration-300">
                {isSpanish ? 'Seguridad Empresarial' : 'Enterprise Security'}
              </h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                {isSpanish 
                  ? 'Cifrado de extremo a extremo, cumplimiento GDPR y backups automáticos de todos tus datos.'
                  : 'End-to-end encryption, GDPR compliance and automatic backups of all your data.'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Premium Style */}
      <section className="relative py-32 bg-gradient-to-b from-slate-100/50 via-white to-slate-50/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-b from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
              {isSpanish ? 'Lo Que Dicen Nuestros Clientes' : 'What Our Customers Say'}
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 font-light">
              {isSpanish ? 'Miles de empresas ya están creciendo en piloto automático' : 'Thousands of businesses are already growing on autopilot'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            <div className="group backdrop-blur-sm rounded-3xl p-10 shadow-2xl hover:shadow-3xl border border-white/50 transition-all duration-500 hover:-translate-y-1" style={{backgroundColor: 'rgba(248, 248, 250, 0.8)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.8)'}>
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-800 mb-8 leading-relaxed text-lg font-medium">
                {isSpanish 
                  ? '"En 3 meses aumentamos nuestras ventas en un 300%. La plataforma literalmente funciona sola, es increíble."'
                  : '"In 3 months we increased our sales by 300%. The platform literally works by itself, it\'s incredible."'
                }
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  M
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Maria Rodriguez</p>
                  <p className="text-gray-600 font-medium">{isSpanish ? 'Dueña, Boutique Luna' : 'Owner, Luna Boutique'}</p>
                </div>
              </div>
            </div>

            <div className="group backdrop-blur-sm rounded-3xl p-10 shadow-2xl hover:shadow-3xl border border-white/50 transition-all duration-500 hover:-translate-y-1" style={{backgroundColor: 'rgba(248, 248, 250, 0.8)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.8)'}>
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-800 mb-8 leading-relaxed text-lg font-medium">
                {isSpanish 
                  ? '"Antes pasaba 4 horas al día en marketing. Ahora tengo ese tiempo para mi negocio y las ventas siguen creciendo."'
                  : '"I used to spend 4 hours a day on marketing. Now I have that time for my business and sales keep growing."'
                }
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  C
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Carlos Mendez</p>
                  <p className="text-sm text-gray-500">{isSpanish ? 'CEO, FitGym' : 'CEO, FitGym'}</p>
                </div>
              </div>
            </div>

            <div className="group backdrop-blur-sm rounded-3xl p-10 shadow-2xl hover:shadow-3xl border border-white/50 transition-all duration-500 hover:-translate-y-1" style={{backgroundColor: 'rgba(248, 248, 250, 0.8)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.8)'}>
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-800 mb-8 leading-relaxed text-lg font-medium">
                {isSpanish 
                  ? '"La IA conoce mi inventario mejor que yo. Crea campañas perfectas para cada producto automáticamente."'
                  : '"The AI knows my inventory better than I do. It creates perfect campaigns for each product automatically."'
                }
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  A
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ana Torres</p>
                  <p className="text-sm text-gray-500">{isSpanish ? 'Fundadora, TechStore' : 'Founder, TechStore'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Premium Apple Style */}
      <section className="relative py-32 bg-gradient-to-b from-white via-slate-50/20 to-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-b from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
              {isSpanish ? 'Planes Simples y Transparentes' : 'Simple, Transparent Pricing'}
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 font-light">
              {isSpanish ? 'Empieza gratis. Crece con nosotros. Cancela cuando quieras.' : 'Start free. Grow with us. Cancel anytime.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group backdrop-blur-sm border border-white/50 rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition-all duration-500" style={{backgroundColor: 'rgba(248, 248, 250, 0.8)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.8)'}>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                {isSpanish ? 'Starter' : 'Starter'}
              </h3>
              <div className="mb-8">
                <span className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">$29</span>
                <span className="text-gray-600 ml-3 text-lg font-medium">{isSpanish ? '/mes' : '/month'}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'Hasta 3 plataformas' : 'Up to 3 platforms'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'IA básica de campañas' : 'Basic AI campaigns'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'Analytics básicos' : 'Basic analytics'}</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 hover:from-gray-200 hover:to-gray-300 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                onClick={() => navigate("/login")}
              >
                {isSpanish ? 'Empezar Gratis' : 'Start Free'}
              </Button>
            </div>

            <div className="group bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-3xl p-12 shadow-3xl transform scale-105 relative border border-blue-500/20">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 font-bold text-sm shadow-lg">
                  {isSpanish ? 'MÁS POPULAR' : 'MOST POPULAR'}
                </Badge>
              </div>
              <h3 className="text-3xl font-bold mb-6">Professional</h3>
              <div className="mb-8">
                <span className="text-5xl font-bold">$99</span>
                <span className="text-blue-200 ml-3 text-lg font-medium">{isSpanish ? '/mes' : '/month'}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>{isSpanish ? 'Todas las 21+ plataformas' : 'All 21+ platforms'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>{isSpanish ? 'IA avanzada + datos en tiempo real' : 'Advanced AI + real-time data'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>{isSpanish ? 'Bandeja unificada + ChatBot IA' : 'Unified inbox + AI ChatBot'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>{isSpanish ? 'Analytics avanzados' : 'Advanced analytics'}</span>
                </li>
              </ul>
              <Button className="w-full text-blue-600 hover:opacity-80 font-bold py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 text-lg group-hover:scale-105" style={{backgroundColor: '#F8F8FA'}}>
                {isSpanish ? 'Empezar Gratis 14 Días' : 'Start 14-Day Free Trial'}
              </Button>
            </div>

            <div className="group backdrop-blur-sm border border-white/50 rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition-all duration-500" style={{backgroundColor: 'rgba(248, 248, 250, 0.8)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.9)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 248, 250, 0.8)'}>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Enterprise</h3>
              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900">{isSpanish ? 'Personalizado' : 'Custom'}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'Integraciones personalizadas' : 'Custom integrations'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'Soporte dedicado' : 'Dedicated support'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'SLA garantizado' : 'SLA guarantee'}</span>
                </li>
              </ul>
              <Button className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200 font-semibold py-3 rounded-lg">
                {isSpanish ? 'Contactar Ventas' : 'Contact Sales'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Premium Style */}
      <section className="relative py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent leading-tight">
            {isSpanish ? '¿Listo Para Hacer Crecer Tus Ventas?' : 'Ready To Grow Your Sales?'}
          </h2>
          <p className="text-xl sm:text-2xl text-gray-300/90 mb-16 max-w-3xl mx-auto font-light leading-relaxed">
            {isSpanish 
              ? 'Únete a miles de empresas que ya están creciendo en piloto automático. Sin configuración complicada, sin contratos largos.'
              : 'Join thousands of businesses already growing on autopilot. No complex setup, no long contracts.'
            }
          </p>
          
          <div className="flex flex-col items-center gap-6 mb-12">
            <Button 
              className="text-gray-900 hover:opacity-80 font-bold px-16 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1"
              style={{backgroundColor: '#F8F8FA'}}
              data-testid="button-start-free-trial-final"
              onClick={() => navigate("/login")}
            >
              {isSpanish ? 'Comenzar Gratis Ahora' : 'Start Free Now'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-gray-400 text-sm">
              {isSpanish ? 'Prueba gratis 14 días • No se requiere tarjeta de crédito • Cancela cuando quieras' : '14-day free trial • No credit card required • Cancel anytime'}
            </p>
          </div>
          
          <div className="flex justify-center items-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {isSpanish ? 'Seguro SSL' : 'SSL Secure'}
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              {isSpanish ? 'GDPR Compliant' : 'GDPR Compliant'}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              {isSpanish ? 'Soporte 24/7' : '24/7 Support'}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img 
                src={leadBoostLogo} 
                alt="CampAIgner" 
                className="h-8 w-auto brightness-150 mr-4"
              />
              <span className="text-white/60 text-sm">
                {isSpanish ? '© 2024 CampAIgner. Todos los derechos reservados.' : '© 2024 CampAIgner. All rights reserved.'}
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Button variant="ghost" className="text-white/60 hover:text-white text-sm">
                {isSpanish ? 'Privacidad' : 'Privacy'}
              </Button>
              <Button variant="ghost" className="text-white/60 hover:text-white text-sm">
                {isSpanish ? 'Términos' : 'Terms'}
              </Button>
              <Button variant="ghost" className="text-white/60 hover:text-white text-sm">
                {isSpanish ? 'Soporte' : 'Support'}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}