import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { useBrand } from "@/contexts/BrandContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import {
  RefreshCw,
  Search,
  Users,
  DollarSign,
  MessageCircle,
  Phone,
  Mail,
  Building2,
  TrendingUp,
  ShoppingCart,
  ExternalLink,
  Loader2,
  AlertCircle,
  Link2,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  X,
  Store,
  Clock,
  ArrowUpRight,
  Filter,
  BarChart3,
} from "lucide-react";
import type {
  PosCustomer,
  SalesTransaction,
  Conversation,
} from "@shared/schema";
import HelpChatbot from "@/components/HelpChatbot";

interface LightspeedStatus {
  connected: boolean;
  storeName?: string;
  lastSyncAt?: string;
  stats?: {
    totalSales: number;
    totalTransactions: number;
    averageOrderValue: number;
    totalCustomers: number;
  };
}

interface CustomerWithConversation extends PosCustomer {
  linkedConversation?: Conversation;
}

export default function SalesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeBrandId } = useBrand();
  const [, navigate] = useLocation();
  const { isSpanish } = useLanguage();

  const [activeTab, setActiveTab] = useState("customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerNameFilter, setCustomerNameFilter] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerWithConversation | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isForceResyncing, setIsForceResyncing] = useState(false);

  // Pagination state
  const [customersPage, setCustomersPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const [customersPageSize, setCustomersPageSize] = useState(10);
  const [salesPageSize, setSalesPageSize] = useState(10);

  // Date filter state for sales
  const [salesDateFrom, setSalesDateFrom] = useState("");
  const [salesDateTo, setSalesDateTo] = useState("");

  // Status filter for sales
  const [salesStatusFilter, setSalesStatusFilter] = useState<string>("all");

  // Stats period filter
  const [statsPeriod, setStatsPeriod] = useState<
    "today" | "this_week" | "this_month" | "last_month" | "all_time"
  >("this_month");

  // Fetch Lightspeed integration status
  const { data: lightspeedStatus, isLoading: statusLoading } =
    useQuery<LightspeedStatus>({
      queryKey: ["/api/lightspeed/status", activeBrandId],
      queryFn: async () => {
        const res = await fetch(
          `/api/lightspeed/status?brandId=${activeBrandId}`,
        );
        if (!res.ok) {
          if (res.status === 404) return { connected: false };
          throw new Error("Failed to fetch status");
        }
        return res.json();
      },
      enabled: !!activeBrandId,
    });

  // Fetch POS customers
  const {
    data: customers = [],
    isLoading: customersLoading,
    refetch: refetchCustomers,
  } = useQuery<PosCustomer[]>({
    queryKey: ["/api/lightspeed/customers", activeBrandId],
    queryFn: async () => {
      const res = await fetch(
        `/api/lightspeed/customers?brandId=${activeBrandId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    enabled: !!activeBrandId && lightspeedStatus?.connected,
  });

  // Fetch sales transactions
  const {
    data: sales = [],
    isLoading: salesLoading,
    refetch: refetchSales,
  } = useQuery<SalesTransaction[]>({
    queryKey: ["/api/lightspeed/sales", activeBrandId],
    queryFn: async () => {
      const res = await fetch(`/api/lightspeed/sales?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch sales");
      return res.json();
    },
    enabled: !!activeBrandId && lightspeedStatus?.connected,
  });

  // Fetch WhatsApp conversations for phone matching
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations", activeBrandId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      return data.conversations || [];
    },
    enabled: !!activeBrandId,
  });

  // Normalize phone number for matching
  const normalizePhone = (phone: string | null | undefined): string => {
    if (!phone) return "";
    return phone.replace(/\D/g, "").slice(-10);
  };

  // Match customers with WhatsApp conversations by phone
  const customersWithConversations = useMemo((): CustomerWithConversation[] => {
    return customers.map((customer) => {
      const customerPhones = [
        normalizePhone(customer.phone),
        normalizePhone(customer.mobile),
      ].filter(Boolean);

      const linkedConversation = conversations.find((conv) => {
        if (conv.platform !== "whatsapp") return false;
        // WhatsApp metaConversationId format is typically the phone number
        const convPhone = normalizePhone(conv.metaConversationId);
        return customerPhones.includes(convPhone);
      });

      return { ...customer, linkedConversation };
    });
  }, [customers, conversations]);

  // Filter customers by search and name filter
  const filteredCustomers = useMemo(() => {
    let result = customersWithConversations;

    // Apply name filter
    if (customerNameFilter) {
      const lowerFilter = customerNameFilter.toLowerCase();
      result = result.filter((c) =>
        c.name?.toLowerCase().includes(lowerFilter),
      );
    }

    // Apply search query (for broader search)
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(lowerSearch) ||
          c.email?.toLowerCase().includes(lowerSearch) ||
          c.phone?.includes(searchQuery) ||
          c.mobile?.includes(searchQuery),
      );
    }

    return result;
  }, [customersWithConversations, searchQuery, customerNameFilter]);

  // Filter and sort sales
  const filteredSales = useMemo(() => {
    let result = [...sales];

    // Apply date filters
    if (salesDateFrom) {
      const fromDate = new Date(salesDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter((s) => {
        if (!s.transactionDate) return false;
        const saleDate = new Date(s.transactionDate);
        return saleDate >= fromDate;
      });
    }

    if (salesDateTo) {
      const toDate = new Date(salesDateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((s) => {
        if (!s.transactionDate) return false;
        const saleDate = new Date(s.transactionDate);
        return saleDate <= toDate;
      });
    }

    // Apply status filter
    if (salesStatusFilter !== "all") {
      result = result.filter((s) => s.status === salesStatusFilter);
    }

    // Apply search query
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.customerName?.toLowerCase().includes(lowerSearch) ||
          s.transactionId?.toLowerCase().includes(lowerSearch),
      );
    }

    // Sort by date (newest first)
    result.sort((a, b) => {
      const dateA = a.transactionDate
        ? new Date(a.transactionDate).getTime()
        : 0;
      const dateB = b.transactionDate
        ? new Date(b.transactionDate).getTime()
        : 0;
      return dateB - dateA;
    });

    return result;
  }, [sales, searchQuery, salesDateFrom, salesDateTo, salesStatusFilter]);

  // Get unique statuses from sales
  const availableStatuses = useMemo(() => {
    const statuses = new Set(sales.map((s) => s.status).filter(Boolean));
    return Array.from(statuses) as string[];
  }, [sales]);

  // Pagination for customers
  const customersTotalPages = Math.ceil(
    filteredCustomers.length / customersPageSize,
  );
  const paginatedCustomers = useMemo(() => {
    const start = (customersPage - 1) * customersPageSize;
    return filteredCustomers.slice(start, start + customersPageSize);
  }, [filteredCustomers, customersPage, customersPageSize]);

  // Pagination for sales
  const salesTotalPages = Math.ceil(filteredSales.length / salesPageSize);
  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * salesPageSize;
    return filteredSales.slice(start, start + salesPageSize);
  }, [filteredSales, salesPage, salesPageSize]);

  // Handle customer filter change
  const handleCustomerFilterChange = (value: string) => {
    setCustomerNameFilter(value);
    setCustomersPage(1);
  };

  // Handle sales date filter change
  const handleSalesDateChange = (type: "from" | "to", value: string) => {
    if (type === "from") {
      setSalesDateFrom(value);
    } else {
      setSalesDateTo(value);
    }
    setSalesPage(1);
  };

  // Clear all sales filters
  const clearSalesFilters = () => {
    setSalesDateFrom("");
    setSalesDateTo("");
    setSalesStatusFilter("all");
    setSalesPage(1);
  };

  // Check if any sales filter is active
  const hasSalesFilters =
    salesDateFrom || salesDateTo || salesStatusFilter !== "all";

  // Sync data from Lightspeed
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/lightspeed/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brandId: activeBrandId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Sync failed");
      }

      const data = await res.json();
      const customersCount = data.synced?.customers || 0;
      const salesCount = data.synced?.sales || 0;
      const relinkedCount = data.relinked?.updated || 0;
      toast({
        title: isSpanish ? "Sincronización completada" : "Sync completed",
        description: isSpanish
          ? `${customersCount} clientes, ${salesCount} ventas sincronizadas, ${relinkedCount} ventas vinculadas`
          : `${customersCount} customers, ${salesCount} sales synced, ${relinkedCount} sales linked`,
      });

      refetchCustomers();
      refetchSales();
      queryClient.invalidateQueries({ queryKey: ["/api/lightspeed/status"] });
    } catch (error) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "Error al sincronizar datos"
          : "Failed to sync data",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Force re-sync: Delete all sales and re-fetch from Lightspeed (fixes customer linking)
  const handleForceResync = async () => {
    if (!confirm(isSpanish 
      ? "Esto eliminará todas las ventas y las volverá a sincronizar desde Lightspeed. ¿Continuar?" 
      : "This will delete all sales and re-sync from Lightspeed. Continue?")) {
      return;
    }
    
    setIsForceResyncing(true);
    try {
      const res = await fetch(`/api/lightspeed/force-resync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brandId: activeBrandId, daysBack: 90 }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Force re-sync failed");
      }

      const data = await res.json();
      toast({
        title: isSpanish ? "Re-sincronización completada" : "Re-sync completed",
        description: isSpanish
          ? `${data.synced} ventas sincronizadas, ${data.linked} vinculadas con clientes`
          : `${data.synced} sales synced, ${data.linked} linked to customers`,
      });

      refetchCustomers();
      refetchSales();
      queryClient.invalidateQueries({ queryKey: ["/api/lightspeed/status"] });
    } catch (error) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "Error al re-sincronizar datos"
          : "Failed to force re-sync data",
        variant: "destructive",
      });
    } finally {
      setIsForceResyncing(false);
    }
  };

  // Open conversation in inbox
  const openConversation = (conversationId: string) => {
    navigate(`/inbox?conversation=${conversationId}`);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  // Format date
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(isSpanish ? "es-ES" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format relative time
  const formatRelativeTime = (date: string | Date | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return isSpanish ? `hace ${minutes}m` : `${minutes}m ago`;
    if (hours < 24) return isSpanish ? `hace ${hours}h` : `${hours}h ago`;
    return isSpanish ? `hace ${days}d` : `${days}d ago`;
  };

  // Customer count with linked WhatsApp
  const linkedCustomersCount = customersWithConversations.filter(
    (c) => c.linkedConversation,
  ).length;

  // Get date range for stats period
  const getStatsDateRange = () => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    // Get start of week (Sunday = 0, so we go back to last Sunday or today if Sunday)
    const dayOfWeek = now.getDay();
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - dayOfWeek,
      0,
      0,
      0,
      0,
    );
    const weekEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    switch (statsPeriod) {
      case "today":
        return { start: todayStart, end: todayEnd };
      case "this_week":
        return { start: weekStart, end: weekEnd };
      case "this_month":
        return { start: thisMonthStart, end: thisMonthEnd };
      case "last_month":
        return { start: lastMonthStart, end: lastMonthEnd };
      case "all_time":
        return null;
    }
  };

  // Calculate stats based on selected period
  const periodStats = useMemo(() => {
    const dateRange = getStatsDateRange();

    let periodSales = sales;
    if (dateRange) {
      periodSales = sales.filter((s) => {
        if (!s.transactionDate) return false;
        const saleDate = new Date(s.transactionDate);
        return saleDate >= dateRange.start && saleDate <= dateRange.end;
      });
    }

    const totalSales = periodSales.reduce(
      (sum, s) => sum + (s.totalAmount || 0),
      0,
    );
    const totalTransactions = periodSales.length;
    const averageOrderValue =
      totalTransactions > 0 ? totalSales / totalTransactions : 0;

    return {
      totalSales,
      totalTransactions,
      averageOrderValue,
      totalCustomers: customersWithConversations.length,
      linkedCustomers: linkedCustomersCount,
    };
  }, [sales, customersWithConversations, linkedCustomersCount, statsPeriod]);

  // Get period label for display
  const getPeriodLabel = () => {
    const now = new Date();
    const monthNames = isSpanish
      ? [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ]
      : [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

    switch (statsPeriod) {
      case "today":
        return isSpanish ? "Hoy" : "Today";
      case "this_week":
        return isSpanish ? "Esta semana" : "This week";
      case "this_month":
        return monthNames[now.getMonth()];
      case "last_month":
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        return monthNames[lastMonth];
      case "all_time":
        return isSpanish ? "Todo el tiempo" : "All time";
    }
  };

  if (!activeBrandId) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopHeader />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">
              {isSpanish
                ? "Selecciona una marca para continuar"
                : "Select a brand to continue"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <TopHeader />
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {/* Hero Section */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 p-6 md:p-8 shadow-xl">
                    <div className="absolute inset-0 opacity-10">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)`,
                          backgroundSize: "20px 20px",
                        }}
                      />
                    </div>

                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Store className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-page-title">
                              {isSpanish ? "Ventas y Clientes POS" : "POS Sales & Customers"}
                            </h1>
                            <p className="text-purple-100 text-sm">
                              {isSpanish
                                ? "Gestiona tus clientes y ventas sincronizados con WhatsApp"
                                : "Manage your customers and sales linked with WhatsApp"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {lightspeedStatus?.connected && (
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-sm font-medium text-white">
                              {isSpanish ? "Conectado" : "Connected"}
                            </span>
                          </div>

                          <Button
                            onClick={handleSync}
                            disabled={isSyncing || isForceResyncing}
                            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                            variant="outline"
                            data-testid="sync-lightspeed"
                          >
                            {isSyncing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            {isSpanish ? "Sincronizar" : "Sync"}
                          </Button>
                          
                          <Button
                            onClick={handleForceResync}
                            disabled={isSyncing || isForceResyncing}
                            className="gap-2 bg-orange-500/20 hover:bg-orange-500/30 text-white border-orange-300/30"
                            variant="outline"
                            data-testid="force-resync-lightspeed"
                            title={isSpanish 
                              ? "Elimina y vuelve a sincronizar todas las ventas para corregir vinculación de clientes" 
                              : "Deletes and re-syncs all sales to fix customer linking"}
                          >
                            {isForceResyncing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}
                            {isSpanish ? "Re-sincronizar" : "Force Re-sync"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Main Content */}
                {statusLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                      <p className="text-sm text-muted-foreground">
                        {isSpanish ? "Cargando..." : "Loading..."}
                      </p>
                    </div>
                  </div>
                ) : !lightspeedStatus?.connected ? (
                  /* Not Connected State */
                  <Card className="border-2 border-dashed border-gray-200 bg-white/50">
                    <CardContent className="py-16">
                      <div className="text-center max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                          <Zap className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-900">
                          {isSpanish
                            ? "Conecta Lightspeed Retail"
                            : "Connect Lightspeed Retail"}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          {isSpanish
                            ? "Sincroniza clientes y ventas para vincularlos automáticamente con conversaciones de WhatsApp."
                            : "Sync customers and sales to automatically link them with WhatsApp conversations."}
                        </p>
                        <Button
                          onClick={() => navigate("/integrations")}
                          className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                          data-testid="connect-lightspeed-cta"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {isSpanish ? "Ir a Integraciones" : "Go to Integrations"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Period Selector & Stats */}
                    <div className="space-y-4">
                  {/* Period Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {isSpanish ? "Estadísticas de" : "Stats for"}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {getPeriodLabel()}
                      </span>
                    </div>

                    <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <button
                        onClick={() => setStatsPeriod("today")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          statsPeriod === "today"
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        }`}
                        data-testid="period-today"
                      >
                        {isSpanish ? "Hoy" : "Today"}
                      </button>
                      <button
                        onClick={() => setStatsPeriod("this_week")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          statsPeriod === "this_week"
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        }`}
                        data-testid="period-this-week"
                      >
                        {isSpanish ? "Semana" : "Week"}
                      </button>
                      <button
                        onClick={() => setStatsPeriod("this_month")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          statsPeriod === "this_month"
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        }`}
                        data-testid="period-this-month"
                      >
                        {isSpanish ? "Mes" : "Month"}
                      </button>
                      <button
                        onClick={() => setStatsPeriod("last_month")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          statsPeriod === "last_month"
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        }`}
                        data-testid="period-last-month"
                      >
                        {isSpanish ? "Anterior" : "Last Month"}
                      </button>
                      <button
                        onClick={() => setStatsPeriod("all_time")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          statsPeriod === "all_time"
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                        }`}
                        data-testid="period-all-time"
                      >
                        {isSpanish ? "Todo" : "All"}
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    {/* Customers Card */}
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid="card-stat-customers">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">
                              {isSpanish ? "Clientes POS" : "POS Customers"}
                            </p>
                            <p className="text-3xl font-bold text-gray-900" data-testid="stat-customers">
                              {periodStats.totalCustomers.toLocaleString()}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Linked to WhatsApp Card */}
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid="card-stat-linked">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">
                              {isSpanish ? "Vinculados" : "Linked"}
                            </p>
                            <p className="text-3xl font-bold text-green-600" data-testid="stat-linked">
                              {periodStats.linkedCustomers.toLocaleString()}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <Link2 className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Transactions Card */}
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid="card-stat-transactions">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">
                              {isSpanish ? "Transacciones" : "Transactions"}
                            </p>
                            <p className="text-3xl font-bold text-purple-600" data-testid="stat-transactions">
                              {periodStats.totalTransactions.toLocaleString()}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Total Sales Card */}
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid="card-stat-sales">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">
                              {isSpanish ? "Ventas Totales" : "Total Sales"}
                            </p>
                            <p className="text-3xl font-bold text-amber-600" data-testid="stat-sales">
                              {formatCurrency(periodStats.totalSales)}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-amber-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Last Sync Info */}
                  {lightspeedStatus.lastSyncAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {isSpanish ? "Última sincronización" : "Last sync"}:{" "}
                        {formatRelativeTime(lightspeedStatus.lastSyncAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Data Tables */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <CardContent className="p-0">
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        {/* Tabs Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                          <TabsList className="bg-gray-100 p-1">
                            <TabsTrigger
                              value="customers"
                              className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                              data-testid="tab-customers"
                            >
                              <Users className="h-4 w-4" />
                              {isSpanish ? "Clientes" : "Customers"}
                            </TabsTrigger>
                            <TabsTrigger
                              value="sales"
                              className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                              data-testid="tab-sales"
                            >
                              <DollarSign className="h-4 w-4" />
                              {isSpanish ? "Ventas" : "Sales"}
                          </TabsTrigger>
                        </TabsList>

                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={isSpanish ? "Buscar..." : "Search..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            data-testid="search-input"
                          />
                        </div>
                      </div>

                      {/* Customers Tab */}
                      <TabsContent value="customers" className="m-0">
                        {/* Customer Filters */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                          <div className="relative flex-1 max-w-xs">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={
                                isSpanish
                                  ? "Filtrar por nombre..."
                                  : "Filter by name..."
                              }
                              value={customerNameFilter}
                              onChange={(e) =>
                                handleCustomerFilterChange(e.target.value)
                              }
                              className="pl-9 h-9 bg-white dark:bg-gray-800"
                              data-testid="customer-name-filter"
                            />
                          </div>
                          <Badge variant="secondary" className="font-normal">
                            {filteredCustomers.length}{" "}
                            {isSpanish ? "clientes" : "customers"}
                          </Badge>
                        </div>

                        {customersLoading ? (
                          <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                          </div>
                        ) : filteredCustomers.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <Users className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-muted-foreground">
                              {customerNameFilter
                                ? isSpanish
                                  ? "No se encontraron clientes"
                                  : "No customers found"
                                : isSpanish
                                  ? "No hay clientes sincronizados"
                                  : "No customers synced yet"}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <TableHead className="font-semibold">
                                      {isSpanish ? "Nombre" : "Name"}
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                      {isSpanish ? "Contacto" : "Contact"}
                                    </TableHead>
                                    <TableHead className="font-semibold hidden md:table-cell">
                                      {isSpanish ? "Empresa" : "Company"}
                                    </TableHead>
                                    <TableHead className="font-semibold text-right hidden sm:table-cell">
                                      {isSpanish ? "Total Año" : "YTD"}
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                      WhatsApp
                                    </TableHead>
                                    <TableHead className="font-semibold text-right">
                                      {isSpanish ? "Acciones" : "Actions"}
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paginatedCustomers.map((customer) => (
                                    <TableRow
                                      key={customer.id}
                                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                      data-testid={`customer-row-${customer.id}`}
                                    >
                                      <TableCell>
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                            {customer.name
                                              ?.charAt(0)
                                              .toUpperCase() || "?"}
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                              {customer.name}
                                            </p>
                                            {customer.customerCode && (
                                              <p className="text-xs text-muted-foreground">
                                                #{customer.customerCode}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="space-y-1">
                                          {customer.email && (
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                              <Mail className="h-3.5 w-3.5" />
                                              <span className="truncate max-w-[150px]">
                                                {customer.email}
                                              </span>
                                            </div>
                                          )}
                                          {(customer.phone ||
                                            customer.mobile) && (
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                              <Phone className="h-3.5 w-3.5" />
                                              {customer.phone ||
                                                customer.mobile}
                                            </div>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="hidden md:table-cell">
                                        {customer.companyName && (
                                          <div className="flex items-center gap-1.5 text-sm">
                                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                            {customer.companyName}
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right hidden sm:table-cell">
                                        <span className="font-medium">
                                          {customer.yearToDate
                                            ? `$${parseFloat(customer.yearToDate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : "-"}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {customer.linkedConversation ? (
                                          <Badge
                                            className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer gap-1"
                                            onClick={() =>
                                              openConversation(
                                                customer.linkedConversation!.id,
                                              )
                                            }
                                            data-testid={`linked-badge-${customer.id}`}
                                          >
                                            <MessageCircle className="h-3 w-3" />
                                            {isSpanish ? "Vinculado" : "Linked"}
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="text-muted-foreground border-gray-200 dark:border-gray-700"
                                          >
                                            {isSpanish
                                              ? "Sin vincular"
                                              : "Not linked"}
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 gap-1"
                                          onClick={() => {
                                            setSelectedCustomer(customer);
                                            setIsCustomerDialogOpen(true);
                                          }}
                                          data-testid={`view-customer-${customer.id}`}
                                        >
                                          {isSpanish ? "Ver" : "View"}
                                          <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 dark:border-gray-800">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {isSpanish ? "Mostrar" : "Show"}
                                </span>
                                <Select
                                  value={String(customersPageSize)}
                                  onValueChange={(value) => {
                                    setCustomersPageSize(Number(value));
                                    setCustomersPage(1);
                                  }}
                                >
                                  <SelectTrigger
                                    className="w-16 h-8"
                                    data-testid="customers-page-size"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                  </SelectContent>
                                </Select>
                                <span className="text-sm text-muted-foreground">
                                  {isSpanish ? "por página" : "per page"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {customersPage} / {customersTotalPages || 1}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCustomersPage(1)}
                                    disabled={customersPage === 1}
                                    data-testid="customers-first-page"
                                  >
                                    <ChevronsLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      setCustomersPage((p) =>
                                        Math.max(1, p - 1),
                                      )
                                    }
                                    disabled={customersPage === 1}
                                    data-testid="customers-prev-page"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      setCustomersPage((p) =>
                                        Math.min(customersTotalPages, p + 1),
                                      )
                                    }
                                    disabled={
                                      customersPage >= customersTotalPages
                                    }
                                    data-testid="customers-next-page"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      setCustomersPage(customersTotalPages)
                                    }
                                    disabled={
                                      customersPage >= customersTotalPages
                                    }
                                    data-testid="customers-last-page"
                                  >
                                    <ChevronsRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </TabsContent>

                      {/* Sales Tab */}
                      <TabsContent value="sales" className="m-0">
                        {/* Sales Filters */}
                        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                          {/* Date Range Filter */}
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="date"
                              value={salesDateFrom}
                              onChange={(e) =>
                                handleSalesDateChange("from", e.target.value)
                              }
                              className="w-[160px] h-9 bg-white dark:bg-gray-800"
                              data-testid="sales-date-from"
                            />
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                            <Input
                              type="date"
                              value={salesDateTo}
                              onChange={(e) =>
                                handleSalesDateChange("to", e.target.value)
                              }
                              className="w-[160px] h-9 bg-white dark:bg-gray-800"
                              data-testid="sales-date-to"
                            />
                          </div>

                          {/* Status Filter */}
                          <div className="flex items-center gap-2">
                            <Select
                              value={salesStatusFilter}
                              onValueChange={(value) => {
                                setSalesStatusFilter(value);
                                setSalesPage(1);
                              }}
                            >
                              <SelectTrigger
                                className="w-[140px] h-9 bg-white dark:bg-gray-800"
                                data-testid="sales-status-filter"
                              >
                                <SelectValue
                                  placeholder={isSpanish ? "Estado" : "Status"}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  {isSpanish
                                    ? "Todos los estados"
                                    : "All statuses"}
                                </SelectItem>
                                <SelectItem value="completed">
                                  {isSpanish ? "Completada" : "Completed"}
                                </SelectItem>
                                <SelectItem value="pending">
                                  {isSpanish ? "Pendiente" : "Pending"}
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  {isSpanish ? "Cancelada" : "Cancelled"}
                                </SelectItem>
                                <SelectItem value="refunded">
                                  {isSpanish ? "Reembolsada" : "Refunded"}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Clear Filters */}
                          {hasSalesFilters && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearSalesFilters}
                              className="h-9 gap-1 text-muted-foreground hover:text-foreground"
                              data-testid="clear-sales-filters"
                            >
                              <X className="h-4 w-4" />
                              {isSpanish ? "Limpiar filtros" : "Clear filters"}
                            </Button>
                          )}

                          {/* Results Count */}
                          <div className="ml-auto">
                            <Badge variant="secondary" className="font-normal">
                              {filteredSales.length}{" "}
                              {isSpanish ? "ventas" : "sales"}
                            </Badge>
                          </div>
                        </div>

                        {salesLoading ? (
                          <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                          </div>
                        ) : filteredSales.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <DollarSign className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-muted-foreground">
                              {hasSalesFilters
                                ? isSpanish
                                  ? "No se encontraron ventas con estos filtros"
                                  : "No sales found with these filters"
                                : isSpanish
                                  ? "No hay ventas sincronizadas"
                                  : "No sales synced yet"}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <TableHead className="font-semibold">
                                      {isSpanish ? "Fecha" : "Date"}
                                    </TableHead>
                                    <TableHead className="font-semibold hidden sm:table-cell">
                                      {isSpanish ? "ID" : "ID"}
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                      {isSpanish ? "Cliente" : "Customer"}
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                      {isSpanish ? "Estado" : "Status"}
                                    </TableHead>
                                    <TableHead className="font-semibold text-right">
                                      {isSpanish ? "Total" : "Total"}
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paginatedSales.map((sale) => (
                                    <TableRow
                                      key={sale.id}
                                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                      data-testid={`sale-row-${sale.id}`}
                                    >
                                      <TableCell>
                                        <div className="font-medium">
                                          {formatDate(sale.transactionDate)}
                                        </div>
                                      </TableCell>
                                      <TableCell className="hidden sm:table-cell">
                                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                                          {sale.transactionId?.slice(0, 8)}
                                        </code>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                                            {(sale.customerName || "W")
                                              .charAt(0)
                                              .toUpperCase()}
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                              {sale.customerName ||
                                                (isSpanish
                                                  ? "Cliente anónimo"
                                                  : "Walk-in")}
                                            </p>
                                            {sale.customerEmail && (
                                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                {sale.customerEmail}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge
                                          className={
                                            sale.status === "completed"
                                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                          }
                                        >
                                          {sale.status === "completed"
                                            ? isSpanish
                                              ? "Completada"
                                              : "Completed"
                                            : sale.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                          {formatCurrency(sale.totalAmount)}
                                        </span>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 dark:border-gray-800">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {isSpanish ? "Mostrar" : "Show"}
                                </span>
                                <Select
                                  value={String(salesPageSize)}
                                  onValueChange={(value) => {
                                    setSalesPageSize(Number(value));
                                    setSalesPage(1);
                                  }}
                                >
                                  <SelectTrigger
                                    className="w-16 h-8"
                                    data-testid="sales-page-size"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                  </SelectContent>
                                </Select>
                                <span className="text-sm text-muted-foreground">
                                  {isSpanish ? "por página" : "per page"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {salesPage} / {salesTotalPages || 1}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setSalesPage(1)}
                                    disabled={salesPage === 1}
                                    data-testid="sales-first-page"
                                  >
                                    <ChevronsLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      setSalesPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={salesPage === 1}
                                    data-testid="sales-prev-page"
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      setSalesPage((p) =>
                                        Math.min(salesTotalPages, p + 1),
                                      )
                                    }
                                    disabled={salesPage >= salesTotalPages}
                                    data-testid="sales-next-page"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      setSalesPage(salesTotalPages)
                                    }
                                    disabled={salesPage >= salesTotalPages}
                                    data-testid="sales-last-page"
                                  >
                                    <ChevronsRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Customer Details Dialog */}
      <Dialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
      >
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
          {selectedCustomer && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 px-6 py-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                    {selectedCustomer.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedCustomer.name}
                    </h2>
                    {selectedCustomer.customerCode && (
                      <p className="text-white/70 text-sm">
                        #{selectedCustomer.customerCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedCustomer.email && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Email
                      </p>
                      <p className="text-sm font-medium">
                        {selectedCustomer.email}
                      </p>
                    </div>
                  )}
                  {(selectedCustomer.phone || selectedCustomer.mobile) && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {isSpanish ? "Teléfono" : "Phone"}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedCustomer.phone || selectedCustomer.mobile}
                      </p>
                    </div>
                  )}
                  {selectedCustomer.companyName && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {isSpanish ? "Empresa" : "Company"}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedCustomer.companyName}
                      </p>
                    </div>
                  )}
                  {selectedCustomer.yearToDate && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {isSpanish ? "Total del año" : "Year to Date"}
                      </p>
                      <p className="text-sm font-medium">
                        $
                        {parseFloat(selectedCustomer.yearToDate).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </p>
                    </div>
                  )}
                  {selectedCustomer.loyaltyBalance && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {isSpanish ? "Puntos Lealtad" : "Loyalty Points"}
                      </p>
                      <p className="text-sm font-medium">
                        {selectedCustomer.loyaltyBalance}
                      </p>
                    </div>
                  )}
                  {selectedCustomer.balance && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {isSpanish ? "Saldo" : "Balance"}
                      </p>
                      <p className="text-sm font-medium">
                        ${parseFloat(selectedCustomer.balance).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* WhatsApp Status */}
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {isSpanish ? "Conexión WhatsApp" : "WhatsApp Connection"}
                  </h4>

                  {selectedCustomer.linkedConversation ? (
                    <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-400">
                              {isSpanish
                                ? "Conversación vinculada"
                                : "Linked conversation"}
                            </p>
                            <p className="text-sm text-green-600/70 dark:text-green-400/70">
                              {selectedCustomer.linkedConversation.contactName}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            openConversation(
                              selectedCustomer.linkedConversation!.id,
                            );
                            setIsCustomerDialogOpen(false);
                          }}
                          data-testid="open-conversation-btn"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {isSpanish ? "Abrir" : "Open"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm">
                          {isSpanish
                            ? "No hay conversación de WhatsApp vinculada"
                            : "No WhatsApp conversation linked"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Last Sync */}
                {selectedCustomer.lastSyncAt && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {isSpanish ? "Última sincronización" : "Last synced"}:{" "}
                      {formatDate(selectedCustomer.lastSyncAt)}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <HelpChatbot />
    </div>
  );
}
