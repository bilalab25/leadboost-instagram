// =====================================================
// IntegrationsPage.tsx - Standalone Integrations Management Page
// Refactored from Settings > Integrations tab to be a full page
// =====================================================

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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  // POS Integrations
  square: {
    name: "Square",
    icon: CreditCard,
    description: "Point of sale and payment processing",
    category: "pos",
    fields: [
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        required: true,
      },
      {
        name: "applicationId",
        label: "Application ID",
        type: "text",
        required: false,
        placeholder: "Optional ID",
      },
    ],
  },
  stripe: {
    name: "Stripe",
    icon: CreditCard,
    description: "Online payment processing",
    category: "pos",
    fields: [
      {
        name: "secretKey",
        label: "Secret Key",
        type: "password",
        required: true,
        placeholder: "sk_...",
      },
      {
        name: "publishableKey",
        label: "Publishable Key",
        type: "text",
        required: false,
        placeholder: "pk_...",
      },
    ],
  },

  // E-commerce/Website Integrations
  shopify: {
    name: "Shopify",
    icon: ShoppingBag,
    description: "E-commerce platform",
    category: "ecommerce",
    fields: [
      {
        name: "storeUrl",
        label: "Store URL",
        type: "text",
        required: true,
        placeholder: "your-store.myshopify.com",
      },
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        required: true,
      },
      { name: "apiKey", label: "API Key", type: "text", required: false },
    ],
  },
  woocommerce: {
    name: "WooCommerce",
    icon: Globe,
    description: "WordPress e-commerce plugin",
    category: "ecommerce",
    fields: [
      {
        name: "siteUrl",
        label: "Site URL",
        type: "text",
        required: true,
        placeholder: "https://yourstore.com",
      },
      {
        name: "consumerKey",
        label: "Consumer Key",
        type: "text",
        required: true,
      },
      {
        name: "consumerSecret",
        label: "Consumer Secret",
        type: "password",
        required: true,
      },
    ],
  },
  wix: {
    name: "Wix",
    icon: LayoutGrid,
    description: "Website builder and e-commerce platform",
    category: "ecommerce",
    fields: [
      {
        name: "siteUrl",
        label: "Site URL",
        type: "text",
        required: true,
        placeholder: "https://yourwixsite.com",
      },
      { name: "apiKey", label: "API Key", type: "password", required: true },
    ],
  },
  custom_website: {
    name: "Custom Website",
    icon: Link,
    description: "Integrate with a custom website via API",
    category: "ecommerce",
    fields: [
      {
        name: "siteUrl",
        label: "Website URL",
        type: "text",
        required: true,
        placeholder: "https://yourwebsite.com",
      },
      { name: "apiKey", label: "API Key", type: "password", required: true },
      {
        name: "apiEndpoint",
        label: "API Endpoint",
        type: "text",
        required: false,
        placeholder: "/api/v1/data",
      },
    ],
  },

  // Social Media Integrations
  instagram: {
    name: "Instagram",
    icon: Instagram,
    description: "Connect your Instagram account for posts and analytics",
    category: "social_media",
    fields: [
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        required: true,
      },
      {
        name: "userId",
        label: "User ID",
        type: "text",
        required: false,
        placeholder: "Optional User ID",
      },
    ],
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    description: "Connect your Facebook Page for posts and insights",
    category: "social_media",
    fields: [
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        required: true,
      },
      {
        name: "pageId",
        label: "Page ID",
        type: "text",
        required: false,
        placeholder: "Optional Page ID",
      },
    ],
  },
  threads: {
    name: "Threads",
    icon: MessageSquareText,
    description: "Manage messages and posts on Threads (linked to Instagram)",
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
  tiktok: {
    name: "TikTok",
    icon: Share2,
    description: "Connect your TikTok account for content scheduling",
    category: "social_media",
    fields: [
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        required: true,
      },
    ],
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    description: "Connect your YouTube channel for video management",
    category: "social_media",
    fields: [
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        required: true,
      },
      {
        name: "channelId",
        label: "Channel ID",
        type: "text",
        required: false,
        placeholder: "Optional Channel ID",
      },
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
    description:
      "Connect your Salesforce CRM for comprehensive customer management",
    category: "crm",
    fields: [
      { name: "clientId", label: "Client ID", type: "text", required: true },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
  },
  zoho_crm: {
    name: "Zoho CRM",
    icon: BriefcaseBusiness,
    description: "Integrate with Zoho CRM to streamline sales and marketing",
    category: "crm",
    fields: [
      { name: "clientId", label: "Client ID", type: "text", required: true },
      {
        name: "clientSecret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
      {
        name: "refreshToken",
        label: "Refresh Token",
        type: "password",
        required: true,
      },
    ],
  },
};

// Category display configuration
const INTEGRATION_CATEGORIES_DISPLAY: Record<
  Integration["category"],
  { name: string; icon: React.ElementType; description: string }
> = {
  social_media: {
    name: "Social Media Accounts",
    icon: Instagram,
    description:
      "Connect your social media profiles to manage content and engagement.",
  },
  pos: {
    name: "POS Integrations",
    icon: Store,
    description: "Connect your point-of-sale systems to sync sales data.",
  },
  ecommerce: {
    name: "Website & E-commerce",
    icon: ShoppingBag,
    description:
      "Integrate your website or online store for product and order management.",
  },
  crm: {
    name: "CRM Systems",
    icon: BriefcaseBusiness,
    description: "Link your CRM to centralize customer data and interactions.",
  },
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function IntegrationsPage() {
  const { isSpanish, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const { activeBrandId, refreshBrands } = useBrand();

  // State
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [isAddIntegrationDialogOpen, setIsAddIntegrationDialogOpen] =
    useState(false);
  const [dialogSelectedCategory, setDialogSelectedCategory] = useState<
    Integration["category"] | ""
  >("");
  const [dialogSelectedProvider, setDialogSelectedProvider] =
    useState<string>("");
  const [newIntegrationStoreName, setNewIntegrationStoreName] = useState("");
  const [newIntegrationFields, setNewIntegrationFields] = useState<{
    [key: string]: string;
  }>({});

  // Fetch integrations for the active brand
  const fetchIntegrations = async () => {
    if (!activeBrandId) return;
    try {
      setIntegrationsLoading(true);
      const res = await fetch(`/api/integrations?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch integrations");
      const data = await res.json();
      if (Array.isArray(data)) {
        setIntegrations(data);
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setIntegrationsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [activeBrandId]);

  // Filtered providers based on selected category
  const filteredProviders = dialogSelectedCategory
    ? Object.entries(INTEGRATION_PROVIDERS).filter(
        ([, info]) => info.category === dialogSelectedCategory,
      )
    : [];

  // =====================================================
  // HANDLERS
  // =====================================================

  // OAuth connection handler for Meta integrations
  const handleConnect = (provider: string) => {
    if (!activeBrandId) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "Selecciona una marca antes de conectar."
          : "Select a brand before connecting.",
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
          ? `La conexión para ${provider} aún no está disponible.`
          : `Connection for ${provider} is not available yet.`,
      });
      return;
    }

    // Open OAuth popup
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
    if (
      !dialogSelectedCategory ||
      !dialogSelectedProvider ||
      !newIntegrationStoreName
    ) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "Por favor, completa todos los campos requeridos."
          : "Please fill in all required fields.",
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
      storeUrl:
        newIntegrationFields.siteUrl ||
        newIntegrationFields.storeUrl ||
        undefined,
    };

    setIntegrations((prev) => [...prev, newIntegration]);
    setIsAddIntegrationDialogOpen(false);
    setDialogSelectedCategory("");
    setDialogSelectedProvider("");
    setNewIntegrationStoreName("");
    setNewIntegrationFields({});
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
      const response = await fetch(`/api/integrations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchIntegrations();
        toast({
          title: isSpanish ? "Integración Eliminada" : "Integration Deleted",
          description: isSpanish
            ? "La integración ha sido eliminada."
            : "The integration has been deleted.",
        });
      } else {
        throw new Error("Failed to delete integration");
      }
    } catch (error) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "No se pudo eliminar la integración."
          : "Failed to delete integration.",
        variant: "destructive",
      });
    }
  };

  // Sync products handler
  const handleSyncProducts = (integrationId: string) => {
    toast({
      title: isSpanish ? "Sincronización Iniciada" : "Sync Initiated",
      description: isSpanish
        ? "La sincronización de productos ha comenzado."
        : "Product sync has been initiated.",
    });
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render integration card
  const renderIntegrationCard = (integration: Integration) => {
    const providerInfo = INTEGRATION_PROVIDERS[integration.provider];
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
              {providerInfo?.name} •{" "}
              {integration.storeUrl || (isSpanish ? "N/A" : "N/A")}
            </p>
            {integration.lastSyncAt && (
              <p className="text-xs text-muted-foreground">
                {isSpanish ? "Última sincronización:" : "Last sync:"}{" "}
                {formatDate(integration.lastSyncAt)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={integration.isActive ? "default" : "secondary"}>
            {integration.isActive
              ? isSpanish
                ? "Activo"
                : "Active"
              : isSpanish
                ? "Inactivo"
                : "Inactive"}
          </Badge>

          {(integration.category === "pos" ||
            integration.category === "ecommerce") && (
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

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopHeader pageName={isSpanish ? "Integraciones" : "Integrations"} />
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div
              className="container mx-auto px-4 py-8 space-y-8"
              data-testid="integrations-page"
            >
              {/* Page Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Plug className="h-8 w-8" />
                    {isSpanish
                      ? "Gestión de Integraciones"
                      : "Integration Management"}
                  </h1>
                  <p className="text-muted-foreground">
                    {isSpanish
                      ? "Conecta varias plataformas para activar campañas geniales y la creación de contenido."
                      : "Connect various platforms to activate genius campaign and content creation."}
                  </p>
                </div>
              </div>

              {/* Add Integration Dialog */}
              <Dialog
                open={isAddIntegrationDialogOpen}
                onOpenChange={setIsAddIntegrationDialogOpen}
              >
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {isSpanish
                        ? "Añadir Nueva Integración"
                        : "Add New Integration"}
                    </DialogTitle>
                    <DialogDescription>
                      {isSpanish
                        ? "Selecciona un proveedor para conectar un nuevo servicio."
                        : "Select a provider to connect a new service."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Category Selection */}
                    <div>
                      <Label htmlFor="category-select">
                        {isSpanish
                          ? "Categoría de Integración"
                          : "Integration Category"}
                      </Label>
                      <Select
                        onValueChange={(value: Integration["category"]) => {
                          setDialogSelectedCategory(value);
                          setDialogSelectedProvider("");
                          setNewIntegrationFields({});
                        }}
                        value={dialogSelectedCategory}
                        disabled={!!dialogSelectedCategory}
                      >
                        <SelectTrigger
                          id="category-select"
                          data-testid="category-select"
                        >
                          <SelectValue
                            placeholder={
                              isSpanish
                                ? "Selecciona una categoría"
                                : "Select a category"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(INTEGRATION_CATEGORIES_DISPLAY).map(
                            ([key, info]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <info.icon className="h-4 w-4" />
                                  {info.name}
                                </div>
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Provider Selection */}
                    {dialogSelectedCategory && (
                      <div>
                        <Label htmlFor="provider-select">
                          {isSpanish ? "Proveedor" : "Provider"}
                        </Label>
                        <Select
                          onValueChange={(value) => {
                            setDialogSelectedProvider(value);
                            setNewIntegrationFields({});
                          }}
                          value={dialogSelectedProvider}
                          disabled={!dialogSelectedCategory}
                        >
                          <SelectTrigger
                            id="provider-select"
                            data-testid="provider-select"
                          >
                            <SelectValue
                              placeholder={
                                isSpanish
                                  ? "Selecciona un proveedor"
                                  : "Select a provider"
                              }
                            />
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
                        <div>
                          <Label htmlFor="store-name-input">
                            {INTEGRATION_PROVIDERS[dialogSelectedProvider]
                              ?.category === "social_media"
                              ? isSpanish
                                ? "Nombre de la Cuenta"
                                : "Account Name"
                              : INTEGRATION_PROVIDERS[dialogSelectedProvider]
                                    ?.category === "crm"
                                ? isSpanish
                                  ? "Nombre de Instancia CRM"
                                  : "CRM Instance Name"
                                : isSpanish
                                  ? "Nombre de Tienda/Sitio"
                                  : "Store/Site Name"}
                          </Label>
                          <Input
                            id="store-name-input"
                            placeholder={
                              INTEGRATION_PROVIDERS[dialogSelectedProvider]
                                ?.category === "social_media"
                                ? isSpanish
                                  ? "Tu Cuenta de Instagram"
                                  : "Your Instagram Account"
                                : INTEGRATION_PROVIDERS[dialogSelectedProvider]
                                      ?.category === "crm"
                                  ? isSpanish
                                    ? "Mi Instancia CRM de Ventas"
                                    : "My Sales CRM"
                                  : isSpanish
                                    ? "El nombre de tu tienda/sitio"
                                    : "Your store/site name"
                            }
                            value={newIntegrationStoreName}
                            onChange={(e) =>
                              setNewIntegrationStoreName(e.target.value)
                            }
                            data-testid="store-name-input"
                          />
                        </div>

                        {INTEGRATION_PROVIDERS[dialogSelectedProvider].fields.map(
                          (field) => (
                            <div key={field.name}>
                              <Label htmlFor={`${field.name}-input`}>
                                {field.label}
                              </Label>
                              {field.type === "select" ? (
                                <Select
                                  value={newIntegrationFields[field.name] || ""}
                                  onValueChange={(val) =>
                                    setNewIntegrationFields((prev) => ({
                                      ...prev,
                                      [field.name]: val,
                                    }))
                                  }
                                >
                                  <SelectTrigger id={`${field.name}-input`}>
                                    <SelectValue
                                      placeholder={field.placeholder || ""}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map((opt) => (
                                      <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                      >
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  id={`${field.name}-input`}
                                  type={field.type}
                                  placeholder={field.placeholder || ""}
                                  value={newIntegrationFields[field.name] || ""}
                                  onChange={(e) =>
                                    setNewIntegrationFields((prev) => ({
                                      ...prev,
                                      [field.name]: e.target.value,
                                    }))
                                  }
                                />
                              )}
                            </div>
                          ),
                        )}
                      </>
                    )}

                    {/* Dialog Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddIntegrationDialogOpen(false);
                          setDialogSelectedCategory("");
                          setDialogSelectedProvider("");
                          setNewIntegrationStoreName("");
                          setNewIntegrationFields({});
                        }}
                        data-testid="cancel-button"
                      >
                        {isSpanish ? "Cancelar" : "Cancel"}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCreateIntegration}
                        disabled={
                          !dialogSelectedProvider || !newIntegrationStoreName
                        }
                        data-testid="create-integration-button"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {isSpanish ? "Crear Integración" : "Create Integration"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Integrations by Category (Accordion) */}
              <Accordion type="multiple" defaultValue={["social_media"]}>
                {Object.entries(INTEGRATION_CATEGORIES_DISPLAY).map(
                  ([categoryKey, categoryInfo]) => (
                    <AccordionItem key={categoryKey} value={categoryKey}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2 py-2">
                          <categoryInfo.icon className="h-5 w-5" />
                          <span className="text-lg font-semibold">
                            {categoryInfo.name}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Card className="border-none shadow-none">
                          <CardHeader className="pt-0">
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
                                const integrationsInCategory =
                                  integrations.filter(
                                    (integration) =>
                                      integration.category === categoryKey,
                                  );

                                if (categoryKey === "social_media") {
                                  return (
                                    <>
                                      <h3 className="text-lg font-semibold mb-4">
                                        {isSpanish
                                          ? "Plataformas de Redes Sociales Disponibles"
                                          : "Available Social Media Platforms"}
                                      </h3>
                                      <div className="space-y-4 mb-8">
                                        {Object.entries(INTEGRATION_PROVIDERS)
                                          .filter(
                                            ([, info]) =>
                                              info.category === "social_media",
                                          )
                                          .map(([providerKey, providerInfo]) => {
                                            const connectedIntegration =
                                              integrations.find(
                                                (int) =>
                                                  int.provider ===
                                                    providerKey && int.isActive,
                                              );

                                            const Icon = providerInfo.icon;

                                            return (
                                              <div
                                                key={providerKey}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition"
                                                data-testid={`provider-${providerKey}`}
                                              >
                                                <div className="flex items-center gap-3">
                                                  <Icon className="h-8 w-8 text-primary" />
                                                  <div>
                                                    <h3 className="font-semibold">
                                                      {providerInfo.name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                      {providerInfo.description}
                                                    </p>
                                                    {connectedIntegration && (
                                                      <p className="text-xs text-green-600 mt-1">
                                                        ✅{" "}
                                                        {isSpanish
                                                          ? "Conectado como"
                                                          : "Connected as"}{" "}
                                                        {connectedIntegration.accountName ||
                                                          connectedIntegration.storeName}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>

                                                {connectedIntegration ? (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleDeleteIntegration(
                                                        connectedIntegration.id,
                                                      )
                                                    }
                                                    className="text-red-600 border-red-400 hover:bg-red-50"
                                                    data-testid={`disconnect-${providerKey}`}
                                                  >
                                                    {isSpanish
                                                      ? "Desconectar"
                                                      : "Disconnect"}
                                                  </Button>
                                                ) : (
                                                  <Button
                                                    size="sm"
                                                    onClick={() =>
                                                      handleConnect(providerKey)
                                                    }
                                                    data-testid={`connect-${providerKey}`}
                                                  >
                                                    {isSpanish
                                                      ? "Conectar"
                                                      : "Connect"}
                                                  </Button>
                                                )}
                                              </div>
                                            );
                                          })}
                                      </div>
                                    </>
                                  );
                                } else {
                                  return integrationsInCategory.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                      <categoryInfo.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                      <p>
                                        {isSpanish
                                          ? `No hay integraciones de ${categoryInfo.name.toLowerCase()} conectadas aún.`
                                          : `No ${categoryInfo.name.toLowerCase()} connected yet.`}
                                      </p>
                                      <p className="text-sm">
                                        {isSpanish
                                          ? `Añade tu primera integración de ${categoryInfo.name.toLowerCase().replace("integrations", "integration")} para empezar.`
                                          : `Add your first ${categoryInfo.name.toLowerCase().replace("integrations", "integration")} to get started.`}
                                      </p>
                                      <Button
                                        className="mt-4"
                                        onClick={() => {
                                          setDialogSelectedCategory(
                                            categoryKey as Integration["category"],
                                          );
                                          setIsAddIntegrationDialogOpen(true);
                                        }}
                                        data-testid={`add-${categoryKey}-integration`}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {isSpanish
                                          ? "Añadir Integración"
                                          : "Add Integration"}
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      {integrationsInCategory.map((int) =>
                                        renderIntegrationCard(int),
                                      )}
                                      <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => {
                                          setDialogSelectedCategory(
                                            categoryKey as Integration["category"],
                                          );
                                          setIsAddIntegrationDialogOpen(true);
                                        }}
                                        data-testid={`add-another-${categoryKey}-integration`}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {isSpanish
                                          ? "Añadir Otra"
                                          : "Add Another"}
                                      </Button>
                                    </div>
                                  );
                                }
                              })()
                            )}
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  ),
                )}
              </Accordion>
            </div>

            {/* Help AI Chatbot */}
            <HelpChatbot isSpanish={isSpanish} toggleLanguage={toggleLanguage} />
          </main>
        </div>
      </div>
    </div>
  );
}
