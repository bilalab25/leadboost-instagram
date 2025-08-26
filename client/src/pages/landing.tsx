import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield, ArrowDown, ArrowRight, Sparkles, Target, Globe, TrendingUp } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube, SiX } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";

export default function Landing() {
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      {/* Header */}
      <header className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LeadBoost</h1>
              </div>
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
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          
          {/* Main Waterfall Value Proposition */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <h2 className="text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-tight">
                {isSpanish ? 'Sistema Waterfall' : 'The Waterfall System'}
              </h2>
              <div className="text-3xl lg:text-4xl font-bold text-brand-600 mb-6">
                {isSpanish ? 'Una idea → Todos lados' : 'One idea → Everywhere'}
              </div>
            </div>
            
            <p className="text-xl lg:text-2xl text-gray-700 mb-12 max-w-5xl mx-auto leading-relaxed">
              {isSpanish 
                ? 'Convierte una sola idea en campañas optimizadas para 21+ plataformas. Todo en el formato correcto, al tamaño perfecto, listo para lanzar.'
                : 'Turn one idea into optimized campaigns across 21+ platforms. All in the right format, perfect size, ready to launch.'}
            </p>
            
            {/* The Waterfall Visual Flow */}
            <div className="mb-16">
              <Card className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-6xl mx-auto">
                <CardContent className="p-8 lg:p-12">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                    
                    {/* ONE IDEA */}
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Target className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-green-600 mb-2">{isSpanish ? 'UNA IDEA' : 'ONE IDEA'}</h3>
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
                        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                          <SiTiktok className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <SiFacebook className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <SiWhatsapp className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                          <SiLinkedin className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                          <SiYoutube className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                          <SiX className="h-6 w-6 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                          +14
                        </div>
                      </div>
                      <h3 className="text-3xl font-black text-purple-600 mb-2">{isSpanish ? 'TODOS LADOS' : 'EVERYWHERE'}</h3>
                      <p className="text-gray-600 font-medium">{isSpanish ? '21+ Plataformas' : '21+ Platforms'}</p>
                      <p className="text-sm text-gray-500 mt-1">{isSpanish ? 'Formato perfecto automático' : 'Perfect format automatically'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-12 text-center">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white px-12 py-4 text-xl font-bold shadow-xl transform hover:scale-105 transition-all duration-200"
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
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Lanzamiento Instantáneo' : 'Instant Launch'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish 
                      ? 'De una idea a 21+ plataformas en segundos. Sin configuración manual.'
                      : 'From one idea to 21+ platforms in seconds. No manual setup.'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
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
              
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {isSpanish ? 'Máximo Alcance' : 'Maximum Reach'}
                  </h3>
                  <p className="text-gray-600">
                    {isSpanish 
                      ? 'Maximiza tu alcance sin el trabajo multiplicado por 21.'
                      : 'Maximize your reach without 21x the work.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold">LeadBoost</h3>
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