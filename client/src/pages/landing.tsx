import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield, ArrowDown, ArrowRight, Sparkles, Target, Globe, TrendingUp, Play, Volume2, Settings, Maximize, Palette, Video, Mail, ChevronDown, Calendar, Compass, Rocket, HelpCircle, X, Send, FileQuestion } from "lucide-react";
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
                {/* Discreet Language Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100/30 px-2 py-1 transition-all duration-200 rounded-md border border-gray-200/50 hover:border-gray-300/70"
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
                      onClick={() => {
                        const chatbot = document.querySelector('[data-testid="ai-chatbot-trigger"]') as HTMLElement;
                        if (chatbot) chatbot.click();
                      }}
                    >
                      <Bot className="h-4 w-4 mr-3 text-brand-600" />
                      <span className="font-medium">{isSpanish ? 'Chat con IA' : 'AI Chat Assistant'}</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-center p-3 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer"
                      onClick={() => {
                        const faqSection = document.getElementById('faq-section');
                        if (faqSection) faqSection.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <FileQuestion className="h-4 w-4 mr-3 text-brand-600" />
                      <span className="font-medium">{isSpanish ? 'Preguntas Frecuentes' : 'FAQs'}</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-center p-3 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer"
                      onClick={toggleLanguage}
                    >
                      <Globe className="h-4 w-4 mr-3 text-brand-600" />
                      <span className="font-medium">{isSpanish ? '🇺🇸 Switch to English' : '🇪🇸 Cambiar a Español'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost"
                      className="text-brand-800 hover:text-white hover:bg-gradient-to-r hover:from-brand-500 hover:to-brand-600 font-bold px-7 py-3.5 transition-all duration-300 group backdrop-blur-xl border border-brand-400/50 hover:border-brand-500/80 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-brand-500/25 tracking-wide text-sm"
                      data-testid="button-features-dropdown"
                    >
                      <Rocket className="mr-2.5 h-4 w-4 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                      {isSpanish ? 'QUÉ HAY ADENTRO' : "WHAT'S INSIDE"}
                      <ChevronDown className="ml-2 h-4 w-4 group-hover:text-white group-hover:rotate-180 transition-all duration-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-2">
                    <DropdownMenuItem 
                      className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group"
                      onClick={() => window.location.href = '/waterfall'}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{isSpanish ? 'Generador de Campañas' : 'Campaign Generator'}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {isSpanish ? 'CampAIgner; nuestro generador IA que crea campañas para 21+ plataformas en un clic' : 'CampAIgner; our AI generator that creates campaigns for 21+ platforms in one click'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group"
                      onClick={() => window.location.href = '/ai-planner'}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{isSpanish ? 'Planificador 30 Días' : '30 Day Planner'}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {isSpanish ? 'Creación de contenido IA y estrategia para todo el mes automáticamente' : 'AI content creation and strategy for the entire month automatically'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group"
                      onClick={() => window.location.href = '/brand-studio'}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Palette className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Brand Studio</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {isSpanish ? 'Edita y personaliza rápidamente las campañas propuestas por nuestra IA con herramientas de diseño profesional' : 'Quickly edit and customize AI-proposed campaigns with professional design tools'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group"
                      onClick={() => window.location.href = '/inbox'}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{isSpanish ? 'Chat Deck' : 'Chat Deck'}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {isSpanish ? 'Inbox unificado multi-plataforma con perfiles automáticos de clientes, historial de compras y archivos digitales adjuntos' : 'Multi-platform unified inbox with automated customer profiles, purchase history and digital file attachments'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group"
                      onClick={() => window.location.href = '/analytics'}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{isSpanish ? 'Panel Analítico' : 'Analytics Dashboard'}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {isSpanish ? 'Métricas avanzadas y reportes de rendimiento en tiempo real' : 'Advanced metrics and real-time performance reports'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group"
                      onClick={() => window.location.href = '/teams'}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{isSpanish ? 'Equipos' : 'Teams'}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {isSpanish ? 'Administra permisos, roles, colaboradores y asigna tareas a tu equipo' : 'Manage permissions, roles, collaborators and assign tasks to your collaborators'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group"
                      onClick={() => window.location.href = '/dashboard'}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{isSpanish ? 'Soporte Global' : 'Global Support'}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {isSpanish ? 'Asistencia 24/7 y soporte técnico en español e inglés' : '24/7 assistance and technical support in Spanish and English'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                  data-testid="button-pricing"
                  onClick={() => window.location.href = '/pricing'}
                >
                  <Sparkles className="h-4 w-4" />
                  {isSpanish ? 'Ver Precios!' : 'See Pricing!'}
                </Button>
                
                <Button 
                  className="bg-gradient-to-r from-[#3f82d1] to-[#2d5a9a] hover:from-[#3470b8] hover:to-[#26527d] text-white font-semibold px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                  data-testid="button-free-demo"
                  onClick={() => {
                    document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {isSpanish ? 'PRUEBA GRATUITA' : 'FREE DEMO'}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section with Floating Campaign Background */}
        <div className="relative overflow-hidden mt-0 min-h-screen bg-gray-50">
          {/* Floating Campaign Background - Squarespace Style */}
          <div className="absolute inset-0 overflow-hidden">
            <CampaignBackgroundFlow isSpanish={isSpanish} />
          </div>
          
          {/* Sophisticated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-gray-50/50 to-white/60" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 pt-24 pb-12 lg:pt-28 lg:pb-16">
            <div className="max-w-4xl">
              <div className="mb-6">
                <h1 className="text-6xl lg:text-8xl xl:text-9xl font-bold bg-gradient-to-br from-[#3f82d1] via-slate-800 to-[#2d5a9a] bg-clip-text text-transparent leading-[0.6] tracking-[-0.02em] drop-shadow-2xl relative z-10">
                  {isSpanish ? 'Haz Crecer Tu\u00A0Negocio' : 'Grow Your Business'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-br from-[#3f82d1] via-slate-800 to-[#2d5a9a] bg-clip-text text-transparent">—</span>
                  <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-br from-[#3f82d1] via-slate-800 to-[#2d5a9a] bg-clip-text text-transparent tracking-[-0.02em]">
                    {isSpanish ? 'En Piloto Automático.' : 'On Autopilot.'}
                  </h2>
                </div>
              </div>
              
              <div className="space-y-2 mb-2 max-w-4xl">
                <p className="text-base lg:text-lg xl:text-xl font-semibold text-gray-900 leading-tight">
                  {isSpanish ? 'Plataforma completa impulsada por IA —' : 'Complete AI-powered platform —'}
                  <br />
                  {isSpanish ? 'marketing, ventas y gestión de clientes' : 'marketing, sales, and customer management'}
                </p>
                <p className="text-xs lg:text-sm xl:text-base font-medium text-gray-600 leading-tight">
                  <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent font-bold animate-pulse">
                    {isSpanish ? 'Todo automatizado:' : 'Everything automated:'}
                  </span>{' '}
                  {isSpanish ? 'genera campañas, gestiona clientes, unifica mensajes — todo en un lugar' : 'generate campaigns, manage clients, unify messages — all in one place'}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-6">
                <Button 
                  className="bg-gradient-to-r from-[#3f82d1] to-[#2d5a9a] text-white hover:from-[#3470b8] hover:to-[#26527d] text-base lg:text-lg font-semibold px-10 lg:px-12 py-4 lg:py-5 h-auto rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {isSpanish ? 'DEMO GRATUITO' : 'START FREE DEMO'}
                </Button>
                <p className="text-xs lg:text-xs xl:text-sm font-normal text-gray-600 leading-tight">
                  {isSpanish ? 'Prueba gratuita, no se requiere tarjeta de crédito' : 'Free trial, no credit card required'}
                </p>
              </div>
            </div>
          </div>
          
          {/* CampAIgner Tool Visual Flow */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <Card className="bg-white rounded-3xl shadow-lg border border-gray-200 max-w-6xl mx-auto waterfall-container">
                {/* Waterfall particles */}
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <div className="waterfall-particle" style={{zIndex: 5}}></div>
                <CardContent className="p-8 lg:p-12 relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    
                    {/* ONE IDEA */}
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-[#3f82d1] via-[#3470b8] to-[#2d5a9a] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                        <Target className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-[#3f82d1] mb-2">{isSpanish ? 'TU MARCA' : 'YOUR BRAND'}</h3>
                      <p className="text-gray-600 font-medium">{isSpanish ? 'Extraemos datos de tu negocio en tiempo real' : 'We pull real-time data from your business'}</p>
                      <p className="text-sm text-gray-500 mt-1">{isSpanish ? 'IA analiza tu industria, rendimiento y ventas' : 'AI analyzes what your industry, performance and sales'}</p>
                    </div>
                    
                    {/* ARROW */}
                    <div className="flex justify-center">
                      <ArrowRight className="h-8 w-8 text-[#3f82d1]/70 hidden lg:block" />
                      <ArrowDown className="h-8 w-8 text-[#3f82d1]/70 lg:hidden" />
                    </div>
                    
                    {/* EVERYWHERE */}
                    <div className="text-center">
                      <div className="grid grid-cols-4 gap-2 mb-4 max-w-48 mx-auto">
                        <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                          <SiInstagram className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                          <SiTiktok className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <SiFacebook className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          <SiWhatsapp className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                          <SiLinkedin className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                          <SiYoutube className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                          <SiX className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-r from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-xs">+21</span>
                        </div>
                      </div>
                      <h3 className="text-3xl font-black text-[#3f82d1] mb-2">{isSpanish ? 'EN TODOS LADOS' : 'EVERYWHERE'}</h3>
                      <p className="text-gray-600 font-medium">{isSpanish ? '21+ plataformas, un clic' : '21+ platforms, one click'}</p>
                      <p className="text-sm text-gray-500 mt-1">{isSpanish ? 'Diseñado para ti, dimensionado para cada red social' : 'Designed for you, sized for every social network'}</p>
                    </div>
                  </div>
                  
                  {/* Interactive Demo Section */}
                  <div id="demo" className="mt-12 mb-8">
                    <InteractiveDemo isSpanish={isSpanish} />
                  </div>
                  
                </CardContent>
              </Card>
            </div>
            
            {/* Social Proof Section */}
            <div className="py-16 bg-gradient-to-r from-gray-50 to-white rounded-3xl border border-gray-100 mb-16">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Statistics */}
                <div className="text-center mb-16">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                    {isSpanish ? 'Resultados que Hablan por Sí Solos' : 'Results That Speak for Themselves'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-black text-[#3f82d1] mb-2">10,000+</div>
                      <p className="text-gray-600 font-medium">{isSpanish ? 'Empresas Activas' : 'Active Businesses'}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-black text-emerald-600 mb-2">250M+</div>
                      <p className="text-gray-600 font-medium">{isSpanish ? 'Citas Programadas' : 'Appointments Booked'}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-black text-purple-600 mb-2">40%</div>
                      <p className="text-gray-600 font-medium">{isSpanish ? 'Aumento en Conversión' : 'Increase in Conversions'}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-black text-orange-600 mb-2">24/7</div>
                      <p className="text-gray-600 font-medium">{isSpanish ? 'IA Trabajando' : 'AI Working'}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Testimonials with Trustpilot */}
                <div className="text-center mb-16">
                  <h4 className="text-xl font-bold text-gray-900 mb-8">
                    {isSpanish ? 'Lo Que Dicen Nuestros Clientes' : 'What Our Customers Say'}
                  </h4>
                  
                  {/* Trustpilot Rating */}
                  <div className="flex justify-center items-center mb-8">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-5 h-5 text-green-500 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="text-lg font-bold text-gray-900">4.8/5</span>
                      <span className="text-gray-600">on</span>
                      <span className="text-lg font-bold text-green-600">Trustpilot</span>
                    </div>
                  </div>

                  {/* Testimonials Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                      <div className="flex mb-3">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-green-500 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-700 text-sm mb-4">
                        {isSpanish 
                          ? '"LeadBoost revolucionó nuestro marketing. En 30 segundos tenemos campañas para todas las redes sociales. Increíble."'
                          : '"LeadBoost revolutionized our marketing. In 30 seconds we have campaigns for all social networks. Amazing."'
                        }
                      </p>
                      <div className="text-sm">
                        <p className="font-bold text-gray-900">Maria S.</p>
                        <p className="text-gray-500">{isSpanish ? 'Directora de Marketing' : 'Marketing Director'}</p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                      <div className="flex mb-3">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-green-500 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-700 text-sm mb-4">
                        {isSpanish 
                          ? '"LeadBoost me ayudó a definir mi identidad de marca. Ahora la IA genera campañas que se ven exactamente como mi negocio."'
                          : '"LeadBoost helped me define my brand identity. Now AI generates campaigns that look exactly like my business."'
                        }
                      </p>
                      <div className="text-sm">
                        <p className="font-bold text-gray-900">Carlos R.</p>
                        <p className="text-gray-500">{isSpanish ? 'Emprendedor' : 'Entrepreneur'}</p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                      <div className="flex mb-3">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-green-500 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-700 text-sm mb-4">
                        {isSpanish 
                          ? '"Desde que uso LeadBoost, nuestras ventas aumentaron 40%. El ROI es impresionante y el equipo está fascinado."'
                          : '"Since using LeadBoost, our sales increased 40%. The ROI is impressive and the team is thrilled."'
                        }
                      </p>
                      <div className="text-sm">
                        <p className="font-bold text-gray-900">Ana L.</p>
                        <p className="text-gray-500">{isSpanish ? 'CEO' : 'CEO'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Trustpilot Link */}
                  <div className="mt-6">
                    <a href="https://trustpilot.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 font-medium text-sm">
                      {isSpanish ? 'Ver más reseñas en Trustpilot →' : 'See more reviews on Trustpilot →'}
                    </a>
                  </div>
                </div>

                {/* Technology Partners */}
                <div className="text-center">
                  <p className="text-gray-600 mb-8 font-medium">
                    {isSpanish ? 'Se Puede Integrar Con Las Herramientas Que Ya Usas' : 'Can Integrate With The Tools You Already Use'}
                  </p>
                  <div className="flex justify-center items-center space-x-8 lg:space-x-12 flex-wrap gap-6">
                    <div className="flex items-center space-x-2 text-black hover:text-gray-800 transition-colors">
                      <SiWix className="h-8 w-8" />
                    </div>
                    <div className="flex items-center space-x-2 text-black hover:text-blue-600 transition-colors">
                      <SiStripe className="h-8 w-8" />
                      <span className="text-lg font-semibold">Stripe</span>
                    </div>
                    <div className="flex items-center space-x-2 text-black hover:text-blue-600 transition-colors">
                      <SiQuickbooks className="h-8 w-8" />
                      <span className="text-lg font-semibold">QuickBooks</span>
                    </div>
                    <div className="flex items-center space-x-2 text-black hover:text-green-600 transition-colors">
                      <SiShopify className="h-8 w-8" />
                      <span className="text-lg font-semibold">Shopify</span>
                    </div>
                    <div className="flex items-center space-x-2 text-black hover:text-purple-600 transition-colors">
                      <SiZapier className="h-8 w-8" />
                      <span className="text-lg font-semibold">Zapier</span>
                    </div>
                    <div className="flex items-center space-x-2 text-black hover:text-gray-700 transition-colors">
                      <SiSquare className="h-8 w-8" />
                      <span className="text-lg font-semibold">Square</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {isSpanish ? '+ 50+ integraciones más disponibles' : '+ 50+ more integrations available'}
                  </p>
                </div>
              </div>
            </div>

            
            {/* Benefits Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
              <Card className="text-center p-8 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white/90 via-brand-50/60 to-emerald-50/40 border border-brand-200/50 group hover:scale-105 backdrop-blur-sm hover:border-brand-400/60">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Lanzamiento Instantáneo' : 'Instant Launch'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish ? 'De tu marca a 21+ plataformas en segundos. Sin configuración manual.' : 'From your brand to 21+ platforms in seconds. No manual setup.'}
                  </p>
                  <div className="mt-6 text-emerald-600 font-bold text-3xl">
                    30s
                  </div>
                </CardContent>
              </Card>
              
              <Card className="text-center p-8 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white/90 via-brand-50/60 to-purple-50/40 border border-brand-200/50 group hover:scale-105 backdrop-blur-sm hover:border-brand-400/60">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Target className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Auto-Dimensionado' : 'Auto-Sizing'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish ? 'Stories, posts, emails, threads — dimensionados al instante.' : 'Stories, posts, emails, threads — sized instantly.'}
                  </p>
                  <div className="mt-6 text-rose-600 font-bold text-3xl">
                    21+
                  </div>
                </CardContent>
              </Card>
              
              <Card className="text-center p-8 hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white/90 via-brand-50/60 to-orange-50/40 border border-brand-200/50 group hover:scale-105 backdrop-blur-sm hover:border-brand-400/60">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <TrendingUp className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Máximo Alcance' : 'Maximum Reach'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish ? 'Logra 30x el impacto sin las horas de trabajo.' : 'Achieve 30x the impact without the hours of work.'}
                  </p>
                  <div className="mt-6 text-orange-600 font-bold text-3xl">
                    30x
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Platform Management Section */}
        <div id="tools-section" className="py-24 bg-gradient-to-br from-brand-200/50 via-brand-300/40 to-brand-200/60 relative">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-brand-300/25 to-brand-500/15 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-brand-400/20 to-brand-600/15 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-br from-brand-200/20 to-brand-400/15 rounded-full blur-2xl"></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {isSpanish ? 'Plataforma Completa de Gestión' : 'Complete Management Platform'}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {isSpanish ? 'Más allá del generador de campañas, también tienes todas las herramientas que necesitas para dominar las redes sociales' : 'Beyond the campaign generator, you also get all the tools you need to master social media'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* #1 CampAIgner - Primary Focus */}
              <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-white/70 via-indigo-50/80 to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105 md:col-span-2 lg:col-span-1">
                <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-2 left-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  #{isSpanish ? 'PRINCIPAL' : 'PRIMARY'}
                </div>
                
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isSpanish ? 'CampAIgner' : 'CampAIgner'}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {isSpanish ? 'Nuestro revolucionario generador de campañas IA que crea contenido para 21+ plataformas en un clic' : 'Our revolutionary AI campaign generator that creates content for 21+ platforms in one click'}
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• {isSpanish ? 'Generación instantánea de campañas' : 'Instant campaign generation'}</li>
                  <li>• {isSpanish ? 'Contenido optimizado para cada plataforma' : 'Platform-optimized content'}</li>
                  <li>• {isSpanish ? 'Publicación automatizada' : 'Automated publishing'}</li>
                </ul>
              </Card>

              {/* #2 Brand Studio - Secondary Focus */}
              <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-white/70 via-pink-50/80 to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
                <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <Palette className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isSpanish ? 'Brand Studio' : 'Brand Studio'}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {isSpanish ? 'Define tu identidad de marca para que la IA entienda tu estilo y cree campañas que reflejen tu branding automáticamente' : 'Define your brand identity so AI understands your style and creates campaigns that reflect your branding automatically'}
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• {isSpanish ? 'Configuración de identidad visual' : 'Visual identity setup'}</li>
                  <li>• {isSpanish ? 'IA aprende tu estilo de marca' : 'AI learns your brand style'}</li>
                  <li>• {isSpanish ? 'Edita y personaliza diseños en nuestro Brand Studio' : 'Edit and customize designs in our Brand Studio'}</li>
                </ul>
              </Card>

              {/* #3 Unified Inbox */}
              <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-white/70 via-blue-50/80 to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
                <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isSpanish ? 'Unified Inbox' : 'Unified Inbox'}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {isSpanish ? 'Gestiona todas las conversaciones de clientes desde una plataforma centralizada' : 'Manage all customer conversations from one centralized platform'}
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• {isSpanish ? 'Responde a todos los leads desde un solo panel de chat' : 'Answer all leads from all social media channels in one chat deck'}</li>
                  <li>• {isSpanish ? 'ChatBot con IA' : 'AI ChatBot'}</li>
                  <li>• {isSpanish ? 'Gestión multicanal' : 'Multi-channel management'}</li>
                </ul>
              </Card>

              {/* Analytics Dashboard */}
              <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-white/70 via-amber-50/80 to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
                <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isSpanish ? 'Analytics Dashboard' : 'Analytics Dashboard'}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {isSpanish ? 'Métricas detalladas y reportes de rendimiento en tiempo real para todas tus campañas y plataformas' : 'Detailed metrics and real-time performance reports for all your campaigns and platforms'}
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• {isSpanish ? 'Dashboard con métricas en tiempo real' : 'Real-time metrics dashboard'}</li>
                  <li>• {isSpanish ? 'Reportes automáticos por email' : 'Automated email reports'}</li>
                  <li>• {isSpanish ? 'Análisis de rendimiento por plataforma' : 'Platform-specific performance analysis'}</li>
                </ul>
              </Card>

              {/* Monthly Planner */}
              <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-white/70 via-purple-50/80 to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
                <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isSpanish ? 'Monthly Planner' : 'Monthly Planner'}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {isSpanish ? 'Estrategia de contenido completa generada mensualmente por IA usando datos de tu negocio' : 'Complete monthly content strategy generated by AI using your business data'}
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• {isSpanish ? 'Plan estratégico mensual personalizado' : 'Personalized monthly strategic plan'}</li>
                  <li>• {isSpanish ? 'Calendario de contenido optimizado' : 'Optimized content calendar'}</li>
                  <li>• {isSpanish ? 'Sugerencias basadas en tendencias' : 'Trend-based recommendations'}</li>
                </ul>
              </Card>

              {/* Teams */}
              <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-white/70 via-rose-50/80 to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
                <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isSpanish ? 'Equipos' : 'Teams'}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {isSpanish ? 'Coordina equipos globales con asignación de tareas, seguimiento de progreso y colaboración en tiempo real' : 'Coordinate global teams with task assignment, progress tracking, and real-time collaboration'}
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• {isSpanish ? 'Asignación y seguimiento de tareas' : 'Task assignment and tracking'}</li>
                  <li>• {isSpanish ? 'Colaboración en tiempo real' : 'Real-time collaboration'}</li>
                  <li>• {isSpanish ? 'Gestión de equipos distribuidos' : 'Distributed team management'}</li>
                </ul>
              </Card>

            </div>
          </div>
        </div>

        {/* Onboarding Progress */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
          <OnboardingProgress isSpanish={isSpanish} />
        </div>


        {/* Final CTA */}
        <div className="py-24 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              {isSpanish ? '¿Listo para Revolucionar tu Marketing?' : 'Ready to Revolutionize your Marketing?'}
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              {isSpanish ? 'Está en todas partes donde tu audiencia navega — con un clic.' : 'Be everywhere your audience scrolls — with one click.'}
            </p>
            
            <Button 
              size="lg" 
              className="bg-white text-brand-600 hover:bg-gray-100 px-12 py-4 text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl hover-lift mb-8"
            >
              <Sparkles className="mr-3 h-6 w-6" />
              {isSpanish ? 'Comenzar Ahora Gratis' : 'Start Free Now'}
            </Button>
            
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto border border-white/20">
              <div className="text-center space-y-3">
                <p className="text-white font-medium text-base">
                  {isSpanish ? 'Herramienta CampAIgner GRATIS' : 'CampAIgner tool FREE'}
                </p>
                <p className="text-blue-100 text-sm">
                  {isSpanish ? '30 días gratis para todas las herramientas' : '30 days free for all tools'}
                </p>
              </div>
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
                {isSpanish ? 'Donde el marketing empieza a funcionar.' : 'Where marketing starts working.'}
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

        {/* Help AI Chatbot */}
        <HelpChatbot isSpanish={isSpanish} />
      </div>
    </>
  );
}

// Campaign Background Flow - Squarespace Style
function CampaignBackgroundFlow({ isSpanish }: { isSpanish: boolean }) {
  // Simplified platform showcase - Key platforms LeadBoost supports
  const campaignData = [
    // Column 1
    [
      { platform: 'instagram-post', width: 260, height: 260, bgColor: 'bg-gradient-to-br from-pink-500 to-purple-600', icon: <SiInstagram className="h-4 w-4 text-white" />, title: isSpanish ? 'Post Instagram' : 'Instagram Post' },
      { platform: 'email-newsletter', width: 300, height: 200, bgColor: 'bg-gradient-to-br from-indigo-600 to-blue-700', icon: <SiGmail className="h-4 w-4 text-white" />, title: isSpanish ? 'Newsletter' : 'Email Newsletter' },
      { platform: 'tiktok-cover', width: 200, height: 350, bgColor: 'bg-gradient-to-br from-gray-800 to-gray-900', icon: <SiTiktok className="h-4 w-4 text-white" />, title: isSpanish ? 'Portada TikTok' : 'TikTok Cover' },
      { platform: 'linkedin-post', width: 280, height: 200, bgColor: 'bg-gradient-to-br from-blue-700 to-indigo-800', icon: <SiLinkedin className="h-4 w-4 text-white" />, title: isSpanish ? 'Post LinkedIn' : 'LinkedIn Post' },
    ],
    // Column 2
    [
      { platform: 'instagram-story', width: 180, height: 320, bgColor: 'bg-gradient-to-br from-purple-500 to-pink-600', icon: <SiInstagram className="h-4 w-4 text-white" />, title: isSpanish ? 'Historia' : 'Instagram Story' },
      { platform: 'facebook-post', width: 300, height: 180, bgColor: 'bg-gradient-to-br from-blue-600 to-indigo-700', icon: <SiFacebook className="h-4 w-4 text-white" />, title: isSpanish ? 'Post Facebook' : 'Facebook Post' },
      { platform: 'twitter-post', width: 320, height: 160, bgColor: 'bg-gradient-to-br from-slate-800 to-slate-900', icon: <SiX className="h-4 w-4 text-white" />, title: isSpanish ? 'Post Twitter' : 'Twitter Post' },
      { platform: 'whatsapp-message', width: 260, height: 180, bgColor: 'bg-gradient-to-br from-green-500 to-green-700', icon: <SiWhatsapp className="h-4 w-4 text-white" />, title: isSpanish ? 'Mensaje' : 'WhatsApp' },
    ],
    // Column 3
    [
      { platform: 'youtube-thumbnail', width: 300, height: 170, bgColor: 'bg-gradient-to-br from-red-500 to-red-700', icon: <SiYoutube className="h-4 w-4 text-white" />, title: isSpanish ? 'Miniatura YouTube' : 'YouTube Thumbnail' },
      { platform: 'instagram-reel', width: 200, height: 360, bgColor: 'bg-gradient-to-br from-orange-400 to-pink-500', icon: <SiInstagram className="h-4 w-4 text-white" />, title: isSpanish ? 'Reel' : 'Instagram Reel' },
      { platform: 'linkedin-banner', width: 320, height: 120, bgColor: 'bg-gradient-to-br from-blue-800 to-indigo-900', icon: <SiLinkedin className="h-4 w-4 text-white" />, title: isSpanish ? 'Banner LinkedIn' : 'LinkedIn Banner' },
      { platform: 'email-header', width: 280, height: 140, bgColor: 'bg-gradient-to-br from-purple-600 to-indigo-700', icon: <Mail className="h-4 w-4 text-white" />, title: isSpanish ? 'Cabecera Email' : 'Email Header' },
    ]
  ];

  return (
    <div className="absolute inset-0 overflow-hidden">
      {campaignData.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="absolute top-0 animate-float-down"
          style={{
            left: `${-5 + columnIndex * 30}%`,
            animationDelay: `${columnIndex * 0.5}s`,
            animationDuration: '25s'
          }}
        >
          {/* Duplicate the column content for seamless loop */}
          <div className="flex flex-col space-y-6">
            {[...column, ...column].map((campaign, cardIndex) => (
              <div
                key={`${columnIndex}-${cardIndex}`}
                className="rounded-2xl shadow-2xl border border-white/5 overflow-hidden opacity-70 hover:opacity-95 transition-all duration-700 transform hover:scale-105 backdrop-blur-sm"
                style={{
                  width: `${campaign.width * 0.75}px`,
                  height: `${campaign.height * 0.75}px`,
                }}
              >
                <div className={`w-full h-full ${campaign.bgColor} relative flex items-center justify-center`}>
                  {/* Premium glass effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20"></div>
                  
                  {/* Platform Icon */}
                  <div className="absolute top-3 right-3 w-7 h-7 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20">
                    {campaign.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="text-center text-white p-6 relative z-10">
                    <h4 className="font-light text-base leading-tight opacity-95 tracking-wide">
                      {campaign.title}
                    </h4>
                    <div className="mt-3 w-12 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent mx-auto"></div>
                  </div>
                  
                  {/* Sophisticated overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* How It Works Steps - Ghost Appear */}
      {/* Connected "As Easy As" Section - Centered to Steps */}
      <div className="absolute top-20 right-8 lg:right-16 z-20 w-72">
        {/* Header with Visual Connection */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent animate-ghost-appear mb-3" style={{ animationDelay: '0.1s' }}>
            {isSpanish ? 'Así de Fácil' : 'As Easy As'}
          </h2>
          <div className="flex justify-center animate-ghost-appear" style={{ animationDelay: '0.2s' }}>
            <ChevronDown className="w-6 h-6 text-brand-600 animate-bounce" />
          </div>
        </div>
      </div>
      {/* Step 1 */}
      <div className="absolute top-36 right-8 lg:right-16 z-20">
        <div className="group bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm p-5 w-72 hover:shadow-md transition-all duration-200 animate-ghost-appear" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-brand-500 to-brand-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base">1</span>
            </div>
            <h3 className="text-gray-900 font-semibold text-base">
              {isSpanish ? 'IA Genera y Publica' : 'AI Generates & Posts'}
            </h3>
          </div>
          <p className="text-gray-600 text-xs leading-relaxed mb-2">
            {isSpanish ? 'Crea y publica campañas automáticamente en más de 21 plataformas al mismo tiempo' : 'Creates and posts campaigns automatically across 21+ platforms simultaneously'}
          </p>
          <div className="flex items-center gap-2 text-xs text-brand-600 font-medium">
            <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
            {isSpanish ? 'Instagram • LinkedIn • TikTok • Email • +17 más' : 'Instagram • LinkedIn • TikTok • Email • +17 more'}
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="absolute top-[19rem] right-8 lg:right-16 z-20">
        <div className="group bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm p-5 w-72 hover:shadow-md transition-all duration-200 animate-ghost-appear" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base">2</span>
            </div>
            <h3 className="text-gray-900 font-semibold text-base">
              {isSpanish ? 'Obtienes 30x Más Leads' : 'Get 30x More Leads'}
            </h3>
          </div>
          <p className="text-gray-600 text-xs leading-relaxed mb-2">
            {isSpanish ? 'Multiplica tus clientes potenciales con contenido optimizado que atrae a tu audiencia ideal' : 'Multiply your potential customers with optimized content that attracts your ideal audience'}
          </p>
          <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
            <TrendingUp className="w-3 h-3" />
            {isSpanish ? 'Crecimiento Comprobado' : 'Proven Growth'}
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="absolute top-[28rem] right-8 lg:right-16 z-20">
        <div className="group bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm p-5 w-72 hover:shadow-md transition-all duration-200 animate-ghost-appear" style={{ animationDelay: '1.2s' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base">3</span>
            </div>
            <h3 className="text-gray-900 font-semibold text-base">
              {isSpanish ? 'Convierte con IA Chat' : 'Convert with AI Chat'}
            </h3>
          </div>
          <p className="text-gray-600 text-xs leading-relaxed mb-2">
            {isSpanish ? 'Nuestro chatbot inteligente convierte visitantes en clientes las 24/7 sin intervención humana' : 'Our smart chatbot converts visitors into customers 24/7 without human intervention'}
          </p>
          <div className="flex items-center gap-2 text-xs text-purple-600 font-medium">
            <MessageSquare className="w-3 h-3" />
            {isSpanish ? 'Conversión Automatizada' : 'Automated Conversion'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Campaign Showcase Component - Squarespace Style
function CampaignShowcase({ isSpanish }: { isSpanish: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sample campaign data for different platforms with realistic content
  const campaignTemplates = [
    // Instagram Stories
    {
      platform: 'instagram-story',
      format: 'story',
      width: 240,
      height: 320,
      bgColor: 'bg-gradient-to-br from-pink-500 to-purple-600',
      icon: <SiInstagram className="h-4 w-4 text-white" />,
      content: {
        title: isSpanish ? 'Oferta Especial' : 'Special Offer',
        subtitle: isSpanish ? '30% Descuento' : '30% Off',
        cta: isSpanish ? 'Ver Más' : 'Learn More'
      }
    },
    // Instagram Feed
    {
      platform: 'instagram-feed',
      format: 'square',
      width: 280,
      height: 280,
      bgColor: 'bg-gradient-to-br from-orange-400 to-pink-500',
      icon: <SiInstagram className="h-4 w-4 text-white" />,
      content: {
        title: isSpanish ? 'Qué Hay Adentro' : "What's Inside",
        subtitle: isSpanish ? 'Disponible Ahora' : 'Available Now'
      }
    },
    // TikTok Vertical
    {
      platform: 'tiktok',
      format: 'vertical',
      width: 220,
      height: 380,
      bgColor: 'bg-gradient-to-br from-gray-800 to-gray-900',
      icon: <SiTiktok className="h-4 w-4 text-white" />,
      content: {
        title: isSpanish ? 'Tendencia Viral' : 'Trending Now',
        subtitle: isSpanish ? '#ParaTi' : '#ForYou'
      }
    },
    // Facebook Post
    {
      platform: 'facebook',
      format: 'landscape',
      width: 320,
      height: 180,
      bgColor: 'bg-gradient-to-br from-blue-600 to-indigo-700',
      icon: <SiFacebook className="h-4 w-4 text-white" />,
      content: {
        title: isSpanish ? 'Evento Exclusivo' : 'Exclusive Event',
        subtitle: isSpanish ? 'Solo Este Fin de Semana' : 'This Weekend Only'
      }
    },
    // YouTube Thumbnail
    {
      platform: 'youtube',
      format: 'landscape',
      width: 320,
      height: 180,
      bgColor: 'bg-gradient-to-br from-red-500 to-red-700',
      icon: <SiYoutube className="h-4 w-4 text-white" />,
      content: {
        title: isSpanish ? 'Tutorial Completo' : 'Complete Tutorial',
        subtitle: isSpanish ? '10 Minutos' : '10 Minutes'
      }
    },
    // LinkedIn Post  
    {
      platform: 'linkedin',
      format: 'square',
      width: 280,
      height: 280,
      bgColor: 'bg-gradient-to-br from-blue-700 to-indigo-800',
      icon: <SiLinkedin className="h-4 w-4 text-white" />,
      content: {
        title: isSpanish ? 'Crecimiento Empresarial' : 'Business Growth',
        subtitle: isSpanish ? 'Estrategias Probadas' : 'Proven Strategies'
      }
    },
    // X/Twitter Post
    {
      platform: 'x',
      format: 'wide',
      width: 340,
      height: 160,
      bgColor: 'bg-gradient-to-br from-slate-800 to-slate-900',
      icon: <SiX className="h-4 w-4 text-white" />,
      content: {
        title: isSpanish ? 'Última Hora' : 'Breaking News',
        subtitle: isSpanish ? 'Actualizaciones en vivo' : 'Live Updates'
      }
    },
    // WhatsApp Business
    {
      platform: 'whatsapp',
      format: 'message',
      width: 300,
      height: 200,
      bgColor: 'bg-gradient-to-br from-green-500 to-green-700',
      icon: <SiWhatsapp className="h-4 w-4 text-white" />,
      content: {
        title: isSpanish ? 'Mensaje Directo' : 'Direct Message',
        subtitle: isSpanish ? 'Respuesta Automática' : 'Auto Reply'
      }
    }
  ];

  // Animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaignTemplates.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [campaignTemplates.length]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>
      
      {/* Cascading Campaign Previews */}
      <div className="relative">
        {campaignTemplates.map((template, index) => {
          const isActive = index === currentIndex;
          const offset = (index - currentIndex + campaignTemplates.length) % campaignTemplates.length;
          
          return (
            <div
              key={`${template.platform}-${index}`}
              className={`absolute transition-all duration-1000 ease-in-out transform ${
                isActive 
                  ? 'scale-110 z-20 opacity-100' 
                  : offset === 1 || offset === campaignTemplates.length - 1
                  ? 'scale-95 z-10 opacity-70'
                  : 'scale-85 z-5 opacity-40'
              }`}
              style={{
                left: `${50 + (offset - Math.floor(campaignTemplates.length / 2)) * 100}px`,
                top: `${50 + Math.sin(offset * 0.5) * 30}px`,
                width: `${template.width}px`,
                height: `${template.height}px`,
                transform: `translate(-50%, -50%) scale(${
                  isActive ? 1.1 : offset === 1 || offset === campaignTemplates.length - 1 ? 0.95 : 0.85
                }) rotate(${(offset - Math.floor(campaignTemplates.length / 2)) * 2}deg)`
              }}
            >
              {/* Campaign Card */}
              <div className={`w-full h-full ${template.bgColor} rounded-2xl shadow-2xl border border-white/20 overflow-hidden relative group`}>
                {/* Platform Icon */}
                <div className="absolute top-3 right-3 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  {template.icon}
                </div>
                
                {/* Content */}
                <div className="p-4 h-full flex flex-col justify-center text-white relative z-10">
                  <div className="text-center">
                    <h3 className="text-lg font-bold mb-2 leading-tight">
                      {template.content.title}
                    </h3>
                    <p className="text-sm opacity-90 mb-3 leading-relaxed">
                      {template.content.subtitle}
                    </p>
                    {template.content.cta && (
                      <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                        {template.content.cta}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Platform Labels */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-3">
          {campaignTemplates.map((template, index) => (
            <div
              key={`indicator-${index}`}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-brand-600 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Central Label */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700">
            {isSpanish ? 'Campañas Listas Para Usar' : 'Ready-to-Use Campaigns'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {isSpanish ? '21+ Formatos Automáticos' : '21+ Automatic Formats'}
          </p>
        </div>
      </div>
    </div>
  );
}

// Help AI Chatbot Component
function HelpChatbot({ isSpanish }: { isSpanish: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{id: string, text: string, isBot: boolean, timestamp: Date}>>([{
    id: '1',
    text: isSpanish 
      ? '¡Hola! Soy tu asistente de LeadBoost. ¿En qué puedo ayudarte con la plataforma?' 
      : 'Hi! I\'m your LeadBoost assistant. How can I help you with the platform?',
    isBot: true,
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatMutation = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language: isSpanish ? 'spanish' : 'english' })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    onSuccess: (response: any) => {
      const botMessage = {
        id: Date.now().toString(),
        text: response.message || (isSpanish ? 'Lo siento, no pude procesar tu mensaje.' : 'Sorry, I couldn\'t process your message.'),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    },
    onError: () => {
      const errorMessage = {
        id: Date.now().toString(),
        text: isSpanish 
          ? 'Lo siento, hay un problema técnico. Puedes revisar nuestras FAQ o contactar soporte.' 
          : 'Sorry, there\'s a technical issue. You can check our FAQ or contact support.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    chatMutation.mutate({ message: inputMessage });
    setInputMessage('');
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center justify-center w-8 h-8 rounded-full opacity-40 hover:opacity-80 transition-all duration-500 ease-out hover:scale-110"
          data-testid="button-open-help-chatbot"
        >
          <div className="text-lg font-light text-gray-500 group-hover:text-brand-500 transition-colors duration-300">?</div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[500px] bg-white rounded-lg shadow-xl border">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-brand-600 text-white rounded-t-lg">
          <div>
            <CardTitle className="text-lg">{isSpanish ? 'Asistente LeadBoost' : 'LeadBoost Assistant'}</CardTitle>
            <div className="flex items-center gap-1 text-sm opacity-90">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              {isSpanish ? 'En línea' : 'Online'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleLanguage}
              className="text-white hover:bg-brand-700 text-xs px-2"
            >
              {isSpanish ? '🇺🇸 EN' : '🇪🇸 ES'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-white hover:bg-brand-700">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 max-h-80">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.isBot ? 'bg-gray-100 text-gray-800' : 'bg-brand-600 text-white'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={isSpanish ? 'Escribe tu pregunta...' : 'Type your question...'}
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={handleSendMessage} size="sm" disabled={!inputMessage.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Powered by LeadBoost AI</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}