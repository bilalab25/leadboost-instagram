import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bot, BarChart3, Sparkles, Globe, Play, ChevronDown, Star, Target, Users, Zap } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import leadBoostLogo from "@assets/Lead Boost (500 x 200 px) (500 x 160 px)_1756873932398.png";

export default function Landing() {
  const { language, toggleLanguage, isSpanish } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <img 
                src={leadBoostLogo} 
                alt="CampAIgner Logo" 
                className="h-10 w-auto object-contain" 
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                    data-testid="button-features"
                  >
                    {isSpanish ? "Características" : "Features"}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem>
                    <Sparkles className="h-4 w-4 mr-3 text-cyan-600" />
                    <div>
                      <div className="font-medium">CampAIgner</div>
                      <div className="text-xs text-slate-500">{isSpanish ? 'Generador de campañas IA' : 'AI Campaign Generator'}</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="h-4 w-4 mr-3 text-blue-600" />
                    <div>
                      <div className="font-medium">{isSpanish ? 'Bandeja Unificada' : 'Unified Inbox'}</div>
                      <div className="text-xs text-slate-500">{isSpanish ? 'Mensajería multiplataforma' : 'Multi-platform messaging'}</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BarChart3 className="h-4 w-4 mr-3 text-green-600" />
                    <div>
                      <div className="font-medium">{isSpanish ? 'Analytics' : 'Analytics Dashboard'}</div>
                      <div className="text-xs text-slate-500">{isSpanish ? 'Métricas en tiempo real' : 'Real-time metrics'}</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-sm font-medium"
              >
                <Globe className="h-4 w-4 mr-2" />
                {isSpanish ? 'EN' : 'ES'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-slate-100 border border-slate-200">
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
            
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              {isSpanish ? (
                <>
                  Haz crecer tu negocio
                  <br />
                  <span className="text-slate-600">en piloto automático</span>
                </>
              ) : (
                <>
                  Grow your business
                  <br />
                  <span className="text-slate-600">on autopilot</span>
                </>
              )}
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
              {isSpanish 
                ? 'Plataforma de IA que automatiza marketing, ventas y atención al cliente. Todo desde un solo lugar.' 
                : 'AI platform that automates marketing, sales, and customer service. All from one place.'
              }
            </p>
            
            {/* Platform Icons */}
            <div className="flex justify-center items-center gap-4 mb-12">
              <div className="flex items-center gap-3 text-slate-400">
                <SiInstagram className="w-6 h-6" />
                <SiTiktok className="w-6 h-6" />
                <SiFacebook className="w-6 h-6" />
                <SiWhatsapp className="w-6 h-6" />
                <SiLinkedin className="w-6 h-6" />
                <SiYoutube className="w-6 h-6" />
                <span className="text-sm font-medium">+15 more</span>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 py-3 text-lg rounded-lg"
                data-testid="button-start-free"
              >
                {isSpanish ? 'Empezar gratis' : 'Start free'}
              </Button>
              <Button 
                variant="outline" 
                className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-8 py-3 text-lg rounded-lg"
                data-testid="button-watch-demo"
              >
                <Play className="w-4 h-4 mr-2" />
                {isSpanish ? 'Ver demo' : 'Watch demo'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {isSpanish ? 'Todo lo que necesitas' : 'Everything you need'}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {isSpanish 
                ? 'Herramientas potentes para automatizar tu negocio completamente'
                : 'Powerful tools to automate your business completely'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {isSpanish ? 'Generación IA' : 'AI Generation'}
                </h3>
                <p className="text-slate-600">
                  {isSpanish ? 'Crea contenido para 21+ plataformas automáticamente' : 'Create content for 21+ platforms automatically'}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <MessageSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {isSpanish ? 'Bandeja Unificada' : 'Unified Inbox'}
                </h3>
                <p className="text-slate-600">
                  {isSpanish ? 'Gestiona todos los mensajes desde un solo lugar' : 'Manage all messages from one place'}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {isSpanish ? 'Analytics' : 'Analytics'}
                </h3>
                <p className="text-slate-600">
                  {isSpanish ? 'Métricas e insights en tiempo real' : 'Real-time metrics and insights'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {isSpanish ? '¿Por qué CampAIgner?' : 'Why CampAIgner?'}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {isSpanish ? 'Configuración rápida' : 'Quick setup'}
              </h3>
              <p className="text-slate-600">
                {isSpanish ? 'Listo en menos de 10 minutos' : 'Ready in under 10 minutes'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {isSpanish ? 'IA Avanzada' : 'Advanced AI'}
              </h3>
              <p className="text-slate-600">
                {isSpanish ? 'Respuestas inteligentes 24/7' : 'Smart responses 24/7'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {isSpanish ? 'Escalable' : 'Scalable'}
              </h3>
              <p className="text-slate-600">
                {isSpanish ? 'Crece con tu negocio' : 'Grows with your business'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {isSpanish ? 'Listo para automatizar tu negocio?' : 'Ready to automate your business?'}
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            {isSpanish 
              ? 'Únete a miles de empresas que ya están creciendo con CampAIgner'
              : 'Join thousands of businesses already growing with CampAIgner'
            }
          </p>
          <Button 
            className="bg-white text-slate-900 hover:bg-slate-100 font-medium px-8 py-3 text-lg rounded-lg"
            data-testid="button-get-started"
          >
            {isSpanish ? 'Empezar ahora' : 'Get started now'}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <img 
                src={leadBoostLogo} 
                alt="CampAIgner Logo" 
                className="h-16 w-auto object-contain opacity-80"
              />
            </div>
            <p className="text-slate-500 mb-6">
              {isSpanish ? 'Has hecho el trabajo duro, déjanos hacer el trabajo inteligente.' : 'You\'ve done the hard work, let us do the smart work.'}
            </p>
            <div className="flex justify-center space-x-6">
              <Button variant="ghost" className="text-slate-500 hover:text-slate-700">
                {isSpanish ? 'Privacidad' : 'Privacy'}
              </Button>
              <Button variant="ghost" className="text-slate-500 hover:text-slate-700">
                {isSpanish ? 'Términos' : 'Terms'}
              </Button>
              <Button variant="ghost" className="text-slate-500 hover:text-slate-700">
                {isSpanish ? 'Contacto' : 'Contact'}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}