import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import MessageList from "@/components/MessageList";
import ContentCalendar from "@/components/ContentCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Plus, Database, Sparkles, Zap, Target, ArrowRight } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";

interface DashboardStats {
  unreadMessages: number;
  engagementRate: number;
  aiPosts: number;
  revenue: number;
}

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  createdAt: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const t = translations[language];

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

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
    retry: false,
  });

  const populateDemoDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/populate-demo-data");
      return response.json();
    },
    onSuccess: () => {
      // Refresh all data
      queryClient.invalidateQueries();
      toast({
        title: "Success!",
        description: "Demo data has been populated. Refresh to see all the content!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <div className="flex-1 px-4 flex justify-between sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
            <div className="flex-1 flex items-center">
              <h1 className="ml-3 text-2xl font-bold text-gray-900" data-testid="text-dashboard-title">{t.sidebar.dashboard}</h1>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => populateDemoDataMutation.mutate()}
                disabled={populateDemoDataMutation.isPending}
                data-testid="button-populate-demo"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Database className="mr-2 h-4 w-4" />
                {populateDemoDataMutation.isPending ? t.common.loading : "Cargar Datos Demo"}
              </Button>
              
              <Button className="bg-brand-600 hover:bg-brand-700 text-white" data-testid="button-new-campaign">
                <Plus className="mr-2 h-4 w-4" />
                {t.campaigns.newCampaign}
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              
              {/* Waterfall System Hero - Primary Feature */}
              <div className="mb-12">
                <Card className="bg-gradient-to-br from-brand-50 to-purple-50 border-brand-200 shadow-lg">
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                          <Sparkles className="h-10 w-10 text-white" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-gray-900">{language === 'es' ? 'Sistema Waterfall' : 'Waterfall System'}</h2>
                          <p className="text-brand-600 font-semibold">{language === 'es' ? 'Una idea → Todos lados' : 'One idea → Everywhere'}</p>
                        </div>
                      </div>
                      <p className="text-lg text-gray-700 mb-6 max-w-3xl mx-auto">
                        {language === 'es' 
                          ? 'Convierte una sola idea en campañas optimizadas para 21+ plataformas. Todo en el formato correcto, al tamaño perfecto, listo para lanzar.' 
                          : 'Turn one idea into optimized campaigns across 21+ platforms. All in the right format, perfect size, ready to launch.'}
                      </p>
                    </div>
                    
                    {/* Waterfall Visual Flow */}
                    <div className="bg-white rounded-2xl p-6 shadow-inner border border-gray-100 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        
                        {/* ONE IDEA */}
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                            <Target className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-green-600 mb-1">{language === 'es' ? 'UNA IDEA' : 'ONE IDEA'}</h3>
                          <p className="text-sm text-gray-600">"Lanzar producto nuevo"</p>
                        </div>
                        
                        {/* ARROW */}
                        <div className="flex justify-center">
                          <ArrowRight className="h-6 w-6 text-brand-400 hidden md:block" />
                        </div>
                        
                        {/* PLATFORMS */}
                        <div className="text-center">
                          <div className="grid grid-cols-3 gap-2 mb-3 max-w-32 mx-auto">
                            <SiInstagram className="w-8 h-8 text-pink-500" />
                            <SiTiktok className="w-8 h-8 text-gray-800" />
                            <SiFacebook className="w-8 h-8 text-blue-600" />
                            <SiWhatsapp className="w-8 h-8 text-green-500" />
                            <SiLinkedin className="w-8 h-8 text-blue-700" />
                            <SiYoutube className="w-8 h-8 text-red-600" />
                          </div>
                          <h3 className="text-xl font-bold text-purple-600 mb-1">{language === 'es' ? 'TODOS LADOS' : 'EVERYWHERE'}</h3>
                          <p className="text-sm text-gray-600">{language === 'es' ? '21+ Plataformas' : '21+ Platforms'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* CTA Button */}
                    <div className="text-center">
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
                        data-testid="button-start-waterfall"
                      >
                        <Zap className="mr-2 h-5 w-5" />
                        {language === 'es' ? 'Crear Campaña Waterfall' : 'Create Waterfall Campaign'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Stats Overview */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatsCard
                  title={t.dashboard.unreadMessages}
                  value={stats?.unreadMessages?.toString() || "0"}
                  change="+12%"
                  changeType="increase"
                  icon="message"
                  loading={statsLoading}
                />
                <StatsCard
                  title={t.dashboard.monthlyEngagement}
                  value={`${stats?.engagementRate || 0}%`}
                  change="+2.1%"
                  changeType="increase"
                  icon="chart"
                  loading={statsLoading}
                />
                <StatsCard
                  title={language === 'es' ? "Posts Generados por IA" : "AI Generated Posts"}
                  value={stats?.aiPosts?.toString() || "0"}
                  change="+8.3%"
                  changeType="increase"
                  icon="robot"
                  loading={statsLoading}
                />
                <StatsCard
                  title={language === 'es' ? "Impacto en Ingresos" : "Revenue Impact"}
                  value={`$${((stats?.revenue || 0) / 1000).toFixed(1)}k`}
                  change="+15.2%"
                  changeType="increase"
                  icon="dollar"
                  loading={statsLoading}
                />
              </div>
              
              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                
                {/* Left Column - Unified Inbox & AI Planner */}
                <div className="xl:col-span-2 space-y-8">
                  
                  {/* Unified Inbox */}
                  <Card>
                    <CardHeader className="border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <CardTitle>{t.messages.unifiedInbox}</CardTitle>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" data-testid="button-all-channels">
                            {t.messages.allChannels}
                          </Button>
                          <Button size="sm" className="bg-brand-600 hover:bg-brand-700" data-testid="button-mark-all-read">
                            {t.messages.markAllRead}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <MessageList limit={5} showHeader={false} />
                    </CardContent>
                  </Card>
                  
                  {/* AI Monthly Planner */}
                  <Card>
                    <CardHeader className="border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CardTitle>{t.aiPlanner.title}</CardTitle>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {t.common.aiPowered}
                          </span>
                        </div>
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700" data-testid="button-regenerate-plan">
                          {language === 'es' ? "Regenerar Plan" : "Regenerate Plan"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ContentCalendar />
                    </CardContent>
                  </Card>
                  
                </div>
                
                {/* Right Column - Analytics & Recent Activity */}
                <div className="space-y-8">
                  
                  {/* Analytics */}
                  <Card>
                    <CardHeader className="border-b border-gray-200">
                      <CardTitle>{t.analytics.performanceAnalytics}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t.analytics.totalReach}</p>
                            <p className="text-xs text-gray-500">{t.analytics.lastDays}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900" data-testid="text-total-reach">125.3K</p>
                            <p className="text-xs text-green-600">+12.5%</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t.analytics.engagement}</p>
                            <p className="text-xs text-gray-500">{t.analytics.averageRate}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900" data-testid="text-engagement">4.8%</p>
                            <p className="text-xs text-green-600">+2.1%</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t.analytics.conversions}</p>
                            <p className="text-xs text-gray-500">{t.analytics.socialToPOS}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900" data-testid="text-conversions">3.2%</p>
                            <p className="text-xs text-green-600">+0.8%</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Recent Activity */}
                  <Card>
                    <CardHeader className="border-b border-gray-200">
                      <CardTitle>{t.dashboard.recentActivity}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {activitiesLoading ? (
                          <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 animate-pulse"></div>
                                <div className="flex-1 space-y-1">
                                  <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : activities && activities.length > 0 ? (
                          activities.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-${activity.id}`}>
                              <div className="flex-shrink-0">
                                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">{activity.description}</p>
                                <p className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500" data-testid="text-no-activity">{language === 'es' ? 'Sin actividad reciente' : 'No recent activity'}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader className="border-b border-gray-200">
                      <CardTitle>{t.dashboard.quickActions}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 gap-3">
                        <Button variant="outline" className="justify-center" data-testid="button-create-post">
                          <Plus className="mr-2 h-4 w-4" />
                          {t.actions.createNewPost}
                        </Button>
                        
                        <Button variant="outline" className="justify-center" data-testid="button-generate-content">
                          <span className="mr-2">🤖</span>
                          {t.actions.generateContent}
                        </Button>
                        
                        <Button variant="outline" className="justify-center" data-testid="button-schedule-posts">
                          <span className="mr-2">📅</span>
                          {t.actions.schedulePosts}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
