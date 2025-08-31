import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield, ArrowDown, ArrowRight, Sparkles, Target, Globe, TrendingUp, Play, Volume2, Settings, Maximize, Palette, Video, Mail } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube, SiX, SiGmail, SiWix, SiSalesforce, SiHubspot, SiShopify, SiZapier, SiMailchimp } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";
import { AIChatbot } from "@/components/AIChatbot";
import { CountdownTimer } from "@/components/CountdownTimer";
import { FAQ } from "@/components/FAQ";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { ReferralProgram } from "@/components/ReferralProgram";
import { OnboardingProgress } from "@/components/OnboardingProgress";
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
                  alt="CampAIgner Logo" 
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
                
                <Button 
                  className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 text-white font-bold px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group border border-emerald-400/30"
                  data-testid="button-pricing-cta"
                  onClick={() => window.location.href = '/pricing'}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                  <div className="absolute inset-0 rounded-full">
                    <div className="absolute top-1 right-2 w-1 h-1 bg-white rounded-full animate-ping opacity-75"></div>
                    <div className="absolute top-3 left-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse"></div>
                    <div className="absolute bottom-2 right-4 w-0.5 h-0.5 bg-emerald-200 rounded-full animate-ping" style={{animationDelay: '500ms'}}></div>
                  </div>
                  <span className="relative z-10 flex items-center">
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    {isSpanish ? '¡Ver Precios!' : 'See Pricing!'}
                  </span>
                </Button>
                
                <Button className="bg-brand-600 hover:bg-brand-700 text-white">
                  {isSpanish ? 'Iniciar Sesión' : 'Sign In'}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section with CampAIgner Tool */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-100/30 via-brand-50/40 to-brand-200/20" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-brand-300/20 to-brand-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-40 left-10 w-64 h-64 bg-gradient-to-br from-brand-400/15 to-brand-600/10 rounded-full blur-2xl"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <div className="text-center mb-16">
              <h2 className="text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-6 leading-[0.88] tracking-tight">
                {isSpanish ? 'El Efecto LeadBoost' : 'The LeadBoost Effect'}
              </h2>
              <div className="text-3xl lg:text-4xl font-semibold text-brand-600 mb-8 tracking-wide">
                {isSpanish ? 'Ser Visto → Everywhere. En Un Clic.' : 'Get Seen → Everywhere. In One Click.'}
              </div>
              
              <div className="max-w-4xl mx-auto mt-8">
                <p className="text-lg lg:text-xl text-gray-600 leading-relaxed font-normal">
                  {isSpanish ? 'Convierte los datos de tu negocio en campañas listas para usar en 21+ plataformas—en solo un clic.' : 'Turn your business data into ready-to-go campaigns for 21+ platforms—in just one click.'}
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
                      <div className="w-24 h-24 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
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
                      <div className="text-6xl font-black text-brand-600 mb-2">+21</div>
                      <h3 className="text-3xl font-black text-brand-600 mb-2">{isSpanish ? 'EN TODOS LADOS' : 'EVERYWHERE'}</h3>
                      <p className="text-gray-600 font-medium">{isSpanish ? '21+ plataformas, un clic' : '21+ platforms, one click'}</p>
                      <p className="text-sm text-gray-500 mt-1">{isSpanish ? 'Diseñado para ti, dimensionado para cada red social' : 'Designed for you, sized for every social network'}</p>
                    </div>
                  </div>
                  
                  {/* Demo Video Section */}
                  <div className="mt-16 mb-12">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {isSpanish ? 'Mira nuestra herramienta CampAIgner en Acción' : 'See our CampAIgner tool in Action'}
                      </h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        {isSpanish ? 'Observa cómo una sola idea se transforma en campañas optimizadas para 21+ plataformas en segundos' : 'Watch one idea transform into optimized campaigns across 21+ platforms in seconds'}
                      </p>
                    </div>
                    
                    <div className="max-w-4xl mx-auto relative z-10">
                      <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-gray-900 rounded-2xl">
                        <div className="relative aspect-[21/9] bg-gradient-to-br from-slate-900 via-slate-800 to-black">
                          <div className="absolute inset-0 opacity-10">
                            <div className="w-full h-full" style={{
                              backgroundImage: `
                                linear-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1px, transparent 1px)
                              `,
                              backgroundSize: '60px 60px'
                            }} />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/5 to-black/30 cursor-pointer group transition-all duration-700 hover:from-black/40 hover:via-black/10 hover:to-black/40" data-testid="video-play-button">
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 py-12">
                              <div className="mb-6">
                                <h4 className="text-xl md:text-2xl font-bold text-white mb-3 drop-shadow-lg">
                                  {isSpanish ? 'Ve CampAIgner en Acción' : 'See CampAIgner in Action'}
                                </h4>
                                <p className="text-sm md:text-base text-white/90 max-w-xl mx-auto drop-shadow-md">
                                  {isSpanish ? 'Descubre cómo funciona en 30 segundos' : 'Discover how it works in 30 seconds'}
                                </p>
                              </div>

                              <div className="relative">
                                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all duration-500 border border-white/20 shadow-2xl">
                                  <div className="w-14 h-14 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                                    <div className="w-0 h-0 border-l-[14px] border-l-gray-700 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"></div>
                                  </div>
                                </div>
                                <div className="absolute inset-0 bg-white/15 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                                <div className="absolute inset-0 rounded-full border border-white/30 animate-ping"></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="absolute inset-0 p-4 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md rounded-xl px-3 py-1 border border-white/10">
                                <span className="text-white font-semibold text-xs">CampAIgner Tool</span>
                              </div>
                              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-full px-3 py-1 shadow-lg">
                                <span className="text-white text-xs font-medium">● Demo</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex space-x-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                                  <SiInstagram className="h-3 w-3 text-white" />
                                </div>
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                                  <Mail className="h-3 w-3 text-white" />
                                </div>
                                <div className="w-6 h-6 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center shadow-lg">
                                  <SiTiktok className="h-3 w-3 text-white" />
                                </div>
                                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                                  <SiWhatsapp className="h-3 w-3 text-white" />
                                </div>
                                <div className="w-6 h-6 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                  +21
                                </div>
                              </div>
                              <span className="text-white/70 text-xs font-mono">0:30</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 text-center">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600 text-white px-12 py-4 text-xl font-bold shadow-2xl rounded-3xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Zap className="mr-3 h-6 w-6" />
                      {isSpanish ? 'Lanza tu Primera Campaña' : 'Launch Your First Campaign'}
                    </Button>
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
                      <div className="text-4xl md:text-5xl font-black text-brand-600 mb-2">10,000+</div>
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

                {/* Testimonials */}
                <div className="mb-16">
                  <h4 className="text-xl font-semibold text-center text-gray-900 mb-8">
                    {isSpanish ? 'Lo Que Dicen Nuestros Clientes' : 'What Our Customers Say'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="p-6 shadow-lg border-l-4 border-l-brand-500">
                      <CardContent className="p-0">
                        <div className="flex items-start mb-4">
                          <div className="flex text-yellow-400">
                            {'★'.repeat(5)}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4 italic">
                          {isSpanish 
                            ? '"En 3 meses aumentamos nuestras citas un 300%. El chatbot trabaja mientras dormimos."'
                            : '"In 3 months we increased appointments by 300%. The chatbot works while we sleep."'
                          }
                        </p>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            MC
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">María Carmen López</p>
                            <p className="text-sm text-gray-600">Bella Estética Spa</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="p-6 shadow-lg border-l-4 border-l-emerald-500">
                      <CardContent className="p-0">
                        <div className="flex items-start mb-4">
                          <div className="flex text-yellow-400">
                            {'★'.repeat(5)}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4 italic">
                          {isSpanish 
                            ? '"LeadBoost transformó nuestro negocio. Ahora capturamos leads automáticamente desde todas las redes."'
                            : '"LeadBoost transformed our business. Now we capture leads automatically from all platforms."'
                          }
                        </p>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            DR
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Dr. Roberto Hernández</p>
                            <p className="text-sm text-gray-600">Clínica Dental Premium</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="p-6 shadow-lg border-l-4 border-l-purple-500">
                      <CardContent className="p-0">
                        <div className="flex items-start mb-4">
                          <div className="flex text-yellow-400">
                            {'★'.repeat(5)}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4 italic">
                          {isSpanish 
                            ? '"La mejor inversión que hemos hecho. ROI del 500% en el primer mes."'
                            : '"Best investment we\'ve made. 500% ROI in the first month."'
                          }
                        </p>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            SG
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Sandra García</p>
                            <p className="text-sm text-gray-600">Consultora Fitness</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                      <span className="text-lg font-semibold">Wix</span>
                    </div>
                    <div className="flex items-center space-x-2 text-black hover:text-blue-600 transition-colors">
                      <SiSalesforce className="h-8 w-8" />
                      <span className="text-lg font-semibold">Salesforce</span>
                    </div>
                    <div className="flex items-center space-x-2 text-black hover:text-orange-600 transition-colors">
                      <SiHubspot className="h-8 w-8" />
                      <span className="text-lg font-semibold">HubSpot</span>
                    </div>
                    <div className="flex items-center space-x-2 text-black hover:text-green-600 transition-colors">
                      <SiShopify className="h-8 w-8" />
                      <span className="text-lg font-semibold">Shopify</span>
                    </div>
                    <div className="flex items-center space-x-2 text-black hover:text-purple-600 transition-colors">
                      <SiZapier className="h-8 w-8" />
                      <span className="text-lg font-semibold">Zapier</span>
                    </div>
                    <div className="flex items-center space-x-2 text-black hover:text-yellow-600 transition-colors">
                      <SiMailchimp className="h-8 w-8" />
                      <span className="text-lg font-semibold">Mailchimp</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {isSpanish ? '+ 50+ integraciones más disponibles' : '+ 50+ more integrations available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Urgency & Limited Time Offer Section */}
            <div className="py-16 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-3xl border-2 border-red-200 mb-16 relative overflow-hidden">
              {/* Background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 via-orange-500/5 to-yellow-500/5 animate-pulse"></div>
              
              <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center bg-red-600 text-white px-6 py-2 rounded-full font-bold mb-6 animate-bounce">
                    🔥 {isSpanish ? 'OFERTA POR TIEMPO LIMITADO' : 'LIMITED TIME OFFER'} 🔥
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                    {isSpanish 
                      ? '¡50% de Descuento en tu Primer Mes!' 
                      : '50% Off Your First Month!'
                    }
                  </h3>
                  <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                    {isSpanish 
                      ? 'Únete a más de 10,000 empresas que ya están automatizando sus ventas con IA. Esta oferta expira pronto.'
                      : 'Join 10,000+ businesses already automating their sales with AI. This offer expires soon.'
                    }
                  </p>
                </div>

                {/* Countdown Timer */}
                <div className="mb-12 flex justify-center">
                  <CountdownTimer 
                    targetDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} // 7 days from now
                    className="justify-center"
                  />
                </div>

                {/* Offer Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-red-100">
                    <div className="text-3xl font-black text-red-600 mb-2">$49</div>
                    <div className="text-lg text-gray-500 line-through mb-1">$99/mes</div>
                    <p className="text-sm text-gray-600">{isSpanish ? 'Primer mes' : 'First month'}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-green-100">
                    <div className="text-3xl font-black text-green-600 mb-2">FREE</div>
                    <div className="text-lg text-gray-600 mb-1">{isSpanish ? 'Configuración' : 'Setup'}</div>
                    <p className="text-sm text-gray-600">{isSpanish ? 'Valor $200' : 'Worth $200'}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-100">
                    <div className="text-3xl font-black text-blue-600 mb-2">24/7</div>
                    <div className="text-lg text-gray-600 mb-1">{isSpanish ? 'Soporte IA' : 'AI Support'}</div>
                    <p className="text-sm text-gray-600">{isSpanish ? 'Incluido' : 'Included'}</p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-4">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-700 hover:via-red-600 hover:to-orange-600 text-white px-12 py-4 text-xl font-bold shadow-2xl rounded-2xl transition-all duration-300 transform hover:scale-105 animate-pulse"
                    onClick={() => window.location.href = '/pricing'}
                    data-testid="button-claim-offer"
                  >
                    <Sparkles className="mr-3 h-6 w-6" />
                    {isSpanish ? '¡Reclamar Oferta Ahora!' : 'Claim Offer Now!'}
                  </Button>
                  <p className="text-sm text-gray-600">
                    {isSpanish 
                      ? '✅ Sin compromiso • ✅ Cancela cuando quieras • ✅ Garantía 30 días'
                      : '✅ No commitment • ✅ Cancel anytime • ✅ 30-day guarantee'
                    }
                  </p>
                </div>

                {/* Urgency Indicators */}
                <div className="mt-8 flex justify-center items-center space-x-6 text-sm">
                  <div className="flex items-center text-red-600 font-semibold">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                    {isSpanish ? '127 personas viendo esto' : '127 people viewing this'}
                  </div>
                  <div className="flex items-center text-orange-600 font-semibold">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                    {isSpanish ? '23 se registraron hoy' : '23 signed up today'}
                  </div>
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
        <div className="py-24 bg-gradient-to-br from-brand-200/50 via-brand-300/40 to-brand-200/60 relative">
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
              
              {/* Unified Inbox */}
              <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-white/70 via-blue-50/80 to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
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
                  {isSpanish ? 'Todos tus mensajes de Instagram, WhatsApp, Email y TikTok en un solo lugar' : 'All your messages from Instagram, WhatsApp, Email and TikTok in one place'}
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• {isSpanish ? 'Respuestas automáticas' : 'Auto-responses'}</li>
                  <li>• {isSpanish ? 'Análisis de sentimientos' : 'Sentiment analysis'}</li>
                  <li>• {isSpanish ? 'Respuesta IA inteligente 24/7' : '24/7 AI smart response'}</li>
                </ul>
              </Card>

              {/* AI Content Planner */}
              <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-white/70 via-purple-50/80 to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
                <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <Bot className="h-8 w-8 text-white" />
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

              {/* Brand Studio */}
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
                  {isSpanish ? 'Herramientas de diseño profesional nativas para crear contenido visual impactante sin depender de terceros' : 'Native professional design tools to create impactful visual content without relying on third parties'}
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• {isSpanish ? 'Editor de diseño nativo' : 'Native design editor'}</li>
                  <li>• {isSpanish ? 'Plantillas profesionales' : 'Professional templates'}</li>
                  <li>• {isSpanish ? 'Branding consistente' : 'Consistent branding'}</li>
                </ul>
              </Card>

              {/* Team Management */}
              <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-white/70 via-amber-50/80 to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
                <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <Users className="h-8 w-8 text-white" />
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

              {/* Campaign Management */}
              <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-white/70 via-indigo-50/80 to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
                <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                
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

              {/* Global Support */}
              <Card className="p-8 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden bg-gradient-to-br from-white/70 via-rose-50/80 to-brand-100/60 backdrop-blur-xl border border-white/30 hover:border-brand-300/50 hover:scale-105">
                <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {isSpanish ? 'Soporte Global' : 'Global Support'}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">
                  {isSpanish ? 'Soporte completo en español e inglés con contenido adaptado a cada mercado' : 'Complete support in Spanish and English with content adapted to each market'}
                </p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• {isSpanish ? 'Soporte 24/7 multiidioma' : '24/7 multilingual support'}</li>
                  <li>• {isSpanish ? 'Localización de contenido' : 'Content localization'}</li>
                  <li>• {isSpanish ? 'Mercados regionales' : 'Regional markets'}</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>

        {/* Interactive Product Demo */}
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-brand-50">
          <InteractiveDemo isSpanish={isSpanish} />
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
                  "{isSpanish ? 'Tus Ventas +47% vs antes de LeadBoost.' : 'Your Sales +47% vs before LeadBoost.'}"
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

        {/* FAQ Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white">
          <FAQ isSpanish={isSpanish} />
        </div>

        {/* Onboarding Progress */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
          <OnboardingProgress isSpanish={isSpanish} />
        </div>

        {/* Referral Program */}
        <ReferralProgram isSpanish={isSpanish} />

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

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <img 
                  src={leadBoostLogo} 
                  alt="CampAIgner Logo" 
                  className="h-96 w-auto object-contain"
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

        {/* AI Chatbot */}
        <AIChatbot 
          brandId="brand-1"
          customerIdentifier="demo-visitor"
          platform="website"
        />
      </div>
    </>
  );
}