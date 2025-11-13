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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus,
  DollarSign,
  FileText,
  Upload,
  Eye,
  Edit,
  MessageCircle,
  User,
  Calendar,
  Info,
} from "lucide-react";
import type { Customer, Invoice } from "@shared/schema";
import type { UploadResult } from "@uppy/core";
import HelpChatbot from "@/components/HelpChatbot";
import { useLanguage } from "@/hooks/useLanguage";

interface CustomerWithInvoices extends Customer {
  invoices?: Invoice[];
}

interface InvoiceWithCustomer extends Invoice {
  customer?: Customer;
}

export default function CustomersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeBrandId } = useBrand();
  const [, navigate] = useLocation();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [newCustomerStatus, setNewCustomerStatus] = useState("active");
  const [editCustomerStatus, setEditCustomerStatus] = useState("active");
  const [dateFilter, setDateFilter] = useState<"current" | "all">("current");
  const { language, isSpanish, toggleLanguage } = useLanguage();

  // Fetch customers (brand-scoped)
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers", activeBrandId],
    queryFn: async () => {
      const res = await fetch(`/api/customers?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    enabled: !!activeBrandId,
  });

  // Fetch invoices (brand-scoped)
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<
    InvoiceWithCustomer[]
  >({
    queryKey: ["/api/invoices", activeBrandId],
    queryFn: async () => {
      const res = await fetch(`/api/invoices?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    enabled: !!activeBrandId,
  });

  // Customer mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!activeBrandId) throw new Error("No active brand");

      return apiRequest(
        "POST",
        `/api/customers?brandId=${activeBrandId}`,
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/customers", activeBrandId],
      });
      setShowAddCustomer(false);
      toast({ title: "Customer created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create customer", variant: "destructive" });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!activeBrandId) throw new Error("No active brand");

      return apiRequest(
        "PUT",
        `/api/customers/${id}?brandId=${activeBrandId}`,
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/customers", activeBrandId],
      });
      setShowEditCustomer(false);
      setEditingCustomer(null);
      toast({ title: "Customer updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update customer", variant: "destructive" });
    },
  });

  // Invoice mutations
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!activeBrandId) throw new Error("No active brand");

      return apiRequest("POST", `/api/invoices?brandId=${activeBrandId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/invoices", activeBrandId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/customers", activeBrandId],
      });
      setShowAddInvoice(false);
      toast({ title: "Invoice created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create invoice", variant: "destructive" });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!activeBrandId) throw new Error("No active brand");

      return apiRequest(
        "PUT",
        `/api/invoices/${id}?brandId=${activeBrandId}`,
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/invoices", activeBrandId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/customers", activeBrandId],
      });
      toast({ title: "Invoice updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update invoice", variant: "destructive" });
    },
  });

  const handleAddCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      address: formData.get("address") as string,
      notes: formData.get("notes") as string,
      status: newCustomerStatus,
    };
    createCustomerMutation.mutate(data);
  };

  const handleEditCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      address: formData.get("address") as string,
      notes: formData.get("notes") as string,
      status: editCustomerStatus,
    };
    updateCustomerMutation.mutate({ id: editingCustomer.id, data });
  };

  const handleAddInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dueDateValue = formData.get("dueDate") as string;
    console.log(dueDateValue);
    const data = {
      customerId: selectedCustomer?.id,
      invoiceNumber: formData.get("invoiceNumber") as string,
      amount: parseInt((formData.get("amount") as string) || "0") * 100, // Convert to cents
      description: formData.get("description") as string,
      dueDate: dueDateValue ? new Date(dueDateValue) : undefined,
      status: formData.get("status") as string,
    };
    createInvoiceMutation.mutate(data);
  };

  const handleFileUpload = async (invoiceId: string) => {
    try {
      const response: any = await apiRequest("POST", "/api/objects/upload");
      return { method: "PUT" as const, url: response.uploadURL };
    } catch (error) {
      toast({ title: "Failed to get upload URL", variant: "destructive" });
      throw error;
    }
  };

  const handleFileUploadComplete = (invoiceId: string) => (result: any) => {
    if (result.successful && result.successful[0]) {
      const fileUrl = result.successful[0].uploadURL;
      updateInvoiceMutation.mutate({
        id: invoiceId,
        data: { fileUrl },
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "destructive" | "outline" | "secondary"
    > = {
      active: "default",
      inactive: "secondary",
      prospect: "outline",
      pending: "outline",
      paid: "default",
      overdue: "destructive",
      cancelled: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  // Helper function to check if date is in current month
  const isInCurrentMonth = (date: Date) => {
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  // Filter invoices based on date filter
  const filteredInvoices = useMemo(() => {
    if (dateFilter === "all") return invoices;

    return invoices.filter((inv: InvoiceWithCustomer) => {
      const createdDate = new Date(inv.createdAt);
      return isInCurrentMonth(createdDate);
    });
  }, [invoices, dateFilter]);

  // Filter customers who have invoices in the selected period
  const filteredCustomers = useMemo(() => {
    if (dateFilter === "all") return customers;

    const customerIdsWithInvoices = new Set(
      filteredInvoices.map((inv: InvoiceWithCustomer) => inv.customerId),
    );

    return customers.filter((customer: Customer) =>
      customerIdsWithInvoices.has(customer.id),
    );
  }, [customers, filteredInvoices, dateFilter]);

  // Calculate total revenue based on filter
  const totalRevenue = useMemo(() => {
    const paidInvoices = filteredInvoices.filter(
      (inv: InvoiceWithCustomer) => inv.status === "paid",
    );
    return paidInvoices.reduce(
      (sum: number, inv: InvoiceWithCustomer) => sum + inv.amount,
      0,
    );
  }, [filteredInvoices]);

  // Get current month name for display
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }, []);

  if (customersLoading || invoicesLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName="Customer Management" />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="p-6 space-y-6" data-testid="page-customers">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1
                    className="text-3xl font-bold text-gray-900"
                    data-testid="text-page-title"
                  >
                    Customer Management
                  </h1>
                  <p className="text-gray-600">
                    Manage your customers and their invoices
                  </p>
                </div>
                <Dialog
                  open={showAddCustomer}
                  onOpenChange={setShowAddCustomer}
                >
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-customer">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                      <DialogDescription>
                        Create a new customer record for your business
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCustomer} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Customer Name</Label>
                        <Input
                          id="name"
                          name="name"
                          required
                          data-testid="input-customer-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          data-testid="input-customer-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          data-testid="input-customer-phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          name="company"
                          data-testid="input-customer-company"
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          name="address"
                          data-testid="input-customer-address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          data-testid="input-customer-notes"
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={newCustomerStatus}
                          onValueChange={setNewCustomerStatus}
                        >
                          <SelectTrigger data-testid="select-customer-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="prospect">Prospect</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowAddCustomer(false)}
                          data-testid="button-cancel-customer"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createCustomerMutation.isPending}
                          data-testid="button-save-customer"
                        >
                          Create Customer
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Edit Customer Dialog */}
                <Dialog
                  open={showEditCustomer}
                  onOpenChange={setShowEditCustomer}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Customer</DialogTitle>
                      <DialogDescription>
                        Update customer information
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditCustomer} className="space-y-4">
                      <div>
                        <Label htmlFor="edit-name">Customer Name</Label>
                        <Input
                          id="edit-name"
                          name="name"
                          defaultValue={editingCustomer?.name}
                          required
                          data-testid="input-edit-customer-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          name="email"
                          type="email"
                          defaultValue={editingCustomer?.email || ""}
                          data-testid="input-edit-customer-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                          id="edit-phone"
                          name="phone"
                          defaultValue={editingCustomer?.phone || ""}
                          data-testid="input-edit-customer-phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-company">Company</Label>
                        <Input
                          id="edit-company"
                          name="company"
                          defaultValue={editingCustomer?.company || ""}
                          data-testid="input-edit-customer-company"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-address">Address</Label>
                        <Textarea
                          id="edit-address"
                          name="address"
                          defaultValue={editingCustomer?.address || ""}
                          data-testid="input-edit-customer-address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-notes">Notes</Label>
                        <Textarea
                          id="edit-notes"
                          name="notes"
                          defaultValue={editingCustomer?.notes || ""}
                          data-testid="input-edit-customer-notes"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-status">Status</Label>
                        <Select
                          value={editCustomerStatus}
                          onValueChange={setEditCustomerStatus}
                        >
                          <SelectTrigger data-testid="select-edit-customer-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="prospect">Prospect</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEditCustomer(false)}
                          data-testid="button-cancel-edit-customer"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateCustomerMutation.isPending}
                          data-testid="button-save-edit-customer"
                        >
                          Update Customer
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Stats Cards with Global Date Filter */}
              <div className="space-y-4">
                <div className="flex justify-end gap-2">
                  <Button
                    variant={dateFilter === "current" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("current")}
                    data-testid="button-filter-current-month"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Current Month
                  </Button>
                  <Button
                    variant={dateFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("all")}
                    data-testid="button-filter-all-time"
                  >
                    All Time
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex flex-col">
                        <CardTitle className="text-sm font-medium">
                          Total Customers
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {dateFilter === "current"
                            ? "with invoices in " + currentMonthName
                            : "All Time"}
                        </CardDescription>
                      </div>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div
                        className="text-2xl font-bold"
                        data-testid="text-total-customers"
                      >
                        {filteredCustomers.length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex flex-col">
                        <CardTitle className="text-sm font-medium">
                          Total Invoices
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {dateFilter === "current"
                            ? currentMonthName
                            : "All Time"}
                        </CardDescription>
                      </div>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div
                        className="text-2xl font-bold"
                        data-testid="text-total-invoices"
                      >
                        {filteredInvoices.length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex flex-col">
                        <CardTitle className="text-sm font-medium">
                          Total Revenue
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {dateFilter === "current"
                            ? currentMonthName
                            : "All Time"}
                        </CardDescription>
                      </div>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div
                        className="text-2xl font-bold"
                        data-testid="text-total-revenue"
                      >
                        {formatCurrency(totalRevenue)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Customers Table */}
              <Accordion type="single" collapsible defaultValue="customers">
                <AccordionItem value="customers">
                  <Card>
                    <CardHeader>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col items-start">
                          <CardTitle>Customers</CardTitle>
                          <CardDescription>
                            View and manage all your customers
                          </CardDescription>
                        </div>
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Total Invoiced</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customers.map((customer: Customer) => (
                              <TableRow
                                key={customer.id}
                                data-testid={`row-customer-${customer.id}`}
                              >
                                <TableCell
                                  className="font-medium"
                                  data-testid={`text-customer-name-${customer.id}`}
                                >
                                  {customer.name}
                                </TableCell>
                                <TableCell
                                  data-testid={`text-customer-company-${customer.id}`}
                                >
                                  {customer.company || "-"}
                                </TableCell>
                                <TableCell
                                  data-testid={`text-customer-email-${customer.id}`}
                                >
                                  {customer.email || "-"}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(customer.status || "active")}
                                </TableCell>
                                <TableCell
                                  data-testid={`text-customer-total-${customer.id}`}
                                >
                                  {formatCurrency(customer.totalInvoiced || 0)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    {customer.conversationId && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          navigate(
                                            `/inbox?conversationId=${customer.conversationId}`,
                                          )
                                        }
                                        data-testid={`button-view-conversation-${customer.id}`}
                                      >
                                        <MessageCircle className="w-4 h-4 mr-1" />
                                        Chat
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingCustomer(customer);
                                        setEditCustomerStatus(
                                          customer.status || "active",
                                        );
                                        setShowEditCustomer(true);
                                      }}
                                      data-testid={`button-edit-customer-${customer.id}`}
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedCustomer(customer);
                                        setShowAddInvoice(true);
                                      }}
                                      data-testid={`button-add-invoice-${customer.id}`}
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Invoice
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={
                                        selectedCustomer?.id === customer.id
                                          ? "default"
                                          : "outline"
                                      }
                                      onClick={() =>
                                        setSelectedCustomer(
                                          selectedCustomer?.id === customer.id
                                            ? null
                                            : customer,
                                        )
                                      }
                                      data-testid={`button-view-customer-${customer.id}`}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      {selectedCustomer?.id === customer.id
                                        ? "Hide"
                                        : "View"}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              </Accordion>

              {/* Customer Details Section */}
              {selectedCustomer && (
                <Card>
                  <CardContent className="p-0">
                    {/* Customer Info Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500 rounded-full">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {selectedCustomer.name}
                            </h3>
                            <div className="mt-2 space-y-1 text-sm text-gray-700">
                              {selectedCustomer.email && (
                                <p className="flex items-center gap-2">
                                  <span className="font-medium">Email:</span>{" "}
                                  {selectedCustomer.email}
                                </p>
                              )}
                              {selectedCustomer.phone && (
                                <p className="flex items-center gap-2">
                                  <span className="font-medium">Phone:</span>{" "}
                                  {selectedCustomer.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Company & Address
                            </p>
                            <div className="mt-2 space-y-1 text-sm text-gray-700">
                              {selectedCustomer.company && (
                                <p className="flex items-center gap-2">
                                  <span className="font-medium">Company:</span>{" "}
                                  {selectedCustomer.company}
                                </p>
                              )}
                              {selectedCustomer.address && (
                                <p className="flex items-center gap-2">
                                  <span className="font-medium">Address:</span>{" "}
                                  {selectedCustomer.address}
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Revenue & Status
                            </p>
                            <div className="mt-2 space-y-2">
                              <div className="bg-white rounded-lg p-3 border border-blue-200">
                                <p className="text-xs text-gray-600">
                                  Total Revenue
                                </p>
                                <p
                                  className="text-2xl font-bold text-blue-600"
                                  data-testid="text-customer-banner-revenue"
                                >
                                  {formatCurrency(
                                    selectedCustomer.totalInvoiced || 0,
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">
                                  Status:
                                </span>
                                {getStatusBadge(
                                  selectedCustomer.status || "active",
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {selectedCustomer.notes && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            Notes:
                          </p>
                          <p className="text-sm text-gray-700">
                            {selectedCustomer.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Invoices Table */}
                    <div>
                      <div className="p-6 pb-2">
                        <CardTitle>
                          Invoices for {selectedCustomer.name}
                        </CardTitle>
                        <CardDescription>
                          Manage invoices and upload files for this customer
                        </CardDescription>
                      </div>
                      <div className="p-6 pt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice #</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>File</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices
                              .filter(
                                (invoice: InvoiceWithCustomer) =>
                                  invoice.customerId === selectedCustomer.id,
                              )
                              .map((invoice: InvoiceWithCustomer) => (
                                <TableRow
                                  key={invoice.id}
                                  data-testid={`row-invoice-${invoice.id}`}
                                >
                                  <TableCell
                                    className="font-medium"
                                    data-testid={`text-invoice-number-${invoice.id}`}
                                  >
                                    {invoice.invoiceNumber}
                                  </TableCell>
                                  <TableCell
                                    data-testid={`text-invoice-amount-${invoice.id}`}
                                  >
                                    {formatCurrency(invoice.amount)}
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(
                                      invoice.status || "pending",
                                    )}
                                  </TableCell>
                                  <TableCell
                                    data-testid={`text-invoice-due-${invoice.id}`}
                                  >
                                    {invoice.dueDate
                                      ? new Date(
                                          invoice.dueDate,
                                        ).toLocaleDateString()
                                      : "-"}
                                  </TableCell>
                                  <TableCell>
                                    {invoice.fileUrl ? (
                                      <a
                                        href={invoice.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                      >
                                        View File
                                      </a>
                                    ) : (
                                      <span className="text-gray-500">
                                        No file
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <ObjectUploader
                                      maxNumberOfFiles={1}
                                      maxFileSize={10485760} // 10MB
                                      onGetUploadParameters={() =>
                                        handleFileUpload(invoice.id)
                                      }
                                      onComplete={handleFileUploadComplete(
                                        invoice.id,
                                      )}
                                      buttonClassName="h-8 px-2 text-xs"
                                    >
                                      Upload
                                    </ObjectUploader>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Invoice Dialog */}
              <Dialog open={showAddInvoice} onOpenChange={setShowAddInvoice}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Add Invoice for {selectedCustomer?.name}
                    </DialogTitle>
                    <DialogDescription>
                      Create a new invoice for this customer
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddInvoice} className="space-y-4">
                    <div>
                      <Label htmlFor="invoiceNumber">Invoice Number</Label>
                      <Input
                        id="invoiceNumber"
                        name="invoiceNumber"
                        required
                        data-testid="input-invoice-number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount (USD)</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        required
                        data-testid="input-invoice-amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        data-testid="input-invoice-description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                        data-testid="input-invoice-due-date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue="pending">
                        <SelectTrigger data-testid="select-invoice-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddInvoice(false)}
                        data-testid="button-cancel-invoice"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createInvoiceMutation.isPending}
                        data-testid="button-save-invoice"
                      >
                        Create Invoice
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {/* Help AI Chatbot */}
            <HelpChatbot
              isSpanish={isSpanish}
              toggleLanguage={toggleLanguage}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
