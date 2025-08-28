import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
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
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const t = translations[language];
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'daily'>('weekly');

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: language === 'es' ? "No Autorizado" : "Unauthorized",
        description: language === 'es' ? "Has cerrado sesión. Iniciando sesión nuevamente..." : "You are logged out. Logging in again...",
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
        title: language === 'es' ? "¡Éxito!" : "Success!",
        description: language === 'es' ? "Los datos demo han sido cargados. ¡Actualiza para ver todo el contenido!" : "Demo data has been populated. Refresh to see all the content!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: language === 'es' ? "No Autorizado" : "Unauthorized",
          description: language === 'es' ? "Has cerrado sesión. Iniciando sesión nuevamente..." : "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: language === 'es' ? "Error" : "Error",
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
                {populateDemoDataMutation.isPending ? t.common.loading : t.common.loadDemoData}
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
              
              {/* Welcome Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {t.dashboard.welcomeBack}, {user?.firstName || 'Usuario'}!
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {t.dashboard.overview}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      size="sm"
                      variant="outline"
                      className="bg-gradient-to-r from-brand-500 to-purple-600 text-white border-none hover:from-brand-600 hover:to-purple-700"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Waterfall
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Period Selector */}
              <div className="flex justify-end mb-6">
                <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
                  <button 
                    onClick={() => setSelectedPeriod('weekly')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      selectedPeriod === 'weekly' 
                        ? 'bg-brand-100 text-brand-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Semanal
                  </button>
                  <button 
                    onClick={() => setSelectedPeriod('monthly')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      selectedPeriod === 'monthly' 
                        ? 'bg-brand-100 text-brand-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Mensual
                  </button>
                  <button 
                    onClick={() => setSelectedPeriod('daily')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      selectedPeriod === 'daily' 
                        ? 'bg-brand-100 text-brand-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Diario
                  </button>
                </div>
              </div>
              
              {/* Revenue and Campaigns - Revenue Priority */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
                {/* Revenue - Takes 2 columns for more importance */}
                <div className="sm:col-span-2">
                  <StatsCard
                    title={(() => {
                      if (selectedPeriod === 'weekly') return 'Ingresos Semanales';
                      if (selectedPeriod === 'monthly') return 'Ingresos Mensuales';
                      if (selectedPeriod === 'daily') return 'Ingresos Diarios';
                      return 'Ingresos Semanales';
                    })()}
                    value={`$${(() => {
                      const baseRevenue = stats?.revenue || 100000;
                      if (selectedPeriod === 'weekly') return Math.round(baseRevenue / 4.33).toLocaleString();
                      if (selectedPeriod === 'monthly') return baseRevenue.toLocaleString();
                      if (selectedPeriod === 'daily') return Math.round(baseRevenue / 30).toLocaleString();
                      return Math.round(baseRevenue / 4.33).toLocaleString();
                    })()}`}
                    change={(() => {
                      if (selectedPeriod === 'weekly') return '+12% esta semana';
                      if (selectedPeriod === 'monthly') return '+8% este mes';
                      if (selectedPeriod === 'daily') return '+5% hoy';
                      return '+12% esta semana';
                    })()}
                    changeType="increase"
                    icon="dollar"
                    loading={statsLoading}
                  />
                </div>
                {/* Campaigns - Takes 1 column */}
                <div>
                  <StatsCard
                    title={(() => {
                      if (selectedPeriod === 'weekly') return 'Campañas Semanales';
                      if (selectedPeriod === 'monthly') return 'Campañas Mensuales';
                      if (selectedPeriod === 'daily') return 'Campañas Diarias';
                      return 'Campañas Semanales';
                    })()}
                    value={(() => {
                      if (selectedPeriod === 'weekly') return '7';
                      if (selectedPeriod === 'monthly') return '28';
                      if (selectedPeriod === 'daily') return '1';
                      return '7';
                    })()}
                    change={(() => {
                      if (selectedPeriod === 'weekly') return '+2 esta semana';
                      if (selectedPeriod === 'monthly') return '+4 este mes';
                      if (selectedPeriod === 'daily') return '+1 hoy';
                      return '+2 esta semana';
                    })()}
                    changeType="increase"
                    icon="chart"
                    loading={statsLoading}
                  />
                </div>
              </div>
              
              {/* Simplified Dashboard - Single Column Layout */}
              <div className="space-y-8">
                
                {/* Main Content */}
                <div className="space-y-8">
                  
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
                  
                  {/* Simple AI Content Planner */}
                  <Card>
                    <CardHeader className="border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <Sparkles className="mr-2 h-5 w-5 text-amber-500" />
                          {t.aiPlanner.title}
                        </CardTitle>
                        <Button size="sm" className="bg-brand-600 hover:bg-brand-700" data-testid="button-generate-content">
                          <Zap className="mr-2 h-4 w-4" />
                          Generar Contenido
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                          <Sparkles className="h-8 w-8 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Contenido Inteligente para tus Marcas</h3>
                        <p className="text-gray-500 mb-6">Genera automáticamente posts optimizados para todas tus plataformas sociales con un solo clic.</p>
                        <Button className="bg-gradient-to-r from-brand-500 to-purple-600 text-white border-none hover:from-brand-600 hover:to-purple-700">
                          <Target className="mr-2 h-4 w-4" />
                          Waterfall System
                          <ArrowRight className="ml-2 h-4 w-4" />
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
