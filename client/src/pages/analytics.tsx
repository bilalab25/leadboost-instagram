import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { CustomerHealthScore } from "@/components/CustomerHealthScore";
import { GoalTracking } from "@/components/GoalTracking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Download, TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share, DollarSign, Users, Instagram, Activity, BarChart3, Lightbulb, Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SiWhatsapp, SiTiktok } from "react-icons/si";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface Analytics {
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

interface DashboardStats {
  unreadMessages: number;
  engagementRate: number;
  aiPosts: number;
  revenue: number;
}

const platformIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
  tiktok: SiTiktok,
};

const platformColors = {
  instagram: "text-pink-500 bg-pink-50 border-pink-200",
  whatsapp: "text-green-500 bg-green-50 border-green-200",
  email: "text-primary bg-primary/5 border-primary/20",
  tiktok: "text-gray-800 bg-gray-50 border-gray-200",
};

const timeRanges = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
];

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
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
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics[]>({
    queryKey: ["/api/analytics"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Mock performance data for demonstration since we don't have real analytics data
  const performanceData = {
    totalReach: "125.3K",
    totalEngagement: "8.2K", 
    conversionRate: "3.2%",
    revenueImpact: "$12.4K",
    growthRate: "+15.2%",
  };

  const platformPerformance = [
    { platform: "instagram", reach: 45000, engagement: 3200, conversions: 85, revenue: 4200 },
    { platform: "whatsapp", reach: 32000, engagement: 2800, conversions: 120, revenue: 5100 },
    { platform: "email", reach: 28000, engagement: 1800, conversions: 95, revenue: 2600 },
    { platform: "tiktok", reach: 20300, engagement: 400, conversions: 25, revenue: 500 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <TopHeader pageName="Analytics" />

        {/* Analytics Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              
              {/* Key Metrics Overview */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                          <Eye className="text-white h-5 w-5" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Reach</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900" data-testid="metric-total-reach">
                              {performanceData.totalReach}
                            </div>
                            <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                              <TrendingUp className="text-xs mr-1 h-3 w-3" />
                              <span>12.5%</span>
                            </div>
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
                          <Heart className="text-white h-5 w-5" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Engagement</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900" data-testid="metric-engagement">
                              {performanceData.totalEngagement}
                            </div>
                            <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                              <TrendingUp className="text-xs mr-1 h-3 w-3" />
                              <span>8.3%</span>
                            </div>
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
                          <Share className="text-white h-5 w-5" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900" data-testid="metric-conversion">
                              {performanceData.conversionRate}
                            </div>
                            <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                              <TrendingUp className="text-xs mr-1 h-3 w-3" />
                              <span>2.1%</span>
                            </div>
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
                          <dt className="text-sm font-medium text-gray-500 truncate">Revenue Impact</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900" data-testid="metric-revenue">
                              {performanceData.revenueImpact}
                            </div>
                            <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                              <TrendingUp className="text-xs mr-1 h-3 w-3" />
                              <span>{performanceData.growthRate}</span>
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                  <TabsTrigger value="business" data-testid="tab-business">Business Intelligence</TabsTrigger>
                  <TabsTrigger value="platforms" data-testid="tab-platforms">Platforms</TabsTrigger>
                  <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
                  <TabsTrigger value="audience" data-testid="tab-audience">Audience</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Performance Chart */}
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Performance Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-brand-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                              <TrendingUp className="h-8 w-8 text-brand-600" />
                            </div>
                            <p className="text-sm text-gray-600" data-testid="text-chart-placeholder">
                              Performance chart visualization would go here
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Integration with Chart.js or similar charting library
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top Performing Content */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Performing Content</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                                <Instagram className="text-white h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Product Showcase Video</p>
                                <p className="text-xs text-gray-500">2.4K engagements</p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">+24%</Badge>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                <SiWhatsapp className="text-white h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Customer Stories</p>
                                <p className="text-xs text-gray-500">1.8K interactions</p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">+18%</Badge>
                          </div>

                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                <SiTiktok className="text-white h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Behind the Scenes</p>
                                <p className="text-xs text-gray-500">3.2K views</p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">+35%</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">Campaign performance increased by 15%</p>
                              <p className="text-xs text-gray-500">2 hours ago</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">New followers gained: +245</p>
                              <p className="text-xs text-gray-500">5 hours ago</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">Viral TikTok video: 50K views</p>
                              <p className="text-xs text-gray-500">1 day ago</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Business Intelligence Tab */}
                <TabsContent value="business" className="space-y-6">
                  {/* Customer Health & Goal Tracking */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                    <CustomerHealthScore isSpanish={true} />
                    <GoalTracking isSpanish={true} />
                  </div>
                  
                  {/* Revenue Intelligence & Usage Analytics */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Revenue Intelligence */}
                    <Card className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                          Inteligencia de Ingresos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="text-3xl font-bold text-green-600 mb-2">$52,800</div>
                            <div className="text-sm text-gray-600 mb-4">Ingresos Recurrentes Mensuales</div>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              +23% vs mes anterior
                            </Badge>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-blue-600 mb-2">$8,450</div>
                            <div className="text-sm text-gray-600 mb-4">Valor de Vida del Cliente</div>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              Promedio industria: $6,200
                            </Badge>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-purple-600 mb-2">94%</div>
                            <div className="text-sm text-gray-600 mb-4">Tasa de Retención</div>
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              Excelente salud financiera
                            </Badge>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-orange-600 mb-2">$2,100</div>
                            <div className="text-sm text-gray-600 mb-4">Oportunidad de Expansión</div>
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              4 clientes listos para upgrade
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Feature Adoption */}
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Activity className="h-5 w-5 text-blue-600 mr-2" />
                          Adopción de Funciones
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Chatbot IA</span>
                            <div className="flex items-center">
                              <div className="w-16 h-2 bg-green-200 rounded-full mr-2">
                                <div className="w-full h-2 bg-green-600 rounded-full"></div>
                              </div>
                              <span className="text-sm font-medium text-green-600">100%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Calendario IA</span>
                            <div className="flex items-center">
                              <div className="w-16 h-2 bg-blue-200 rounded-full mr-2">
                                <div className="w-14 h-2 bg-blue-600 rounded-full"></div>
                              </div>
                              <span className="text-sm font-medium text-blue-600">87%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Automatización</span>
                            <div className="flex items-center">
                              <div className="w-16 h-2 bg-yellow-200 rounded-full mr-2">
                                <div className="w-10 h-2 bg-yellow-600 rounded-full"></div>
                              </div>
                              <span className="text-sm font-medium text-yellow-600">62%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Analytics</span>
                            <div className="flex items-center">
                              <div className="w-16 h-2 bg-red-200 rounded-full mr-2">
                                <div className="w-6 h-2 bg-red-600 rounded-full"></div>
                              </div>
                              <span className="text-sm font-medium text-red-600">34%</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Ver Tutorial de Analytics
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Actionable Insights */}
                  <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Lightbulb className="h-5 w-5 text-amber-600 mr-2" />
                        Insights Accionables - Esta Semana
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-lg border border-amber-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">Oportunidad de Expansión</h4>
                              <p className="text-sm text-gray-600 mb-3">
                                4 clientes están listos para upgrade basado en su alto uso del chatbot.
                              </p>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                Ver Lista de Clientes
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-amber-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <BarChart3 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">Impulsar Analytics</h4>
                              <p className="text-sm text-gray-600 mb-3">
                                Solo 34% usa Analytics. Configurar dashboards podría aumentar retención.
                              </p>
                              <Button size="sm" variant="outline" className="border-blue-200 text-blue-600">
                                Enviar Tutorial
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-amber-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">Programa Referidos</h4>
                              <p className="text-sm text-gray-600 mb-3">
                                Clientes con ROI &gt;40% son candidatos perfectos para referir amigos.
                              </p>
                              <Button size="sm" variant="outline" className="border-purple-200 text-purple-600">
                                Invitar a Referir
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Platforms Tab */}
                <TabsContent value="platforms" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {platformPerformance.map((platform) => {
                      const Icon = platformIcons[platform.platform as keyof typeof platformIcons];
                      const colorClass = platformColors[platform.platform as keyof typeof platformColors];
                      
                      return (
                        <Card key={platform.platform} className={cn("border", colorClass)}>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              {Icon && <Icon className="mr-2 h-5 w-5" />}
                              {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-2xl font-bold" data-testid={`${platform.platform}-reach`}>
                                  {(platform.reach / 1000).toFixed(1)}K
                                </p>
                                <p className="text-sm text-gray-500">Reach</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold" data-testid={`${platform.platform}-engagement`}>
                                  {(platform.engagement / 1000).toFixed(1)}K
                                </p>
                                <p className="text-sm text-gray-500">Engagement</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold" data-testid={`${platform.platform}-conversions`}>
                                  {platform.conversions}
                                </p>
                                <p className="text-sm text-gray-500">Conversions</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold" data-testid={`${platform.platform}-revenue`}>
                                  ${(platform.revenue / 1000).toFixed(1)}K
                                </p>
                                <p className="text-sm text-gray-500">Revenue</p>
                              </div>
                            </div>
                            
                            <div className="pt-4 border-t">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Engagement Rate</span>
                                <span className="text-sm font-medium">
                                  {((platform.engagement / platform.reach) * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div 
                                  className="bg-current h-2 rounded-full" 
                                  style={{ width: `${(platform.engagement / platform.reach) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Performance Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-content-analysis">
                          Content Analytics
                        </h3>
                        <p className="text-gray-600">
                          Detailed content performance metrics and insights will be displayed here.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Audience Tab */}
                <TabsContent value="audience" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Audience Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-audience-insights">
                          Audience Demographics
                        </h3>
                        <p className="text-gray-600">
                          Audience analysis, demographics, and behavior insights will be shown here.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
