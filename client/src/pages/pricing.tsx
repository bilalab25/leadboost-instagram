import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles, Rocket, Crown, Image, Video, Zap } from "lucide-react";
import { useLanguage } from '@/hooks/useLanguage';

const pricingData = {
  monthly: {
    free: {
      name: "FREE",
      price: 0,
      period: "month",
      images: 10,
      videos: 4,
      imageOverage: 0.60,
      videoOverage: 2.00,
      discount: 0,
      cta: "Get Started Free",
      ctaEs: "Comenzar Gratis",
      icon: Sparkles,
      highlight: false,
    },
    core: {
      name: "CORE",
      price: 49.99,
      period: "month",
      images: 200,
      videos: 40,
      imageOverage: 0.48,
      videoOverage: 1.60,
      discount: 20,
      cta: "Upgrade to Core",
      ctaEs: "Actualizar a Core",
      icon: Rocket,
      highlight: true,
    },
    premium: {
      name: "PREMIUM",
      price: 99.99,
      period: "month",
      images: 500,
      videos: 100,
      imageOverage: 0.42,
      videoOverage: 1.40,
      discount: 30,
      cta: "Go Premium",
      ctaEs: "Ir Premium",
      icon: Crown,
      highlight: false,
    },
  },
  annual: {
    free: {
      name: "FREE",
      price: 0,
      period: "year",
      images: 10,
      videos: 4,
      imageOverage: 0.60,
      videoOverage: 2.00,
      discount: 0,
      cta: "Get Started Free",
      ctaEs: "Comenzar Gratis",
      icon: Sparkles,
      highlight: false,
    },
    core: {
      name: "CORE",
      price: 479.88,
      period: "year",
      images: 200,
      videos: 40,
      imageOverage: 0.48,
      videoOverage: 1.60,
      discount: 20,
      cta: "Upgrade to Core",
      ctaEs: "Actualizar a Core",
      icon: Rocket,
      highlight: true,
    },
    premium: {
      name: "PREMIUM",
      price: 959.88,
      period: "year",
      images: 500,
      videos: 100,
      imageOverage: 0.42,
      videoOverage: 1.40,
      discount: 30,
      cta: "Go Premium",
      ctaEs: "Ir Premium",
      icon: Crown,
      highlight: false,
    },
  },
  payAsYouGo: {
    imagePrice: 0.60,
    videoPrice: 2.00,
  },
};

export default function Pricing() {
  const { language } = useLanguage();
  const isSpanish = language === 'es';
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  
  const plans = billingPeriod === 'monthly' ? pricingData.monthly : pricingData.annual;
  const isAnnual = billingPeriod === 'annual';

  const formatPrice = (price: number) => {
    if (price === 0) return isSpanish ? "Gratis" : "Free";
    return `$${price.toFixed(2)}`;
  };

  const getPeriodLabel = () => {
    if (isAnnual) return isSpanish ? "/ año" : "/ year";
    return isSpanish ? "/ mes" : "/ month";
  };

  const getMonthlyEquivalent = (yearlyPrice: number) => {
    return (yearlyPrice / 12).toFixed(2);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 relative overflow-hidden">
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-brand-300/20 to-brand-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-40 left-10 w-64 h-64 bg-gradient-to-br from-brand-400/15 to-brand-600/10 rounded-full blur-2xl"></div>
      
      <div className="relative pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-4 leading-tight tracking-tight">
            LeadBoost Pricing
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            {isSpanish 
              ? "Precios simples y transparentes para generación de imágenes y videos con IA."
              : "Simple, transparent pricing for AI image and video generation."}
          </p>

          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md border border-gray-200 mb-12">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                billingPeriod === 'monthly'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isSpanish ? "Mensual" : "Monthly"}
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isSpanish ? "Anual" : "Annual"}
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {isSpanish ? "Ahorra 20%" : "Save 20%"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {Object.entries(plans).map(([key, plan]) => {
            const IconComponent = plan.icon;
            const isHighlighted = plan.highlight;
            
            return (
              <Card 
                key={key}
                className={`relative bg-white rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isHighlighted 
                    ? 'border-2 border-brand-600 shadow-lg ring-4 ring-brand-100' 
                    : 'border border-gray-200 shadow-sm hover:border-brand-300'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-brand-600 to-brand-500 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      {isSpanish ? "Más Popular" : "Most Popular"}
                    </div>
                  </div>
                )}
                
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                      isHighlighted 
                        ? 'bg-brand-600 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      {plan.discount > 0 && (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          {plan.discount}% {isSpanish ? "descuento" : "discount"}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl lg:text-5xl font-black text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-500 ml-2 font-medium">{getPeriodLabel()}</span>
                      )}
                    </div>
                    {isAnnual && plan.price > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        ${getMonthlyEquivalent(plan.price)}{isSpanish ? "/mes facturado anual" : "/mo billed annually"}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      {isSpanish ? "Incluido" : "Included"}
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Image className="h-4 w-4 text-brand-600" />
                          <span className="text-gray-700">{isSpanish ? "Imágenes" : "Images"}</span>
                        </div>
                        <span className="font-bold text-gray-900">{plan.images}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-brand-600" />
                          <span className="text-gray-700">{isSpanish ? "Videos" : "Videos"}</span>
                        </div>
                        <span className="font-bold text-gray-900">{plan.videos}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-50 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      {isSpanish ? "Precio por Exceso" : "Overage Pricing"}
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{isSpanish ? "Imagen" : "Image"}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">${plan.imageOverage.toFixed(2)}</span>
                          <span className="text-gray-500 text-sm">{isSpanish ? "c/u" : "each"}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{isSpanish ? "Video" : "Video"}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">${plan.videoOverage.toFixed(2)}</span>
                          <span className="text-gray-500 text-sm">{isSpanish ? "c/u" : "each"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{isSpanish ? "API de generación de IA" : "AI generation API"}</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{isSpanish ? "Múltiples estilos" : "Multiple styles"}</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{isSpanish ? "Salida de alta resolución" : "High-resolution output"}</span>
                    </li>
                    {plan.discount > 0 && (
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">
                          {plan.discount}% {isSpanish ? "descuento en excesos" : "off overage rates"}
                        </span>
                      </li>
                    )}
                  </ul>
                  
                  <Button 
                    className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 ${
                      isHighlighted
                        ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md hover:shadow-lg'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                    data-testid={`button-${key}-plan`}
                  >
                    {isSpanish ? plan.ctaEs : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-20 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-white to-brand-25 rounded-2xl shadow-lg border border-brand-100">
            <CardContent className="p-8 lg:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  {isSpanish ? "Precios de Pago por Uso" : "Pay-As-You-Go Pricing"}
                </h2>
                <p className="text-gray-600">
                  {isSpanish 
                    ? "Sin compromiso mensual. Paga solo por lo que usas."
                    : "No monthly commitment. Pay only for what you use."}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Image className="h-7 w-7 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{isSpanish ? "Imágenes" : "Images"}</h3>
                  <div className="text-3xl font-black text-gray-900">
                    ${pricingData.payAsYouGo.imagePrice.toFixed(2)}
                    <span className="text-base font-medium text-gray-500 ml-1">{isSpanish ? "c/u" : "each"}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Video className="h-7 w-7 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{isSpanish ? "Videos" : "Videos"}</h3>
                  <div className="text-3xl font-black text-gray-900">
                    ${pricingData.payAsYouGo.videoPrice.toFixed(2)}
                    <span className="text-base font-medium text-gray-500 ml-1">{isSpanish ? "c/u" : "each"}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-brand-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-brand-700">
                    {isSpanish ? "Nota:" : "Note:"}
                  </span>{" "}
                  {isSpanish 
                    ? "Los suscriptores reciben precios de exceso con descuento según el plan."
                    : "Subscribers receive discounted overage pricing based on plan."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-20 text-center">
          <div className="bg-gradient-to-br from-white to-brand-25 rounded-3xl p-10 lg:p-12 max-w-4xl mx-auto shadow-xl border border-brand-100">
            <h3 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-6">
              {isSpanish ? "¿Listo para Comenzar?" : "Ready to Get Started?"}
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              {isSpanish 
                ? "Únete a miles de creadores que usan LeadBoost para generar contenido visual impresionante."
                : "Join thousands of creators using LeadBoost to generate stunning visual content."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-md hover:shadow-lg transition-all"
                data-testid="button-start-free"
              >
                {isSpanish ? "Comenzar Gratis" : "Start Free"}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
                data-testid="button-contact-sales"
              >
                {isSpanish ? "Contactar Ventas" : "Contact Sales"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-3xl lg:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-12">
            {isSpanish ? "Preguntas Frecuentes" : "Frequently Asked Questions"}
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {isSpanish ? "¿Qué pasa si excedo mi límite mensual?" : "What happens if I exceed my monthly limit?"}
              </h3>
              <p className="text-gray-600">
                {isSpanish 
                  ? "Se te cobrará según los precios de exceso de tu plan. Los suscriptores de CORE obtienen un 20% de descuento y los de PREMIUM obtienen un 30% de descuento en las tarifas de pago por uso."
                  : "You'll be charged at your plan's overage rates. CORE subscribers get 20% off and PREMIUM subscribers get 30% off pay-as-you-go rates."}
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {isSpanish ? "¿Puedo cambiar de plan en cualquier momento?" : "Can I change plans at any time?"}
              </h3>
              <p className="text-gray-600">
                {isSpanish 
                  ? "¡Sí! Puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplican al comienzo del siguiente ciclo de facturación."
                  : "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."}
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {isSpanish ? "¿Los créditos no utilizados se acumulan?" : "Do unused credits roll over?"}
              </h3>
              <p className="text-gray-600">
                {isSpanish 
                  ? "Los créditos incluidos en tu plan no se acumulan de un mes a otro. Se reinician cada mes con tu ciclo de facturación."
                  : "Credits included in your plan do not roll over month to month. They reset each month with your billing cycle."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
