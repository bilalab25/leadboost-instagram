import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import MessageList from "@/components/MessageList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, Search, Star, Archive, Flag, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import HelpChatbot from "@/components/HelpChatbot";
import { Instagram, Mail, Twitter } from "lucide-react";
import { SiWhatsapp, SiTiktok, SiFacebook } from "react-icons/si";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBrand } from "@/contexts/BrandContext";
import { useQuery } from "@tanstack/react-query";

interface InboxStats {
  totalMessages: number;
  unread: number;
  urgent: number;
  avgResponseTime: string;
  conversationCount: number;
}

export default function Inbox() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isSpanish } = useLanguage();
  const { activeBrandId } = useBrand();

  const [integrations, setIntegrations] = useState<any[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>(
    undefined,
  );
  const [selectedFlag, setSelectedFlag] = useState<
    "all" | "none" | "important" | "archived"
  >("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch inbox statistics from the API
  const { data: inboxStats, isLoading: statsLoading } = useQuery<InboxStats>({
    queryKey: ["/api/inbox/stats", activeBrandId],
    queryFn: async () => {
      const res = await fetch(`/api/inbox/stats?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch inbox stats");
      return res.json();
    },
    enabled: isAuthenticated && !!activeBrandId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Redirección si no autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => (window.location.href = "/api/login"), 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Cargar integraciones disponibles
  useEffect(() => {
    if (!isAuthenticated) return;
    loadIntegrations();
  }, [isAuthenticated]);

  async function loadIntegrations() {
    try {
      const res = await fetch(`/api/integrations?brandId=${activeBrandId}`);
      const data = await res.json();
      setIntegrations(data);
    } catch (err) {
      console.error("❌ Error fetching integrations:", err);
    }
  }

  const handlePlatformSelect = (platform?: string) => {
    setSelectedPlatform(platform);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName={isSpanish ? "Bandeja de Entrada" : "Inbox"} />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        {/* Main Content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Summary Stats Banner */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg" data-testid="stat-total-messages">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                ) : (
                  <div className="text-2xl font-bold text-gray-900">
                    {inboxStats?.totalMessages ?? 0}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  {isSpanish ? "Mensajes Totales" : "Total Messages"}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg" data-testid="stat-unread">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                ) : (
                  <div className="text-2xl font-bold text-red-600">
                    {inboxStats?.unread ?? 0}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  {isSpanish ? "Sin Leer" : "Unread"}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg" data-testid="stat-urgent">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                ) : (
                  <div className="text-2xl font-bold text-yellow-600">
                    {inboxStats?.urgent ?? 0}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  {isSpanish ? "Urgente" : "Urgent"}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg" data-testid="stat-avg-response">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                ) : (
                  <div className="text-2xl font-bold text-green-600">
                    {inboxStats?.avgResponseTime ?? "N/A"}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  {isSpanish ? "Respuesta Promedio" : "Avg Response"}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant={!selectedPlatform ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePlatformSelect(undefined)}
                  data-testid="filter-all"
                >
                  All
                </Button>

                {integrations?.map((integration) => {
                  const provider = integration.provider;
                  const isActive = selectedPlatform === provider;

                  const icons: Record<string, any> = {
                    facebook: SiFacebook,
                    instagram: Instagram,
                    whatsapp: SiWhatsapp,
                    whatsapp_baileys: SiWhatsapp,
                    tiktok: SiTiktok,
                    twitter: Twitter,
                  };

                  const labels: Record<string, string> = {
                    whatsapp_baileys: "WhatsApp",
                  };

                  const Icon = icons[provider] || Mail;
                  const label = labels[provider] ||
                    provider.charAt(0).toUpperCase() + provider.slice(1);

                  return (
                    <Button
                      key={provider}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePlatformSelect(provider)}
                      data-testid={`filter-${provider}`}
                    >
                      <Icon
                        className={cn(
                          "mr-2 h-4 w-4",
                          isActive ? "text-white" : "text-primary",
                        )}
                      />
                      {label}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={isSpanish ? "Buscar..." : "Search..."}
                    className="pl-10 pr-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-messages"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      data-testid="button-clear-search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {/* Flag Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      data-testid="button-flag-filter"
                    >
                      {selectedFlag === "important" && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                      {selectedFlag === "archived" && (
                        <Archive className="h-4 w-4 text-gray-500" />
                      )}
                      {(selectedFlag === "all" || selectedFlag === "none") && (
                        <Filter className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setSelectedFlag("all")}
                      data-testid="filter-option-all"
                    >
                      <Flag className="h-4 w-4 mr-2 text-gray-400" />
                      {isSpanish ? "Todas" : "All"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedFlag("important")}
                      data-testid="filter-option-important"
                    >
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      {isSpanish ? "Importantes" : "Important"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedFlag("archived")}
                      data-testid="filter-option-archived"
                    >
                      <Archive className="h-4 w-4 mr-2 text-gray-500" />
                      {isSpanish ? "Archivadas" : "Archived"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* WhatsApp-style Split View */}
          <div className="flex-1 flex overflow-hidden">
            <MessageList
              showHeader={false}
              platform={selectedPlatform}
              flagFilter={selectedFlag}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
