import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  MessageSquare, 
  Zap, 
  BarChart3, 
  Users, 
  Calendar,
  LogOut,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { activeMembership } = useBrand();
  const { isSpanish } = useLanguage();

  // Check if the brand has incomplete onboarding
  const { data: onboardingProgress } = useQuery<{ 
    hasIncompleteBrand: boolean;
    onboardingStep: number | null;
    onboardingCompleted: boolean;
  }>({
    queryKey: ["/api/onboarding/progress"],
    enabled: !!activeMembership?.brandId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats", { brandId: activeMembership?.brandId }],
    enabled: !!activeMembership?.brandId,
  });

  // Use server-provided flag to determine if onboarding is incomplete
  const isOnboardingIncomplete = onboardingProgress?.hasIncompleteBrand === true && 
    onboardingProgress?.onboardingCompleted !== true;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch {
      // Ignore errors
    }
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-brand-600">CampAIgner</div>
              <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=3b82f6&color=fff`}
                  alt={`${user?.firstName} ${user?.lastName}`}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSpanish ? "¡Bienvenido de vuelta" : "Welcome back"}, {activeMembership?.brandName || "User"}!
          </h1>
          <p className="text-lg text-gray-600">
            {isSpanish 
              ? "Tu dashboard de gestión de redes sociales con IA está listo."
              : "Your AI-powered social media management dashboard is ready."}
          </p>
        </div>

        {/* Continue Onboarding Banner */}
        {isOnboardingIncomplete && (
          <Alert className="mb-8 border-gradient-to-r from-teal-500 to-cyan-500 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
            <Sparkles className="h-5 w-5 text-teal-600" />
            <AlertTitle className="text-teal-800 font-semibold">
              {isSpanish ? "¡Completa tu configuración!" : "Complete your setup!"}
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-teal-700">
                {isSpanish 
                  ? "Continúa configurando tu marca para desbloquear todas las funciones de IA y automatización."
                  : "Continue setting up your brand to unlock all AI and automation features."}
              </span>
              <Button 
                onClick={() => window.location.href = "/onboarding"}
                className="ml-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                {isSpanish ? "Continuar" : "Continue"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/inbox"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unified Inbox</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold">{stats?.unreadMessages ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/campaigns"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Campaigns</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold">{stats?.activeCampaigns ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Active campaigns</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/analytics"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold">{stats?.responseTime ?? "N/A"}</div>
              )}
              <p className="text-xs text-muted-foreground">Avg response time</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/integrations"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalSocialAccounts ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Social accounts</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/ai-planner"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Planner</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold">{stats?.aiPosts ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Planned posts</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/dashboard"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dashboard</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">View</div>
              <p className="text-xs text-muted-foreground">Full dashboard</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{isSpanish ? "Actividad Reciente" : "Recent Activity"}</CardTitle>
            <CardDescription>
              {isSpanish ? "Tu actividad más reciente" : "Your latest activity"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                {isSpanish
                  ? "La actividad aparecerá aquí a medida que uses la plataforma."
                  : "Activity will appear here as you use the platform."}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}