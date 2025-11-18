import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { useBrand } from "@/contexts/BrandContext";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2 } from "lucide-react";
import { useGoogleFontLoader } from "@/hooks/useGoogleFontLoader";
import HelpChatbot from "@/components/HelpChatbot";
import minimal from "./brand-images/minimalist.png";
import luxury from "./brand-images/luxury.png";
import fun from "./brand-images/fun.png";
import corporate from "./brand-images/corporate.png";
import creative from "./brand-images/creative.png";
import bold from "./brand-images/bold.png";
import BrandAssets from "@/components/brand-studio/BrandAssests";
import BrandIdentity from "@/components/brand-studio/BrandIdentity";
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Suponiendo que ya tienes las imágenes en /public/brand-styles o importadas
const styleImages: Record<string, string> = {
  minimalist: minimal,
  luxury: luxury,
  fun: fun,
  corporate: corporate,
  creative: creative,
  bold: bold,
};

interface BrandAsset {
  id: string; // Unique ID for the asset
  url: string;
  name: string;
  category: string; // New: Category for the asset
  assetType: "image" | "video" | "document"; // New: Type for rendering
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
    [key: string]: string; // Allow other properties
  };
  typography: {
    primary: string;
    secondary: string;
    customFonts?: { name: string; url: string }[];
  };
  // Legacy flat fields for backward compatibility
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
    assets: BrandAsset[]; // Assuming assets are part of brandKit
  };
}

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

// Helper to determine asset type
const getAssetType = (fileName: string): BrandAsset["assetType"] => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return "document"; // Default if no extension
  if (["jpeg", "jpg", "png", "gif", "svg", "webp"].includes(ext))
    return "image";
  if (["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) return "video";
  return "document";
};

export default function BrandStudio() {
  const { toast } = useToast();
  const { isSpanish } = useLanguage();
  const queryClient = useQueryClient();
  const { activeBrandId } = useBrand();

  const [selectedStyle, setSelectedStyle] = useState<string>("");
  // Replaced customColors with individual states for explicit control
  const [mainColor, setMainColor] = useState<string>("#2563eb"); // Default blue
  const [accentColor1, setAccentColor1] = useState<string>("#60a5fa"); // Default light blue
  const [accentColor2, setAccentColor2] = useState<string>("#1e40af"); // Default dark blue
  const [text1Color, setText1Color] = useState<string>("#333333"); // Default text1
  const [text2Color, setText2Color] = useState<string>("#666666"); // Default text2
  
  // Optional additional colors (can be dynamically added)
  const [accentColor3, setAccentColor3] = useState<string | null>(null);
  const [accentColor4, setAccentColor4] = useState<string | null>(null);
  const [text3Color, setText3Color] = useState<string | null>(null);
  const [text4Color, setText4Color] = useState<string | null>(null);
  
  // Control visibility of optional colors
  const [showAccentColor3, setShowAccentColor3] = useState(false);
  const [showAccentColor4, setShowAccentColor4] = useState(false);
  const [showText3Color, setShowText3Color] = useState(false);
  const [showText4Color, setShowText4Color] = useState(false);

  const [primaryFont, setPrimaryFont] = useState<string>("Roboto");
  const [secondaryFont, setSecondaryFont] = useState<string>("Open Sans");
  const [customFontFiles, setCustomFontFiles] = useState<
    { name: string; url: string; family: string }[]
  >([]);
  const [customFontOptions, setCustomFontOptions] = useState<string[]>([]); // To hold names of uploaded fonts

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

  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  type UploadItem = { id: string; name: string; percent: number };
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const [currentAssetUploadCategory, setCurrentAssetUploadCategory] =
    useState<string>(assetCategories[0].value); // Default category for new uploads

  // Fetch brand design
  const { data: brandDesign, isLoading } = useQuery<BrandDesign>({
    queryKey: ["/api/brand-design", activeBrandId],
    enabled: !!activeBrandId,
    retry: false,
  });

  const {
    data: assets = [],
    isLoading: isAssetsLoading,
    isFetching: isAssetsFetching,
    error: assetsError,
  } = useQuery<BrandAsset[]>({
    queryKey: ["/api/brand-assets", activeBrandId, brandDesign?.id],
    enabled: !!activeBrandId && !!brandDesign?.id,
    queryFn: async () => {
      console.log("🔎 QueryFn brand-assets → brandDesign.id:", brandDesign?.id);
      const url = `/api/brand-assets?brandDesignId=${brandDesign!.id}`;
      console.log("🌐 GET", url);
      const res = await apiRequest("GET", url);

      // Lee texto crudo para ver si el server devuelve HTML/errores
      const text = await res.text();
      console.log("⬅️  RAW RESPONSE /api/brand-assets:", text);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${text}`);
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("❌ JSON.parse falló con:", text);
        throw e;
      }
    },
    retry: false,
  });

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

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!brandDesign?.id) return;

    const inputEl = e.currentTarget; // ✅ capturado antes de awaits
    const files = Array.from(inputEl.files || []); // lee los files desde el input capturado

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
          await saveAssetToDB(
            {
              id,
              url: data.secure_url,
              name: file.name,
              category: currentAssetUploadCategory,
              assetType: getAssetType(file.name),
              publicId: data.public_id,
            },
            data,
          );
        }
      } finally {
        setUploads((prev) => prev.filter((u) => u.id !== id));
      }
    }

    // ✅ usa la referencia capturada, no 'e'
    inputEl.value = "";
    await queryClient.invalidateQueries({
      queryKey: ["/api/brand-assets", activeBrandId, brandDesign.id],
    });
  };

  useEffect(() => {
    console.log("📦 assets (query data):", assets);
    console.log(
      "⏳ isAssetsLoading:",
      isAssetsLoading,
      "isAssetsFetching:",
      isAssetsFetching,
    );
    if (assetsError) console.error("🧨 assetsError:", assetsError);
  }, [assets, isAssetsLoading, isAssetsFetching, assetsError]);

  useGoogleFontLoader([primaryFont, secondaryFont]);

  // Effect to initialize states when brandDesign data is loaded
  useEffect(() => {
    console.log("Brand Design Data:", brandDesign);
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
        
        // Initialize optional colors if they exist
        if (brandDesign.colorAccent3) {
          setAccentColor3(brandDesign.colorAccent3);
          setShowAccentColor3(true);
        }
        if (brandDesign.colorAccent4) {
          setAccentColor4(brandDesign.colorAccent4);
          setShowAccentColor4(true);
        }
        if (brandDesign.colorText3) {
          setText3Color(brandDesign.colorText3);
          setShowText3Color(true);
        }
        if (brandDesign.colorText4) {
          setText4Color(brandDesign.colorText4);
          setShowText4Color(true);
        }
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
        if (brandDesign.typography?.customFonts) {
          const loadedCustomFontNames = brandDesign.typography.customFonts.map(
            (f: any) => f.name,
          );
          setCustomFontOptions((prev) => [
            ...new Set([...prev, ...loadedCustomFontNames]),
          ]);
        }
      }

      if (brandDesign.brandStyle) {
        setSelectedStyle(brandDesign.brandStyle);
      }
      if (brandDesign.colorPalette) {
        setMainColor(brandDesign.colorPalette.primary || "#2563eb");
        setAccentColor1(brandDesign.colorPalette.accent1 || "#60a5fa");
        setAccentColor2(brandDesign.colorPalette.accent2 || "#1e40af");
        setText1Color(brandDesign.colorPalette.text1 || "#333333");
        setText2Color(brandDesign.colorPalette.text2 || "#666666");
      }
      if (brandDesign.typography) {
        setPrimaryFont(brandDesign.typography.primary || "Roboto");
        setSecondaryFont(brandDesign.typography.secondary || "Open Sans");
        if (
          brandDesign.typography.customFonts &&
          Array.isArray(brandDesign.typography.customFonts)
        ) {
          // For simplicity, we're just adding the names to the options here.
          // A full solution would involve fetching these font files if their URLs are persistent.
          const loadedCustomFontNames = brandDesign.typography.customFonts.map(
            (f: any) => f.name,
          );
          setCustomFontOptions((prev) => [
            ...new Set([...prev, ...loadedCustomFontNames]),
          ]);
        }
      }
      if (
        brandDesign.brandKit &&
        brandDesign.brandKit.assets &&
        Array.isArray(brandDesign.brandKit.assets)
      ) {
        setBrandAssets(brandDesign.brandKit.assets);
      }
      // Load existing logo/favicon URLs from brandDesign
      setWhiteLogoPreviewUrl(brandDesign.whiteLogoUrl || null);
      setBlackLogoPreviewUrl(brandDesign.blackLogoUrl || null);
      setWhiteFaviconPreviewUrl(brandDesign.whiteFaviconUrl || null);
      setBlackFaviconPreviewUrl(brandDesign.blackFaviconUrl || null);
    }
  }, [brandDesign]);

  // Effect to inject custom font styles
  useEffect(() => {
    let styleTag = document.getElementById("custom-fonts-style");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "custom-fonts-style";
      document.head.appendChild(styleTag);
    }

    let cssRules = "";
    customFontFiles.forEach((font) => {
      cssRules += `
        @font-face {
          font-family: "${font.family}";
          src: url("${font.url}") format("woff2"), url("${font.url}") format("woff"), url("${font.url}") format("truetype");
          font-weight: normal;
          font-style: normal;
        }
      `;
    });
    styleTag.innerHTML = cssRules;

    return () => {
      // Clean up URLs when component unmounts or fonts change
      customFontFiles.forEach((font) => URL.revokeObjectURL(font.url));
    };
  }, [customFontFiles]);

  // Design Studio activation
  const activateDesignStudioMutation = useMutation({
    mutationFn: async () => {
      if (!activeBrandId) throw new Error("No active brand");
      // Activate native LeadBoost Design Studio
      const response = await apiRequest(
        "POST",
        "/api/brand-design/activate-studio",
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-design", activeBrandId] });
      toast({
        title: isSpanish ? "¡Activado!" : "Activated!",
        description: isSpanish
          ? "Design Studio activado exitosamente"
          : "Design Studio activated successfully",
      });
    },
  });

  // Save brand design
  const saveBrandDesignMutation = useMutation({
    mutationFn: async (designData: any) => {
      if (!activeBrandId) throw new Error("No active brand");
      const response = await apiRequest(
        "POST",
        "/api/brand-design",
        designData,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-design", activeBrandId] });
      toast({
        title: isSpanish ? "¡Guardado!" : "Saved!",
        description: isSpanish
          ? "Diseño de marca guardado"
          : "Brand design saved",
      });
    },
  });

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
  };

  const handleSaveBrandDesign = async () => {
    try {
      const uploadIfNeeded = async (
        file: File | null,
        currentUrl: string | null,
        setPreviewUrl: (url: string | null) => void,
      ): Promise<string | null> => {
        // Si hay file pero aún no está en Cloudinary, súbelo
        if (file && (!currentUrl || !currentUrl.startsWith("http"))) {
          const data = await uploadFileWithProgress(file, () => {});
          if (data.secure_url) {
            setPreviewUrl(data.secure_url);
            return data.secure_url;
          }
        }
        // Si ya hay URL, úsala
        return currentUrl;
      };

      // Sube logos/favicons si son nuevos
      const whiteLogoUrl = await uploadIfNeeded(
        whiteLogoFile,
        whiteLogoPreviewUrl,
        setWhiteLogoPreviewUrl,
      );
      const blackLogoUrl = await uploadIfNeeded(
        blackLogoFile,
        blackLogoPreviewUrl,
        setBlackLogoPreviewUrl,
      );
      const whiteFaviconUrl = await uploadIfNeeded(
        whiteFaviconFile,
        whiteFaviconPreviewUrl,
        setWhiteFaviconPreviewUrl,
      );
      const blackFaviconUrl = await uploadIfNeeded(
        blackFaviconFile,
        blackFaviconPreviewUrl,
        setBlackFaviconPreviewUrl,
      );

      // Arma el objeto final
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
        logoUrl: whiteLogoUrl, // compatibilidad con campo legacy
        whiteLogoUrl,
        blackLogoUrl,
        whiteFaviconUrl,
        blackFaviconUrl,
        brandKit: {
          assets: brandAssets.map((asset) => ({
            id: asset.id,
            url: asset.url,
            name: asset.name,
            category: asset.category,
            assetType: asset.assetType,
          })),
        },
      };

      // Add optional colors (send null if removed to clear database)
      designData.colorAccent3 = accentColor3;
      designData.colorAccent4 = accentColor4;
      designData.colorText3 = text3Color;
      designData.colorText4 = text4Color;

      // Llama tu mutation
      saveBrandDesignMutation.mutate(designData);
    } catch (err) {
      console.error("❌ Error saving design:", err);
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "No se pudo guardar el diseño"
          : "Failed to save brand design",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <TopHeader
            pageName={isSpanish ? "Estudio de Marca" : "Brand Studio"}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Function to generate a random hexadecimal color
  const generateRandomHexColor = () => {
    const randomHex = () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0");
    return `#${randomHex()}${randomHex()}${randomHex()}`;
  };

  // Function to generate a random color palette
  const handleGenerateRandomPalette = () => {
    setMainColor(generateRandomHexColor());
    setAccentColor1(generateRandomHexColor());
    setAccentColor2(generateRandomHexColor());
    setText1Color(generateRandomHexColor()); // Generate for text colors too
    setText2Color(generateRandomHexColor()); // Generate for text colors too
    toast({
      title: "Palette Generated",
      description: "A new random color palette has been generated.",
    });
  };

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
      toast({
        title: isSpanish ? "Archivo cargado" : "File selected",
        description: isSpanish
          ? "El archivo está listo para subir al guardar"
          : "The file will be uploaded when you save.",
      });
    } else {
      setPreviewUrl(null);
    }
  };

  const saveAssetToDB = async (asset: BrandAsset, cloudinaryData: any) => {
    const payload = {
      brandDesignId: brandDesign?.id,
      url: asset.url,
      name: asset.name,
      category: asset.category,
      assetType: asset.assetType,
      publicId: cloudinaryData.public_id,
    };
    const res = await apiRequest("POST", "/api/brand-assets", payload);
    const data = await res.json();
    return data;
  };

  const handleRemoveAsset = async (id: string) => {
    try {
      const res = await apiRequest(
        "DELETE",
        `/api/brand-assets/${id}?brandDesignId=${brandDesign?.id}`,
      );

      if (res.ok) {
        toast({
          title: isSpanish ? "Asset Eliminado" : "Asset Deleted",
          description: isSpanish
            ? "El asset se ha eliminado exitosamente."
            : "The asset has been successfully deleted.",
        });

        // Refresh the assets list
        await queryClient.invalidateQueries({
          queryKey: ["/api/brand-assets", brandDesign?.id],
        });
      } else {
        const error = await res.json();
        toast({
          title: isSpanish ? "Error" : "Error",
          description:
            error.message ||
            (isSpanish
              ? "No se pudo eliminar el asset"
              : "Failed to delete asset"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast({
        title: isSpanish ? "Error" : "Error",
        description: isSpanish
          ? "No se pudo eliminar el asset"
          : "Failed to delete asset",
        variant: "destructive",
      });
    }
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFonts = files.map((file) => {
      const fontName = file.name.split(".").slice(0, -1).join("."); // Get name without extension
      const fontUrl = URL.createObjectURL(file);
      return { name: file.name, url: fontUrl, family: fontName };
    });

    setCustomFontFiles((prev) => [...prev, ...newFonts]);
    setCustomFontOptions((prev) => [...prev, ...newFonts.map((f) => f.family)]);
    toast({
      title: isSpanish ? "Fuente(s) Subida(s)" : "Font(s) Uploaded",
      description: isSpanish
        ? "Las fuentes se han añadido a tu selección."
        : "Fonts have been added to your selection.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName={isSpanish ? "Estudio de Marca" : "Brand Studio"} />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Tabs defaultValue="brand-identity" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="brand-identity"
                      data-testid="tab-brand-identity"
                    >
                      {isSpanish ? "Identidad" : "Identity"}
                    </TabsTrigger>
                    <TabsTrigger value="assets" data-testid="tab-assets">
                      {isSpanish ? "Recursos" : "Assets"}
                    </TabsTrigger>
                  </TabsList>

                  {/* Brand Identity Tab */}
                  <BrandIdentity
                    brandDesign={brandDesign}
                    brandStyles={brandStyles}
                    selectedStyle={selectedStyle}
                    handleStyleSelect={handleStyleSelect}
                    styleImages={styleImages}
                    mainColor={mainColor}
                    setMainColor={setMainColor}
                    accentColor1={accentColor1}
                    setAccentColor1={setAccentColor1}
                    accentColor2={accentColor2}
                    setAccentColor2={setAccentColor2}
                    text1Color={text1Color}
                    setText1Color={setText1Color}
                    text2Color={text2Color}
                    setText2Color={setText2Color}
                    accentColor3={accentColor3}
                    setAccentColor3={setAccentColor3}
                    accentColor4={accentColor4}
                    setAccentColor4={setAccentColor4}
                    text3Color={text3Color}
                    setText3Color={setText3Color}
                    text4Color={text4Color}
                    setText4Color={setText4Color}
                    showAccentColor3={showAccentColor3}
                    setShowAccentColor3={setShowAccentColor3}
                    showAccentColor4={showAccentColor4}
                    setShowAccentColor4={setShowAccentColor4}
                    showText3Color={showText3Color}
                    setShowText3Color={setShowText3Color}
                    showText4Color={showText4Color}
                    setShowText4Color={setShowText4Color}
                    handleGenerateRandomPalette={handleGenerateRandomPalette}
                    primaryFont={primaryFont}
                    setPrimaryFont={setPrimaryFont}
                    secondaryFont={secondaryFont}
                    setSecondaryFont={setSecondaryFont}
                    customFontFiles={customFontFiles}
                    setCustomFontFiles={setCustomFontFiles}
                    handleFontUpload={handleFontUpload}
                    setCustomFontOptions={setCustomFontOptions}
                    handleSaveBrandDesign={handleSaveBrandDesign}
                    saveBrandDesignMutation={saveBrandDesignMutation}
                    handleFileUpload={handleFileUpload}
                    whiteLogoFile={whiteLogoFile}
                    setWhiteLogoFile={setWhiteLogoFile}
                    whiteLogoPreviewUrl={whiteLogoPreviewUrl}
                    setWhiteLogoPreviewUrl={setWhiteLogoPreviewUrl}
                    blackLogoFile={blackLogoFile}
                    setBlackLogoFile={setBlackLogoFile}
                    blackLogoPreviewUrl={blackLogoPreviewUrl}
                    setBlackLogoPreviewUrl={setBlackLogoPreviewUrl}
                    whiteFaviconFile={whiteFaviconFile}
                    setWhiteFaviconFile={setWhiteFaviconFile}
                    whiteFaviconPreviewUrl={whiteFaviconPreviewUrl}
                    setWhiteFaviconPreviewUrl={setWhiteFaviconPreviewUrl}
                    blackFaviconFile={blackFaviconFile}
                    setBlackFaviconFile={setBlackFaviconFile}
                    blackFaviconPreviewUrl={blackFaviconPreviewUrl}
                    setBlackFaviconPreviewUrl={setBlackFaviconPreviewUrl}
                  />

                  {/* Assets Tab */}
                  <BrandAssets
                    assets={assets}
                    assetCategories={assetCategories}
                    currentAssetUploadCategory={currentAssetUploadCategory}
                    setCurrentAssetUploadCategory={
                      setCurrentAssetUploadCategory
                    }
                    handleAssetUpload={handleAssetUpload}
                    handleRemoveAsset={handleRemoveAsset}
                    uploads={uploads}
                  />
                </Tabs>
              </div>
            </div>
            {/* Help AI Chatbot */}
            <HelpChatbot />
          </main>
        </div>
      </div>
    </div>
  );
}
