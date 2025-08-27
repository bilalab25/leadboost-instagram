import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
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
import Waterfall from "@/pages/waterfall";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/" component={Landing} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/ai-planner" component={AIPlanner} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/customers" component={Customers} />
      <Route path="/team" component={Team} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/waterfall" component={Waterfall} />
      <Route path="/spanish-preview" component={SpanishPreview} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
