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
            
            {/* Waterfall Demo Video Mockup */}
            <div className="mb-16">
              <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 w-full overflow-hidden">
                <div className="p-0">
                  <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    {/* Video mockup background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-cyan-400/10"></div>
                    
                    {/* Play button and content */}
                    <div className="relative z-10 text-center text-white">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 mx-auto hover:bg-white/30 transition-colors cursor-pointer">
                        <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[12px] border-y-transparent ml-1"></div>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">
                        {isSpanish ? 'Ve el Sistema Waterfall en Acción' : 'See the Waterfall System in Action'}
                      </h3>
                      <p className="text-white/80 text-lg">
                        {isSpanish 
                          ? 'Mira cómo una campaña se convierte en 21+ publicaciones perfectas'
                          : 'Watch how one campaign becomes 21+ perfect posts'}
                      </p>
                      <div className="mt-4 text-sm text-white/60">
                        {isSpanish ? '⏱️ 2 minutos • Demo interactiva' : '⏱️ 2 minutes • Interactive demo'}
                      </div>
                    </div>
                    
                    {/* Floating platform icons as preview */}
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-50">
                      <div className="w-6 h-6 bg-pink-500 rounded flex items-center justify-center">
                        <SiInstagram className="h-4 w-4 text-white" />
                      </div>
                      <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
                        <SiTiktok className="h-4 w-4 text-white" />
                      </div>
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <SiFacebook className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* The Waterfall Visual Flow */}
            <div className="mb-16">
              <Card className="bg-white rounded-3xl shadow-lg border border-gray-200 max-w-6xl mx-auto">
                <CardContent className="p-8 lg:p-12">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    
                    {/* ONE IDEA */}
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
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
            
            {/* Benefits Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-white border border-gray-200">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Lanzamiento Instantáneo' : 'Instant Launch'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish 
                      ? 'De tu marca a 21+ plataformas en segundos. Sin configuración manual.'
                      : 'From your brand to 21+ platforms in seconds. No manual setup.'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-white border border-gray-200">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Formato Perfecto' : 'Perfect Format'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish 
                      ? 'Cada plataforma recibe el contenido en su tamaño y formato ideal.'
                      : 'Each platform gets content in its ideal size and format.'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-white border border-gray-200">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Máximo Alcance' : 'Maximum Reach'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish 
                      ? 'Logra 30x el impacto sin las horas de trabajo.'
                      : 'Achieve 30x the impact without the hours of work.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Complete Platform Features */}
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

      {/* Final CTA */}
      <div className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 via-brand-800 to-brand-600">
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
            {isSpanish ? '✓ 14 días gratis ✓ Sin compromiso ✓ Soporte 24/7' : '✓ 14 days free ✓ No commitment ✓ 24/7 support'}
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
    </div>
  );
}