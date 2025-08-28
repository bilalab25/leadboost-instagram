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
  const t = translations['es']; // Force Spanish for demo
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
              
              <Button className="bg-gradient-to-r from-brand-500 to-purple-600 text-white border-none hover:from-brand-600 hover:to-purple-700" data-testid="button-waterfall-campaign">
                <Zap className="mr-2 h-4 w-4" />
                Crear Campaña Waterfall
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
                      Aquí tienes un resumen de tu {
                        selectedPeriod === 'weekly' ? 'semana' :
                        selectedPeriod === 'monthly' ? 'mes' : 'día'
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* Removed duplicate Waterfall button - now in header */}
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
                    Esta semana
                  </button>
                  <button 
                    onClick={() => setSelectedPeriod('monthly')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      selectedPeriod === 'monthly' 
                        ? 'bg-brand-100 text-brand-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Este mes
                  </button>
                  <button 
                    onClick={() => setSelectedPeriod('daily')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      selectedPeriod === 'daily' 
                        ? 'bg-brand-100 text-brand-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Hoy
                  </button>
                </div>
              </div>
              
              {/* Revenue and Campaigns - Sleek Brand Design */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 mb-8">
                {/* Revenue - Takes 3 columns for maximum importance */}
                <div className="lg:col-span-3">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-brand-25 border border-brand-100 shadow-sm h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent"></div>
                    <div className="relative p-8 h-full flex flex-col justify-center">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-4">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 mr-3"></div>
                            <h3 className="text-lg font-medium text-gray-600">
                              Tus Ventas
                            </h3>
                          </div>
                          <div className="text-6xl font-bold text-green-600 mb-3">
                            +{(() => {
                              if (selectedPeriod === 'weekly') return '47%';
                              if (selectedPeriod === 'monthly') return '63%';
                              if (selectedPeriod === 'daily') return '12%';
                              return '47%';
                            })()}
                          </div>
                          <div className="flex items-center text-gray-600 text-base font-medium mb-2">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2">
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            vs antes de LeadBoost
                          </div>
                          <div className="text-sm text-gray-500">
                            Datos del POS conectado • {(() => {
                              if (selectedPeriod === 'weekly') return 'Última semana';
                              if (selectedPeriod === 'monthly') return 'Último mes';
                              if (selectedPeriod === 'daily') return 'Hoy';
                              return 'Última semana';
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Campaigns - Takes 1 column, same height */}
                <div>
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-25 border border-gray-100 shadow-sm h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600/3 to-transparent"></div>
                    <div className="relative p-8 h-full flex flex-col justify-center">
                      <div className="flex items-center mb-4">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-brand-400 to-brand-500 mr-3"></div>
                        <h3 className="text-lg font-medium text-gray-600">
                          Campañas
                        </h3>
                      </div>
                      <div className="text-4xl font-bold text-gray-900 mb-4">
                        {(() => {
                          if (selectedPeriod === 'weekly') return '7';
                          if (selectedPeriod === 'monthly') return '28';
                          if (selectedPeriod === 'daily') return '1';
                          return '7';
                        })()}
                      </div>
                      <div className="space-y-3">
                        <div className="text-lg text-brand-600 font-bold">
                          {(() => {
                            if (selectedPeriod === 'weekly') return '× 21 plataformas = 147 posts';
                            if (selectedPeriod === 'monthly') return '× 21 plataformas = 588 posts';
                            if (selectedPeriod === 'daily') return '× 21 plataformas = 21 posts';
                            return '× 21 plataformas = 147 posts';
                          })()}
                        </div>
                        <div className="flex items-center text-brand-600 text-sm font-medium">
                          <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center mr-2">
                            <svg className="w-2.5 h-2.5 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          {(() => {
                            if (selectedPeriod === 'weekly') return '+4 esta semana';
                            if (selectedPeriod === 'monthly') return '+4 este mes';
                            if (selectedPeriod === 'daily') return '+1 hoy';
                            return '+4 esta semana';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* POS Connection Banner - Only show if POS not connected */}
              {!user?.posConnected && (
                <div className="mb-6">
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-100 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mr-4">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-1">
                            💡 Conecta tu POS para métricas de ventas reales
                          </h4>
                          <p className="text-sm text-gray-600">
                            Ve tu ROI exacto y crecimiento de ingresos vs antes de LeadBoost
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button className="px-4 py-2 bg-white text-brand-600 rounded-lg border border-brand-200 hover:bg-brand-50 transition-colors text-sm font-medium">
                          Más tarde
                        </button>
                        <button className="px-6 py-2 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-lg hover:from-brand-600 hover:to-purple-700 transition-all text-sm font-medium shadow-sm">
                          Configurar POS
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Simplified Dashboard - Single Column Layout */}
              <div className="space-y-8">
                
                {/* Main Content */}
                <div className="space-y-8">
                  
                  {/* Unified Inbox */}
                  <Card>
                    <CardHeader className="border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <CardTitle>{t.messages.unifiedInbox}</CardTitle>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" className="text-xs" data-testid="button-filter-all">
                            Todos
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs" data-testid="button-filter-unread">
                            No Leídos (12)
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs" data-testid="button-filter-urgent">
                            Urgentes
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs" data-testid="button-filter-important">
                            Importantes
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs" data-testid="button-filter-yesterday">
                            Ayer
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
                          {t.aiPlanner.generateContent}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                          <Sparkles className="h-8 w-8 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{t.aiPlanner.smartContentTitle}</h3>
                        <p className="text-gray-500 mb-6">{t.aiPlanner.smartContentDescription}</p>
                        <Button className="bg-gradient-to-r from-brand-500 to-purple-600 text-white border-none hover:from-brand-600 hover:to-purple-700">
                          <Target className="mr-2 h-4 w-4" />
                          {t.aiPlanner.waterfallSystem}
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
