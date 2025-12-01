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
  Zap,
  ArrowRight,
  Sparkles,
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
  brandColor: string;
  bgGradient: string;
}

// =====================================================
// PROVIDER CONFIGURATION WITH BRAND COLORS
// =====================================================

const INTEGRATION_PROVIDERS: Record<string, ProviderInfo> = {
  // Social Media Integrations
  facebook: {
    name: "Facebook",
    icon: Facebook,
    description: "Connect your Facebook Page for posts, insights, and audience engagement",
    category: "social_media",
    fields: [],
    brandColor: "#1877F2",
    bgGradient: "from-[#1877F2] to-[#0d5bc6]",
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    description: "Manage your Instagram content, stories, and analytics",
    category: "social_media",
    fields: [],
    brandColor: "#E4405F",
    bgGradient: "from-[#833AB4] via-[#E4405F] to-[#FCAF45]",
  },
  whatsapp: {
    name: "WhatsApp Business",
    icon: MessageCircle,
    description: "Send and receive messages using WhatsApp Cloud API",
    category: "social_media",
    fields: [],
    brandColor: "#25D366",
    bgGradient: "from-[#25D366] to-[#128C7E]",
  },
  threads: {
    name: "Threads",
    icon: MessageSquareText,
    description: "Manage messages and posts on Threads (linked to Instagram)",
    category: "social_media",
    fields: [],
    brandColor: "#000000",
    bgGradient: "from-gray-800 to-black",
  },
  tiktok: {
    name: "TikTok",
    icon: Share2,
    description: "Connect your TikTok account for content scheduling",
    category: "social_media",
    fields: [],
    brandColor: "#000000",
    bgGradient: "from-[#ff0050] via-[#00f2ea] to-[#000000]",
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    description: "Connect your YouTube channel for video management",
    category: "social_media",
    fields: [],
    brandColor: "#FF0000",
    bgGradient: "from-[#FF0000] to-[#cc0000]",
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
    brandColor: "#006AFF",
    bgGradient: "from-[#006AFF] to-[#0050cc]",
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
    brandColor: "#635BFF",
    bgGradient: "from-[#635BFF] to-[#4f46e5]",
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
    brandColor: "#96BF48",
    bgGradient: "from-[#96BF48] to-[#7ab235]",
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
    brandColor: "#96588A",
    bgGradient: "from-[#96588A] to-[#7e4774]",
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
    brandColor: "#0C6EFC",
    bgGradient: "from-[#0C6EFC] to-[#0958d2]",
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
    brandColor: "#6366F1",
    bgGradient: "from-[#6366F1] to-[#4f46e5]",
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
    brandColor: "#FF7A59",
    bgGradient: "from-[#FF7A59] to-[#e56642]",
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
    brandColor: "#00A1E0",
    bgGradient: "from-[#00A1E0] to-[#0088c7]",
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
    brandColor: "#C8202B",
    bgGradient: "from-[#C8202B] to-[#a81b24]",
  },
};

// Category display configuration
const INTEGRATION_CATEGORIES: { key: Integration["category"]; name: string; nameEs: string; icon: React.ElementType; description: string; descriptionEs: string }[] = [
  {
    key: "social_media",
    name: "Social Media",
    nameEs: "Redes Sociales",
    icon: Instagram,
    description: "Connect your social profiles to manage content and engagement",
    descriptionEs: "Conecta tus perfiles sociales para gestionar contenido e interacciones",
  },
  {
    key: "ecommerce",
    name: "E-commerce",
    nameEs: "E-commerce",
    icon: ShoppingBag,
    description: "Integrate your online store for product and order management",
    descriptionEs: "Integra tu tienda online para gestión de productos y pedidos",
  },
  {
    key: "pos",
    name: "Payment & POS",
    nameEs: "Pagos y POS",
    icon: CreditCard,
    description: "Connect payment systems and point-of-sale integrations",
    descriptionEs: "Conecta sistemas de pago e integraciones de punto de venta",
  },
  {
    key: "crm",
    name: "CRM",
    nameEs: "CRM",
    icon: BriefcaseBusiness,
    description: "Link your CRM to centralize customer data",
    descriptionEs: "Enlaza tu CRM para centralizar datos de clientes",
  },
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

  // Get connected count per category
  const getConnectedCount = (category: string) => {
    return integrations.filter((i) => i.category === category && i.isActive).length;
  };

  // Get providers for category
  const getProvidersForCategory = (category: string) => {
    return Object.entries(INTEGRATION_PROVIDERS).filter(([, info]) => info.category === category);
  };

  // Check if provider is connected
  const isProviderConnected = (providerKey: string) => {
    return integrations.some((i) => i.provider === providerKey && i.isActive);
  };

  // Get connected integration for provider
  const getConnectedIntegration = (providerKey: string) => {
    return integrations.find((i) => i.provider === providerKey && i.isActive);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <TopHeader pageName={isSpanish ? "Integraciones" : "Integrations"} />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="integrations-page">
              
              {/* Hero Header */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2di00aC0ydjRoMnptMC02di00aC0ydjRoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Plug className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">
                        {isSpanish ? "Centro de Integraciones" : "Integration Hub"}
                      </h1>
                      <p className="text-white/80 mt-1">
                        {isSpanish
                          ? "Conecta todas tus plataformas en un solo lugar"
                          : "Connect all your platforms in one place"}
                      </p>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-6 mt-6">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                      <CheckCircle2 className="h-5 w-5 text-green-300" />
                      <span className="font-semibold">{integrations.filter(i => i.isActive).length}</span>
                      <span className="text-white/70">{isSpanish ? "Conectadas" : "Connected"}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                      <Zap className="h-5 w-5 text-yellow-300" />
                      <span className="font-semibold">{Object.keys(INTEGRATION_PROVIDERS).length}</span>
                      <span className="text-white/70">{isSpanish ? "Disponibles" : "Available"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full h-auto flex-wrap justify-start gap-2 bg-transparent p-0 mb-6">
                  {INTEGRATION_CATEGORIES.map((category) => {
                    const connectedCount = getConnectedCount(category.key);
                    const Icon = category.icon;
                    return (
                      <TabsTrigger
                        key={category.key}
                        value={category.key}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground 
                                   bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                                   rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200
                                   flex items-center gap-2"
                        data-testid={`tab-${category.key}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{isSpanish ? category.nameEs : category.name}</span>
                        {connectedCount > 0 && (
                          <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {connectedCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {INTEGRATION_CATEGORIES.map((category) => (
                  <TabsContent key={category.key} value={category.key} className="mt-0">
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <category.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h2 className="text-xl font-semibold">{isSpanish ? category.nameEs : category.name}</h2>
                              <CardDescription>{isSpanish ? category.descriptionEs : category.description}</CardDescription>
                            </div>
                          </div>
                          {category.key !== "social_media" && (
                            <Button
                              onClick={() => {
                                setDialogSelectedCategory(category.key);
                                setIsAddIntegrationDialogOpen(true);
                              }}
                              className="gap-2"
                              data-testid={`add-${category.key}-btn`}
                            >
                              <Plus className="h-4 w-4" />
                              {isSpanish ? "Añadir" : "Add"}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {integrationsLoading ? (
                          <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                                  className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                                    isConnected
                                      ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20"
                                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50"
                                  }`}
                                  data-testid={`provider-${providerKey}`}
                                >
                                  {/* Gradient Accent Bar */}
                                  <div className={`h-1.5 w-full bg-gradient-to-r ${providerInfo.bgGradient}`} />
                                  
                                  <div className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className="p-2.5 rounded-xl shadow-sm"
                                          style={{ backgroundColor: `${providerInfo.brandColor}15` }}
                                        >
                                          <Icon className="h-6 w-6" style={{ color: providerInfo.brandColor }} />
                                        </div>
                                        <div>
                                          <h3 className="font-semibold text-gray-900 dark:text-white">{providerInfo.name}</h3>
                                          {isConnected && (
                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium mt-0.5">
                                              <CheckCircle2 className="h-3.5 w-3.5" />
                                              {isSpanish ? "Conectado" : "Connected"}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {isConnected && (
                                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-0">
                                          <Sparkles className="h-3 w-3 mr-1" />
                                          {isSpanish ? "Activo" : "Active"}
                                        </Badge>
                                      )}
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                      {providerInfo.description}
                                    </p>

                                    {connectedIntegration && (
                                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                                        <p className="text-gray-600 dark:text-gray-400">
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {connectedIntegration.accountName || connectedIntegration.storeName}
                                          </span>
                                        </p>
                                      </div>
                                    )}

                                    <div className="flex gap-2">
                                      {isConnected ? (
                                        <>
                                          {(category.key === "pos" || category.key === "ecommerce") && (
                                            <Button variant="outline" size="sm" className="flex-1 gap-1" data-testid={`sync-${providerKey}`}>
                                              <RefreshCw className="h-3.5 w-3.5" />
                                              {isSpanish ? "Sincronizar" : "Sync"}
                                            </Button>
                                          )}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950"
                                            onClick={() => handleDeleteIntegration(connectedIntegration!.id)}
                                            data-testid={`disconnect-${providerKey}`}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          size="sm"
                                          className={`w-full gap-2 bg-gradient-to-r ${providerInfo.bgGradient} hover:opacity-90 text-white border-0`}
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
                                          {isSpanish ? "Conectar" : "Connect"}
                                          <ArrowRight className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </div>
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
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      {isSpanish ? "Añadir Nueva Integración" : "Add New Integration"}
                    </DialogTitle>
                    <DialogDescription>
                      {isSpanish ? "Configura los detalles de tu nueva integración." : "Configure the details for your new integration."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 pt-4">
                    {/* Category Selection */}
                    {!dialogSelectedCategory && (
                      <div>
                        <Label>{isSpanish ? "Categoría" : "Category"}</Label>
                        <Select
                          value={dialogSelectedCategory}
                          onValueChange={(val: Integration["category"]) => setDialogSelectedCategory(val)}
                        >
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
                                  <info.icon className="h-4 w-4" style={{ color: info.brandColor }} />
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
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                          {(() => {
                            const info = INTEGRATION_PROVIDERS[dialogSelectedProvider];
                            const Icon = info.icon;
                            return (
                              <>
                                <div className="p-2 rounded-lg" style={{ backgroundColor: `${info.brandColor}15` }}>
                                  <Icon className="h-5 w-5" style={{ color: info.brandColor }} />
                                </div>
                                <div>
                                  <p className="font-medium">{info.name}</p>
                                  <p className="text-xs text-gray-500">{info.description}</p>
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
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => { setIsAddIntegrationDialogOpen(false); resetDialog(); }} data-testid="cancel-button">
                        {isSpanish ? "Cancelar" : "Cancel"}
                      </Button>
                      <Button
                        onClick={handleCreateIntegration}
                        disabled={!dialogSelectedProvider || !newIntegrationStoreName}
                        data-testid="create-integration-button"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {isSpanish ? "Crear Integración" : "Create Integration"}
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
