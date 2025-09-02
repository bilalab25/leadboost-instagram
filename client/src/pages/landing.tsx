import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield, ArrowDown, ArrowRight, Sparkles, Target, Globe, TrendingUp, Play, Volume2, Settings, Maximize, Palette, Video, Mail, ChevronDown, Calendar } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube, SiX, SiGmail, SiWix, SiShopify, SiZapier, SiQuickbooks, SiSquare, SiStripe } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";
import { AIChatbot } from "@/components/AIChatbot";
import { CountdownTimer } from "@/components/CountdownTimer";
import { FAQ } from "@/components/FAQ";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { ReferralProgram } from "@/components/ReferralProgram";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import leadBoostLogo from "@assets/Lead Boost (500 x 200 px) (500 x 160 px)_1756771199959.png";

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
                  alt="Lead Boost Logo" 
                  className="h-20 w-auto object-contain"
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost"
                      className="text-gray-700 hover:text-brand-600 hover:bg-brand-50/80 font-semibold px-4 py-2 transition-all duration-200 group"
                      data-testid="button-features-dropdown"
                    >
                      <Sparkles className="mr-2 h-4 w-4 group-hover:text-brand-500 transition-colors duration-200" />
                      {isSpanish ? '¿Qué Incluye?' : "What's Inside?"}
                      <ChevronDown className="ml-1 h-4 w-4 group-hover:text-brand-500 transition-colors duration-200" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-2">
                    <DropdownMenuItem className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">CampAIgner</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {isSpanish ? 'Generador IA que crea campañas para 21+ plataformas en un clic o crea 30 días completos' : 'AI generator that creates campaigns for 21+ platforms in one click or creates complete 30-day strategies'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Palette className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Brand Studio</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {isSpanish ? 'Diseño profesional con herramientas IA y plantillas para todas las plataformas' : 'Professional design with AI-powered tools and templates for all platforms'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{isSpanish ? 'Bandeja Unificada' : 'Unified Inbox'}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {isSpanish ? 'Gestiona todos los mensajes de redes sociales en un solo lugar' : 'Manage all social media messages in one place'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group">
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
                    
                    <DropdownMenuItem className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{isSpanish ? 'Planificador Mensual' : 'Monthly Planner'}</div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                          {isSpanish ? 'Creación de contenido IA y estrategia para todo el mes automáticamente' : 'AI content creation and strategy for the entire month automatically'}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group">
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
                    
                    <DropdownMenuItem className="flex items-start p-4 hover:bg-brand-50/80 rounded-xl transition-colors duration-200 cursor-pointer group">
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
                {isSpanish ? 'Ser Visto → En Todos Lados. En Un Clic.' : 'Get Seen → Everywhere. In One Click.'}
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
                      <p className="text-gray-600 font-medium">{isSpanish ? 'Extraemos datos de tu negocio en tiempo real' : 'We pull real-time data from your business'}</p>
                      <p className="text-sm text-gray-500 mt-1">{isSpanish ? 'IA analiza tu industria, rendimiento y ventas' : 'AI analyzes what your industry, performance and sales'}</p>
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
                      </div>
                      <h3 className="text-3xl font-black text-brand-600 mb-2">{isSpanish ? 'EN TODOS LADOS' : 'EVERYWHERE'}</h3>
                      <p className="text-gray-600 font-medium">{isSpanish ? '21+ plataformas, un clic' : '21+ platforms, one click'}</p>
                      <p className="text-sm text-gray-500 mt-1">{isSpanish ? 'Diseñado para ti, dimensionado para cada red social' : 'Designed for you, sized for every social network'}</p>
                    </div>
                  </div>
                  
                  {/* Interactive Demo Section */}
                  <div className="mt-12 mb-8">
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
        <div className="bg-gradient-to-br from-gray-50 to-white">
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
                  className="h-96 w-auto object-contain opacity-80 brightness-125"
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

      </div>
    </>
  );
}