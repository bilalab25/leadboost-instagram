import {
  BarChart3,
  Globe,
  Megaphone,
  MousePointerClick,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { SiFacebook, SiGoogle, SiInstagram, SiTiktok } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";

const platforms = [
  {
    icon: SiFacebook,
    name: "Facebook Ads",
    color: "#1877F2",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: SiInstagram,
    name: "Instagram Ads",
    color: "#E1306C",
    bg: "bg-pink-50",
    border: "border-pink-100",
  },
  {
    icon: SiGoogle,
    name: "Google Ads",
    color: "#4285F4",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    icon: SiTiktok,
    name: "TikTok Ads",
    color: "#010101",
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
];

const features = [
  {
    icon: Target,
    color: "text-violet-500",
    bg: "bg-violet-50",
    en: {
      title: "Smart Audience Targeting",
      desc: "AI pinpoints your ideal customer across platforms using your brand data and past performance.",
    },
    es: {
      title: "Segmentación Inteligente",
      desc: "La IA identifica a tu cliente ideal usando datos de tu marca y rendimiento anterior.",
    },
  },
  {
    icon: Sparkles,
    color: "text-blue-500",
    bg: "bg-blue-50",
    en: {
      title: "AI-Generated Ad Creatives",
      desc: "Auto-generate scroll-stopping copy, headlines, and visuals tailored to each platform.",
    },
    es: {
      title: "Creativos Generados por IA",
      desc: "Genera automáticamente textos e imágenes optimizados para cada plataforma.",
    },
  },
  {
    icon: BarChart3,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    en: {
      title: "Unified Performance Dashboard",
      desc: "All your ad metrics in one view — spend, ROAS, clicks, and conversions across every channel.",
    },
    es: {
      title: "Panel de Rendimiento Unificado",
      desc: "Todas tus métricas en un solo lugar — gasto, ROAS, clics y conversiones.",
    },
  },
  {
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50",
    en: {
      title: "Automated Budget Optimization",
      desc: "Real-time budget reallocation shifts spend toward what's converting, automatically.",
    },
    es: {
      title: "Optimización Automática de Presupuesto",
      desc: "Redistribuye el gasto en tiempo real hacia lo que más convierte.",
    },
  },
  {
    icon: MousePointerClick,
    color: "text-rose-500",
    bg: "bg-rose-50",
    en: {
      title: "One-Click Campaign Launch",
      desc: "Set your goal, budget, and audience — Lead Boost does the rest across all platforms at once.",
    },
    es: {
      title: "Lanzamiento con Un Clic",
      desc: "Define tu objetivo, presupuesto y audiencia — Lead Boost hace el resto en todas las plataformas.",
    },
  },
  {
    icon: TrendingUp,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
    en: {
      title: "Predictive Scaling",
      desc: "Get AI-powered spend recommendations before you hit your limits to maximize every dollar.",
    },
    es: {
      title: "Escalado Predictivo",
      desc: "Recibe recomendaciones de gasto basadas en IA para maximizar cada peso invertido.",
    },
  },
];

export default function AdsDashboard() {
  const { language } = useLanguage();
  const isSpanish = language === "es";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-10">
        {/* Hero */}
        <div
          className="relative rounded-2xl overflow-hidden p-8 sm:p-12"
          style={{
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          }}
        >
          {/* decorative blobs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <Badge className="mb-4 bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 text-xs font-semibold tracking-wide uppercase">
                {isSpanish ? "Próximamente" : "Coming Soon"}
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
                {isSpanish ? (
                  <>
                    Administra todos tus
                    <br />
                    <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      anuncios desde aquí
                    </span>
                  </>
                ) : (
                  <>
                    Manage all your ads
                    <br />
                    <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                      from one place
                    </span>
                  </>
                )}
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-md leading-relaxed">
                {isSpanish
                  ? "Crea, lanza y optimiza campañas en Meta, Google y TikTok con IA — sin cambiar de pestaña."
                  : "Create, launch, and optimize campaigns across Meta, Google, and TikTok with AI — without switching tabs."}
              </p>
            </div>

            <div className="flex-shrink-0">
              <Button
                size="lg"
                disabled
                className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white border-0 gap-2 opacity-70 cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                {isSpanish ? "Crear Anuncio" : "Create Ad"}
              </Button>
              <p className="text-slate-500 text-xs text-center mt-2">
                {isSpanish ? "Disponible pronto" : "Available soon"}
              </p>
            </div>
          </div>

          {/* Platform chips */}
          <div className="relative z-10 flex flex-wrap gap-3 mt-8 pt-8 border-t border-white/10">
            <p className="text-slate-500 text-xs self-center mr-1 uppercase tracking-wider font-medium">
              {isSpanish ? "Plataformas:" : "Platforms:"}
            </p>
            {platforms.map(({ icon: Icon, name, color }) => (
              <div
                key={name}
                className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm"
              >
                <Icon style={{ color }} className="w-3.5 h-3.5" />
                <span className="text-slate-300 text-xs font-medium">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats preview row — feature not yet available */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: isSpanish ? "Plataformas" : "Platforms",
              value: "—",
              sub: isSpanish ? "no disponible aún" : "not available yet",
              icon: Globe,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: isSpanish ? "Inversión total" : "Total Spend",
              value: "—",
              sub: isSpanish ? "no disponible aún" : "not available yet",
              icon: BarChart3,
              color: "text-violet-500",
              bg: "bg-violet-50",
            },
            {
              label: "ROAS",
              value: "—",
              sub: isSpanish ? "no disponible aún" : "not available yet",
              icon: TrendingUp,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
            },
            {
              label: isSpanish ? "Campañas" : "Campaigns",
              value: "—",
              sub: isSpanish ? "no disponible aún" : "not available yet",
              icon: Megaphone,
              color: "text-amber-500",
              bg: "bg-amber-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}
              >
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-400 leading-none">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                <p className="text-[10px] text-gray-400">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h2 className="text-base font-semibold text-gray-800">
              {isSpanish ? "Lo que viene" : "What's coming"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const copy = isSpanish ? f.es : f.en;
              return (
                <div
                  key={f.en.title}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div
                    className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center mb-3`}
                  >
                    <f.icon className={`w-4 h-4 ${f.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-gray-800">
                    {copy.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {copy.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform preview cards */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-800">
              {isSpanish ? "Plataformas compatibles" : "Supported platforms"}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {platforms.map(({ icon: Icon, name, color, bg, border }) => (
              <div
                key={name}
                className={`${bg} border ${border} rounded-xl p-5 flex flex-col items-center gap-2 text-center`}
              >
                <Icon style={{ color }} className="w-7 h-7" />
                <p className="text-sm font-medium text-gray-800">{name}</p>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-0 border-current opacity-60"
                  style={{ color }}
                >
                  {isSpanish ? "Próximamente" : "Soon"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
