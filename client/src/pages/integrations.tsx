import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Store, CreditCard, ShoppingBag, Globe, Trash2, RefreshCw } from "lucide-react";

interface PosIntegration {
  id: string;
  provider: string;
  storeName: string;
  storeUrl?: string;
  isActive: boolean;
  syncEnabled: boolean;
  lastSyncAt?: string;
  settings?: any;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  sku?: string;
  category?: string;
  imageUrl?: string;
  isActive: boolean;
  stockQuantity?: number;
}

interface SalesTransaction {
  id: string;
  transactionId: string;
  customerName?: string;
  customerEmail?: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  transactionDate: string;
}

const PROVIDER_INFO = {
  square: {
    name: "Square",
    icon: CreditCard,
    description: "Point of sale and payment processing",
    fields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true },
      { name: "applicationId", label: "Application ID", type: "text", required: false },
    ]
  },
  shopify: {
    name: "Shopify",
    icon: ShoppingBag,
    description: "E-commerce platform",
    fields: [
      { name: "storeUrl", label: "Store URL", type: "text", required: true, placeholder: "your-store.myshopify.com" },
      { name: "accessToken", label: "Access Token", type: "password", required: true },
      { name: "apiKey", label: "API Key", type: "text", required: false },
    ]
  },
  stripe: {
    name: "Stripe",
    icon: CreditCard,
    description: "Online payment processing",
    fields: [
      { name: "secretKey", label: "Secret Key", type: "password", required: true, placeholder: "sk_..." },
      { name: "publishableKey", label: "Publishable Key", type: "text", required: false, placeholder: "pk_..." },
    ]
  },
  woocommerce: {
    name: "WooCommerce",
    icon: Globe,
    description: "WordPress e-commerce plugin",
    fields: [
      { name: "siteUrl", label: "Site URL", type: "text", required: true, placeholder: "https://yourstore.com" },
      { name: "consumerKey", label: "Consumer Key", type: "text", required: true },
      { name: "consumerSecret", label: "Consumer Secret", type: "password", required: true },
    ]
  }
};

export default function Integrations() {
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      provider: "",
      storeName: "",
      accessToken: "",
      apiKey: "",
      storeUrl: "",
      secretKey: "",
      publishableKey: "",
      applicationId: "",
      consumerKey: "",
      consumerSecret: "",
      siteUrl: "",
    }
  });

  // Fetch POS integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['/api/pos-integrations'],
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Fetch sales transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/sales-transactions'],
  });

  // Create integration mutation
  const createIntegration = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/pos-integrations', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pos-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "POS integration created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create integration",
        variant: "destructive",
      });
    },
  });

  // Delete integration mutation
  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/pos-integrations/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pos-integrations'] });
      toast({
        title: "Success",
        description: "Integration deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete integration",
        variant: "destructive",
      });
    },
  });

  // Sync products mutation
  const syncProducts = useMutation({
    mutationFn: async (integrationId: string) => {
      return await apiRequest(`/api/pos-integrations/${integrationId}/sync-products`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Success",
        description: "Products synced successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sync products",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    const providerInfo = PROVIDER_INFO[data.provider as keyof typeof PROVIDER_INFO];
    const integrationData: any = {
      provider: data.provider,
      storeName: data.storeName,
    };

    // Map form fields to integration data based on provider
    providerInfo.fields.forEach(field => {
      if (data[field.name]) {
        integrationData[field.name] = data[field.name];
      }
    });

    createIntegration.mutate(integrationData);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <TopHeader pageName="POS Integrations" />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="container mx-auto py-6 space-y-6" data-testid="integrations-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">POS Integrations</h1>
          <p className="text-muted-foreground">
            Connect your point-of-sale systems to sync sales data and automate social media campaigns
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-integration-button">
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add POS Integration</DialogTitle>
              <DialogDescription>
                Connect a new point-of-sale system to sync sales data and trigger automated campaigns
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>POS Provider</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedProvider(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="provider-select">
                            <SelectValue placeholder="Select a POS provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <info.icon className="h-4 w-4" />
                                {info.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedProvider && (
                  <>
                    <FormField
                      control={form.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your store name"
                              {...field}
                              data-testid="store-name-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {PROVIDER_INFO[selectedProvider as keyof typeof PROVIDER_INFO].fields.map((field) => (
                      <FormField
                        key={field.name}
                        control={form.control}
                        name={field.name as any}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              <Input
                                type={field.type}
                                placeholder={field.placeholder}
                                {...formField}
                                data-testid={`${field.name}-input`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="cancel-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createIntegration.isPending || !selectedProvider}
                    data-testid="create-integration-button"
                  >
                    {createIntegration.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Create Integration
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Connected Integrations
          </CardTitle>
          <CardDescription>
            Manage your connected POS systems and sync settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrationsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : integrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No POS integrations connected yet</p>
              <p className="text-sm">Add your first integration to start syncing sales data</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {integrations.map((integration: PosIntegration) => {
                const providerInfo = PROVIDER_INFO[integration.provider as keyof typeof PROVIDER_INFO];
                const IconComponent = providerInfo?.icon || Store;
                
                return (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`integration-${integration.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{integration.storeName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {providerInfo?.name} • {integration.storeUrl}
                        </p>
                        {integration.lastSyncAt && (
                          <p className="text-xs text-muted-foreground">
                            Last sync: {formatDate(integration.lastSyncAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.isActive ? "default" : "secondary"}>
                        {integration.isActive ? "Active" : "Inactive"}
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncProducts.mutate(integration.id)}
                        disabled={syncProducts.isPending}
                        data-testid={`sync-products-${integration.id}`}
                      >
                        {syncProducts.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteIntegration.mutate(integration.id)}
                        disabled={deleteIntegration.isPending}
                        data-testid={`delete-integration-${integration.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products and Transactions Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle>Synced Products</CardTitle>
            <CardDescription>Products imported from your POS systems</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No products synced yet
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {products.slice(0, 10).map((product: Product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded"
                    data-testid={`product-${product.id}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {product.sku} • {product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(product.price, product.currency)}
                      </p>
                      {product.stockQuantity !== null && (
                        <p className="text-xs text-muted-foreground">
                          Stock: {product.stockQuantity}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest sales from your POS systems</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No transactions synced yet
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {transactions.slice(0, 10).map((transaction: SalesTransaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {transaction.customerName || "Guest Customer"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {transaction.paymentMethod} • {formatDate(transaction.transactionDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(transaction.totalAmount, transaction.currency)}
                      </p>
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
          </div>
        </main>
      </div>
    </div>
  );
}