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
    // #1 CampAIgner Questions
    {
      question: '¿Qué es CampAIgner y cómo funciona?',
      answer: 'CampAIgner es nuestro generador de campañas con IA que transforma tu marca en contenido listo para usar en 21+ plataformas con un solo clic. Solo describes tu campaña y la IA genera automáticamente posts, stories, emails y contenido dimensionado específicamente para cada red social.'
    },
    {
      question: '¿CampAIgner realmente crea contenido para 21+ plataformas?',
      answer: 'Sí, CampAIgner genera contenido optimizado para Instagram, Facebook, TikTok, LinkedIn, YouTube, Twitter/X, email marketing, WhatsApp Business, y 13+ plataformas adicionales. Cada pieza de contenido está dimensionada y adaptada a los requisitos específicos de cada plataforma.'
    },
    {
      question: '¿Cuánto tiempo toma generar una campaña completa?',
      answer: 'Con CampAIgner, una campaña completa se genera en menos de 30 segundos. Solo necesitas describir tu objetivo de campaña y la IA produce todo el contenido necesario, incluyendo copy, hashtags, y variaciones para diferentes plataformas.'
    },
    // #2 Brand Studio Questions
    {
      question: '¿Qué incluye Brand Studio?',
      answer: 'Brand Studio es nuestro conjunto de herramientas de diseño profesional nativas que te permite crear contenido visual impactante sin depender de terceros. Incluye editor de diseño nativo, plantillas profesionales y branding consistente automático.'
    },
    {
      question: '¿Necesito experiencia en diseño para usar Brand Studio?',
      answer: 'No, Brand Studio está diseñado para cualquier persona. Las plantillas profesionales y el branding automático hacen que crear contenido visual sea tan fácil como arrastrar y soltar. La IA se encarga de mantener la consistencia de tu marca en todos los diseños.'
    },
    // General Platform Questions
    {
      question: '¿Es difícil configurar LeadBoost?',
      answer: 'Para nada. La configuración toma solo 4 minutos. Nuestro proceso de configuración guiado te lleva paso a paso para que tengas toda la plataforma funcionando en minutos. Solo necesitas conectar tus cuentas y estás listo.'
    },
    {
      question: '¿Qué tipo de reportes y analíticas incluye?',
      answer: 'Obtienes dashboards detallados con métricas de conversión por campaña, ROI por plataforma, engagement rates, alcance total, y análisis de rendimiento en tiempo real. Todo diseñado para optimizar tus campañas continuamente.'
    },
    // #3 Communication Features (Lower priority)
    {
      question: '¿Cómo funciona la gestión de mensajes unificada?',
      answer: 'El Unified Inbox centraliza todos los mensajes de tus plataformas sociales en un solo lugar. Incluye respuestas inteligentes automáticas, análisis de sentimientos, y gestión multicanal para mantener conversaciones organizadas y eficientes.'
    }
  ] : [
    // #1 CampAIgner Questions
    {
      question: 'What is CampAIgner and how does it work?',
      answer: 'CampAIgner is our AI campaign generator that transforms your brand into ready-to-go content for 21+ platforms in just one click. Simply describe your campaign and the AI automatically generates posts, stories, emails, and content sized specifically for each social network.'
    },
    {
      question: 'Does CampAIgner really create content for 21+ platforms?',
      answer: 'Yes, CampAIgner generates optimized content for Instagram, Facebook, TikTok, LinkedIn, YouTube, Twitter/X, email marketing, WhatsApp Business, and 13+ additional platforms. Each piece of content is sized and adapted to the specific requirements of each platform.'
    },
    {
      question: 'How long does it take to generate a complete campaign?',
      answer: 'With CampAIgner, a complete campaign is generated in under 30 seconds. You just need to describe your campaign goal and the AI produces all necessary content, including copy, hashtags, and variations for different platforms.'
    },
    // #2 Brand Studio Questions
    {
      question: 'What does Brand Studio include?',
      answer: 'Brand Studio is our suite of native professional design tools that lets you create impactful visual content without relying on third parties. It includes a native design editor, professional templates, and automatic consistent branding.'
    },
    {
      question: 'Do I need design experience to use Brand Studio?',
      answer: 'No, Brand Studio is designed for anyone. The professional templates and automatic branding make creating visual content as easy as drag and drop. The AI handles maintaining your brand consistency across all designs.'
    },
    // General Platform Questions
    {
      question: 'Is LeadBoost difficult to set up?',
      answer: 'Not at all. Setup takes just 4 minutes. Our guided setup process takes you step by step to have the entire platform running in minutes. You just need to connect your accounts and you\'re ready to go.'
    },
    {
      question: 'What kind of reports and analytics are included?',
      answer: 'You get detailed dashboards with campaign conversion metrics, ROI by platform, engagement rates, total reach, and real-time performance analysis. Everything designed to continuously optimize your campaigns.'
    },
    // #3 Communication Features (Lower priority)
    {
      question: 'How does the unified message management work?',
      answer: 'The Unified Inbox centralizes all messages from your social platforms in one place. It includes smart automatic responses, sentiment analysis, and multi-channel management to keep conversations organized and efficient.'
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

        <div className="text-center mt-16">
          <h4 className="text-xl font-medium text-gray-900 mb-8">
            {isSpanish ? '¿Tienes más preguntas?' : 'Have more questions?'}
          </h4>
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group">
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors duration-200 mb-3">
                  <div className="w-10 h-10 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-lg">
                    📧
                  </div>
                </div>
                <h5 className="text-sm font-medium text-gray-900 mb-1">
                  {isSpanish ? 'Email' : 'Email'}
                </h5>
                <p className="text-sm text-gray-500">support@leadboost.com</p>
              </div>
              
              <div className="group">
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors duration-200 mb-3">
                  <div className="w-10 h-10 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-lg">
                    💬
                  </div>
                </div>
                <h5 className="text-sm font-medium text-gray-900 mb-1">
                  {isSpanish ? 'Chat en Vivo' : 'Live Chat'}
                </h5>
                <p className="text-sm text-gray-500">
                  {isSpanish ? 'Disponible 24/7' : 'Available 24/7'}
                </p>
              </div>
              
              <div className="group">
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors duration-200 mb-3">
                  <div className="w-10 h-10 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-lg">
                    📞
                  </div>
                </div>
                <h5 className="text-sm font-medium text-gray-900 mb-1">
                  {isSpanish ? 'Teléfono' : 'Phone'}
                </h5>
                <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}