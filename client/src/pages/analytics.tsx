import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Users,
  BarChart3,
  Clock,
  Sparkles,
  TrendingUp,
  Share2,
  Image as ImageIcon,
} from "lucide-react";
import { SiInstagram } from "react-icons/si";
import HelpChatbot from "@/components/HelpChatbot";
import { useLanguage } from "@/hooks/useLanguage";
import { useBrand } from "@/contexts/BrandContext";

interface AnalyticsRow {
  id: string;
  platform: string;
  metric: string;
  value: number;
  period: string;
  recordedAt: string;
}

interface DashboardStats {
  totalMessages: number;
  unreadMessages: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalSocialAccounts: number;
  connectedPlatforms: string[];
  aiPosts: number;
  responseTime: string;
  revenue: number;
}

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isSpanish, toggleLanguage } = useLanguage();
  const { activeBrandId } = useBrand();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", { brandId: activeBrandId }],
    enabled: !!activeBrandId,
    retry: false,
  });

  const { data: rawAnalytics, isLoading: analyticsLoading } = useQuery<
    AnalyticsRow[]
  >({
    queryKey: ["/api/analytics", { brandId: activeBrandId }],
    enabled: !!activeBrandId,
    retry: false,
  });

  // Transform flat rows into a metrics map: { metricName: value }
  const igMetrics = useMemo(() => {
    const metrics: Record<string, number> = {};
    if (!rawAnalytics) return metrics;
    for (const row of rawAnalytics) {
      if (row.platform === "instagram") {
        // Keep the most recent value per metric (rows are ordered by recordedAt)
        metrics[row.metric] = row.value;
      }
    }
    return metrics;
  }, [rawAnalytics]);

  const hasIgData = Object.keys(igMetrics).length > 0;

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const formatEngagementRate = (basisPoints: number): string => {
    return (basisPoints / 100).toFixed(2) + "%";
  };

  const formatBestHour = (hour: number): string => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName={isSpanish ? "Analytics de Instagram" : "Instagram Analytics"} />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {/* Page Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <SiInstagram className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {isSpanish ? "Analytics de Instagram" : "Instagram Analytics"}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {isSpanish
                        ? "Métricas de tu cuenta y rendimiento de publicaciones"
                        : "Account metrics and post performance"}
                    </p>
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  {statsLoading || analyticsLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-5">
                          <Skeleton className="h-4 w-20 mb-2" />
                          <Skeleton className="h-8 w-16" />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <>
                      <Card className="border-l-4 border-l-pink-500">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500">
                                {isSpanish ? "Seguidores" : "Followers"}
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(igMetrics.followers || 0)}
                              </p>
                            </div>
                            <Users className="h-8 w-8 text-pink-500 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500">
                                {isSpanish ? "Alcance (7d)" : "Reach (7d)"}
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(igMetrics.reach || igMetrics.post_reach_7d || 0)}
                              </p>
                            </div>
                            <Eye className="h-8 w-8 text-blue-500 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500">
                                {isSpanish ? "Impresiones (7d)" : "Impressions (7d)"}
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(igMetrics.impressions || igMetrics.post_impressions_7d || 0)}
                              </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500">
                                {isSpanish ? "Tasa de Engagement" : "Engagement Rate"}
                              </p>
                              <p className="text-2xl font-bold text-gray-900">
                                {igMetrics.avg_engagement_rate
                                  ? formatEngagementRate(igMetrics.avg_engagement_rate)
                                  : "—"}
                              </p>
                            </div>
                            <Heart className="h-8 w-8 text-green-500 opacity-50" />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {hasIgData ? (
                  <div className="space-y-6">
                    {/* Post Performance (7 days) */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-purple-500" />
                          {isSpanish
                            ? "Rendimiento de Posts (Últimos 7 días)"
                            : "Post Performance (Last 7 days)"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="text-center p-4 bg-blue-50 rounded-xl">
                            <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {formatNumber(igMetrics.post_reach_7d || 0)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {isSpanish ? "Alcance" : "Reach"}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {formatNumber(igMetrics.post_impressions_7d || 0)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {isSpanish ? "Impresiones" : "Impressions"}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-pink-50 rounded-xl">
                            <Heart className="h-6 w-6 text-pink-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {formatNumber(igMetrics.post_engagement_7d || 0)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {isSpanish ? "Interacciones" : "Engagement"}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-xl">
                            <BarChart3 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-gray-900">
                              {igMetrics.avg_engagement_rate
                                ? formatEngagementRate(igMetrics.avg_engagement_rate)
                                : "—"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {isSpanish ? "Tasa Engagement" : "Engagement Rate"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Account Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-pink-500" />
                            {isSpanish ? "Cuenta" : "Account"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-gray-500">
                              {isSpanish ? "Seguidores" : "Followers"}
                            </span>
                            <span className="font-semibold">
                              {formatNumber(igMetrics.followers || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-gray-500">
                              {isSpanish ? "Publicaciones" : "Posts"}
                            </span>
                            <span className="font-semibold">
                              {formatNumber(igMetrics.media_count || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-gray-500">
                              {isSpanish ? "Posts IA Generados" : "AI Posts Generated"}
                            </span>
                            <span className="font-semibold">
                              {stats?.aiPosts ?? 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-gray-500">
                              {isSpanish ? "Mensajes Totales" : "Total Messages"}
                            </span>
                            <span className="font-semibold">
                              {stats?.totalMessages ?? 0}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-500" />
                            {isSpanish ? "Mejor Hora para Publicar" : "Best Time to Post"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {igMetrics.best_hour !== undefined ? (
                            <div className="text-center py-6">
                              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl font-bold text-amber-600">
                                  {formatBestHour(igMetrics.best_hour)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {isSpanish
                                  ? "Cuando más seguidores están en línea"
                                  : "When most followers are online"}
                              </p>
                              {igMetrics.peak_online_followers !== undefined && (
                                <p className="text-xs text-gray-400 mt-1">
                                  ~{formatNumber(igMetrics.peak_online_followers)}{" "}
                                  {isSpanish ? "seguidores activos" : "active followers"}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-400">
                              <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                              <p className="text-sm">
                                {isSpanish
                                  ? "Se calculará después de la primera sincronización"
                                  : "Will be calculated after first sync"}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Activity Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-500" />
                          {isSpanish ? "Resumen de Actividad" : "Activity Summary"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <MessageCircle className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-lg font-semibold">
                                {stats?.totalMessages ?? 0}
                              </p>
                              <p className="text-xs text-gray-500">
                                {isSpanish ? "Mensajes" : "Messages"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <MessageCircle className="h-5 w-5 text-red-500" />
                            <div>
                              <p className="text-lg font-semibold">
                                {stats?.unreadMessages ?? 0}
                              </p>
                              <p className="text-xs text-gray-500">
                                {isSpanish ? "Sin Leer" : "Unread"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <ImageIcon className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-lg font-semibold">
                                {stats?.aiPosts ?? 0}
                              </p>
                              <p className="text-xs text-gray-500">
                                {isSpanish ? "Posts IA" : "AI Posts"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Clock className="h-5 w-5 text-purple-500" />
                            <div>
                              <p className="text-lg font-semibold">
                                {stats?.responseTime ?? "N/A"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {isSpanish ? "Respuesta" : "Response"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  /* Empty state — no Instagram analytics data yet */
                  <Card>
                    <CardContent className="py-16">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <SiInstagram className="h-8 w-8 text-pink-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {isSpanish
                            ? "Esperando datos de Instagram"
                            : "Waiting for Instagram data"}
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-4">
                          {isSpanish
                            ? "Los datos de analytics se sincronizan automáticamente cada día. Conecta tu cuenta de Instagram y publica contenido para ver métricas aquí."
                            : "Analytics data syncs automatically every day. Connect your Instagram account and publish content to see metrics here."}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                          <Clock className="h-4 w-4" />
                          {isSpanish
                            ? "Próxima sincronización: 4:00 AM"
                            : "Next sync: 4:00 AM daily"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            <HelpChatbot isSpanish={isSpanish} toggleLanguage={toggleLanguage} />
          </main>
        </div>
      </div>
    </div>
  );
}
