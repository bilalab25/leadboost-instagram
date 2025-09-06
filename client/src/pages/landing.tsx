import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield, ArrowDown, ArrowRight, Sparkles, Target, Globe, TrendingUp, Play, Volume2, Settings, Maximize, Palette, Video, Mail, ChevronDown, Calendar, Compass, Rocket, HelpCircle, X, Send, FileQuestion, Crown, Star, CheckCircle, Heart, Share2 } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube, SiX, SiGmail, SiWix, SiShopify, SiZapier, SiQuickbooks, SiSquare, SiStripe } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";
import { AIChatbot } from "@/components/AIChatbot";
import { CountdownTimer } from "@/components/CountdownTimer";
import { FAQ } from "@/components/FAQ";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { ReferralProgram } from "@/components/ReferralProgram";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import leadBoostLogo from "@assets/Lead Boost (500 x 200 px) (500 x 160 px)_1756873932398.png";

export default function Landing() {
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const t = translations[language];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-brand-25 to-brand-100 relative overflow-hidden">
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
                {/* Language Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100/30 px-2 py-1 transition-all duration-200 rounded-md border border-gray-200/50 hover:border-brand-300/70"
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
                      <span className="font-medium text-slate-800">{isSpanish ? 'Chat con IA' : 'AI Chat Assistant'}</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-center p-3 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer"
                    >
                      <FileQuestion className="h-4 w-4 mr-3 text-brand-600" />
                      <span className="font-medium text-slate-800">{isSpanish ? 'Preguntas Frecuentes' : 'FAQs'}</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-center p-3 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer"
                      onClick={toggleLanguage}
                    >
                      <Globe className="h-4 w-4 mr-3 text-brand-600" />
                      <span className="font-medium text-slate-800">{isSpanish ? 'Cambiar Idioma' : 'Change Language'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="pt-20 pb-20">
          <div className="relative z-10 min-h-screen flex items-center justify-center">
            <div className="max-w-4xl mx-auto px-6 text-center">
              
              {/* Trust indicator */}
              <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 rounded-full bg-gray-100/50 border border-gray-200/30">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-600">
                  {isSpanish ? 'Confiado por 25,000+ empresas' : 'Trusted by 25,000+ businesses'}
                </span>
                <div className="flex items-center gap-0.5 ml-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              
              {/* Main headline */}
              <h1 className="text-6xl lg:text-7xl font-light text-gray-900 leading-[0.95] tracking-tight mb-8">
                {isSpanish ? (
                  <>
                    <span className="font-medium text-blue-600">Haz Crecer tu Negocio</span>
                    <br />
                    <span className="text-gray-800">En Piloto Automático</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-blue-600">Grow Your Business</span>
                    <br />
                    <span className="text-gray-800">On Autopilot</span>
                  </>
                )}
              </h1>
              
              {/* Subtitle */}
              <p className="text-2xl font-light text-gray-500 leading-relaxed mb-12 max-w-2xl mx-auto">
                {isSpanish 
                  ? 'Plataforma todo-en-uno impulsada por IA que automatiza marketing, ventas y gestión de clientes desde un solo lugar.' 
                  : 'AI-powered all-in-one platform that automates marketing, sales, and customer management from one central hub.'
                }
              </p>
              
              {/* Feature highlights */}
              <div className="flex flex-wrap justify-center gap-8 mb-16 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium text-lg max-w-48">
                    {isSpanish ? 'IA crea contenido para 21+ plataformas' : 'AI creates content for 21+ platforms'}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium text-lg max-w-48">
                    {isSpanish ? 'Chatbot responde clientes 24/7' : 'Chatbot handles customers 24/7'}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium text-lg max-w-48">
                    {isSpanish ? 'Configuración en menos de 10 minutos' : 'Setup in under 10 minutes'}
                  </span>
                </div>
              </div>
              
              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-10 py-4 text-lg rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                  data-testid="button-start-demo"
                >
                  {isSpanish ? 'Empezar Demo Gratis' : 'Start Free Demo'}
                </Button>
                <Button 
                  variant="outline" 
                  className="font-medium px-10 py-4 text-lg rounded-full border-gray-300 hover:border-gray-400 transition-all duration-200"
                  data-testid="button-watch-demo"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {isSpanish ? 'Ver Demo' : 'Watch Demo'}
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
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
    </>
  );
}