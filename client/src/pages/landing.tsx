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
              {isSpanish ? '✨ Gestiona más de 1M+ conversaciones mensualmente' : '✨ Managing 1M+ conversations monthly'}
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
                Gestiona Todas Tus
                <br />
                <span className="text-blue-300">
                  Redes Sociales Con IA
                </span>
              </>
            ) : (
              <>
                Manage All Your
                <br />
                <span className="text-blue-300">
                  Social Media With AI
                </span>
              </>
            )}
          </h1>
          
          {/* Subtitle */}
          <p className={`text-xl sm:text-2xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {isSpanish 
              ? 'Bandeja de entrada unificada para Instagram, WhatsApp, TikTok y más. IA que crea contenido, gestiona campañas y analiza sentimientos. Todo en una plataforma.' 
              : 'Unified inbox for Instagram, WhatsApp, TikTok and more. AI that creates content, manages campaigns, and analyzes sentiment. All in one platform.'
            }
          </p>

          {/* Platform Showcase */}
          <div className={`flex justify-center items-center gap-6 mb-12 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-4 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/20 hover:scale-105 transition-all duration-300" style={{
                background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1))',
                backgroundSize: '200% 100%',
                animation: 'gradientShift 8s ease infinite'
              }}>
              <SiInstagram className="w-6 h-6 text-pink-400" />
              <SiTiktok className="w-6 h-6 text-white" />
              <SiFacebook className="w-6 h-6 text-blue-400" />
              <SiWhatsapp className="w-6 h-6 text-green-400" />
              <SiLinkedin className="w-6 h-6 text-blue-500" />
              <SiYoutube className="w-6 h-6 text-red-400" />
              <SiX className="w-6 h-6 text-white" />
              <span className="text-white/60 text-sm font-medium ml-2">+14 more</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-6 justify-center mb-16 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Button 
              className="relative text-white font-semibold px-10 py-4 text-lg rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden group"
              style={{
                background: 'linear-gradient(45deg, #1e40af, #0891b2, #1e40af)',
                backgroundSize: '200% 100%',
                animation: 'gradientShift 3s ease infinite'
              }}
              data-testid="button-start-free-trial"
            >
              <Zap className="w-5 h-5 mr-2" />
              {isSpanish ? 'Comenzar Prueba Gratuita' : 'Start Free Trial'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-white/30 text-white hover:bg-white hover:text-slate-900 font-semibold px-10 py-4 text-lg rounded-2xl backdrop-blur-md transition-all duration-300"
              data-testid="button-watch-demo"
            >
              <Play className="w-5 h-5 mr-2" />
              {isSpanish ? 'Ver Demo en Vivo' : 'Watch Live Demo'}
            </Button>
          </div>

          {/* Social Proof Numbers */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">21+</div>
              <div className="text-white/60 text-sm">{isSpanish ? 'Plataformas conectadas' : 'Connected platforms'}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">10k+</div>
              <div className="text-white/60 text-sm">{isSpanish ? 'Contenidos IA/mes' : 'AI content/month'}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">85%</div>
              <div className="text-white/60 text-sm">{isSpanish ? 'Tiempo ahorrado' : 'Time saved'}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/60 text-sm">{isSpanish ? 'Respuesta automática' : 'Auto responses'}</div>
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
              {isSpanish ? 'El Centro De Control De Tus Redes Sociales' : 'Your Social Media Command Center'}
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              {isSpanish 
                ? 'Desde responder mensajes hasta crear contenido con IA, CampAIgner automatiza y optimiza toda tu presencia en redes sociales'
                : 'From responding to messages to creating AI content, CampAIgner automates and optimizes your entire social media presence'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 p-8 hover:bg-white/10 transition-all duration-300 group">
              <CardContent className="text-center pt-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {isSpanish ? 'Bandeja Unificada' : 'Unified Inbox'}
                </h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  {isSpanish 
                    ? 'Todos tus mensajes de Instagram, WhatsApp, TikTok, Facebook y más en un solo lugar. Respuestas automáticas con IA y análisis de sentimientos en tiempo real.'
                    : 'All your messages from Instagram, WhatsApp, TikTok, Facebook and more in one place. AI auto-responses and real-time sentiment analysis.'
                  }
                </p>
                <div className="flex items-center justify-center text-blue-400 font-medium">
                  <span>{isSpanish ? 'Gestión Centralizada' : 'Centralized Management'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10 p-8 hover:bg-white/10 transition-all duration-300 group">
              <CardContent className="text-center pt-0">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {isSpanish ? 'Creación IA de Contenido' : 'AI Content Creation'}
                </h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  {isSpanish 
                    ? 'GPT-4o genera estrategias mensuales, posts personalizados, hashtags optimizados y variaciones para cada plataforma. Brand Studio integrado con Canva.'
                    : 'GPT-4o generates monthly strategies, personalized posts, optimized hashtags and platform variations. Integrated Brand Studio with Canva.'
                  }
                </p>
                <div className="flex items-center justify-center text-purple-400 font-medium">
                  <span>{isSpanish ? 'Contenido Inteligente' : 'Smart Content'}</span>
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
                  {isSpanish ? 'Campañas Y Análisis' : 'Campaigns & Analytics'}
                </h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  {isSpanish 
                    ? 'Publica en 21+ plataformas simultáneamente. Seguimiento de performance, engagement y ROI en tiempo real. Informes automatizados de rendimiento.'
                    : 'Publish to 21+ platforms simultaneously. Real-time performance, engagement and ROI tracking. Automated performance reports.'
                  }
                </p>
                <div className="flex items-center justify-center text-green-400 font-medium">
                  <span>{isSpanish ? 'Publicación Inteligente' : 'Smart Publishing'}</span>
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
                {isSpanish ? 'Multiplica Tu Presencia En Redes Sociales' : 'Multiply Your Social Media Presence'}
              </h2>
              <p className="text-xl text-white/70 mb-8 leading-relaxed">
                {isSpanish 
                  ? 'Nuestros clientes crean contenido 10x más rápido, aumentan engagement en 300% y responden mensajes en segundos con nuestra plataforma de gestión social potenciada por IA.'
                  : 'Our clients create content 10x faster, increase engagement by 300%, and respond to messages in seconds with our AI-powered social management platform.'
                }
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  { icon: Check, text: isSpanish ? 'Conexión instantánea con 21+ plataformas' : 'Instant connection to 21+ platforms' },
                  { icon: Check, text: isSpanish ? 'Contenido IA personalizado para cada red' : 'AI content personalized for each network' },
                  { icon: Check, text: isSpanish ? 'Respuestas automáticas inteligentes' : 'Smart automated responses' },
                  { icon: Check, text: isSpanish ? 'Análisis de sentimientos en tiempo real' : 'Real-time sentiment analysis' }
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
                <div className="text-3xl font-bold text-white mb-2">300%</div>
                <div className="text-white/60 text-sm">{isSpanish ? 'Más engagement' : 'More engagement'}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">10x</div>
                <div className="text-white/60 text-sm">{isSpanish ? 'Creación más rápida' : 'Faster content creation'}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <MessageSquare className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">2min</div>
                <div className="text-white/60 text-sm">{isSpanish ? 'Tiempo de respuesta' : 'Response time'}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
                <Bot className="w-8 h-8 text-cyan-400 mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">95%</div>
                <div className="text-white/60 text-sm">{isSpanish ? 'Precisión IA' : 'AI accuracy'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            {isSpanish ? '¿Listo Para Transformar Tu Empresa?' : 'Ready To Transform Your Business?'}
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            {isSpanish 
              ? 'Únete a más de 25,000 empresas que han transformado completamente sus operaciones con nuestro ecosistema empresarial. Prueba gratis durante 14 días.'
              : 'Join over 25,000 businesses that have completely transformed their operations with our business ecosystem. Try free for 14 days.'
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
              {isSpanish ? '✓ Sin tarjeta de crédito • ✓ Configuración instantánea' : '✓ No credit card • ✓ Instant setup'}
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