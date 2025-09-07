import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield, ArrowDown, ArrowRight, Sparkles, Target, Globe, TrendingUp, Play, Volume2, Settings, Maximize, Palette, Video, Mail, ChevronDown, Calendar, Compass, Rocket, HelpCircle, X, Send, FileQuestion, Crown, Star, CheckCircle, Heart, Share2, Eye, Activity, DollarSign, ShoppingBag, CreditCard, Clock } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube, SiX, SiGmail, SiWix, SiShopify, SiZapier, SiQuickbooks, SiSquare, SiStripe } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";
import { AIChatbot } from "@/components/AIChatbot";
import { CountdownTimer } from "@/components/CountdownTimer";
import { FAQ } from "@/components/FAQ";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { ReferralProgram } from "@/components/ReferralProgram";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import StatsCard from "@/components/StatsCard";
import MessageList from "@/components/MessageList";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import leadBoostLogo from "@assets/Lead Boost (500 x 200 px) (500 x 160 px)_1756873932398.png";

export default function Landing() {
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const t = translations[language];

  return (
      <div className="min-h-screen bg-white relative">
          <div className="absolute top-16 left-12 w-16 h-28 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-12 shadow-lg" style={{animation: 'float 8s ease-in-out infinite, slowDrift 20s linear infinite'}}>
            <SiInstagram className="w-6 h-6 text-white" />
          </div>
          <div className="absolute top-64 right-20 w-20 h-36 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-6 shadow-lg" style={{animation: 'float 6s ease-in-out infinite 2s, slowDrift 25s linear infinite 3s'}}>
            <SiInstagram className="w-8 h-8 text-white" />
          </div>

          {/* TikTok Cover Cards */}
          <div className="absolute top-32 right-32 w-18 h-32 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-8 shadow-lg" style={{animation: 'float 7s ease-in-out infinite 1s, slowDrift 22s linear infinite 1s'}}>
            <SiTiktok className="w-7 h-7 text-white" />
          </div>
          <div className="absolute bottom-32 left-16 w-16 h-28 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-12 shadow-lg" style={{animation: 'float 9s ease-in-out infinite 4s, slowDrift 18s linear infinite 2s'}}>
            <SiTiktok className="w-6 h-6 text-white" />
          </div>

          {/* LinkedIn Article Cards */}
          <div className="absolute top-20 left-1/3 w-32 h-20 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-3 shadow-lg" style={{animation: 'float 6.5s ease-in-out infinite 0.5s, slowDrift 24s linear infinite 4s'}}>
            <SiLinkedin className="w-8 h-8 text-white" />
          </div>
          <div className="absolute bottom-40 right-1/4 w-28 h-18 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-8 shadow-lg" style={{animation: 'float 8.5s ease-in-out infinite 3s, slowDrift 21s linear infinite 1.5s'}}>
            <SiLinkedin className="w-6 h-6 text-white" />
          </div>

          {/* Facebook Post Cards */}
          <div className="absolute top-40 right-12 w-24 h-20 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-15 shadow-lg" style={{animation: 'float 7.5s ease-in-out infinite 2.5s, slowDrift 19s linear infinite 3.5s'}}>
            <SiFacebook className="w-6 h-6 text-white" />
          </div>
          <div className="absolute bottom-20 left-1/4 w-28 h-22 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-3 shadow-lg" style={{animation: 'float 6s ease-in-out infinite 1.5s, slowDrift 23s linear infinite 2.5s'}}>
            <SiFacebook className="w-7 h-7 text-white" />
          </div>

          {/* YouTube Thumbnail Cards */}
          <div className="absolute top-60 left-20 w-36 h-24 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-6 shadow-lg" style={{animation: 'float 8s ease-in-out infinite 1s, slowDrift 20s linear infinite 4s'}}>
            <SiYoutube className="w-8 h-8 text-white" />
          </div>
          <div className="absolute bottom-60 right-16 w-32 h-20 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-12 shadow-lg" style={{animation: 'float 7s ease-in-out infinite 2s, slowDrift 26s linear infinite 1s'}}>
            <SiYoutube className="w-7 h-7 text-white" />
          </div>

          {/* Twitter/X Cards */}
          <div className="absolute top-80 right-1/3 w-24 h-16 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-9 shadow-lg" style={{animation: 'float 6.5s ease-in-out infinite 3.5s, slowDrift 17s linear infinite 2s'}}>
            <SiX className="w-6 h-6 text-white" />
          </div>
          <div className="absolute bottom-80 left-1/3 w-20 h-14 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-6 shadow-lg" style={{animation: 'float 9s ease-in-out infinite 0.5s, slowDrift 22s linear infinite 3s'}}>
            <SiX className="w-5 h-5 text-white" />
          </div>

          {/* WhatsApp Cards */}
          <div className="absolute top-48 left-8 w-22 h-18 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-12 shadow-lg" style={{animation: 'float 7.5s ease-in-out infinite 1.5s, slowDrift 24s linear infinite 0.5s'}}>
            <SiWhatsapp className="w-6 h-6 text-white" />
          </div>
          <div className="absolute bottom-48 right-8 w-20 h-16 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-9 shadow-lg" style={{animation: 'float 8.5s ease-in-out infinite 2.5s, slowDrift 19s linear infinite 4s'}}>
            <SiWhatsapp className="w-5 h-5 text-white" />
          </div>

          {/* Email Cards */}
          <div className="absolute top-24 left-2/3 w-40 h-16 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-4 shadow-lg" style={{animation: 'float 6s ease-in-out infinite 2s, slowDrift 25s linear infinite 1s'}}>
            <Mail className="w-8 h-8 text-white" />
          </div>
          <div className="absolute bottom-24 left-8 w-36 h-14 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-7 shadow-lg" style={{animation: 'float 8s ease-in-out infinite 3s, slowDrift 18s linear infinite 2s'}}>
            <Mail className="w-7 h-7 text-white" />
          </div>

          {/* Pinterest Cards */}
          <div className="absolute top-72 left-1/2 w-20 h-30 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-8 shadow-lg" style={{animation: 'float 7s ease-in-out infinite 1s, slowDrift 23s linear infinite 3.5s'}}>
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-900 text-xs font-bold">P</div>
          </div>
          <div className="absolute bottom-72 right-1/2 w-18 h-28 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-11 shadow-lg" style={{animation: 'float 9s ease-in-out infinite 4s, slowDrift 21s linear infinite 0.5s'}}>
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-slate-900 text-xs font-bold">P</div>
          </div>

          {/* Snapchat Cards */}
          <div className="absolute top-36 right-1/4 w-16 h-32 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-14 shadow-lg" style={{animation: 'float 6.5s ease-in-out infinite 2.5s, slowDrift 20s linear infinite 1.5s'}}>
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-900 text-xs font-bold">S</div>
          </div>
          <div className="absolute bottom-36 left-1/2 w-14 h-26 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-5 shadow-lg" style={{animation: 'float 8.5s ease-in-out infinite 1.5s, slowDrift 26s linear infinite 2.5s'}}>
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-slate-900 text-xs font-bold">S</div>
          </div>

          {/* Discord Cards */}
          <div className="absolute top-56 right-4 w-26 h-20 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-7 shadow-lg" style={{animation: 'float 7.5s ease-in-out infinite 3.5s, slowDrift 19s linear infinite 4s'}}>
            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-900 text-xs font-bold">D</div>
          </div>

          {/* Additional Platform Cards */}
          <div className="absolute top-44 left-1/4 w-24 h-18 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-4 shadow-lg" style={{animation: 'float 6s ease-in-out infinite 0.5s, slowDrift 24s linear infinite 3s'}}>
            <div className="w-5 h-5 bg-white rounded flex items-center justify-center text-slate-900 text-xs font-bold">R</div>
          </div>
          
          <div className="absolute bottom-44 right-1/3 w-22 h-22 bg-white/10 rounded-lg border border-white/5 flex items-center justify-center transform rotate-10 shadow-lg" style={{animation: 'float 9s ease-in-out infinite 2s, slowDrift 22s linear infinite 1s'}}>
            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-900 text-xs font-bold">T</div>
          </div>

          <div className="absolute top-68 right-2/3 w-18 h-26 bg-white/8 rounded-lg border border-white/5 flex items-center justify-center transform -rotate-8 shadow-lg" style={{animation: 'float 8s ease-in-out infinite 4s, slowDrift 17s linear infinite 2.5s'}}>
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-slate-900 text-xs font-bold">M</div>
          </div>

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
            <div className="flex justify-between items-center py-1">
              <div className="flex items-center">
                <img 
                  src={leadBoostLogo} 
                  alt="LeadBoost Logo" 
                  className="h-12 w-auto object-contain brightness-110" 
                />
              </div>
              
              <div className="flex items-center space-x-6">
                {/* Navigation Buttons */}
                <div className="hidden sm:flex items-center space-x-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 px-3 py-2 transition-all duration-200 rounded-lg"
                        data-testid="button-whats-inside"
                      >
                        {isSpanish ? "Qué Incluye" : "What's Inside"}
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-2">
                      <DropdownMenuItem className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors duration-200 cursor-pointer">
                        <Sparkles className="h-4 w-4 mr-3 text-cyan-600" />
                        <div>
                          <div className="font-medium text-white">CampAIgner</div>
                          <div className="text-xs text-slate-500">{isSpanish ? 'Generador de campañas IA' : 'AI Campaign Generator'}</div>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors duration-200 cursor-pointer">
                        <MessageSquare className="h-4 w-4 mr-3 text-blue-600" />
                        <div>
                          <div className="font-medium text-white">{isSpanish ? 'Bandeja Unificada' : 'Unified Inbox'}</div>
                          <div className="text-xs text-slate-500">{isSpanish ? 'Gestión de mensajes multicanal' : 'Multi-platform messaging'}</div>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors duration-200 cursor-pointer">
                        <Bot className="h-4 w-4 mr-3 text-purple-600" />
                        <div>
                          <div className="font-medium text-white">{isSpanish ? 'Planificador IA' : 'AI Content Planner'}</div>
                          <div className="text-xs text-slate-500">{isSpanish ? 'Estrategias de contenido inteligentes' : 'Smart content strategies'}</div>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors duration-200 cursor-pointer">
                        <BarChart3 className="h-4 w-4 mr-3 text-green-600" />
                        <div>
                          <div className="font-medium text-white">{isSpanish ? 'Analytics' : 'Analytics Dashboard'}</div>
                          <div className="text-xs text-slate-500">{isSpanish ? 'Métricas e insights en tiempo real' : 'Real-time metrics & insights'}</div>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors duration-200 cursor-pointer">
                        <ShoppingBag className="h-4 w-4 mr-3 text-orange-600" />
                        <div>
                          <div className="font-medium text-white">{isSpanish ? 'Integraciones POS' : 'POS Integrations'}</div>
                          <div className="text-xs text-slate-500">{isSpanish ? 'Conecta tu sistema de ventas' : 'Connect your sales system'}</div>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition-colors duration-200 cursor-pointer">
                        <Palette className="h-4 w-4 mr-3 text-pink-600" />
                        <div>
                          <div className="font-medium text-white">{isSpanish ? 'Brand Studio' : 'Brand Studio'}</div>
                          <div className="text-xs text-slate-500">{isSpanish ? 'Herramientas de diseño profesional' : 'Professional design tools'}</div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const pricingSection = document.querySelector('[data-section="pricing"]');
                      pricingSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white/20 px-3 py-2 transition-all duration-200 rounded-lg"
                    data-testid="button-pricing"
                  >
                    {isSpanish ? 'Precios' : 'Pricing'}
                  </Button>
                </div>
                
                {/* Language Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="text-xs font-medium text-slate-600 hover:text-white hover:bg-slate-100/50 px-2 py-1 transition-all duration-200 rounded-md border border-slate-200/60 hover:border-slate-300/70"
                  data-testid="button-language-toggle"
                >
                  {isSpanish ? 'EN' : 'ES'}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 px-2 py-1 transition-all duration-200 opacity-60 hover:opacity-100"
                      data-testid="button-help-dropdown"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-2">
                    <DropdownMenuItem 
                      className="flex items-center p-3 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer"
                    >
                      <Bot className="h-4 w-4 mr-3 text-brand-600" />
                      <span className="font-medium text-white">{isSpanish ? 'Chat con IA' : 'AI Chat Assistant'}</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-center p-3 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer"
                    >
                      <FileQuestion className="h-4 w-4 mr-3 text-brand-600" />
                      <span className="font-medium text-white">{isSpanish ? 'Preguntas Frecuentes' : 'FAQs'}</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-center p-3 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer"
                      onClick={toggleLanguage}
                    >
                      <Globe className="h-4 w-4 mr-3 text-brand-600" />
                      <span className="font-medium text-white">{isSpanish ? 'Cambiar Idioma' : 'Change Language'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section - Billion Dollar Company Style */}
        <main className="relative min-h-screen bg-white">
          {/* Subtle Premium Background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Clean Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50"></div>
            
            {/* Minimal Geometric Accent - Single Premium Element */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/3 to-purple-500/3 rounded-full blur-3xl" style={{animation: 'float 30s ease-in-out infinite'}}></div>
          </div>
          
          {/* Premium Hero Content */}
          <div className="relative z-10 min-h-screen flex items-center justify-center px-8">
            <div className="max-w-6xl mx-auto text-center">
              
              {/* Trust Badge - Premium Minimal */}
              <div className="inline-flex items-center gap-3 mb-16 px-6 py-3 rounded-full bg-slate-100 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-slate-700">
                  {isSpanish ? 'Confiado por 25,000+ empresas' : 'Trusted by 25,000+ businesses'}
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-500 fill-current" />
                  ))}
                </div>
              </div>
              
              {/* Main Headline - Billion Dollar Company Style */}
              <h1 className="text-5xl lg:text-8xl xl:text-9xl font-light text-slate-900 leading-[0.9] tracking-tight mb-8">
                {isSpanish ? (
                  <>
                    <span className="font-medium">Haz crecer tu negocio</span>
                    <br />
                    <span className="text-4xl lg:text-6xl xl:text-7xl text-slate-500 font-light">en piloto automático.</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">Grow your business</span>
                    <br />
                    <span className="text-4xl lg:text-6xl xl:text-7xl text-slate-500 font-light">on autopilot.</span>
                  </>
                )}
              </h1>
              
              {/* Subtitle - Clean & Clear */}
              <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed mb-20 max-w-4xl mx-auto font-light">
                {isSpanish 
                  ? 'Plataforma de IA que automatiza marketing, ventas y atención al cliente. Todo desde un solo lugar.' 
                  : 'AI platform that automates marketing, sales, and customer service. All from one place.'
                }
              </p>
              
              {/* Feature highlights - Premium Minimal */}
              <div className="flex flex-wrap justify-center gap-16 mb-24 text-center">
                <div className="flex flex-col items-center max-w-xs">
                  <div className="w-4 h-4 bg-blue-600 rounded-full mb-6"></div>
                  <p className="text-lg text-slate-600 font-light leading-relaxed">
                    {isSpanish ? 'IA crea contenido para 21+ plataformas' : 'AI creates content for 21+ platforms'}
                  </p>
                </div>
                <div className="flex flex-col items-center max-w-xs">
                  <div className="w-4 h-4 bg-blue-600 rounded-full mb-6"></div>
                  <p className="text-lg text-slate-600 font-light leading-relaxed">
                    {isSpanish ? 'Chatbot responde clientes 24/7' : 'Chatbot handles customers 24/7'}
                  </p>
                </div>
                <div className="flex flex-col items-center max-w-xs">
                  <div className="w-4 h-4 bg-blue-600 rounded-full mb-6"></div>
                  <p className="text-lg text-slate-600 font-light leading-relaxed">
                    {isSpanish ? 'Configuración en menos de 10 minutos' : 'Setup in under 10 minutes'}
                  </p>
                </div>
              </div>
              
              {/* CTA buttons - Premium Clean */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button 
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="button-start-demo"
                >
                  {isSpanish ? 'Empezar gratis' : 'Get started'}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-8 py-4 text-lg rounded-lg transition-all duration-300"
                  data-testid="button-watch-demo"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isSpanish ? 'Ver demo' : 'Watch demo'}
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-16" data-section="features">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <Target className="h-12 w-12 text-brand-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {isSpanish ? 'Generación Automática' : 'Automatic Generation'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish ? 'IA crea contenido optimizado para cada plataforma' : 'AI creates optimized content for each platform'}
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <Globe className="h-12 w-12 text-brand-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {isSpanish ? '21+ Plataformas' : '21+ Platforms'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish ? 'Instagram, TikTok, Facebook, LinkedIn y más' : 'Instagram, TikTok, Facebook, LinkedIn and more'}
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <Zap className="h-12 w-12 text-brand-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {isSpanish ? 'Resultados Instantáneos' : 'Instant Results'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish ? 'Campañas listas en segundos, no en horas' : 'Campaigns ready in seconds, not hours'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        
        {/* Interactive Demo Section */}
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="mr-2 h-4 w-4" />
                {isSpanish ? 'Demo Interactivo' : 'Interactive Demo'}
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {isSpanish ? 'Ve nuestra herramienta CampAIgner en Acción' : 'See our CampAIgner tool in Action'}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {isSpanish 
                  ? 'Describe tu negocio y ve cómo la IA crea contenido personalizado para 21+ plataformas en segundos'
                  : 'Describe your business and watch AI create personalized content for 21+ platforms in seconds'
                }
              </p>
            </div>
            
            <InteractiveDemo isSpanish={isSpanish} />
          </div>
        </div>

        {/* Dashboard Overview Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white py-20">
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <BarChart3 className="mr-2 h-4 w-4" />
                {isSpanish ? 'Panel de Control' : 'Dashboard Overview'}
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {isSpanish ? 'Todo tu Negocio en un Solo Lugar' : 'Your Entire Business in One Place'}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {isSpanish 
                  ? 'Monitorea ventas, gestiona mensajes y ve el rendimiento de campañas desde un dashboard unificado'
                  : 'Monitor sales, manage messages, and track campaign performance from one unified dashboard'
                }
              </p>
            </div>
            
            {/* Revenue and Performance Stats */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 mb-12">
              <div className="lg:col-span-3">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-brand-25 border border-brand-100 shadow-sm h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent"></div>
                  <div className="relative p-8 h-full flex flex-col justify-center">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-4">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 mr-3"></div>
                          <h3 className="text-lg font-medium text-gray-600">
                            {isSpanish ? 'Crecimiento de Ventas' : 'Sales Growth'}
                          </h3>
                        </div>
                        <div className="space-y-2">
                          <div className="text-6xl font-bold text-green-600">
                            +47%
                          </div>
                          <div className="text-2xl font-semibold text-gray-700">
                            +$12,450
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600 text-base font-medium mb-2">
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          </div>
                          {isSpanish ? 'vs antes de CampAIgner' : 'vs before CampAIgner'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">{isSpanish ? 'Objetivo mensual' : 'Monthly target'}</div>
                        <div className="text-lg font-bold text-gray-700">$85,000</div>
                        <div className="text-xs text-green-600 font-medium mt-1">{isSpanish ? '62% completado' : '62% complete'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-25 border border-gray-100 shadow-sm h-full">
                  <div className="relative p-8 h-full flex flex-col justify-center">
                    <div className="flex items-center mb-4">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-brand-400 to-brand-500 mr-3"></div>
                      <h3 className="text-lg font-medium text-gray-600">
                        {isSpanish ? 'Campañas IA' : 'AI Campaigns'}
                      </h3>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 mb-4">
                      28
                    </div>
                    <div className="space-y-3">
                      <div className="text-lg text-brand-600 font-bold">
                        {isSpanish ? '× 21 plataformas = 588 posts' : '× 21 platforms = 588 posts'}
                      </div>
                      <div className="flex items-center text-brand-600 text-sm font-medium">
                        <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center mr-2">
                          <TrendingUp className="w-2.5 h-2.5 text-brand-600" />
                        </div>
                        {isSpanish ? '+4 este mes' : '+4 this month'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Unified Inbox Preview */}
            <Card className="shadow-xl">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-3 h-5 w-5 text-brand-600" />
                    {isSpanish ? 'Bandeja Unificada' : 'Unified Inbox'}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" className="text-xs">
                      {isSpanish ? 'Todos' : 'All'}
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs bg-red-50 text-red-700 border-red-200">
                      {isSpanish ? 'No Leídos (12)' : 'Unread (12)'}
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      {isSpanish ? 'Importantes' : 'Priority'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <MessageList limit={3} showHeader={false} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Content Planner Section */}
        <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-cyan-500 relative overflow-hidden py-20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-white rounded-full blur-2xl"></div>
          </div>
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
                <Bot className="mr-2 h-5 w-5" />
                {isSpanish ? 'Planificador IA' : 'AI Content Planner'}
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
                {isSpanish ? 'Estrategias de Contenido Inteligentes' : 'Smart Content Strategies'}
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                {isSpanish 
                  ? 'La IA analiza tu industria, productos y temporada para crear planes de contenido mensuales personalizados'
                  : 'AI analyzes your industry, products, and seasonality to create personalized monthly content plans'
                }
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Business Data Input Mockup */}
              <Card className="border-2 border-white/20 shadow-2xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-brand-50 to-cyan-50">
                  <CardTitle className="flex items-center text-lg">
                    <div className="bg-gradient-to-br from-brand-600 to-cyan-500 p-3 rounded-xl mr-4 shadow-lg">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-gray-900 font-bold text-xl">
                        {isSpanish ? 'Datos del Negocio' : 'Business Data'}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {isSpanish ? 'La IA necesita conocer tu negocio' : 'AI needs to understand your business'}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {isSpanish ? 'Industria' : 'Industry'}
                    </Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="text-sm text-gray-900 font-medium">
                        {isSpanish ? 'Belleza y Cosmética' : 'Beauty & Cosmetics'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {isSpanish ? 'Productos Principales' : 'Top Products'}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-brand-100 text-brand-700">
                        {isSpanish ? 'Cremas Faciales' : 'Face Creams'}
                      </Badge>
                      <Badge variant="secondary" className="bg-brand-100 text-brand-700">
                        {isSpanish ? 'Maquillaje' : 'Makeup'}
                      </Badge>
                      <Badge variant="secondary" className="bg-brand-100 text-brand-700">
                        {isSpanish ? 'Tratamientos' : 'Treatments'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {isSpanish ? 'Temporada' : 'Season'}
                    </Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="text-sm text-gray-900 font-medium">
                        {isSpanish ? 'T4 - Otoño y Temporada Navideña' : 'Q4 - Fall & Holiday Season'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* AI Strategy Preview */}
              <Card className="border-2 border-white/20 shadow-2xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center text-lg">
                    <div className="bg-gradient-to-br from-green-600 to-emerald-500 p-3 rounded-xl mr-4 shadow-lg">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-gray-900 font-bold text-xl">
                        {isSpanish ? 'Estrategia IA Generada' : 'AI-Generated Strategy'}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {isSpanish ? 'Plan personalizado para diciembre' : 'Personalized plan for December'}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 font-medium">
                      {isSpanish 
                        ? '🎄 Estrategia navideña enfocada en regalos premium y rutinas de cuidado festivas. Destacar productos de edición limitada y promociones especiales.'
                        : '🎄 Holiday strategy focused on premium gifts and festive skincare routines. Highlight limited edition products and special promotions.'
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                          <SiInstagram className="text-white h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {isSpanish ? 'Tutorial Maquillaje Navideño' : 'Holiday Makeup Tutorial'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isSpanish ? 'Dec 5 • Instagram Reels' : 'Dec 5 • Instagram Reels'}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {isSpanish ? 'Listo' : 'Ready'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                          <Mail className="text-white h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {isSpanish ? 'Newsletter Regalo Perfecto' : 'Perfect Gift Newsletter'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isSpanish ? 'Dec 10 • Email' : 'Dec 10 • Email'}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {isSpanish ? 'Listo' : 'Ready'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                          <SiTiktok className="text-white h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {isSpanish ? 'Tendencias Skincare 2025' : 'Skincare Trends 2025'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isSpanish ? 'Dec 15 • TikTok' : 'Dec 15 • TikTok'}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {isSpanish ? 'Listo' : 'Ready'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Campaign Management Section */}
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Zap className="mr-2 h-4 w-4" />
                {isSpanish ? 'Gestión de Campañas' : 'Campaign Management'}
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {isSpanish ? 'Campañas Multi-Plataforma en Segundos' : 'Multi-Platform Campaigns in Seconds'}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {isSpanish 
                  ? 'Crea y publica contenido optimizado para 21+ plataformas simultáneamente con un solo clic'
                  : 'Create and publish optimized content for 21+ platforms simultaneously with one click'
                }
              </p>
            </div>

            {/* Campaign Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-12">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">28</div>
                  <div className="text-sm text-primary font-medium">
                    {isSpanish ? 'Campañas Activas' : 'Active Campaigns'}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-indigo-600 mr-1" />
                    <div className="text-3xl font-bold text-indigo-900">7</div>
                  </div>
                  <div className="text-sm text-indigo-600 font-medium">
                    {isSpanish ? 'Programadas' : 'Scheduled'}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-1" />
                    <div className="text-3xl font-bold text-green-900">15</div>
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    {isSpanish ? 'Publicadas' : 'Published'}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-100">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Bot className="h-5 w-5 text-amber-600 mr-1" />
                    <div className="text-3xl font-bold text-amber-900">85%</div>
                  </div>
                  <div className="text-sm text-amber-600 font-medium">
                    {isSpanish ? 'IA Generadas' : 'AI Generated'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Grid */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-center">
                  {isSpanish ? '21+ Plataformas Soportadas' : '21+ Supported Platforms'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-7 gap-4">
                  {[
                    { icon: <SiInstagram className="h-6 w-6" />, name: "Instagram", color: "text-pink-500" },
                    { icon: <SiTiktok className="h-6 w-6" />, name: "TikTok", color: "text-gray-800" },
                    { icon: <SiFacebook className="h-6 w-6" />, name: "Facebook", color: "text-primary" },
                    { icon: <SiLinkedin className="h-6 w-6" />, name: "LinkedIn", color: "text-primary" },
                    { icon: <SiWhatsapp className="h-6 w-6" />, name: "WhatsApp", color: "text-green-500" },
                    { icon: <SiYoutube className="h-6 w-6" />, name: "YouTube", color: "text-red-600" },
                    { icon: <Mail className="h-6 w-6" />, name: "Email", color: "text-primary" },
                  ].map((platform, index) => (
                    <div key={index} className="flex flex-col items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className={`${platform.color} mb-2`}>
                        {platform.icon}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{platform.name}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-6">
                  <Button variant="outline" className="text-sm">
                    {isSpanish ? '+ 14 plataformas más' : '+ 14 more platforms'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Analytics & Business Intelligence Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white py-20">
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <TrendingUp className="mr-2 h-4 w-4" />
                {isSpanish ? 'Inteligencia de Negocio' : 'Business Intelligence'}
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {isSpanish ? 'Datos que Impulsan Decisiones' : 'Data-Driven Decisions'}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {isSpanish 
                  ? 'Analytics avanzados y insights accionables para optimizar tu estrategia de marketing'
                  : 'Advanced analytics and actionable insights to optimize your marketing strategy'
                }
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-12">
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Eye className="text-white h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {isSpanish ? 'Alcance Total' : 'Total Reach'}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">125.3K</div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <TrendingUp className="text-xs mr-1 h-3 w-3" />
                            <span>12.5%</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <Heart className="text-white h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {isSpanish ? 'Engagement' : 'Engagement'}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">8.2K</div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <TrendingUp className="text-xs mr-1 h-3 w-3" />
                            <span>8.3%</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Share2 className="text-white h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {isSpanish ? 'Tasa de Conversión' : 'Conversion Rate'}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">3.2%</div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <TrendingUp className="text-xs mr-1 h-3 w-3" />
                            <span>2.1%</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="text-white h-5 w-5" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {isSpanish ? 'Impacto en Ingresos' : 'Revenue Impact'}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">$12.4K</div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <TrendingUp className="text-xs mr-1 h-3 w-3" />
                            <span>+15.2%</span>
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart Placeholder */}
            <Card className="shadow-xl mb-12">
              <CardHeader>
                <CardTitle>{isSpanish ? 'Tendencias de Rendimiento' : 'Performance Trends'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-brand-50 to-brand-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-brand-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-brand-600" />
                    </div>
                    <p className="text-sm text-brand-700 font-medium">
                      {isSpanish ? 'Gráficos interactivos de rendimiento' : 'Interactive performance charts'}
                    </p>
                    <p className="text-xs text-brand-600 mt-1">
                      {isSpanish ? 'Datos en tiempo real de todas las plataformas' : 'Real-time data from all platforms'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* POS Integration Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 py-20">
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Globe className="mr-2 h-4 w-4" />
                {isSpanish ? 'Integraciones POS' : 'POS Integrations'}
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {isSpanish ? 'Conecta tu Negocio Completo' : 'Connect Your Entire Business'}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {isSpanish 
                  ? 'Sincroniza datos de ventas en tiempo real y automatiza campañas basadas en el rendimiento del negocio'
                  : 'Sync real-time sales data and automate campaigns based on business performance'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Supported Platforms */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="bg-emerald-500 p-2 rounded-lg mr-3">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    {isSpanish ? 'Plataformas Soportadas' : 'Supported Platforms'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 rounded mr-3 flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded"></div>
                      </div>
                      <span className="font-medium text-gray-900">Square</span>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-600 rounded mr-3 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Shopify</span>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-600 rounded mr-3 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Stripe</span>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded mr-3 flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {isSpanish ? 'Y más...' : 'And more...'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Sync */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="bg-green-500 p-2 rounded-lg mr-3">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    {isSpanish ? 'Sincronización en Tiempo Real' : 'Real-time Sync'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <div className="font-medium text-green-800">
                        {isSpanish ? '🛍️ Nueva venta - $85.50' : '🛍️ New sale - $85.50'}
                      </div>
                      <div className="text-sm text-green-600">
                        {isSpanish ? '2 min ago • Auto-post iniciado' : '2 min ago • Auto-post triggered'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <div className="font-medium text-blue-800">
                        {isSpanish ? '📊 Producto destacado detectado' : '📊 Trending product detected'}
                      </div>
                      <div className="text-sm text-blue-600">
                        {isSpanish ? '5 min ago • Campaña sugerida' : '5 min ago • Campaign suggested'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div>
                      <div className="font-medium text-amber-800">
                        {isSpanish ? '⚡ Objetivo mensual: 82% completo' : '⚡ Monthly goal: 82% complete'}
                      </div>
                      <div className="text-sm text-amber-600">
                        {isSpanish ? '10 min ago • Post celebración programado' : '10 min ago • Celebration post scheduled'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-gradient-to-br from-brand-50 to-white py-20" data-section="pricing">
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Crown className="mr-2 h-4 w-4" />
                {isSpanish ? 'Precios' : 'Pricing'}
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {isSpanish ? 'Planes Diseñados para tu Crecimiento' : 'Plans Built for Your Growth'}
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {isSpanish 
                  ? 'Desde startups hasta empresas, tenemos el plan perfecto para acelerar tu crecimiento'
                  : 'From startups to enterprises, we have the perfect plan to accelerate your growth'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Starter Plan */}
              <Card className="relative border-2 border-gray-200 hover:border-brand-300 transition-all duration-200">
                <CardHeader className="text-center pb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Iniciador' : 'Starter'}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">$29</span>
                    <span className="text-gray-500 ml-2">{isSpanish ? '/mes' : '/month'}</span>
                  </div>
                  <p className="text-gray-600">
                    {isSpanish ? 'Perfecto para pequeños negocios' : 'Perfect for small businesses'}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? '5 campañas IA por mes' : '5 AI campaigns per month'}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? '3 plataformas conectadas' : '3 connected platforms'}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? 'Analytics básicos' : 'Basic analytics'}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? 'Soporte por email' : 'Email support'}</span>
                    </li>
                  </ul>
                  <Button className="w-full" variant="outline">
                    {isSpanish ? 'Comenzar Gratis' : 'Start Free'}
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan - Featured */}
              <Card className="relative border-2 border-brand-500 hover:border-brand-600 transition-all duration-200 transform scale-105">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-brand-500 text-white px-4 py-1">
                    {isSpanish ? 'Más Popular' : 'Most Popular'}
                  </Badge>
                </div>
                <CardHeader className="text-center pb-8 pt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Profesional' : 'Professional'}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">$79</span>
                    <span className="text-gray-500 ml-2">{isSpanish ? '/mes' : '/month'}</span>
                  </div>
                  <p className="text-gray-600">
                    {isSpanish ? 'Para equipos en crecimiento' : 'For growing teams'}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? '25 campañas IA por mes' : '25 AI campaigns per month'}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? '10 plataformas conectadas' : '10 connected platforms'}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? 'Analytics avanzados' : 'Advanced analytics'}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? 'Bandeja unificada' : 'Unified inbox'}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? 'Soporte prioritario' : 'Priority support'}</span>
                    </li>
                  </ul>
                  <Button className="w-full">
                    {isSpanish ? 'Prueba 14 Días Gratis' : '14-Day Free Trial'}
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative border-2 border-gray-200 hover:border-brand-300 transition-all duration-200">
                <CardHeader className="text-center pb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Empresarial' : 'Enterprise'}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{isSpanish ? 'Personalizado' : 'Custom'}</span>
                  </div>
                  <p className="text-gray-600">
                    {isSpanish ? 'Para grandes organizaciones' : 'For large organizations'}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? 'Campañas ilimitadas' : 'Unlimited campaigns'}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? 'Todas las plataformas' : 'All platforms'}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? 'API personalizada' : 'Custom API'}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? 'Manager dedicado' : 'Dedicated manager'}</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{isSpanish ? 'SLA garantizado' : 'SLA guarantee'}</span>
                    </li>
                  </ul>
                  <Button className="w-full" variant="outline">
                    {isSpanish ? 'Contactar Ventas' : 'Contact Sales'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white faq-section">
          <FAQ isSpanish={isSpanish} />
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <img 
                  src={leadBoostLogo} 
                  alt="CampAIgner Logo" 
                  className="h-24 w-auto object-contain opacity-80 brightness-125"
                  style={{ backgroundColor: 'transparent' }}
                />
              </div>
              <p className="text-gray-400 mb-6">
                {isSpanish ? 'Has hecho el trabajo duro, déjanos hacer el trabajo inteligente.' : 'You\'ve done the hard work, let us do the smart work.'}
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