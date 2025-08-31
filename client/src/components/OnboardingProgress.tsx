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
            {isSpanish ? 'Configuración en Solo 4 Minutos' : 'Setup in Just 4 Minutes'}
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

      </div>
    </div>
  );
}