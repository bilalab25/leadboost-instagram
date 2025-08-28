import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield, ArrowDown, ArrowRight, Sparkles, Target, Globe, TrendingUp } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube, SiX } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";
import leadBoostLogo from "@assets/logo azul sin fondo_1756140873617.png";

export default function Landing() {
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const t = translations[language];

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
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
        <div className="absolute inset-0 bg-brand-50/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          
          {/* Main Waterfall Value Proposition */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <h2 className="text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-4 leading-tight">
                {isSpanish ? 'Sistema Waterfall' : 'The Waterfall System'}
              </h2>
              <div className="text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-cyan-500 mb-6">
                {isSpanish ? 'Tu marca → En todos lados' : 'Your brand → Everywhere'}
              </div>
            </div>
            
            <p className="text-xl lg:text-2xl text-gray-700 mb-12 max-w-5xl mx-auto leading-relaxed">
              {isSpanish 
                ? 'Impulsa tu presencia en 21+ plataformas — campañas completas creadas desde tus datos de negocio, en un clic.'
                : 'Boost your presence across 21+ platforms — complete campaigns built from your business data, in one click.'}
            </p>
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
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg waterfall-pulse">
                        <Target className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-emerald-600 mb-2">{isSpanish ? 'TU MARCA' : 'YOUR BRAND'}</h3>
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
                      <p className="text-gray-600 font-medium">{isSpanish ? '21+ Plataformas' : '21+ Platforms'}</p>
                      <p className="text-sm text-gray-500 mt-1">{isSpanish ? 'Formato perfecto automático' : 'Perfect format automatically'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-12 text-center">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white px-12 py-4 text-xl font-bold shadow-lg rounded-2xl"
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
              <Card className="text-center p-8 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50 border border-emerald-200 group hover:scale-105">
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
              
              <Card className="text-center p-8 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50 border border-purple-200 group hover:scale-105">
                <CardContent className="pt-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Target className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Formato Perfecto' : 'Perfect Format'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish 
                      ? 'Cada plataforma recibe el contenido en su tamaño y formato ideal.'
                      : 'Each platform gets content in its ideal size and format.'}
                  </p>
                  <div className="mt-6 text-purple-600 font-bold text-3xl">
                    21+
                  </div>
                </CardContent>
              </Card>
              
              <Card className="text-center p-8 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-orange-50 border border-orange-200 group hover:scale-105">
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
            
            {/* Social Proof / Testimonials Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 mb-16 border border-gray-200">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {isSpanish ? 'Lo que dicen nuestros clientes' : 'What our customers say'}
                </h3>
                <p className="text-gray-600 text-lg">
                  {isSpanish ? 'Resultados reales de empresas reales' : 'Real results from real companies'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">MG</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">María González</h4>
                      <p className="text-gray-600 text-sm">CMO, TechStart</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic mb-4">
                    "{isSpanish ? 'Redujimos el tiempo de lanzamiento de campañas de 3 días a 30 segundos. Increíble.' : 'We reduced campaign launch time from 3 days to 30 seconds. Incredible.'}"
                  </p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">JS</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">James Smith</h4>
                      <p className="text-gray-600 text-sm">Founder, GrowthCo</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic mb-4">
                    "{isSpanish ? 'Nuestro ROI en redes sociales aumentó 400% en el primer mes.' : 'Our social media ROI increased 400% in the first month.'}"
                  </p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 md:col-span-2 lg:col-span-1">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">AL</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Ana López</h4>
                      <p className="text-gray-600 text-sm">CEO, DigitalBrand</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic mb-4">
                    "{isSpanish ? 'El sistema más inteligente que he usado. Ahora somos líderes en nuestro sector.' : 'The smartest system I have used. We are now leaders in our sector.'}"
                  </p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <MessageSquare className="h-6 w-6 text-white" />
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
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                  <Bot className="h-6 w-6 text-white" />
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
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                  <BarChart3 className="h-6 w-6 text-white" />
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
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4">
                  <Users className="h-6 w-6 text-white" />
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
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mr-4">
                  <Target className="h-6 w-6 text-white" />
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
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-teal-500">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center mr-4">
                  <Globe className="h-6 w-6 text-white" />
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

      {/* Demo Video Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {isSpanish ? 'Ve LeadBoost en Acción' : 'See LeadBoost in Action'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {isSpanish 
                ? 'Descubre cómo funciona el Sistema Waterfall en menos de 2 minutos'
                : 'Discover how the Waterfall System works in less than 2 minutes'}
            </p>
          </div>
          
          {/* Demo Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {isSpanish ? 'Configuración en 30s' : '30s Setup'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isSpanish ? 'Ve qué tan fácil es comenzar' : 'See how easy it is to get started'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {isSpanish ? 'Campaña en Vivo' : 'Live Campaign'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isSpanish ? 'Mira una campaña real desplegándose' : 'Watch a real campaign being deployed'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {isSpanish ? 'Resultados Reales' : 'Real Results'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isSpanish ? 'Datos de clientes reales' : 'Real customer data'}
              </p>
            </div>
          </div>
          
          <div className="relative rounded-3xl overflow-hidden shadow-3xl bg-black max-w-5xl mx-auto border border-gray-800">
            {/* Video Mockup Container */}
            <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-black">
              {/* Sleek Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/20 via-transparent to-black/20 cursor-pointer group" data-testid="video-play-button">
                <div className="relative">
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all duration-500 border border-white/20">
                    <div className="w-20 h-20 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                      <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-500/30 to-brand-600/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
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
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
                    <span className="text-white text-sm font-mono">2:14</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sleek Video Controls Bar */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 border-t border-gray-700">
              <div className="flex items-center space-x-6">
                <button className="text-white hover:text-brand-400 transition-all duration-300 p-2 rounded-lg hover:bg-white/10" data-testid="video-control-play">
                  <div className="w-0 h-0 border-l-[10px] border-l-current border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent"></div>
                </button>
                <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full w-1/3 shadow-lg"></div>
                </div>
                <span className="text-gray-300 text-sm font-mono">0:45 / 2:14</span>
                <button className="text-white hover:text-brand-400 transition-all duration-300 p-2 rounded-lg hover:bg-white/10" data-testid="video-control-fullscreen">
                  <div className="w-5 h-5 border-2 border-current rounded"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 via-brand-700 via-brand-600 to-brand-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            {isSpanish ? '¿Listo para Revolucionar tu Marketing?' : 'Ready to Revolutionize your Marketing?'}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {isSpanish 
              ? 'Únete a miles de empresas que ya están usando LeadBoost para dominar las redes sociales'
              : 'Join thousands of companies already using LeadBoost to dominate social media'}
          </p>
          <Button 
            size="lg" 
            className="bg-white text-brand-600 hover:bg-gray-100 px-12 py-4 text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl hover-lift"
          >
            <Sparkles className="mr-3 h-6 w-6" />
            {isSpanish ? 'Comenzar Ahora Gratis' : 'Start Free Now'}
          </Button>
          <p className="text-blue-100 mt-4">
            {isSpanish ? '✓ 30 días gratis ✓ Sin compromiso ✓ Soporte 24/7' : '✓ 30 days free ✓ No commitment ✓ 24/7 support'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
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