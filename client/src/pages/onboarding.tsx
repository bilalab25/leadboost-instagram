import { useState, useEffect } from "react";
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
  RefreshCw,
  Instagram,
  Facebook,
  Youtube,
  LayoutGrid,
  DollarSign,
  BriefcaseBusiness,
  Share2,
  Plus,
  Type,
  FileText,
  Download,
  Loader2,
  MessageCircle,
} from "lucide-react";

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
  { value: "marketing_banners", label: "Marketing Banners" },
  { value: "document_templates", label: "Document Templates" },
  { value: "videos", label: "Videos" },
  { value: "logos", label: "Other Logos/Icons" },
  { value: "general", label: "General Assets" },
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
    description: "Connect your Instagram account for posts and analytics",
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
    description: "Connect WhatsApp Business for customer messaging",
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
  industry: z.string().optional(),
  description: z.string().optional(),
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
  createdBrandId: number | null;
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
  const [mode, setMode] = useState<"choose" | "create" | "join">(savedState?.mode || "choose");
  const [currentStep, setCurrentStep] = useState(savedState?.currentStep || 1);
  const [createdBrandId, setCreatedBrandId] = useState<number | null>(savedState?.createdBrandId || null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isSpanish } = useLanguage();
  const { refreshBrands, brands, setActiveBrandId, activeBrandId } = useBrand();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClientInstance = useQueryClient();

  useEffect(() => {
    if (mode === "create" && createdBrandId) {
      saveOnboardingState({ mode, currentStep, createdBrandId });
    }
  }, [mode, currentStep, createdBrandId]);

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

  // Integration state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

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

  const { data: integrations = [], isLoading: isIntegrationsLoading, refetch: refetchIntegrations } = useQuery<Integration[]>({
    queryKey: ["/api/integrations", effectiveBrandId],
    enabled: !!effectiveBrandId && currentStep >= 4,
    queryFn: async () => {
      const res = await fetch(`/api/integrations?brandId=${effectiveBrandId}`);
      if (!res.ok) return [];
      return res.json();
    },
    retry: false,
  });

  // Handle connecting integrations (OAuth flow)
  const handleConnect = (provider: string) => {
    if (!effectiveBrandId) {
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "No se encontró la marca"
          : "Brand not found",
        variant: "destructive",
      });
      return;
    }

    setConnectingProvider(provider);
    let url = "";

    if (["facebook", "instagram", "threads"].includes(provider)) {
      url = `/api/integrations/facebook/connect?brandId=${effectiveBrandId}`;
    } else if (provider === "whatsapp") {
      url = `/api/integrations/whatsapp/connect?brandId=${effectiveBrandId}`;
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

    const popup = window.open(url, "_blank", "width=600,height=700");

    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        setConnectingProvider(null);
        window.location.reload();
      }
    }, 1000);
  };

  // Handle disconnecting integrations
  const handleDisconnect = async (integrationId: string) => {
    try {
      const res = await apiRequest("DELETE", `/api/integrations/${integrationId}`);
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
    },
  });

  const joinForm = useForm<JoinBrandForm>({
    resolver: zodResolver(joinBrandSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

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
      refreshBrands();

      // Set the created brand ID and advance to step 2
      if (data.brand?.id) {
        setCreatedBrandId(data.brand.id);
        setActiveBrandId(data.brand.id);
        setCurrentStep(2);
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

  // File upload handlers
  function uploadFileWithProgress(
    file: File,
    onProgress: (pct: number) => void,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", uploadPreset);

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
        else reject(new Error(`Upload failed: ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Upload error"));
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

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!brandDesign?.id) return;

    const inputEl = e.currentTarget;
    const files = Array.from(inputEl.files || []);

    for (const file of files) {
      const id = crypto.randomUUID();
      setUploads((prev) => [...prev, { id, name: file.name, percent: 0 }]);

      try {
        const data = await uploadFileWithProgress(file, (pct) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, percent: pct } : u)),
          );
        });

        if (data.secure_url) {
          await saveAssetToDB({
            id,
            url: data.secure_url,
            name: file.name,
            category: currentAssetUploadCategory,
            assetType: getAssetType(file.name),
            publicId: data.public_id,
          });
        }
      } finally {
        setUploads((prev) => prev.filter((u) => u.id !== id));
      }
    }

    inputEl.value = "";
    await queryClientInstance.invalidateQueries({
      queryKey: ["/api/brand-assets", createdBrandId, brandDesign.id],
    });
  };

  const saveAssetToDB = async (asset: BrandAsset) => {
    const payload = {
      brandDesignId: brandDesign?.id,
      url: asset.url,
      name: asset.name,
      category: asset.category,
      assetType: asset.assetType,
      publicId: asset.publicId,
    };

    await apiRequest(
      "POST",
      `/api/brand-assets?brandId=${createdBrandId}`,
      payload,
    );
  };

  const handleRemoveAsset = async (assetId: string) => {
    try {
      await apiRequest(
        "DELETE",
        `/api/brand-assets/${assetId}?brandId=${createdBrandId}`,
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
    createBrandMutation.mutate(data);
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
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinishOnboarding = async () => {
    clearOnboardingState();
    toast({
      title: isSpanish ? "¡Onboarding completado!" : "Onboarding complete!",
      description: isSpanish
        ? "Tu marca está lista para usar."
        : "Your brand is ready to use.",
    });
    setLocation("/dashboard");
  };

  // Show loading while checking authentication
  if (authLoading) {
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
              {isSpanish ? "Bienvenido a LeadBoost" : "Welcome to LeadBoost"}
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
        <StepIndicator currentStep={currentStep} totalSteps={4} />

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
                          {isSpanish ? "Industria" : "Industry"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={
                              isSpanish
                                ? "ej. Tecnología, Retail, Salud"
                                : "e.g. Technology, Retail, Healthcare"
                            }
                            data-testid="input-brand-industry"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isSpanish ? "Descripción" : "Description"}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={
                              isSpanish
                                ? "Cuéntanos sobre tu marca..."
                                : "Tell us about your brand..."
                            }
                            rows={3}
                            data-testid="textarea-brand-description"
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
                      disabled={createBrandMutation.isPending}
                      data-testid="button-next-step-1"
                    >
                      {createBrandMutation.isPending
                        ? isSpanish
                          ? "Creando..."
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
                              <img
                                src={styleImages[style.id]}
                                alt={style.name}
                                className="w-full h-20 object-cover rounded-md shadow-md"
                              />
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
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {/* White Logo */}
                        <div className="space-y-2">
                          <Label>
                            {isSpanish ? "Logo Claro" : "White Logo"}
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
                                    accept="image/*"
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

                        {/* Black Logo */}
                        <div className="space-y-2">
                          <Label>
                            {isSpanish ? "Logo Oscuro" : "Black Logo"}
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
                                    accept="image/*"
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

                        {/* White Favicon */}
                        <div className="space-y-2">
                          <Label>
                            {isSpanish ? "Favicon Claro" : "White Favicon"}
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
                                    accept="image/*"
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

                        {/* Black Favicon */}
                        <div className="space-y-2">
                          <Label>
                            {isSpanish ? "Favicon Oscuro" : "Black Favicon"}
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
                                    accept="image/*"
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
                                      setCurrentAssetUploadCategory(
                                        category.value,
                                      );
                                      handleAssetUpload(e);
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
                                        onClick={() =>
                                          handleRemoveAsset(asset.id)
                                        }
                                        className="m-1"
                                      >
                                        <Trash2 className="h-4 w-4" />
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
                  data-testid="button-next-step-3"
                >
                  {isSpanish ? "Siguiente" : "Next"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Integrations Setup */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Link className="w-6 h-6" />
                {isSpanish ? "Configurar Integraciones" : "Setup Integrations"}
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
                                  const connectedIntegration = integrations.find(
                                    (int) =>
                                      int.provider === providerKey && int.isActive
                                  );
                                  const isConnecting = connectingProvider === providerKey;

                                  return (
                                    <div
                                      key={providerKey}
                                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                      data-testid={`integration-${providerKey}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <ProviderIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
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
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      {connectedIntegration ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleDisconnect(connectedIntegration.id)
                                          }
                                          className="text-red-600 border-red-400 hover:bg-red-50"
                                          data-testid={`disconnect-${providerKey}`}
                                        >
                                          {isSpanish ? "Desconectar" : "Disconnect"}
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={() => handleConnect(providerKey)}
                                          disabled={isConnecting}
                                          data-testid={`connect-${providerKey}`}
                                        >
                                          {isConnecting ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              {isSpanish ? "Conectando..." : "Connecting..."}
                                            </>
                                          ) : (
                                            isSpanish ? "Conectar" : "Connect"
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
                <Button
                  type="button"
                  onClick={handleFinishOnboarding}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-finish-onboarding"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {isSpanish ? "Finalizar Onboarding" : "Finish Onboarding"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
