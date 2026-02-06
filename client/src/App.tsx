import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/useLanguage";
import { BrandProvider } from "@/contexts/BrandContext";
import OnboardingGuard from "@/components/OnboardingGuard";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
// Importa tu componente PrivateRoute
import PrivateRoute from "@/components/PrivateRoute"; // <--- IMPORTACIÓN CLAVE

// Importa todos tus componentes de página
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Inbox from "@/pages/inbox";
import AIPlanner from "@/pages/ai-planner";
import Calendar from "@/pages/calendar";
import Analytics from "@/pages/analytics";
import Campaigns from "@/pages/campaigns";
import Customers from "@/pages/customers";
import Team from "@/pages/team";
import Integrations from "@/pages/integrations";
import SpanishPreview from "@/pages/spanish-preview";
import CampAIgner from "@/pages/waterfall"; // Asumo que waterfall es CampAIgner
import BrandStudio from "@/pages/brand-studio";
import Pricing from "@/pages/pricing";
import Approvals from "@/pages/approvals";
import Settings from "./pages/settings";
import PrivacyPolicy from "@/pages/privacy-policy";
import FlowBuilder from "@/pages/flow-builder";
import FlowsDashboard from "@/pages/flows-dashboard";
import Onboarding from "@/pages/onboarding";
import WhatsAppTemplates from "@/pages/whatsapp-templates";
import Sales from "@/pages/sales";
import Boosty from "@/pages/boosty";
import WaitList from "./pages/waitlist";

function Router() {
  return (
    <Switch>
      {/* Rutas públicas: Accesibles para todos, incluyendo no autenticados */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/spanish-preview" component={SpanishPreview} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/waitlist" component={WaitList} />
      {/* Rutas de la aplicación - PROTEGIDAS por PrivateRoute */}
      {/* Si el usuario no está autenticado, PrivateRoute lo redirigirá a /login */}
      {/* Onboarding is a special case - requires auth but not brands */}
      <PrivateRoute path="/onboarding" component={Onboarding} />
      <PrivateRoute path="/home" component={Home} />
      <PrivateRoute path="/dashboard" component={Dashboard} />
      <PrivateRoute path="/inbox" component={Inbox} />
      <PrivateRoute path="/ai-planner" component={AIPlanner} />
      <PrivateRoute path="/calendar" component={Calendar} />
      <PrivateRoute path="/analytics" component={Analytics} />
      <PrivateRoute path="/campaigns" component={Campaigns} />
      <PrivateRoute path="/customers" component={Customers} />
      <PrivateRoute path="/team" component={Team} />
      <PrivateRoute path="/approvals" component={Approvals} />
      <PrivateRoute path="/integrations" component={Integrations} />
      <PrivateRoute path="/waterfall" component={CampAIgner} />
      <PrivateRoute path="/campaigner" component={CampAIgner} />
      <PrivateRoute path="/demo" component={CampAIgner} />
      <PrivateRoute path="/brand-studio" component={BrandStudio} />
      <PrivateRoute path="/settings" component={Settings} />
      <PrivateRoute path="/flows-dashboard" component={FlowsDashboard} />
      <PrivateRoute path="/flow-builder/:id" component={FlowBuilder} />
      <PrivateRoute path="/whatsapp-templates" component={WhatsAppTemplates} />
      <PrivateRoute path="/sales" component={Sales} />
      <PrivateRoute path="/boosty" component={Boosty} />
      {/* Ruta 404 para cualquier otra ruta no definida */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <BrandProvider>
          <OnboardingGuard>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </OnboardingGuard>
        </BrandProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
