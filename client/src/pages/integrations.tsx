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
import { motion } from "framer-motion";
import { 
  SiInstagram, 
  SiFacebook, 
  SiWhatsapp, 
  SiTiktok, 
  SiYoutube,
  SiShopify,
  SiStripe,
  SiSquare,
  SiWoo,
  SiWix,
  SiHubspot,
  SiSalesforce
} from "react-icons/si";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Check,
  AlertCircle,
  Ban,
  QrCode,
  Smartphone,
  ArrowRight,
  Copy,
  Phone,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    name: "Instagram (via Facebook)",
    icon: Instagram,
    description: "Manage Instagram through your Facebook Business Page connection",
    category: "social_media",
    fields: [],
  },
  instagram_direct: {
    name: "Instagram Direct",
    icon: Instagram,
    description: "Connect directly to Instagram for messaging, content publishing, and insights",
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

  // WhatsApp connection method dialog state
  const [isWhatsAppMethodDialogOpen, setIsWhatsAppMethodDialogOpen] = useState(false);
  const [whatsAppMethod, setWhatsAppMethod] = useState<"embedded" | "qrcode" | "baileys" | null>(null);
  const [whatsAppPhoneNumber, setWhatsAppPhoneNumber] = useState("");
  const [whatsAppQrCode, setWhatsAppQrCode] = useState<string | null>(null);
  const [whatsAppPairingCode, setWhatsAppPairingCode] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrCodeStep, setQrCodeStep] = useState<1 | 2 | 3>(1);
  
  // Baileys QR connection state
  const [baileysQrCode, setBaileysQrCode] = useState<string | null>(null);
  const [baileysStatus, setBaileysStatus] = useState<string>("disconnected");
  const [baileysPhone, setBaileysPhone] = useState<string | null>(null);
  const [isBaileysConnecting, setIsBaileysConnecting] = useState(false);
  const [baileysPollingInterval, setBaileysPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [integrationToDelete, setIntegrationToDelete] = useState<Integration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Instagram mutual exclusivity - only one Instagram integration type can be active
  const hasInstagramViaFacebook = isProviderConnected("instagram");
  const hasInstagramDirect = isProviderConnected("instagram_direct");
  const hasAnyInstagram = hasInstagramViaFacebook || hasInstagramDirect;
  
  // Check if a provider is disabled due to Instagram conflict
  const isProviderDisabledByConflict = (providerKey: string): boolean => {
    if (providerKey === "instagram" && hasInstagramDirect) return true;
    if (providerKey === "instagram_direct" && hasInstagramViaFacebook) return true;
    return false;
  };
  
  // Get the reason for Instagram conflict
  const getInstagramConflictMessage = (): { title: string; description: string } | null => {
    if (hasInstagramViaFacebook) {
      return {
        title: isSpanish ? "Instagram conectado vía Facebook" : "Instagram connected via Facebook",
        description: isSpanish 
          ? "Ya tienes Instagram conectado a través de Facebook. Para usar Instagram Direct, primero desconecta la integración actual."
          : "You already have Instagram connected via Facebook. To use Instagram Direct, disconnect the current integration first."
      };
    }
    if (hasInstagramDirect) {
      return {
        title: isSpanish ? "Instagram Direct conectado" : "Instagram Direct connected",
        description: isSpanish
          ? "Ya tienes Instagram Direct conectado. Para usar Instagram vía Facebook, primero desconecta la integración actual."
          : "You already have Instagram Direct connected. To use Instagram via Facebook, disconnect the current integration first."
      };
    }
    return null;
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

    // Show WhatsApp method selection dialog
    if (provider === "whatsapp") {
      setWhatsAppMethod(null);
      setWhatsAppPhoneNumber("");
      setWhatsAppQrCode(null);
      setWhatsAppPairingCode(null);
      setQrCodeStep(1);
      setIsWhatsAppMethodDialogOpen(true);
      return;
    }

    let url = "";
    if (["facebook", "instagram", "threads"].includes(provider)) {
      url = `/api/integrations/facebook/connect?brandId=${activeBrandId}`;
    } else if (provider === "instagram_direct") {
      url = `/api/integrations/instagram/connect?brandId=${activeBrandId}`;
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

  // WhatsApp Embedded Signup handler
  const handleWhatsAppEmbeddedSignup = () => {
    const url = `/api/integrations/whatsapp/connect?brandId=${activeBrandId}`;
    const popup = window.open(url, "_blank", "width=600,height=700");
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        setIsWhatsAppMethodDialogOpen(false);
        window.location.reload();
      }
    }, 1000);
  };

  // WhatsApp QR Code generator
  const handleGenerateWhatsAppQr = async () => {
    if (!whatsAppPhoneNumber.trim()) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish ? "Ingresa tu número de teléfono" : "Enter your phone number",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingQr(true);
    try {
      const res = await fetch("/api/integrations/whatsapp/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: whatsAppPhoneNumber.replace(/\D/g, ""),
          brandId: activeBrandId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate QR code");
      }

      if (data.qrCodeUrl) {
        setWhatsAppQrCode(data.qrCodeUrl);
      }
      if (data.pairingCode) {
        setWhatsAppPairingCode(data.pairingCode);
      }
      setQrCodeStep(2);
    } catch (error) {
      console.error("QR generation error:", error);
      toast({
        title: isSpanish ? "Error" : "Error",
        description: error instanceof Error ? error.message : "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Copy pairing code to clipboard
  const copyPairingCode = () => {
    if (whatsAppPairingCode) {
      navigator.clipboard.writeText(whatsAppPairingCode);
      toast({
        title: isSpanish ? "Copiado" : "Copied",
        description: isSpanish ? "Código copiado al portapapeles" : "Code copied to clipboard",
      });
    }
  };

  // Baileys QR connection handler
  const handleBaileysConnect = async () => {
    if (!activeBrandId) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish ? "Por favor, selecciona una marca primero" : "Please select a brand first",
        variant: "destructive",
      });
      return;
    }
    
    setIsBaileysConnecting(true);
    setBaileysQrCode(null);
    setBaileysStatus("connecting");
    
    try {
      const res = await fetch("/api/whatsapp-baileys/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: activeBrandId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to start connection");
      }
      
      if (data.status === "already_connected") {
        setBaileysStatus("connected");
        setBaileysPhone(data.phoneNumber);
        toast({
          title: isSpanish ? "Ya conectado" : "Already connected",
          description: isSpanish ? "Tu WhatsApp ya está conectado" : "Your WhatsApp is already connected",
        });
        return;
      }
      
      if (data.qrCode) {
        setBaileysQrCode(data.qrCode);
        setBaileysStatus("qr_ready");
      }
      
      // Start polling for status updates
      startBaileysPolling();
      
    } catch (error) {
      console.error("Baileys connection error:", error);
      setBaileysStatus("error");
      toast({
        title: isSpanish ? "Error" : "Error",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setIsBaileysConnecting(false);
    }
  };
  
  // Poll Baileys status
  const startBaileysPolling = () => {
    if (baileysPollingInterval) {
      clearInterval(baileysPollingInterval);
    }
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/whatsapp-baileys/status");
        const data = await res.json();
        
        if (data.status === "connected") {
          setBaileysStatus("connected");
          setBaileysPhone(data.phoneNumber);
          setBaileysQrCode(null);
          clearInterval(interval);
          setBaileysPollingInterval(null);
          
          toast({
            title: isSpanish ? "¡Conectado!" : "Connected!",
            description: isSpanish 
              ? `WhatsApp conectado: ${data.phoneNumber}`
              : `WhatsApp connected: ${data.phoneNumber}`,
          });
          
          // Refresh integrations
          fetchIntegrations();
        } else if (data.status === "qr_ready" && data.qrCode) {
          setBaileysQrCode(data.qrCode);
          setBaileysStatus("qr_ready");
        } else if (data.status === "disconnected") {
          setBaileysStatus("disconnected");
          clearInterval(interval);
          setBaileysPollingInterval(null);
        }
      } catch (error) {
        console.error("Status polling error:", error);
      }
    }, 2000);
    
    setBaileysPollingInterval(interval);
    
    // Auto-cleanup after 2 minutes if no connection
    setTimeout(() => {
      clearInterval(interval);
      setBaileysPollingInterval(null);
    }, 120000);
  };
  
  // Disconnect Baileys
  const handleBaileysDisconnect = async () => {
    try {
      const res = await fetch("/api/whatsapp-baileys/disconnect", {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (data.success) {
        setBaileysStatus("disconnected");
        setBaileysQrCode(null);
        setBaileysPhone(null);
        
        toast({
          title: isSpanish ? "Desconectado" : "Disconnected",
          description: isSpanish ? "WhatsApp ha sido desconectado" : "WhatsApp has been disconnected",
        });
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };
  
  // Cleanup polling on unmount or dialog close
  useEffect(() => {
    return () => {
      if (baileysPollingInterval) {
        clearInterval(baileysPollingInterval);
      }
    };
  }, [baileysPollingInterval]);

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

  // Show delete confirmation dialog
  const handleDeleteIntegration = (integration: Integration) => {
    setIntegrationToDelete(integration);
    setIsDeleteDialogOpen(true);
  };

  // Actually perform the delete after confirmation
  const confirmDeleteIntegration = async () => {
    if (!integrationToDelete || !activeBrandId) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/integrations/${integrationToDelete.id}?brandId=${activeBrandId}`, { 
        method: "DELETE" 
      });
      if (response.ok) {
        fetchIntegrations();
        toast({
          title: isSpanish ? "Integración Eliminada" : "Integration Disconnected",
          description: isSpanish 
            ? "La integración ha sido eliminada exitosamente." 
            : "The integration has been disconnected successfully.",
        });
        setIsDeleteDialogOpen(false);
        setIntegrationToDelete(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to delete integration");
      }
    } catch (error) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish 
          ? "No se pudo eliminar la integración." 
          : (error instanceof Error ? error.message : "Failed to delete integration."),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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

  const totalConnected = integrations.filter(i => i.isActive).length;
  const totalAvailable = Object.keys(INTEGRATION_PROVIDERS).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <TopHeader pageName={isSpanish ? "Integraciones" : "Integrations"} />
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8" data-testid="integrations-page">
              
                {/* Hero Section */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 p-6 md:p-8 shadow-xl">
                    <div className="absolute inset-0 opacity-10">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                          backgroundSize: "20px 20px",
                        }}
                      />
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <Plug className="w-7 h-7 text-white" />
                          </div>
                          <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-sm" data-testid="text-page-title">
                              {isSpanish ? "Integraciones" : "Integrations"}
                            </h1>
                            <p className="text-slate-300 text-sm">
                              {isSpanish 
                                ? "Conecta tus plataformas favoritas" 
                                : "Connect your favorite platforms"}
                            </p>
                          </div>
                        </div>

                        <p className="text-slate-200 text-sm md:text-base max-w-xl">
                          {isSpanish
                            ? "Potencia tus campañas conectando redes sociales, tiendas online, sistemas de pago y CRM en un solo lugar."
                            : "Power up your campaigns by connecting social media, online stores, payment systems and CRM in one place."}
                        </p>
                      </div>

                      {/* Stats Cards in Hero */}
                      <div className="flex gap-3">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white rounded-xl p-4 min-w-[100px] text-center shadow-lg"
                        >
                          <p className="text-3xl font-bold text-primary">{totalConnected}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {isSpanish ? "Conectadas" : "Connected"}
                          </p>
                        </motion.div>
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="bg-white rounded-xl p-4 min-w-[100px] text-center shadow-lg"
                        >
                          <p className="text-3xl font-bold text-primary">{totalAvailable}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {isSpanish ? "Disponibles" : "Available"}
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Stats Cards */}
                {!integrationsLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                  >
                    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                              {isSpanish ? "Redes Sociales" : "Social Media"}
                            </p>
                            <p className="text-2xl font-bold text-pink-600 mt-1">
                              {getConnectedCount("social_media")}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                            <Instagram className="w-6 h-6 text-pink-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                              E-commerce
                            </p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                              {getConnectedCount("ecommerce")}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                              {isSpanish ? "Pagos" : "Payments"}
                            </p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">
                              {getConnectedCount("pos")}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                              CRM
                            </p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">
                              {getConnectedCount("crm")}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                            <BriefcaseBusiness className="w-6 h-6 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Category Tabs */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="shadow-sm">
                    <CardContent className="pt-6">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-lg">
                          {INTEGRATION_CATEGORIES.map((category) => {
                            const connectedCount = getConnectedCount(category.key);
                            const CategoryIcon = category.icon;
                            return (
                              <TabsTrigger
                                key={category.key}
                                value={category.key}
                                data-testid={`tab-${category.key}`}
                                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
                              >
                                <CategoryIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">{isSpanish ? category.nameEs : category.name}</span>
                                {connectedCount > 0 && (
                                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                    {connectedCount}
                                  </Badge>
                                )}
                              </TabsTrigger>
                            );
                          })}
                        </TabsList>

                        {INTEGRATION_CATEGORIES.map((category) => (
                          <TabsContent key={category.key} value={category.key} className="space-y-4 mt-6">
                            {/* Category Header */}
                            <div className="flex items-center justify-between pb-2 border-b">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {isSpanish ? category.nameEs : category.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {category.key === "social_media" && (isSpanish ? "Conecta tus perfiles de redes sociales" : "Connect your social media profiles")}
                                  {category.key === "ecommerce" && (isSpanish ? "Integra tu tienda online" : "Integrate your online store")}
                                  {category.key === "pos" && (isSpanish ? "Conecta sistemas de pago" : "Connect payment systems")}
                                  {category.key === "crm" && (isSpanish ? "Enlaza tu CRM" : "Link your CRM")}
                                </p>
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

                    {/* Instagram Conflict Alert Banner */}
                    {category.key === "social_media" && hasAnyInstagram && (
                      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800" data-testid="alert-instagram-conflict">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800 dark:text-amber-400">
                          {getInstagramConflictMessage()?.title}
                        </AlertTitle>
                        <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                          {getInstagramConflictMessage()?.description}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Integration Cards - Compact Grid */}
                    {integrationsLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {getProvidersForCategory(category.key).map(([providerKey, providerInfo]) => {
                          const isConnected = isProviderConnected(providerKey);
                          const connectedIntegration = getConnectedIntegration(providerKey);
                          const isDisabledByConflict = isProviderDisabledByConflict(providerKey);
                          const Icon = providerInfo.icon;

                          const getIconColor = () => {
                            if (isDisabledByConflict) return 'text-gray-400';
                            switch (providerKey) {
                              case 'facebook': return 'text-blue-600';
                              case 'instagram': return 'text-pink-500';
                              case 'instagram_direct': return 'text-fuchsia-500';
                              case 'whatsapp': return 'text-green-500';
                              case 'threads': return 'text-gray-900 dark:text-gray-100';
                              case 'tiktok': return 'text-gray-900 dark:text-gray-100';
                              case 'youtube': return 'text-red-600';
                              case 'hubspot': return 'text-orange-500';
                              case 'salesforce': return 'text-blue-500';
                              case 'zoho_crm': return 'text-red-500';
                              case 'shopify': return 'text-green-600';
                              case 'stripe': return 'text-purple-600';
                              case 'square': return 'text-gray-900 dark:text-gray-100';
                              case 'woocommerce': return 'text-purple-700';
                              case 'wix': return 'text-black dark:text-white';
                              case 'custom_website': return 'text-blue-500';
                              default: return 'text-gray-600 dark:text-gray-400';
                            }
                          };

                          return (
                            <Card
                              key={providerKey}
                              className={`relative transition-all duration-200 ${
                                isConnected 
                                  ? 'ring-1 ring-green-200 bg-green-50/50 dark:bg-green-950/20 hover:shadow-md' 
                                  : isDisabledByConflict 
                                    ? 'opacity-60 bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed' 
                                    : 'hover:shadow-md'
                              }`}
                              data-testid={`provider-${providerKey}`}
                            >
                              <CardContent className="p-4">
                                {/* Header Row */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                                      <Icon className={`h-5 w-5 ${getIconColor()}`} />
                                    </div>
                                    <div className="min-w-0">
                                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                        {providerInfo.name}
                                      </h3>
                                      {connectedIntegration && (
                                        <p className="text-xs text-green-600 dark:text-green-400 truncate">
                                          {connectedIntegration.accountName || connectedIntegration.storeName}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {isConnected && (
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                      <Check className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                </div>

                                {/* Description */}
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                  {providerInfo.description}
                                </p>

                                {/* Action Button */}
                                {isConnected ? (
                                  <div className="flex gap-2">
                                    {(category.key === "pos" || category.key === "ecommerce") && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 h-8 text-xs"
                                        data-testid={`sync-${providerKey}`}
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Sync
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                      onClick={() => handleDeleteIntegration(connectedIntegration!)}
                                      data-testid={`disconnect-${providerKey}`}
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      {isSpanish ? "Desconectar" : "Disconnect"}
                                    </Button>
                                  </div>
                                ) : isDisabledByConflict ? (
                                  <Button
                                    size="sm"
                                    className="w-full h-8 text-xs"
                                    variant="outline"
                                    disabled
                                    onClick={() => {
                                      toast({
                                        title: isSpanish ? "Integración no disponible" : "Integration unavailable",
                                        description: getInstagramConflictMessage()?.description,
                                        variant: "destructive",
                                      });
                                    }}
                                    data-testid={`connect-${providerKey}-disabled`}
                                  >
                                    <Ban className="h-3 w-3 mr-1" />
                                    {isSpanish ? "No disponible" : "Unavailable"}
                                  </Button>
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
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>

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

              {/* WhatsApp Connection Method Dialog */}
              <Dialog open={isWhatsAppMethodDialogOpen} onOpenChange={(open) => {
                setIsWhatsAppMethodDialogOpen(open);
                if (!open) {
                  setWhatsAppMethod(null);
                  setWhatsAppPhoneNumber("");
                  setWhatsAppQrCode(null);
                  setWhatsAppPairingCode(null);
                  setQrCodeStep(1);
                  // Reset ALL baileys state on dialog close
                  if (baileysPollingInterval) {
                    clearInterval(baileysPollingInterval);
                    setBaileysPollingInterval(null);
                  }
                  setBaileysQrCode(null);
                  setBaileysStatus("disconnected");
                  setBaileysPhone(null);
                  setIsBaileysConnecting(false);
                }
              }}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-green-500" />
                      {isSpanish ? "Conectar WhatsApp Business" : "Connect WhatsApp Business"}
                    </DialogTitle>
                    <DialogDescription>
                      {isSpanish 
                        ? "Elige cómo deseas conectar tu cuenta de WhatsApp Business" 
                        : "Choose how you want to connect your WhatsApp Business account"}
                    </DialogDescription>
                  </DialogHeader>

                  {!whatsAppMethod ? (
                    <div className="space-y-4 pt-4">
                      {/* Embedded Signup Option */}
                      <Card 
                        className="cursor-pointer hover:border-green-300 hover:bg-green-50/50 transition-all"
                        onClick={() => setWhatsAppMethod("embedded")}
                        data-testid="whatsapp-embedded-option"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <ExternalLink className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-sm">
                                {isSpanish ? "Registro de Meta (Recomendado)" : "Meta Signup (Recommended)"}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {isSpanish 
                                  ? "Crea una nueva cuenta de WhatsApp Business o conecta una existente a través del proceso oficial de Meta." 
                                  : "Create a new WhatsApp Business account or connect an existing one through Meta's official process."}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {isSpanish ? "Oficial" : "Official"}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {isSpanish ? "10-15 min" : "10-15 min"}
                                </Badge>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* QR Code Option */}
                      <Card 
                        className="cursor-pointer hover:border-green-300 hover:bg-green-50/50 transition-all"
                        onClick={() => setWhatsAppMethod("qrcode")}
                        data-testid="whatsapp-qrcode-option"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <QrCode className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-sm">
                                {isSpanish ? "Código QR / Vincular Dispositivo" : "QR Code / Link Device"}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {isSpanish 
                                  ? "Conecta tu app WhatsApp Business existente escaneando un código QR. Requiere la app instalada en tu teléfono." 
                                  : "Connect your existing WhatsApp Business app by scanning a QR code. Requires the app installed on your phone."}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {isSpanish ? "Requiere app" : "Requires app"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {isSpanish ? "2-5 min" : "2-5 min"}
                                </Badge>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Baileys QR Code Option (Experimental) */}
                      <Card 
                        className="cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all border-dashed"
                        onClick={() => setWhatsAppMethod("baileys")}
                        data-testid="whatsapp-baileys-option"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Smartphone className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-sm flex items-center gap-2">
                                {isSpanish ? "Conexión Rápida (Experimental)" : "Quick Connect (Experimental)"}
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Beta</Badge>
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {isSpanish 
                                  ? "Conecta cualquier WhatsApp escaneando un QR. Rápido pero no oficial - puede resultar en suspensión de cuenta." 
                                  : "Connect any WhatsApp by scanning a QR. Fast but unofficial - may result in account suspension."}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                  {isSpanish ? "No oficial" : "Unofficial"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {isSpanish ? "< 1 min" : "< 1 min"}
                                </Badge>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : whatsAppMethod === "embedded" ? (
                    <div className="space-y-4 pt-4">
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">{isSpanish ? "Proceso Oficial de Meta" : "Official Meta Process"}</AlertTitle>
                        <AlertDescription className="text-green-700 text-sm">
                          {isSpanish 
                            ? "Se abrirá una ventana de Meta para completar el registro. Sigue las instrucciones para verificar tu negocio y número de teléfono."
                            : "A Meta window will open to complete the signup. Follow the instructions to verify your business and phone number."}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{isSpanish ? "Lo que necesitarás:" : "What you'll need:"}</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>{isSpanish ? "Una cuenta de Facebook/Meta Business" : "A Facebook/Meta Business account"}</li>
                          <li>{isSpanish ? "Un número de teléfono para WhatsApp" : "A phone number for WhatsApp"}</li>
                          <li>{isSpanish ? "Acceso a verificación por SMS o llamada" : "Access to SMS or call verification"}</li>
                        </ul>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={() => setWhatsAppMethod(null)} data-testid="whatsapp-back-btn">
                          {isSpanish ? "Volver" : "Back"}
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleWhatsAppEmbeddedSignup} data-testid="whatsapp-start-signup-btn">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {isSpanish ? "Iniciar Registro" : "Start Signup"}
                        </Button>
                      </div>
                    </div>
                  ) : whatsAppMethod === "baileys" ? (
                    <div className="space-y-4 pt-4">
                      {/* Warning Alert */}
                      <Alert className="border-orange-300 bg-orange-50">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertTitle className="text-orange-800">{isSpanish ? "⚠️ Método Experimental" : "⚠️ Experimental Method"}</AlertTitle>
                        <AlertDescription className="text-orange-700 text-sm">
                          {isSpanish 
                            ? "Este método NO es oficial de Meta/WhatsApp. Tu cuenta podría ser suspendida temporalmente o permanentemente. Úsalo bajo tu propio riesgo."
                            : "This method is NOT official from Meta/WhatsApp. Your account could be temporarily or permanently suspended. Use at your own risk."}
                        </AlertDescription>
                      </Alert>

                      {baileysStatus === "disconnected" && (
                        <>
                          <div className="text-center py-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                              <Smartphone className="h-8 w-8 text-orange-600" />
                            </div>
                            <h3 className="font-medium text-lg">
                              {isSpanish ? "Conexión Rápida por QR" : "Quick QR Connection"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2">
                              {isSpanish 
                                ? "Haz clic en el botón para generar un código QR que podrás escanear con WhatsApp."
                                : "Click the button to generate a QR code that you can scan with WhatsApp."}
                            </p>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => setWhatsAppMethod(null)} data-testid="baileys-back-btn">
                              {isSpanish ? "Volver" : "Back"}
                            </Button>
                            <Button 
                              className="flex-1 bg-orange-600 hover:bg-orange-700" 
                              onClick={handleBaileysConnect}
                              disabled={isBaileysConnecting}
                              data-testid="baileys-connect-btn"
                            >
                              {isBaileysConnecting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {isSpanish ? "Conectando..." : "Connecting..."}
                                </>
                              ) : (
                                <>
                                  <QrCode className="h-4 w-4 mr-2" />
                                  {isSpanish ? "Generar QR" : "Generate QR"}
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}

                      {(baileysStatus === "connecting" || baileysStatus === "qr_ready") && (
                        <>
                          <div className="text-center">
                            <h3 className="font-medium">
                              {isSpanish ? "Escanea con WhatsApp" : "Scan with WhatsApp"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {isSpanish 
                                ? "Abre WhatsApp > Menú > Dispositivos vinculados > Vincular dispositivo"
                                : "Open WhatsApp > Menu > Linked Devices > Link a Device"}
                            </p>
                          </div>

                          <div className="flex justify-center p-4 bg-white rounded-lg border">
                            {baileysQrCode ? (
                              <img 
                                src={baileysQrCode} 
                                alt="WhatsApp QR Code" 
                                className="w-56 h-56"
                                data-testid="baileys-qr-image"
                              />
                            ) : (
                              <div className="w-56 h-56 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => {
                              if (baileysPollingInterval) {
                                clearInterval(baileysPollingInterval);
                                setBaileysPollingInterval(null);
                              }
                              setBaileysStatus("disconnected");
                              setBaileysQrCode(null);
                            }} data-testid="baileys-cancel-btn">
                              {isSpanish ? "Cancelar" : "Cancel"}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={handleBaileysConnect}
                              data-testid="baileys-refresh-qr-btn"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              {isSpanish ? "Refrescar QR" : "Refresh QR"}
                            </Button>
                          </div>
                        </>
                      )}

                      {baileysStatus === "connected" && (
                        <>
                          <div className="text-center py-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                              <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-medium text-lg text-green-700">
                              {isSpanish ? "¡WhatsApp Conectado!" : "WhatsApp Connected!"}
                            </h3>
                            {baileysPhone && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {isSpanish ? `Número: ${baileysPhone}` : `Number: ${baileysPhone}`}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={handleBaileysDisconnect}
                              data-testid="baileys-disconnect-btn"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              {isSpanish ? "Desconectar" : "Disconnect"}
                            </Button>
                            <Button 
                              className="flex-1" 
                              onClick={() => setIsWhatsAppMethodDialogOpen(false)}
                              data-testid="baileys-done-btn"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              {isSpanish ? "Listo" : "Done"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4">
                      {qrCodeStep === 1 && (
                        <>
                          <Alert className="border-blue-200 bg-blue-50">
                            <Smartphone className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800">{isSpanish ? "Vincular WhatsApp Business App" : "Link WhatsApp Business App"}</AlertTitle>
                            <AlertDescription className="text-blue-700 text-sm">
                              {isSpanish 
                                ? "Este método te permite usar tu app WhatsApp Business existente junto con nuestra plataforma."
                                : "This method allows you to use your existing WhatsApp Business app alongside our platform."}
                            </AlertDescription>
                          </Alert>

                          <div className="space-y-3">
                            <Label htmlFor="whatsapp-phone">{isSpanish ? "Número de teléfono (con código de país)" : "Phone number (with country code)"}</Label>
                            <div className="flex gap-2">
                              <div className="flex items-center gap-1 px-3 bg-gray-100 rounded-l-md border border-r-0">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-500">+</span>
                              </div>
                              <Input
                                id="whatsapp-phone"
                                placeholder={isSpanish ? "Ej: 521234567890" : "Ex: 11234567890"}
                                value={whatsAppPhoneNumber}
                                onChange={(e) => setWhatsAppPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                                className="rounded-l-none"
                                data-testid="whatsapp-phone-input"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {isSpanish 
                                ? "Ingresa el número completo sin espacios ni guiones (ej: 521234567890 para México)"
                                : "Enter the complete number without spaces or dashes (e.g., 11234567890 for US)"}
                            </p>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => setWhatsAppMethod(null)} data-testid="whatsapp-qr-back-btn">
                              {isSpanish ? "Volver" : "Back"}
                            </Button>
                            <Button 
                              className="flex-1 bg-blue-600 hover:bg-blue-700" 
                              onClick={handleGenerateWhatsAppQr}
                              disabled={isGeneratingQr || !whatsAppPhoneNumber}
                              data-testid="whatsapp-generate-qr-btn"
                            >
                              {isGeneratingQr ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {isSpanish ? "Generando..." : "Generating..."}
                                </>
                              ) : (
                                <>
                                  <QrCode className="h-4 w-4 mr-2" />
                                  {isSpanish ? "Generar Código QR" : "Generate QR Code"}
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}

                      {qrCodeStep === 2 && (
                        <>
                          <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                              <QrCode className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-medium">
                              {isSpanish ? "Escanea el código desde tu teléfono" : "Scan the code from your phone"}
                            </h3>
                          </div>

                          {whatsAppQrCode ? (
                            <div className="flex justify-center p-4 bg-white rounded-lg border">
                              <img 
                                src={whatsAppQrCode} 
                                alt="WhatsApp QR Code" 
                                className="w-48 h-48"
                                data-testid="whatsapp-qr-image"
                              />
                            </div>
                          ) : whatsAppPairingCode ? (
                            <div className="space-y-3">
                              <p className="text-sm text-center text-muted-foreground">
                                {isSpanish 
                                  ? "Usa este código de emparejamiento en tu WhatsApp Business:"
                                  : "Use this pairing code in your WhatsApp Business:"}
                              </p>
                              <div className="flex items-center justify-center gap-2 p-4 bg-gray-100 rounded-lg">
                                <code className="text-2xl font-mono font-bold tracking-widest">
                                  {whatsAppPairingCode}
                                </code>
                                <Button variant="ghost" size="icon" onClick={copyPairingCode} data-testid="copy-pairing-code-btn">
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : null}

                          <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                            <p className="font-medium">{isSpanish ? "Instrucciones:" : "Instructions:"}</p>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                              <li>{isSpanish ? "Abre WhatsApp Business en tu teléfono" : "Open WhatsApp Business on your phone"}</li>
                              <li>{isSpanish ? "Ve a Configuración > Dispositivos vinculados" : "Go to Settings > Linked Devices"}</li>
                              <li>{isSpanish ? "Toca 'Vincular un dispositivo'" : "Tap 'Link a Device'"}</li>
                              <li>{isSpanish ? "Escanea el código QR o ingresa el código" : "Scan the QR code or enter the code"}</li>
                            </ol>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => setQrCodeStep(1)} data-testid="whatsapp-qr-retry-btn">
                              {isSpanish ? "Reintentar" : "Retry"}
                            </Button>
                            <Button 
                              className="flex-1" 
                              onClick={() => {
                                setIsWhatsAppMethodDialogOpen(false);
                                toast({
                                  title: isSpanish ? "Verificando conexión..." : "Verifying connection...",
                                  description: isSpanish 
                                    ? "La página se actualizará para mostrar el estado de conexión."
                                    : "The page will refresh to show connection status.",
                                });
                                setTimeout(() => window.location.reload(), 2000);
                              }}
                              data-testid="whatsapp-done-btn"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              {isSpanish ? "Listo, ya escaneé" : "Done, I've scanned"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      {isSpanish ? "Desconectar Integración" : "Disconnect Integration"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p className="font-medium text-foreground">
                        {isSpanish 
                          ? `¿Estás seguro de que deseas desconectar ${integrationToDelete?.accountName || integrationToDelete?.storeName || "esta integración"}?`
                          : `Are you sure you want to disconnect ${integrationToDelete?.accountName || integrationToDelete?.storeName || "this integration"}?`
                        }
                      </p>
                      
                      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2">
                        <p className="font-semibold text-red-700 dark:text-red-400">
                          {isSpanish ? "Esta acción causará:" : "This action will cause:"}
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-600 dark:text-red-400">
                          <li>
                            {isSpanish 
                              ? "No podrás enviar ni recibir mensajes a través de esta plataforma"
                              : "You won't be able to send or receive messages through this platform"
                            }
                          </li>
                          <li>
                            {isSpanish 
                              ? "Todos los mensajes e historial de conversaciones serán eliminados"
                              : "All messages and conversation history will be deleted"
                            }
                          </li>
                          <li>
                            {isSpanish 
                              ? "No podrás crear publicaciones ni leer estadísticas de esta cuenta"
                              : "You won't be able to create posts or read insights from this account"
                            }
                          </li>
                        </ul>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {isSpanish 
                          ? "Puedes volver a conectar esta integración en cualquier momento."
                          : "You can reconnect this integration at any time."
                        }
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} data-testid="cancel-delete-btn">
                      {isSpanish ? "Cancelar" : "Cancel"}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={confirmDeleteIntegration}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      data-testid="confirm-delete-btn"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {isSpanish ? "Eliminando..." : "Deleting..."}
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isSpanish ? "Sí, Desconectar" : "Yes, Disconnect"}
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              </div>
            </div>

            {/* Help Chatbot */}
            <HelpChatbot />
          </main>
        </div>
      </div>
    </div>
  );
}
