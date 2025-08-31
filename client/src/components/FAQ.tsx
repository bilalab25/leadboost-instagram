import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  isSpanish: boolean;
}

export function FAQ({ isSpanish }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqData: FAQItem[] = isSpanish ? [
    {
      question: '¿Cómo funciona el chatbot con IA para programar citas?',
      answer: 'Nuestro chatbot con IA entiende las consultas de los clientes, verifica la disponibilidad en tiempo real y programa citas automáticamente. Funciona 24/7 en español e inglés, capturando leads mientras duermes. El chatbot está entrenado específicamente para negocios de servicios como salones de belleza, consultorios médicos y spas.'
    },
    {
      question: '¿LeadBoost realmente aumenta las conversiones?',
      answer: 'Sí, nuestros clientes ven un aumento promedio del 40% en conversiones. Al automatizar las respuestas inmediatas, programar citas al instante y mantener conversaciones personalizadas, capturamos más leads que los métodos tradicionales. Además, el chatbot califica automáticamente a los prospectos.'
    },
    {
      question: '¿Qué plataformas están incluidas en los 21+ canales?',
      answer: 'Incluimos Instagram, Facebook, WhatsApp, TikTok, LinkedIn, YouTube, Twitter/X, email marketing, SMS, Google Ads, y muchas más. También integramos con sistemas de citas como Calendly, Acuity, y calendarios de Google para programación automática.'
    },
    {
      question: '¿Es difícil configurar LeadBoost?',
      answer: 'Para nada. La configuración toma menos de 30 minutos. Nuestro equipo se encarga de la configuración inicial sin costo adicional (valor $200). Solo necesitas conectar tus cuentas sociales y listo - el chatbot empieza a trabajar inmediatamente.'
    },
    {
      question: '¿Puedo cancelar en cualquier momento?',
      answer: 'Absolutamente. No hay contratos ni penalizaciones por cancelación. Puedes cancelar en cualquier momento desde tu panel de control. También ofrecemos una garantía de 30 días - si no estás completamente satisfecho, te devolvemos tu dinero.'
    },
    {
      question: '¿Cómo maneja el chatbot consultas complejas?',
      answer: 'El chatbot está entrenado para manejar el 80% de las consultas comunes automáticamente. Para casos complejos, transfiere seamlessly al personal humano con todo el contexto de la conversación. También aprende de cada interacción para mejorar continuamente.'
    },
    {
      question: '¿Qué tipo de reportes y analíticas incluye?',
      answer: 'Obtienes dashboards detallados con métricas de conversión, leads generados, citas programadas, ROI por plataforma, horarios de mayor actividad, y análisis de sentimiento de clientes. Todo en tiempo real para optimizar tu estrategia.'
    },
    {
      question: '¿Es seguro para los datos de mis clientes?',
      answer: 'Sí, cumplimos con GDPR y SOC 2. Todos los datos están encriptados end-to-end, almacenados en servidores seguros, y nunca compartimos información personal. Tus clientes y su privacidad están completamente protegidos.'
    }
  ] : [
    {
      question: 'How does the AI chatbot schedule appointments?',
      answer: 'Our AI chatbot understands customer inquiries, checks real-time availability, and books appointments automatically. It works 24/7 in both Spanish and English, capturing leads while you sleep. The chatbot is specifically trained for service businesses like beauty salons, medical practices, and spas.'
    },
    {
      question: 'Does LeadBoost really increase conversions?',
      answer: 'Yes, our clients see an average 40% increase in conversions. By automating instant responses, booking appointments immediately, and maintaining personalized conversations, we capture more leads than traditional methods. Plus, the chatbot automatically qualifies prospects.'
    },
    {
      question: 'What platforms are included in the 21+ channels?',
      answer: 'We include Instagram, Facebook, WhatsApp, TikTok, LinkedIn, YouTube, Twitter/X, email marketing, SMS, Google Ads, and many more. We also integrate with appointment systems like Calendly, Acuity, and Google Calendar for automatic scheduling.'
    },
    {
      question: 'Is LeadBoost difficult to set up?',
      answer: 'Not at all. Setup takes less than 30 minutes. Our team handles the initial configuration at no extra cost (worth $200). You just need to connect your social accounts and you\'re done - the chatbot starts working immediately.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Absolutely. There are no contracts or cancellation fees. You can cancel anytime from your dashboard. We also offer a 30-day guarantee - if you\'re not completely satisfied, we\'ll refund your money.'
    },
    {
      question: 'How does the chatbot handle complex inquiries?',
      answer: 'The chatbot is trained to handle 80% of common inquiries automatically. For complex cases, it seamlessly transfers to human staff with full conversation context. It also learns from each interaction to continuously improve.'
    },
    {
      question: 'What kind of reports and analytics are included?',
      answer: 'You get detailed dashboards with conversion metrics, leads generated, appointments booked, ROI by platform, peak activity times, and customer sentiment analysis. Everything in real-time to optimize your strategy.'
    },
    {
      question: 'Is it secure for my customer data?',
      answer: 'Yes, we comply with GDPR and SOC 2. All data is end-to-end encrypted, stored on secure servers, and we never share personal information. Your customers and their privacy are completely protected.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isSpanish ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {isSpanish 
              ? 'Todo lo que necesitas saber sobre LeadBoost y cómo transformará tu negocio'
              : 'Everything you need to know about LeadBoost and how it will transform your business'
            }
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <Card key={index} className="overflow-hidden border border-gray-200 hover:border-brand-300 transition-colors duration-200">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
                  data-testid={`faq-question-${index}`}
                >
                  <h4 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h4>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <ChevronUp className="h-5 w-5 text-brand-600" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <div className="h-px bg-gradient-to-r from-brand-200 via-brand-300 to-brand-200 mb-4"></div>
                    <p className="text-gray-700 leading-relaxed" data-testid={`faq-answer-${index}`}>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            {isSpanish ? '¿Tienes más preguntas?' : 'Have more questions?'}
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="text-center">
                <h5 className="font-semibold text-gray-900 mb-2">
                  {isSpanish ? '📧 Email' : '📧 Email'}
                </h5>
                <p className="text-gray-600">support@leadboost.com</p>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="text-center">
                <h5 className="font-semibold text-gray-900 mb-2">
                  {isSpanish ? '💬 Chat en Vivo' : '💬 Live Chat'}
                </h5>
                <p className="text-gray-600">
                  {isSpanish ? 'Disponible 24/7' : 'Available 24/7'}
                </p>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="text-center">
                <h5 className="font-semibold text-gray-900 mb-2">
                  {isSpanish ? '📞 Teléfono' : '📞 Phone'}
                </h5>
                <p className="text-gray-600">+1 (555) 123-4567</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}