import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  TrendingUp,
  Send,
  Play,
  Clock,
  Star,
  Archive,
  Plug,
  ShoppingBag,
  MessageSquare,
  Rocket,
  Calendar,
  BarChart3,
  Users,
  ChevronRight,
  MessageCircle,
  Wand2,
  Bot,
  ArrowUpRight,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import {
  SiInstagram,
  SiTiktok,
  SiFacebook,
  SiWhatsapp,
  SiLinkedin,
  SiYoutube,
} from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";
import boosty from "./boosty.png";
import boostyFace from "./boosty_face.png";
import { useBrand } from "@/contexts/BrandContext";
import HelpChatbot from "@/components/HelpChatbot";

interface DashboardStats {
  unreadMessages: number;
  engagementRate: number;
  aiPosts: number;
  revenue: number;
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const pulseAnimation = {
  scale: [1, 1.02, 1],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
};

// Animated counter component
function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number | string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="tabular-nums"
    >
      {prefix}
      {value}
      {suffix}
    </motion.span>
  );
}

// Mini sparkline component
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <svg className="w-20 h-8" viewBox="0 0 80 32">
      <defs>
        <linearGradient
          id={`gradient-${color}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        d={`M ${data.map((v, i) => `${(i / (data.length - 1)) * 80},${32 - ((v - min) / range) * 28}`).join(" L ")}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M 0,32 L ${data.map((v, i) => `${(i / (data.length - 1)) * 80},${32 - ((v - min) / range) * 28}`).join(" L ")} L 80,32 Z`}
        fill={`url(#gradient-${color})`}
      />
    </svg>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { activeBrandId, activeMembership } = useBrand();
  const queryClient = useQueryClient();
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const t = translations[language];
  const [selectedPeriod, setSelectedPeriod] = useState<
    "weekly" | "monthly" | "daily"
  >("weekly");
  const [boostyExpanded, setBoostyExpanded] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: latestConversationsData, isLoading: conversationsLoading } =
    useQuery({
      queryKey: ["/api/conversations", activeBrandId, { limit: 5 }],
      queryFn: async () => {
        if (!activeBrandId) return { conversations: [] };
        const res = await apiRequest(
          "GET",
          `/api/conversations?brandId=${activeBrandId}&limit=5`,
        );
        return res.json();
      },
      enabled: !!activeBrandId,
    });

  const latestConversations = latestConversationsData?.conversations || [];

  // Fetch integrations for the active brand
  const { data: integrationsData } = useQuery({
    queryKey: ["/api/integrations", activeBrandId],
    queryFn: async () => {
      if (!activeBrandId) return [];
      const res = await apiRequest(
        "GET",
        `/api/integrations?brandId=${activeBrandId}`,
      );
      return res.json();
    },
    enabled: !!activeBrandId,
  });

  const integrations = integrationsData || [];

  // Helper variables to detect connected integrations
  const hasPOS = integrations.some(
    (i: any) =>
      i.isActive &&
      ["square", "stripe", "shopify", "woocommerce", "wix"].includes(
        i.provider,
      ),
  );
  const hasSocial = integrations.some(
    (i: any) =>
      i.isActive &&
      ["facebook", "instagram", "tiktok", "youtube", "threads"].includes(
        i.provider,
      ),
  );
  const hasMessaging = integrations.some(
    (i: any) =>
      i.isActive && ["facebook", "instagram", "whatsapp", "whatsapp_baileys"].includes(i.provider),
  );

  // Sample sparkline data
  const salesData = [30, 45, 35, 50, 65, 55, 72];
  const campaignData = [5, 8, 6, 10, 12, 9, 15];
  const messageData = [20, 35, 28, 42, 38, 55, 48];

  // Boosty suggestions
  const boostySuggestions = [
    {
      icon: Wand2,
      text: isSpanish ? "Crear post viral" : "Create viral post",
      action: "/content-planner",
    },
    {
      icon: Target,
      text: isSpanish
        ? "Estrategia de contenido de 30 días"
        : "30 day content strategy",
      action: "/campaigns",
    },
    {
      icon: MessageCircle,
      text: isSpanish ? "Responder mensajes" : "Reply to messages",
      action: "/inbox",
    },
  ];

  const platformStyles: Record<
    string,
    { icon: any; color: string; bgGradient: string; name: string }
  > = {
    facebook: {
      icon: SiFacebook,
      color: "#1877F2",
      bgGradient: "from-blue-500/10 to-blue-600/5",
      name: "Facebook",
    },
    instagram: {
      icon: SiInstagram,
      color: "#E4405F",
      bgGradient: "from-pink-500/10 to-purple-600/5",
      name: "Instagram",
    },
    whatsapp: {
      icon: SiWhatsapp,
      color: "#25D366",
      bgGradient: "from-green-500/10 to-green-600/5",
      name: "WhatsApp",
    },
    whatsapp_baileys: {
      icon: SiWhatsapp,
      color: "#25D366",
      bgGradient: "from-green-500/10 to-green-600/5",
      name: "WhatsApp",
    },
    linkedin: {
      icon: SiLinkedin,
      color: "#0A66C2",
      bgGradient: "from-blue-600/10 to-blue-700/5",
      name: "LinkedIn",
    },
    tiktok: {
      icon: SiTiktok,
      color: "#000000",
      bgGradient: "from-gray-800/10 to-gray-900/5",
      name: "TikTok",
    },
    youtube: {
      icon: SiYoutube,
      color: "#FF0000",
      bgGradient: "from-red-500/10 to-red-600/5",
      name: "YouTube",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30">
      <TopHeader pageName={t.sidebar.dashboard} />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        {/* Main Content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="max-w-7xl mx-auto space-y-6"
              >
                {/* Hero Section with Gradient */}
                <motion.div
                  variants={fadeInUp}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-brand-500 to-purple-600 p-8 shadow-2xl"
                >
                  <div className="absolute inset-0 opacity-20">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                        backgroundSize: "24px 24px",
                      }}
                    />
                  </div>

                  <div className="relative">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Badge className="bg-white/20 text-white border-white/30 mb-4 backdrop-blur-sm">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {isSpanish ? "Centro de Control" : "Command Center"}
                      </Badge>
                      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                        {t.dashboard.welcomeBack},{" "}
                        {activeMembership?.brandName ||
                          (isSpanish ? "Usuario" : "User")}
                        !
                      </h1>
                      <p className="text-white/80 text-lg">
                        {isSpanish
                          ? "Tu marca está creciendo. Aquí tienes lo que está pasando."
                          : "Your brand is growing. Here's what's happening."}
                      </p>
                    </motion.div>
                  </div>

                  {/* Quick Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 flex flex-wrap gap-3"
                  >
                    {boostySuggestions.map((suggestion, i) => (
                      <Link key={i} href={suggestion.action}>
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-all border border-white/20"
                        >
                          <suggestion.icon className="w-4 h-4" />
                          {suggestion.text}
                        </motion.button>
                      </Link>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Period Selector */}
                <motion.div
                  variants={fadeInUp}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      {isSpanish ? "Mostrando datos de:" : "Showing data from:"}
                    </span>
                  </div>
                  <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                    {[
                      { key: "daily", label: isSpanish ? "Hoy" : "Today" },
                      { key: "weekly", label: isSpanish ? "Semana" : "Week" },
                      { key: "monthly", label: isSpanish ? "Mes" : "Month" },
                    ].map((period) => (
                      <motion.button
                        key={period.key}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedPeriod(period.key as any)}
                        className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                          selectedPeriod === period.key
                            ? "bg-brand-500 text-white shadow-md"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {period.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* KPI Cards Grid */}
                <motion.div
                  variants={staggerContainer}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {/* Revenue Card */}
                  <motion.div
                    variants={scaleIn}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    onHoverStart={() => setHoveredCard("revenue")}
                    onHoverEnd={() => setHoveredCard(null)}
                    className="lg:col-span-2"
                  >
                    {hasPOS ? (
                      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-emerald-100 text-sm font-medium mb-1">
                                {isSpanish
                                  ? "Ingresos Totales"
                                  : "Total Revenue"}
                              </p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">
                                  <AnimatedCounter
                                    value={
                                      selectedPeriod === "daily"
                                        ? "1,890"
                                        : selectedPeriod === "weekly"
                                          ? "12,450"
                                          : "52,800"
                                    }
                                    prefix="$"
                                  />
                                </span>
                                <Badge className="bg-white/20 text-white border-0">
                                  <TrendingUp className="w-3 h-3 mr-1" />+
                                  {selectedPeriod === "daily"
                                    ? "12"
                                    : selectedPeriod === "weekly"
                                      ? "47"
                                      : "63"}
                                  %
                                </Badge>
                              </div>
                              <p className="text-emerald-100 text-sm mt-2">
                                {isSpanish
                                  ? "vs antes de Lead Boost"
                                  : "vs before Lead Boost"}
                              </p>
                            </div>
                            <div className="text-right">
                              <MiniSparkline data={salesData} color="#ffffff" />
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-emerald-100">
                                {isSpanish ? "Meta mensual" : "Monthly goal"}
                              </span>
                              <span className="font-semibold">$85,000</span>
                            </div>
                            <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "62%" }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-white rounded-full"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="relative overflow-hidden border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white h-full group hover:border-brand-300 transition-all">
                        <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
                          <motion.div
                            animate={
                              hoveredCard === "revenue"
                                ? { scale: 1.1, rotate: 5 }
                                : { scale: 1, rotate: 0 }
                            }
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4"
                          >
                            <ShoppingBag className="w-8 h-8 text-emerald-600" />
                          </motion.div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {isSpanish ? "Conecta tu POS" : "Connect your POS"}
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">
                            {isSpanish
                              ? "Ve tus ventas en tiempo real y mide el impacto de tus campañas"
                              : "See your sales in real-time and measure campaign impact"}
                          </p>
                          <Link href="/integrations">
                            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                              <Plug className="w-4 h-4 mr-2" />
                              {isSpanish ? "Conectar" : "Connect"}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>

                  {/* Campaigns Card */}
                  <motion.div
                    variants={scaleIn}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    onHoverStart={() => setHoveredCard("campaigns")}
                    onHoverEnd={() => setHoveredCard(null)}
                  >
                    {hasSocial ? (
                      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white h-full">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
                        <CardContent className="p-6">
                          <p className="text-violet-100 text-sm font-medium mb-1">
                            {isSpanish
                              ? "Campañas Activas"
                              : "Active Campaigns"}
                          </p>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-bold">
                              <AnimatedCounter
                                value={
                                  selectedPeriod === "daily"
                                    ? 1
                                    : selectedPeriod === "weekly"
                                      ? 7
                                      : 28
                                }
                              />
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-violet-100 text-sm">
                            <Target className="w-4 h-4" />
                            <span>
                              {selectedPeriod === "weekly"
                                ? "147"
                                : selectedPeriod === "monthly"
                                  ? "588"
                                  : "21"}{" "}
                              posts
                            </span>
                          </div>
                          <div className="mt-4">
                            <MiniSparkline
                              data={campaignData}
                              color="#ffffff"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="relative overflow-hidden border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white h-full group hover:border-brand-300 transition-all">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                          <motion.div
                            animate={
                              hoveredCard === "campaigns"
                                ? { scale: 1.1, rotate: -5 }
                                : { scale: 1, rotate: 0 }
                            }
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-3"
                          >
                            <SiInstagram className="w-6 h-6 text-violet-600" />
                          </motion.div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">
                            {isSpanish ? "Campañas" : "Campaigns"}
                          </h3>
                          <p className="text-xs text-gray-500 mb-4">
                            {isSpanish
                              ? "Conecta redes sociales"
                              : "Connect social media"}
                          </p>
                          <Link href="/integrations">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-violet-200 hover:bg-violet-50"
                            >
                              <Plug className="w-3 h-3 mr-1" />
                              {isSpanish ? "Conectar" : "Connect"}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>

                  {/* Messages Card */}
                  <motion.div
                    variants={scaleIn}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    onHoverStart={() => setHoveredCard("messages")}
                    onHoverEnd={() => setHoveredCard(null)}
                  >
                    {hasMessaging ? (
                      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white h-full">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
                        <CardContent className="p-6">
                          <p className="text-blue-100 text-sm font-medium mb-1">
                            {isSpanish ? "Mensajes Nuevos" : "New Messages"}
                          </p>
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-bold">
                              <AnimatedCounter
                                value={latestConversations.reduce(
                                  (acc: number, c: any) =>
                                    acc + (c.unreadCount || 0),
                                  0,
                                )}
                              />
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-100 text-sm">
                            <Users className="w-4 h-4" />
                            <span>
                              {latestConversations.length}{" "}
                              {isSpanish ? "conversaciones" : "conversations"}
                            </span>
                          </div>
                          <div className="mt-4">
                            <MiniSparkline data={messageData} color="#ffffff" />
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="relative overflow-hidden border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white h-full group hover:border-brand-300 transition-all">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                          <motion.div
                            animate={
                              hoveredCard === "messages"
                                ? { scale: 1.1, rotate: 5 }
                                : { scale: 1, rotate: 0 }
                            }
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-3"
                          >
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                          </motion.div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">
                            {isSpanish ? "Mensajes" : "Messages"}
                          </h3>
                          <p className="text-xs text-gray-500 mb-4">
                            {isSpanish
                              ? "Conecta WhatsApp o IG"
                              : "Connect WhatsApp or IG"}
                          </p>
                          <Link href="/integrations">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-blue-200 hover:bg-blue-50"
                            >
                              <Plug className="w-3 h-3 mr-1" />
                              {isSpanish ? "Conectar" : "Connect"}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Conversations Section - Takes 2 columns */}
                  <motion.div variants={fadeInUp} className="lg:col-span-2">
                    <Card className="overflow-hidden border-0 shadow-lg bg-white">
                      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
                              <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                {isSpanish
                                  ? "Conversaciones Recientes"
                                  : "Recent Conversations"}
                              </CardTitle>
                              <p className="text-sm text-gray-500">
                                {isSpanish
                                  ? "Responde a tus clientes"
                                  : "Reply to your customers"}
                              </p>
                            </div>
                          </div>
                          <Link href="/inbox">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                            >
                              {isSpanish ? "Ver todos" : "View all"}
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </CardHeader>

                      <CardContent className="p-0">
                        {conversationsLoading ? (
                          <div className="p-6 space-y-4">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="flex items-start gap-4 p-4"
                              >
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-4 w-full" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : !hasMessaging ? (
                          <div className="text-center py-16 px-6">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                              }}
                              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-6"
                            >
                              <MessageSquare className="w-10 h-10 text-blue-500" />
                            </motion.div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {isSpanish
                                ? "No tienes conversaciones aún"
                                : "You don't have conversations yet"}
                            </h3>
                            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                              {isSpanish
                                ? "Conecta Facebook, Instagram o WhatsApp para empezar a recibir mensajes de tus clientes."
                                : "Connect Facebook, Instagram or WhatsApp to start receiving messages from your customers."}
                            </p>
                            <Link href="/integrations">
                              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
                                <Plug className="w-4 h-4 mr-2" />
                                {isSpanish
                                  ? "Conectar plataformas"
                                  : "Connect platforms"}
                              </Button>
                            </Link>
                          </div>
                        ) : latestConversations.length ? (
                          <div className="divide-y divide-gray-100">
                            {latestConversations.map(
                              (conversation: any, index: number) => {
                                const platform = platformStyles[
                                  conversation.platform
                                ] || {
                                  icon: HelpCircle,
                                  color: "#9CA3AF",
                                  bgGradient: "from-gray-400/10 to-gray-500/5",
                                  name: "Unknown",
                                };
                                const Icon = platform.icon;
                                const isUnread = conversation.unreadCount > 0;
                                const timeAgo = conversation.lastMessageAt
                                  ? formatDistanceToNow(
                                      new Date(conversation.lastMessageAt),
                                      { addSuffix: true },
                                    )
                                  : "";

                                return (
                                  <motion.div
                                    key={conversation.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{
                                      backgroundColor:
                                        "rgba(99, 102, 241, 0.05)",
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                      (window.location.href = `/inbox?conversation=${conversation.id}`)
                                    }
                                    className="flex items-center gap-4 p-4 cursor-pointer transition-all"
                                  >
                                    <div
                                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${platform.bgGradient} border border-gray-100`}
                                    >
                                      <Icon
                                        className="w-6 h-6"
                                        style={{ color: platform.color }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900 truncate flex items-center gap-2">
                                          {conversation.contactName ||
                                            "Unknown"}
                                          {isUnread && (
                                            <Badge className="bg-brand-500 text-white text-xs px-2 py-0.5">
                                              {conversation.unreadCount}
                                            </Badge>
                                          )}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <Clock className="w-3 h-3" />
                                          <span>{timeAgo}</span>
                                        </div>
                                      </div>
                                      <p
                                        className={`text-sm truncate ${isUnread ? "text-gray-900 font-medium" : "text-gray-500"}`}
                                      >
                                        {conversation.lastMessage ||
                                          (isSpanish
                                            ? "(sin mensaje)"
                                            : "(no message)")}
                                      </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                  </motion.div>
                                );
                              },
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12 px-6">
                            <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">
                              {isSpanish
                                ? "No hay conversaciones recientes"
                                : "No recent conversations"}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              {isSpanish
                                ? "Las nuevas conversaciones aparecerán aquí"
                                : "New conversations will appear here"}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Boosty AI Assistant Panel */}
                  <motion.div variants={fadeInUp}>
                    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-brand-50 via-white to-purple-50 h-full">
                      <CardHeader className="border-b border-brand-100/50 px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={boostyFace} 
                            alt="Boosty" 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              Boosty AI
                              <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                                Online
                              </Badge>
                            </CardTitle>
                            <p className="text-sm text-gray-500">
                              {isSpanish
                                ? "Tu asistente de marketing"
                                : "Your marketing assistant"}
                            </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 space-y-4">
                        {/* AI Suggestions */}
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {isSpanish
                              ? "Sugerencias para ti"
                              : "Suggestions for you"}
                          </p>

                          {[
                            {
                              icon: Rocket,
                              title: isSpanish
                                ? "Crear post viral"
                                : "Create viral post",
                              desc: isSpanish
                                ? "Basado en tendencias actuales"
                                : "Based on current trends",
                              action: "/content-planner",
                              color: "from-orange-500 to-red-500",
                            },
                            {
                              icon: Calendar,
                              title: isSpanish
                                ? "Programar contenido"
                                : "Schedule content",
                              desc: isSpanish
                                ? "Optimiza tu calendario"
                                : "Optimize your calendar",
                              action: "/content-planner",
                              color: "from-blue-500 to-indigo-500",
                            },
                            {
                              icon: BarChart3,
                              title: isSpanish
                                ? "Ver analytics"
                                : "View analytics",
                              desc: isSpanish
                                ? "Métricas de engagement"
                                : "Engagement metrics",
                              action: "/analytics",
                              color: "from-green-500 to-emerald-500",
                            },
                          ].map((item, i) => (
                            <Link key={i} href={item.action}>
                              <motion.div
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all cursor-pointer group"
                              >
                                <div
                                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}
                                >
                                  <item.icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.desc}
                                  </p>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
                              </motion.div>
                            </Link>
                          ))}
                        </div>

                        {/* Quick Tip */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="p-4 rounded-xl bg-gradient-to-r from-brand-500/10 to-purple-500/10 border border-brand-200/50"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {isSpanish ? "Tip del día" : "Tip of the day"}
                              </p>
                              <p className="text-xs text-gray-600">
                                {isSpanish
                                  ? "Los Reels con música trending tienen 67% más alcance. ¿Quieres que cree uno?"
                                  : "Reels with trending music get 67% more reach. Want me to create one?"}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        {/* Chat with Boosty */}
                        <Link href="/home">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-4 bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 mt-4"
                          >
                            <MessageCircle className="w-4 h-4" />
                            {isSpanish
                              ? "Chatear con Boosty"
                              : "Chat with Boosty"}
                          </motion.button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Achievement/Progress Section */}
                <motion.div variants={fadeInUp}>
                  <Card className="overflow-hidden border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                            <Star className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {isSpanish ? "Tu Progreso" : "Your Progress"}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {isSpanish
                                ? "Completa estos pasos para maximizar tu éxito"
                                : "Complete these steps to maximize your success"}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 border-0">
                          {hasPOS && hasSocial && hasMessaging
                            ? "3/3"
                            : hasPOS || hasSocial || hasMessaging
                              ? `${[hasPOS, hasSocial, hasMessaging].filter(Boolean).length}/3`
                              : "0/3"}{" "}
                          {isSpanish ? "completado" : "complete"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          {
                            title: isSpanish ? "Conectar POS" : "Connect POS",
                            desc: isSpanish
                              ? "Ve tus ventas en tiempo real"
                              : "See your sales in real-time",
                            done: hasPOS,
                            icon: ShoppingBag,
                            link: "/integrations",
                          },
                          {
                            title: isSpanish
                              ? "Conectar redes sociales"
                              : "Connect social media",
                            desc: isSpanish
                              ? "Crea y programa contenido"
                              : "Create and schedule content",
                            done: hasSocial,
                            icon: SiInstagram,
                            link: "/integrations",
                          },
                          {
                            title: isSpanish
                              ? "Activar mensajería"
                              : "Activate messaging",
                            desc: isSpanish
                              ? "Responde a tus clientes"
                              : "Reply to your customers",
                            done: hasMessaging,
                            icon: MessageSquare,
                            link: "/integrations",
                          },
                        ].map((step, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ y: -2 }}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              step.done
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200 hover:border-brand-300"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  step.done ? "bg-green-500" : "bg-gray-200"
                                }`}
                              >
                                {step.done ? (
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                ) : (
                                  <step.icon className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p
                                  className={`text-sm font-medium ${step.done ? "text-green-700" : "text-gray-900"}`}
                                >
                                  {step.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {step.desc}
                                </p>
                                {!step.done && (
                                  <Link href={step.link}>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-brand-600 hover:text-brand-700 p-0 h-auto mt-2 text-xs"
                                    >
                                      {isSpanish ? "Conectar" : "Connect"}{" "}
                                      <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </div>
          </main>
        </div>
      </div>

      {/* Boosty Chatbot - Bottom Right Corner */}
      <HelpChatbot />
    </div>
  );
}
