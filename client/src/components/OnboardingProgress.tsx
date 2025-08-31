import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Circle, ArrowRight, Sparkles, MessageSquare, Calendar, BarChart3, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OnboardingProgressProps {
  isSpanish: boolean;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  estimatedTime: string;
  status: 'completed' | 'current' | 'upcoming';
}

export function OnboardingProgress({ isSpanish }: OnboardingProgressProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const steps: OnboardingStep[] = isSpanish ? [
    {
      id: 'welcome',
      title: 'Bienvenido a LeadBoost',
      description: 'Configura tu perfil de negocio y preferencias iniciales',
      icon: <Sparkles className="h-5 w-5" />,
      estimatedTime: '2 min',
      status: currentStepIndex > 0 ? 'completed' : 'current'
    },
    {
      id: 'connect-accounts',
      title: 'Conectar Cuentas Sociales',
      description: 'Vincula Instagram, Facebook, WhatsApp y otras plataformas',
      icon: <Share2 className="h-5 w-5" />,
      estimatedTime: '5 min',
      status: currentStepIndex > 1 ? 'completed' : currentStepIndex === 1 ? 'current' : 'upcoming'
    },
    {
      id: 'setup-chatbot',
      title: 'Configurar Chatbot IA',
      description: 'Personaliza respuestas y configura información de tu negocio',
      icon: <MessageSquare className="h-5 w-5" />,
      estimatedTime: '8 min',
      status: currentStepIndex > 2 ? 'completed' : currentStepIndex === 2 ? 'current' : 'upcoming'
    },
    {
      id: 'calendar-integration',
      title: 'Integrar Calendario',
      description: 'Conecta Google Calendar o Calendly para citas automáticas',
      icon: <Calendar className="h-5 w-5" />,
      estimatedTime: '3 min',
      status: currentStepIndex > 3 ? 'completed' : currentStepIndex === 3 ? 'current' : 'upcoming'
    },
    {
      id: 'launch',
      title: 'Lanzar al Público',
      description: 'Activa tu chatbot y comienza a recibir leads automáticamente',
      icon: <BarChart3 className="h-5 w-5" />,
      estimatedTime: '1 min',
      status: currentStepIndex > 4 ? 'completed' : currentStepIndex === 4 ? 'current' : 'upcoming'
    }
  ] : [
    {
      id: 'welcome',
      title: 'Welcome to LeadBoost',
      description: 'Set up your business profile and initial preferences',
      icon: <Sparkles className="h-5 w-5" />,
      estimatedTime: '2 min',
      status: currentStepIndex > 0 ? 'completed' : 'current'
    },
    {
      id: 'connect-accounts',
      title: 'Connect Social Accounts',
      description: 'Link Instagram, Facebook, WhatsApp and other platforms',
      icon: <Share2 className="h-5 w-5" />,
      estimatedTime: '5 min',
      status: currentStepIndex > 1 ? 'completed' : currentStepIndex === 1 ? 'current' : 'upcoming'
    },
    {
      id: 'setup-chatbot',
      title: 'Setup AI Chatbot',
      description: 'Customize responses and configure your business information',
      icon: <MessageSquare className="h-5 w-5" />,
      estimatedTime: '8 min',
      status: currentStepIndex > 2 ? 'completed' : currentStepIndex === 2 ? 'current' : 'upcoming'
    },
    {
      id: 'calendar-integration',
      title: 'Integrate Calendar',
      description: 'Connect Google Calendar or Calendly for automatic appointments',
      icon: <Calendar className="h-5 w-5" />,
      estimatedTime: '3 min',
      status: currentStepIndex > 3 ? 'completed' : currentStepIndex === 3 ? 'current' : 'upcoming'
    },
    {
      id: 'launch',
      title: 'Go Live',
      description: 'Activate your chatbot and start receiving leads automatically',
      icon: <BarChart3 className="h-5 w-5" />,
      estimatedTime: '1 min',
      status: currentStepIndex > 4 ? 'completed' : currentStepIndex === 4 ? 'current' : 'upcoming'
    }
  ];

  const totalTime = steps.reduce((acc, step) => {
    const time = parseInt(step.estimatedTime.split(' ')[0]);
    return acc + time;
  }, 0);

  const completedTime = steps.slice(0, currentStepIndex + 1).reduce((acc, step) => {
    const time = parseInt(step.estimatedTime.split(' ')[0]);
    return acc + time;
  }, 0);

  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const simulateOnboarding = () => {
    setIsAutoPlaying(true);
    setCurrentStepIndex(0);
    
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
  };

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 rounded-full border border-blue-200 mb-4">
            <Circle className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-700 font-semibold">
              {isSpanish ? 'Configuración Guiada' : 'Guided Setup'}
            </span>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isSpanish ? 'Configuración en Solo 19 Minutos' : 'Setup in Just 19 Minutes'}
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {isSpanish 
              ? 'Nuestro proceso de configuración guiado te lleva paso a paso para que tengas toda la plataforma funcionando en minutos'
              : 'Our guided setup process takes you step by step to have the entire platform running in minutes'
            }
          </p>
          
          <div className="flex justify-center space-x-4 mb-8">
            <Button 
              onClick={simulateOnboarding}
              disabled={isAutoPlaying}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              data-testid="button-simulate-onboarding"
            >
              {isAutoPlaying ? (isSpanish ? 'Simulando...' : 'Simulating...') : (isSpanish ? 'Ver Proceso' : 'View Process')}
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden shadow-xl border-2 border-gray-200">
          {/* Progress Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold">
                {isSpanish ? 'Progreso de Configuración' : 'Setup Progress'}
              </h4>
              <Badge className="bg-white/20 text-white border-white/30">
                {Math.round(progressPercentage)}%
              </Badge>
            </div>
            
            <div className="w-full bg-white/20 rounded-full h-3 mb-2">
              <div 
                className="bg-white rounded-full h-3 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm opacity-90">
              <span>
                {isSpanish ? `Paso ${currentStepIndex + 1} de ${steps.length}` : `Step ${currentStepIndex + 1} of ${steps.length}`}
              </span>
              <span>
                {isSpanish ? `${completedTime}/${totalTime} min` : `${completedTime}/${totalTime} min`}
              </span>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Steps List */}
            <div className="p-6">
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`flex items-center p-4 rounded-lg border-2 transition-all duration-300 ${
                      step.status === 'completed' 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : step.status === 'current'
                          ? 'bg-blue-50 border-blue-300 text-blue-800 scale-105 shadow-lg'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      step.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : step.status === 'current'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                    }`}>
                      {step.status === 'completed' ? <Check className="h-5 w-5" /> : step.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-bold text-lg">{step.title}</h5>
                        <Badge variant={step.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {step.estimatedTime}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-80">{step.description}</p>
                    </div>
                    
                    {step.status === 'current' && !isAutoPlaying && (
                      <Button 
                        onClick={nextStep}
                        size="sm"
                        className="ml-4 bg-blue-500 hover:bg-blue-600 text-white"
                        data-testid={`button-next-${step.id}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Completion Message */}
            {currentStepIndex === steps.length - 1 && (
              <div className="border-t border-gray-200 p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    {isSpanish ? '¡Configuración Completa!' : 'Setup Complete!'}
                  </h4>
                  <p className="text-gray-600 mb-6">
                    {isSpanish 
                      ? 'Tu chatbot con IA está listo para empezar a capturar leads y programar citas automáticamente.'
                      : 'Your AI chatbot is ready to start capturing leads and booking appointments automatically.'
                    }
                  </p>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    data-testid="button-launch-dashboard"
                  >
                    {isSpanish ? 'Ir al Dashboard' : 'Go to Dashboard'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}