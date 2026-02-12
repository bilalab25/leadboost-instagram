import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Sparkles,
  Rocket,
  Crown,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  Globe,
  Package,
  Flame,
  Brain,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion, AnimatePresence } from "framer-motion";

export default function Pricing() {
  const { language, toggleLanguage } = useLanguage();
  const isSpanish = language === "es";
  const [expandedAddon, setExpandedAddon] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const isAnnual = billingPeriod === "annual";

  const plans = [
    {
      key: "free",
      name: "FREE",
      monthlyPrice: 0,
      annualPrice: 0,
      tagline: isSpanish ? "Experimenta el Marketing en Autopilot." : "Experience Autopilot Marketing.",
      icon: Sparkles,
      gradient: "from-slate-500 to-slate-600",
      highlight: false,
      cta: isSpanish ? "Comenzar Gratis" : "Get Started Free",
      features: isSpanish
        ? [
            "5 Posts/Stories (Instagram, Facebook, Twitter)",
            "Auto-programación y publicación",
          ]
        : [
            "5 Posts/Stories (Instagram, Facebook, Twitter)",
            "Auto-scheduling & posting",
          ],
      footer: isSpanish
        ? "Perfecto para probar el contenido automatizado de LeadBoost."
        : "Perfect to test automated content powered by LeadBoost.",
    },
    {
      key: "growth",
      name: "GROWTH",
      monthlyPrice: 29,
      annualPrice: 278,
      tagline: isSpanish ? "Marketing en Autopilot para marcas en crecimiento." : "Autopilot Marketing for growing brands.",
      icon: Rocket,
      gradient: "from-blue-500 to-blue-700",
      highlight: true,
      cta: isSpanish ? "Elegir Growth" : "Choose Growth",
      features: isSpanish
        ? [
            "30 Posts/Stories (Instagram, Facebook, Twitter)",
            "8 Videos TikTok/Reels",
            "4 Campañas de Email",
            "Auto-programación y publicación",
            "Dashboard de analíticas básicas",
          ]
        : [
            "30 Posts/Stories (Instagram, Facebook, Twitter)",
            "8 TikTok/Reels videos",
            "4 Email campaigns",
            "Auto-scheduling & posting",
            "Basic analytics dashboard",
          ],
      footer: isSpanish
        ? "Contenido constante. Ejecución automatizada. Crecimiento estable."
        : "Consistent content. Automated execution. Steady growth.",
    },
    {
      key: "pro",
      name: "PRO",
      monthlyPrice: 79,
      annualPrice: 758,
      tagline: isSpanish ? "Sistema completo de Marketing en Autopilot." : "Full Autopilot Marketing System.",
      icon: Crown,
      gradient: "from-purple-500 to-indigo-600",
      highlight: false,
      cta: isSpanish ? "Ir a Pro" : "Go Pro",
      features: isSpanish
        ? [
            "90 Posts/Stories (Instagram, Facebook, Twitter)",
            "16 Videos TikTok/Reels",
            "20 Campañas de Email",
            "Auto-programación y publicación",
            "Analíticas avanzadas",
            "Estrategia de crecimiento IA avanzada",
          ]
        : [
            "90 Posts/Stories (Instagram, Facebook, Twitter)",
            "16 TikTok/Reels videos",
            "20 Email campaigns",
            "Auto-scheduling & posting",
            "Advanced analytics",
            "Advanced AI Growth Strategy",
          ],
      footer: isSpanish
        ? "Para marcas que quieren marketing escalable y orientado a resultados en autopilot."
        : "Built for brands that want scalable, performance-driven marketing on autopilot.",
    },
  ];

  const addons = [
    {
      key: "content-boost",
      name: isSpanish ? "Content Boost Pack" : "Content Boost Pack",
      price: 19,
      icon: Package,
      emoji: "🚀",
      gradient: "from-teal-500 to-cyan-600",
      shortDesc: isSpanish
        ? "Aumenta tu producción de Marketing en Autopilot."
        : "Increase your Autopilot Marketing output.",
      features: isSpanish
        ? [
            "+30 Posts/Stories adicionales",
            "+6 Videos TikTok/Reels adicionales",
            "+10 Campañas de Email adicionales",
            "Cola de generación prioritaria",
          ]
        : [
            "+30 additional Posts/Stories",
            "+6 additional TikTok/Reels videos",
            "+10 additional Email campaigns",
            "Priority content generation queue",
          ],
      footer: isSpanish
        ? "Para marcas que necesitan más frecuencia de publicación sin agregar carga de trabajo."
        : "For brands that need more publishing frequency without adding workload.",
    },
    {
      key: "scale-pack",
      name: isSpanish ? "Scale Pack" : "Scale Pack",
      price: 39,
      icon: Flame,
      emoji: "🔥",
      gradient: "from-orange-500 to-red-600",
      shortDesc: isSpanish
        ? "Expansión agresiva de Marketing en Autopilot."
        : "Aggressive Autopilot Marketing expansion.",
      features: isSpanish
        ? [
            "+80 Posts/Stories adicionales",
            "+15 Videos TikTok/Reels adicionales",
            "Campañas de Email ilimitadas",
            "Procesamiento IA prioritario",
            "Programación multi-campaña",
          ]
        : [
            "+80 additional Posts/Stories",
            "+15 additional TikTok/Reels videos",
            "Unlimited Email campaigns",
            "AI priority processing",
            "Multi-campaign scheduling mode",
          ],
      footer: isSpanish
        ? "Para marcas de alto crecimiento escalando en múltiples campañas."
        : "For high-growth brands scaling across multiple campaigns.",
    },
    {
      key: "ai-growth",
      name: isSpanish ? "AI Growth Engine" : "AI Growth Engine",
      price: 29,
      icon: Brain,
      emoji: "🧠",
      gradient: "from-violet-500 to-purple-600",
      shortDesc: isSpanish
        ? "Inteligencia predictiva de Marketing en Autopilot."
        : "Predictive Autopilot Marketing Intelligence.",
      features: isSpanish
        ? [
            "Benchmarking de contenido competidor",
            "Reportes semanales de oportunidades de crecimiento",
            "Ajustes de horario de publicación optimizados por IA",
            "Detección de tendencias y temas virales",
            "Recomendaciones automáticas de mejora de rendimiento",
          ]
        : [
            "Competitor content benchmarking",
            "Weekly growth opportunity reports",
            "AI-optimized posting time adjustments",
            "Trend detection & viral topic identification",
            "Automated performance improvement recommendations",
          ],
      footer: isSpanish
        ? "Para marcas enfocadas en crecimiento medible y basado en datos."
        : "For brands focused on measurable, data-driven growth.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-200/30 via-blue-100/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-purple-200/20 to-transparent rounded-full blur-3xl"></div>

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #1e3a5f 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      ></div>

      <header className="relative z-10 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LeadBoost
            </a>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-600 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {isSpanish ? "EN" : "ES"}
            </button>
          </div>
        </div>
      </header>

      <div className="relative pt-16 sm:pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full px-4 py-2 mb-6 shadow-sm">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-gray-700 font-medium">
              {isSpanish ? "Marketing en Autopilot" : "Autopilot Marketing"}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              {isSpanish ? "Precios" : "Pricing"}
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            {isSpanish
              ? "Precios simples y transparentes. Escala tu marketing sin esfuerzo."
              : "Simple, transparent pricing. Scale your marketing effortlessly."}
          </p>

          <div className="inline-flex items-center bg-white rounded-2xl p-1.5 border border-gray-200 shadow-lg mb-16">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                billingPeriod === "monthly"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {isSpanish ? "Mensual" : "Monthly"}
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                billingPeriod === "annual"
                  ? "bg-blue-600 text-white shadow-md"
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
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const isHighlighted = plan.highlight;

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative group ${isHighlighted ? "lg:-mt-4 lg:mb-4" : ""}`}
              >
                {isHighlighted && (
                  <div className="absolute -inset-[2px] bg-gradient-to-b from-blue-400 via-blue-500 to-purple-500 rounded-3xl opacity-100 shadow-xl shadow-blue-500/20"></div>
                )}

                <div
                  className={`relative h-full bg-white rounded-3xl border ${isHighlighted ? "border-transparent" : "border-gray-200 hover:border-blue-300"} overflow-hidden transition-all duration-500 hover:shadow-xl ${!isHighlighted ? "shadow-lg" : ""}`}
                >
                  {isHighlighted && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500"></div>
                  )}

                  <div className="p-8">
                    {isHighlighted && (
                      <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full px-4 py-1.5 shadow-sm">
                          <Zap className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                            {isSpanish ? "Más Popular" : "Most Popular"}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${plan.gradient} shadow-lg`}
                      >
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {plan.name}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-500 mb-6">{plan.tagline}</p>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-1">
                        {plan.monthlyPrice === 0 ? (
                          <span className="text-5xl lg:text-6xl font-black text-gray-900">
                            {isSpanish ? "Gratis" : "Free"}
                          </span>
                        ) : isAnnual ? (
                          <>
                            <span className="text-5xl lg:text-6xl font-black text-gray-900">
                              ${plan.annualPrice}
                            </span>
                            <span className="text-gray-500 ml-1">
                              / {isSpanish ? "año" : "year"}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-5xl lg:text-6xl font-black text-gray-900">
                              ${plan.monthlyPrice}
                            </span>
                            <span className="text-gray-500 ml-1">
                              / {isSpanish ? "mes" : "month"}
                            </span>
                          </>
                        )}
                      </div>
                      {isAnnual && plan.annualPrice > 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          ${(plan.annualPrice / 12).toFixed(0)}/{isSpanish ? "mes" : "mo"}{" "}
                          <span className="text-emerald-600 font-semibold">
                            ({isSpanish ? "ahorras" : "save"} ${plan.monthlyPrice * 12 - plan.annualPrice}/{isSpanish ? "año" : "yr"})
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        {isSpanish ? "Incluye:" : "Includes:"}
                      </p>
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-emerald-600" />
                            </div>
                            <span className="text-gray-600 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-xs text-gray-400 mb-6 leading-relaxed italic">
                      {plan.footer}
                    </p>

                    <Button
                      className={`w-full font-semibold py-6 rounded-xl transition-all duration-300 group/btn ${
                        isHighlighted
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                          : "bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg"
                      }`}
                      data-testid={`button-${plan.key}-plan`}
                    >
                      <span>{plan.cta}</span>
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
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-semibold text-purple-700">
                {isSpanish ? "Solo para miembros PRO" : "Available for PRO Members Only"}
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {isSpanish ? "Capas de Expansión" : "Expansion Layers"}
              </span>
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              {isSpanish
                ? "Desbloquea capacidad adicional de Marketing en Autopilot."
                : "Unlock additional Autopilot Marketing capacity."}
            </p>
          </div>

          <div className="space-y-4">
            {addons.map((addon, index) => {
              const isExpanded = expandedAddon === addon.key;
              const AddonIcon = addon.icon;

              return (
                <motion.div
                  key={addon.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                >
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <button
                      onClick={() => setExpandedAddon(isExpanded ? null : addon.key)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${addon.gradient} shadow-md`}>
                          <AddonIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{addon.emoji}</span>
                            <h3 className="text-lg font-bold text-gray-900">{addon.name}</h3>
                          </div>
                          <p className="text-sm text-gray-500">{addon.shortDesc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-2xl font-black text-gray-900">${addon.price}</span>
                          <span className="text-gray-500 text-sm">/{isSpanish ? "mes" : "mo"}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-0 border-t border-gray-100">
                            <ul className="space-y-3 mt-4 mb-4">
                              {addon.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-3">
                                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  </div>
                                  <span className="text-gray-600 text-sm">{feature}</span>
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-gray-400 italic mb-4">{addon.footer}</p>
                            <Button
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-md"
                              data-testid={`button-addon-${addon.key}`}
                            >
                              {isSpanish ? "Agregar a mi plan" : "Add to my plan"}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-24 text-center"
        >
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/40 via-purple-200/40 to-blue-200/40 rounded-3xl blur-2xl"></div>
            <div className="relative bg-white rounded-3xl border border-gray-100 shadow-2xl p-12 lg:p-16">
              <h3 className="text-3xl lg:text-5xl font-black text-gray-900 mb-6">
                {isSpanish ? "¿Listo para" : "Ready to"}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                  {isSpanish ? "Automatizar?" : "Automate?"}
                </span>
              </h3>
              <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
                {isSpanish
                  ? "Únete a marcas que usan LeadBoost para poner su marketing en autopilot."
                  : "Join brands using LeadBoost to put their marketing on autopilot."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-10 py-6 rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all group"
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
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-24"
        >
          <h2 className="text-3xl lg:text-4xl font-black text-center text-gray-900 mb-12">
            {isSpanish ? "Preguntas Frecuentes" : "Frequently Asked Questions"}
          </h2>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: isSpanish
                  ? "¿Qué incluye el plan FREE?"
                  : "What does the FREE plan include?",
                a: isSpanish
                  ? "El plan gratuito incluye 5 posts/stories en Instagram, Facebook y Twitter con auto-programación. Perfecto para probar la plataforma."
                  : "The free plan includes 5 posts/stories on Instagram, Facebook, and Twitter with auto-scheduling. Perfect to test the platform.",
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
                  ? "¿Qué son las Capas de Expansión?"
                  : "What are Expansion Layers?",
                a: isSpanish
                  ? "Son add-ons exclusivos para miembros PRO que permiten escalar tu capacidad de marketing: más contenido, más videos o inteligencia de crecimiento con IA."
                  : "They are exclusive add-ons for PRO members that let you scale your marketing capacity: more content, more videos, or AI-powered growth intelligence.",
              },
              {
                q: isSpanish
                  ? "¿Puedo usar varias Capas de Expansión al mismo tiempo?"
                  : "Can I use multiple Expansion Layers at once?",
                a: isSpanish
                  ? "¡Absolutamente! Puedes combinar Content Boost, Scale Pack y AI Growth Engine según las necesidades de tu marca."
                  : "Absolutely! You can combine Content Boost, Scale Pack, and AI Growth Engine based on your brand's needs.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
