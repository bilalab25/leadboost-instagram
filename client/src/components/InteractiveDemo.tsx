import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, MessageCircle, Calendar, BarChart3, Bot, Sparkles, ArrowRight, CheckCircle, Clock, Users, TrendingUp } from 'lucide-react';
import { SiInstagram, SiFacebook, SiWhatsapp, SiTiktok } from 'react-icons/si';

interface InteractiveDemoProps {
  isSpanish: boolean;
}

type DemoStep = 'start' | 'chatbot' | 'scheduling' | 'analytics' | 'results';

export function InteractiveDemo({ isSpanish }: InteractiveDemoProps) {
  const [currentStep, setCurrentStep] = useState<DemoStep>('start');
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = {
    start: {
      title: isSpanish ? '🚀 Tu Cliente Llega' : '🚀 Your Customer Arrives',
      description: isSpanish 
        ? 'Un cliente potencial ve tu Instagram y quiere saber sobre tus servicios de Botox.'
        : 'A potential customer sees your Instagram and wants to know about your Botox services.',
      content: (
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <SiInstagram className="h-10 w-10 text-white" />
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg max-w-sm mx-auto">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mr-2"></div>
              <span className="font-semibold">@cliente_interesado</span>
            </div>
            <p className="text-gray-700 text-sm">
              {isSpanish ? '"¿Cuánto cuesta el tratamiento de Botox? ¿Tienen disponibilidad esta semana?"' : '"How much does Botox treatment cost? Do you have availability this week?"'}
            </p>
          </div>
        </div>
      )
    },
    chatbot: {
      title: isSpanish ? '🤖 IA Responde Inmediatamente' : '🤖 AI Responds Instantly',
      description: isSpanish 
        ? 'Nuestro chatbot con IA responde en segundos con información personalizada.'
        : 'Our AI chatbot responds in seconds with personalized information.',
      content: (
        <div className="p-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <p className="text-sm text-gray-800">
                    {isSpanish 
                      ? '¡Hola! 😊 El tratamiento de Botox cuesta $300 y dura 30 minutos. Tengo disponibilidad el jueves a las 2:00 PM y viernes a las 10:00 AM. ¿Te gustaría reservar una de estas citas?'
                      : 'Hi! 😊 Botox treatment costs $300 and takes 30 minutes. I have availability Thursday at 2:00 PM and Friday at 10:00 AM. Would you like to book one of these appointments?'
                    }
                  </p>
                  <div className="flex space-x-2 mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {isSpanish ? 'Jueves 2PM' : 'Thu 2PM'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {isSpanish ? 'Viernes 10AM' : 'Fri 10AM'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {isSpanish ? 'Respondido en 1.2 segundos' : 'Responded in 1.2 seconds'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    scheduling: {
      title: isSpanish ? '📅 Cita Programada Automáticamente' : '📅 Appointment Scheduled Automatically',
      description: isSpanish 
        ? 'El cliente elige un horario y la cita se programa instantáneamente en tu calendario.'
        : 'Customer picks a time and the appointment is instantly scheduled in your calendar.',
      content: (
        <div className="p-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h4 className="font-bold text-gray-900 mb-3">
                {isSpanish ? '¡Cita Confirmada!' : 'Appointment Confirmed!'}
              </h4>
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">María García</span>
                  <Badge className="bg-green-100 text-green-800">
                    {isSpanish ? 'Confirmada' : 'Confirmed'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <p>📅 {isSpanish ? 'Jueves, 15 Feb 2024' : 'Thursday, Feb 15, 2024'}</p>
                  <p>🕐 {isSpanish ? '2:00 PM - 2:30 PM' : '2:00 PM - 2:30 PM'}</p>
                  <p>💉 {isSpanish ? 'Tratamiento Botox ($300)' : 'Botox Treatment ($300)'}</p>
                  <p>📱 +1 (555) 123-4567</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                  {isSpanish ? 'Sincronizado con Google Calendar' : 'Synced to Google Calendar'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    analytics: {
      title: isSpanish ? '📊 Análisis en Tiempo Real' : '📊 Real-time Analytics',
      description: isSpanish 
        ? 'Ve todas las métricas importantes en tu dashboard personalizado.'
        : 'See all important metrics in your personalized dashboard.',
      content: (
        <div className="p-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <MessageCircle className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-blue-900">247</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                {isSpanish ? 'Conversaciones Hoy' : 'Conversations Today'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <Calendar className="h-8 w-8 text-green-600" />
                <span className="text-2xl font-bold text-green-900">18</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {isSpanish ? 'Citas Programadas' : 'Appointments Booked'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <span className="text-2xl font-bold text-purple-900">73%</span>
              </div>
              <p className="text-sm text-purple-700 mt-1">
                {isSpanish ? 'Tasa Conversión' : 'Conversion Rate'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 text-orange-600" />
                <span className="text-2xl font-bold text-orange-900">$5,400</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                {isSpanish ? 'Ingresos Hoy' : "Today's Revenue"}
              </p>
            </div>
          </div>
        </div>
      )
    },
    results: {
      title: isSpanish ? '🎉 Resultados Increíbles' : '🎉 Amazing Results',
      description: isSpanish 
        ? 'Todo esto sucede automáticamente, 24/7, mientras tú te enfocas en brindar el mejor servicio.'
        : 'All this happens automatically, 24/7, while you focus on providing the best service.',
      content: (
        <div className="p-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl">
              <div className="text-3xl font-black text-emerald-600 mb-2">+300%</div>
              <p className="text-sm text-gray-700">{isSpanish ? 'Más Citas' : 'More Appointments'}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl">
              <div className="text-3xl font-black text-blue-600 mb-2">24/7</div>
              <p className="text-sm text-gray-700">{isSpanish ? 'Disponibilidad' : 'Availability'}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl">
              <div className="text-3xl font-black text-purple-600 mb-2">0</div>
              <p className="text-sm text-gray-700">{isSpanish ? 'Leads Perdidos' : 'Lost Leads'}</p>
            </div>
          </div>
        </div>
      )
    }
  };

  const nextStep = () => {
    const stepOrder: DemoStep[] = ['start', 'chatbot', 'scheduling', 'analytics', 'results'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const playDemo = () => {
    setIsPlaying(true);
    setCurrentStep('start');
    
    const stepOrder: DemoStep[] = ['start', 'chatbot', 'scheduling', 'analytics', 'results'];
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
    setCurrentStep('start');
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
              ? 'Descubre cómo LeadBoost transforma tu marca en campañas que generan ventas automáticamente'
              : 'Discover how LeadBoost transforms your brand into campaigns that generate sales automatically'
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