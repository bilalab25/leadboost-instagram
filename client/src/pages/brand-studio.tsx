import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Palette,
  Type,
  Image,
  Sparkles,
  Upload,
  Download,
  Trash2,
  FileText,
} from "lucide-react";
import ColorPicker from "@/components/brand-studio/ColorPicker";
import ColorPreviewWithPicker from "@/components/brand-studio/ColorPreviewWithPicker";

interface BrandAsset {
  id: string; // Unique ID for the asset
  url: string;
  name: string;
  category: string; // New: Category for the asset
  assetType: "image" | "video" | "document"; // New: Type for rendering
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
  logoUrl: string | null;
  isDesignStudioEnabled: boolean;
  brandKit: {
    assets: BrandAsset[]; // Assuming assets are part of brandKit
  };
}

// Predefined options for fonts, sectors, and purposes
const fontOptions = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Oswald",
  "Source Sans Pro",
  "Nunito",
  "Arial",
  "Verdana",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Pacifico",
  "Roboto Condensed",
  "Ubuntu",
  "Lora",
  "Merriweather",
];

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

const colorPalettes = {
  minimalist: {
    primary: "#000000",
    secondary: "#666666",
    accent: "#ffffff",
    neutral: "#f5f5f5",
    text1: "#333333", // Added
    text2: "#999999", // Added
  },
  luxury: {
    primary: "#1a1a1a",
    secondary: "#d4af37",
    accent: "#ffffff",
    neutral: "#f8f8f8",
    text1: "#000000", // Added
    text2: "#aaaaaa", // Added
  },
  fun: {
    primary: "#ff6b6b",
    secondary: "#4ecdc4",
    accent: "#45b7d1",
    neutral: "#fff9e6",
    text1: "#333333", // Added
    text2: "#666666", // Added
  },
  corporate: {
    primary: "#2563eb",
    secondary: "#1e40af",
    accent: "#60a5fa",
    neutral: "#f1f5f9",
    text1: "#222222", // Added
    text2: "#555555", // Added
  },
  creative: {
    primary: "#8b5cf6",
    secondary: "#ec4899",
    accent: "#f59e0b",
    neutral: "#fdf4ff",
    text1: "#111111", // Added
    text2: "#444444", // Added
  },
  bold: {
    primary: "#dc2626",
    secondary: "#000000",
    accent: "#fbbf24",
    neutral: "#fef2f2",
    text1: "#000000", // Added
    text2: "#333333", // Added
  },
};

const fontPairings = {
  minimalist: { primary: "Inter", secondary: "Source Sans Pro" },
  luxury: { primary: "Playfair Display", secondary: "Lato" },
  fun: { primary: "Poppins", secondary: "Open Sans" },
  corporate: { primary: "Roboto", secondary: "Arial" },
  creative: { primary: "Montserrat", secondary: "Nunito" },
  bold: { primary: "Oswald", secondary: "Roboto Condensed" },
};

const assetCategories = [
  { value: "product_images", label: "Product Images" },
  { value: "marketing_banners", label: "Marketing Banners" },
  { value: "document_templates", label: "Document Templates" },
  { value: "videos", label: "Videos" },
  { value: "logos", label: "Logos/Icons" },
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, isSpanish } = useLanguage();
  const queryClient = useQueryClient();

  const [selectedStyle, setSelectedStyle] = useState<string>("");
  // Replaced customColors with individual states for explicit control
  const [mainColor, setMainColor] = useState<string>("#2563eb"); // Default blue
  const [accentColor1, setAccentColor1] = useState<string>("#60a5fa"); // Default light blue
  const [accentColor2, setAccentColor2] = useState<string>("#1e40af"); // Default dark blue
  const [text1Color, setText1Color] = useState<string>("#333333"); // Default text1
  const [text2Color, setText2Color] = useState<string>("#666666"); // Default text2

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

  const [currentAssetUploadCategory, setCurrentAssetUploadCategory] =
    useState<string>(assetCategories[0].value); // Default category for new uploads

  // Fetch brand design
  const { data: brandDesign, isLoading } = useQuery<BrandDesign>({
    queryKey: ["/api/brand-design"],
    retry: false,
  });

  // Effect to initialize states when brandDesign data is loaded
  useEffect(() => {
    if (brandDesign) {
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
      // You might also want to load existing logo/favicon URLs here if they are part of brandDesign
      // setWhiteLogoPreviewUrl(brandDesign.whiteLogoUrl || null);
      // ... and so on for other logos/favicons
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
      // Activate native LeadBoost Design Studio
      const response = await apiRequest(
        "POST",
        "/api/brand-design/activate-studio",
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-design"] });
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
      const response = await apiRequest(
        "POST",
        "/api/brand-design",
        designData,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brand-design"] });
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
    const selectedPalette =
      colorPalettes[styleId as keyof typeof colorPalettes];
    if (selectedPalette) {
      setMainColor(selectedPalette.primary);
      setAccentColor1(selectedPalette.accent); // Using accent for accent1
      setAccentColor2(selectedPalette.secondary); // Using secondary for accent2
      setText1Color(selectedPalette.text1);
      setText2Color(selectedPalette.text2);
    }
    const selectedFonts = fontPairings[styleId as keyof typeof fontPairings];
    if (selectedFonts) {
      setPrimaryFont(selectedFonts.primary);
      setSecondaryFont(selectedFonts.secondary);
    }
  };

  const handleSaveBrandDesign = () => {
    const designData = {
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
        })), // Include custom fonts
      },
      logoUrl: whiteLogoPreviewUrl, // Using whiteLogoPreviewUrl as the main logo for saving
      // You might want to save other logo URLs too:
      // whiteLogoUrl: whiteLogoPreviewUrl,
      // blackLogoUrl: blackLogoPreviewUrl,
      // whiteFaviconUrl: whiteFaviconPreviewUrl,
      // blackFaviconUrl: blackFaviconPreviewUrl,
      brandKit: {
        // Assuming brandKit is where assets are stored
        assets: brandAssets.map((asset) => ({
          id: asset.id,
          url: asset.url,
          name: asset.name,
          category: asset.category,
          assetType: asset.assetType,
        })),
      },
    };
    saveBrandDesignMutation.mutate(designData);
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
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const LogoUploadField = ({
    id,
    label,
    file,
    previewUrl,
    setFile,
    setPreviewUrl,
  }: {
    id: string;
    label: string;
    file: File | null;
    previewUrl: string | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <Upload className="mx-auto h-8 w-8 text-gray-400" />
        <div className="mt-2">
          <Label htmlFor={id} className="cursor-pointer">
            <span className="font-medium text-brand-600 hover:text-brand-500">
              Upload {label.toLowerCase()}
            </span>
            <input
              id={id}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFileUpload(e, setFile, setPreviewUrl)}
              data-testid={`input-${id}`}
            />
          </Label>
        </div>
        {(file || previewUrl) && (
          <div className="mt-2 flex flex-col items-center">
            {file && (
              <Badge variant="secondary" className="mb-1">
                {file.name}
              </Badge>
            )}
            {previewUrl && (
              <img
                src={previewUrl}
                alt={`${label} Preview`}
                className="max-h-24 max-w-full object-contain mt-1 border rounded-md"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
              }}
              className="mt-2 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAssets: BrandAsset[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Simple unique ID
      url: URL.createObjectURL(file),
      name: file.name,
      category: currentAssetUploadCategory, // Use the currently selected category
      assetType: getAssetType(file.name),
    }));
    setBrandAssets((prev) => [...prev, ...newAssets]);
  };

  const handleRemoveAsset = (id: string) => {
    setBrandAssets((prev) => prev.filter((asset) => asset.id !== id));
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

  const availableFontOptions = [...fontOptions, ...customFontOptions];

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
                  <TabsContent value="brand-identity" className="space-y-6">
                    {/* Brand Style Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Sparkles className="mr-2 h-5 w-5" />
                          {isSpanish ? "Estilo de Marca" : "Brand Style"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          {brandStyles.map((style) => (
                            <div
                              key={style.id}
                              onClick={() => handleStyleSelect(style.id)}
                              className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                                selectedStyle === style.id
                                  ? "border-brand-500 ring-2 ring-brand-200"
                                  : "border-gray-200"
                              } ${style.color}`}
                              data-testid={`style-${style.id}`}
                            >
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {style.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {style.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Color Palette */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center">
                          <Palette className="mr-2 h-5 w-5" />
                          {isSpanish ? "Paleta de Colores" : "Color Palette"}
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateRandomPalette}
                          data-testid="button-generate-random-palette"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          {isSpanish ? "Generar Aleatorio" : "Generate Random"}
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                          <div>
                            <ColorPreviewWithPicker
                              label={
                                isSpanish ? "Color Principal" : "Main Color"
                              }
                              value={mainColor}
                              onChange={setMainColor}
                              allowGradient={true}
                            />
                          </div>

                          {/* Accent Color 1 */}
                          <div>
                            <ColorPreviewWithPicker
                              label={
                                isSpanish ? "Color Acento 1" : "Accent Color 1"
                              }
                              value={accentColor1}
                              onChange={setAccentColor1}
                              allowGradient={true}
                            />
                          </div>
                          {/* Accent Color 2 */}
                          <div>
                            <ColorPreviewWithPicker
                              label={
                                isSpanish ? "Color Acento 2" : "Accent Color 2"
                              }
                              value={accentColor2}
                              onChange={setAccentColor2}
                              allowGradient={true}
                            />
                          </div>
                          {/* Text Color 1 */}
                          <div>
                            <ColorPreviewWithPicker
                              label={
                                isSpanish ? "Color Texto 1" : "Text Color 1"
                              }
                              value={text1Color}
                              onChange={setText1Color}
                              allowGradient={false}
                            />
                          </div>
                          {/* Text Color 2 */}
                          <div>
                            <ColorPreviewWithPicker
                              label={
                                isSpanish ? "Color Texto 2" : "Text Color 2"
                              }
                              value={text2Color}
                              onChange={setText2Color}
                              allowGradient={false}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Typography */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Type className="mr-2 h-5 w-5" />
                          {isSpanish ? "Tipografía" : "Typography"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="primary-font-select">
                              {isSpanish ? "Fuente Principal" : "Primary Font"}
                            </Label>
                            <Select
                              value={primaryFont}
                              onValueChange={setPrimaryFont}
                            >
                              <SelectTrigger
                                id="primary-font-select"
                                className="w-full mt-2"
                                data-testid="select-primary-font"
                              >
                                <SelectValue placeholder="Select a font" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFontOptions.map((font) => (
                                  <SelectItem
                                    key={font}
                                    value={font}
                                    style={{ fontFamily: font }}
                                  >
                                    {font}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div
                              className="mt-2 p-4 border rounded-lg text-2xl font-bold"
                              style={{ fontFamily: primaryFont }}
                            >
                              {primaryFont}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="secondary-font-select">
                              {isSpanish
                                ? "Fuente Secundaria"
                                : "Secondary Font"}
                            </Label>
                            <Select
                              value={secondaryFont}
                              onValueChange={setSecondaryFont}
                            >
                              <SelectTrigger
                                id="secondary-font-select"
                                className="w-full mt-2"
                                data-testid="select-secondary-font"
                              >
                                <SelectValue placeholder="Select a font" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFontOptions.map((font) => (
                                  <SelectItem
                                    key={font}
                                    value={font}
                                    style={{ fontFamily: font }}
                                  >
                                    {font}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div
                              className="mt-2 p-4 border rounded-lg text-lg"
                              style={{ fontFamily: secondaryFont }}
                            >
                              {secondaryFont}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Custom Font Uploads */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Upload className="mr-2 h-5 w-5" />
                          {isSpanish
                            ? "Subir Fuentes Personalizadas"
                            : "Upload Custom Fonts"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <Label
                              htmlFor="font-upload"
                              className="cursor-pointer"
                            >
                              <span className="font-medium text-brand-600 hover:text-brand-500">
                                {isSpanish
                                  ? "Subir archivo(s) de fuente"
                                  : "Upload font file(s)"}
                              </span>
                              <input
                                id="font-upload"
                                type="file"
                                accept=".ttf,.otf,.woff,.woff2" // Common font formats
                                multiple
                                className="sr-only"
                                onChange={handleFontUpload}
                                data-testid="input-font-upload"
                              />
                            </Label>
                            <p className="text-sm text-gray-500 mt-1">
                              {isSpanish
                                ? "Archivos .ttf, .otf, .woff, .woff2"
                                : ".ttf, .otf, .woff, .woff2 files"}
                            </p>
                          </div>
                        </div>
                        {customFontFiles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="font-semibold">
                              {isSpanish
                                ? "Fuentes Subidas:"
                                : "Uploaded Fonts:"}
                            </h4>
                            {customFontFiles.map((font) => (
                              <div
                                key={font.name}
                                className="flex items-center justify-between p-2 border rounded-md"
                              >
                                <span
                                  className="text-sm"
                                  style={{ fontFamily: font.family }}
                                >
                                  {font.family} ({font.name})
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setCustomFontFiles((prev) =>
                                      prev.filter((f) => f.name !== font.name),
                                    );
                                    setCustomFontOptions((prev) =>
                                      prev.filter((f) => f !== font.family),
                                    );
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Logo and Favicon Uploads */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Image className="mr-2 h-5 w-5" />
                          Logos & Favicons
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 mb-4">
                          💡 Please upload your logos and favicons in <strong>PNG format</strong> with a 
                          <strong>transparent background</strong> for best results.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <LogoUploadField
                            id="white-logo-upload"
                            label="Light Logo"
                            file={whiteLogoFile}
                            previewUrl={whiteLogoPreviewUrl}
                            setFile={setWhiteLogoFile}
                            setPreviewUrl={setWhiteLogoPreviewUrl}
                          />
                          <LogoUploadField
                            id="black-logo-upload"
                            label="Dark Logo"
                            file={blackLogoFile}
                            previewUrl={blackLogoPreviewUrl}
                            setFile={setBlackLogoFile}
                            setPreviewUrl={setBlackLogoPreviewUrl}
                          />
                          <LogoUploadField
                            id="white-favicon-upload"
                            label="Light Favicon"
                            file={whiteFaviconFile}
                            previewUrl={whiteFaviconPreviewUrl}
                            setFile={setWhiteFaviconFile}
                            setPreviewUrl={setWhiteFaviconPreviewUrl}
                          />
                          <LogoUploadField
                            id="black-favicon-upload"
                            label="Dark Favicon"
                            file={blackFaviconFile}
                            previewUrl={blackFaviconPreviewUrl}
                            setFile={setBlackFaviconFile}
                            setPreviewUrl={setBlackFaviconPreviewUrl}
                          />
                        </div>
                      </CardContent>
                    </Card>


                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveBrandDesign}
                        disabled={
                          !selectedStyle || saveBrandDesignMutation.isPending
                        }
                        className="bg-gradient-to-r from-brand-500 to-purple-600 text-white"
                        data-testid="button-save-brand-design"
                      >
                        {saveBrandDesignMutation.isPending
                          ? isSpanish
                            ? "Guardando..."
                            : "Saving..."
                          : isSpanish
                            ? "Guardar Diseño"
                            : "Save Design"}
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Assets Tab */}
                  <TabsContent value="assets" className="space-y-6">
                    {/* Brand Assets Upload */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Upload className="mr-2 h-5 w-5" />
                          {isSpanish
                            ? "Subir Recursos de Marca"
                            : "Upload Brand Assets"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                            <Label
                              htmlFor="asset-category-select"
                              className="shrink-0"
                            >
                              {isSpanish
                                ? "Categoría para subidas:"
                                : "Category for uploads:"}
                            </Label>
                            <Select
                              value={currentAssetUploadCategory}
                              onValueChange={setCurrentAssetUploadCategory}
                            >
                              <SelectTrigger
                                id="asset-category-select"
                                className="w-full sm:w-[200px]"
                              >
                                <SelectValue
                                  placeholder={
                                    isSpanish
                                      ? "Seleccionar categoría"
                                      : "Select category"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {assetCategories.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <Label
                                htmlFor="asset-upload"
                                className="cursor-pointer"
                              >
                                <span className="font-medium text-brand-600 hover:text-brand-500">
                                  {isSpanish
                                    ? "Subir recursos"
                                    : "Upload assets"}
                                </span>
                                <input
                                  id="asset-upload"
                                  type="file"
                                  accept="image/*,video/*,application/pdf" // Allows images, videos, and PDFs
                                  multiple
                                  className="sr-only"
                                  onChange={handleAssetUpload}
                                  data-testid="input-asset-upload"
                                />
                              </Label>
                              <p className="text-sm text-gray-500 mt-1">
                                {isSpanish
                                  ? "Imágenes, videos o PDFs. Archivos ilimitados."
                                  : "Images, videos or PDFs. Unlimited files."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Categorized Brand Assets Display */}
                    {assetCategories.map((category) => {
                      const assetsInCategory = brandAssets.filter(
                        (asset) => asset.category === category.value,
                      );

                      if (assetsInCategory.length === 0) {
                        return null; // Don't show category if no assets
                      }

                      return (
                        <Card key={category.value}>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              {category.label} ({assetsInCategory.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
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
                                    // document
                                    <div className="flex flex-col items-center text-gray-500 text-sm p-1">
                                      <FileText className="h-8 w-8 mb-1" />
                                      <span className="truncate w-full text-center">
                                        {asset.name}
                                      </span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      onClick={() =>
                                        handleRemoveAsset(asset.id)
                                      }
                                      className="m-1"
                                      aria-label={
                                        isSpanish
                                          ? "Eliminar recurso"
                                          : "Remove asset"
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <a
                                      href={asset.url}
                                      download={asset.name}
                                      className="m-1"
                                      aria-label={
                                        isSpanish
                                          ? "Descargar recurso"
                                          : "Download asset"
                                      }
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
                          </CardContent>
                        </Card>
                      );
                    })}

                    {brandAssets.length === 0 && (
                      <p className="text-center text-gray-500 mt-8">
                        {isSpanish
                          ? "No hay recursos subidos aún. ¡Sube algunos para empezar!"
                          : "No assets uploaded yet. Upload some to get started!"}
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
