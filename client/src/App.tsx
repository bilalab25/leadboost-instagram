import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SitePasswordGate from "@/components/SitePasswordGate";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
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
import CampAIgner from "@/pages/waterfall";
import BrandStudio from "@/pages/brand-studio";
import Pricing from "@/pages/pricing";
import Approvals from "@/pages/approvals";

function Router() {
  // Remove auth checking from router to prevent infinite loops

  return (
    <Switch>
      {/* Always show landing page at root */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/spanish-preview" component={SpanishPreview} />
      
      {/* App routes - authentication will be handled by individual pages */}
      <Route path="/home" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/inbox" component={Inbox} />
      <Route path="/ai-planner" component={AIPlanner} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/customers" component={Customers} />
      <Route path="/team" component={Team} />
      <Route path="/approvals" component={Approvals} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/waterfall" component={CampAIgner} />
      <Route path="/campaigner" component={CampAIgner} />
      <Route path="/demo" component={CampAIgner} />
      <Route path="/brand-studio" component={BrandStudio} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SitePasswordGate>
          <Router />
        </SitePasswordGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;