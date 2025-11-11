import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
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
  const { language, isSpanish, toggleLanguage } = useLanguage();

  // Fetch customers
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Customer mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowAddCustomer(false);
      toast({ title: "Customer created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create customer", variant: "destructive" });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
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
    mutationFn: async (data: any) => apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setShowAddInvoice(false);
      toast({ title: "Invoice created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create invoice", variant: "destructive" });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
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
    const data = {
      customerId: selectedCustomer?.id,
      invoiceNumber: formData.get("invoiceNumber") as string,
      amount: parseInt((formData.get("amount") as string) || "0") * 100, // Convert to cents
      description: formData.get("description") as string,
      dueDate: formData.get("dueDate") as string,
      status: formData.get("status") as string,
    };
    createInvoiceMutation.mutate(data);
  };

  const handleFileUpload = async (invoiceId: string) => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      return { method: "PUT" as const, url: response.uploadURL };
    } catch (error) {
      toast({ title: "Failed to get upload URL", variant: "destructive" });
      throw error;
    }
  };

  const handleFileUploadComplete =
    (invoiceId: string) =>
    (
      result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    ) => {
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

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Customers
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-total-customers"
                    >
                      {customers.length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Invoices
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-total-invoices"
                    >
                      {invoices.length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-total-revenue"
                    >
                      {formatCurrency(
                        invoices
                          .filter((inv) => inv.status === "paid")
                          .reduce((sum, inv) => sum + inv.amount, 0),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customers Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Customers</CardTitle>
                  <CardDescription>
                    View and manage all your customers
                  </CardDescription>
                </CardHeader>
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
                                variant="outline"
                                onClick={() => setSelectedCustomer(customer)}
                                data-testid={`button-view-customer-${customer.id}`}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Invoices Section */}
              {selectedCustomer && (
                <Card>
                  <CardHeader>
                    <CardTitle>Invoices for {selectedCustomer.name}</CardTitle>
                    <CardDescription>
                      Manage invoices and upload files for this customer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                                {getStatusBadge(invoice.status || "pending")}
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
                                  <span className="text-gray-500">No file</span>
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
                                  <Upload className="w-3 h-3 mr-1" />
                                  Upload
                                </ObjectUploader>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
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
