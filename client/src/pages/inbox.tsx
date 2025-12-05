import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import MessageList from "@/components/MessageList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  Search, 
  Star, 
  Archive, 
  Flag, 
  X, 
  Loader2, 
  MessageCircle, 
  Clock, 
  AlertTriangle,
  Inbox as InboxIcon,
  TrendingUp,
  Mail,
  Twitter,
  Instagram,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import HelpChatbot from "@/components/HelpChatbot";
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
import { motion } from "framer-motion";

interface InboxStats {
  totalMessages: number;
  unread: number;
  urgent: number;
  avgResponseTime: string;
  conversationCount: number;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

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

  // Fetch inbox statistics from the API
  const { data: inboxStats, isLoading: statsLoading } = useQuery<InboxStats>({
    queryKey: ["/api/inbox/stats", activeBrandId],
    queryFn: async () => {
      const res = await fetch(`/api/inbox/stats?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch inbox stats");
      return res.json();
    },
    enabled: isAuthenticated && !!activeBrandId,
    refetchInterval: 30000,
  });

  // Redirect if not authenticated
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

  // Load available integrations
  useEffect(() => {
    if (!isAuthenticated) return;
    loadIntegrations();
  }, [isAuthenticated, activeBrandId]);

  async function loadIntegrations() {
    try {
      const res = await fetch(`/api/integrations?brandId=${activeBrandId}`);
      const data = await res.json();
      // Filter only messaging integrations
      const messagingIntegrations = data.filter((i: any) => 
        ['facebook', 'instagram', 'whatsapp', 'whatsapp_baileys', 'threads'].includes(i.provider)
      );
      setIntegrations(messagingIntegrations);
    } catch (err) {
      console.error("❌ Error fetching integrations:", err);
    }
  }

  const handlePlatformSelect = (platform?: string) => {
    setSelectedPlatform(platform);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">{isSpanish ? "Cargando..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  const icons: Record<string, any> = {
    facebook: SiFacebook,
    instagram: Instagram,
    whatsapp: SiWhatsapp,
    whatsapp_baileys: SiWhatsapp,
    threads: MessageCircle,
    tiktok: SiTiktok,
    twitter: Twitter,
  };

  const labels: Record<string, string> = {
    whatsapp_baileys: "WhatsApp",
  };

  const platformColors: Record<string, string> = {
    facebook: "text-blue-600",
    instagram: "text-pink-500",
    whatsapp: "text-green-500",
    whatsapp_baileys: "text-green-500",
    threads: "text-gray-800",
    tiktok: "text-gray-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <TopHeader pageName={isSpanish ? "Bandeja de Entrada" : "Inbox"} />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        {/* Main Content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {/* Compact Header with Stats and Filters */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 p-4 shadow-lg">
                    <div className="absolute inset-0 opacity-10">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                          backgroundSize: "20px 20px",
                        }}
                      />
                    </div>

                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      {/* Title */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <InboxIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h1 className="text-xl font-bold text-white" data-testid="text-page-title">
                            {isSpanish ? "Bandeja de Entrada" : "Inbox"}
                          </h1>
                        </div>
                      </div>

                      {/* Compact Stats */}
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                          <MessageCircle className="w-4 h-4 text-white/80" />
                          <span className="text-sm font-semibold text-white">
                            {statsLoading ? "..." : inboxStats?.totalMessages ?? 0}
                          </span>
                          <span className="text-xs text-blue-100">{isSpanish ? "mensajes" : "messages"}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                          <Mail className="w-4 h-4 text-white/80" />
                          <span className="text-sm font-semibold text-white">
                            {statsLoading ? "..." : inboxStats?.unread ?? 0}
                          </span>
                          <span className="text-xs text-blue-100">{isSpanish ? "sin leer" : "unread"}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                          <Clock className="w-4 h-4 text-white/80" />
                          <span className="text-sm font-semibold text-white">
                            {statsLoading ? "..." : inboxStats?.avgResponseTime ?? "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Filter Bar */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4"
                >
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Platform Filters */}
                        <div className="flex items-center flex-wrap gap-2">
                          <Button
                            variant={!selectedPlatform ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePlatformSelect(undefined)}
                            className={cn(
                              "rounded-full",
                              !selectedPlatform && "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                            )}
                            data-testid="filter-all"
                          >
                            {isSpanish ? "Todos" : "All"}
                          </Button>

                          {integrations?.map((integration) => {
                            const provider = integration.provider;
                            const isActive = selectedPlatform === provider;
                            const Icon = icons[provider] || Mail;
                            const label = labels[provider] ||
                              provider.charAt(0).toUpperCase() + provider.slice(1);
                            const colorClass = platformColors[provider] || "text-gray-600";

                            return (
                              <Button
                                key={provider}
                                variant={isActive ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePlatformSelect(provider)}
                                className={cn(
                                  "rounded-full gap-2",
                                  isActive && "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                                )}
                                data-testid={`filter-${provider}`}
                              >
                                <Icon
                                  className={cn(
                                    "h-4 w-4",
                                    isActive ? "text-white" : colorClass,
                                  )}
                                />
                                {label}
                              </Button>
                            );
                          })}
                        </div>

                        {/* Search and Flag Filter */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder={isSpanish ? "Buscar conversaciones..." : "Search conversations..."}
                              className="pl-10 pr-10 w-64 rounded-full border-gray-200"
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
                                className="rounded-full"
                                data-testid="button-flag-filter"
                              >
                                {selectedFlag === "important" && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                )}
                                {selectedFlag === "archived" && (
                                  <Archive className="h-4 w-4 text-gray-500" />
                                )}
                                {(selectedFlag === "all" || selectedFlag === "none") && (
                                  <Filter className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => setSelectedFlag("all")}
                                className="gap-2"
                                data-testid="filter-option-all"
                              >
                                <Flag className="h-4 w-4 text-gray-400" />
                                {isSpanish ? "Todas las conversaciones" : "All conversations"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setSelectedFlag("important")}
                                className="gap-2"
                                data-testid="filter-option-important"
                              >
                                <Star className="h-4 w-4 text-yellow-500" />
                                {isSpanish ? "Importantes" : "Important"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setSelectedFlag("archived")}
                                className="gap-2"
                                data-testid="filter-option-archived"
                              >
                                <Archive className="h-4 w-4 text-gray-500" />
                                {isSpanish ? "Archivadas" : "Archived"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Messages List */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex-1"
                >
                  <Card className="border-0 shadow-lg overflow-hidden h-full">
                    <div className="h-[calc(100vh-240px)] min-h-[400px]">
                      <MessageList
                        showHeader={false}
                        platform={selectedPlatform}
                        flagFilter={selectedFlag}
                        searchQuery={searchQuery}
                      />
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <HelpChatbot />
    </div>
  );
}
