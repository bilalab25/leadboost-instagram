import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/useLanguage";
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


function Router() {
  return (
    <Switch>
      {/* Rutas públicas: Accesibles para todos, incluyendo no autenticados */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/spanish-preview" component={SpanishPreview} />

      {/* Rutas de la aplicación - PROTEGIDAS por PrivateRoute */}
      {/* Si el usuario no está autenticado, PrivateRoute lo redirigirá a /login */}
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

      {/* Ruta 404 para cualquier otra ruta no definida */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;