import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, Play, Lightbulb, Target, Zap, CheckCircle } from 'lucide-react';
import { SiInstagram, SiWhatsapp } from 'react-icons/si';

interface GuidedTourProps {
  isSpanish: boolean;
  onClose: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  tips: string[];
  mockup: React.ReactNode;
  highlight: string;
}

export function GuidedTour({ isSpanish, onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const steps: TourStep[] = isSpanish ? [
    {
      id: 'dashboard-overview',
      title: 'Tu Dashboard Principal',
      description: 'Aquí puedes ver todas las métricas importantes de tu negocio en tiempo real.',
      tips: [
        'Revisa las conversaciones nuevas cada mañana',
        'Observa qué horarios tienen más actividad',
        'Usa los filtros para encontrar leads específicos'
      ],
      mockup: (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">47</div>
              <div className="text-xs text-gray-600">Leads Hoy</div>
            </div>
            <div className="bg-white p-3 rounded text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-xs text-gray-600">Citas</div>
            </div>
            <div className="bg-white p-3 rounded text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600">$2,400</div>
              <div className="text-xs text-gray-600">Revenue</div>
            </div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-sm font-semibold mb-2">Actividad Reciente</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Nueva cita: María G. - Botox 2:00 PM
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Mensaje: Carlos P. pregunta precios
              </div>
            </div>
          </div>
        </div>
      ),
      highlight: 'Las métricas en tiempo real te ayudan a tomar decisiones rápidas'
    },
    {
      id: 'chatbot-management',
      title: 'Gestión del Chatbot',
      description: 'Personaliza respuestas, configura horarios y ajusta la personalidad de tu asistente IA.',
      tips: [
        'Actualiza precios y servicios regularmente',
        'Ajusta el tono según tu audiencia',
        'Revisa y mejora respuestas basado en feedback'
      ],
      mockup: (
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Configuración del Bot</h4>
              <Badge className="bg-green-100 text-green-800">Activo</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Respuesta automática</span>
                <div className="w-8 h-4 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Horario de atención</span>
                <span className="text-xs text-gray-600">9 AM - 8 PM</span>
              </div>
              <div className="bg-gray-50 p-3 rounded text-xs">
                <strong>Mensaje de bienvenida:</strong><br />
                "¡Hola! 😊 Soy el asistente de [Tu Negocio]. ¿En qué puedo ayudarte hoy?"
              </div>
            </div>
          </div>
        </div>
      ),
      highlight: 'Un chatbot bien configurado convierte más leads en clientes'
    },
    {
      id: 'conversation-management',
      title: 'Gestionar Conversaciones',
      description: 'Ve todas las conversaciones de clientes, transfiere a humanos cuando sea necesario.',
      tips: [
        'Responde rápido a mensajes urgentes',
        'Usa etiquetas para organizar conversaciones',
        'Configura respuestas rápidas para preguntas comunes'
      ],
      mockup: (
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-lg">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-3 border-b">
              <div className="flex items-center">
                <SiInstagram className="h-4 w-4 text-pink-500 mr-2" />
                <span className="text-sm font-semibold">@ana_martinez_beauty</span>
                <Badge className="ml-2 text-xs bg-yellow-100 text-yellow-800">Nuevo</Badge>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-gray-100 p-2 rounded-lg text-sm">
                "Hola, ¿cuánto cuesta el tratamiento facial y cuándo tienen disponible?"
              </div>
              <div className="bg-blue-500 text-white p-2 rounded-lg text-sm ml-8">
                "¡Hola Ana! 😊 El tratamiento facial cuesta $120 y dura 60 min. Tengo disponibilidad mañana a las 3 PM o viernes a las 11 AM. ¿Te interesa alguno?"
              </div>
              <div className="text-xs text-gray-500 text-center">
                Respuesta automática • hace 2 min
              </div>
            </div>
          </div>
        </div>
      ),
      highlight: 'Las conversaciones organizadas mejoran la experiencia del cliente'
    },
    {
      id: 'calendar-bookings',
      title: 'Calendario y Citas',
      description: 'Gestiona todas tus citas programadas automáticamente por el chatbot.',
      tips: [
        'Configura recordatorios automáticos',
        'Bloquea horarios no disponibles',
        'Sincroniza con tu calendario personal'
      ],
      mockup: (
        <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-lg">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-orange-500 text-white p-3 text-center font-semibold">
              Febrero 2024
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                <div className="text-center font-semibold text-gray-600">L</div>
                <div className="text-center font-semibold text-gray-600">M</div>
                <div className="text-center font-semibold text-gray-600">X</div>
                <div className="text-center font-semibold text-gray-600">J</div>
                <div className="text-center font-semibold text-gray-600">V</div>
                <div className="text-center font-semibold text-gray-600">S</div>
                <div className="text-center font-semibold text-gray-600">D</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {Array.from({ length: 28 }, (_, i) => (
                  <div key={i} className={`text-center p-1 rounded ${
                    [5, 12, 18, 23].includes(i) ? 'bg-green-100 text-green-800' : 'text-gray-600'
                  }`}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>4 citas programadas esta semana</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      highlight: 'El calendario automático elimina la coordinación manual de citas'
    },
    {
      id: 'analytics-insights',
      title: 'Análisis y Reportes',
      description: 'Obtén insights profundos sobre el rendimiento de tu chatbot y ROI.',
      tips: [
        'Revisa métricas semanalmente',
        'Identifica horarios pico de actividad',
        'Analiza qué servicios son más populares'
      ],
      mockup: (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-lg">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h4 className="font-semibold mb-3">Reporte Semanal</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">73%</div>
                <div className="text-xs text-gray-600">Tasa Conversión</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">2.3min</div>
                <div className="text-xs text-gray-600">Tiempo Respuesta</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-100 to-green-100 h-20 rounded mb-3 flex items-center justify-center text-xs text-gray-600">
              Gráfico de Tendencias
            </div>
            <div className="text-xs">
              <div className="font-semibold mb-1">Top Servicios:</div>
              <div>1. Botox (40%)</div>
              <div>2. Limpieza facial (35%)</div>
              <div>3. Masajes (25%)</div>
            </div>
          </div>
        </div>
      ),
      highlight: 'Los datos te ayudan a optimizar y crecer tu negocio'
    }
  ] : [
    {
      id: 'dashboard-overview',
      title: 'Your Main Dashboard',
      description: 'Here you can see all the important metrics of your business in real time.',
      tips: [
        'Check new conversations every morning',
        'Notice which times have more activity',
        'Use filters to find specific leads'
      ],
      mockup: (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">47</div>
              <div className="text-xs text-gray-600">Leads Today</div>
            </div>
            <div className="bg-white p-3 rounded text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-xs text-gray-600">Appointments</div>
            </div>
            <div className="bg-white p-3 rounded text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600">$2,400</div>
              <div className="text-xs text-gray-600">Revenue</div>
            </div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-sm font-semibold mb-2">Recent Activity</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                New appointment: Maria G. - Botox 2:00 PM
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Message: Carlos P. asks about pricing
              </div>
            </div>
          </div>
        </div>
      ),
      highlight: 'Real-time metrics help you make quick decisions'
    },
    {
      id: 'chatbot-management',
      title: 'Chatbot Management',
      description: 'Customize responses, set schedules and adjust your AI assistant personality.',
      tips: [
        'Update prices and services regularly',
        'Adjust tone according to your audience',
        'Review and improve responses based on feedback'
      ],
      mockup: (
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg">
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Bot Configuration</h4>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Auto response</span>
                <div className="w-8 h-4 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Business hours</span>
                <span className="text-xs text-gray-600">9 AM - 8 PM</span>
              </div>
              <div className="bg-gray-50 p-3 rounded text-xs">
                <strong>Welcome message:</strong><br />
                "Hi! 😊 I'm [Your Business] assistant. How can I help you today?"
              </div>
            </div>
          </div>
        </div>
      ),
      highlight: 'A well-configured chatbot converts more leads into customers'
    },
    {
      id: 'conversation-management',
      title: 'Manage Conversations',
      description: 'See all customer conversations, transfer to humans when necessary.',
      tips: [
        'Respond quickly to urgent messages',
        'Use tags to organize conversations',
        'Set up quick responses for common questions'
      ],
      mockup: (
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-lg">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-3 border-b">
              <div className="flex items-center">
                <SiInstagram className="h-4 w-4 text-pink-500 mr-2" />
                <span className="text-sm font-semibold">@ana_martinez_beauty</span>
                <Badge className="ml-2 text-xs bg-yellow-100 text-yellow-800">New</Badge>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-gray-100 p-2 rounded-lg text-sm">
                "Hi, how much does facial treatment cost and when do you have available?"
              </div>
              <div className="bg-blue-500 text-white p-2 rounded-lg text-sm ml-8">
                "Hi Ana! 😊 Facial treatment costs $120 and takes 60 min. I have availability tomorrow at 3 PM or Friday at 11 AM. Are you interested in either?"
              </div>
              <div className="text-xs text-gray-500 text-center">
                Auto response • 2 min ago
              </div>
            </div>
          </div>
        </div>
      ),
      highlight: 'Organized conversations improve customer experience'
    },
    {
      id: 'calendar-bookings',
      title: 'Calendar & Appointments',
      description: 'Manage all appointments automatically scheduled by the chatbot.',
      tips: [
        'Set up automatic reminders',
        'Block unavailable times',
        'Sync with your personal calendar'
      ],
      mockup: (
        <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-lg">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-orange-500 text-white p-3 text-center font-semibold">
              February 2024
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                <div className="text-center font-semibold text-gray-600">M</div>
                <div className="text-center font-semibold text-gray-600">T</div>
                <div className="text-center font-semibold text-gray-600">W</div>
                <div className="text-center font-semibold text-gray-600">T</div>
                <div className="text-center font-semibold text-gray-600">F</div>
                <div className="text-center font-semibold text-gray-600">S</div>
                <div className="text-center font-semibold text-gray-600">S</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {Array.from({ length: 28 }, (_, i) => (
                  <div key={i} className={`text-center p-1 rounded ${
                    [5, 12, 18, 23].includes(i) ? 'bg-green-100 text-green-800' : 'text-gray-600'
                  }`}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>4 appointments scheduled this week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      highlight: 'Automatic calendar eliminates manual appointment coordination'
    },
    {
      id: 'analytics-insights',
      title: 'Analytics & Reports',
      description: 'Get deep insights about your chatbot performance and ROI.',
      tips: [
        'Review metrics weekly',
        'Identify peak activity hours',
        'Analyze which services are most popular'
      ],
      mockup: (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-lg">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h4 className="font-semibold mb-3">Weekly Report</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">73%</div>
                <div className="text-xs text-gray-600">Conversion Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">2.3min</div>
                <div className="text-xs text-gray-600">Response Time</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-100 to-green-100 h-20 rounded mb-3 flex items-center justify-center text-xs text-gray-600">
              Trends Chart
            </div>
            <div className="text-xs">
              <div className="font-semibold mb-1">Top Services:</div>
              <div>1. Botox (40%)</div>
              <div>2. Facial cleaning (35%)</div>
              <div>3. Massages (25%)</div>
            </div>
          </div>
        </div>
      ),
      highlight: 'Data helps you optimize and grow your business'
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeTour = () => {
    setIsActive(false);
    onClose();
  };

  if (!isActive) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Play className="h-6 w-6" />
              <h3 className="text-2xl font-bold">
                {isSpanish ? 'Tour Interactivo' : 'Interactive Tour'}
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-white/20 text-white border-white/30">
                {currentStep + 1} / {steps.length}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={closeTour}
                className="text-white hover:bg-white/20"
                data-testid="button-close-tour"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="mb-6">
            <h4 className="text-2xl font-bold text-gray-900 mb-3">{currentStepData.title}</h4>
            <p className="text-gray-600 text-lg leading-relaxed">{currentStepData.description}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-6">
            <div>
              <h5 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                {isSpanish ? 'Consejos Útiles' : 'Helpful Tips'}
              </h5>
              <ul className="space-y-3">
                {currentStepData.tips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-lg font-semibold text-gray-900 mb-4">
                {isSpanish ? 'Vista Previa' : 'Preview'}
              </h5>
              {currentStepData.mockup}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-6">
            <div className="flex items-center">
              <Target className="h-5 w-5 text-blue-600 mr-3" />
              <p className="text-blue-800 font-medium">{currentStepData.highlight}</p>
            </div>
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 0}
              data-testid="button-prev-step"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isSpanish ? 'Anterior' : 'Previous'}
            </Button>
            
            <div className="flex space-x-3">
              <Button variant="ghost" onClick={closeTour} data-testid="button-skip-tour">
                {isSpanish ? 'Saltar Tour' : 'Skip Tour'}
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button onClick={nextStep} data-testid="button-next-step">
                  {isSpanish ? 'Siguiente' : 'Next'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={closeTour}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  data-testid="button-finish-tour"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isSpanish ? 'Finalizar Tour' : 'Finish Tour'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}