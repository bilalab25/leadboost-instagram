import { useState } from "react";
// Eliminadas: useQuery, useMutation, useQueryClient, useForm, useToast
// Eliminada: apiRequest
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Eliminadas: Form, FormControl, FormField, FormItem, FormLabel, FormMessage de react-hook-form
import {
  Loader2, Plus, Store, CreditCard, ShoppingBag, Globe, Trash2, RefreshCw,
  Instagram, Facebook, Youtube, Building, LayoutGrid, Link, DollarSign,
  BriefcaseBusiness, Share2 // Reemplazado Tiktok por Share2
} from "lucide-react";

// --- Interfaces (solo para tipado de datos simulados) ---
interface Integration {
  id: string;
  provider: string;
  category: 'pos' | 'ecommerce' | 'social_media' | 'crm';
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

interface IntegrationField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
}

interface ProviderInfo {
  name: string;
  icon: any;
  description: string;
  category: 'pos' | 'ecommerce' | 'social_media' | 'crm';
  fields: IntegrationField[];
}

// --- Provider Info ---
const INTEGRATION_PROVIDERS: Record<string, ProviderInfo> = {
  // POS Integrations
  square: {
    name: "Square",
    icon: CreditCard,
    description: "Point of sale and payment processing",
    category: 'pos',
    fields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true },
      { name: "applicationId", label: "Application ID", type: "text", required: false, placeholder: "Optional ID" },
    ]
  },
  stripe: {
    name: "Stripe",
    icon: CreditCard,
    description: "Online payment processing",
    category: 'pos',
    fields: [
      { name: "secretKey", label: "Secret Key", type: "password", required: true, placeholder: "sk_..." },
      { name: "publishableKey", label: "Publishable Key", type: "text", required: false, placeholder: "pk_..." },
    ]
  },

  // E-commerce/Website Integrations
  shopify: {
    name: "Shopify",
    icon: ShoppingBag,
    description: "E-commerce platform",
    category: 'ecommerce',
    fields: [
      { name: "storeUrl", label: "Store URL", type: "text", required: true, placeholder: "your-store.myshopify.com" },
      { name: "accessToken", label: "Access Token", type: "password", required: true },
      { name: "apiKey", label: "API Key", type: "text", required: false },
    ]
  },
  woocommerce: {
    name: "WooCommerce",
    icon: Globe,
    description: "WordPress e-commerce plugin",
    category: 'ecommerce',
    fields: [
      { name: "siteUrl", label: "Site URL", type: "text", required: true, placeholder: "https://yourstore.com" },
      { name: "consumerKey", label: "Consumer Key", type: "text", required: true },
      { name: "consumerSecret", label: "Consumer Secret", type: "password", required: true },
    ]
  },
  wix: {
    name: "Wix",
    icon: LayoutGrid,
    description: "Website builder and e-commerce platform",
    category: 'ecommerce',
    fields: [
      { name: "siteUrl", label: "Site URL", type: "text", required: true, placeholder: "https://yourwixsite.com" },
      { name: "apiKey", label: "API Key", type: "password", required: true },
    ]
  },
  custom_website: {
    name: "Custom Website",
    icon: Link,
    description: "Integrate with a custom website via API",
    category: 'ecommerce',
    fields: [
      { name: "siteUrl", label: "Website URL", type: "text", required: true, placeholder: "https://yourwebsite.com" },
      { name: "apiKey", label: "API Key", type: "password", required: true },
      { name: "apiEndpoint", label: "API Endpoint", type: "text", required: false, placeholder: "/api/v1/data" },
    ]
  },

  // Social Media Integrations
  instagram: {
    name: "Instagram",
    icon: Instagram,
    description: "Connect your Instagram account for posts and analytics",
    category: 'social_media',
    fields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true },
      { name: "userId", label: "User ID", type: "text", required: false, placeholder: "Optional User ID" },
    ]
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    description: "Connect your Facebook Page for posts and insights",
    category: 'social_media',
    fields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true },
      { name: "pageId", label: "Page ID", type: "text", required: false, placeholder: "Optional Page ID" },
    ]
  },
  tiktok: {
    name: "TikTok",
    icon: Share2, // Reemplazado por Share2
    description: "Connect your TikTok account for content scheduling",
    category: 'social_media',
    fields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true },
    ]
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    description: "Connect your YouTube channel for video management",
    category: 'social_media',
    fields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true },
      { name: "channelId", label: "Channel ID", type: "text", required: false, placeholder: "Optional Channel ID" },
    ]
  },

  // CRM Integrations
  hubspot: {
    name: "HubSpot",
    icon: BriefcaseBusiness,
    description: "Connect your HubSpot CRM to manage leads and customers",
    category: 'crm',
    fields: [
      { name: "apiKey", label: "API Key", type: "password", required: true },
    ]
  },
  salesforce: {
    name: "Salesforce",
    icon: BriefcaseBusiness, // Using generic icon
    description: "Connect your Salesforce CRM for comprehensive customer management",
    category: 'crm',
    fields: [
      { name: "clientId", label: "Client ID", type: "text", required: true },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true },
    ]
  },
  zoho_crm: {
    name: "Zoho CRM",
    icon: BriefcaseBusiness, // Using generic icon
    description: "Integrate with Zoho CRM to streamline sales and marketing",
    category: 'crm',
    fields: [
      { name: "clientId", label: "Client ID", type: "text", required: true },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true },
      { name: "refreshToken", label: "Refresh Token", type: "password", required: true },
    ]
  },
};

// Define categories for display and filtering
const INTEGRATION_CATEGORIES_DISPLAY = {
  pos: { name: "POS Integrations", icon: Store, description: "Connect your point-of-sale systems to sync sales data." },
  ecommerce: { name: "Website & E-commerce", icon: ShoppingBag, description: "Integrate your website or online store for product and order management." },
  social_media: { name: "Social Media Accounts", icon: Instagram, description: "Connect your social media profiles to manage content and engagement." },
  crm: { name: "CRM Systems", icon: BriefcaseBusiness, description: "Link your CRM to centralize customer data and interactions." },
};

// --- Dummy Data for UI Preview ---
const dummyIntegrations: Integration[] = [
  {
    id: "int_shopify_1", provider: "shopify", category: "ecommerce", storeName: "My Shopify Store", storeUrl: "myshop.myshopify.com",
    isActive: true, syncEnabled: true, lastSyncAt: new Date().toISOString(), createdAt: new Date().toISOString()
  },
  {
    id: "int_square_1", provider: "square", category: "pos", storeName: "Main Street Cafe POS",
    isActive: true, syncEnabled: true, lastSyncAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date().toISOString()
  },
  {
    id: "int_instagram_1", provider: "instagram", category: "social_media", storeName: "@MyBrandOfficial",
    isActive: true, syncEnabled: false, createdAt: new Date().toISOString()
  },
  {
    id: "int_hubspot_1", provider: "hubspot", category: "crm", storeName: "Leadboost CRM Instance",
    isActive: true, syncEnabled: true, createdAt: new Date().toISOString()
  },
  {
    id: "int_wix_1", provider: "wix", category: "ecommerce", storeName: "My Portfolio Site", storeUrl: "myportfolio.wixsite.com",
    isActive: true, syncEnabled: false, createdAt: new Date().toISOString()
  },
];

const dummyProducts: Product[] = [
  { id: "prod_1", name: "Organic Coffee Beans", price: 1500, currency: "USD", sku: "OCB001", category: "Coffee", isActive: true, stockQuantity: 120 },
  { id: "prod_2", name: "Espresso Machine", price: 35000, currency: "USD", sku: "ESPMCH01", category: "Equipment", isActive: true, stockQuantity: 15 },
  { id: "prod_3", name: "Ceramic Mug", price: 800, currency: "USD", sku: "CMUG005", category: "Merchandise", isActive: true, stockQuantity: 300 },
];

const dummyTransactions: SalesTransaction[] = [
  { id: "trans_1", transactionId: "TXN12345", customerName: "Alice Smith", totalAmount: 2300, currency: "USD", status: "completed", paymentMethod: "Card", transactionDate: new Date().toISOString() },
  { id: "trans_2", transactionId: "TXN12346", customerName: "Bob Johnson", totalAmount: 1500, currency: "USD", status: "completed", paymentMethod: "Cash", transactionDate: new Date(Date.now() - 60000).toISOString() },
  { id: "trans_3", transactionId: "TXN12347", customerName: "Guest", totalAmount: 800, currency: "USD", status: "pending", paymentMethod: "Card", transactionDate: new Date(Date.now() - 120000).toISOString() },
];


export default function Integrations() {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof INTEGRATION_CATEGORIES_DISPLAY | ''>('');
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Simulando datos de carga
  const integrationsLoading = false;
  const productsLoading = false;
  const transactionsLoading = false;

  // Funciones dummy para los botones, no hacen nada real
  const handleCreateIntegration = () => {
    console.log("Simulating integration creation...");
    setIsDialogOpen(false);
    setSelectedCategory('');
    setSelectedProvider('');
    // En una aplicación real, aquí se llamaría a una API
  };

  const handleDeleteIntegration = (id: string) => {
    console.log(`Simulating deletion of integration ${id}`);
    // En una aplicación real, aquí se llamaría a una API
  };

  const handleSyncProducts = (integrationId: string) => {
    console.log(`Simulating product sync for integration ${integrationId}`);
    // En una aplicación real, aquí se llamaría a una API
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

  const filteredProviders = selectedCategory
    ? Object.entries(INTEGRATION_PROVIDERS).filter(([, info]) => info.category === selectedCategory)
    : [];

  const renderIntegrationCard = (integration: Integration) => {
    const providerInfo = INTEGRATION_PROVIDERS[integration.provider as keyof typeof INTEGRATION_PROVIDERS];
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
              {providerInfo?.name} • {integration.storeUrl || "N/A"}
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

          {(integration.category === 'pos' || integration.category === 'ecommerce') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSyncProducts(integration.id)}
              data-testid={`sync-products-${integration.id}`}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteIntegration(integration.id)}
            data-testid={`delete-integration-${integration.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName="Integrations" />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            {/* Ajuste de padding y espacio vertical aquí */}
            <div className="container mx-auto px-4 py-8 space-y-8" data-testid="integrations-page">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Integrations</h1>
                  <p className="text-muted-foreground">
                    Connect various platforms to centralize your data and automate campaigns.
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
                      <DialogTitle>Add New Integration</DialogTitle>
                      <DialogDescription>
                        Select a category and provider to connect a new service.
                      </DialogDescription>
                    </DialogHeader>

                    {/* Formulario simplificado sin react-hook-form */}
                    <div className="space-y-4">
                      {/* Integration Category Selection */}
                      <div>
                        <Label htmlFor="category-select">Integration Category</Label>
                        <Select
                          onValueChange={(value: keyof typeof INTEGRATION_CATEGORIES_DISPLAY) => {
                            setSelectedCategory(value);
                            setSelectedProvider('');
                          }}
                          value={selectedCategory}
                        >
                          <SelectTrigger id="category-select" data-testid="category-select">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(INTEGRATION_CATEGORIES_DISPLAY).map(([key, info]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <info.icon className="h-4 w-4" />
                                  {info.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Integration Provider Selection (filtered by category) */}
                      {selectedCategory && (
                        <div>
                          <Label htmlFor="provider-select">Provider</Label>
                          <Select
                            onValueChange={(value) => {
                              setSelectedProvider(value);
                            }}
                            value={selectedProvider}
                            disabled={!selectedCategory}
                          >
                            <SelectTrigger id="provider-select" data-testid="provider-select">
                              <SelectValue placeholder="Select a provider" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredProviders.map(([key, info]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <info.icon className="h-4 w-4" />
                                    {info.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedProvider && (
                        <>
                          <div>
                            <Label htmlFor="store-name-input">
                              {INTEGRATION_PROVIDERS[selectedProvider as keyof typeof INTEGRATION_PROVIDERS]?.category === 'social_media'
                                ? "Account Name"
                                : INTEGRATION_PROVIDERS[selectedProvider as keyof typeof INTEGRATION_PROVIDERS]?.category === 'crm'
                                  ? "CRM Instance Name"
                                  : "Store/Site Name"
                              }
                            </Label>
                            <Input
                              id="store-name-input"
                              placeholder={
                                INTEGRATION_PROVIDERS[selectedProvider as keyof typeof INTEGRATION_PROVIDERS]?.category === 'social_media'
                                  ? "Your Instagram Account"
                                  : INTEGRATION_PROVIDERS[selectedProvider as keyof typeof INTEGRATION_PROVIDERS]?.category === 'crm'
                                    ? "My Sales CRM"
                                    : "Your store/site name"
                              }
                              data-testid="store-name-input"
                            />
                          </div>

                          {INTEGRATION_PROVIDERS[selectedProvider as keyof typeof INTEGRATION_PROVIDERS].fields.map((field) => (
                            <div key={field.name}>
                              <Label htmlFor={`${field.name}-input`}>{field.label}</Label>
                              <Input
                                id={`${field.name}-input`}
                                type={field.type}
                                placeholder={field.placeholder || ""}
                                data-testid={`${field.name}-input`}
                              />
                            </div>
                          ))}
                        </>
                      )}

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            setSelectedCategory('');
                            setSelectedProvider('');
                          }}
                          data-testid="cancel-button"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCreateIntegration}
                          disabled={!selectedProvider}
                          data-testid="create-integration-button"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Integration
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Render Integrations by Category */}
              {Object.entries(INTEGRATION_CATEGORIES_DISPLAY).map(([categoryKey, categoryInfo]) => (
                <Card key={categoryKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <categoryInfo.icon className="h-5 w-5" />
                      {categoryInfo.name}
                    </CardTitle>
                    <CardDescription>
                      {categoryInfo.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {integrationsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      (() => {
                        const integrationsInCategory = dummyIntegrations.filter( // Usando dummy data
                          (integration) => integration.category === categoryKey
                        );
                        return integrationsInCategory.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <categoryInfo.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No {categoryInfo.name.toLowerCase()} connected yet</p>
                            <p className="text-sm">Add your first {categoryInfo.name.toLowerCase().replace('integrations', 'integration')} to get started.</p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {integrationsInCategory.map(renderIntegrationCard)}
                          </div>
                        );
                      })()
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Leadboost CRM Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Leadboost CRM
                  </CardTitle>
                  <CardDescription>
                    Don't have a CRM? Use Leadboost's powerful CRM to manage your customers and leads.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-green-500" />
                    <p className="text-lg font-semibold">Only $29 USD/month</p>
                  </div>
                  <Button onClick={() => window.open("https://www.leadboost.com/crm-signup", "_blank")}>
                    Learn More & Subscribe
                  </Button>
                </CardContent>
              </Card>

              {/* Products and Transactions Grid (still relevant for POS/E-commerce data) */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Products */}
                <Card>
                  <CardHeader>
                    <CardTitle>Synced Products</CardTitle>
                    <CardDescription>Products imported from your connected POS and E-commerce systems</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {productsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : dummyProducts.length === 0 ? ( // Usando dummy data
                      <p className="text-center text-muted-foreground py-4">
                        No products synced yet
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {dummyProducts.slice(0, 10).map((product: Product) => (
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
                    <CardDescription>Latest sales from your connected POS and E-commerce systems</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : dummyTransactions.length === 0 ? ( // Usando dummy data
                      <p className="text-center text-muted-foreground py-4">
                        No transactions synced yet
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {dummyTransactions.slice(0, 10).map((transaction: SalesTransaction) => (
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
    </div>
  );
}