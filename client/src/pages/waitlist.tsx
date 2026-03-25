import { useMemo, useState } from "react";
import {
  Form as UIForm,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const leadBoostLogo = "/images/leadboost-logo.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  MessageSquare,
  BarChart3,
  Zap,
  CheckCircle2,
  ArrowRight,
  Star,
  Globe,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const waitlistSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  company: z.string().min(1, "Required"),
  role: z.enum(["owner", "marketing", "sales", "agency", "other"]),
  teamSize: z.enum(["1", "2-5", "6-15", "16-50", "50+"]),
  primaryGoal: z.enum([
    "content",
    "leads",
    "inbox",
    "automation",
    "analytics",
    "other",
  ]),
  platforms: z
    .array(
      z.enum(["instagram", "tiktok", "facebook", "linkedin", "email", "other"]),
    )
    .min(1, "Select at least one platform"),
  postingFrequency: z
    .enum(["daily", "weekly", "occasional", "rarely"])
    .optional(),
  country: z.string().min(1, "Required"),
  city: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().max(400).optional(),
  companyFax: z.string().max(0).optional(),
});

type WaitlistForm = z.infer<typeof waitlistSchema>;

const platformOptions = [
  { id: "instagram" as const, label: "Instagram", icon: "📸" },
  { id: "tiktok" as const, label: "TikTok", icon: "🎵" },
  { id: "facebook" as const, label: "Facebook", icon: "👥" },
  { id: "linkedin" as const, label: "LinkedIn", icon: "💼" },
  { id: "email" as const, label: "Email", icon: "📧" },
  { id: "other" as const, label: "Other", icon: "🔗" },
];

export default function WaitList() {
  const { isSpanish, toggleLanguage } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<null | { email: string }>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const t = useMemo(
    () => ({
      badge: isSpanish
        ? "Acceso anticipado — Cupos limitados"
        : "Early access — Limited spots",
      trusted: isSpanish
        ? "Más de 200 marcas confían en nosotros"
        : "Trusted by 200+ brands",
      heroTitle1: isSpanish
        ? "Haz crecer tu marca con "
        : "Grow your brand with ",
      heroTitleHighlight: isSpanish ? "IA" : "AI-powered",
      heroTitle2: isSpanish ? " en redes sociales" : " social media",
      heroDesc: isSpanish
        ? "Una plataforma para generar contenido, programar posts y convertir mensajes en clientes en Instagram, Facebook y WhatsApp."
        : "One platform to generate content, schedule posts, and convert messages into customers across Instagram, Facebook & WhatsApp.",
      featureAiTitle: isSpanish ? "Contenido IA" : "AI Content",
      featureAiDesc: isSpanish
        ? "Posts con los assets de tu marca, logo y estilo"
        : "Posts from your brand assets, logo & style",
      featureInboxTitle: isSpanish ? "Bandeja unificada" : "Unified Inbox",
      featureInboxDesc: isSpanish
        ? "Todos los DMs y mensajes en un solo lugar"
        : "All DMs & messages in one place",
      featureScheduleTitle: isSpanish ? "Auto-programación" : "Auto-scheduling",
      featureScheduleDesc: isSpanish
        ? "Publicación inteligente con flujos de aprobación"
        : "Smart posting with approval workflows",
      featureAnalyticsTitle: isSpanish ? "Analíticas" : "Analytics",
      featureAnalyticsDesc: isSpanish
        ? "Mide engagement y optimiza rendimiento"
        : "Track engagement & optimize performance",
      successTitle: isSpanish ? "¡Estás en la lista!" : "You're on the list!",
      successDesc: isSpanish ? "Te enviaremos un correo a " : "We'll email ",
      successDesc2: isSpanish
        ? " cuando tu acceso esté listo."
        : " when your access is ready.",
      formTitle: isSpanish
        ? "Solicita acceso anticipado"
        : "Request early access",
      formDesc: isSpanish
        ? "Cuéntanos sobre ti para priorizar el mejor perfil."
        : "Tell us about you so we can prioritize the best fit.",
      firstName: isSpanish ? "Nombre" : "First name",
      lastName: isSpanish ? "Apellido" : "Last name",
      workEmail: isSpanish ? "Correo de trabajo" : "Work email",
      companyBrand: isSpanish ? "Empresa / Marca" : "Company / Brand",
      website: "Website",
      optional: isSpanish ? "(opcional)" : "(optional)",
      yourRole: isSpanish ? "Tu rol" : "Your role",
      selectRole: isSpanish ? "Selecciona rol" : "Select role",
      teamSize: isSpanish ? "Tamaño del equipo" : "Team size",
      selectSize: isSpanish ? "Selecciona tamaño" : "Select size",
      justMe: isSpanish ? "Solo yo" : "Just me",
      primaryGoal: isSpanish ? "Objetivo principal" : "Primary goal",
      selectGoal: isSpanish ? "Selecciona tu objetivo" : "Select your goal",
      platforms: isSpanish
        ? "Plataformas a automatizar"
        : "Platforms to automate",
      platformsHint: isSpanish
        ? "(selecciona las que apliquen)"
        : "(select all that apply)",
      country: isSpanish ? "País" : "Country",
      countryPlaceholder: isSpanish
        ? "ej. Estados Unidos"
        : "e.g. United States",
      city: isSpanish ? "Ciudad" : "City",
      cityPlaceholder: isSpanish ? "ej. Tallahassee" : "e.g. Tallahassee",
      notes: isSpanish
        ? "¿Algo que debamos saber?"
        : "Anything we should know?",
      notesPlaceholder: isSpanish
        ? "ej. Manejamos 3 marcas, necesitamos aprobaciones + auto-publicación + bandeja unificada."
        : "e.g. We manage 3 brands, need approvals + auto-posting + unified inbox.",
      submitBtn: isSpanish
        ? "Unirme a la lista de espera"
        : "Join the waitlist",
      submitting: isSpanish ? "Uniéndose..." : "Joining...",
      disclaimer: isSpanish
        ? "Al unirte, aceptas recibir actualizaciones del producto. Sin spam."
        : "By joining, you agree to receive product updates. No spam, ever.",
      errorDuplicate: isSpanish
        ? "¡Este correo ya está en la lista de espera!"
        : "This email is already on the waitlist!",
      errorGeneric: isSpanish
        ? "Algo salió mal. Inténtalo de nuevo."
        : "Something went wrong. Please try again.",
      poweredBy: isSpanish ? "Impulsado por IA" : "Powered by AI",
    }),
    [isSpanish],
  );

  const roleLabel = useMemo(
    () =>
      isSpanish
        ? {
            owner: "Fundador/a / Dueño/a",
            marketing: "Marketing",
            sales: "Ventas",
            agency: "Agencia / Consultor",
            other: "Otro",
          }
        : {
            owner: "Founder / Owner",
            marketing: "Marketing",
            sales: "Sales",
            agency: "Agency / Consultant",
            other: "Other",
          },
    [isSpanish],
  );

  const goalLabel = useMemo(
    () =>
      isSpanish
        ? {
            content: "Crear contenido más rápido",
            leads: "Captar más leads",
            inbox: "Centralizar mensajes (IG/FB/WA)",
            automation: "Automatizar publicaciones + seguimientos",
            analytics: "Mejorar rendimiento con analíticas",
            other: "Otro",
          }
        : {
            content: "Create content faster",
            leads: "Capture more leads",
            inbox: "Centralize messages (IG/FB/WA)",
            automation: "Automate posting + follow-ups",
            analytics: "Improve performance with analytics",
            other: "Other",
          },
    [isSpanish],
  );

  const form = useForm<WaitlistForm>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      role: "owner",
      teamSize: "1",
      primaryGoal: "leads",
      website: "",
      notes: "",
      companyFax: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: WaitlistForm) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (data.companyFax && data.companyFax.trim().length > 0) {
        setIsSubmitting(false);
        return;
      }

      const { companyFax, ...payload } = data;
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setSubmitError(t.errorDuplicate);
        return;
      }

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setSubmitted({ email: data.email });
      form.reset();
    } catch (e) {
      setSubmitError(t.errorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: t.featureAiTitle,
      desc: t.featureAiDesc,
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: MessageSquare,
      title: t.featureInboxTitle,
      desc: t.featureInboxDesc,
      gradient: "from-teal-500 to-cyan-600",
    },
    {
      icon: Zap,
      title: t.featureScheduleTitle,
      desc: t.featureScheduleDesc,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      icon: BarChart3,
      title: t.featureAnalyticsTitle,
      desc: t.featureAnalyticsDesc,
      gradient: "from-blue-500 to-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 text-gray-900">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <img
              src={leadBoostLogo}
              alt="LeadBoost"
              className="h-10 sm:h-12 w-auto"
            />
            <div className="flex items-center gap-4">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-600 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {isSpanish ? "EN" : "ES"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="space-y-8 lg:sticky lg:top-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 border border-teal-200 px-4 py-1.5 text-sm font-medium text-teal-700 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                {t.badge}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15]">
                {t.heroTitle1}
                <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  {t.heroTitleHighlight}
                </span>
                {t.heroTitle2}
              </h1>

              <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-lg">
                {t.heroDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200"
                >
                  <div
                    className={`flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-sm`}
                  >
                    <feature.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {feature.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {feature.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {submitted && (
              <div className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 font-semibold text-green-800 text-lg">
                  <CheckCircle2 className="w-5 h-5" />
                  {t.successTitle}
                </div>
                <p className="text-green-700 mt-1">
                  {t.successDesc}
                  <span className="font-semibold">{submitted.email}</span>
                  {t.successDesc2}
                </p>
              </div>
            )}

            {submitError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
                {submitError}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-100/50 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{t.formTitle}</h2>
              <p className="text-sm text-gray-500 mt-1">{t.formDesc}</p>
            </div>

            <div className="p-6">
              <UIForm {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <div className="hidden">
                    <FormField
                      control={form.control}
                      name="companyFax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Fax</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Leave empty" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            {t.firstName}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John"
                              className="h-11 rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            {t.lastName}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Doe"
                              className="h-11 rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          {t.workEmail}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="name@company.com"
                            className="h-11 rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            {t.companyBrand}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="LeadBoost"
                              className="h-11 rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            {t.website}{" "}
                            <span className="text-gray-400 font-normal">
                              {t.optional}
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="leadboostapp.ai"
                              className="h-11 rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            {t.yourRole}
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-xl border-gray-200">
                                <SelectValue placeholder={t.selectRole} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(roleLabel).map(([k, v]) => (
                                <SelectItem key={k} value={k}>
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            {t.teamSize}
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-xl border-gray-200">
                                <SelectValue placeholder={t.selectSize} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">{t.justMe}</SelectItem>
                              <SelectItem value="2-5">2 – 5</SelectItem>
                              <SelectItem value="6-15">6 – 15</SelectItem>
                              <SelectItem value="16-50">16 – 50</SelectItem>
                              <SelectItem value="50+">50+</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="primaryGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          {t.primaryGoal}
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl border-gray-200">
                              <SelectValue placeholder={t.selectGoal} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(goalLabel).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="platforms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          {t.platforms}
                          <span className="text-gray-400 font-normal ml-1.5">
                            {t.platformsHint}
                          </span>
                        </FormLabel>

                        <div className="grid grid-cols-3 gap-2.5 pt-1">
                          {platformOptions.map((item) => {
                            const isSelected = field.value?.includes(item.id);
                            return (
                              <label
                                key={item.id}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-all duration-150 select-none ${
                                  isSelected
                                    ? "bg-teal-50 border-teal-300 text-teal-800 shadow-sm"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  value={item.id}
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    field.onChange(
                                      checked
                                        ? [...(field.value || []), item.id]
                                        : field.value?.filter(
                                            (v) => v !== item.id,
                                          ),
                                    );
                                  }}
                                  className="sr-only"
                                />
                                <span className="text-base">{item.icon}</span>
                                <span className="font-medium text-xs">
                                  {item.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            {t.country}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t.countryPlaceholder}
                              className="h-11 rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            {t.city}{" "}
                            <span className="text-gray-400 font-normal">
                              {t.optional}
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t.cityPlaceholder}
                              className="h-11 rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          {t.notes}{" "}
                          <span className="text-gray-400 font-normal">
                            {t.optional}
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t.notesPlaceholder}
                            className="min-h-[80px] rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20 resize-none"
                          />
                        </FormControl>
                        <div className="text-xs text-gray-400 text-right">
                          {field.value?.length ?? 0} / 400
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold text-base shadow-lg shadow-teal-500/20 transition-all duration-200"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t.submitting}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {t.submitBtn}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-gray-400 text-center leading-relaxed">
                    {t.disclaimer}
                  </p>
                </form>
              </UIForm>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} LeadBoost. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Zap className="w-3 h-3" />
            {t.poweredBy}
          </div>
        </div>
      </footer>
    </div>
  );
}
