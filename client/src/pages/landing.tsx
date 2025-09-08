import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bot, BarChart3, ArrowRight, Star, Check, Play, Zap, TrendingUp, Users, Globe, Shield, Clock } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube, SiX } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import leadBoostLogo from "@assets/Lead Boost (500 x 200 px) (500 x 160 px)_1756873932398.png";

export default function Landing() {
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen relative text-gray-900 overflow-hidden bg-white">
      {/* Header */}
      <header className="relative z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img 
                src={leadBoostLogo} 
                alt="CampAIgner" 
                className="h-8 w-auto" 
              />
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                {isSpanish ? 'Características' : 'Features'}
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                {isSpanish ? 'Testimonios' : 'Testimonials'}
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                {isSpanish ? 'Precios' : 'Pricing'}
              </a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-gray-600 hover:text-gray-900"
              >
                <Globe className="h-4 w-4 mr-2" />
                {isSpanish ? 'EN' : 'ES'}
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
                data-testid="button-login"
                onClick={() => window.location.href = '/api/login'}
              >
                {isSpanish ? 'Iniciar Sesión' : 'Login'}
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
                data-testid="button-header-cta"
                onClick={() => window.location.href = '/api/login'}
              >
                {isSpanish ? 'Empezar Gratis' : 'Start Free'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-br from-blue-50 to-indigo-100">

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 text-center">
          {/* Trust Badge */}
          <div className={`inline-flex items-center gap-3 mb-8 px-6 py-3 rounded-full bg-white border border-gray-200 shadow-lg transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              {isSpanish ? '✨ Más de 5,000 empresas confían en nosotros' : '✨ Trusted by 5,000+ businesses'}
            </span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
              ))}
              <span className="text-xs text-gray-500 ml-1">4.9</span>
            </div>
          </div>
          
          {/* Main Headline */}
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-8 text-gray-900 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {isSpanish ? (
              <>
                Haz Crecer Tus Ventas,
                <br />
                <span className="text-blue-300">
                  Automáticamente
                </span>
              </>
            ) : (
              <>
                Grow Your Sales,
                <br />
                <span className="text-blue-300">
                  Automatically
                </span>
              </>
            )}
          </h1>
          
          {/* Subtitle */}
          <p className={`text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {isSpanish 
              ? 'La única plataforma que conecta todos tus sistemas empresariales y crea campañas de marketing inteligentes que se ejecutan automáticamente, generando más ventas sin esfuerzo manual.' 
              : 'The only platform that connects all your business systems and creates intelligent marketing campaigns that run automatically, generating more sales without manual effort.'
            }
          </p>

          {/* Value Proposition */}
          <div className={`flex justify-center items-center gap-8 mb-12 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-2 text-gray-600">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">{isSpanish ? 'Sin configuración' : 'No setup required'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">{isSpanish ? 'Resultados en 24h' : 'Results in 24h'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">{isSpanish ? 'Cancela cuando quieras' : 'Cancel anytime'}</span>
            </div>
          </div>
          
          {/* Primary CTA */}
          <div className={`flex flex-col items-center gap-4 mb-16 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-12 py-4 text-xl rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105"
              data-testid="button-start-free-trial"
            >
              {isSpanish ? 'Comenzar Gratis Ahora' : 'Start Free Now'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-gray-500 text-sm">
              {isSpanish ? 'Prueba gratis por 14 días • No se requiere tarjeta de crédito' : 'Free 14-day trial • No credit card required'}
            </p>
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-gray-900 font-medium underline"
              data-testid="button-watch-demo"
            >
              {isSpanish ? 'Ver demo (2 min)' : 'Watch demo (2 min)'}
            </Button>
          </div>

          {/* Social Proof Numbers */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Years</div>
              <div className="text-gray-500 text-sm">{isSpanish ? 'Campañas automáticas' : 'Automated campaigns'}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">0 Clicks</div>
              <div className="text-gray-500 text-sm">{isSpanish ? 'Para generar contenido' : 'To generate content'}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Real-time</div>
              <div className="text-gray-500 text-sm">{isSpanish ? 'Datos POS/Web/Social' : 'POS/Web/Social data'}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">21+ Platforms</div>
              <div className="text-gray-500 text-sm">{isSpanish ? 'Publicación automática' : 'Auto-posting'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
              {isSpanish ? 'Todo Lo Que Necesitas Para Vender Más' : 'Everything You Need To Sell More'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {isSpanish 
                ? 'Una plataforma completa que automatiza tu marketing y ventas mientras tú te enfocas en hacer crecer tu negocio.'
                : 'A complete platform that automates your marketing and sales while you focus on growing your business.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {isSpanish ? 'Campañas IA Automatizadas' : 'AI Automated Campaigns'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {isSpanish 
                  ? 'IA crea y publica contenido de marketing basado en datos reales de tu negocio - inventario, ventas, eventos.'
                  : 'AI creates and posts marketing content based on real business data - inventory, sales, events.'
                }
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {isSpanish ? 'Bandeja de Entrada Unificada' : 'Unified Inbox'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {isSpanish 
                  ? 'Gestiona todos los mensajes de redes sociales desde un solo lugar con respuestas automáticas inteligentes.'
                  : 'Manage all social media messages from one place with intelligent automatic responses.'
                }
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {isSpanish ? 'Análisis en Tiempo Real' : 'Real-Time Analytics'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {isSpanish 
                  ? 'Dashboard con métricas de ventas, engagement y ROI para optimizar tu estrategia automáticamente.'
                  : 'Dashboard with sales, engagement and ROI metrics to optimize your strategy automatically.'
                }
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {isSpanish ? '21+ Plataformas Conectadas' : '21+ Connected Platforms'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {isSpanish 
                  ? 'Publica automáticamente en Instagram, Facebook, TikTok, LinkedIn y más plataformas simultáneamente.'
                  : 'Automatically post to Instagram, Facebook, TikTok, LinkedIn and more platforms simultaneously.'
                }
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {isSpanish ? 'CRM Inteligente' : 'Smart CRM'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {isSpanish 
                  ? 'Gestión automática de leads y clientes con seguimiento inteligente y nurturing personalizado.'
                  : 'Automatic lead and customer management with intelligent tracking and personalized nurturing.'
                }
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {isSpanish ? 'Seguridad Empresarial' : 'Enterprise Security'}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {isSpanish 
                  ? 'Cifrado de extremo a extremo, cumplimiento GDPR y backups automáticos de todos tus datos.'
                  : 'End-to-end encryption, GDPR compliance and automatic backups of all your data.'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
              {isSpanish ? 'Lo Que Dicen Nuestros Clientes' : 'What Our Customers Say'}
            </h2>
            <p className="text-xl text-gray-600">
              {isSpanish ? 'Miles de empresas ya están creciendo en piloto automático' : 'Thousands of businesses are already growing on autopilot'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {isSpanish 
                  ? '"En 3 meses aumentamos nuestras ventas en un 300%. La plataforma literalmente funciona sola, es increíble."'
                  : '"In 3 months we increased our sales by 300%. The platform literally works by itself, it\'s incredible."'
                }
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Maria Rodriguez</p>
                  <p className="text-sm text-gray-500">{isSpanish ? 'Dueña, Boutique Luna' : 'Owner, Luna Boutique'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {isSpanish 
                  ? '"Antes pasaba 4 horas al día en marketing. Ahora tengo ese tiempo para mi negocio y las ventas siguen creciendo."'
                  : '"I used to spend 4 hours a day on marketing. Now I have that time for my business and sales keep growing."'
                }
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                  C
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Carlos Mendez</p>
                  <p className="text-sm text-gray-500">{isSpanish ? 'CEO, FitGym' : 'CEO, FitGym'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {isSpanish 
                  ? '"La IA conoce mi inventario mejor que yo. Crea campañas perfectas para cada producto automáticamente."'
                  : '"The AI knows my inventory better than I do. It creates perfect campaigns for each product automatically."'
                }
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ana Torres</p>
                  <p className="text-sm text-gray-500">{isSpanish ? 'Fundadora, TechStore' : 'Founder, TechStore'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
              {isSpanish ? 'Planes Simples y Transparentes' : 'Simple, Transparent Pricing'}
            </h2>
            <p className="text-xl text-gray-600">
              {isSpanish ? 'Empieza gratis. Crece con nosotros. Cancela cuando quieras.' : 'Start free. Grow with us. Cancel anytime.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {isSpanish ? 'Starter' : 'Starter'}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$29</span>
                <span className="text-gray-500 ml-2">{isSpanish ? '/mes' : '/month'}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'Hasta 3 plataformas' : 'Up to 3 platforms'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'IA básica de campañas' : 'Basic AI campaigns'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'Analytics básicos' : 'Basic analytics'}</span>
                </li>
              </ul>
              <Button className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200 font-semibold py-3 rounded-lg">
                {isSpanish ? 'Empezar Gratis' : 'Start Free'}
              </Button>
            </div>

            <div className="bg-blue-600 text-white rounded-xl p-8 shadow-2xl transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-yellow-400 text-yellow-900 px-3 py-1">
                  {isSpanish ? 'MÁS POPULAR' : 'MOST POPULAR'}
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mb-4">Professional</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-blue-200 ml-2">{isSpanish ? '/mes' : '/month'}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>{isSpanish ? 'Todas las 21+ plataformas' : 'All 21+ platforms'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>{isSpanish ? 'IA avanzada + datos en tiempo real' : 'Advanced AI + real-time data'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>{isSpanish ? 'Bandeja unificada + ChatBot IA' : 'Unified inbox + AI ChatBot'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>{isSpanish ? 'Analytics avanzados' : 'Advanced analytics'}</span>
                </li>
              </ul>
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-50 font-semibold py-3 rounded-lg">
                {isSpanish ? 'Empezar Gratis 14 Días' : 'Start 14-Day Free Trial'}
              </Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{isSpanish ? 'Personalizado' : 'Custom'}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'Integraciones personalizadas' : 'Custom integrations'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'Soporte dedicado' : 'Dedicated support'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{isSpanish ? 'SLA garantizado' : 'SLA guarantee'}</span>
                </li>
              </ul>
              <Button className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200 font-semibold py-3 rounded-lg">
                {isSpanish ? 'Contactar Ventas' : 'Contact Sales'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            {isSpanish ? '¿Listo Para Hacer Crecer Tus Ventas?' : 'Ready To Grow Your Sales?'}
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            {isSpanish 
              ? 'Únete a miles de empresas que ya están creciendo en piloto automático. Sin configuración complicada, sin contratos largos.'
              : 'Join thousands of businesses already growing on autopilot. No complex setup, no long contracts.'
            }
          </p>
          
          <div className="flex flex-col items-center gap-6 mb-12">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-12 py-4 text-xl rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105"
              data-testid="button-start-free-trial-final"
            >
              {isSpanish ? 'Comenzar Gratis Ahora' : 'Start Free Now'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-gray-400 text-sm">
              {isSpanish ? 'Prueba gratis 14 días • No se requiere tarjeta de crédito • Cancela cuando quieras' : '14-day free trial • No credit card required • Cancel anytime'}
            </p>
          </div>
          
          <div className="flex justify-center items-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {isSpanish ? 'Seguro SSL' : 'SSL Secure'}
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              {isSpanish ? 'GDPR Compliant' : 'GDPR Compliant'}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              {isSpanish ? 'Soporte 24/7' : '24/7 Support'}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img 
                src={leadBoostLogo} 
                alt="CampAIgner" 
                className="h-8 w-auto brightness-150 mr-4"
              />
              <span className="text-white/60 text-sm">
                {isSpanish ? '© 2024 CampAIgner. Todos los derechos reservados.' : '© 2024 CampAIgner. All rights reserved.'}
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <Button variant="ghost" className="text-white/60 hover:text-white text-sm">
                {isSpanish ? 'Privacidad' : 'Privacy'}
              </Button>
              <Button variant="ghost" className="text-white/60 hover:text-white text-sm">
                {isSpanish ? 'Términos' : 'Terms'}
              </Button>
              <Button variant="ghost" className="text-white/60 hover:text-white text-sm">
                {isSpanish ? 'Soporte' : 'Support'}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}