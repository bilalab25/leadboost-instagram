import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Heart, MessageCircle, DollarSign, Users, BarChart3, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import HelpChatbot from "@/components/HelpChatbot";
import { useLanguage } from "@/hooks/useLanguage";
import { useBrand } from "@/contexts/BrandContext";

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

interface AnalyticsEntry {
  id: string;
  platform: string;
  date: string;
  metrics: {
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
    impressions: number;
    revenue?: number;
  };
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
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", { brandId: activeBrandId }],
    enabled: !!activeBrandId,
    retry: false,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsEntry[]>({
    queryKey: ["/api/analytics"],
    enabled: !!activeBrandId,
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Aggregate real analytics data by platform
  const platformAggregates = (analytics || []).reduce<Record<string, { reach: number; engagement: number; clicks: number; conversions: number; impressions: number; revenue: number; count: number }>>((acc, entry) => {
    const p = entry.platform;
    if (!acc[p]) acc[p] = { reach: 0, engagement: 0, clicks: 0, conversions: 0, impressions: 0, revenue: 0, count: 0 };
    acc[p].reach += entry.metrics.reach || 0;
    acc[p].engagement += entry.metrics.engagement || 0;
    acc[p].clicks += entry.metrics.clicks || 0;
    acc[p].conversions += entry.metrics.conversions || 0;
    acc[p].impressions += entry.metrics.impressions || 0;
    acc[p].revenue += entry.metrics.revenue || 0;
    acc[p].count += 1;
    return acc;
  }, {});

  // Compute totals from real data
  const totalReach = Object.values(platformAggregates).reduce((s, p) => s + p.reach, 0);
  const totalEngagement = Object.values(platformAggregates).reduce((s, p) => s + p.engagement, 0);
  const totalClicks = Object.values(platformAggregates).reduce((s, p) => s + p.clicks, 0);
  const hasAnalytics = (analytics || []).length > 0;

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName="Analytics" />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">

              {/* Real Metrics from Dashboard Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {statsLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-6">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-8 w-16" />
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                              <MessageCircle className="text-white h-5 w-5" />
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                {isSpanish ? "Total Mensajes" : "Total Messages"}
                              </dt>
                              <dd className="text-2xl font-semibold text-gray-900" data-testid="metric-total-messages">
                                {stats?.totalMessages ?? 0}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                              <Sparkles className="text-white h-5 w-5" />
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                {isSpanish ? "Posts IA" : "AI Posts"}
                              </dt>
                              <dd className="text-2xl font-semibold text-gray-900" data-testid="metric-ai-posts">
                                {stats?.aiPosts ?? 0}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                              <Clock className="text-white h-5 w-5" />
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                {isSpanish ? "Tiempo de Respuesta" : "Response Time"}
                              </dt>
                              <dd className="text-2xl font-semibold text-gray-900" data-testid="metric-response-time">
                                {stats?.responseTime ?? "N/A"}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                              <DollarSign className="text-white h-5 w-5" />
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                {isSpanish ? "Ingresos (30d)" : "Revenue (30d)"}
                              </dt>
                              <dd className="text-2xl font-semibold text-gray-900" data-testid="metric-revenue">
                                ${(stats?.revenue ?? 0).toLocaleString()}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Analytics Data from /api/analytics */}
              {analyticsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <Card key={i}>
                        <CardContent className="p-6">
                          <Skeleton className="h-6 w-32 mb-4" />
                          <Skeleton className="h-20 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : hasAnalytics ? (
                <div className="space-y-6">
                  {/* Aggregated Totals */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{isSpanish ? "Rendimiento Total" : "Overall Performance"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Eye className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-500">{isSpanish ? "Alcance" : "Reach"}</span>
                          </div>
                          <p className="text-2xl font-bold">{formatNumber(totalReach)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Heart className="h-4 w-4 text-pink-500" />
                            <span className="text-sm text-gray-500">Engagement</span>
                          </div>
                          <p className="text-2xl font-bold">{formatNumber(totalEngagement)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="h-4 w-4 text-purple-500" />
                            <span className="text-sm text-gray-500">Clicks</span>
                          </div>
                          <p className="text-2xl font-bold">{formatNumber(totalClicks)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-500">{isSpanish ? "Plataformas" : "Platforms"}</span>
                          </div>
                          <p className="text-2xl font-bold">{Object.keys(platformAggregates).length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Per-Platform Breakdown */}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isSpanish ? "Por Plataforma" : "By Platform"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(platformAggregates).map(([platform, data]) => (
                      <Card key={platform}>
                        <CardHeader>
                          <CardTitle className="capitalize">{platform}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-2xl font-bold">{formatNumber(data.reach)}</p>
                              <p className="text-sm text-gray-500">{isSpanish ? "Alcance" : "Reach"}</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{formatNumber(data.engagement)}</p>
                              <p className="text-sm text-gray-500">Engagement</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{formatNumber(data.clicks)}</p>
                              <p className="text-sm text-gray-500">Clicks</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{data.conversions}</p>
                              <p className="text-sm text-gray-500">{isSpanish ? "Conversiones" : "Conversions"}</p>
                            </div>
                          </div>
                          {data.reach > 0 && (
                            <div className="pt-4 border-t mt-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  {isSpanish ? "Tasa de Engagement" : "Engagement Rate"}
                                </span>
                                <span className="text-sm font-medium">
                                  {((data.engagement / data.reach) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                  className="bg-brand-500 h-2 rounded-full"
                                  style={{ width: `${Math.min((data.engagement / data.reach) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Recent Analytics Entries */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{isSpanish ? "Entradas Recientes" : "Recent Entries"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(analytics || []).slice(0, 10).map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium capitalize">{entry.platform}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(entry.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{isSpanish ? "Alcance" : "Reach"}: {formatNumber(entry.metrics.reach)}</span>
                              <span>Eng: {formatNumber(entry.metrics.engagement)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* Empty state — no analytics data yet */
                <Card>
                  <CardContent className="py-16">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {isSpanish ? "Sin datos de analytics" : "No analytics data yet"}
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        {isSpanish
                          ? "Los datos de analytics aparecerán aquí cuando tus plataformas conectadas empiecen a generar métricas."
                          : "Analytics data will appear here once your connected platforms start generating metrics."}
                      </p>
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
