import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import HelpChatbot from "@/components/HelpChatbot";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  Loader2,
  CreditCard,
  ShoppingBag,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  LayoutGrid,
  Link,
  BriefcaseBusiness,
  Share2,
  MessageSquareText,
  MessageCircle,
  RefreshCw,
  Trash2,
  Store,
  Plug,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";

// =====================================================
// INTERFACES
// =====================================================

interface Integration {
  id: string;
  provider: string;
  category: "pos" | "ecommerce" | "social_media" | "crm";
  storeName: string;
  storeUrl?: string;
  isActive: boolean;
  syncEnabled: boolean;
  lastSyncAt?: string;
  settings?: any;
  createdAt: string;
  accountName?: string;
}

interface IntegrationField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface ProviderInfo {
  name: string;
  icon: React.ElementType;
  description: string;
  category: "pos" | "ecommerce" | "social_media" | "crm";
  fields: IntegrationField[];
}

// =====================================================
// PROVIDER CONFIGURATION
// =====================================================

const INTEGRATION_PROVIDERS: Record<string, ProviderInfo> = {
  // Social Media Integrations
  facebook: {
    name: "Facebook",
    icon: Facebook,
    description: "Connect your Facebook Page for posts, insights, and audience engagement",
    category: "social_media",
    fields: [],
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    description: "Manage your Instagram content, stories, and analytics",
    category: "social_media",
    fields: [],
  },
  whatsapp: {
    name: "WhatsApp Business",
    icon: MessageCircle,
    description: "Send and receive messages using WhatsApp Cloud API",
    category: "social_media",
    fields: [],
  },
  threads: {
    name: "Threads",
    icon: MessageSquareText,
    description: "Manage messages and posts on Threads (linked to Instagram)",
    category: "social_media",
    fields: [],
  },
  tiktok: {
    name: "TikTok",
    icon: Share2,
    description: "Connect your TikTok account for content scheduling",
    category: "social_media",
    fields: [],
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    description: "Connect your YouTube channel for video management",
    category: "social_media",
    fields: [],
  },

  // POS Integrations
  square: {
    name: "Square",
    icon: CreditCard,
    description: "Point of sale and payment processing",
    category: "pos",
    fields: [
      { name: "accessToken", label: "Access Token", type: "password", required: true },
      { name: "applicationId", label: "Application ID", type: "text", required: false, placeholder: "Optional ID" },
    ],
  },
  stripe: {
    name: "Stripe",
    icon: CreditCard,
    description: "Online payment processing",
    category: "pos",
    fields: [
      { name: "secretKey", label: "Secret Key", type: "password", required: true, placeholder: "sk_..." },
      { name: "publishableKey", label: "Publishable Key", type: "text", required: false, placeholder: "pk_..." },
    ],
  },

  // E-commerce Integrations
  shopify: {
    name: "Shopify",
    icon: ShoppingBag,
    description: "E-commerce platform for online stores",
    category: "ecommerce",
    fields: [
      { name: "storeUrl", label: "Store URL", type: "text", required: true, placeholder: "your-store.myshopify.com" },
      { name: "accessToken", label: "Access Token", type: "password", required: true },
    ],
  },
  woocommerce: {
    name: "WooCommerce",
    icon: Globe,
    description: "WordPress e-commerce plugin",
    category: "ecommerce",
    fields: [
      { name: "siteUrl", label: "Site URL", type: "text", required: true, placeholder: "https://yourstore.com" },
      { name: "consumerKey", label: "Consumer Key", type: "text", required: true },
      { name: "consumerSecret", label: "Consumer Secret", type: "password", required: true },
    ],
  },
  wix: {
    name: "Wix",
    icon: LayoutGrid,
    description: "Website builder and e-commerce platform",
    category: "ecommerce",
    fields: [
      { name: "siteUrl", label: "Site URL", type: "text", required: true, placeholder: "https://yourwixsite.com" },
      { name: "apiKey", label: "API Key", type: "password", required: true },
    ],
  },
  custom_website: {
    name: "Custom Website",
    icon: Link,
    description: "Integrate with a custom website via API",
    category: "ecommerce",
    fields: [
      { name: "siteUrl", label: "Website URL", type: "text", required: true, placeholder: "https://yourwebsite.com" },
      { name: "apiKey", label: "API Key", type: "password", required: true },
    ],
  },

  // CRM Integrations
  hubspot: {
    name: "HubSpot",
    icon: BriefcaseBusiness,
    description: "Connect your HubSpot CRM to manage leads and customers",
    category: "crm",
    fields: [
      { name: "apiKey", label: "API Key", type: "password", required: true },
    ],
  },
  salesforce: {
    name: "Salesforce",
    icon: BriefcaseBusiness,
    description: "Connect your Salesforce CRM for comprehensive customer management",
    category: "crm",
    fields: [
      { name: "clientId", label: "Client ID", type: "text", required: true },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true },
    ],
  },
  zoho_crm: {
    name: "Zoho CRM",
    icon: BriefcaseBusiness,
    description: "Integrate with Zoho CRM to streamline sales and marketing",
    category: "crm",
    fields: [
      { name: "clientId", label: "Client ID", type: "text", required: true },
      { name: "clientSecret", label: "Client Secret", type: "password", required: true },
      { name: "refreshToken", label: "Refresh Token", type: "password", required: true },
    ],
  },
};

// Category configuration
const INTEGRATION_CATEGORIES: { key: Integration["category"]; name: string; nameEs: string; icon: React.ElementType }[] = [
  { key: "social_media", name: "Social Media", nameEs: "Redes Sociales", icon: Instagram },
  { key: "ecommerce", name: "E-commerce", nameEs: "E-commerce", icon: ShoppingBag },
  { key: "pos", name: "Payment & POS", nameEs: "Pagos y POS", icon: CreditCard },
  { key: "crm", name: "CRM", nameEs: "CRM", icon: BriefcaseBusiness },
];

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function IntegrationsPage() {
  const { isSpanish } = useLanguage();
  const { toast } = useToast();
  const { activeBrandId } = useBrand();

  // State
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("social_media");
  const [isAddIntegrationDialogOpen, setIsAddIntegrationDialogOpen] = useState(false);
  const [dialogSelectedCategory, setDialogSelectedCategory] = useState<Integration["category"] | "">("");
  const [dialogSelectedProvider, setDialogSelectedProvider] = useState<string>("");
  const [newIntegrationStoreName, setNewIntegrationStoreName] = useState("");
  const [newIntegrationFields, setNewIntegrationFields] = useState<{ [key: string]: string }>({});

  // Fetch integrations
  const fetchIntegrations = async () => {
    if (!activeBrandId) return;
    try {
      setIntegrationsLoading(true);
      const res = await fetch(`/api/integrations?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch integrations");
      const data = await res.json();
      if (Array.isArray(data)) setIntegrations(data);
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setIntegrationsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [activeBrandId]);

  // Helper functions
  const getConnectedCount = (category: string) => integrations.filter((i) => i.category === category && i.isActive).length;
  const getProvidersForCategory = (category: string) => Object.entries(INTEGRATION_PROVIDERS).filter(([, info]) => info.category === category);
  const isProviderConnected = (providerKey: string) => integrations.some((i) => i.provider === providerKey && i.isActive);
  const getConnectedIntegration = (providerKey: string) => integrations.find((i) => i.provider === providerKey && i.isActive);

  // OAuth connection handler
  const handleConnect = (provider: string) => {
    if (!activeBrandId) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish ? "Selecciona una marca antes de conectar." : "Select a brand before connecting.",
        variant: "destructive",
      });
      return;
    }

    let url = "";
    if (["facebook", "instagram", "threads"].includes(provider)) {
      url = `/api/integrations/facebook/connect?brandId=${activeBrandId}`;
    } else if (provider === "whatsapp") {
      url = `/api/integrations/whatsapp/connect?brandId=${activeBrandId}`;
    } else {
      toast({
        title: isSpanish ? "Próximamente" : "Coming Soon",
        description: isSpanish
          ? `La conexión para ${INTEGRATION_PROVIDERS[provider]?.name} aún no está disponible.`
          : `Connection for ${INTEGRATION_PROVIDERS[provider]?.name} is not available yet.`,
      });
      return;
    }

    const popup = window.open(url, "_blank", "width=600,height=700");
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        window.location.reload();
      }
    }, 1000);
  };

  // Create integration handler
  const handleCreateIntegration = () => {
    if (!dialogSelectedCategory || !dialogSelectedProvider || !newIntegrationStoreName) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish ? "Por favor, completa todos los campos requeridos." : "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const providerInfo = INTEGRATION_PROVIDERS[dialogSelectedProvider];
    const newIntegration: Integration = {
      id: `int_${dialogSelectedProvider}_${Date.now()}`,
      provider: dialogSelectedProvider,
      category: dialogSelectedCategory as Integration["category"],
      storeName: newIntegrationStoreName,
      isActive: true,
      syncEnabled: true,
      createdAt: new Date().toISOString(),
      settings: newIntegrationFields,
      storeUrl: newIntegrationFields.siteUrl || newIntegrationFields.storeUrl || undefined,
    };

    setIntegrations((prev) => [...prev, newIntegration]);
    setIsAddIntegrationDialogOpen(false);
    resetDialog();
    toast({
      title: isSpanish ? "Integración Creada" : "Integration Created",
      description: isSpanish
        ? `${newIntegration.storeName} (${providerInfo.name}) se ha integrado exitosamente.`
        : `${newIntegration.storeName} (${providerInfo.name}) has been integrated successfully.`,
    });
  };

  // Delete integration handler
  const handleDeleteIntegration = async (id: string) => {
    try {
      const response = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchIntegrations();
        toast({
          title: isSpanish ? "Integración Eliminada" : "Integration Deleted",
          description: isSpanish ? "La integración ha sido eliminada." : "The integration has been deleted.",
        });
      } else {
        throw new Error("Failed to delete integration");
      }
    } catch (error) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish ? "No se pudo eliminar la integración." : "Failed to delete integration.",
        variant: "destructive",
      });
    }
  };

  const resetDialog = () => {
    setDialogSelectedCategory("");
    setDialogSelectedProvider("");
    setNewIntegrationStoreName("");
    setNewIntegrationFields({});
  };

  const filteredProviders = dialogSelectedCategory
    ? Object.entries(INTEGRATION_PROVIDERS).filter(([, info]) => info.category === dialogSelectedCategory)
    : [];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName={isSpanish ? "Integraciones" : "Integrations"} />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="container mx-auto px-4 py-8 space-y-6" data-testid="integrations-page">
              
              {/* Page Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Plug className="h-8 w-8 text-primary" />
                    {isSpanish ? "Integraciones" : "Integrations"}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {isSpanish
                      ? "Conecta tus plataformas favoritas para potenciar tus campañas."
                      : "Connect your favorite platforms to power up your campaigns."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="px-3 py-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                    {integrations.filter(i => i.isActive).length} {isSpanish ? "conectadas" : "connected"}
                  </Badge>
                </div>
              </div>

              {/* Category Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  {INTEGRATION_CATEGORIES.map((category) => {
                    const connectedCount = getConnectedCount(category.key);
                    const Icon = category.icon;
                    return (
                      <TabsTrigger
                        key={category.key}
                        value={category.key}
                        data-testid={`tab-${category.key}`}
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{isSpanish ? category.nameEs : category.name}</span>
                        {connectedCount > 0 && (
                          <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {connectedCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {INTEGRATION_CATEGORIES.map((category) => (
                  <TabsContent key={category.key} value={category.key} className="space-y-4">
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <category.icon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <CardTitle className="text-lg">{isSpanish ? category.nameEs : category.name}</CardTitle>
                              <CardDescription>
                                {category.key === "social_media" && (isSpanish ? "Conecta tus perfiles de redes sociales" : "Connect your social media profiles")}
                                {category.key === "ecommerce" && (isSpanish ? "Integra tu tienda online" : "Integrate your online store")}
                                {category.key === "pos" && (isSpanish ? "Conecta sistemas de pago" : "Connect payment systems")}
                                {category.key === "crm" && (isSpanish ? "Enlaza tu CRM" : "Link your CRM")}
                              </CardDescription>
                            </div>
                          </div>
                          {category.key !== "social_media" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDialogSelectedCategory(category.key);
                                setIsAddIntegrationDialogOpen(true);
                              }}
                              data-testid={`add-${category.key}-btn`}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {isSpanish ? "Añadir" : "Add"}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {integrationsLoading ? (
                          <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getProvidersForCategory(category.key).map(([providerKey, providerInfo]) => {
                              const isConnected = isProviderConnected(providerKey);
                              const connectedIntegration = getConnectedIntegration(providerKey);
                              const Icon = providerInfo.icon;

                              return (
                                <div
                                  key={providerKey}
                                  className={`relative p-4 rounded-lg border transition-colors ${
                                    isConnected
                                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                                      : "bg-white border-gray-200 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-800"
                                  }`}
                                  data-testid={`provider-${providerKey}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${isConnected ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                                      <Icon className={`h-5 w-5 ${isConnected ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-sm">{providerInfo.name}</h3>
                                        {isConnected && (
                                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                                            {isSpanish ? "Activo" : "Active"}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {providerInfo.description}
                                      </p>
                                      {connectedIntegration && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                                          <CheckCircle2 className="h-3 w-3" />
                                          {connectedIntegration.accountName || connectedIntegration.storeName}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-3 flex gap-2">
                                    {isConnected ? (
                                      <>
                                        {(category.key === "pos" || category.key === "ecommerce") && (
                                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" data-testid={`sync-${providerKey}`}>
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            {isSpanish ? "Sincronizar" : "Sync"}
                                          </Button>
                                        )}
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                          onClick={() => handleDeleteIntegration(connectedIntegration!.id)}
                                          data-testid={`disconnect-${providerKey}`}
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          {isSpanish ? "Desconectar" : "Disconnect"}
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        size="sm"
                                        className="w-full h-8 text-xs"
                                        onClick={() => {
                                          if (category.key === "social_media") {
                                            handleConnect(providerKey);
                                          } else {
                                            setDialogSelectedCategory(category.key);
                                            setDialogSelectedProvider(providerKey);
                                            setIsAddIntegrationDialogOpen(true);
                                          }
                                        }}
                                        data-testid={`connect-${providerKey}`}
                                      >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        {isSpanish ? "Conectar" : "Connect"}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Add Integration Dialog */}
              <Dialog open={isAddIntegrationDialogOpen} onOpenChange={(open) => { setIsAddIntegrationDialogOpen(open); if (!open) resetDialog(); }}>
                <DialogContent className="sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle>{isSpanish ? "Añadir Integración" : "Add Integration"}</DialogTitle>
                    <DialogDescription>
                      {isSpanish ? "Configura los detalles de tu nueva integración." : "Configure the details for your new integration."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 pt-2">
                    {/* Category Selection */}
                    {!dialogSelectedCategory && (
                      <div>
                        <Label>{isSpanish ? "Categoría" : "Category"}</Label>
                        <Select value={dialogSelectedCategory} onValueChange={(val: Integration["category"]) => setDialogSelectedCategory(val)}>
                          <SelectTrigger data-testid="category-select">
                            <SelectValue placeholder={isSpanish ? "Selecciona una categoría" : "Select a category"} />
                          </SelectTrigger>
                          <SelectContent>
                            {INTEGRATION_CATEGORIES.filter(c => c.key !== "social_media").map((cat) => (
                              <SelectItem key={cat.key} value={cat.key}>
                                <div className="flex items-center gap-2">
                                  <cat.icon className="h-4 w-4" />
                                  {isSpanish ? cat.nameEs : cat.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Provider Selection */}
                    {dialogSelectedCategory && !dialogSelectedProvider && (
                      <div>
                        <Label>{isSpanish ? "Proveedor" : "Provider"}</Label>
                        <Select value={dialogSelectedProvider} onValueChange={setDialogSelectedProvider}>
                          <SelectTrigger data-testid="provider-select">
                            <SelectValue placeholder={isSpanish ? "Selecciona un proveedor" : "Select a provider"} />
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

                    {/* Provider Fields */}
                    {dialogSelectedProvider && (
                      <>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {(() => {
                            const info = INTEGRATION_PROVIDERS[dialogSelectedProvider];
                            const Icon = info.icon;
                            return (
                              <>
                                <div className="p-2 bg-white rounded-lg border">
                                  <Icon className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{info.name}</p>
                                  <p className="text-xs text-muted-foreground">{info.description}</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        <div>
                          <Label htmlFor="store-name-input">
                            {INTEGRATION_PROVIDERS[dialogSelectedProvider]?.category === "crm"
                              ? isSpanish ? "Nombre de Instancia" : "Instance Name"
                              : isSpanish ? "Nombre de Tienda/Sitio" : "Store/Site Name"}
                          </Label>
                          <Input
                            id="store-name-input"
                            placeholder={isSpanish ? "Ej: Mi Tienda Principal" : "Ex: My Main Store"}
                            value={newIntegrationStoreName}
                            onChange={(e) => setNewIntegrationStoreName(e.target.value)}
                            data-testid="store-name-input"
                          />
                        </div>

                        {INTEGRATION_PROVIDERS[dialogSelectedProvider].fields.map((field) => (
                          <div key={field.name}>
                            <Label htmlFor={`${field.name}-input`}>{field.label}</Label>
                            <Input
                              id={`${field.name}-input`}
                              type={field.type}
                              placeholder={field.placeholder || ""}
                              value={newIntegrationFields[field.name] || ""}
                              onChange={(e) => setNewIntegrationFields((prev) => ({ ...prev, [field.name]: e.target.value }))}
                            />
                          </div>
                        ))}
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => { setIsAddIntegrationDialogOpen(false); resetDialog(); }} data-testid="cancel-button">
                        {isSpanish ? "Cancelar" : "Cancel"}
                      </Button>
                      <Button
                        onClick={handleCreateIntegration}
                        disabled={!dialogSelectedProvider || !newIntegrationStoreName}
                        data-testid="create-integration-button"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {isSpanish ? "Crear" : "Create"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Help Chatbot */}
            <HelpChatbot />
          </main>
        </div>
      </div>
    </div>
  );
}
