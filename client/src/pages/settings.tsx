import { useEffect, useState } from "react";
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
import {
  CreditCard,
  Wallet,
  User,
  Settings as SettingsIcon,
  Save,
  Plug, // New icon for Integrations
  Bell, // New icon for Notifications
  Mail, // Example icon for Mailchimp
  Store, // For POS Integrations
  ShoppingBag, // For E-commerce Integrations
  Globe, // For WooCommerce
  Instagram, // For Social Media
  Facebook, // For Social Media
  Youtube, // For Social Media
  LayoutGrid, // For Wix
  Link, // For Custom Website
  BriefcaseBusiness, // For CRM
  Share2, // For TikTok
  Twitter, // Para X (anteriormente Twitter)
  MessageSquareText, // Para Threads (icono genérico)
  Camera,
} from "lucide-react";
import AccountTab from "@/components/settings/AccountTab";
import PaymentMethodTab from "@/components/settings/PaymentMethodsTab";
import HelpChatbot from "@/components/HelpChatbot";
import IntegrationsTab from "@/components/settings/IntegrationsTab";
import { useAuth } from "@/hooks/useAuth";
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

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
  email: {
    name: "Email",
    icon: Mail,
    description: "Connect your email account (Gmail, Outlook, etc.)",
    category: "social_media",
    fields: [
      {
        name: "provider",
        label: "Email Provider",
        type: "select", // 👈 Nuevo: un select dentro del modal
        required: true,
        placeholder: "Choose provider",
        options: [
          { value: "gmail", label: "Gmail" },
          { value: "outlook", label: "Outlook" },
          { value: "yahoo", label: "Yahoo" }, // 👈 puedes agregar más
        ],
      },
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
  x: {
    // Nueva plataforma de redes sociales
    name: "X (Twitter)",
    icon: Twitter,
    description:
      "Connect your X (formerly Twitter) account for posts and engagement.",
    category: "social_media",
    fields: [
      {
        name: "accessToken",
        label: "Access Token",
        type: "password",
        required: true,
      },
      { name: "apiKey", label: "API Key", type: "text", required: true },
      {
        name: "apiSecret",
        label: "API Secret",
        type: "password",
        required: true,
      },
    ],
  },
  threads: {
    // Nueva plataforma de redes sociales
    name: "Threads",
    icon: MessageSquareText, // Usando un icono genérico de lucide-react
    description: "Connect your Threads account to share content.",
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
  snapchat: {
    // Nueva plataforma de redes sociales
    name: "Snapchat",
    icon: Camera, // Usando un icono genérico de lucide-react
    description: "Connect your Snapchat account for campaigns and analytics.",
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
  {
    id: "int_x_1",
    provider: "x",
    category: "social_media",
    storeName: "@MyBrandX",
    isActive: true,
    syncEnabled: true,
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
  const { isSpanish, toggleLanguage } = useLanguage(); // Assuming useLanguage hook is available
  const { toast } = useToast(); // Assuming useToast hook is available
  const { user, isAuthenticated, isLoading } = useAuth();

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

  const handleUpdateAccountInfo = async () => {
    try {
      const [firstName, ...rest] = userName.split(" ");
      const lastName = rest.join(" ");

      const payload = {
        firstName,
        lastName,
        email: userEmail,
        phone: userPhone,
        address: userAddress,
      };

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include", // mantiene la sesión activa
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "✅ Perfil actualizado",
          description: "Tus cambios se guardaron correctamente.",
        });
      } else {
        const err = await res.json();
        toast({
          title: "⚠️ Error al actualizar",
          description: err.message || "No se pudo actualizar tu perfil.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      toast({
        title: "⚠️ Error inesperado",
        description: "Intenta de nuevo más tarde.",
        variant: "destructive",
      });
    }
  };

  async function handleChangePassword() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        toast({
          title: "No autenticado",
          description: "Debes iniciar sesión para cambiar tu contraseña.",
          variant: "destructive",
        });
        return;
      }

      // Verificar proveedor (para evitar el cambio si es Google/Apple/Microsoft)
      const providerId = user.providerData[0]?.providerId;
      if (providerId !== "password") {
        toast({
          title: "Cambio de contraseña no disponible",
          description:
            "Tu cuenta usa un proveedor externo (Google, Apple o Microsoft). Por favor cambia tu contraseña desde ese servicio.",
          variant: "destructive",
        });
        return;
      }

      // ✅ Pedir nueva contraseña
      const newPassword = prompt("Introduce tu nueva contraseña:");
      if (!newPassword) {
        toast({
          title: "Operación cancelada",
          description: "No se cambió la contraseña.",
        });
        return;
      }

      // 🔑 Pedir contraseña actual para reautenticar (seguridad)
      const currentPassword = prompt(
        "Introduce tu contraseña actual para confirmar:",
      );

      if (!currentPassword) {
        toast({
          title: "Operación cancelada",
          description: "Debes ingresar tu contraseña actual para continuar.",
        });
        return;
      }

      // 🔐 Reautenticar
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      // 🚀 Actualizar contraseña
      await updatePassword(user, newPassword);

      // (Opcional) — notificar al backend para actualizar updatedAt
      await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedAt: new Date().toISOString() }),
      });

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente.",
      });
    } catch (error: any) {
      console.error("Error cambiando contraseña:", error);
      let message = "Ocurrió un error inesperado.";

      if (error.code === "auth/wrong-password") {
        message = "La contraseña actual es incorrecta.";
      } else if (error.code === "auth/weak-password") {
        message = "La nueva contraseña es demasiado débil.";
      } else if (error.code === "auth/requires-recent-login") {
        message =
          "Por seguridad, vuelve a iniciar sesión antes de cambiar tu contraseña.";
      }

      toast({
        title: "Error al cambiar contraseña",
        description: message,
        variant: "destructive",
      });
    }
  }

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

  const filteredProviders = dialogSelectedCategory
    ? Object.entries(INTEGRATION_PROVIDERS).filter(
        ([, info]) => info.category === dialogSelectedCategory,
      )
    : [];

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("User data:", user);
      setUserName(`${user.firstName || ""} ${user.lastName || ""}`);
      setUserEmail(user.email || "");
      setUserPhone(user.phone || "");
      setUserAddress(user.address || "");
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (user) {
      setUserName(`${user.firstName || ""} ${user.lastName || ""}`);
      setUserEmail(user.email || "");
      setUserPhone(user.phone || "");
      setUserAddress(user.address || "");
    }
  }, [user]);

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
                  <AccountTab
                    isSpanish={isSpanish}
                    userName={userName}
                    userEmail={userEmail}
                    userPhone={userPhone}
                    userAddress={userAddress}
                    twoFactorAuthEnabled={twoFactorAuthEnabled}
                    setUserName={setUserName}
                    setUserEmail={setUserEmail}
                    setUserPhone={setUserPhone}
                    setUserAddress={setUserAddress}
                    handleUpdateAccountInfo={handleUpdateAccountInfo}
                    handleChangePassword={handleChangePassword}
                    handleToggleTwoFactorAuth={handleToggleTwoFactorAuth}
                    handleDeleteAccount={handleDeleteAccount}
                  />
                </TabsContent>

                {/* Payment Methods Tab */}
                <TabsContent value="payment-methods" className="space-y-6">
                  <PaymentMethodTab
                    isSpanish={isSpanish}
                    paymentMethods={paymentMethods}
                    currentSubscription={currentSubscription}
                    isAddPaymentMethodDialogOpen={isAddPaymentMethodDialogOpen}
                    setIsAddPaymentMethodDialogOpen={
                      setIsAddPaymentMethodDialogOpen
                    }
                    newCardNumber={newCardNumber}
                    setNewCardNumber={setNewCardNumber}
                    newCardExpMonth={newCardExpMonth}
                    setNewCardExpMonth={setNewCardExpMonth}
                    newCardExpYear={newCardExpYear}
                    setNewCardExpYear={setNewCardExpYear}
                    newCardCvc={newCardCvc}
                    setNewCardCvc={setNewCardCvc}
                    newCardIsDefault={newCardIsDefault}
                    setNewCardIsDefault={setNewCardIsDefault}
                    handleAddPaymentMethod={handleAddPaymentMethod}
                    handleRemovePaymentMethod={handleRemovePaymentMethod}
                    handleSetDefaultPaymentMethod={
                      handleSetDefaultPaymentMethod
                    }
                    handleChangeSubscriptionPlan={handleChangeSubscriptionPlan}
                    handleCancelSubscription={handleCancelSubscription}
                  />
                </TabsContent>

                {/* Integrations Tab */}
                <TabsContent
                  value="integrations"
                  className="space-y-6"
                  style={{ padding: "2rem" }}
                >
                  <IntegrationsTab
                    isAddIntegrationDialogOpen={isAddIntegrationDialogOpen}
                    setIsAddIntegrationDialogOpen={
                      setIsAddIntegrationDialogOpen
                    }
                    setDialogSelectedCategory={setDialogSelectedCategory}
                    setDialogSelectedProvider={setDialogSelectedProvider}
                    setNewIntegrationStoreName={setNewIntegrationStoreName}
                    setNewIntegrationFields={setNewIntegrationFields}
                    handleCreateIntegration={handleCreateIntegration}
                    dialogSelectedCategory={dialogSelectedCategory}
                    dialogSelectedProvider={dialogSelectedProvider}
                    filteredProviders={filteredProviders}
                    newIntegrationStoreName={newIntegrationStoreName}
                    newIntegrationFields={newIntegrationFields}
                    integrations={integrations}
                    INTEGRATION_CATEGORIES_DISPLAY={
                      INTEGRATION_CATEGORIES_DISPLAY
                    }
                    INTEGRATION_PROVIDERS={INTEGRATION_PROVIDERS}
                    integrationsLoading={integrationsLoading}
                    handleDeleteIntegration={handleDeleteIntegration}
                    handleSyncProducts={handleSyncProducts}
                  />
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
