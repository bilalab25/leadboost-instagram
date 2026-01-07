import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useBrand } from "@/contexts/BrandContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useGoogleFontLoader } from "@/hooks/useGoogleFontLoader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  UserPlus,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Palette,
  Image,
  Link,
  Upload,
  Trash2,
  Store,
  CreditCard,
  ShoppingBag,
  Globe,
  Info,
  RefreshCw,
  Instagram,
  Facebook,
  Youtube,
  LayoutGrid,
  ZoomIn,
  DollarSign,
  BriefcaseBusiness,
  Share2,
  Plus,
  Type,
  FileText,
  Download,
  Loader2,
  MessageCircle,
  Calendar,
  X,
  MicOff,
  Mic,
} from "lucide-react";
import {
  SiFacebook,
  SiWhatsapp,
  SiTiktok,
  SiLinkedin,
  SiYoutube,
  SiPinterest,
  SiX,
} from "react-icons/si";

import minimal from "./brand-images/minimalist.png";
import luxury from "./brand-images/luxury.png";
import fun from "./brand-images/fun.png";
import corporate from "./brand-images/corporate.png";
import creative from "./brand-images/creative.png";
import bold from "./brand-images/bold.png";

import ColorPreviewWithPicker from "@/components/brand-studio/ColorPreviewWithPicker";
import FontSelector from "@/components/brand-studio/FontSelector";

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface BrandAsset {
  id: string;
  url: string;
  name: string;
  category: string;
  assetType: "image" | "video" | "document";
  publicId: string;
  description?: string;
}

interface BrandDesign {
  id: string;
  brandStyle: string | null;
  colorPalette: {
    primary: string;
    accent1: string;
    accent2: string;
    text1: string;
    text2: string;
    [key: string]: string;
  };
  typography: {
    primary: string;
    secondary: string;
    customFonts?: { name: string; url: string }[];
  };
  colorPrimary?: string;
  colorAccent1?: string;
  colorAccent2?: string;
  colorAccent3?: string;
  colorAccent4?: string;
  colorText1?: string;
  colorText2?: string;
  colorText3?: string;
  colorText4?: string;
  fontPrimary?: string;
  fontSecondary?: string;
  logoUrl: string | null;
  whiteLogoUrl?: string | null;
  blackLogoUrl?: string | null;
  whiteFaviconUrl?: string | null;
  blackFaviconUrl?: string | null;
  isDesignStudioEnabled: boolean;
  brandKit: {
    assets: BrandAsset[];
  };
}

// =====================================================
// CONSTANTS
// =====================================================

const styleImages: Record<string, string> = {
  minimalist: minimal,
  luxury: luxury,
  fun: fun,
  corporate: corporate,
  creative: creative,
  bold: bold,
};

const brandStyles = [
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean, simple, modern",
    color: "bg-gray-100",
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Elegant, premium, sophisticated",
    color: "bg-amber-100",
  },
  {
    id: "fun",
    name: "Fun & Playful",
    description: "Vibrant, energetic, creative",
    color: "bg-pink-100",
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Professional, trustworthy",
    color: "bg-blue-100",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Artistic, unique, bold",
    color: "bg-purple-100",
  },
  {
    id: "bold",
    name: "Bold & Edgy",
    description: "Strong, impactful, modern",
    color: "bg-red-100",
  },
];

const assetCategories = [
  { value: "product_images", label: "Product Images" },
  { value: "location_images", label: "Location Images" },
  { value: "inspiration_templates", label: "Inspiration Templates" },
];

// Integration providers (from integrations.tsx)
const INTEGRATION_PROVIDERS = {
  square: {
    name: "Square",
    icon: CreditCard,
    description: "Point of sale and payment processing",
    category: "pos",
  },
  stripe: {
    name: "Stripe",
    icon: CreditCard,
    description: "Online payment processing",
    category: "pos",
  },
  shopify: {
    name: "Shopify",
    icon: ShoppingBag,
    description: "E-commerce platform",
    category: "ecommerce",
  },
  woocommerce: {
    name: "WooCommerce",
    icon: Globe,
    description: "WordPress e-commerce plugin",
    category: "ecommerce",
  },
  wix: {
    name: "Wix",
    icon: LayoutGrid,
    description: "Website builder and e-commerce platform",
    category: "ecommerce",
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    description: "Connect your Instagram account for messaging and content",
    category: "social_media",
    isOAuthSupported: true,
  },
  facebook: {
    name: "Facebook",
    icon: Facebook,
    description: "Connect your Facebook Page for posts and insights",
    category: "social_media",
    isOAuthSupported: true,
  },
  whatsapp: {
    name: "WhatsApp",
    icon: MessageCircle,
    description: "Connect your WhatsApp for messaging",
    category: "social_media",
    isOAuthSupported: true,
  },
  tiktok: {
    name: "TikTok",
    icon: Share2,
    description: "Connect your TikTok account for content scheduling",
    category: "social_media",
    isOAuthSupported: false,
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    description: "Connect your YouTube channel for video management",
    category: "social_media",
    isOAuthSupported: false,
  },
  hubspot: {
    name: "HubSpot",
    icon: BriefcaseBusiness,
    description: "Connect your HubSpot CRM to manage leads and customers",
    category: "crm",
  },
};

const INTEGRATION_CATEGORIES = {
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
    description: "Integrate your website or online store.",
  },
  crm: {
    name: "CRM Systems",
    icon: BriefcaseBusiness,
    description: "Link your CRM to centralize customer data.",
  },
};

// =====================================================
// SCHEMAS
// =====================================================

// Removed brandColor from the schema as per requirements
const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  industry: z.string().min(1, "Industry is required"),
  description: z.string().min(1, "Description is required"),
  preferredLanguage: z.string().default("en"),
  domain: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional()
    .nullable(),
});

const joinBrandSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

type CreateBrandForm = z.infer<typeof createBrandSchema>;
type JoinBrandForm = z.infer<typeof joinBrandSchema>;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getAssetType = (fileName: string): BrandAsset["assetType"] => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return "document";
  if (["jpeg", "jpg", "png", "gif", "svg", "webp"].includes(ext))
    return "image";
  if (["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) return "video";
  return "document";
};

// =====================================================
// STEP INDICATOR COMPONENT
// =====================================================

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const steps = [
    { number: 1, label: "Create Brand" },
    { number: 2, label: "Brand Design" },
    { number: 3, label: "Brand Assets" },
    { number: 4, label: "Integrations" },
    { number: 5, label: "Posting Schedule" },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.slice(0, totalSteps).map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                currentStep > step.number
                  ? "bg-green-500 text-white"
                  : currentStep === step.number
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {currentStep > step.number ? (
                <Check className="w-5 h-5" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-xs mt-1 hidden sm:block ${currentStep === step.number ? "text-indigo-600 font-medium" : "text-gray-500"}`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.slice(0, totalSteps).length - 1 && (
            <div
              className={`w-12 sm:w-20 h-1 mx-2 ${currentStep > step.number ? "bg-green-500" : "bg-gray-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// =====================================================
// MAIN ONBOARDING COMPONENT
// =====================================================

const ONBOARDING_STATE_KEY = "leadboost_onboarding_state";

interface OnboardingState {
  mode: "choose" | "create" | "join";
  currentStep: number;
  createdBrandId: string | number | null;
}

function saveOnboardingState(state: OnboardingState) {
  sessionStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(state));
}

function loadOnboardingState(): OnboardingState | null {
  const saved = sessionStorage.getItem(ONBOARDING_STATE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

function clearOnboardingState() {
  sessionStorage.removeItem(ONBOARDING_STATE_KEY);
}

export default function Onboarding() {
  const savedState = loadOnboardingState();
  const [mode, setMode] = useState<"choose" | "create" | "join">(
    savedState?.mode || "choose",
  );
  const [currentStep, setCurrentStep] = useState(savedState?.currentStep || 1);
  const [createdBrandId, setCreatedBrandId] = useState<string | number | null>(
    savedState?.createdBrandId || null,
  );
  const [isGeneratingEssence, setIsGeneratingEssence] = useState(false);
  const [hasLoadedFromDb, setHasLoadedFromDb] = useState(false);
  const [isOtherIndustry, setIsOtherIndustry] = useState(false);
  const [customIndustry, setCustomIndustry] = useState("");

  const INDUSTRY_OPTIONS = [
    { value: "technology", labelEn: "Technology", labelEs: "Tecnología" },
    { value: "retail", labelEn: "Retail", labelEs: "Retail" },
    { value: "healthcare", labelEn: "Healthcare", labelEs: "Salud" },
    {
      value: "finance",
      labelEn: "Finance & Banking",
      labelEs: "Finanzas y Banca",
    },
    { value: "education", labelEn: "Education", labelEs: "Educación" },
    {
      value: "hospitality",
      labelEn: "Hospitality & Tourism",
      labelEs: "Hotelería y Turismo",
    },
    {
      value: "food",
      labelEn: "Food & Beverage",
      labelEs: "Alimentos y Bebidas",
    },
    {
      value: "beauty",
      labelEn: "Beauty & Cosmetics",
      labelEs: "Belleza y Cosméticos",
    },
    { value: "fashion", labelEn: "Fashion & Apparel", labelEs: "Moda y Ropa" },
    { value: "automotive", labelEn: "Automotive", labelEs: "Automotriz" },
    { value: "realestate", labelEn: "Real Estate", labelEs: "Bienes Raíces" },
    {
      value: "sports",
      labelEn: "Sports & Fitness",
      labelEs: "Deportes y Fitness",
    },
    {
      value: "entertainment",
      labelEn: "Entertainment & Media",
      labelEs: "Entretenimiento y Medios",
    },
    {
      value: "professional",
      labelEn: "Professional Services",
      labelEs: "Servicios Profesionales",
    },
    {
      value: "nonprofit",
      labelEn: "Nonprofit & NGO",
      labelEs: "Sin Fines de Lucro / ONG",
    },
    { value: "other", labelEn: "Other", labelEs: "Otro" },
  ];
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isSpanish } = useLanguage();
  const { refreshBrands, brands, setActiveBrandId, activeBrandId } = useBrand();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClientInstance = useQueryClient();

  // Fetch onboarding progress from database
  const { data: onboardingProgress, isLoading: isLoadingProgress } = useQuery<{
    hasIncompleteBrand: boolean;
    brand: any | null;
    onboardingStep: number | null;
    onboardingCompleted: boolean;
  }>({
    queryKey: ["/api/onboarding/progress"],
    enabled: isAuthenticated,
  });

  // Mutation to update onboarding step in DB
  const updateOnboardingStepMutation = useMutation({
    mutationFn: async ({
      brandId,
      step,
      completed,
    }: {
      brandId: string;
      step?: number;
      completed?: boolean;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/brands/${brandId}/onboarding`,
        {
          onboardingStep: step,
          onboardingCompleted: completed,
        },
      );
      if (!res.ok) throw new Error("Failed to update onboarding step");
      return res.json();
    },
  });

  // Initialize state from DB when data loads (only once)
  useEffect(() => {
    if (!hasLoadedFromDb && onboardingProgress && !isLoadingProgress) {
      const urlParams = new URLSearchParams(window.location.search);
      const stepFromUrl = urlParams.get("step");

      // If returning from OAuth with step param, use that
      if (stepFromUrl) {
        setCurrentStep(parseInt(stepFromUrl, 10));
        setMode("create");
        if (onboardingProgress.brand) {
          setCreatedBrandId(onboardingProgress.brand.id);
        }
        setHasLoadedFromDb(true);
        return;
      }

      if (onboardingProgress.hasIncompleteBrand && onboardingProgress.brand) {
        // Resume incomplete onboarding from DB
        console.log(
          "Resuming onboarding from step:",
          onboardingProgress.onboardingStep,
        );
        setCreatedBrandId(onboardingProgress.brand.id);
        setCurrentStep(onboardingProgress.onboardingStep || 1);
        setMode("create");
        // Sync sessionStorage with DB
        saveOnboardingState({
          mode: "create",
          currentStep: onboardingProgress.onboardingStep || 1,
          createdBrandId: onboardingProgress.brand.id,
        });
      } else if (onboardingProgress.onboardingCompleted) {
        // User already completed onboarding, redirect to dashboard
        console.log("Onboarding already completed, redirecting to dashboard");
        setLocation("/dashboard");
        return;
      } else {
        // No brand exists - clear any stale sessionStorage and start fresh
        console.log("No incomplete brand found, starting fresh");
        clearOnboardingState();
        setCreatedBrandId(null);
        setCurrentStep(1);
        setMode("choose");
      }
      setHasLoadedFromDb(true);
    }
  }, [onboardingProgress, isLoadingProgress, hasLoadedFromDb, setLocation]);

  // Validate saved state - clear if brand no longer exists
  useEffect(() => {
    if (createdBrandId && brands.length > 0 && hasLoadedFromDb) {
      const brandExists = brands.some(
        (b: any) => String(b.id) === String(createdBrandId),
      );
      if (!brandExists) {
        // Brand was deleted or user lost access - reset to step 1
        console.log("Saved brand not found, clearing onboarding state");
        clearOnboardingState();
        setCreatedBrandId(null);
        setCurrentStep(1);
        setMode("choose");
      }
    }
  }, [createdBrandId, brands, hasLoadedFromDb]);

  useEffect(() => {
    if (mode === "create" && createdBrandId) {
      saveOnboardingState({ mode, currentStep, createdBrandId });
    }
  }, [mode, currentStep, createdBrandId]);

  // Handle OAuth return - check for connected query param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get("connected");
    const step = urlParams.get("step");
    const error = urlParams.get("error");
    const provider = urlParams.get("provider");

    if (step) {
      setCurrentStep(parseInt(step, 10));
      setMode("create");
    }

    if (connected) {
      // Integration was connected successfully
      toast({
        title: isSpanish ? "¡Conectado!" : "Connected!",
        description: isSpanish
          ? `${connected} conectado exitosamente`
          : `${connected} connected successfully`,
      });
      // Refresh integrations list
      refetchIntegrations();
      // Clean URL
      window.history.replaceState({}, "", "/onboarding");
    }

    if (error) {
      const message = urlParams.get("message");
      let errorDescription = "";

      if (error === "duplicate") {
        // Account already connected to another brand
        errorDescription = message
          ? decodeURIComponent(message)
          : isSpanish
            ? "Esta cuenta ya está conectada a otra marca en la plataforma. Por favor usa una cuenta diferente o desconéctala primero de la otra marca."
            : "This account is already connected to another brand in the platform. Please use a different account or disconnect it first from the other brand.";
      } else {
        errorDescription = isSpanish
          ? `No se pudo conectar ${provider || "la integración"}: ${message || error}`
          : `Failed to connect ${provider || "integration"}: ${message || error}`;
      }

      toast({
        title: isSpanish ? "Error de conexión" : "Connection Error",
        description: errorDescription,
        variant: "destructive",
      });
      // Clean URL
      window.history.replaceState({}, "", "/onboarding");
    }
  }, []);

  // Brand Design State (from brand-studio.tsx)
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [mainColor, setMainColor] = useState<string>("#2563eb");
  const [accentColor1, setAccentColor1] = useState<string>("#60a5fa");
  const [accentColor2, setAccentColor2] = useState<string>("#1e40af");
  const [text1Color, setText1Color] = useState<string>("#333333");
  const [text2Color, setText2Color] = useState<string>("#666666");
  const [accentColor3, setAccentColor3] = useState<string | null>(null);
  const [accentColor4, setAccentColor4] = useState<string | null>(null);
  const [text3Color, setText3Color] = useState<string | null>(null);
  const [text4Color, setText4Color] = useState<string | null>(null);
  const [showAccentColor3, setShowAccentColor3] = useState(false);
  const [showAccentColor4, setShowAccentColor4] = useState(false);
  const [showText3Color, setShowText3Color] = useState(false);
  const [showText4Color, setShowText4Color] = useState(false);
  const [primaryFont, setPrimaryFont] = useState<string>("Roboto");
  const [secondaryFont, setSecondaryFont] = useState<string>("Open Sans");
  const [customFontFiles, setCustomFontFiles] = useState<
    { name: string; url: string; family: string }[]
  >([]);
  const [customFontOptions, setCustomFontOptions] = useState<string[]>([]);

  // Logo states
  const [whiteLogoFile, setWhiteLogoFile] = useState<File | null>(null);
  const [whiteLogoPreviewUrl, setWhiteLogoPreviewUrl] = useState<string | null>(
    null,
  );
  const [blackLogoFile, setBlackLogoFile] = useState<File | null>(null);
  const [blackLogoPreviewUrl, setBlackLogoPreviewUrl] = useState<string | null>(
    null,
  );
  const [whiteFaviconFile, setWhiteFaviconFile] = useState<File | null>(null);
  const [whiteFaviconPreviewUrl, setWhiteFaviconPreviewUrl] = useState<
    string | null
  >(null);
  const [blackFaviconFile, setBlackFaviconFile] = useState<File | null>(null);
  const [blackFaviconPreviewUrl, setBlackFaviconPreviewUrl] = useState<
    string | null
  >(null);

  // Asset states
  type UploadItem = { id: string; name: string; percent: number };
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [currentAssetUploadCategory, setCurrentAssetUploadCategory] =
    useState<string>(assetCategories[0].value);
  const [deletingAssets, setDeletingAssets] = useState<Set<string>>(new Set());

  // Integration state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null,
  );
  const [disconnectingIds, setDisconnectingIds] = useState<Set<string>>(
    new Set(),
  );

  // WhatsApp Baileys state
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [baileysQrCode, setBaileysQrCode] = useState<string | null>(null);
  const [baileysStatus, setBaileysStatus] = useState<
    "disconnected" | "connecting" | "qr_ready" | "connected" | "error"
  >("disconnected");
  const [baileysPhone, setBaileysPhone] = useState<string | null>(null);
  const [isBaileysConnecting, setIsBaileysConnecting] = useState(false);
  const [baileysPollingInterval, setBaileysPollingInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [disconnectingBaileys, setDisconnectingBaileys] = useState(false);

  // Instagram and WhatsApp method selection modals
  const [isInstagramMethodDialogOpen, setIsInstagramMethodDialogOpen] =
    useState(false);
  const [isWhatsAppMethodDialogOpen, setIsWhatsAppMethodDialogOpen] =
    useState(false);

  // Step 5: Posting Frequency state
  interface PlatformSchedule {
    platform: string;
    postsPerWeek: number;
    selectedDays: string[];
  }
  const [postingSchedules, setPostingSchedules] = useState<PlatformSchedule[]>(
    [],
  );
  const [isEditingFrequency, setIsEditingFrequency] = useState(false);
  const [isSavingFrequency, setIsSavingFrequency] = useState(false);

  useGoogleFontLoader([primaryFont, secondaryFont]);

  // Query brand design data after brand is created
  const { data: brandDesign, isLoading: isDesignLoading } =
    useQuery<BrandDesign>({
      queryKey: ["/api/brand-design", createdBrandId],
      enabled: !!createdBrandId && currentStep >= 2,
      retry: false,
      queryFn: async () => {
        const res = await fetch(`/api/brand-design?brandId=${createdBrandId}`);
        if (!res.ok) throw new Error("Failed to fetch brand design");
        return res.json();
      },
    });

  // Query assets
  const { data: assets = [], isLoading: isAssetsLoading } = useQuery<
    BrandAsset[]
  >({
    queryKey: ["/api/brand-assets", createdBrandId, brandDesign?.id],
    enabled: !!createdBrandId && !!brandDesign?.id && currentStep >= 3,
    queryFn: async () => {
      const url = `/api/brand-assets?brandId=${createdBrandId}&brandDesignId=${brandDesign!.id}`;
      const res = await apiRequest("GET", url);
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${text}`);
      return JSON.parse(text);
    },
    retry: false,
  });

  // Query integrations for the brand
  interface Integration {
    id: string;
    provider: string;
    category: "pos" | "ecommerce" | "social_media" | "crm";
    storeName: string;
    accountName?: string;
    storeUrl?: string;
    isActive: boolean;
    syncEnabled: boolean;
    lastSyncAt?: string;
    settings?: any;
    createdAt: string;
  }

  // Use createdBrandId if available, otherwise fallback to activeBrandId
  const effectiveBrandId = createdBrandId || activeBrandId;

  const {
    data: integrations = [],
    isLoading: isIntegrationsLoading,
    refetch: refetchIntegrations,
  } = useQuery<Integration[]>({
    queryKey: ["/api/integrations", effectiveBrandId],
    enabled: !!effectiveBrandId && currentStep >= 4,
    queryFn: async () => {
      const res = await fetch(`/api/integrations?brandId=${effectiveBrandId}`);
      if (!res.ok) return [];
      return res.json();
    },
    retry: false,
  });

  // Helper function to check if provider is connected (handles consolidated providers)
  const isProviderConnected = (providerKey: string) => {
    if (providerKey === "whatsapp") {
      return integrations.some(
        (i) =>
          (i.provider === "whatsapp" || i.provider === "whatsapp_baileys") &&
          i.isActive,
      );
    }
    if (providerKey === "instagram") {
      return integrations.some(
        (i) =>
          (i.provider === "instagram" || i.provider === "instagram_direct") &&
          i.isActive,
      );
    }
    return integrations.some((i) => i.provider === providerKey && i.isActive);
  };

  const getConnectedIntegration = (providerKey: string) => {
    if (providerKey === "whatsapp") {
      return integrations.find(
        (i) =>
          (i.provider === "whatsapp" || i.provider === "whatsapp_baileys") &&
          i.isActive,
      );
    }
    if (providerKey === "instagram") {
      return integrations.find(
        (i) =>
          (i.provider === "instagram" || i.provider === "instagram_direct") &&
          i.isActive,
      );
    }
    return integrations.find((i) => i.provider === providerKey && i.isActive);
  };

  // Instagram mutual exclusivity - check specific providers
  const hasInstagramViaFacebook = integrations.some(
    (i) => i.provider === "instagram" && i.isActive,
  );
  const hasInstagramDirect = integrations.some(
    (i) => i.provider === "instagram_direct" && i.isActive,
  );
  const hasAnyInstagram = hasInstagramViaFacebook || hasInstagramDirect;

  // WhatsApp mutual exclusivity
  const hasWhatsAppBusiness = integrations.some(
    (i) => i.provider === "whatsapp" && i.isActive,
  );
  const hasWhatsAppBaileys = integrations.some(
    (i) => i.provider === "whatsapp_baileys" && i.isActive,
  );
  const hasAnyWhatsApp = hasWhatsAppBusiness || hasWhatsAppBaileys;

  // Check if any social media platforms are connected (for Step 5)
  const hasFacebook = isProviderConnected("facebook");
  const connectedSocialPlatforms = integrations.filter(
    (i) =>
      [
        "facebook",
        "instagram",
        "instagram_direct",
        "whatsapp",
        "whatsapp_baileys",
        "tiktok",
        "youtube",
      ].includes(i.provider) && i.isActive,
  );
  const hasSocialConnections = connectedSocialPlatforms.length > 0;

  // Dynamic total steps - 5 if social connected, 4 if not
  const totalSteps = hasSocialConnections ? 5 : 4;

  const isProviderDisabledByConflict = (providerKey: string): boolean => {
    // No conflicts for consolidated providers - handled in modal selection
    return false;
  };

  // WhatsApp Baileys handlers
  const handleBaileysConnect = async () => {
    if (!effectiveBrandId) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "Selecciona una marca primero"
          : "Select a brand first",
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
        body: JSON.stringify({ brandId: effectiveBrandId }),
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
          description: isSpanish
            ? "Tu WhatsApp ya está conectado"
            : "Your WhatsApp is already connected",
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
        description:
          error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setIsBaileysConnecting(false);
    }
  };

  const startBaileysPolling = () => {
    if (baileysPollingInterval) {
      clearInterval(baileysPollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/whatsapp-baileys/status?brandId=${effectiveBrandId}`,
        );
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
              ? "WhatsApp conectado exitosamente"
              : "WhatsApp connected successfully",
          });
          refetchIntegrations();
          setIsWhatsAppDialogOpen(false);
        } else if (data.qrCode && data.qrCode !== baileysQrCode) {
          setBaileysQrCode(data.qrCode);
          setBaileysStatus("qr_ready");
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);

    setBaileysPollingInterval(interval);

    // Timeout after 2 minutes
    setTimeout(() => {
      if (baileysPollingInterval) {
        clearInterval(baileysPollingInterval);
        setBaileysPollingInterval(null);
        if (baileysStatus !== "connected") {
          setBaileysStatus("disconnected");
          toast({
            title: isSpanish ? "Tiempo agotado" : "Timeout",
            description: isSpanish
              ? "La conexión tardó demasiado"
              : "Connection timed out",
            variant: "destructive",
          });
        }
      }
    }, 120000);
  };

  const handleBaileysDisconnect = async () => {
    setDisconnectingBaileys(true);
    try {
      const res = await fetch("/api/whatsapp-baileys/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: effectiveBrandId }),
      });

      const data = await res.json();

      if (data.success) {
        setBaileysStatus("disconnected");
        setBaileysQrCode(null);
        setBaileysPhone(null);
        refetchIntegrations();

        toast({
          title: isSpanish ? "Desconectado" : "Disconnected",
          description: isSpanish
            ? "WhatsApp ha sido desconectado"
            : "WhatsApp has been disconnected",
        });
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    } finally {
      setDisconnectingBaileys(false);
    }
  };

  // Handle connecting integrations (OAuth flow)
  const handleConnect = (provider: string) => {
    if (!effectiveBrandId) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish ? "No se encontró la marca" : "Brand not found",
        variant: "destructive",
      });
      return;
    }

    // Open method selection dialogs for platforms with multiple options
    if (provider === "instagram" || provider === "instagram_direct") {
      setIsInstagramMethodDialogOpen(true);
      return;
    }

    if (provider === "whatsapp" || provider === "whatsapp_baileys") {
      setIsWhatsAppMethodDialogOpen(true);
      return;
    }

    setConnectingProvider(provider);
    let url = "";

    if (["facebook", "threads"].includes(provider)) {
      url = `/api/integrations/facebook/connect?brandId=${effectiveBrandId}&origin=onboarding`;
    } else {
      toast({
        title: isSpanish ? "Próximamente" : "Coming Soon",
        description: isSpanish
          ? `La conexión para ${provider} aún no está disponible.`
          : `Connection for ${provider} is not available yet.`,
      });
      setConnectingProvider(null);
      return;
    }

    // Navigate in same window instead of opening new tab
    window.location.href = url;
  };

  // Direct connection handlers for specific methods
  const handleInstagramConnect = (method: "facebook" | "direct") => {
    setIsInstagramMethodDialogOpen(false);
    setConnectingProvider(
      method === "facebook" ? "instagram" : "instagram_direct",
    );
    const url =
      method === "facebook"
        ? `/api/integrations/facebook/connect?brandId=${effectiveBrandId}&origin=onboarding`
        : `/api/integrations/instagram/connect?brandId=${effectiveBrandId}&origin=onboarding`;
    window.location.href = url;
  };

  const handleWhatsAppConnect = (method: "business" | "baileys") => {
    if (method === "business") {
      setIsWhatsAppMethodDialogOpen(false);
      setConnectingProvider("whatsapp");
      const url = `/api/integrations/whatsapp/connect?brandId=${effectiveBrandId}&origin=onboarding`;
      window.location.href = url;
    } else {
      setIsWhatsAppMethodDialogOpen(false);
      setIsWhatsAppDialogOpen(true);
    }
  };

  // Handle disconnecting integrations
  const handleDisconnect = async (integrationId: string) => {
    setDisconnectingIds((prev) => new Set(prev).add(integrationId));

    try {
      const res = await fetch(
        `/api/integrations/${integrationId}?brandId=${effectiveBrandId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (!res.ok) {
        throw new Error("Failed to disconnect");
      }
      toast({
        title: isSpanish ? "Desconectado" : "Disconnected",
        description: isSpanish
          ? "La integración ha sido desconectada"
          : "Integration has been disconnected",
      });
      refetchIntegrations();
    } catch (error) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "No se pudo desconectar la integración"
          : "Failed to disconnect integration",
        variant: "destructive",
      });
    } finally {
      setDisconnectingIds((prev) => {
        const updated = new Set(prev);
        updated.delete(integrationId);
        return updated;
      });
    }
  };

  // Initialize design state from fetched data
  useEffect(() => {
    if (brandDesign) {
      if (brandDesign.colorPalette || brandDesign.colorPrimary) {
        setMainColor(
          brandDesign.colorPalette?.primary ||
            brandDesign.colorPrimary ||
            "#2563eb",
        );
        setAccentColor1(
          brandDesign.colorPalette?.accent1 ||
            brandDesign.colorAccent1 ||
            "#60a5fa",
        );
        setAccentColor2(
          brandDesign.colorPalette?.accent2 ||
            brandDesign.colorAccent2 ||
            "#1e40af",
        );
        setText1Color(
          brandDesign.colorPalette?.text1 ||
            brandDesign.colorText1 ||
            "#333333",
        );
        setText2Color(
          brandDesign.colorPalette?.text2 ||
            brandDesign.colorText2 ||
            "#666666",
        );
      }
      if (brandDesign.typography || brandDesign.fontPrimary) {
        setPrimaryFont(
          brandDesign.typography?.primary ||
            brandDesign.fontPrimary ||
            "Roboto",
        );
        setSecondaryFont(
          brandDesign.typography?.secondary ||
            brandDesign.fontSecondary ||
            "Open Sans",
        );
      }
      if (brandDesign.brandStyle) {
        setSelectedStyle(brandDesign.brandStyle);
      }
      setWhiteLogoPreviewUrl(brandDesign.whiteLogoUrl || null);
      setBlackLogoPreviewUrl(brandDesign.blackLogoUrl || null);
      setWhiteFaviconPreviewUrl(brandDesign.whiteFaviconUrl || null);
      setBlackFaviconPreviewUrl(brandDesign.blackFaviconUrl || null);
    }
  }, [brandDesign]);

  useEffect(() => {
    if (brands.length > 0 && mode === "choose") {
      setLocation("/dashboard");
    }
  }, [brands, setLocation, mode]);

  // Forms
  const createForm = useForm<CreateBrandForm>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: "",
      industry: "",
      description: "",
      preferredLanguage: "en",
      domain: "",
    },
  });

  const joinForm = useForm<JoinBrandForm>({
    resolver: zodResolver(joinBrandSchema),
    defaultValues: {
      inviteCode: "",
    },
  });
  // Populate form with existing brand data when going back to step 1
  useEffect(() => {
    if (createdBrandId && currentStep === 1 && brands.length > 0) {
      const existingBrand = brands.find((b: any) => b.id === createdBrandId);

      if (existingBrand) {
        const industryValue = existingBrand.industry || "";
        const domainValue = existingBrand.domain || "";

        // Verificar si la industria guardada es una opción estándar
        const isStandardIndustry = INDUSTRY_OPTIONS.some(
          (option) => option.value === industryValue,
        );

        if (!isStandardIndustry && industryValue) {
          // La industria es un valor personalizado
          setIsOtherIndustry(true);
          setCustomIndustry(industryValue);

          // Establecer el campo 'industry' del formulario a "other" para que el <Select> se muestre como "Otro"
          // y el campo de input personalizado esté visible.
          createForm.reset({
            name: existingBrand.name || "",
            industry: "other",
            description: existingBrand.description || "",
            preferredLanguage: brandDesign?.preferredLanguage || "en",
            domain: domainValue,
          });
        } else {
          // La industria es estándar (o vacía/null)
          setIsOtherIndustry(false);
          setCustomIndustry("");
          createForm.reset({
            name: existingBrand.name || "",
            industry: industryValue,
            description: existingBrand.description || "",
            preferredLanguage: brandDesign?.preferredLanguage || "en",
            domain: domainValue,
          });
        }
      }
    }
  }, [createdBrandId, currentStep, brands, brandDesign]);

  // Mutations
  const createBrandMutation = useMutation({
    mutationFn: async (data: CreateBrandForm) => {
      const res = await apiRequest("POST", "/api/brands/create", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: isSpanish ? "¡Marca creada!" : "Brand created!",
        description: isSpanish
          ? "Tu marca ha sido creada exitosamente."
          : "Your brand has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
      refreshBrands();

      // Set the created brand ID and advance to step 2
      if (data.brand?.id) {
        setCreatedBrandId(data.brand.id);
        setActiveBrandId(data.brand.id);
        setCurrentStep(2);

        // Save step 2 to database
        updateOnboardingStepMutation.mutate({
          brandId: String(data.brand.id),
          step: 2,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: isSpanish ? "Error" : "Error",
        description:
          error.message ||
          (isSpanish ? "No se pudo crear la marca" : "Failed to create brand"),
        variant: "destructive",
      });
    },
  });

  // Update existing brand mutation (when user goes back to step 1)
  const updateBrandMutation = useMutation({
    mutationFn: async (
      data: CreateBrandForm & { brandId: string | number },
    ) => {
      const { brandId, ...updateData } = data;
      const res = await apiRequest("PUT", `/api/brands/${brandId}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: isSpanish ? "¡Marca actualizada!" : "Brand updated!",
        description: isSpanish
          ? "Tu marca ha sido actualizada."
          : "Your brand has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-memberships"] });
      refreshBrands();
      setCurrentStep(2);
    },
    onError: (error: any) => {
      toast({
        title: isSpanish ? "Error" : "Error",
        description:
          error.message ||
          (isSpanish
            ? "No se pudo actualizar la marca"
            : "Failed to update brand"),
        variant: "destructive",
      });
    },
  });

  const joinBrandMutation = useMutation({
    mutationFn: async (data: JoinBrandForm) => {
      const res = await apiRequest(
        "POST",
        "/api/brand-invitations/accept",
        data,
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: isSpanish ? "¡Te uniste!" : "Joined brand!",
        description: isSpanish
          ? "Te has unido exitosamente a la marca."
          : "You've successfully joined the brand.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-memberships"] });
      refreshBrands();
      setTimeout(() => setLocation("/dashboard"), 500);
    },
    onError: (error: any) => {
      toast({
        title: isSpanish ? "Error" : "Error",
        description:
          error.message ||
          (isSpanish ? "No se pudo unir a la marca" : "Failed to join brand"),
        variant: "destructive",
      });
    },
  });

  const saveBrandDesignMutation = useMutation({
    mutationFn: async (designData: any) => {
      if (!createdBrandId) throw new Error("No brand ID");
      const response = await apiRequest(
        "POST",
        `/api/brand-design?brandId=${createdBrandId}`,
        designData,
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({
        queryKey: ["/api/brand-design", createdBrandId],
      });
      toast({
        title: isSpanish ? "¡Guardado!" : "Saved!",
        description: isSpanish
          ? "Diseño de marca guardado"
          : "Brand design saved",
      });
    },
  });
  const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
  function uploadFileWithProgress(
    file: File,
    onProgress: (pct: number) => void,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();

      // Detect Cloudinary resource type
      let resourceType = "raw";

      if (file.type.startsWith("image/")) {
        resourceType = "image";
      } else if (file.type.startsWith("video/")) {
        resourceType = "video";
      }

      // Correct Cloudinary endpoint
      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      fd.append("file", file);
      fd.append("upload_preset", uploadPreset);

      xhr.open("POST", endpoint);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          let errorMessage = `Upload failed: HTTP ${xhr.status}`;
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.error && response.error.message) {
              errorMessage = `Cloudinary Error: ${response.error.message}`;
            }
          } catch (e) {
            // Si la respuesta no es JSON, usamos el error HTTP
          }
          reject(new Error(errorMessage));
          // --- FIN CAMBIO ---
        }
      };

      xhr.onerror = () => reject(new Error("Upload error (Network failure)"));
      xhr.send(fd);
    });
  }

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>,
  ) => {
    const file = e.target.files?.[0] || null;
    setFile(file);
    if (file) {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    assetCategory: string, // <-- Nuevo argumento
  ) => {
    if (!brandDesign?.id) return;
    const inputEl = e.currentTarget;
    const files = Array.from(inputEl.files || []);

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: isSpanish ? "Archivo Demasiado Grande" : "File Too Large",
          description: isSpanish
            ? `El archivo "${file.name}" excede el límite de ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB. Por favor, comprímelo o sube uno más pequeño.`
            : `The file "${file.name}" exceeds the limit of ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB. Please compress it or upload a smaller one.`,
          variant: "destructive",
          duration: 5000,
        });
        // Si el archivo excede el límite, simplemente pasamos al siguiente archivo
        continue;
      }
      const id = crypto.randomUUID();
      setUploads((prev) => [...prev, { id, name: file.name, percent: 0 }]);

      try {
        const data = await uploadFileWithProgress(file, (pct) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, percent: pct } : u)),
          );
        });

        if (data.secure_url) {
          let description = "";
          try {
            const descResponse = await apiRequest(
              "POST",
              "/api/brand-assets/generate-description",
              {
                imageUrl: data.secure_url,
              },
            );
            const descData = await descResponse.json();
            description = descData.description || "";
          } catch (descErr) {
            console.error(
              "[Onboarding] Error generating asset description:",
              descErr,
            );
          }
          await saveAssetToDB({
            id,
            url: data.secure_url,
            name: file.name,
            category: assetCategory, // <-- Usar el nuevo argumento
            assetType: getAssetType(file.name),
            publicId: data.public_id,
            description, // <-- nuevo
          });
        }
      } catch (err) {
        // --- CAMBIO: Manejar el error de subida y mostrar Toast ---
        const error = err as Error;
        console.error("Asset upload failed:", error.message);
        toast({
          title: isSpanish ? "Error de Subida" : "Upload Error",
          description: isSpanish
            ? `No se pudo subir "${file.name}". Razón: ${error.message}`
            : `Failed to upload "${file.name}". Reason: ${error.message}`,
          variant: "destructive",
          duration: 7000,
        });
        // --- FIN CAMBIO ---
      } finally {
        setUploads((prev) => prev.filter((u) => u.id !== id));
      }
    }

    inputEl.value = "";
    await queryClientInstance.invalidateQueries({
      queryKey: ["/api/brand-assets", createdBrandId, brandDesign.id],
    });
  };
  const saveAssetToDB = async (
    asset: BrandAsset & { description?: string },
  ) => {
    const payload = {
      brandDesignId: brandDesign?.id,
      url: asset.url,
      name: asset.name,
      category: asset.category,
      assetType: asset.assetType,
      publicId: asset.publicId,
      description: asset.description ?? null,
    };

    await apiRequest(
      "POST",
      `/api/brand-assets?brandId=${createdBrandId}`,
      payload,
    );
  };

  const handleRemoveAsset = async (assetId: string) => {
    try {
      // Marcar este asset como eliminándose
      setDeletingAssets((prev) => new Set(prev).add(assetId));

      await apiRequest(
        "DELETE",
        `/api/brand-assets/${assetId}?brandId=${createdBrandId}&brandDesignId=${brandDesign?.id}`,
      );

      await queryClientInstance.invalidateQueries({
        queryKey: ["/api/brand-assets", createdBrandId, brandDesign?.id],
      });

      toast({
        title: isSpanish ? "Eliminado" : "Deleted",
        description: isSpanish
          ? "Recurso eliminado correctamente"
          : "Asset deleted successfully",
      });
    } catch (err) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "No se pudo eliminar el recurso"
          : "Failed to delete asset",
        variant: "destructive",
      });
    } finally {
      // Remover del set de eliminándose
      setDeletingAssets((prev) => {
        const updated = new Set(prev);
        updated.delete(assetId);
        return updated;
      });
    }
  };

  const handleSaveBrandDesign = async (): Promise<boolean> => {
    try {
      const uploadIfNeeded = async (
        file: File | null,
        currentUrl: string | null,
        setPreviewUrl: (url: string | null) => void,
        fieldName: string,
      ): Promise<string | null> => {
        if (file && (!currentUrl || !currentUrl.startsWith("http"))) {
          try {
            const data = await uploadFileWithProgress(file, () => {});
            if (data.secure_url) {
              setPreviewUrl(data.secure_url);
              return data.secure_url;
            }
            throw new Error(`Upload failed for ${fieldName}: No URL returned`);
          } catch (uploadError: any) {
            throw new Error(
              `Failed to upload ${fieldName}: ${uploadError.message}`,
            );
          }
        }
        return currentUrl;
      };

      const whiteLogoUrl = await uploadIfNeeded(
        whiteLogoFile,
        whiteLogoPreviewUrl,
        setWhiteLogoPreviewUrl,
        "white logo",
      );
      const blackLogoUrl = await uploadIfNeeded(
        blackLogoFile,
        blackLogoPreviewUrl,
        setBlackLogoPreviewUrl,
        "black logo",
      );
      const whiteFaviconUrl = await uploadIfNeeded(
        whiteFaviconFile,
        whiteFaviconPreviewUrl,
        setWhiteFaviconPreviewUrl,
        "white favicon",
      );
      const blackFaviconUrl = await uploadIfNeeded(
        blackFaviconFile,
        blackFaviconPreviewUrl,
        setBlackFaviconPreviewUrl,
        "black favicon",
      );

      const designData: Record<string, any> = {
        brandStyle: selectedStyle,
        colorPalette: {
          primary: mainColor,
          accent1: accentColor1,
          accent2: accentColor2,
          text1: text1Color,
          text2: text2Color,
        },
        typography: {
          primary: primaryFont,
          secondary: secondaryFont,
          customFonts: customFontFiles.map((f) => ({
            name: f.family,
            url: f.url,
          })),
        },
        logoUrl: whiteLogoUrl,
        whiteLogoUrl,
        blackLogoUrl,
        whiteFaviconUrl,
        blackFaviconUrl,
        brandId: createdBrandId,
        colorAccent3: accentColor3,
        colorAccent4: accentColor4,
        colorText3: text3Color,
        colorText4: text4Color,
      };

      await saveBrandDesignMutation.mutateAsync(designData);
      return true;
    } catch (err: any) {
      const errorMessage =
        err?.message ||
        (isSpanish
          ? "No se pudo guardar el diseño"
          : "Failed to save brand design");
      toast({
        title: isSpanish ? "Error" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  // Form submission handlers
  const onCreateSubmit = (data: CreateBrandForm) => {
    // --- SOLUCIÓN PROBLEMA 1: Ajustar el valor de la industria si es "Other" ---
    let finalData = data;
    if (isOtherIndustry) {
      // Reemplaza el valor de 'industry' del formulario ("other") con el valor de customIndustry
      finalData = { ...data, industry: customIndustry };
    }
    // --------------------------------------------------------------------------

    // Check if brand actually exists before trying to update
    const brandExists =
      createdBrandId &&
      brands.some((b: any) => String(b.id) === String(createdBrandId));

    if (brandExists) {
      // Brand exists - update it
      updateBrandMutation.mutate({ ...finalData, brandId: createdBrandId });
    } else {
      // No valid brand - create new one (also clears stale state)
      if (createdBrandId) {
        console.log("Stale brand ID detected, clearing and creating new brand");
        clearOnboardingState();
        setCreatedBrandId(null);
      }
      createBrandMutation.mutate(finalData);
    }
  };

  const onJoinSubmit = (data: JoinBrandForm) => {
    joinBrandMutation.mutate(data);
  };

  // Navigation handlers
  const handleNextStep = async () => {
    if (currentStep === 2) {
      const saved = await handleSaveBrandDesign();
      if (!saved) return;
    }
    // STEP 3: Generate Brand Essence after uploading assets
    if (currentStep === 3 && createdBrandId) {
      setIsGeneratingEssence(true);
      try {
        console.log("[Onboarding] Generating Brand Essence after assets...");
        await apiRequest(
          "POST",
          `/api/brands/${createdBrandId}/generate-essence`,
        );
        console.log("[Onboarding] Brand Essence generated successfully");
      } catch (err) {
        console.error("[Onboarding] Error generating Brand Essence:", err);
        toast({
          title: isSpanish ? "Alerta de IA" : "AI Alert",
          description: isSpanish
            ? "Hubo un error al generar la esencia de marca, pero puedes continuar."
            : "There was an error generating the brand essence, but you can continue.",
          variant: "default",
        });
      } finally {
        setIsGeneratingEssence(false);
      }
    }

    const nextStep = Math.min(currentStep + 1, totalSteps);
    setCurrentStep(nextStep);

    // Save step progress to database
    if (createdBrandId) {
      updateOnboardingStepMutation.mutate({
        brandId: String(createdBrandId),
        step: nextStep,
      });
    }
  };

  const handlePrevStep = () => {
    const prevStep = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStep);

    // Save step progress to database
    if (createdBrandId) {
      updateOnboardingStepMutation.mutate({
        brandId: String(createdBrandId),
        step: prevStep,
      });
    }
  };

  const handleFinishOnboarding = async () => {
    // Mark onboarding as completed in database
    if (createdBrandId) {
      try {
        await updateOnboardingStepMutation.mutateAsync({
          brandId: String(createdBrandId),
          completed: true,
        });
      } catch (error) {
        console.error("Failed to mark onboarding as completed:", error);
      }
    }

    clearOnboardingState();
    toast({
      title: isSpanish ? "¡Onboarding completado!" : "Onboarding complete!",
      description: isSpanish
        ? "Tu marca está lista para usar."
        : "Your brand is ready to use.",
    });
    setLocation("/dashboard");
  };

  // Step 5: Generate AI-suggested posting schedules when entering step 5
  useEffect(() => {
    if (
      currentStep === 5 &&
      connectedSocialPlatforms.length > 0 &&
      postingSchedules.length === 0
    ) {
      // Generate default AI suggestions based on connected platforms
      const defaultSchedules: Record<string, PlatformSchedule> = {
        facebook: {
          platform: "facebook",
          postsPerWeek: 3,
          selectedDays: ["monday", "wednesday", "friday"],
        },
        instagram: {
          platform: "instagram",
          postsPerWeek: 5,
          selectedDays: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
          ],
        },
        instagram_direct: {
          platform: "instagram_direct",
          postsPerWeek: 5,
          selectedDays: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
          ],
        },
        whatsapp: {
          platform: "whatsapp",
          postsPerWeek: 2,
          selectedDays: ["monday", "thursday"],
        },
        whatsapp_baileys: {
          platform: "whatsapp_baileys",
          postsPerWeek: 2,
          selectedDays: ["monday", "thursday"],
        },
        tiktok: {
          platform: "tiktok",
          postsPerWeek: 4,
          selectedDays: ["monday", "wednesday", "thursday", "saturday"],
        },
        youtube: {
          platform: "youtube",
          postsPerWeek: 2,
          selectedDays: ["tuesday", "friday"],
        },
      };

      const suggestedSchedules = connectedSocialPlatforms
        .map((integration) => defaultSchedules[integration.provider])
        .filter(
          (schedule): schedule is PlatformSchedule => schedule !== undefined,
        );

      setPostingSchedules(suggestedSchedules);
    }
  }, [currentStep, connectedSocialPlatforms, postingSchedules.length]);

  // Step 5: Save posting frequency
  const handleSavePostingFrequency = async () => {
    if (!effectiveBrandId) return;

    setIsSavingFrequency(true);
    try {
      const response = await apiRequest(
        "POST",
        `/api/posting-frequency?brandId=${effectiveBrandId}`,
        {
          schedules: postingSchedules,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save posting frequency");
      }

      toast({
        title: isSpanish ? "¡Guardado!" : "Saved!",
        description: isSpanish
          ? "Tu frecuencia de publicación ha sido guardada."
          : "Your posting frequency has been saved.",
      });

      handleFinishOnboarding();
    } catch (error) {
      console.error("Error saving posting frequency:", error);
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "No se pudo guardar la frecuencia de publicación"
          : "Failed to save posting frequency",
        variant: "destructive",
      });
    } finally {
      setIsSavingFrequency(false);
    }
  };

  // Step 5: Skip posting frequency configuration
  const handleSkipFrequency = () => {
    handleFinishOnboarding();
  };

  // Show loading while checking authentication
  if (authLoading || (isLoadingProgress && !hasLoadedFromDb)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {isSpanish ? "Cargando..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: MODE SELECTION
  // =====================================================

  if (mode === "choose") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Sparkles className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {isSpanish ? "Bienvenido a Lead Boost" : "Welcome to Lead Boost"}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {isSpanish
                ? "Empecemos con tu marca"
                : "Let's get you started with your brand"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-indigo-500"
              onClick={() => setMode("create")}
              data-testid="card-create-brand"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-2xl">
                    {isSpanish ? "Empezar desde cero" : "Start from Scratch"}
                  </CardTitle>
                </div>
                <CardDescription className="text-base">
                  {isSpanish
                    ? "Comienza creando tu propia marca e invita a miembros del equipo"
                    : "Start fresh by creating your own brand and inviting team members"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    {isSpanish
                      ? "Posee y administra tu marca"
                      : "Own and manage your brand"}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    {isSpanish
                      ? "Invita miembros del equipo"
                      : "Invite team members"}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    {isSpanish
                      ? "Control total sobre configuraciones"
                      : "Full control over settings"}
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-500"
              onClick={() => setMode("join")}
              data-testid="card-join-brand"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <UserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-2xl">
                    {isSpanish ? "Unirse a un Equipo" : "Join a Team"}
                  </CardTitle>
                </div>
                <CardDescription className="text-base">
                  {isSpanish
                    ? "Únete a una marca existente usando un código de invitación"
                    : "Join an existing brand using an invitation code"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    {isSpanish
                      ? "Colabora con tu equipo"
                      : "Collaborate with your team"}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    {isSpanish
                      ? "Accede a recursos compartidos"
                      : "Access shared resources"}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    {isSpanish
                      ? "Comienza a trabajar inmediatamente"
                      : "Start working immediately"}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER: JOIN BRAND MODE
  // =====================================================

  if (mode === "join") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isSpanish ? "Unirse a una Marca" : "Join a Brand"}
            </CardTitle>
            <CardDescription>
              {isSpanish
                ? "Ingresa el código de invitación proporcionado por tu equipo"
                : "Enter the invitation code provided by your team"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...joinForm}>
              <form
                onSubmit={joinForm.handleSubmit(onJoinSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={joinForm.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isSpanish
                          ? "Código de Invitación *"
                          : "Invitation Code *"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            isSpanish
                              ? "Ingresa el código de invitación"
                              : "Enter invitation code"
                          }
                          className="font-mono text-lg tracking-wider"
                          data-testid="input-invite-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode("choose")}
                    className="flex-1"
                    data-testid="button-back-join"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {isSpanish ? "Volver" : "Back"}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={joinBrandMutation.isPending}
                    data-testid="button-join-brand"
                  >
                    {joinBrandMutation.isPending
                      ? isSpanish
                        ? "Uniéndose..."
                        : "Joining..."
                      : isSpanish
                        ? "Unirse"
                        : "Join Brand"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =====================================================
  // RENDER: CREATE BRAND MODE (Multi-step wizard)
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* STEP 1: Create Brand */}
        {currentStep === 1 && (
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">
                {isSpanish ? "Crear Tu Marca" : "Create Your Brand"}
              </CardTitle>
              <CardDescription>
                {isSpanish
                  ? "Configura el perfil de tu marca para comenzar"
                  : "Set up your brand profile to get started"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(onCreateSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isSpanish ? "Nombre de la Marca *" : "Brand Name *"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. Acme Corp"
                            data-testid="input-brand-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isSpanish ? "Industria *" : "Industry *"}
                        </FormLabel>

                        <Select
                          value={field.value || ""}
                          onValueChange={(value) => {
                            if (value === "other") {
                              setIsOtherIndustry(true);
                              // SOLUCIÓN 1: Mantener "other" como valor para el Select
                              field.onChange(value);
                            } else {
                              setIsOtherIndustry(false);
                              setCustomIndustry("");
                              field.onChange(value); // <-- value REAL, no label
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isSpanish
                                    ? "Selecciona una industria"
                                    : "Select an industry"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>

                          <SelectContent>
                            {INDUSTRY_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {isSpanish ? option.labelEs : option.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {isOtherIndustry && (
                          <Input
                            value={customIndustry}
                            onChange={(e) => {
                              setCustomIndustry(e.target.value);
                              // SOLUCIÓN 1: ELIMINAR field.onChange(e.target.value) aquí.
                              // El valor de la industria personalizada se inserta en onCreateSubmit.
                              // Esto evita el conflicto de renderizado.
                            }}
                            placeholder={
                              isSpanish
                                ? "Escribe tu industria"
                                : "Enter your industry"
                            }
                            className="mt-2"
                          />
                        )}

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => {
                      const [listening, setListening] = useState(false);
                      const recognitionRef = useRef<any>(null); // Asegurar el tipado

                      const startListening = () => {
                        const SpeechRecognition =
                          window.SpeechRecognition ||
                          window.webkitSpeechRecognition;

                        if (!SpeechRecognition) {
                          alert(
                            isSpanish
                              ? "Tu navegador no soporta reconocimiento de voz."
                              : "Your browser does not support speech recognition.",
                          );
                          return;
                        }

                        const recognition = new SpeechRecognition();

                        // --- SOLUCIÓN PROBLEMA 2: Lenguaje dinámico ---
                        recognition.lang = isSpanish ? "es-MX" : "en-US";
                        // ---------------------------------------------

                        recognition.continuous = true;
                        recognition.interimResults = false;

                        recognition.onresult = (event) => {
                          const transcript =
                            event.results[event.results.length - 1][0]
                              .transcript;
                          field.onChange(
                            field.value
                              ? field.value + " " + transcript
                              : transcript,
                          );
                        };

                        recognition.onend = () => setListening(false);

                        recognition.start();
                        recognitionRef.current = recognition;
                        setListening(true);
                      };

                      const stopListening = () => {
                        recognitionRef.current?.stop();
                        setListening(false);
                      };

                      return (
                        <FormItem>
                          <FormLabel>
                            {isSpanish
                              ? "Descripción (se tan específico como puedas) *"
                              : "Description (be as specific as you can)*"}
                          </FormLabel>

                          <div className="relative">
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={3}
                                placeholder={
                                  isSpanish
                                    ? "Cuanto más nos cuente sobre su marca, mejor funcionará nuestra IA para usted."
                                    : "The more you tell us about your brand, the better our AI will work for you."
                                }
                              />
                            </FormControl>

                            <button
                              type="button"
                              onClick={
                                listening ? stopListening : startListening
                              }
                              className="absolute right-2 bottom-2 p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                            >
                              {listening ? (
                                <MicOff className="w-4 h-4 text-red-600" />
                              ) : (
                                <Mic className="w-4 h-4 text-blue-600" />
                              )}
                            </button>
                          </div>

                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={createForm.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Globe className="w-4 h-4 inline mr-1" />
                          {isSpanish ? "Idioma Preferido" : "Preferred Language"}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-preferred-language">
                              <SelectValue
                                placeholder={
                                  isSpanish
                                    ? "Selecciona un idioma"
                                    : "Select a language"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                        <Alert className="mt-2 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                            {isSpanish
                              ? "El contenido generado por IA se creará en este idioma."
                              : "AI-generated content will be created in this language."}
                          </AlertDescription>
                        </Alert>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isSpanish ? "Link de la Página Web" : "Website Link"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              isSpanish
                                ? "e.g. https://www.ejemplo.com"
                                : "e.g. https://www.example.com"
                            }
                            // Asegurarse de manejar null/undefined para el input
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMode("choose")}
                      className="flex-1"
                      data-testid="button-back"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {isSpanish ? "Volver" : "Back"}
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={
                        createBrandMutation.isPending ||
                        updateBrandMutation.isPending
                      }
                      data-testid="button-next-step-1"
                    >
                      {createBrandMutation.isPending ||
                      updateBrandMutation.isPending
                        ? isSpanish
                          ? createdBrandId
                            ? "Actualizando..."
                            : "Creando..."
                          : createdBrandId
                            ? "Updating..."
                            : "Creating..."
                        : isSpanish
                          ? "Siguiente"
                          : "Next"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Brand Design (Brand Studio Tab 1) */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Palette className="w-6 h-6" />
                {isSpanish ? "Diseño de Marca" : "Brand Design"}
              </CardTitle>
              <CardDescription>
                {isSpanish
                  ? "Configura la identidad visual de tu marca"
                  : "Configure your brand's visual identity"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-800 rounded-full p-2">
                    <Palette className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      {isSpanish
                        ? "Estos colores y estilos se usarán para generar contenido con IA"
                        : "These colors and styles will be used to generate AI content"}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {isSpanish
                        ? "Asegúrate de que reflejen la identidad de tu marca"
                        : "Make sure they reflect your brand identity"}
                    </p>
                  </div>
                </div>
              </div>
              {isDesignLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <Accordion
                  type="multiple"
                  defaultValue={["style", "colors", "logos", "typography"]}
                  className="space-y-4"
                >
                  {/* Brand Style Selection */}
                  <AccordionItem value="style">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        {isSpanish ? "Estilo de Marca" : "Brand Style"}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                        {brandStyles.map((style) => (
                          <div
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                              selectedStyle === style.id
                                ? "border-indigo-500 ring-2 ring-indigo-200"
                                : "border-gray-200"
                            } ${style.color}`}
                            data-testid={`style-${style.id}`}
                          >
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {style.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {style.description}
                            </p>
                            {styleImages[style.id] && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <div
                                    className="relative group"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <img
                                      src={styleImages[style.id]}
                                      alt={style.name}
                                      className="w-full h-20 object-cover rounded-md shadow-md cursor-pointer"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                      <ZoomIn className="text-white h-6 w-6" />
                                    </div>
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-screen overflow-y-auto p-0">
                                  <img
                                    src={styleImages[style.id]}
                                    alt={`${style.name} Preview`}
                                    className="w-full h-auto rounded-lg"
                                  />
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Color Palette */}
                  <AccordionItem value="colors">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        {isSpanish ? "Paleta de Colores" : "Color Palette"}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4">
                        <ColorPreviewWithPicker
                          label={isSpanish ? "Color Principal" : "Main Color"}
                          value={mainColor}
                          onChange={setMainColor}
                          allowGradient={true}
                        />
                        <ColorPreviewWithPicker
                          label={
                            isSpanish ? "Color Acento 1" : "Accent Color 1"
                          }
                          value={accentColor1}
                          onChange={setAccentColor1}
                          allowGradient={true}
                        />
                        <ColorPreviewWithPicker
                          label={
                            isSpanish ? "Color Acento 2" : "Accent Color 2"
                          }
                          value={accentColor2}
                          onChange={setAccentColor2}
                          allowGradient={true}
                        />
                        <ColorPreviewWithPicker
                          label={isSpanish ? "Color Texto 1" : "Text Color 1"}
                          value={text1Color}
                          onChange={setText1Color}
                          allowGradient={false}
                        />
                        <ColorPreviewWithPicker
                          label={isSpanish ? "Color Texto 2" : "Text Color 2"}
                          value={text2Color}
                          onChange={setText2Color}
                          allowGradient={false}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Logos */}
                  <AccordionItem value="logos">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <Image className="h-5 w-5" />
                        {isSpanish ? "Logos" : "Logos"}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded-r-lg p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-1.5">
                            <Image className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                          </div>
                          <p className="font-medium text-blue-800 dark:text-blue-200">
                            {isSpanish
                              ? "Importante: Formato PNG con fondo transparente"
                              : "Important: PNG format with transparent background"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {/* Light Logo */}
                        <div className="space-y-2">
                          <Label>
                            {isSpanish ? "Logo Claro" : "Light Logo"}
                          </Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {whiteLogoPreviewUrl ? (
                              <div className="flex flex-col items-center">
                                <img
                                  src={whiteLogoPreviewUrl}
                                  alt="White Logo"
                                  className="max-h-20 object-contain mb-2"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setWhiteLogoFile(null);
                                    setWhiteLogoPreviewUrl(null);
                                  }}
                                  className="text-red-500"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />{" "}
                                  {isSpanish ? "Eliminar" : "Remove"}
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                <Label
                                  htmlFor="white-logo"
                                  className="cursor-pointer"
                                >
                                  <span className="font-medium text-indigo-600 hover:text-indigo-500">
                                    {isSpanish ? "Subir logo" : "Upload logo"}
                                  </span>
                                  <input
                                    id="white-logo"
                                    type="file"
                                    accept="image/png"
                                    className="sr-only"
                                    onChange={(e) =>
                                      handleFileUpload(
                                        e,
                                        setWhiteLogoFile,
                                        setWhiteLogoPreviewUrl,
                                      )
                                    }
                                  />
                                </Label>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Dark Logo */}
                        <div className="space-y-2">
                          <Label>
                            {isSpanish ? "Logo Oscuro" : "Dark Logo"}
                          </Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {blackLogoPreviewUrl ? (
                              <div className="flex flex-col items-center">
                                <img
                                  src={blackLogoPreviewUrl}
                                  alt="Black Logo"
                                  className="max-h-20 object-contain mb-2"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setBlackLogoFile(null);
                                    setBlackLogoPreviewUrl(null);
                                  }}
                                  className="text-red-500"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />{" "}
                                  {isSpanish ? "Eliminar" : "Remove"}
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                <Label
                                  htmlFor="black-logo"
                                  className="cursor-pointer"
                                >
                                  <span className="font-medium text-indigo-600 hover:text-indigo-500">
                                    {isSpanish ? "Subir logo" : "Upload logo"}
                                  </span>
                                  <input
                                    id="black-logo"
                                    type="file"
                                    accept="image/png"
                                    className="sr-only"
                                    onChange={(e) =>
                                      handleFileUpload(
                                        e,
                                        setBlackLogoFile,
                                        setBlackLogoPreviewUrl,
                                      )
                                    }
                                  />
                                </Label>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Light Favicon */}
                        <div className="space-y-2">
                          <Label>
                            {isSpanish ? "Favicon Claro" : "Light Favicon"}
                          </Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {whiteFaviconPreviewUrl ? (
                              <div className="flex flex-col items-center">
                                <img
                                  src={whiteFaviconPreviewUrl}
                                  alt="White Favicon"
                                  className="max-h-16 object-contain mb-2"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setWhiteFaviconFile(null);
                                    setWhiteFaviconPreviewUrl(null);
                                  }}
                                  className="text-red-500"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />{" "}
                                  {isSpanish ? "Eliminar" : "Remove"}
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                <Label
                                  htmlFor="white-favicon"
                                  className="cursor-pointer"
                                >
                                  <span className="font-medium text-indigo-600 hover:text-indigo-500">
                                    {isSpanish
                                      ? "Subir favicon"
                                      : "Upload favicon"}
                                  </span>
                                  <input
                                    id="white-favicon"
                                    type="file"
                                    accept="image/png"
                                    className="sr-only"
                                    onChange={(e) =>
                                      handleFileUpload(
                                        e,
                                        setWhiteFaviconFile,
                                        setWhiteFaviconPreviewUrl,
                                      )
                                    }
                                  />
                                </Label>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Dark Favicon */}
                        <div className="space-y-2">
                          <Label>
                            {isSpanish ? "Favicon Oscuro" : "Dark Favicon"}
                          </Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {blackFaviconPreviewUrl ? (
                              <div className="flex flex-col items-center">
                                <img
                                  src={blackFaviconPreviewUrl}
                                  alt="Black Favicon"
                                  className="max-h-16 object-contain mb-2"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setBlackFaviconFile(null);
                                    setBlackFaviconPreviewUrl(null);
                                  }}
                                  className="text-red-500"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />{" "}
                                  {isSpanish ? "Eliminar" : "Remove"}
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                <Label
                                  htmlFor="black-favicon"
                                  className="cursor-pointer"
                                >
                                  <span className="font-medium text-indigo-600 hover:text-indigo-500">
                                    {isSpanish
                                      ? "Subir favicon"
                                      : "Upload favicon"}
                                  </span>
                                  <input
                                    id="black-favicon"
                                    type="file"
                                    accept="image/png"
                                    className="sr-only"
                                    onChange={(e) =>
                                      handleFileUpload(
                                        e,
                                        setBlackFaviconFile,
                                        setBlackFaviconPreviewUrl,
                                      )
                                    }
                                  />
                                </Label>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Typography */}
                  <AccordionItem value="typography">
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        {isSpanish ? "Tipografía" : "Typography"}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                          <Label>
                            {isSpanish ? "Fuente Principal" : "Primary Font"}
                          </Label>
                          <FontSelector
                            value={primaryFont}
                            onChange={setPrimaryFont}
                          />
                          <p
                            className="text-sm text-gray-500"
                            style={{ fontFamily: primaryFont }}
                          >
                            {isSpanish
                              ? "Vista previa de la fuente principal"
                              : "Preview of primary font"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>
                            {isSpanish ? "Fuente Secundaria" : "Secondary Font"}
                          </Label>
                          <FontSelector
                            value={secondaryFont}
                            onChange={setSecondaryFont}
                          />
                          <p
                            className="text-sm text-gray-500"
                            style={{ fontFamily: secondaryFont }}
                          >
                            {isSpanish
                              ? "Vista previa de la fuente secundaria"
                              : "Preview of secondary font"}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex-1"
                  data-testid="button-prev-step-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {isSpanish ? "Anterior" : "Previous"}
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1"
                  disabled={saveBrandDesignMutation.isPending}
                  data-testid="button-next-step-2"
                >
                  {saveBrandDesignMutation.isPending
                    ? isSpanish
                      ? "Guardando..."
                      : "Saving..."
                    : isSpanish
                      ? "Siguiente"
                      : "Next"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Brand Assets (Brand Studio Tab 2) */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Image className="w-6 h-6" />
                {isSpanish ? "Recursos de Marca" : "Brand Assets"}
              </CardTitle>
              <CardDescription>
                {isSpanish
                  ? "Sube imágenes, videos y documentos para tu marca"
                  : "Upload images, videos and documents for your brand"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 dark:bg-green-800 rounded-full p-2">
                    <Image className="h-4 w-4 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      {isSpanish
                        ? "Estos archivos estarán disponibles para tu contenido de marketing"
                        : "These files will be available for your marketing content"}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {isSpanish
                        ? "Sube fotos de productos, materiales promocionales o cualquier recurso de marca"
                        : "Upload product photos, promotional materials, or any brand resources"}
                    </p>
                  </div>
                </div>
              </div>
              {isAssetsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <>
                  {/* Upload progress */}
                  {uploads.length > 0 && (
                    <div className="space-y-3">
                      {uploads.map((u) => (
                        <div key={u.id} className="text-left">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 truncate">
                              {u.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {u.percent}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-2.5 rounded-full transition-all"
                              style={{ width: `${u.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Asset categories accordion */}
                  <Accordion type="multiple" className="w-full">
                    {assetCategories.map((category) => {
                      const assetsInCategory = assets.filter(
                        (asset) => asset.category === category.value,
                      );

                      return (
                        <AccordionItem
                          key={category.value}
                          value={category.value}
                        >
                          <AccordionTrigger className="text-lg font-semibold">
                            {category.label} ({assetsInCategory.length})
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4">
                            {/* Upload section per category */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <Upload className="mx-auto h-10 w-10 text-gray-400" />
                              <div className="mt-3">
                                <Label
                                  htmlFor={`asset-upload-${category.value}`}
                                  className="cursor-pointer"
                                >
                                  <span className="font-medium text-indigo-600 hover:text-indigo-500">
                                    {isSpanish
                                      ? "Subir recurso"
                                      : "Upload asset"}
                                  </span>
                                  <input
                                    id={`asset-upload-${category.value}`}
                                    type="file"
                                    accept="image/*,video/*,application/pdf"
                                    multiple
                                    className="sr-only"
                                    onChange={(e) => {
                                      handleAssetUpload(e, category.value);
                                    }}
                                    data-testid={`input-asset-upload-${category.value}`}
                                  />
                                </Label>
                                <p className="text-sm text-gray-500 mt-1">
                                  {isSpanish
                                    ? "Imágenes, videos o PDFs."
                                    : "Images, videos or PDFs."}
                                </p>
                              </div>
                            </div>

                            {/* Assets grid */}
                            {assetsInCategory.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {assetsInCategory.map((asset) => (
                                  <div
                                    key={asset.id}
                                    className="relative group border rounded-md p-2 flex flex-col items-center justify-center h-32 overflow-hidden"
                                  >
                                    {asset.assetType === "image" ? (
                                      <img
                                        src={asset.url}
                                        alt={asset.name}
                                        className="max-h-full max-w-full object-contain"
                                      />
                                    ) : asset.assetType === "video" ? (
                                      <video
                                        src={asset.url}
                                        controls
                                        className="max-h-full max-w-full object-contain"
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center text-gray-500 text-sm p-1">
                                        <FileText className="h-8 w-8 mb-1" />
                                        <span className="truncate w-full text-center">
                                          {asset.name}
                                        </span>
                                      </div>
                                    )}

                                    {/* Hover actions */}
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        disabled={deletingAssets.has(asset.id)}
                                        onClick={() =>
                                          handleRemoveAsset(asset.id)
                                        }
                                        className="m-1"
                                      >
                                        {deletingAssets.has(asset.id) ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>

                                      <a
                                        href={asset.url}
                                        download={asset.name}
                                        className="m-1"
                                      >
                                        <Button variant="secondary" size="icon">
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </a>
                                    </div>

                                    <Badge
                                      variant="secondary"
                                      className="absolute bottom-1 left-1 text-xs px-1 py-0.5 opacity-80"
                                    >
                                      {asset.name}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 text-center">
                                {isSpanish
                                  ? "Aún no hay recursos en esta categoría."
                                  : "No assets in this category yet."}
                              </p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </>
              )}
              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex-1"
                  data-testid="button-prev-step-3"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {isSpanish ? "Anterior" : "Previous"}
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1"
                  disabled={isGeneratingEssence}
                  data-testid="button-next-step-3"
                >
                  {isGeneratingEssence ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isSpanish
                        ? "Generando Esencia..."
                        : "Generating Essence..."}
                    </>
                  ) : (
                    <>
                      {isSpanish ? "Siguiente" : "Next"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Integrations Setup */}
        {currentStep === 4 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Link className="w-6 h-6" />
                  {isSpanish
                    ? "Configurar Integraciones"
                    : "Setup Integrations"}
                </CardTitle>
                <CardDescription>
                  {isSpanish
                    ? "Conecta tus cuentas de redes sociales y otras plataformas"
                    : "Connect your social media accounts and other platforms"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Integration Categories */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>{isSpanish ? "Nota:" : "Note:"}</strong>{" "}
                    {isSpanish
                      ? "Puedes configurar las integraciones más tarde desde la página de Configuración."
                      : "You can configure integrations later from the Settings page."}
                  </p>
                </div>

                {isIntegrationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {Object.entries(INTEGRATION_CATEGORIES).map(
                      ([key, category]) => {
                        const CategoryIcon = category.icon;
                        const providersInCategory = Object.entries(
                          INTEGRATION_PROVIDERS,
                        ).filter(([, provider]) => provider.category === key);

                        return (
                          <Card key={key} className="border">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <CategoryIcon className="w-5 h-5" />
                                {category.name}
                              </CardTitle>
                              <CardDescription>
                                {category.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {providersInCategory.map(
                                  ([providerKey, provider]) => {
                                    const ProviderIcon = provider.icon;
                                    const connectedIntegration =
                                      getConnectedIntegration(providerKey);
                                    const isConnecting =
                                      connectingProvider === providerKey;

                                    // Get icon color based on provider
                                    const getIconColor = () => {
                                      switch (providerKey) {
                                        case "facebook":
                                          return "text-blue-600";
                                        case "instagram":
                                          return "text-pink-500";
                                        case "whatsapp":
                                          return "text-green-500";
                                        case "youtube":
                                          return "text-red-600";
                                        default:
                                          return "text-gray-600 dark:text-gray-400";
                                      }
                                    };

                                    return (
                                      <div
                                        key={providerKey}
                                        className="flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                        data-testid={`integration-${providerKey}`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <ProviderIcon
                                            className={`w-8 h-8 ${getIconColor()}`}
                                          />
                                          <div>
                                            <p className="font-medium">
                                              {provider.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                              {provider.description}
                                            </p>
                                            {connectedIntegration && (
                                              <p className="text-xs text-green-600 mt-1">
                                                ✅{" "}
                                                {isSpanish
                                                  ? "Conectado como"
                                                  : "Connected as"}{" "}
                                                {connectedIntegration.accountName ||
                                                  connectedIntegration.storeName}
                                                {connectedIntegration.provider ===
                                                  "instagram_direct" && (
                                                  <span className="ml-1 text-gray-500">
                                                    (
                                                    {isSpanish
                                                      ? "Directo"
                                                      : "Direct"}
                                                    )
                                                  </span>
                                                )}
                                                {connectedIntegration.provider ===
                                                  "whatsapp_baileys" && (
                                                  <span className="ml-1 text-gray-500">
                                                    (
                                                    {isSpanish
                                                      ? "QR Code"
                                                      : "QR Code"}
                                                    )
                                                  </span>
                                                )}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        {connectedIntegration ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              if (
                                                connectedIntegration.provider ===
                                                "whatsapp_baileys"
                                              ) {
                                                handleBaileysDisconnect();
                                              } else {
                                                handleDisconnect(
                                                  connectedIntegration.id,
                                                );
                                              }
                                            }}
                                            disabled={
                                              disconnectingBaileys ||
                                              disconnectingIds.has(
                                                connectedIntegration.id,
                                              )
                                            }
                                            className="text-red-600 border-red-400 hover:bg-red-50"
                                            data-testid={`disconnect-${providerKey}`}
                                          >
                                            {connectedIntegration.provider ===
                                              "whatsapp_baileys" &&
                                            disconnectingBaileys ? (
                                              <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {isSpanish
                                                  ? "Desconectando..."
                                                  : "Disconnecting..."}
                                              </>
                                            ) : disconnectingIds.has(
                                                connectedIntegration.id,
                                              ) ? (
                                              <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {isSpanish
                                                  ? "Desconectando..."
                                                  : "Disconnecting..."}
                                              </>
                                            ) : isSpanish ? (
                                              "Desconectar"
                                            ) : (
                                              "Disconnect"
                                            )}
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              handleConnect(providerKey)
                                            }
                                            disabled={isConnecting}
                                            data-testid={`connect-${providerKey}`}
                                          >
                                            {isConnecting ? (
                                              <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {isSpanish
                                                  ? "Conectando..."
                                                  : "Connecting..."}
                                              </>
                                            ) : isSpanish ? (
                                              "Conectar"
                                            ) : (
                                              "Connect"
                                            )}
                                          </Button>
                                        )}
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      },
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1"
                    data-testid="button-prev-step-4"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {isSpanish ? "Anterior" : "Previous"}
                  </Button>
                  {hasSocialConnections ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1"
                      data-testid="button-next-step-4"
                    >
                      {isSpanish ? "Siguiente" : "Next"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleFinishOnboarding}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      data-testid="button-finish-onboarding"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {isSpanish ? "Finalizar Onboarding" : "Finish Onboarding"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instagram Method Selection Dialog */}
            <Dialog
              open={isInstagramMethodDialogOpen}
              onOpenChange={setIsInstagramMethodDialogOpen}
            >
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    {isSpanish ? "Conectar Instagram" : "Connect Instagram"}
                  </DialogTitle>
                  <DialogDescription>
                    {isSpanish
                      ? "Elige tu método de conexión preferido"
                      : "Choose your preferred connection method"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 pt-2">
                  {hasAnyInstagram && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                      <p className="text-green-800">
                        <strong>✅</strong>{" "}
                        {hasInstagramViaFacebook
                          ? isSpanish
                            ? "Instagram conectado vía Facebook"
                            : "Instagram connected via Facebook"
                          : isSpanish
                            ? "Instagram Direct conectado"
                            : "Instagram Direct connected"}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {isSpanish
                          ? "Para usar otro método, primero desconecta esta integración desde la lista."
                          : "To use another method, first disconnect this integration from the list."}
                      </p>
                    </div>
                  )}

                  {/* Instagram via Facebook Option */}
                  <div
                    className={`p-4 border rounded-lg transition-all ${
                      hasAnyInstagram
                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                        : "cursor-pointer hover:border-pink-300 hover:bg-pink-50/50"
                    }`}
                    onClick={() =>
                      !hasAnyInstagram && handleInstagramConnect("facebook")
                    }
                    data-testid="instagram-facebook-option"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Facebook className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {isSpanish
                            ? "Instagram vía Facebook"
                            : "Instagram via Facebook"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isSpanish
                            ? "Gestiona Instagram a través de tu página de Facebook"
                            : "Manage Instagram through your Facebook Page"}
                        </p>
                      </div>
                    </div>
                    {hasInstagramViaFacebook && (
                      <p className="text-xs text-green-600 mt-2">
                        ✅ {isSpanish ? "Conectado" : "Connected"}
                      </p>
                    )}
                  </div>

                  {/* Instagram Direct Option */}
                  <div
                    className={`p-4 border rounded-lg transition-all ${
                      hasAnyInstagram
                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                        : "cursor-pointer hover:border-pink-300 hover:bg-pink-50/50"
                    }`}
                    onClick={() =>
                      !hasAnyInstagram && handleInstagramConnect("direct")
                    }
                    data-testid="instagram-direct-option"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {isSpanish ? "Instagram Directo" : "Instagram Direct"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isSpanish
                            ? "Conexión directa a Instagram Business"
                            : "Direct connection to Instagram Business"}
                        </p>
                      </div>
                    </div>
                    {hasInstagramDirect && (
                      <p className="text-xs text-green-600 mt-2">
                        ✅ {isSpanish ? "Conectado" : "Connected"}
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* WhatsApp Method Selection Dialog */}
            <Dialog
              open={isWhatsAppMethodDialogOpen}
              onOpenChange={setIsWhatsAppMethodDialogOpen}
            >
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                    {isSpanish ? "Conectar WhatsApp" : "Connect WhatsApp"}
                  </DialogTitle>
                  <DialogDescription>
                    {isSpanish
                      ? "Elige tu método de conexión preferido"
                      : "Choose your preferred connection method"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 pt-2">
                  {hasAnyWhatsApp && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                      <p className="text-green-800">
                        <strong>✅</strong>{" "}
                        {hasWhatsAppBusiness
                          ? isSpanish
                            ? "WhatsApp Business conectado"
                            : "WhatsApp Business connected"
                          : isSpanish
                            ? "WhatsApp (QR Code) conectado"
                            : "WhatsApp (QR Code) connected"}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {isSpanish
                          ? "Para usar otro método, primero desconecta esta integración desde la lista."
                          : "To use another method, first disconnect this integration from the list."}
                      </p>
                    </div>
                  )}

                  {/* WhatsApp Business (Meta) Option - Recommended */}
                  <div
                    className={`p-4 border-2 border-green-200 rounded-lg transition-all ${
                      hasAnyWhatsApp
                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                        : "cursor-pointer hover:border-green-400 hover:bg-green-50/50"
                    }`}
                    onClick={() =>
                      !hasAnyWhatsApp && handleWhatsAppConnect("business")
                    }
                    data-testid="whatsapp-business-option"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {isSpanish
                              ? "WhatsApp Business (Meta)"
                              : "WhatsApp Business (Meta)"}
                          </p>
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            {isSpanish ? "Recomendado" : "Recommended"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {isSpanish
                            ? "API oficial de WhatsApp Cloud - estable y confiable"
                            : "Official WhatsApp Cloud API - stable and reliable"}
                        </p>
                      </div>
                    </div>
                    {hasWhatsAppBusiness && (
                      <p className="text-xs text-green-600 mt-2">
                        ✅ {isSpanish ? "Conectado" : "Connected"}
                      </p>
                    )}
                  </div>

                  {/* WhatsApp Baileys (QR Code) Option */}
                  <div
                    className={`p-4 border rounded-lg transition-all ${
                      hasAnyWhatsApp
                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                        : "cursor-pointer hover:border-orange-300 hover:bg-orange-50/50"
                    }`}
                    onClick={() =>
                      !hasAnyWhatsApp && handleWhatsAppConnect("baileys")
                    }
                    data-testid="whatsapp-baileys-option"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {isSpanish
                              ? "WhatsApp (QR Code)"
                              : "WhatsApp (QR Code)"}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-xs text-orange-600 border-orange-400"
                          >
                            {isSpanish ? "Experimental" : "Experimental"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {isSpanish
                            ? "Conexión via código QR - solo desarrollo"
                            : "Connection via QR code - development only"}
                        </p>
                      </div>
                    </div>
                    {hasWhatsAppBaileys && (
                      <p className="text-xs text-green-600 mt-2">
                        ✅ {isSpanish ? "Conectado" : "Connected"}
                      </p>
                    )}
                  </div>

                  {/* Warning for Baileys */}
                  {!hasAnyWhatsApp && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                      <p className="text-orange-800">
                        <strong>⚠️</strong>{" "}
                        {isSpanish
                          ? "El método QR Code es experimental y puede ser inestable. Se recomienda usar WhatsApp Business para producción."
                          : "The QR Code method is experimental and may be unstable. WhatsApp Business is recommended for production."}
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* WhatsApp Baileys QR Code Dialog */}
            <Dialog
              open={isWhatsAppDialogOpen}
              onOpenChange={(open) => {
                setIsWhatsAppDialogOpen(open);
                if (!open) {
                  if (baileysPollingInterval) {
                    clearInterval(baileysPollingInterval);
                    setBaileysPollingInterval(null);
                  }
                  setBaileysQrCode(null);
                  setBaileysStatus("disconnected");
                  setIsBaileysConnecting(false);
                }
              }}
            >
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                    {isSpanish ? "Conectar WhatsApp" : "Connect WhatsApp"}
                  </DialogTitle>
                  <DialogDescription>
                    {isSpanish
                      ? "Escanea el código QR con tu app de WhatsApp"
                      : "Scan the QR code with your WhatsApp app"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {baileysStatus === "connected" ? (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-green-700 font-medium">
                        {isSpanish ? "¡Conectado!" : "Connected!"}
                      </p>
                      {baileysPhone && (
                        <p className="text-sm text-gray-500">{baileysPhone}</p>
                      )}
                      <Button
                        variant="outline"
                        onClick={handleBaileysDisconnect}
                        className="text-red-600"
                      >
                        {isSpanish ? "Desconectar" : "Disconnect"}
                      </Button>
                    </div>
                  ) : baileysStatus === "qr_ready" && baileysQrCode ? (
                    <div className="text-center space-y-4">
                      <div className="bg-white p-4 rounded-lg inline-block mx-auto">
                        <img
                          src={baileysQrCode}
                          alt="WhatsApp QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        {isSpanish
                          ? "Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo"
                          : "Open WhatsApp → Linked Devices → Link a Device"}
                      </p>
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                      <p className="text-xs text-gray-400">
                        {isSpanish
                          ? "Esperando escaneo..."
                          : "Waiting for scan..."}
                      </p>
                    </div>
                  ) : baileysStatus === "connecting" || isBaileysConnecting ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-500" />
                      <p className="mt-4 text-gray-500">
                        {isSpanish
                          ? "Generando código QR..."
                          : "Generating QR code..."}
                      </p>
                    </div>
                  ) : baileysStatus === "error" ? (
                    <div className="text-center space-y-4 py-4">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <X className="h-8 w-8 text-red-600" />
                      </div>
                      <p className="text-red-600">
                        {isSpanish ? "Error de conexión" : "Connection error"}
                      </p>
                      <Button onClick={handleBaileysConnect}>
                        {isSpanish ? "Reintentar" : "Try Again"}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 py-4">
                      <p className="text-sm text-gray-500 mb-4">
                        {isSpanish
                          ? "Conecta tu WhatsApp personal escaneando un código QR. Esta es una opción experimental."
                          : "Connect your personal WhatsApp by scanning a QR code. This is an experimental option."}
                      </p>
                      <Button
                        onClick={handleBaileysConnect}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isBaileysConnecting}
                      >
                        {isBaileysConnecting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isSpanish ? "Iniciando..." : "Starting..."}
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {isSpanish
                              ? "Generar Código QR"
                              : "Generate QR Code"}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* STEP 5: Posting Frequency Configuration */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                {isSpanish ? "Frecuencia de Publicación" : "Posting Frequency"}
              </CardTitle>
              <CardDescription>
                {isSpanish
                  ? "Configura cuándo y con qué frecuencia quieres publicar en cada plataforma"
                  : "Configure when and how often you want to post on each platform"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 dark:bg-purple-800 rounded-full p-2">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-800 dark:text-purple-200">
                      {isSpanish
                        ? "Define tu calendario de publicación para cada red social"
                        : "Set your posting schedule for each social network"}
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      {isSpanish
                        ? "La IA usará esta configuración para planificar tu contenido automáticamente"
                        : "AI will use this setting to automatically plan your content"}
                    </p>
                  </div>
                </div>
              </div>
              {/* AI Suggestion Banner */}
              {!isEditingFrequency && postingSchedules.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {isSpanish ? "Sugerencia de IA" : "AI Suggestion"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {isSpanish
                          ? "Basado en las mejores prácticas de la industria y horarios óptimos de engagement, hemos creado un calendario de publicación adaptado para maximizar tu alcance."
                          : "Based on industry best practices and optimal engagement times, we've created a posting schedule tailored for maximum reach."}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSavePostingFrequency}
                          disabled={isSavingFrequency}
                          data-testid="button-accept-frequency"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {isSavingFrequency
                            ? isSpanish
                              ? "Guardando..."
                              : "Saving..."
                            : isSpanish
                              ? "Aceptar Sugerencia"
                              : "Accept Suggestion"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingFrequency(true)}
                          data-testid="button-customize-frequency"
                        >
                          {isSpanish ? "Personalizar" : "Customize"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {postingSchedules.length === 0 && !isEditingFrequency && (
                <div className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                  <p className="text-gray-500 mt-4">
                    {isSpanish
                      ? "Generando sugerencias..."
                      : "Generating suggestions..."}
                  </p>
                </div>
              )}

              {/* Platform Schedules */}
              {postingSchedules.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {isSpanish
                        ? "Calendarios por Plataforma"
                        : "Platform Schedules"}
                    </h3>
                    {isEditingFrequency && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingFrequency(false)}
                        className="text-gray-500"
                      >
                        <X className="h-4 w-4 mr-1" />
                        {isSpanish ? "Cancelar" : "Cancel"}
                      </Button>
                    )}
                  </div>

                  {postingSchedules.map((schedule) => {
                    const getPlatformInfo = (platformId: string) => {
                      const platformConfigs: Record<
                        string,
                        { name: string; icon: any; color: string }
                      > = {
                        facebook: {
                          name: "Facebook",
                          icon: SiFacebook,
                          color: "text-blue-600",
                        },
                        instagram: {
                          name: "Instagram",
                          icon: Instagram,
                          color: "text-pink-500",
                        },
                        instagram_direct: {
                          name: "Instagram Direct",
                          icon: Instagram,
                          color: "text-pink-500",
                        },
                        whatsapp: {
                          name: "WhatsApp",
                          icon: SiWhatsapp,
                          color: "text-green-500",
                        },
                        whatsapp_baileys: {
                          name: "WhatsApp",
                          icon: SiWhatsapp,
                          color: "text-green-500",
                        },
                        tiktok: {
                          name: "TikTok",
                          icon: SiTiktok,
                          color: "text-gray-800 dark:text-white",
                        },
                        youtube: {
                          name: "YouTube",
                          icon: SiYoutube,
                          color: "text-red-600",
                        },
                      };
                      return (
                        platformConfigs[platformId] || {
                          name: platformId,
                          icon: Globe,
                          color: "text-gray-500",
                        }
                      );
                    };

                    const platformInfo = getPlatformInfo(schedule.platform);
                    const Icon = platformInfo.icon;

                    const daysOfWeek = [
                      { id: "monday", name: isSpanish ? "Lun" : "Mon" },
                      { id: "tuesday", name: isSpanish ? "Mar" : "Tue" },
                      { id: "wednesday", name: isSpanish ? "Mié" : "Wed" },
                      { id: "thursday", name: isSpanish ? "Jue" : "Thu" },
                      { id: "friday", name: isSpanish ? "Vie" : "Fri" },
                      { id: "saturday", name: isSpanish ? "Sáb" : "Sat" },
                      { id: "sunday", name: isSpanish ? "Dom" : "Sun" },
                    ];

                    return (
                      <div
                        key={schedule.platform}
                        className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800"
                        data-testid={`schedule-${schedule.platform}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${platformInfo.color}`} />
                            <span className="font-medium">
                              {platformInfo.name}
                            </span>
                            <Badge
                              variant="default"
                              className="ml-2 bg-green-600 text-white hover:bg-green-700"
                            >
                              {isSpanish ? "Conectada" : "Connected"}
                            </Badge>

                            <Badge variant="secondary" className="ml-2">
                              {schedule.postsPerWeek}{" "}
                              {isSpanish ? "posts/semana" : "posts/week"}
                            </Badge>
                          </div>
                        </div>

                        {/* Days of Week Selection */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-600 dark:text-gray-400">
                            {isSpanish
                              ? "Días de publicación:"
                              : "Posting Days:"}
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => {
                              const isSelected = schedule.selectedDays.includes(
                                day.id,
                              );
                              return (
                                <button
                                  key={day.id}
                                  onClick={() => {
                                    if (!isEditingFrequency) return;
                                    setPostingSchedules((prev) =>
                                      prev.map((s) => {
                                        if (s.platform !== schedule.platform)
                                          return s;
                                        const days = s.selectedDays.includes(
                                          day.id,
                                        )
                                          ? s.selectedDays.filter(
                                              (d) => d !== day.id,
                                            )
                                          : [...s.selectedDays, day.id];
                                        return {
                                          ...s,
                                          selectedDays: days,
                                          postsPerWeek: days.length,
                                        };
                                      }),
                                    );
                                  }}
                                  disabled={!isEditingFrequency}
                                  className={`
                                    px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                                    ${
                                      isSelected
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                    }
                                    ${
                                      isEditingFrequency
                                        ? "hover:opacity-80 cursor-pointer"
                                        : "opacity-50 cursor-not-allowed"
                                    }
                                  `}
                                  data-testid={`day-${schedule.platform}-${day.id}`}
                                >
                                  {day.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex-1"
                  data-testid="button-prev-step-5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {isSpanish ? "Anterior" : "Previous"}
                </Button>
                {isEditingFrequency ? (
                  <Button
                    type="button"
                    onClick={handleSavePostingFrequency}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isSavingFrequency}
                    data-testid="button-save-frequency"
                  >
                    {isSavingFrequency ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isSpanish ? "Guardando..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {isSpanish ? "Guardar y Finalizar" : "Save & Finish"}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSkipFrequency}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-skip-frequency"
                  >
                    {isSpanish ? "Omitir por Ahora" : "Skip for Now"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
