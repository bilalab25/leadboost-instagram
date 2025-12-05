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
  Phone,
  Mail,
  Building2,
  TrendingUp,
  Loader2,
  AlertCircle,
  Link2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Store,
  ArrowUpRight,
  Filter,
  MessageCircle,
  ShoppingBag,
  Calendar,
  MapPin,
  Plug,
  ExternalLink,
  DollarSign,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import type { PosCustomer, SalesTransaction, Conversation } from "@shared/schema";
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

interface CustomerWithConversation extends PosCustomer {
  linkedConversation?: Conversation;
}

export default function CustomersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeBrandId } = useBrand();
  const [, navigate] = useLocation();
  const { isSpanish } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [customerNameFilter, setCustomerNameFilter] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithConversation | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [customersPage, setCustomersPage] = useState(1);
  const [customersPageSize, setCustomersPageSize] = useState(10);

  const { data: lightspeedStatus, isLoading: statusLoading } = useQuery<LightspeedStatus>({
    queryKey: ["/api/lightspeed/status", activeBrandId],
    queryFn: async () => {
      const res = await fetch(`/api/lightspeed/status?brandId=${activeBrandId}`);
      if (!res.ok) {
        if (res.status === 404) return { connected: false };
        throw new Error("Failed to fetch status");
      }
      return res.json();
    },
    enabled: !!activeBrandId,
  });

  const {
    data: customers = [],
    isLoading: customersLoading,
    refetch: refetchCustomers,
  } = useQuery<PosCustomer[]>({
    queryKey: ["/api/lightspeed/customers", activeBrandId],
    queryFn: async () => {
      const res = await fetch(`/api/lightspeed/customers?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    enabled: !!activeBrandId && lightspeedStatus?.connected,
  });

  const { data: sales = [] } = useQuery<SalesTransaction[]>({
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

  const customersWithConversations = useMemo((): CustomerWithConversation[] => {
    return customers.map((customer) => {
      const customerPhones = [
        normalizePhone(customer.phone),
        normalizePhone(customer.mobile),
      ].filter(Boolean);

      const linkedConversation = conversations.find((conv) => {
        if (conv.platform !== "whatsapp" && conv.platform !== "whatsapp_baileys") return false;
        const convPhone = normalizePhone(conv.metaConversationId);
        return customerPhones.includes(convPhone);
      });

      return { ...customer, linkedConversation };
    });
  }, [customers, conversations]);

  const filteredCustomers = useMemo(() => {
    let result = customersWithConversations;

    if (customerNameFilter) {
      const lowerFilter = customerNameFilter.toLowerCase();
      result = result.filter((c) => c.name?.toLowerCase().includes(lowerFilter));
    }

    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(lowerSearch) ||
          c.email?.toLowerCase().includes(lowerSearch) ||
          c.phone?.includes(searchQuery) ||
          c.mobile?.includes(searchQuery)
      );
    }

    return result;
  }, [customersWithConversations, searchQuery, customerNameFilter]);

  const customersTotalPages = Math.ceil(filteredCustomers.length / customersPageSize);
  const paginatedCustomers = useMemo(() => {
    const start = (customersPage - 1) * customersPageSize;
    return filteredCustomers.slice(start, start + customersPageSize);
  }, [filteredCustomers, customersPage, customersPageSize]);

  const linkedCustomersCount = useMemo(() => {
    return customersWithConversations.filter((c) => c.linkedConversation).length;
  }, [customersWithConversations]);

  const totalYTD = useMemo(() => {
    return customers.reduce((sum, c) => {
      const ytd = parseFloat(c.yearToDate || "0");
      return sum + (isNaN(ytd) ? 0 : ytd);
    }, 0);
  }, [customers]);

  const getCustomerSales = (customerId: string) => {
    return sales.filter((s) => s.customerId === customerId);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/lightspeed/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: activeBrandId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Sync failed");
      }

      const data = await res.json();
      const customersCount = data.synced?.customers || 0;
      toast({
        title: isSpanish ? "Sincronización completada" : "Sync completed",
        description: isSpanish
          ? `${customersCount} clientes sincronizados`
          : `${customersCount} customers synced`,
      });

      refetchCustomers();
      queryClient.invalidateQueries({ queryKey: ["/api/lightspeed/status"] });
    } catch (error) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish ? "Error al sincronizar datos" : "Failed to sync data",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const openConversation = (conversationId: string) => {
    navigate(`/inbox?conversation=${conversationId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopHeader pageName={isSpanish ? "Clientes" : "Customers"} />
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
      <TopHeader pageName={isSpanish ? "Clientes" : "Customers"} />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="p-6 space-y-6" data-testid="page-customers">
              {!lightspeedStatus?.connected ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-2xl mx-auto mt-12"
                >
                  <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <CardContent className="py-16 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                        <Store className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                        {isSpanish ? "Conecta tu Punto de Venta" : "Connect Your Point of Sale"}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
                        {isSpanish
                          ? "Sincroniza tus clientes desde Lightspeed para ver su información, historial de compras y vincularlos con sus conversaciones de WhatsApp."
                          : "Sync your customers from Lightspeed to view their information, purchase history, and link them with their WhatsApp conversations."}
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
                            <Users className="h-4 w-4 text-blue-500 mt-0.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {isSpanish ? "Clientes sincronizados" : "Synced customers"}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Link2 className="h-4 w-4 text-green-500 mt-0.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {isSpanish ? "Vinculación WhatsApp" : "WhatsApp linking"}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-500 mt-0.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {isSpanish ? "Historial de compras" : "Purchase history"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <>
                  {/* Purple Gradient Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-violet-600 rounded-2xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h1 className="text-xl font-bold text-white" data-testid="text-page-title">
                            {isSpanish ? "Clientes POS" : "POS Customers"}
                          </h1>
                          <p className="text-white/80 text-sm">
                            {isSpanish
                              ? "Clientes sincronizados y vinculados con WhatsApp"
                              : "Customers synced and linked with WhatsApp"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0"
                        data-testid="button-sync"
                      >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing
                          ? isSpanish
                            ? "Sincronizando..."
                            : "Syncing..."
                          : isSpanish
                            ? "Sincronizar"
                            : "Sync"}
                      </Button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid="card-stat-total">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">
                              {isSpanish ? "Total Clientes" : "Total Customers"}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="stat-total">
                              {customers.length.toLocaleString()}
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
                              {isSpanish ? "Con WhatsApp" : "With WhatsApp"}
                            </p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="stat-linked">
                              {linkedCustomersCount.toLocaleString()}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <SiWhatsapp className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid="card-stat-unlinked">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">
                              {isSpanish ? "Sin Vincular" : "Not Linked"}
                            </p>
                            <p className="text-3xl font-bold text-gray-600 dark:text-gray-400" data-testid="stat-unlinked">
                              {(customers.length - linkedCustomersCount).toLocaleString()}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Link2 className="w-6 h-6 text-gray-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow" data-testid="card-stat-ytd">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">
                              {isSpanish ? "Total Año" : "Total YTD"}
                            </p>
                            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400" data-testid="stat-ytd">
                              {formatCurrency(totalYTD)}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="overflow-hidden border-0 shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              {isSpanish ? "Lista de Clientes" : "Customer List"}
                            </CardTitle>
                            <CardDescription>
                              {isSpanish
                                ? "Clientes desde Lightspeed POS"
                                : "Customers from Lightspeed POS"}
                            </CardDescription>
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

                      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                        <div className="relative flex-1 max-w-xs">
                          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={isSpanish ? "Filtrar por nombre..." : "Filter by name..."}
                            value={customerNameFilter}
                            onChange={(e) => {
                              setCustomerNameFilter(e.target.value);
                              setCustomersPage(1);
                            }}
                            className="pl-9 h-9 bg-white dark:bg-gray-800"
                            data-testid="customer-name-filter"
                          />
                        </div>
                        <Badge variant="secondary" className="font-normal">
                          {filteredCustomers.length} {isSpanish ? "clientes" : "customers"}
                        </Badge>
                      </div>

                      <CardContent className="p-0">
                        {customersLoading ? (
                          <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : filteredCustomers.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <Users className="h-7 w-7 text-gray-400" />
                            </div>
                            <p className="text-muted-foreground">
                              {customerNameFilter || searchQuery
                                ? isSpanish
                                  ? "No se encontraron clientes"
                                  : "No customers found"
                                : isSpanish
                                  ? "No hay clientes sincronizados"
                                  : "No customers synced yet"}
                            </p>
                            {!customerNameFilter && !searchQuery && (
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
                                            {customer.name?.charAt(0).toUpperCase() || "?"}
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
                                          {(customer.phone || customer.mobile) && (
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                              <Phone className="h-3.5 w-3.5" />
                                              {customer.phone || customer.mobile}
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
                                            onClick={() => openConversation(customer.linkedConversation!.id)}
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
                                            {isSpanish ? "Sin vincular" : "Not linked"}
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
                                  <SelectTrigger className="w-16 h-8" data-testid="customers-page-size">
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
                                  >
                                    <ChevronsLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCustomersPage((p) => Math.max(1, p - 1))}
                                    disabled={customersPage === 1}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCustomersPage((p) => Math.min(customersTotalPages, p + 1))}
                                    disabled={customersPage >= customersTotalPages}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCustomersPage(customersTotalPages)}
                                    disabled={customersPage >= customersTotalPages}
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

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400">
                {selectedCustomer?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <span>{selectedCustomer?.name}</span>
                {selectedCustomer?.customerCode && (
                  <p className="text-sm font-normal text-muted-foreground">
                    #{selectedCustomer.customerCode}
                  </p>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              {isSpanish ? "Detalles del cliente" : "Customer details"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {selectedCustomer && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-gray-200 dark:border-gray-700">
                    <CardContent className="pt-4 space-y-3">
                      <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                        {isSpanish ? "Información de Contacto" : "Contact Information"}
                      </h4>
                      {selectedCustomer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedCustomer.email}</span>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedCustomer.phone}</span>
                        </div>
                      )}
                      {selectedCustomer.mobile && selectedCustomer.mobile !== selectedCustomer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedCustomer.mobile} (Mobile)</span>
                        </div>
                      )}
                      {selectedCustomer.companyName && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedCustomer.companyName}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 dark:border-gray-700">
                    <CardContent className="pt-4 space-y-3">
                      <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                        {isSpanish ? "Estadísticas" : "Statistics"}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {isSpanish ? "Total Año" : "Year to Date"}
                        </span>
                        <span className="font-bold text-lg">
                          {selectedCustomer.yearToDate
                            ? `$${parseFloat(selectedCustomer.yearToDate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "$0.00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {isSpanish ? "Transacciones" : "Transactions"}
                        </span>
                        <span className="font-medium">
                          {getCustomerSales(selectedCustomer.id).length}
                        </span>
                      </div>
                      <div className="pt-2">
                        {selectedCustomer.linkedConversation ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                            onClick={() => {
                              setIsCustomerDialogOpen(false);
                              openConversation(selectedCustomer.linkedConversation!.id);
                            }}
                          >
                            <SiWhatsapp className="h-4 w-4" />
                            {isSpanish ? "Ver Conversación" : "View Conversation"}
                          </Button>
                        ) : (
                          <Badge variant="outline" className="w-full justify-center py-2">
                            {isSpanish ? "Sin conversación de WhatsApp" : "No WhatsApp conversation"}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      {isSpanish ? "Historial de Compras" : "Purchase History"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getCustomerSales(selectedCustomer.id).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>{isSpanish ? "No hay compras registradas" : "No purchases recorded"}</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {getCustomerSales(selectedCustomer.id)
                          .sort((a, b) => {
                            const dateA = a.transactionDate ? new Date(a.transactionDate).getTime() : 0;
                            const dateB = b.transactionDate ? new Date(b.transactionDate).getTime() : 0;
                            return dateB - dateA;
                          })
                          .slice(0, 10)
                          .map((sale) => (
                            <div
                              key={sale.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    #{sale.transactionId}
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {sale.transactionDate
                                      ? new Date(sale.transactionDate).toLocaleDateString()
                                      : "-"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">
                                  {formatCurrency(sale.totalAmount / 100)}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {sale.status || "completed"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <HelpChatbot />
    </div>
  );
}
