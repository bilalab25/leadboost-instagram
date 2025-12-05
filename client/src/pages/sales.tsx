import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import {
  RefreshCw,
  Search,
  Users,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Loader2,
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
  Plug,
} from "lucide-react";
import type { SalesTransaction, PosCustomer, Conversation } from "@shared/schema";
import HelpChatbot from "@/components/HelpChatbot";
import { Link } from "wouter";

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

export default function SalesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeBrandId } = useBrand();
  const [, navigate] = useLocation();
  const { isSpanish } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isForceResyncing, setIsForceResyncing] = useState(false);

  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize, setSalesPageSize] = useState(10);

  const [salesDateFrom, setSalesDateFrom] = useState("");
  const [salesDateTo, setSalesDateTo] = useState("");
  const [salesStatusFilter, setSalesStatusFilter] = useState<string>("all");

  const [statsPeriod, setStatsPeriod] = useState<
    "today" | "this_week" | "this_month" | "last_month" | "all_time"
  >("this_month");

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

  const { data: customers = [] } = useQuery<PosCustomer[]>({
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

  const normalizePhone = (phone: string | null | undefined): string => {
    if (!phone) return "";
    return phone.replace(/\D/g, "").slice(-10);
  };

  const linkedCustomersCount = useMemo(() => {
    return customers.filter((customer) => {
      const customerPhones = [
        normalizePhone(customer.phone),
        normalizePhone(customer.mobile),
      ].filter(Boolean);

      return conversations.some((conv) => {
        if (conv.platform !== "whatsapp" && conv.platform !== "whatsapp_baileys") return false;
        const convPhone = normalizePhone(conv.metaConversationId);
        return customerPhones.includes(convPhone);
      });
    }).length;
  }, [customers, conversations]);

  const filteredSales = useMemo(() => {
    let result = [...sales];

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

    if (salesStatusFilter !== "all") {
      result = result.filter((s) => s.status === salesStatusFilter);
    }

    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.customerName?.toLowerCase().includes(lowerSearch) ||
          s.transactionId?.toLowerCase().includes(lowerSearch),
      );
    }

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

  const salesTotalPages = Math.ceil(filteredSales.length / salesPageSize);
  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * salesPageSize;
    return filteredSales.slice(start, start + salesPageSize);
  }, [filteredSales, salesPage, salesPageSize]);

  const handleSalesDateChange = (type: "from" | "to", value: string) => {
    if (type === "from") {
      setSalesDateFrom(value);
    } else {
      setSalesDateTo(value);
    }
    setSalesPage(1);
  };

  const clearSalesFilters = () => {
    setSalesDateFrom("");
    setSalesDateTo("");
    setSalesStatusFilter("all");
    setSalesPage(1);
  };

  const hasSalesFilters =
    salesDateFrom || salesDateTo || salesStatusFilter !== "all";

  const periodStats = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (statsPeriod) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date();
        break;
      case "this_week":
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        break;
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        break;
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "all_time":
      default:
        break;
    }

    const periodSales = sales.filter((s) => {
      if (!s.transactionDate) return statsPeriod === "all_time";
      const saleDate = new Date(s.transactionDate);
      if (startDate && saleDate < startDate) return false;
      if (endDate && saleDate > endDate) return false;
      return true;
    });

    const totalSales = periodSales.reduce((sum, s) => {
      return sum + (s.totalAmount || 0) / 100;
    }, 0);

    return {
      totalCustomers: customers.length,
      linkedCustomers: linkedCustomersCount,
      totalTransactions: periodSales.length,
      totalSales,
    };
  }, [sales, customers, linkedCustomersCount, statsPeriod]);

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

      refetchSales();
      queryClient.invalidateQueries({ queryKey: ["/api/lightspeed/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lightspeed/customers"] });
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
        body: JSON.stringify({ brandId: activeBrandId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Force resync failed");
      }

      const data = await res.json();
      toast({
        title: isSpanish ? "Re-sincronización completada" : "Force resync completed",
        description: isSpanish
          ? `${data.synced?.sales || 0} ventas re-sincronizadas`
          : `${data.synced?.sales || 0} sales re-synced`,
      });

      refetchSales();
      queryClient.invalidateQueries({ queryKey: ["/api/lightspeed/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lightspeed/customers"] });
    } catch (error) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "Error al re-sincronizar datos"
          : "Failed to force resync data",
        variant: "destructive",
      });
    } finally {
      setIsForceResyncing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return isSpanish ? "Ahora" : "Just now";
    if (diffMins < 60) return isSpanish ? `Hace ${diffMins}m` : `${diffMins}m ago`;
    if (diffHours < 24) return isSpanish ? `Hace ${diffHours}h` : `${diffHours}h ago`;
    return isSpanish ? `Hace ${diffDays}d` : `${diffDays}d ago`;
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopHeader pageName={isSpanish ? "Ventas" : "Sales"} />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopHeader pageName={isSpanish ? "Ventas" : "Sales"} />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="p-6 space-y-6" data-testid="page-sales">
              {!lightspeedStatus?.connected ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-2xl mx-auto mt-12"
                >
                  <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <CardContent className="py-16 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                        <Store className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                        {isSpanish ? "Conecta tu Punto de Venta" : "Connect Your Point of Sale"}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
                        {isSpanish
                          ? "Sincroniza tus ventas desde Lightspeed para ver transacciones, estadísticas y análisis de rendimiento."
                          : "Sync your sales from Lightspeed to view transactions, statistics, and performance analytics."}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/integrations">
                          <Button size="lg" className="gap-2">
                            <Plug className="h-4 w-4" />
                            {isSpanish ? "Conectar Lightspeed" : "Connect Lightspeed"}
                          </Button>
                        </Link>
                      </div>
                      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {isSpanish ? "¿Por qué conectar tu POS?" : "Why connect your POS?"}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto">
                          <div className="flex items-start gap-2">
                            <ShoppingCart className="h-4 w-4 text-purple-500 mt-0.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {isSpanish ? "Transacciones en tiempo real" : "Real-time transactions"}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {isSpanish ? "Análisis de ventas" : "Sales analytics"}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-blue-500 mt-0.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {isSpanish ? "Datos de clientes" : "Customer data"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-page-title">
                        {isSpanish ? "Ventas" : "Sales"}
                      </h1>
                      <p className="text-gray-500 dark:text-gray-400">
                        {lightspeedStatus.storeName 
                          ? `${lightspeedStatus.storeName} - Lightspeed POS`
                          : "Lightspeed POS"
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleForceResync}
                        disabled={isForceResyncing || isSyncing}
                        className="gap-2"
                        data-testid="button-force-resync"
                      >
                        <Zap className={`h-4 w-4 ${isForceResyncing ? "animate-pulse" : ""}`} />
                        {isForceResyncing
                          ? isSpanish ? "Re-sincronizando..." : "Re-syncing..."
                          : isSpanish ? "Re-sincronizar" : "Force Resync"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing || isForceResyncing}
                        className="gap-2"
                        data-testid="button-sync"
                      >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing
                          ? isSpanish ? "Sincronizando..." : "Syncing..."
                          : isSpanish ? "Sincronizar" : "Sync"}
                      </Button>
                    </div>
                  </motion.div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {isSpanish ? "Resumen" : "Overview"}
                      </h2>
                      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
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

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid="card-stat-customers">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500">
                                {isSpanish ? "Clientes POS" : "POS Customers"}
                              </p>
                              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-customers">
                                {periodStats.totalCustomers.toLocaleString()}
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid="card-stat-linked">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500">
                                {isSpanish ? "Vinculados" : "Linked"}
                              </p>
                              <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="stat-linked">
                                {periodStats.linkedCustomers.toLocaleString()}
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <Link2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid="card-stat-transactions">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500">
                                {isSpanish ? "Transacciones" : "Transactions"}
                              </p>
                              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="stat-transactions">
                                {periodStats.totalTransactions.toLocaleString()}
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid="card-stat-sales">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500">
                                {isSpanish ? "Ventas Totales" : "Total Sales"}
                              </p>
                              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400" data-testid="stat-sales">
                                {formatCurrency(periodStats.totalSales)}
                              </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

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

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="overflow-hidden border-0 shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <CardTitle>
                              {isSpanish ? "Transacciones de Ventas" : "Sales Transactions"}
                            </CardTitle>
                          </div>
                          <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={isSpanish ? "Buscar..." : "Search..."}
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 bg-white dark:bg-gray-800"
                              data-testid="search-input"
                            />
                          </div>
                        </div>
                      </CardHeader>

                      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="date"
                            value={salesDateFrom}
                            onChange={(e) => handleSalesDateChange("from", e.target.value)}
                            className="w-[160px] h-9 bg-white dark:bg-gray-800"
                            data-testid="sales-date-from"
                          />
                          <span className="text-sm text-muted-foreground">—</span>
                          <Input
                            type="date"
                            value={salesDateTo}
                            onChange={(e) => handleSalesDateChange("to", e.target.value)}
                            className="w-[160px] h-9 bg-white dark:bg-gray-800"
                            data-testid="sales-date-to"
                          />
                        </div>

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
                              <SelectValue placeholder={isSpanish ? "Estado" : "Status"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                {isSpanish ? "Todos los estados" : "All statuses"}
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

                        <div className="ml-auto">
                          <Badge variant="secondary" className="font-normal">
                            {filteredSales.length} {isSpanish ? "ventas" : "sales"}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-0">
                        {salesLoading ? (
                          <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                            {!hasSalesFilters && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSync}
                                className="mt-4 gap-2"
                              >
                                <RefreshCw className="h-4 w-4" />
                                {isSpanish ? "Sincronizar ahora" : "Sync now"}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <TableHead className="font-semibold">
                                      {isSpanish ? "ID Transacción" : "Transaction ID"}
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                      {isSpanish ? "Cliente" : "Customer"}
                                    </TableHead>
                                    <TableHead className="font-semibold hidden md:table-cell">
                                      {isSpanish ? "Fecha" : "Date"}
                                    </TableHead>
                                    <TableHead className="font-semibold text-right">
                                      {isSpanish ? "Total" : "Total"}
                                    </TableHead>
                                    <TableHead className="font-semibold text-center">
                                      {isSpanish ? "Estado" : "Status"}
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
                                        <span className="font-mono text-sm">
                                          #{sale.transactionId}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                                            {sale.customerName?.charAt(0).toUpperCase() || "?"}
                                          </div>
                                          <span className="font-medium">
                                            {sale.customerName || (isSpanish ? "Cliente anónimo" : "Anonymous customer")}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="hidden md:table-cell">
                                        {formatDate(sale.transactionDate)}
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {formatCurrency(sale.totalAmount / 100)}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge
                                          className={
                                            sale.status === "completed"
                                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                              : sale.status === "pending"
                                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                : sale.status === "refunded"
                                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                          }
                                        >
                                          {sale.status === "completed"
                                            ? isSpanish ? "Completada" : "Completed"
                                            : sale.status === "pending"
                                              ? isSpanish ? "Pendiente" : "Pending"
                                              : sale.status === "refunded"
                                                ? isSpanish ? "Reembolsada" : "Refunded"
                                                : isSpanish ? "Cancelada" : "Cancelled"}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

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
                                  <SelectTrigger className="w-16 h-8" data-testid="sales-page-size">
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
                                  >
                                    <ChevronsLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setSalesPage((p) => Math.max(1, p - 1))}
                                    disabled={salesPage === 1}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setSalesPage((p) => Math.min(salesTotalPages, p + 1))}
                                    disabled={salesPage >= salesTotalPages}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setSalesPage(salesTotalPages)}
                                    disabled={salesPage >= salesTotalPages}
                                  >
                                    <ChevronsRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      <HelpChatbot />
    </div>
  );
}
