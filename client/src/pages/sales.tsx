import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
} from "lucide-react";
import type { PosCustomer, SalesTransaction, Conversation } from "@shared/schema";
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
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithConversation | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Pagination state
  const [customersPage, setCustomersPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const [customersPageSize, setCustomersPageSize] = useState(10);
  const [salesPageSize, setSalesPageSize] = useState(10);
  
  // Date filter state for sales
  const [salesDateFrom, setSalesDateFrom] = useState("");
  const [salesDateTo, setSalesDateTo] = useState("");

  // Fetch Lightspeed integration status
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

  // Fetch POS customers
  const { data: customers = [], isLoading: customersLoading, refetch: refetchCustomers } = useQuery<PosCustomer[]>({
    queryKey: ["/api/lightspeed/customers", activeBrandId],
    queryFn: async () => {
      const res = await fetch(`/api/lightspeed/customers?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    enabled: !!activeBrandId && lightspeedStatus?.connected,
  });

  // Fetch sales transactions
  const { data: sales = [], isLoading: salesLoading, refetch: refetchSales } = useQuery<SalesTransaction[]>({
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
    return phone.replace(/\D/g, "").slice(-10); // Get last 10 digits
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
        const convPhone = normalizePhone(conv.metaConversationId);
        return customerPhones.some((phone) => phone && convPhone.includes(phone));
      });

      return {
        ...customer,
        linkedConversation,
      };
    });
  }, [customers, conversations]);

  // Filter customers by name
  const filteredCustomers = useMemo(() => {
    let result = customersWithConversations;
    
    if (customerNameFilter.trim()) {
      const query = customerNameFilter.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.includes(query) ||
          c.mobile?.includes(query) ||
          c.companyName?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [customersWithConversations, customerNameFilter]);

  // Filter and sort sales (most recent first, with date range filter)
  const filteredSales = useMemo(() => {
    let result = [...sales];
    
    // Sort by date, most recent first
    result.sort((a, b) => {
      const dateA = a.transactionDate ? new Date(a.transactionDate).getTime() : 0;
      const dateB = b.transactionDate ? new Date(b.transactionDate).getTime() : 0;
      return dateB - dateA;
    });
    
    // Filter by date range
    if (salesDateFrom) {
      const fromDate = new Date(salesDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter((s) => {
        if (!s.transactionDate) return false;
        return new Date(s.transactionDate) >= fromDate;
      });
    }
    
    if (salesDateTo) {
      const toDate = new Date(salesDateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((s) => {
        if (!s.transactionDate) return false;
        return new Date(s.transactionDate) <= toDate;
      });
    }
    
    // Also filter by general search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.customerName?.toLowerCase().includes(query) ||
          s.customerEmail?.toLowerCase().includes(query) ||
          s.transactionId?.includes(query) ||
          s.customerPhone?.includes(query)
      );
    }
    
    return result;
  }, [sales, salesDateFrom, salesDateTo, searchQuery]);

  // Paginated data
  const paginatedCustomers = useMemo(() => {
    const start = (customersPage - 1) * customersPageSize;
    return filteredCustomers.slice(start, start + customersPageSize);
  }, [filteredCustomers, customersPage, customersPageSize]);

  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * salesPageSize;
    return filteredSales.slice(start, start + salesPageSize);
  }, [filteredSales, salesPage, salesPageSize]);

  // Total pages
  const customersTotalPages = Math.ceil(filteredCustomers.length / customersPageSize);
  const salesTotalPages = Math.ceil(filteredSales.length / salesPageSize);

  // Reset page when filters change
  const handleCustomerFilterChange = (value: string) => {
    setCustomerNameFilter(value);
    setCustomersPage(1);
  };

  const handleSalesDateChange = (type: 'from' | 'to', value: string) => {
    if (type === 'from') {
      setSalesDateFrom(value);
    } else {
      setSalesDateTo(value);
    }
    setSalesPage(1);
  };

  const clearSalesDateFilters = () => {
    setSalesDateFrom("");
    setSalesDateTo("");
    setSalesPage(1);
  };

  // Sync data from Lightspeed
  const handleSync = async () => {
    if (!activeBrandId) return;
    
    setIsSyncing(true);
    try {
      const res = await fetch("/api/lightspeed/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ brandId: activeBrandId }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Sync failed");
      }
      
      const data = await res.json();
      const customers = data.synced?.customers || 0;
      const sales = data.synced?.sales || 0;
      toast({
        title: isSpanish ? "Sincronización completada" : "Sync completed",
        description: isSpanish
          ? `${customers} clientes y ${sales} ventas sincronizadas`
          : `${customers} customers and ${sales} sales synced`,
      });
      
      refetchCustomers();
      refetchSales();
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

  // Customer count with linked WhatsApp
  const linkedCustomersCount = customersWithConversations.filter(
    (c) => c.linkedConversation
  ).length;

  if (!activeBrandId) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopHeader />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">
              {isSpanish ? "Selecciona una marca para continuar" : "Select a brand to continue"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isSpanish ? "Ventas y Clientes POS" : "POS Sales & Customers"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isSpanish
                    ? "Gestiona tus clientes y ventas de Lightspeed sincronizados con WhatsApp"
                    : "Manage your Lightspeed customers and sales linked with WhatsApp"}
                </p>
              </div>
              
              {lightspeedStatus?.connected && (
                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                  data-testid="sync-lightspeed"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {isSpanish ? "Sincronizar" : "Sync Now"}
                </Button>
              )}
            </div>

            {/* Status Cards */}
            {statusLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !lightspeedStatus?.connected ? (
              <Card className="border-dashed">
                <CardContent className="py-12">
                  <div className="text-center">
                    <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {isSpanish ? "Conecta Lightspeed Retail" : "Connect Lightspeed Retail"}
                    </h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      {isSpanish
                        ? "Conecta tu cuenta de Lightspeed para sincronizar clientes y ventas, y vincularlos automáticamente con conversaciones de WhatsApp."
                        : "Connect your Lightspeed account to sync customers and sales, and automatically link them with WhatsApp conversations."}
                    </p>
                    <Button onClick={() => navigate("/integrations")} data-testid="connect-lightspeed-cta">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {isSpanish ? "Ir a Integraciones" : "Go to Integrations"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {isSpanish ? "Clientes POS" : "POS Customers"}
                          </p>
                          <p className="text-2xl font-bold" data-testid="stat-customers">
                            {lightspeedStatus.stats?.totalCustomers || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Link2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {isSpanish ? "Vinculados a WhatsApp" : "Linked to WhatsApp"}
                          </p>
                          <p className="text-2xl font-bold" data-testid="stat-linked">
                            {linkedCustomersCount}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {isSpanish ? "Transacciones" : "Transactions"}
                          </p>
                          <p className="text-2xl font-bold" data-testid="stat-transactions">
                            {lightspeedStatus.stats?.totalTransactions || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {isSpanish ? "Ventas Totales" : "Total Sales"}
                          </p>
                          <p className="text-2xl font-bold" data-testid="stat-sales">
                            {formatCurrency(lightspeedStatus.stats?.totalSales || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Connection Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>
                    {isSpanish ? "Conectado a" : "Connected to"}: {lightspeedStatus.storeName}
                  </span>
                  {lightspeedStatus.lastSyncAt && (
                    <span className="ml-4">
                      {isSpanish ? "Última sincronización" : "Last sync"}: {formatDate(lightspeedStatus.lastSyncAt)}
                    </span>
                  )}
                </div>

                {/* Tabs */}
                <Card>
                  <CardContent className="pt-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <TabsList>
                          <TabsTrigger value="customers" data-testid="tab-customers">
                            <Users className="h-4 w-4 mr-2" />
                            {isSpanish ? "Clientes" : "Customers"}
                          </TabsTrigger>
                          <TabsTrigger value="sales" data-testid="tab-sales">
                            <DollarSign className="h-4 w-4 mr-2" />
                            {isSpanish ? "Ventas" : "Sales"}
                          </TabsTrigger>
                        </TabsList>

                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={isSpanish ? "Buscar..." : "Search..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                            data-testid="search-input"
                          />
                        </div>
                      </div>

                      {/* Customers Tab */}
                      <TabsContent value="customers">
                        {/* Customer Name Filter */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={isSpanish ? "Filtrar por nombre..." : "Filter by name..."}
                              value={customerNameFilter}
                              onChange={(e) => handleCustomerFilterChange(e.target.value)}
                              className="pl-9"
                              data-testid="customer-name-filter"
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {filteredCustomers.length} {isSpanish ? "clientes" : "customers"}
                          </div>
                        </div>

                        {customersLoading ? (
                          <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : filteredCustomers.length === 0 ? (
                          <div className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{isSpanish ? "Nombre" : "Name"}</TableHead>
                                  <TableHead>{isSpanish ? "Contacto" : "Contact"}</TableHead>
                                  <TableHead>{isSpanish ? "Empresa" : "Company"}</TableHead>
                                  <TableHead className="text-right">{isSpanish ? "Total Año" : "YTD"}</TableHead>
                                  <TableHead className="text-center">WhatsApp</TableHead>
                                  <TableHead className="text-right">{isSpanish ? "Acciones" : "Actions"}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {paginatedCustomers.map((customer) => (
                                  <TableRow key={customer.id} data-testid={`customer-row-${customer.id}`}>
                                    <TableCell>
                                      <div className="font-medium">{customer.name}</div>
                                      {customer.customerCode && (
                                        <div className="text-xs text-muted-foreground">
                                          #{customer.customerCode}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1">
                                        {customer.email && (
                                          <div className="flex items-center gap-1 text-sm">
                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                            {customer.email}
                                          </div>
                                        )}
                                        {(customer.phone || customer.mobile) && (
                                          <div className="flex items-center gap-1 text-sm">
                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                            {customer.phone || customer.mobile}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {customer.companyName && (
                                        <div className="flex items-center gap-1">
                                          <Building2 className="h-3 w-3 text-muted-foreground" />
                                          {customer.companyName}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {customer.yearToDate
                                        ? `$${parseFloat(customer.yearToDate).toFixed(2)}`
                                        : "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {customer.linkedConversation ? (
                                        <Badge
                                          variant="secondary"
                                          className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-pointer"
                                          onClick={() => openConversation(customer.linkedConversation!.id)}
                                          data-testid={`linked-badge-${customer.id}`}
                                        >
                                          <MessageCircle className="h-3 w-3 mr-1" />
                                          {isSpanish ? "Vinculado" : "Linked"}
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-muted-foreground">
                                          {isSpanish ? "Sin vincular" : "Not linked"}
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedCustomer(customer);
                                          setIsCustomerDialogOpen(true);
                                        }}
                                        data-testid={`view-customer-${customer.id}`}
                                      >
                                        {isSpanish ? "Ver" : "View"}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Customers Pagination */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {isSpanish ? "Filas por página:" : "Rows per page:"}
                              </span>
                              <Select
                                value={String(customersPageSize)}
                                onValueChange={(value) => {
                                  setCustomersPageSize(Number(value));
                                  setCustomersPage(1);
                                }}
                              >
                                <SelectTrigger className="w-[70px] h-8" data-testid="customers-page-size">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5</SelectItem>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                  <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground mr-2">
                                {isSpanish ? "Página" : "Page"} {customersPage} {isSpanish ? "de" : "of"} {customersTotalPages || 1}
                              </span>
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
                                onClick={() => setCustomersPage(p => Math.max(1, p - 1))}
                                disabled={customersPage === 1}
                                data-testid="customers-prev-page"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCustomersPage(p => Math.min(customersTotalPages, p + 1))}
                                disabled={customersPage >= customersTotalPages}
                                data-testid="customers-next-page"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCustomersPage(customersTotalPages)}
                                disabled={customersPage >= customersTotalPages}
                                data-testid="customers-last-page"
                              >
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          </>
                        )}
                      </TabsContent>

                      {/* Sales Tab */}
                      <TabsContent value="sales">
                        {/* Sales Date Filter */}
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {isSpanish ? "Desde:" : "From:"}
                            </span>
                            <Input
                              type="date"
                              value={salesDateFrom}
                              onChange={(e) => handleSalesDateChange('from', e.target.value)}
                              className="w-[150px] h-8"
                              data-testid="sales-date-from"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {isSpanish ? "Hasta:" : "To:"}
                            </span>
                            <Input
                              type="date"
                              value={salesDateTo}
                              onChange={(e) => handleSalesDateChange('to', e.target.value)}
                              className="w-[150px] h-8"
                              data-testid="sales-date-to"
                            />
                          </div>
                          {(salesDateFrom || salesDateTo) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearSalesDateFilters}
                              className="h-8"
                              data-testid="clear-date-filters"
                            >
                              <X className="h-4 w-4 mr-1" />
                              {isSpanish ? "Limpiar" : "Clear"}
                            </Button>
                          )}
                          <div className="ml-auto text-sm text-muted-foreground">
                            {filteredSales.length} {isSpanish ? "ventas" : "sales"}
                          </div>
                        </div>

                        {salesLoading ? (
                          <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : filteredSales.length === 0 ? (
                          <div className="text-center py-12">
                            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                              {(salesDateFrom || salesDateTo)
                                ? isSpanish
                                  ? "No se encontraron ventas en este rango de fechas"
                                  : "No sales found in this date range"
                                : isSpanish
                                ? "No hay ventas sincronizadas"
                                : "No sales synced yet"}
                            </p>
                          </div>
                        ) : (
                          <>
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{isSpanish ? "Fecha" : "Date"}</TableHead>
                                  <TableHead>{isSpanish ? "ID Transacción" : "Transaction ID"}</TableHead>
                                  <TableHead>{isSpanish ? "Cliente" : "Customer"}</TableHead>
                                  <TableHead>{isSpanish ? "Estado" : "Status"}</TableHead>
                                  <TableHead className="text-right">{isSpanish ? "Total" : "Total"}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {paginatedSales.map((sale) => (
                                  <TableRow key={sale.id} data-testid={`sale-row-${sale.id}`}>
                                    <TableCell>
                                      {formatDate(sale.transactionDate)}
                                    </TableCell>
                                    <TableCell>
                                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                        {sale.transactionId?.slice(0, 8)}...
                                      </code>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-medium">
                                        {sale.customerName || isSpanish ? "Cliente anónimo" : "Walk-in"}
                                      </div>
                                      {sale.customerEmail && (
                                        <div className="text-xs text-muted-foreground">
                                          {sale.customerEmail}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={sale.status === "completed" ? "default" : "secondary"}
                                        className={
                                          sale.status === "completed"
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : ""
                                        }
                                      >
                                        {sale.status === "completed"
                                          ? isSpanish
                                            ? "Completada"
                                            : "Completed"
                                          : sale.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {formatCurrency(sale.totalAmount)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Sales Pagination */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {isSpanish ? "Filas por página:" : "Rows per page:"}
                              </span>
                              <Select
                                value={String(salesPageSize)}
                                onValueChange={(value) => {
                                  setSalesPageSize(Number(value));
                                  setSalesPage(1);
                                }}
                              >
                                <SelectTrigger className="w-[70px] h-8" data-testid="sales-page-size">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5</SelectItem>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                  <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground mr-2">
                                {isSpanish ? "Página" : "Page"} {salesPage} {isSpanish ? "de" : "of"} {salesTotalPages || 1}
                              </span>
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
                                onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                                disabled={salesPage === 1}
                                data-testid="sales-prev-page"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSalesPage(p => Math.min(salesTotalPages, p + 1))}
                                disabled={salesPage >= salesTotalPages}
                                data-testid="sales-next-page"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSalesPage(salesTotalPages)}
                                disabled={salesPage >= salesTotalPages}
                                data-testid="sales-last-page"
                              >
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          </>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isSpanish ? "Detalles del Cliente" : "Customer Details"}</DialogTitle>
            <DialogDescription>
              {isSpanish
                ? "Información sincronizada desde Lightspeed Retail"
                : "Information synced from Lightspeed Retail"}
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedCustomer.name}</h3>
                    {selectedCustomer.customerCode && (
                      <p className="text-sm text-muted-foreground">
                        #{selectedCustomer.customerCode}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedCustomer.email && (
                    <div>
                      <p className="text-muted-foreground">{isSpanish ? "Email" : "Email"}</p>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                  )}
                  {(selectedCustomer.phone || selectedCustomer.mobile) && (
                    <div>
                      <p className="text-muted-foreground">{isSpanish ? "Teléfono" : "Phone"}</p>
                      <p className="font-medium">{selectedCustomer.phone || selectedCustomer.mobile}</p>
                    </div>
                  )}
                  {selectedCustomer.companyName && (
                    <div>
                      <p className="text-muted-foreground">{isSpanish ? "Empresa" : "Company"}</p>
                      <p className="font-medium">{selectedCustomer.companyName}</p>
                    </div>
                  )}
                  {selectedCustomer.yearToDate && (
                    <div>
                      <p className="text-muted-foreground">{isSpanish ? "Total del año" : "Year to Date"}</p>
                      <p className="font-medium">${parseFloat(selectedCustomer.yearToDate).toFixed(2)}</p>
                    </div>
                  )}
                  {selectedCustomer.loyaltyBalance && (
                    <div>
                      <p className="text-muted-foreground">{isSpanish ? "Puntos Lealtad" : "Loyalty Points"}</p>
                      <p className="font-medium">{selectedCustomer.loyaltyBalance}</p>
                    </div>
                  )}
                  {selectedCustomer.balance && (
                    <div>
                      <p className="text-muted-foreground">{isSpanish ? "Saldo" : "Balance"}</p>
                      <p className="font-medium">${parseFloat(selectedCustomer.balance).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* WhatsApp Link Status */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  {isSpanish ? "Conexión WhatsApp" : "WhatsApp Connection"}
                </h4>
                {selectedCustomer.linkedConversation ? (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          {isSpanish ? "Conversación vinculada" : "Conversation linked"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.linkedConversation.contactName}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          openConversation(selectedCustomer.linkedConversation!.id);
                          setIsCustomerDialogOpen(false);
                        }}
                        data-testid="open-conversation-btn"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {isSpanish ? "Abrir" : "Open"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">
                        {isSpanish
                          ? "No hay conversación de WhatsApp vinculada con este número de teléfono"
                          : "No WhatsApp conversation linked to this phone number"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Last Sync */}
              {selectedCustomer.lastSyncAt && (
                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                  {isSpanish ? "Última sincronización" : "Last synced"}: {formatDate(selectedCustomer.lastSyncAt)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <HelpChatbot />
    </div>
  );
}
