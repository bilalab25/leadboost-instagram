import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, MessageCircle, Calendar, BarChart3, Bot, Sparkles, ArrowRight, CheckCircle, Clock, Users, TrendingUp, Target, Palette, Zap } from 'lucide-react';
import { SiInstagram, SiFacebook, SiWhatsapp, SiTiktok, SiLinkedin, SiYoutube, SiX, SiPinterest } from 'react-icons/si';

interface InteractiveDemoProps {
  isSpanish: boolean;
}

type DemoStep = 'campaigner' | 'brandstudio' | 'chatdeck' | 'results';

export function InteractiveDemo({ isSpanish }: InteractiveDemoProps) {
  const [currentStep, setCurrentStep] = useState<DemoStep>('campaigner');
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = {
    campaigner: {
      title: isSpanish ? '🎯 CampAIgner - Tus Datos → Campañas que Convierten' : '🎯 CampAIgner - Your Data → Converting Campaigns',
      description: isSpanish 
        ? 'IA analiza los datos de tu negocio y crea automáticamente campañas optimizadas para 21+ plataformas que realmente convierten.'
        : 'AI analyzes your business data and automatically creates optimized campaigns for 21+ platforms that actually convert.',
      content: (
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Side */}
            <div className="bg-gradient-to-br from-indigo-50 to-brand-50 p-6 rounded-2xl border border-indigo-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-indigo-600" />
                {isSpanish ? 'Datos de Tu Negocio' : 'Your Business Data'}
              </h4>
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {isSpanish ? 'Productos: Línea de belleza natural' : 'Products: Natural beauty line'}
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    {isSpanish ? 'Audiencia: Mujeres 25-45' : 'Audience: Women 25-45'}
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    {isSpanish ? 'Objetivo: Aumentar ventas' : 'Goal: Increase sales'}
                  </div>
                </div>
              </div>
            </div>

            {/* Output Side */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-emerald-600" />
                {isSpanish ? 'IA Crea Campañas que Convierten' : 'AI Creates Converting Campaigns'}
              </h4>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center">
                  <SiInstagram className="h-6 w-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <SiFacebook className="h-6 w-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                  <SiTiktok className="h-6 w-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <SiLinkedin className="h-6 w-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <SiYoutube className="h-6 w-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                  <SiX className="h-6 w-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <SiPinterest className="h-6 w-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  +14
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                {isSpanish ? 'IA selecciona plataformas + crea contenido optimizado' : 'AI selects platforms + creates optimized content'}
              </Badge>
            </div>
          </div>
        </div>
      )
    },
    brandstudio: {
      title: isSpanish ? '🎨 Brand Studio - Diseños Profesionales' : '🎨 Brand Studio - Professional Designs',
      description: isSpanish 
        ? 'Crea visuales impactantes con IA usando plantillas profesionales y tu marca personal.'
        : 'Create stunning visuals with AI using professional templates and your personal branding.',
      content: (
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Templates Side */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2 text-purple-600" />
                {isSpanish ? 'Plantillas Pro' : 'Pro Templates'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-pink-400 to-rose-500 h-20 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  Story
                </div>
                <div className="bg-gradient-to-br from-blue-400 to-indigo-500 h-20 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  Post
                </div>
                <div className="bg-gradient-to-br from-emerald-400 to-green-500 h-20 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  Reel
                </div>
                <div className="bg-gradient-to-br from-orange-400 to-red-500 h-20 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  Ad
                </div>
              </div>
            </div>

            {/* AI Generated Design */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-amber-600" />
                {isSpanish ? 'Diseño IA' : 'AI Design'}
              </h4>
              <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 h-32 rounded-xl flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">Beauty Natural</div>
                  <div className="text-xs opacity-90">{isSpanish ? 'Nueva Línea 2024' : 'New Line 2024'}</div>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-800 text-xs mt-3">
                {isSpanish ? 'Generado en 15 segundos' : 'Generated in 15 seconds'}
              </Badge>
            </div>
          </div>
        </div>
      )
    },
    chatdeck: {
      title: isSpanish ? '💬 Chat Deck - IA que Convierte' : '💬 Chat Deck - AI that Converts',
      description: isSpanish 
        ? 'Chatbot inteligente que responde 24/7 y programa citas automáticamente.'
        : 'Smart chatbot that responds 24/7 and schedules appointments automatically.',
      content: (
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Message */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                {isSpanish ? 'Cliente' : 'Customer'}
              </h4>
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mr-2"></div>
                  <span className="font-semibold text-sm">@maria_cliente</span>
                </div>
                <p className="text-sm text-gray-700">
                  {isSpanish 
                    ? "¿Cuánto cuesta el tratamiento y cuándo tienen disponibilidad?"
                    : "How much does the treatment cost and when do you have availability?"
                  }
                </p>
              </div>
            </div>

            {/* AI Response & Booking */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <Bot className="h-5 w-5 mr-2 text-emerald-600" />
                {isSpanish ? 'IA Responde + Agenda' : 'AI Responds + Books'}
              </h4>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-xl shadow-sm text-sm">
                  <p className="text-gray-700 mb-2">
                    {isSpanish 
                      ? "¡Hola María! 😊 El tratamiento cuesta $300. Tengo estas opciones:"
                      : "Hi María! 😊 Treatment costs $300. I have these options:"
                    }
                  </p>
                  <div className="flex space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {isSpanish ? 'Jueves 2PM' : 'Thu 2PM'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {isSpanish ? 'Viernes 10AM' : 'Fri 10AM'}
                    </Badge>
                  </div>
                </div>
                <div className="bg-emerald-100 p-3 rounded-xl">
                  <div className="flex items-center text-sm font-bold text-emerald-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {isSpanish ? '¡Cita Confirmada!' : 'Appointment Confirmed!'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    results: {
      title: isSpanish ? '📈 Resultados Automáticos' : '📈 Automated Results',
      description: isSpanish 
        ? 'Todo esto sucede automáticamente, 24/7, mientras tú te enfocas en brindar el mejor servicio.'
        : 'All this happens automatically, 24/7, while you focus on providing the best service.',
      content: (
        <div className="p-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl">
              <div className="text-3xl font-black text-emerald-600 mb-2">+300%</div>
              <p className="text-sm text-gray-700">{isSpanish ? 'Más Campañas' : 'More Campaigns'}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl">
              <div className="text-3xl font-black text-blue-600 mb-2">24/7</div>
              <p className="text-sm text-gray-700">{isSpanish ? 'Disponibilidad' : 'Availability'}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl">
              <div className="text-3xl font-black text-purple-600 mb-2">0</div>
              <p className="text-sm text-gray-700">{isSpanish ? 'Esfuerzo Manual' : 'Manual Effort'}</p>
            </div>
          </div>
        </div>
      )
    }
  };

  const nextStep = () => {
    const stepOrder: DemoStep[] = ['campaigner', 'brandstudio', 'chatdeck', 'results'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const playDemo = () => {
    setIsPlaying(true);
    setCurrentStep('campaigner');
    
    const stepOrder: DemoStep[] = ['campaigner', 'brandstudio', 'chatdeck', 'results'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < stepOrder.length) {
        setCurrentStep(stepOrder[currentIndex]);
      } else {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 3000);
  };

  const resetDemo = () => {
    setCurrentStep('campaigner');
    setIsPlaying(false);
  };

  return (
    <div className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isSpanish ? 'Ve LeadBoost en Acción' : 'See LeadBoost in Action'}
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {isSpanish 
              ? 'Descubre cómo las tres herramientas principales trabajan juntas para revolucionar tu marketing'
              : 'Discover how the three core tools work together to revolutionize your marketing'
            }
          </p>
          
          <div className="flex justify-center space-x-4 mb-8">
            <Button 
              onClick={playDemo}
              disabled={isPlaying}
              className="bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white"
              data-testid="button-play-demo"
            >
              <Play className="mr-2 h-5 w-5" />
              {isPlaying ? (isSpanish ? 'Reproduciendo...' : 'Playing...') : (isSpanish ? 'Ver Demo' : 'Watch Demo')}
            </Button>
            <Button variant="outline" onClick={resetDemo} data-testid="button-reset-demo">
              {isSpanish ? 'Reiniciar' : 'Reset'}
            </Button>
          </div>
        </div>

        <Card className="mb-8 overflow-hidden shadow-2xl border-2 border-gray-200">
          <div className="bg-gradient-to-r from-brand-600 to-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-6 w-6" />
                <h4 className="text-lg font-bold">{steps[currentStep].title}</h4>
              </div>
              <div className="flex space-x-1">
                {Object.keys(steps).map((step, index) => (
                  <div 
                    key={step}
                    className={`w-2 h-2 rounded-full ${
                      Object.keys(steps).indexOf(currentStep) >= index ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm mt-1 opacity-90">{steps[currentStep].description}</p>
          </div>
          
          <CardContent className="p-0">
            {steps[currentStep].content}
          </CardContent>
        </Card>

        {!isPlaying && currentStep !== 'results' && (
          <div className="text-center">
            <Button 
              onClick={nextStep}
              variant="outline"
              className="border-brand-600 text-brand-600 hover:bg-brand-50"
              data-testid="button-next-step"
            >
              {isSpanish ? 'Siguiente Paso' : 'Next Step'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {currentStep === 'results' && (
          <div className="text-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/pricing'}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-4 text-lg font-bold"
              data-testid="button-start-free-trial"
            >
              <Sparkles className="mr-3 h-5 w-5" />
              {isSpanish ? '¡Empezar Prueba Gratis!' : 'Start Free Trial!'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}