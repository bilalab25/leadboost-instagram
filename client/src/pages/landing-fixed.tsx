import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star, Shield, Play, ArrowRight } from 'lucide-react';

export default function LandingFixed() {
  const [isSpanish, setIsSpanish] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Apple/Squarespace Inspired Hero */}
      <div className="relative min-h-screen bg-white overflow-hidden">
        {/* Subtle Apple-style background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/30 via-white to-white" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-500/3 rounded-full blur-2xl" />
        </div>
        
        {/* Squarespace-style centered layout */}
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 text-center">
            
            {/* Apple-style minimalist trust indicator */}
            <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 rounded-full bg-gray-100/50 border border-gray-200/30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-gray-600">
                {isSpanish ? 'Confiado por 25,000+ empresas' : 'Trusted by 25,000+ businesses'}
              </span>
              <div className="flex items-center gap-0.5 ml-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
            
            {/* Apple-style typography */}
            <h1 className="text-6xl lg:text-7xl font-light text-gray-900 leading-[0.95] tracking-tight mb-8">
              {isSpanish ? (
                <>
                  <span className="font-medium text-blue-600">Haz Crecer tu Negocio</span>
                  <br />
                  <span className="text-gray-800">En Piloto Automático</span>
                </>
              ) : (
                <>
                  <span className="font-medium text-blue-600">Grow Your Business</span>
                  <br />
                  <span className="text-gray-800">On Autopilot</span>
                </>
              )}
            </h1>
            
            {/* Squarespace-style subtitle */}
            <p className="text-2xl font-light text-gray-500 leading-relaxed mb-12 max-w-2xl mx-auto">
              {isSpanish 
                ? 'Plataforma todo-en-uno impulsada por IA que automatiza marketing, ventas y gestión de clientes desde un solo lugar.' 
                : 'AI-powered all-in-one platform that automates marketing, sales, and customer management from one central hub.'
              }
            </p>
            
            {/* Elegant feature presentation */}
            <div className="flex flex-wrap justify-center gap-8 mb-16 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-gray-700 font-medium text-lg max-w-48">
                  {isSpanish ? 'IA crea contenido para 21+ plataformas' : 'AI creates content for 21+ platforms'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-gray-700 font-medium text-lg max-w-48">
                  {isSpanish ? 'Chatbot responde clientes 24/7' : 'Chatbot handles customers 24/7'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-gray-700 font-medium text-lg max-w-48">
                  {isSpanish ? 'Configuración en menos de 10 minutos' : 'Setup in under 10 minutes'}
                </span>
              </div>
            </div>
            
            {/* Apple-style button system */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-10 py-4 text-lg rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                data-testid="button-start-demo"
              >
                {isSpanish ? 'Ver Demo en Vivo' : 'Watch Live Demo'}
              </Button>
              <Button 
                variant="ghost"
                className="text-blue-600 hover:text-blue-700 font-medium px-8 py-4 text-lg rounded-full transition-all duration-200 hover:bg-blue-50"
                data-testid="button-see-pricing"
              >
                {isSpanish ? 'Ver precios simples' : 'View simple pricing'}
              </Button>
            </div>
            
            {/* Squarespace-style trust proof */}
            <div className="border-t border-gray-100 pt-8">
              <div className="flex justify-center items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>{isSpanish ? 'Verificado' : 'Verified'}</span>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">25K+</div>
                  <div>{isSpanish ? 'Empresas' : 'Businesses'}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">89%</div>
                  <div>{isSpanish ? 'Más leads' : 'More leads'}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">4.8★</div>
                  <div>{isSpanish ? '2,847 reseñas' : '2,847 reviews'}</div>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">
                {isSpanish ? '✓ Sin compromiso • ✓ Cancelación gratuita • ✓ Soporte incluido' : '✓ No commitment • ✓ Free cancellation • ✓ Support included'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}