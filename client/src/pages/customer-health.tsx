import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { CustomerHealthScore } from "@/components/CustomerHealthScore";
import { GoalTracking } from "@/components/GoalTracking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingUp, Users, Activity, BarChart3, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";

export default function CustomerHealth() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { language } = useLanguage();
  const t = translations['es']; // Force Spanish for demo

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
              <h1 className="ml-3 text-2xl font-bold text-gray-900" data-testid="text-customer-health-title">
                Salud del Cliente
              </h1>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Customer Health Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              
              {/* Welcome Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Salud y Objetivos del Cliente
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Monitoreo completo del estado de tu negocio y progreso hacia tus metas
                    </p>
                  </div>
                </div>
              </div>
              
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
              
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}