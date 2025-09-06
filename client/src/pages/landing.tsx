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
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
            <div className="text-center mb-16">
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
                {isSpanish ? 'CampAIgner: Generador de Campañas IA' : 'CampAIgner: AI Campaign Generator'}
              </h1>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
                {isSpanish 
                  ? 'Crea campañas optimizadas para 21+ plataformas en un solo clic. Nuestra IA analiza tu negocio y genera contenido personalizado automáticamente.'
                  : 'Create optimized campaigns for 21+ platforms in one click. Our AI analyzes your business and generates personalized content automatically.'
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 text-lg">
                  <Crown className="h-5 w-5 mr-2" />
                  {isSpanish ? 'Empezar Gratis' : 'Start Free Trial'}
                </Button>
                <Button variant="outline" className="px-8 py-3 text-lg">
                  <Play className="h-5 w-5 mr-2" />
                  {isSpanish ? 'Ver Demo' : 'Watch Demo'}
                </Button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
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
        </main>

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