import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
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

  const handleLogout = () => {
    window.location.href = "/api/logout";
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
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/campaigns"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Campaigns</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">Active campaigns</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/analytics"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.7%</div>
              <p className="text-xs text-muted-foreground">Engagement rate</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/team"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Team members</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/ai-planner"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Planner</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
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
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest AI-generated campaigns and messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                <Zap className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">AI Campaign Generated</h4>
                  <p className="text-sm text-gray-600">Created monthly campaign for Renuve Aesthetics Bar</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">High Priority Message</h4>
                  <p className="text-sm text-gray-600">New urgent message from Carlos Rivera about surgery confirmation</p>
                  <p className="text-xs text-gray-500 mt-1">30 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Performance Report</h4>
                  <p className="text-sm text-gray-600">Weekly analytics report is ready for review</p>
                  <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}