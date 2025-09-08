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
    <div className="min-h-screen relative text-white overflow-hidden" style={{
      background: 'linear-gradient(-45deg, #0f172a, #1e3a8a, #0891b2, #0f172a)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite'
    }}>
      {/* Header */}
      <header className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img 
                src={leadBoostLogo} 
                alt="CampAIgner" 
                className="h-8 w-auto brightness-150" 
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Globe className="h-4 w-4 mr-2" />
                {isSpanish ? 'EN' : 'ES'}
              </Button>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white hover:text-slate-900 transition-all duration-300"
                data-testid="button-login"
              >
                {isSpanish ? 'Iniciar Sesión' : 'Login'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32">
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{
              background: 'radial-gradient(circle, #3b82f6, #06b6d4, transparent)',
              animation: 'float 20s ease-in-out infinite, glow 8s ease-in-out infinite'
            }}
          ></div>
          <div 
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-25"
            style={{
              background: 'radial-gradient(circle, #06b6d4, #3b82f6, transparent)',
              animation: 'float 25s ease-in-out infinite reverse, glow 10s ease-in-out infinite 2s'
            }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-2xl opacity-20 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              background: 'conic-gradient(from 0deg, #3b82f6, #06b6d4, #1d4ed8, #3b82f6)',
              animation: 'slowDrift 30s linear infinite'
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 text-center">
          {/* Trust Badge */}
          <div className={`inline-flex items-center gap-3 mb-8 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm font-medium text-white/90">
              {isSpanish ? '✨ Genera campañas automáticamente años sin intervención' : '✨ Generates campaigns automatically for years without intervention'}
            </span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
              ))}
              <span className="text-xs text-white/70 ml-1">4.9</span>
            </div>
          </div>
          
          {/* Main Headline */}
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-8 text-white transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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
          <p className={`text-xl sm:text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {isSpanish 
              ? 'La única plataforma que conecta todos tus sistemas empresariales y crea campañas de marketing inteligentes que se ejecutan automáticamente, generando más ventas sin esfuerzo manual.' 
              : 'The only platform that connects all your business systems and creates intelligent marketing campaigns that run automatically, generating more sales without manual effort.'
            }
          </p>

          {/* Value Proposition */}
          <div className={`flex justify-center items-center gap-8 mb-12 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-2 text-white/80">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium">{isSpanish ? 'Sin configuración' : 'No setup required'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium">{isSpanish ? 'Resultados en 24h' : 'Results in 24h'}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Check className="w-5 h-5 text-green-400" />
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
            <p className="text-white/60 text-sm">
              {isSpanish ? 'Prueba gratis por 14 días • No se requiere tarjeta de crédito' : 'Free 14-day trial • No credit card required'}
            </p>
            <Button 
              variant="ghost" 
              className="text-white/80 hover:text-white font-medium underline"
              data-testid="button-watch-demo"
            >
              {isSpanish ? 'Ver demo (2 min)' : 'Watch demo (2 min)'}
            </Button>
          </div>

          {/* Social Proof Numbers */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">Years</div>
              <div className="text-white/60 text-sm">{isSpanish ? 'Campañas automáticas' : 'Automated campaigns'}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">0 Clicks</div>
              <div className="text-white/60 text-sm">{isSpanish ? 'Para generar contenido' : 'To generate content'}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">Real-time</div>
              <div className="text-white/60 text-sm">{isSpanish ? 'Datos POS/Web/Social' : 'POS/Web/Social data'}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">21+ Platforms</div>
              <div className="text-white/60 text-sm">{isSpanish ? 'Publicación automática' : 'Auto-posting'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-500/30 px-4 py-2 text-sm font-medium">
              {isSpanish ? 'CARACTERÍSTICAS PRINCIPALES' : 'CORE FEATURES'}
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              {isSpanish ? 'Campañas Que Se Crean Y Publican Solas' : 'Campaigns That Create And Post Themselves'}
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              {isSpanish 
                ? 'IA alimentada constantemente con datos de tu POS, web y redes sociales. Genera y publica campañas por años sin intervención humana.'
                : 'AI constantly fed with data from your POS, web and social media. Generates and posts campaigns for years without human intervention.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 p-8 hover:bg-white/10 transition-all duration-300 group">
              <CardContent className="text-center pt-0">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {isSpanish ? 'Generación Automática De Campañas' : 'Automated Campaign Generation'}
                </h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  {isSpanish 
                    ? 'Conectamos tu POS, website, redes sociales y sistemas. IA crea campañas 24/7 usando datos reales: inventario, ventas, eventos, promociones. Años sin tocar nada.'
                    : 'We connect your POS, website, social media and systems. AI creates campaigns 24/7 using real data: inventory, sales, events, promotions. Years without touching anything.'
                  }
                </p>
                <div className="flex items-center justify-center text-green-400 font-medium">
                  <span>{isSpanish ? 'Sin Intervención Humana' : 'Zero Human Intervention'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10 p-8 hover:bg-white/10 transition-all duration-300 group">
              <CardContent className="text-center pt-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {isSpanish ? 'Alcance 30x En 21+ Plataformas' : '30x Reach Across 21+ Platforms'}
                </h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  {isSpanish 
                    ? 'Contenido auto-redimensionado para Instagram, TikTok, Facebook, LinkedIn, YouTube y 16+ plataformas más. Un clic = presencia completa multiplicada por 30.'
                    : 'Content auto-sized for Instagram, TikTok, Facebook, LinkedIn, YouTube and 16+ more platforms. One click = complete presence multiplied by 30.'
                  }
                </p>
                <div className="flex items-center justify-center text-blue-400 font-medium">
                  <span>{isSpanish ? 'Multiplicación Instantánea' : 'Instant Multiplication'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10 p-8 hover:bg-white/10 transition-all duration-300 group">
              <CardContent className="text-center pt-0">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {isSpanish ? 'ChatDeck IA Para Conversiones' : 'AI ChatDeck For Conversions'}
                </h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  {isSpanish 
                    ? 'Bandeja unificada con chatbot IA que responde en todas las plataformas. Convierte visitantes en clientes 24/7 con respuestas personalizadas e inteligentes.'
                    : 'Unified inbox with AI chatbot responding across all platforms. Convert visitors to clients 24/7 with personalized, intelligent responses.'
                  }
                </p>
                <div className="flex items-center justify-center text-green-400 font-medium">
                  <span>{isSpanish ? 'Conversión Automatizada' : 'Automated Conversion'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-6 bg-green-500/20 text-green-300 border-green-500/30 px-4 py-2 text-sm font-medium">
                {isSpanish ? 'RESULTADOS GARANTIZADOS' : 'GUARANTEED RESULTS'}
              </Badge>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
                {isSpanish ? 'Marketing Que Funciona Solo Por Años' : 'Marketing That Works Alone For Years'}
              </h2>
              <p className="text-xl text-white/70 mb-8 leading-relaxed">
                {isSpanish 
                  ? 'Conectamos todos tus sistemas empresariales. IA genera contenido constantemente basado en datos reales. Clientes olvidan que tienen marketing porque funciona automáticamente.'
                  : 'We connect all your business systems. AI constantly generates content based on real data. Clients forget they have marketing because it works automatically.'
                }
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  { icon: Check, text: isSpanish ? 'POS, website, redes sociales conectados automáticamente' : 'POS, website, social media connected automatically' },
                  { icon: Check, text: isSpanish ? 'IA crea y publica campañas por meses sin intervención' : 'AI creates and posts campaigns for months without intervention' },
                  { icon: Check, text: isSpanish ? 'Datos de negocio actualizan contenido en tiempo real' : 'Business data updates content in real-time' },
                  { icon: Check, text: isSpanish ? 'Marketing completamente en piloto automático' : 'Marketing completely on autopilot' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white/90 text-lg">{item.text}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                className="bg-white text-slate-900 hover:bg-gray-100 font-semibold px-8 py-4 text-lg rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105"
                data-testid="button-start-now"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                {isSpanish ? 'Empezar Ahora' : 'Start Now'}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">30x</div>
                <div className="text-white/60 text-sm">{isSpanish ? 'Más alcance de clientes' : 'More client reach'}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">400%</div>
                <div className="text-white/60 text-sm">{isSpanish ? 'Más conversiones' : 'More conversions'}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <Globe className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">21+</div>
                <div className="text-white/60 text-sm">{isSpanish ? 'Plataformas automáticas' : 'Automated platforms'}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <MessageSquare className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-white/60 text-sm">{isSpanish ? 'ChatDeck IA activo' : 'AI ChatDeck active'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            {isSpanish ? '¿Listo Para Marketing Que Nunca Para?' : 'Ready For Marketing That Never Stops?'}
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            {isSpanish 
              ? 'Conectamos tus sistemas. IA genera campañas automáticamente por años usando datos reales de tu negocio. Sin tocar botones. Prueba gratis 14 días.'
              : 'We connect your systems. AI generates campaigns automatically for years using real business data. Without touching buttons. Free 14-day trial.'
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <Button 
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold px-12 py-5 text-xl rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              data-testid="button-start-free-trial-final"
            >
              <Zap className="w-6 h-6 mr-3" />
              {isSpanish ? 'Comenzar Prueba Gratuita' : 'Start Free Trial'}
            </Button>
            <div className="text-white/60 text-sm">
              {isSpanish ? '✓ Conexión instantánea 21+ plataformas • ✓ ChatDeck IA incluido' : '✓ Instant 21+ platform connection • ✓ AI ChatDeck included'}
            </div>
          </div>
          
          <div className="flex justify-center items-center gap-8 text-white/40 text-sm">
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