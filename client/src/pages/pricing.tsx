import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Sparkles,
  Rocket,
  Crown,
  Image,
  Video,
  Zap,
  ArrowRight,
  Star,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion } from "framer-motion";

const pricingData = {
  monthly: {
    free: {
      name: "FREE",
      price: 0,
      period: "month",
      images: 10,
      videos: 4,
      imageOverage: 0.6,
      videoOverage: 2.0,
      discount: 0,
      cta: "Get Started Free",
      ctaEs: "Comenzar Gratis",
      icon: Sparkles,
      highlight: false,
      gradient: "from-slate-500 to-slate-600",
    },
    core: {
      name: "CORE",
      price: 49.99,
      period: "month",
      images: 200,
      videos: 40,
      imageOverage: 0.48,
      videoOverage: 1.6,
      discount: 20,
      cta: "Upgrade to Core",
      ctaEs: "Actualizar a Core",
      icon: Rocket,
      highlight: true,
      gradient: "from-brand-500 to-brand-700",
    },
    premium: {
      name: "PREMIUM",
      price: 99.99,
      period: "month",
      images: 500,
      videos: 100,
      imageOverage: 0.42,
      videoOverage: 1.4,
      discount: 30,
      cta: "Go Premium",
      ctaEs: "Ir Premium",
      icon: Crown,
      highlight: false,
      gradient: "from-purple-500 to-indigo-600",
    },
  },
  annual: {
    free: {
      name: "FREE",
      price: 0,
      period: "year",
      images: 10,
      videos: 4,
      imageOverage: 0.6,
      videoOverage: 2.0,
      discount: 0,
      cta: "Get Started Free",
      ctaEs: "Comenzar Gratis",
      icon: Sparkles,
      highlight: false,
      gradient: "from-slate-500 to-slate-600",
    },
    core: {
      name: "CORE",
      price: 479.88,
      period: "year",
      images: 200,
      videos: 40,
      imageOverage: 0.48,
      videoOverage: 1.6,
      discount: 20,
      cta: "Upgrade to Core",
      ctaEs: "Actualizar a Core",
      icon: Rocket,
      highlight: true,
      gradient: "from-brand-500 to-brand-700",
    },
    premium: {
      name: "PREMIUM",
      price: 959.88,
      period: "year",
      images: 500,
      videos: 100,
      imageOverage: 0.42,
      videoOverage: 1.4,
      discount: 30,
      cta: "Go Premium",
      ctaEs: "Ir Premium",
      icon: Crown,
      highlight: false,
      gradient: "from-purple-500 to-indigo-600",
    },
  },
  payAsYouGo: {
    imagePrice: 0.6,
    videoPrice: 2.0,
  },
};

export default function Pricing() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly",
  );

  const plans =
    billingPeriod === "monthly" ? pricingData.monthly : pricingData.annual;
  const isAnnual = billingPeriod === "annual";

  const getPeriodLabel = () => {
    if (isAnnual) return isSpanish ? "/ año" : "/ year";
    return isSpanish ? "/ mes" : "/ month";
  };

  const getMonthlyEquivalent = (yearlyPrice: number) => {
    return (yearlyPrice / 12).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-brand-200/30 via-brand-100/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-brand-200/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-purple-200/20 to-transparent rounded-full blur-3xl"></div>

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #1e3a5f 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      ></div>

      <div className="relative pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          {/*     <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-brand-200 rounded-full px-4 py-2 mb-6 shadow-sm">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm text-gray-700 font-medium">
              {isSpanish
                ? "Más de 10,000 creadores confían en nosotros"
                : "Trusted by 10,000+ creators"}
            </span>
          </div> */}

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 mb-4 leading-tight tracking-tight font-bold">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              {isSpanish ? "Precios" : "Pricing"}
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            {isSpanish
              ? "Precios simples y transparentes para generación de imágenes y videos con IA."
              : "Simple, transparent pricing for AI image and video generation."}
          </p>

          <div className="inline-flex items-center bg-white rounded-2xl p-1.5 border border-gray-200 shadow-lg mb-16">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                billingPeriod === "monthly"
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {isSpanish ? "Mensual" : "Monthly"}
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                billingPeriod === "annual"
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {isSpanish ? "Anual" : "Annual"}
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm">
                -20%
              </span>
            </button>
          </div>
        </motion.div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-5">
          {Object.entries(plans).map(([key, plan], index) => {
            const IconComponent = plan.icon;
            const isHighlighted = plan.highlight;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative group ${isHighlighted ? "lg:-mt-4 lg:mb-4" : ""}`}
              >
                {isHighlighted && (
                  <div className="absolute -inset-[2px] bg-gradient-to-b from-brand-400 via-brand-500 to-purple-500 rounded-3xl opacity-100 shadow-xl shadow-brand-500/20"></div>
                )}

                <div
                  className={`relative h-full bg-white rounded-3xl border ${isHighlighted ? "border-transparent" : "border-gray-200 hover:border-brand-300"} overflow-hidden transition-all duration-500 hover:shadow-xl ${!isHighlighted ? "shadow-lg" : ""}`}
                >
                  {isHighlighted && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-purple-500"></div>
                  )}

                  <div className="p-8">
                    {isHighlighted && (
                      <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-full px-4 py-1.5 shadow-sm">
                          <Zap className="h-3.5 w-3.5 text-brand-600" />
                          <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                            {isSpanish ? "Más Popular" : "Most Popular"}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${plan.gradient} shadow-lg`}
                      >
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {plan.name}
                        </h3>
                        {plan.discount > 0 && (
                          <span className="text-xs font-semibold text-emerald-600">
                            {plan.discount}%{" "}
                            {isSpanish ? "ahorro en excesos" : "off overages"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl lg:text-6xl font-black text-gray-900 font-bold">
                          {plan.price === 0
                            ? isSpanish
                              ? "Gratis"
                              : "Free"
                            : `$${Math.floor(plan.price)}`}
                        </span>
                        {plan.price > 0 && (
                          <>
                            <span className="text-2xl font-bold text-gray-400">
                              .{(plan.price % 1).toFixed(2).slice(2)}
                            </span>
                            <span className="text-gray-500 ml-1">
                              {getPeriodLabel()}
                            </span>
                          </>
                        )}
                      </div>
                      {isAnnual && plan.price > 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          ${getMonthlyEquivalent(plan.price)}
                          {isSpanish ? "/mes" : "/mo"}{" "}
                          <span className="text-gray-400">
                            {isSpanish
                              ? "facturado anualmente"
                              : "billed annually"}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center shadow-sm">
                              <Image className="h-5 w-5 text-pink-600" />
                            </div>
                            <div>
                              <span className="text-gray-900 font-semibold">
                                {plan.images}
                              </span>
                              <span className="text-gray-500 text-sm ml-1">
                                {isSpanish ? "imágenes" : "images"}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                            +${plan.imageOverage.toFixed(2)}/
                            {isSpanish ? "extra" : "extra"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shadow-sm">
                              <Video className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                              <span className="text-gray-900 font-semibold">
                                {plan.videos}
                              </span>
                              <span className="text-gray-500 text-sm ml-1">
                                {isSpanish ? "videos" : "videos"}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                            +${plan.videoOverage.toFixed(2)}/
                            {isSpanish ? "extra" : "extra"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {[
                        isSpanish
                          ? "API de generación IA"
                          : "AI generation API",
                        isSpanish ? "Múltiples estilos" : "Multiple styles",
                        isSpanish
                          ? "Alta resolución"
                          : "High-resolution output",
                        ...(plan.discount > 0
                          ? [
                              isSpanish
                                ? `${plan.discount}% descuento en excesos`
                                : `${plan.discount}% off overage rates`,
                            ]
                          : []),
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-emerald-600" />
                          </div>
                          <span className="text-gray-600 text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full font-semibold py-6 rounded-xl transition-all duration-300 group/btn ${
                        isHighlighted
                          ? "bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40"
                          : "bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg"
                      }`}
                      data-testid={`button-${key}-plan`}
                    >
                      <span>{isSpanish ? plan.ctaEs : plan.cta}</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-24 max-w-4xl mx-auto"
        >
          <div className="relative">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400 via-purple-400 to-brand-400 rounded-3xl blur-sm opacity-50"></div>
            <div className="relative bg-white rounded-3xl border border-gray-100 shadow-xl p-10">
              <div className="text-center mb-10">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                  {isSpanish ? "Pago por Uso" : "Pay-As-You-Go"}
                </h2>
                <p className="text-gray-600">
                  {isSpanish
                    ? "Sin compromisos. Paga solo por lo que usas."
                    : "No commitments. Pay only for what you use."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-gray-50 to-pink-50/30 rounded-2xl p-6 border border-gray-100 text-center group hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md">
                    <Image className="h-8 w-8 text-pink-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isSpanish ? "Imágenes" : "Images"}
                  </h3>
                  <div className="text-4xl font-black text-gray-900 font-bold">
                    ${pricingData.payAsYouGo.imagePrice.toFixed(2)}
                    <span className="text-lg font-medium text-gray-500 ml-1">
                      {isSpanish ? "c/u" : "each"}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-violet-50/30 rounded-2xl p-6 border border-gray-100 text-center group hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md">
                    <Video className="h-8 w-8 text-violet-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isSpanish ? "Videos" : "Videos"}
                  </h3>
                  <div className="text-4xl font-black text-gray-900">
                    ${pricingData.payAsYouGo.videoPrice.toFixed(2)}
                    <span className="text-lg font-medium text-gray-500 ml-1">
                      {isSpanish ? "c/u" : "each"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-brand-50 to-purple-50 rounded-xl p-4 text-center border border-brand-100">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-brand-700">
                    {isSpanish ? "Nota:" : "Note:"}
                  </span>{" "}
                  {isSpanish
                    ? "Los suscriptores reciben precios de exceso con descuento según el plan."
                    : "Subscribers receive discounted overage pricing based on plan."}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-24 text-center"
        >
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-200/40 via-purple-200/40 to-brand-200/40 rounded-3xl blur-2xl"></div>
            <div className="relative bg-white rounded-3xl border border-gray-100 shadow-2xl p-12 lg:p-16">
              <h3 className="text-3xl lg:text-5xl font-black text-gray-900 mb-6 font-bold">
                {isSpanish ? "¿Listo para" : "Ready to"}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-500">
                  {isSpanish ? "Comenzar?" : "Get Started?"}
                </span>
              </h3>
              <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
                {isSpanish
                  ? "Únete a miles de creadores que usan LeadBoost para generar contenido visual impresionante."
                  : "Join thousands of creators using LeadBoost to generate stunning visual content."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white px-10 py-6 rounded-xl font-semibold text-lg shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all group"
                  data-testid="button-start-free"
                >
                  {isSpanish ? "Comenzar Gratis" : "Start Free"}
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-10 py-6 rounded-xl font-semibold text-lg transition-all"
                  data-testid="button-contact-sales"
                >
                  {isSpanish ? "Contactar Ventas" : "Contact Sales"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-24"
        >
          <h2 className="text-3xl lg:text-4xl font-black text-center text-gray-900 mb-12 font-bold">
            {isSpanish ? "Preguntas Frecuentes" : "Frequently Asked Questions"}
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: isSpanish
                  ? "¿Qué pasa si excedo mi límite mensual?"
                  : "What happens if I exceed my monthly limit?",
                a: isSpanish
                  ? "Se te cobrará según los precios de exceso de tu plan. Los suscriptores de CORE obtienen un 20% de descuento y los de PREMIUM obtienen un 30% de descuento."
                  : "You'll be charged at your plan's overage rates. CORE subscribers get 20% off and PREMIUM subscribers get 30% off pay-as-you-go rates.",
              },
              {
                q: isSpanish
                  ? "¿Puedo cambiar de plan en cualquier momento?"
                  : "Can I change plans at any time?",
                a: isSpanish
                  ? "¡Sí! Puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplican al comienzo del siguiente ciclo de facturación."
                  : "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
              },
              {
                q: isSpanish
                  ? "¿Los créditos no utilizados se acumulan?"
                  : "Do unused credits roll over?",
                a: isSpanish
                  ? "Los créditos incluidos en tu plan no se acumulan de un mes a otro. Se reinician cada mes con tu ciclo de facturación."
                  : "Credits included in your plan do not roll over month to month. They reset each month with your billing cycle.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
