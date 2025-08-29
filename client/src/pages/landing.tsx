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
    <>
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-brand-25 to-brand-100 relative overflow-hidden">
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
              <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                {isSpanish ? 'Iniciar Sesión' : 'Sign In'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Waterfall Hero Section - THE CENTERPIECE */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-100/30 via-brand-50/40 to-brand-200/20" />
        {/* Floating blue orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-brand-300/20 to-brand-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 left-10 w-64 h-64 bg-gradient-to-br from-brand-400/15 to-brand-600/10 rounded-full blur-2xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          
          {/* Main Waterfall Value Proposition */}
          <div className="text-center mb-16">
            <h2 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-4 leading-[0.9] tracking-tight">
              {isSpanish ? 'Sistema Waterfall' : 'The Waterfall System'}
            </h2>
            <div className="text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-cyan-500 mb-8">
              {isSpanish ? 'Tus datos de ventas → Campañas inteligentes' : 'Your sales data → Smart campaigns'}
            </div>
            
            <div className="max-w-4xl mx-auto mt-12">
              <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed font-medium">
                {isSpanish 
                  ? 'Transforma los datos de tu negocio en campañas completas para 21+ plataformas — todo en un clic.'
                  : 'Transform your business data into complete campaigns across 21+ platforms — all in one click.'}
              </p>
            </div>
          </div>
        </div>
        
        
        {/* The Waterfall Visual Flow */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <Card className="bg-white rounded-3xl shadow-lg border border-gray-200 max-w-6xl mx-auto waterfall-container">
              {/* Animated Waterfall Particles */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="waterfall-particle"></div>
                <div className="waterfall-particle"></div>
                <div className="waterfall-particle"></div>
                <div className="waterfall-particle"></div>
                <div className="waterfall-particle"></div>
                <div className="waterfall-particle"></div>
                <div className="waterfall-particle"></div>
                <div className="waterfall-particle"></div>
                <div className="waterfall-particle"></div>
                <div className="waterfall-particle"></div>
                <div className="waterfall-particle"></div>
                <div className="waterfall-particle"></div>
              </div>
              <CardContent className="p-8 lg:p-12 relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    
                    {/* ONE IDEA */}
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl waterfall-pulse backdrop-blur-sm border border-brand-400/20">
                        <Target className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-brand-600 mb-2">{isSpanish ? 'TU MARCA' : 'YOUR BRAND'}</h3>
                      <p className="text-gray-600 font-medium">"{isSpanish ? 'Lanzar producto nuevo' : 'Launch new product'}"</p>
                      <p className="text-sm text-gray-500 mt-1">{isSpanish ? 'Solo describe tu campaña' : 'Just describe your campaign'}</p>
                    </div>
                    
                    {/* ARROW */}
                    <div className="flex justify-center">
                      <ArrowRight className="h-8 w-8 text-brand-400 hidden lg:block" />
                      <ArrowDown className="h-8 w-8 text-brand-400 lg:hidden" />
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
                        <div className="w-10 h-10 bg-gradient-to-r from-brand-600 to-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                          +21
                        </div>
                      </div>
                      <h3 className="text-3xl font-black text-brand-600 mb-2">{isSpanish ? 'EN TODOS LADOS' : 'EVERYWHERE'}</h3>
                      <p className="text-gray-600 font-medium">{isSpanish ? '21+ plataformas, un clic' : '21+ platforms, one click'}</p>
                      <p className="text-sm text-gray-500 mt-1">{isSpanish ? 'Distribución inteligente adaptada a cada red social' : 'Smart distribution tailored to each social network'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-12 text-center">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white px-12 py-4 text-xl font-bold shadow-2xl rounded-3xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Zap className="mr-3 h-6 w-6" />
                      {isSpanish ? 'Crear Campaña Waterfall' : 'Create Waterfall Campaign'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Enhanced Benefits Section */}
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
                    {isSpanish 
                      ? 'De tu marca a 21+ plataformas en segundos. Sin configuración manual.'
                      : 'From your brand to 21+ platforms in seconds. No manual setup.'}
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
                    {isSpanish 
                      ? 'Stories, posts, emails, threads — dimensionados al instante.'
                      : 'Stories, posts, emails, threads — sized instantly.'}
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
                    {isSpanish 
                      ? 'Logra 30x el impacto sin las horas de trabajo.'
                      : 'Achieve 30x the impact without the hours of work.'}
                  </p>
                  <div className="mt-6 text-orange-600 font-bold text-3xl">
                    30x
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="py-24 bg-gradient-to-br from-brand-200/50 via-brand-300/40 to-brand-200/60 relative">
        {/* Subtle background pattern */}
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
              {isSpanish 
                ? 'Más allá del Sistema Waterfall, LeadBoost te ofrece todas las herramientas que necesitas para dominar las redes sociales'
                : 'Beyond the Waterfall System, LeadBoost offers all the tools you need to master social media'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Unified Inbox */}
            <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden !bg-gradient-to-br !from-white/70 !via-blue-50/80 !to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
              {/* Floating accent */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isSpanish ? 'Bandeja Unificada' : 'Unified Inbox'}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {isSpanish 
                  ? 'Todos tus mensajes de Instagram, WhatsApp, Email y TikTok en un solo lugar'
                  : 'All your messages from Instagram, WhatsApp, Email and TikTok in one place'}
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• {isSpanish ? 'Respuestas automáticas' : 'Auto-responses'}</li>
                <li>• {isSpanish ? 'Análisis de sentimientos' : 'Sentiment analysis'}</li>
                <li>• {isSpanish ? 'Respuesta IA inteligente 24/7' : '24/7 AI smart response'}</li>
              </ul>
            </Card>

            {/* AI Content Planner */}
            <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden !bg-gradient-to-br !from-white/70 !via-purple-50/80 !to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
              {/* Floating accent */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isSpanish ? 'Creador IA' : 'AI Creator'}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {isSpanish 
                  ? 'Creación completa de contenido mensual respaldado por datos generado por IA'
                  : 'Complete monthly data-backed content creation generated by AI'}
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• {isSpanish ? 'Contenido respaldado por tus datos de negocio' : 'Content backed by your business data'}</li>
                <li>• {isSpanish ? 'Generador de contenido viral en tiempo real' : 'Real-time viral content generator'}</li>
                <li>• {isSpanish ? 'Textos de alto impacto' : 'High-impact copywriting'}</li>
              </ul>
            </Card>

            {/* Advanced Analytics */}
            <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden !bg-gradient-to-br !from-white/70 !via-emerald-50/80 !to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
              {/* Floating accent */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isSpanish ? 'Analytics Avanzados' : 'Advanced Analytics'}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {isSpanish 
                  ? 'Métricas detalladas y reportes automáticos de rendimiento en todas las plataformas'
                  : 'Detailed metrics and automated performance reports across all platforms'}
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• {isSpanish ? 'ROI por campaña' : 'ROI per campaign'}</li>
                <li>• {isSpanish ? 'Comparativas antes vs después de LeadBoost' : 'Before vs after LeadBoost comparisons'}</li>
                <li>• {isSpanish ? 'Predicciones IA' : 'AI predictions'}</li>
              </ul>
            </Card>

            {/* Team Collaboration */}
            <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden !bg-gradient-to-br !from-white/70 !via-orange-50/80 !to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
              {/* Floating accent */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isSpanish ? 'Colaboración en Equipo' : 'Team Collaboration'}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {isSpanish 
                  ? 'Gestiona equipos, asigna tareas y controla permisos de manera eficiente'
                  : 'Manage teams, assign tasks and control permissions efficiently'}
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• {isSpanish ? 'Roles personalizados' : 'Custom roles'}</li>
                <li>• {isSpanish ? 'Flujos de aprobación' : 'Approval workflows'}</li>
                <li>• {isSpanish ? 'Historial de cambios' : 'Change history'}</li>
              </ul>
            </Card>

            {/* Campaign Management */}
            <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden !bg-gradient-to-br !from-white/70 !via-red-50/80 !to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
              {/* Floating accent */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-red-400 to-red-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isSpanish ? 'Gestión de Campañas' : 'Campaign Management'}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {isSpanish 
                  ? 'Programa, lanza y monitorea campañas multiplataforma desde un solo dashboard'
                  : 'Schedule, launch and monitor multi-platform campaigns from one dashboard'}
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• {isSpanish ? 'Programación avanzada' : 'Advanced scheduling'}</li>
                <li>• {isSpanish ? 'A/B testing automático' : 'Automatic A/B testing'}</li>
                <li>• {isSpanish ? 'Editor visual integrado tipo Canva' : 'Built-in Canva visual editor'}</li>
              </ul>
            </Card>

            {/* Global Reach */}
            <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden !bg-gradient-to-br !from-white/70 !via-teal-50/80 !to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
              {/* Floating accent */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {isSpanish ? 'Alcance Global' : 'Global Reach'}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {isSpanish 
                  ? 'Soporte completo en español e inglés con contenido adaptado a cada mercado'
                  : 'Complete support in Spanish and English with content adapted to each market'}
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• {isSpanish ? 'Localización automática' : 'Auto localization'}</li>
                <li>• {isSpanish ? 'Horarios por zona' : 'Timezone scheduling'}</li>
                <li>• {isSpanish ? 'Cultura local IA' : 'Local culture AI'}</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Social Proof / Testimonials Section */}
      <div className="py-24 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              {isSpanish ? 'Lo que dicen nuestros clientes' : 'What our customers say'}
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {isSpanish ? 'Resultados reales de empresas reales' : 'Real results from real companies'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold text-lg">MG</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">María González</h4>
                  <p className="text-brand-600 text-sm font-medium">CMO, TechStart</p>
                </div>
              </div>
              <p className="text-gray-700 italic mb-6 text-lg leading-relaxed">
                "{isSpanish ? 'Redujimos el tiempo de lanzamiento de campañas de 3 días a 30 segundos. Increíble.' : 'We reduced campaign launch time from 3 days to 30 seconds. Incredible.'}"
              </p>
              <div className="flex text-yellow-500 text-xl">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold text-lg">JS</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">James Smith</h4>
                  <p className="text-emerald-600 text-sm font-medium">Founder, GrowthCo</p>
                </div>
              </div>
              <p className="text-gray-700 italic mb-6 text-lg leading-relaxed">
                "{isSpanish ? 'Nuestro ROI en redes sociales aumentó 400% en el primer mes.' : 'Our social media ROI increased 400% in the first month.'}"
              </p>
              <div className="flex text-yellow-500 text-xl">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white font-bold text-lg">AL</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Ana López</h4>
                  <p className="text-purple-600 text-sm font-medium">CEO, DigitalBrand</p>
                </div>
              </div>
              <p className="text-gray-700 italic mb-6 text-lg leading-relaxed">
                "{isSpanish ? 'El sistema más inteligente que he usado. Ahora somos líderes en nuestro sector.' : 'The smartest system I have used. We are now leaders in our sector.'}"
              </p>
              <div className="flex text-yellow-500 text-xl">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Video Section */}
      <div className="pb-0 relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-brand-200/8 to-brand-400/4 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-brand-300/6 to-brand-500/3 rounded-full blur-3xl"></div>
        <div className="max-w-full mx-auto relative z-10">
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-gray-900">
            {/* Video Mockup Container */}
            <div className="relative aspect-[21/9] bg-gradient-to-br from-slate-900 via-slate-800 to-black">
              {/* Enhanced background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full" style={{
                  backgroundImage: `
                    linear-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px'
                }} />
              </div>
              {/* Video Content Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/5 to-black/30 cursor-pointer group transition-all duration-700 hover:from-black/40 hover:via-black/10 hover:to-black/40" data-testid="video-play-button">
                {/* Content Container */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-16 py-20">
                  {/* Title Section */}
                  <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 drop-shadow-lg">
                      {isSpanish ? 'Ve LeadBoost en Acción' : 'See LeadBoost in Action'}
                    </h2>
                    <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md">
                      {isSpanish 
                        ? 'Descubre cómo funciona el Sistema Waterfall en menos de 2 minutos'
                        : 'Discover how the Waterfall System works in less than 2 minutes'}
                    </p>
                  </div>

                  {/* Demo Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl w-full">
                    <div className="text-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group/card">
                      <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover/card:scale-110 transition-transform duration-300">
                        <Zap className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {isSpanish ? 'Configuración Rápida' : 'Quick Setup'}
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {isSpanish ? 'Ve qué tan fácil es comenzar' : 'See how easy it is to get started'}
                      </p>
                    </div>
                    
                    <div className="text-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group/card">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover/card:scale-110 transition-transform duration-300">
                        <Target className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {isSpanish ? 'Campaña en Vivo' : 'Live Campaign'}
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {isSpanish ? 'Mira una campaña real desplegándose' : 'Watch a real campaign being deployed'}
                      </p>
                    </div>
                    
                    <div className="text-center bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group/card">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover/card:scale-110 transition-transform duration-300">
                        <BarChart3 className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {isSpanish ? 'Resultados Reales' : 'Real Results'}
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {isSpanish ? 'Datos de clientes reales' : 'Real customer data'}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Play Button */}
                  <div className="relative">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all duration-500 border border-white/20 shadow-2xl">
                      <div className="w-20 h-20 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        <div className="w-0 h-0 border-l-[18px] border-l-gray-700 border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent ml-1"></div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-white/15 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                    
                    {/* Subtle pulse rings */}
                    <div className="absolute inset-0 rounded-full border border-white/30 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border border-white/20 animate-ping" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
              
              {/* Modern Video Preview Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
                    <span className="text-white font-semibold text-sm">LeadBoost Platform</span>
                  </div>
                  <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-full px-4 py-2 shadow-lg">
                    <span className="text-white text-sm font-medium">● Demo</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 max-w-lg mx-auto border border-white/10 shadow-2xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-white text-2xl font-bold mb-3">
                      {isSpanish ? 'Sistema Waterfall' : 'Waterfall System'}
                    </h3>
                    <p className="text-gray-300 text-base">
                      {isSpanish ? 'De una idea a 21+ plataformas en segundos' : 'From one idea to 21+ platforms in seconds'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <SiInstagram className="h-5 w-5 text-white" />
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                      <SiFacebook className="h-5 w-5 text-white" />
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-black rounded-xl flex items-center justify-center shadow-lg">
                      <SiTiktok className="h-5 w-5 text-white" />
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
                      <SiYoutube className="h-5 w-5 text-white" />
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      +17
                    </div>
                  </div>
                  <span className="text-white/70 text-sm font-mono">2:14</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-24 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {isSpanish ? '¿Listo para Revolucionar tu Marketing?' : 'Ready to Revolutionize your Marketing?'}
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            {isSpanish 
              ? 'Está en todas partes donde tu audiencia navega — con un clic.'
              : 'Be everywhere your audience scrolls — with one click.'}
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
                {isSpanish ? 'Sistema Waterfall GRATIS para siempre' : 'Waterfall System FREE forever'}
              </p>
              <p className="text-blue-100 text-sm">
                {isSpanish ? '30 días gratis para todas las herramientas' : '30 days free for all tools'}
              </p>
              <p className="text-blue-100 text-sm">
                {isSpanish ? 'Después $99/mes para acceso completo' : 'Then $99/month for full access'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <img 
                src={leadBoostLogo} 
                alt="LeadBoost Logo" 
                className="h-96 w-auto object-contain"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
            <p className="text-gray-400 mb-6">
              {isSpanish 
                ? 'El Sistema Waterfall que revoluciona la gestión de redes sociales'
                : 'The Waterfall System that revolutionizes social media management'}
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
    </>
  );
}