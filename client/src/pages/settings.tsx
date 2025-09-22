import { useState, useCallback } from "react";
// Re-introducidas para soporte de idioma y notificaciones
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";

import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Trash2,
  Plus,
  Loader2,
  DollarSign,
  Wallet,
  User,
  Lock,
  Settings as SettingsIcon,
  Save,
  Plug, // New icon for Integrations
  Bell, // New icon for Notifications
  BarChart, // Example icon for Google Analytics
  Mail, // Example icon for Mailchimp
  Briefcase, // Example icon for Salesforce
  Store, // For POS Integrations
  ShoppingBag, // For E-commerce Integrations
  Globe, // For WooCommerce
  Instagram, // For Social Media
  Facebook, // For Social Media
  Youtube, // For Social Media
  Building, // For Leadboost CRM
  LayoutGrid, // For Wix
  Link, // For Custom Website
  BriefcaseBusiness, // For CRM
  Share2, // For TikTok
  RefreshCw, // ¡Añadido! Este era el que faltaba.
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// --- Interfaces (solo para tipado de datos simulados) ---
interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
}

interface SubscriptionDetails {
  plan: string;
  price: string;
  billingCycle: string;
  nextBillingDate: string;
  status: "active" | "canceled" | "paused";
}

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
  icon: React.ElementType;
  description: string;
  category: "pos" | "ecommerce" | "social_media" | "crm";
  fields: IntegrationField[];
}

interface NotificationSettings {
  email: {
    newMessage: boolean;
    accountActivity: boolean;
    promotional: boolean;
  };
  sms: {
    newMessage: boolean;
    accountActivity: boolean;
  };
  inApp: {
    newMessage: boolean;
    promotional: boolean;
  };
}

// --- Provider Info ---
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
  tiktok: {
    name: "TikTok",
    icon: Share2, // Reemplazado por Share2
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
    icon: BriefcaseBusiness, // Using generic icon
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
    icon: BriefcaseBusiness, // Using generic icon
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

// Define categories for display and filtering
const INTEGRATION_CATEGORIES_DISPLAY: Record<
  Integration["category"],
  { name: string; icon: React.ElementType; description: string }
> = {
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
  social_media: {
    name: "Social Media Accounts",
    icon: Instagram,
    description:
      "Connect your social media profiles to manage content and engagement.",
  },
  crm: {
    name: "CRM Systems",
    icon: BriefcaseBusiness,
    description: "Link your CRM to centralize customer data and interactions.",
  },
};

// --- Dummy Data for UI Preview ---
const dummyAccountInfo = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  address: "123 Main St, Anytown, USA",
  currentPlan: "Pro Plan",
  memberSince: "January 1, 2023",
  twoFactorAuthEnabled: true,
};

const dummyPaymentMethods: PaymentMethod[] = [
  {
    id: "pm_1",
    brand: "Visa",
    last4: "4242",
    expMonth: "12",
    expYear: "26",
    isDefault: true,
  },
  {
    id: "pm_2",
    brand: "Mastercard",
    last4: "5555",
    expMonth: "08",
    expYear: "27",
    isDefault: false,
  },
];

const dummySubscription: SubscriptionDetails = {
  plan: "Pro Plan",
  price: "$29.00",
  billingCycle: "monthly",
  nextBillingDate: "October 19, 2025",
  status: "active",
};

const dummyIntegrations: Integration[] = [
  {
    id: "int_shopify_1",
    provider: "shopify",
    category: "ecommerce",
    storeName: "My Shopify Store",
    storeUrl: "myshop.myshopify.com",
    isActive: true,
    syncEnabled: true,
    lastSyncAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "int_square_1",
    provider: "square",
    category: "pos",
    storeName: "Main Street Cafe POS",
    isActive: true,
    syncEnabled: true,
    lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: "int_instagram_1",
    provider: "instagram",
    category: "social_media",
    storeName: "@MyBrandOfficial",
    isActive: true,
    syncEnabled: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "int_hubspot_1",
    provider: "hubspot",
    category: "crm",
    storeName: "Leadboost CRM Instance",
    isActive: true,
    syncEnabled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "int_wix_1",
    provider: "wix",
    category: "ecommerce",
    storeName: "My Portfolio Site",
    storeUrl: "myportfolio.wixsite.com",
    isActive: true,
    syncEnabled: false,
    createdAt: new Date().toISOString(),
  },
];

const dummyProducts: Product[] = [
  {
    id: "prod_1",
    name: "Organic Coffee Beans",
    price: 1500,
    currency: "USD",
    sku: "OCB001",
    category: "Coffee",
    isActive: true,
    stockQuantity: 120,
  },
  {
    id: "prod_2",
    name: "Espresso Machine",
    price: 35000,
    currency: "USD",
    sku: "ESPMCH01",
    category: "Equipment",
    isActive: true,
    stockQuantity: 15,
  },
  {
    id: "prod_3",
    name: "Ceramic Mug",
    price: 800,
    currency: "USD",
    sku: "CMUG005",
    category: "Merchandise",
    isActive: true,
    stockQuantity: 300,
  },
];

const dummyTransactions: SalesTransaction[] = [
  {
    id: "trans_1",
    transactionId: "TXN12345",
    customerName: "Alice Smith",
    totalAmount: 2300,
    currency: "USD",
    status: "completed",
    paymentMethod: "Card",
    transactionDate: new Date().toISOString(),
  },
  {
    id: "trans_2",
    transactionId: "TXN12346",
    customerName: "Bob Johnson",
    totalAmount: 1500,
    currency: "USD",
    status: "completed",
    paymentMethod: "Cash",
    transactionDate: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "trans_3",
    transactionId: "TXN12347",
    customerName: "Guest",
    totalAmount: 800,
    currency: "USD",
    status: "pending",
    paymentMethod: "Card",
    transactionDate: new Date(Date.now() - 120000).toISOString(),
  },
];

const initialNotificationSettings: NotificationSettings = {
  email: {
    newMessage: true,
    accountActivity: true,
    promotional: false,
  },
  sms: {
    newMessage: false,
    accountActivity: true,
  },
  inApp: {
    newMessage: true,
    promotional: true,
  },
};

export default function Settings() {
  const { isSpanish } = useLanguage(); // Assuming useLanguage hook is available
  const { toast } = useToast(); // Assuming useToast hook is available

  // --- States para la UI (todos inicializados con dummy data) ---

  // States para Payment Methods
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>(dummyPaymentMethods);
  const [currentSubscription, setCurrentSubscription] =
    useState<SubscriptionDetails>(dummySubscription);
  const [isAddPaymentMethodDialogOpen, setIsAddPaymentMethodDialogOpen] =
    useState(false);

  // States para el diálogo de Add Payment Method
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpMonth, setNewCardExpMonth] = useState("");
  const [newCardExpYear, setNewCardExpYear] = useState("");
  const [newCardCvc, setNewCardCvc] = useState("");
  const [newCardIsDefault, setNewCardIsDefault] = useState(false);

  // States para Account Information
  const [userName, setUserName] = useState(dummyAccountInfo.name);
  const [userEmail, setUserEmail] = useState(dummyAccountInfo.email);
  const [userPhone, setUserPhone] = useState(dummyAccountInfo.phone);
  const [userAddress, setUserAddress] = useState(dummyAccountInfo.address);
  const [twoFactorAuthEnabled, setTwoFactorAuthEnabled] = useState(
    dummyAccountInfo.twoFactorAuthEnabled,
  );

  // States para Integrations
  const [integrations, setIntegrations] =
    useState<Integration[]>(dummyIntegrations);
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

  const integrationsLoading = false; // Dummy loading state
  const productsLoading = false; // Dummy loading state
  const transactionsLoading = false; // Dummy loading state

  // States para Notifications
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(initialNotificationSettings);

  // --- Funciones Dummy (simulan acciones sin backend) ---
  const handleSaveSettings = () => {
    console.log("Simulating saving settings...");
    // En una app real, aquí se enviarían todos los estados a la API
    console.log({
      userName,
      userEmail,
      userPhone,
      userAddress,
      twoFactorAuthEnabled,
      paymentMethods,
      currentSubscription,
      integrations,
      notificationSettings,
    });
    toast({
      title: isSpanish ? "¡Configuración Guardada!" : "Settings Saved!",
      description: isSpanish
        ? "Tu configuración se ha guardado exitosamente."
        : "Your settings have been saved successfully.",
    });
  };

  const handleAddPaymentMethod = () => {
    console.log("Simulating adding payment method...");
    const newMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      brand: "Visa", // Dummy brand, ideally derived from card number
      last4: newCardNumber.slice(-4),
      expMonth: newCardExpMonth,
      expYear: newCardExpYear,
      isDefault: newCardIsDefault,
    };

    setPaymentMethods((prev) => {
      let updatedMethods = prev;
      if (newCardIsDefault) {
        updatedMethods = prev.map((m) => ({ ...m, isDefault: false }));
        return [newMethod, ...updatedMethods];
      } else {
        return [...updatedMethods, newMethod];
      }
    });

    setIsAddPaymentMethodDialogOpen(false);
    setNewCardNumber("");
    setNewCardExpMonth("");
    setNewCardExpYear("");
    setNewCardCvc("");
    setNewCardIsDefault(false);
    toast({
      title: isSpanish ? "Método de Pago Añadido" : "Payment Method Added",
      description: isSpanish
        ? "El nuevo método de pago se ha añadido."
        : "The new payment method has been added.",
    });
  };

  const handleRemovePaymentMethod = (id: string) => {
    console.log(`Simulating removal of payment method ${id}`);
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    toast({
      title: isSpanish ? "Método de Pago Eliminado" : "Payment Method Removed",
      description: isSpanish
        ? "El método de pago ha sido eliminado."
        : "The payment method has been removed.",
    });
  };

  const handleSetDefaultPaymentMethod = (id: string) => {
    console.log(`Simulating setting default payment method ${id}`);
    setPaymentMethods((prev) =>
      prev.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      })),
    );
    toast({
      title: isSpanish ? "Predeterminado Actualizado" : "Default Updated",
      description: isSpanish
        ? "El método de pago predeterminado ha cambiado."
        : "Default payment method has been changed.",
    });
  };

  const handleChangeSubscriptionPlan = () => {
    console.log("Simulating changing subscription plan...");
    toast({
      title: isSpanish ? "Cambiar Plan" : "Change Plan",
      description: isSpanish
        ? "Funcionalidad para cambiar plan."
        : "Functionality to change plan.",
    });
  };

  const handleCancelSubscription = () => {
    console.log("Simulating canceling subscription...");
    setCurrentSubscription((prev) => ({ ...prev, status: "canceled" }));
    toast({
      title: isSpanish ? "Suscripción Cancelada" : "Subscription Canceled",
      description: isSpanish
        ? "Tu suscripción ha sido cancelada."
        : "Your subscription has been canceled.",
    });
  };

  const handleUpdateAccountInfo = () => {
    console.log("Simulating updating account information...");
    toast({
      title: isSpanish ? "Perfil Actualizado" : "Profile Updated",
      description: isSpanish
        ? "Tu información de perfil ha sido actualizada."
        : "Your profile information has been updated.",
    });
  };

  const handleChangePassword = () => {
    console.log("Simulating changing password...");
    toast({
      title: isSpanish ? "Cambiar Contraseña" : "Change Password",
      description: isSpanish
        ? "Funcionalidad para cambiar contraseña."
        : "Functionality to change password.",
    });
  };

  const handleToggleTwoFactorAuth = () => {
    setTwoFactorAuthEnabled((prev) => !prev);
    console.log("Simulating toggling 2FA...");
    toast({
      title: isSpanish ? "2FA Actualizado" : "2FA Updated",
      description: isSpanish
        ? `Autenticación de dos factores ${twoFactorAuthEnabled ? "desactivada" : "activada"}.`
        : `Two-factor authentication ${twoFactorAuthEnabled ? "disabled" : "enabled"}.`,
    });
  };

  const handleDeleteAccount = () => {
    console.log("Simulating account deletion...");
    toast({
      title: isSpanish ? "Eliminar Cuenta" : "Delete Account",
      description: isSpanish
        ? "Funcionalidad para eliminar cuenta."
        : "Functionality to delete account.",
      variant: "destructive",
    });
    // En una app real, esto requeriría confirmación y lógica de backend
  };

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
        undefined, // Capture storeUrl if present in fields
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

  const handleDeleteIntegration = (id: string) => {
    setIntegrations((prev) => prev.filter((int) => int.id !== id));
    toast({
      title: isSpanish ? "Integración Eliminada" : "Integration Deleted",
      description: isSpanish
        ? "La integración ha sido eliminada."
        : "The integration has been deleted.",
    });
  };

  const handleSyncProducts = (integrationId: string) => {
    console.log(`Simulating product sync for integration ${integrationId}`);
    toast({
      title: isSpanish ? "Sincronización Iniciada" : "Sync Initiated",
      description: isSpanish
        ? "La sincronización de productos ha comenzado."
        : "Product sync has been initiated.",
    });
  };

  const handleNotificationToggle = (
    category: keyof NotificationSettings,
    type: keyof NotificationSettings[keyof NotificationSettings],
    isChecked: boolean,
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: isChecked,
      },
    }));
    toast({
      title: isSpanish ? "Notificación Actualizada" : "Notification Updated",
      description: isSpanish
        ? "Tus preferencias de notificación han sido actualizadas."
        : "Your notification preferences have been updated.",
    });
  };

  // --- Funciones de Formato ---
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredProviders = dialogSelectedCategory
    ? Object.entries(INTEGRATION_PROVIDERS).filter(
        ([, info]) => info.category === dialogSelectedCategory,
      )
    : [];

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

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName={isSpanish ? "Configuración" : "Settings"} />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="container mx-auto px-4 py-8 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {isSpanish ? "Configuración" : "Settings"}
                  </h1>
                  <p className="text-muted-foreground">
                    {isSpanish
                      ? "Gestiona tu cuenta, pagos, integraciones y notificaciones."
                      : "Manage your account, payment information, integrations, and notifications."}
                  </p>
                </div>
              </div>

              <Tabs defaultValue="account-information" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger
                    value="account-information"
                    data-testid="tab-account-information"
                  >
                    <User className="mr-2 h-4 w-4" />
                    {isSpanish ? "Cuenta" : "Account"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment-methods"
                    data-testid="tab-payment-methods"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {isSpanish ? "Pagos" : "Payment Methods"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="integrations"
                    data-testid="tab-integrations"
                  >
                    <Plug className="mr-2 h-4 w-4" />
                    {isSpanish ? "Integraciones" : "Integrations"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    data-testid="tab-notifications"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    {isSpanish ? "Notificaciones" : "Notifications"}
                  </TabsTrigger>
                </TabsList>

                {/* Account Information Tab */}
                <TabsContent value="account-information" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="mr-2 h-5 w-5" />
                        {isSpanish
                          ? "Información de Perfil"
                          : "Profile Information"}
                      </CardTitle>
                      <CardDescription>
                        {isSpanish
                          ? "Actualiza tus datos personales y de contacto."
                          : "Update your personal details and contact information."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="user-name">
                          {isSpanish ? "Nombre" : "Name"}
                        </Label>
                        <Input
                          id="user-name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-email">Email</Label>
                        <Input
                          id="user-email"
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-phone">
                          {isSpanish ? "Número de Teléfono" : "Phone Number"}
                        </Label>
                        <Input
                          id="user-phone"
                          type="tel"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-address">
                          {isSpanish ? "Dirección" : "Address"}
                        </Label>
                        <Input
                          id="user-address"
                          value={userAddress}
                          onChange={(e) => setUserAddress(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <Button onClick={handleUpdateAccountInfo}>
                        {isSpanish ? "Actualizar Perfil" : "Update Profile"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Lock className="mr-2 h-5 w-5" />
                        {isSpanish ? "Seguridad" : "Security"}
                      </CardTitle>
                      <CardDescription>
                        {isSpanish
                          ? "Gestiona la configuración de seguridad de tu cuenta."
                          : "Manage your account security settings."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {isSpanish ? "Contraseña" : "Password"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {isSpanish
                              ? "Cambia tu contraseña regularmente para mantener tu cuenta segura."
                              : "Change your password regularly to keep your account secure."}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleChangePassword}
                        >
                          {isSpanish ? "Cambiar Contraseña" : "Change Password"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {isSpanish
                              ? "Autenticación de Dos Factores"
                              : "Two-Factor Authentication"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {isSpanish
                              ? "Añade una capa extra de seguridad a tu cuenta."
                              : "Add an extra layer of security to your account."}
                          </p>
                        </div>
                        <Button
                          variant={
                            twoFactorAuthEnabled ? "destructive" : "default"
                          }
                          onClick={handleToggleTwoFactorAuth}
                        >
                          {twoFactorAuthEnabled
                            ? isSpanish
                              ? "Desactivar"
                              : "Disable"
                            : isSpanish
                              ? "Activar"
                              : "Enable"}{" "}
                          2FA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <SettingsIcon className="mr-2 h-5 w-5" />
                        {isSpanish ? "Gestión de Cuenta" : "Account Management"}
                      </CardTitle>
                      <CardDescription>
                        {isSpanish
                          ? "Gestiona tu suscripción y acciones de cuenta."
                          : "Manage your subscription and account actions."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {isSpanish ? "Plan Actual" : "Current Plan"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {isSpanish
                              ? `Actualmente estás en el ${dummyAccountInfo.currentPlan}.`
                              : `You are currently on the ${dummyAccountInfo.currentPlan}.`}
                          </p>
                        </div>
                        <Button variant="outline">
                          {isSpanish ? "Ver Planes" : "View Plans"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-red-600">
                            {isSpanish ? "Eliminar Cuenta" : "Delete Account"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {isSpanish
                              ? "Elimina permanentemente tu cuenta y todos los datos asociados."
                              : "Permanently delete your account and all associated data."}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                        >
                          {isSpanish ? "Eliminar Cuenta" : "Delete Account"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Payment Methods Tab */}
                <TabsContent value="payment-methods" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="mr-2 h-5 w-5" />
                        {isSpanish
                          ? "Suscripción Actual"
                          : "Current Subscription"}
                      </CardTitle>
                      <CardDescription>
                        {isSpanish
                          ? "Gestiona tu plan y ciclo de facturación."
                          : "Manage your plan and billing cycle."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">
                          {isSpanish ? "Plan:" : "Plan:"}
                        </p>
                        <Badge variant="default" className="text-sm">
                          {currentSubscription.plan} (
                          {currentSubscription.billingCycle})
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">
                          {isSpanish ? "Precio:" : "Price:"}
                        </p>
                        <p className="text-sm">
                          {currentSubscription.price}/
                          {currentSubscription.billingCycle.replace("ly", "")}
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">
                          {isSpanish
                            ? "Próxima Fecha de Facturación:"
                            : "Next Billing Date:"}
                        </p>
                        <p className="text-sm">
                          {currentSubscription.nextBillingDate}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">
                          {isSpanish ? "Estado:" : "Status:"}
                        </p>
                        <Badge
                          variant={
                            currentSubscription.status === "active"
                              ? "default"
                              : "destructive"
                          }
                          className="text-sm"
                        >
                          {currentSubscription.status.charAt(0).toUpperCase() +
                            currentSubscription.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={handleChangeSubscriptionPlan}
                        >
                          {isSpanish ? "Cambiar Plan" : "Change Plan"}
                        </Button>
                        {currentSubscription.status === "active" && (
                          <Button
                            variant="destructive"
                            onClick={handleCancelSubscription}
                          >
                            {isSpanish
                              ? "Cancelar Suscripción"
                              : "Cancel Subscription"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="flex items-center">
                          <CreditCard className="mr-2 h-5 w-5" />
                          {isSpanish ? "Métodos de Pago" : "Payment Methods"}
                        </CardTitle>
                        <CardDescription>
                          {isSpanish
                            ? "Añade o gestiona tus tarjetas de crédito/débito para los pagos de suscripción."
                            : "Add or manage your credit/debit cards for subscription payments."}
                        </CardDescription>
                      </div>
                      <Dialog
                        open={isAddPaymentMethodDialogOpen}
                        onOpenChange={setIsAddPaymentMethodDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            {isSpanish ? "Añadir Tarjeta" : "Add Card"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>
                              {isSpanish
                                ? "Añadir Nuevo Método de Pago"
                                : "Add New Payment Method"}
                            </DialogTitle>
                            <DialogDescription>
                              {isSpanish
                                ? "Añade una nueva tarjeta de crédito o débito a tu cuenta."
                                : "Add a new credit or debit card to your account."}
                            </DialogDescription>
                          </DialogHeader>
                          {/* Formulario simplificado sin react-hook-form */}
                          <div className="grid gap-4 py-4">
                            <div>
                              <Label htmlFor="card-number">
                                {isSpanish
                                  ? "Número de Tarjeta"
                                  : "Card Number"}
                              </Label>
                              <Input
                                id="card-number"
                                placeholder="**** **** **** 1234"
                                value={newCardNumber}
                                onChange={(e) =>
                                  setNewCardNumber(e.target.value)
                                }
                                maxLength={19}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="card-exp-month">
                                  {isSpanish ? "Mes Exp." : "Exp. Month"}
                                </Label>
                                <Input
                                  id="card-exp-month"
                                  placeholder="MM"
                                  value={newCardExpMonth}
                                  onChange={(e) =>
                                    setNewCardExpMonth(e.target.value)
                                  }
                                  maxLength={2}
                                />
                              </div>
                              <div>
                                <Label htmlFor="card-exp-year">
                                  {isSpanish ? "Año Exp." : "Exp. Year"}
                                </Label>
                                <Input
                                  id="card-exp-year"
                                  placeholder="YY"
                                  value={newCardExpYear}
                                  onChange={(e) =>
                                    setNewCardExpYear(e.target.value)
                                  }
                                  maxLength={2}
                                />
                              </div>
                              <div>
                                <Label htmlFor="card-cvc">CVC</Label>
                                <Input
                                  id="card-cvc"
                                  placeholder="123"
                                  value={newCardCvc}
                                  onChange={(e) =>
                                    setNewCardCvc(e.target.value)
                                  }
                                  maxLength={4}
                                />
                              </div>
                            </div>
                            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <input
                                type="checkbox"
                                checked={newCardIsDefault}
                                onChange={(e) =>
                                  setNewCardIsDefault(e.target.checked)
                                }
                                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                              />
                              <div className="space-y-1 leading-none">
                                <Label>
                                  {isSpanish
                                    ? "Establecer como método de pago predeterminado"
                                    : "Set as default payment method"}
                                </Label>
                              </div>
                            </div>
                            <Button
                              onClick={handleAddPaymentMethod}
                              className="w-full"
                            >
                              {isSpanish ? "Añadir Tarjeta" : "Add Card"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {paymentMethods.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>
                            {isSpanish
                              ? "No se han añadido métodos de pago aún"
                              : "No payment methods added yet"}
                          </p>
                          <p className="text-sm">
                            {isSpanish
                              ? "Añade una tarjeta de crédito o débito para pagar tu suscripción"
                              : "Add a credit or debit card to pay for your subscription"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {paymentMethods.map((method) => (
                            <div
                              key={method.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <CreditCard className="h-6 w-6 text-gray-600" />
                                <div>
                                  <h4 className="font-medium">
                                    {method.brand}{" "}
                                    {isSpanish ? "terminada en" : "ending in"}{" "}
                                    {method.last4}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {isSpanish ? "Expira" : "Expires"}{" "}
                                    {method.expMonth}/{method.expYear}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {method.isDefault ? (
                                  <Badge variant="secondary">
                                    {isSpanish ? "Predeterminado" : "Default"}
                                  </Badge>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleSetDefaultPaymentMethod(method.id)
                                    }
                                  >
                                    {isSpanish
                                      ? "Establecer Predeterminado"
                                      : "Set Default"}
                                  </Button>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleRemovePaymentMethod(method.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Integrations Tab */}
                <TabsContent
                  value="integrations"
                  className="space-y-6"
                  style={{ padding: "2rem" }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {isSpanish
                          ? "Gestión de Integraciones"
                          : "Integration Management"}
                      </h2>
                      <p className="text-muted-foreground">
                        {isSpanish
                          ? "Conecta varias plataformas para centralizar tus datos y automatizar campañas."
                          : "Connect various platforms to centralize your data and automate workflows."}
                      </p>
                    </div>
                    {/* The dialog is now triggered by category-specific buttons */}
                  </div>

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
                        {/* Integration Category Selection (pre-selected if opened from category button) */}
                        <div>
                          <Label htmlFor="category-select">
                            {isSpanish
                              ? "Categoría de Integración"
                              : "Integration Category"}
                          </Label>
                          <Select
                            onValueChange={(value: Integration["category"]) => {
                              setDialogSelectedCategory(value);
                              setDialogSelectedProvider(""); // Reset provider when category changes
                              setNewIntegrationFields({}); // Reset fields too
                            }}
                            value={dialogSelectedCategory}
                            disabled={!!dialogSelectedCategory} // Disable if pre-selected
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
                              {Object.entries(
                                INTEGRATION_CATEGORIES_DISPLAY,
                              ).map(([key, info]) => (
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
                        {dialogSelectedCategory && (
                          <div>
                            <Label htmlFor="provider-select">
                              {isSpanish ? "Proveedor" : "Provider"}
                            </Label>
                            <Select
                              onValueChange={(value) => {
                                setDialogSelectedProvider(value);
                                setNewIntegrationFields({}); // Reset fields when provider changes
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

                        {dialogSelectedProvider && (
                          <>
                            <div>
                              <Label htmlFor="store-name-input">
                                {INTEGRATION_PROVIDERS[dialogSelectedProvider]
                                  ?.category === "social_media"
                                  ? isSpanish
                                    ? "Nombre de la Cuenta"
                                    : "Account Name"
                                  : INTEGRATION_PROVIDERS[
                                        dialogSelectedProvider
                                      ]?.category === "crm"
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
                                    : INTEGRATION_PROVIDERS[
                                          dialogSelectedProvider
                                        ]?.category === "crm"
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

                            {INTEGRATION_PROVIDERS[
                              dialogSelectedProvider
                            ].fields.map((field) => (
                              <div key={field.name}>
                                <Label htmlFor={`${field.name}-input`}>
                                  {field.label}
                                </Label>
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
                              !dialogSelectedProvider ||
                              !newIntegrationStoreName
                            }
                            data-testid="create-integration-button"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {isSpanish
                              ? "Crear Integración"
                              : "Create Integration"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Render Integrations by Category as Accordion */}
                  <Accordion type="multiple" defaultValue={["pos"]}>
                    {" "}
                    {/* 'multiple' allows several open, 'single' only one. DefaultValue opens one on load. */}
                    {Object.entries(INTEGRATION_CATEGORIES_DISPLAY).map(
                      ([categoryKey, categoryInfo]) => (
                        <AccordionItem key={categoryKey} value={categoryKey}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-2 py-2">
                              {" "}
                              {/* Added padding to trigger for better spacing */}
                              <categoryInfo.icon className="h-5 w-5" />
                              <span className="text-lg font-semibold">
                                {categoryInfo.name}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {/* The Card structure is maintained inside AccordionContent for consistent styling */}
                            <Card className="border-none shadow-none">
                              {" "}
                              {/* Remove border/shadow from inner card if AccordionItem already provides it */}
                              <CardHeader className="pt-0">
                                {" "}
                                {/* Adjust padding if needed */}
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
                                        // Usando el estado real de integraciones
                                        (integration) =>
                                          integration.category === categoryKey,
                                      );
                                    return integrationsInCategory.length ===
                                      0 ? (
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
                                        >
                                          <Plus className="mr-2 h-4 w-4" />
                                          {isSpanish
                                            ? `Añadir Integración ${categoryInfo.name}`
                                            : `Add ${categoryInfo.name} Integration`}
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="grid gap-4">
                                        {integrationsInCategory.map(
                                          renderIntegrationCard,
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
                                        >
                                          <Plus className="mr-2 h-4 w-4" />
                                          {isSpanish
                                            ? `Añadir otra Integración ${categoryInfo.name}`
                                            : `Add another ${categoryInfo.name} Integration`}
                                        </Button>
                                      </div>
                                    );
                                  })()
                                )}
                              </CardContent>
                            </Card>
                          </AccordionContent>
                        </AccordionItem>
                      ),
                    )}
                  </Accordion>

                  {/* Leadboost CRM Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Leadboost CRM
                      </CardTitle>
                      <CardDescription>
                        {isSpanish
                          ? "¿No tienes un CRM? Usa el potente CRM de Leadboost para gestionar tus clientes y leads."
                          : "Don't have a CRM? Use Leadboost's powerful CRM to manage your customers and leads."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-6 w-6 text-green-500" />
                        <p className="text-lg font-semibold">
                          {isSpanish
                            ? "Solo $29 USD/mes"
                            : "Only $29 USD/month"}
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          window.open(
                            "https://www.leadboost.com/crm-signup",
                            "_blank",
                          )
                        }
                      >
                        {isSpanish
                          ? "Saber Más y Suscribirse"
                          : "Learn More & Subscribe"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Products and Transactions Grid (still relevant for POS/E-commerce data) */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Products */}
                    {/* <Card>
                      <CardHeader>
                        <CardTitle>
                          {isSpanish
                            ? "Productos Sincronizados"
                            : "Synced Products"}
                        </CardTitle>
                        <CardDescription>
                          {isSpanish
                            ? "Productos importados de tus sistemas POS y E-commerce conectados"
                            : "Products imported from your connected POS and E-commerce systems"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {productsLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : dummyProducts.length === 0 ? ( // Usando dummy data
                          <p className="text-center text-muted-foreground py-4">
                            {isSpanish
                              ? "No hay productos sincronizados aún"
                              : "No products synced yet"}
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {dummyProducts
                              .slice(0, 10)
                              .map((product: Product) => (
                                <div
                                  key={product.id}
                                  className="flex items-center justify-between p-3 border rounded"
                                  data-testid={`product-${product.id}`}
                                >
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">
                                      {product.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      {product.sku} • {product.category}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-sm">
                                      {formatCurrency(
                                        product.price,
                                        product.currency,
                                      )}
                                    </p>
                                    {product.stockQuantity !== null && (
                                      <p className="text-xs text-muted-foreground">
                                        {isSpanish ? "Stock:" : "Stock:"}{" "}
                                        {product.stockQuantity}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>*/}

                    {/* Recent Transactions */}
                    {/*<Card>
                      <CardHeader>
                        <CardTitle>
                          {isSpanish
                            ? "Transacciones Recientes"
                            : "Recent Transactions"}
                        </CardTitle>
                        <CardDescription>
                          {isSpanish
                            ? "Últimas ventas de tus sistemas POS y E-commerce conectados"
                            : "Latest sales from your connected POS and E-commerce systems"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {transactionsLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : dummyTransactions.length === 0 ? ( // Usando dummy data
                          <p className="text-center text-muted-foreground py-4">
                            {isSpanish
                              ? "No hay transacciones sincronizadas aún"
                              : "No transactions synced yet"}
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {dummyTransactions
                              .slice(0, 10)
                              .map((transaction: SalesTransaction) => (
                                <div
                                  key={transaction.id}
                                  className="flex items-center justify-between p-3 border rounded"
                                  data-testid={`transaction-${transaction.id}`}
                                >
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">
                                      {transaction.customerName ||
                                        (isSpanish
                                          ? "Cliente Invitado"
                                          : "Guest Customer")}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      {transaction.paymentMethod} •{" "}
                                      {formatDate(transaction.transactionDate)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-sm">
                                      {formatCurrency(
                                        transaction.totalAmount,
                                        transaction.currency,
                                      )}
                                    </p>
                                    <Badge
                                      variant={
                                        transaction.status === "completed"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {transaction.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>*/}
                  </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bell className="mr-2 h-5 w-5" />
                        {isSpanish
                          ? "Preferencias de Notificación"
                          : "Notification Preferences"}
                      </CardTitle>
                      <CardDescription>
                        {isSpanish
                          ? "Controla cómo y cuándo recibes notificaciones."
                          : "Control how and when you receive notifications."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Email Notifications */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          {isSpanish
                            ? "Notificaciones por Correo Electrónico"
                            : "Email Notifications"}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish ? "Nuevos Mensajes" : "New Messages"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe un correo cuando tengas nuevos mensajes."
                                  : "Receive an email when you have new messages."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.email.newMessage}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "email",
                                  "newMessage",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish
                                  ? "Actividad de la Cuenta"
                                  : "Account Activity"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe notificaciones sobre inicios de sesión y cambios de seguridad."
                                  : "Get alerts for login attempts and security changes."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={
                                notificationSettings.email.accountActivity
                              }
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "email",
                                  "accountActivity",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish
                                  ? "Ofertas Promocionales"
                                  : "Promotional Offers"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe correos sobre nuevas características, productos y ofertas."
                                  : "Receive emails about new features, products, and offers."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.email.promotional}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "email",
                                  "promotional",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SMS Notifications */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          {isSpanish
                            ? "Notificaciones por SMS"
                            : "SMS Notifications"}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish ? "Nuevos Mensajes" : "New Messages"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe un SMS cuando tengas nuevos mensajes."
                                  : "Receive an SMS when you have new messages."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.sms.newMessage}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "sms",
                                  "newMessage",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish
                                  ? "Actividad de la Cuenta"
                                  : "Account Activity"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe alertas por SMS para inicios de sesión y cambios de seguridad."
                                  : "Get SMS alerts for login attempts and security changes."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.sms.accountActivity}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "sms",
                                  "accountActivity",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>

                      {/* In-App Notifications */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          {isSpanish
                            ? "Notificaciones en la Aplicación"
                            : "In-App Notifications"}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish ? "Nuevos Mensajes" : "New Messages"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe notificaciones dentro de la aplicación para nuevos mensajes."
                                  : "Receive in-app notifications for new messages."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.inApp.newMessage}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "inApp",
                                  "newMessage",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish
                                  ? "Ofertas Promocionales"
                                  : "Promotional Offers"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe notificaciones en la aplicación sobre nuevas características y ofertas."
                                  : "Receive in-app notifications about new features and offers."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.inApp.promotional}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "inApp",
                                  "promotional",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Global Save Button - Moved outside TabsContent but inside Tabs */}
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleSaveSettings}
                    className="bg-gradient-to-r from-brand-500 to-purple-600 text-white"
                    data-testid="button-save-settings"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSpanish ? "Guardar Configuración" : "Save Settings"}
                  </Button>
                </div>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
