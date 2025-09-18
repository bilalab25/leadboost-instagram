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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Palette, Type, Image, Briefcase, Target, Link, Upload, Check, Trash2, Plus, FileText,
  Instagram, Facebook, Youtube, X, MessageSquare, // Existing social media icons
   Linkedin, Mail, // New social media icons
  Sparkles, Save // For save button and random palette
} from "lucide-react";

// --- Interfaces and Data ---

interface BrandAsset {
  id: string; // Unique ID for the asset
  url: string;
  name: string;
}

interface SocialConnectionStatus {
  instagram: boolean;
  facebook: boolean;
  youtube: boolean;
  x: boolean; // Formerly Twitter
  whatsapp: boolean; // For WhatsApp, we'll assume a "configured" state for simplicity
  snapchat: boolean; // New
  linkedin: boolean; // New
  gmail: boolean; // New
  pinterest: boolean; // New
  tiktok: boolean; // New
}

interface SettingsData {
  id?: string; // Optional, as it might not exist on initial save
  mainColor: string;
  accentColor1: string;
  accentColor2: string;
  primaryFont: string;
  secondaryFont: string;
  logoUrl: string | null;
  selectedBrandStyle: string | null;
  brandAssets: BrandAsset[];
  productSold: string;
  companySector: string;
  appPurpose: string;
  socialConnections: SocialConnectionStatus;
}

// Predefined brand styles (copied from BrandStudio)
const brandStyles = [
  { id: "minimalist", name: "Minimalist", description: "Clean, simple, modern", color: "bg-gray-100" },
  { id: "luxury", name: "Luxury", description: "Elegant, premium, sophisticated", color: "bg-amber-100" },
  { id: "fun", name: "Fun & Playful", description: "Vibrant, energetic, creative", color: "bg-pink-100" },
  { id: "corporate", name: "Corporate", description: "Professional, trustworthy", color: "bg-blue-100" },
  { id: "creative", name: "Creative", description: "Artistic, unique, bold", color: "bg-purple-100" },
  { id: "bold", name: "Bold & Edgy", description: "Strong, impactful, modern", color: "bg-red-100" },
];

// Predefined options for fonts, sectors, and purposes
const fontOptions = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins",
  "Playfair Display", "Oswald", "Source Sans Pro", "Nunito"
];

const companySectorOptions = [
  { value: "retail", label: "Retail / Commerce" },
  { value: "services", label: "Professional Services" },
  { value: "food", label: "Food & Beverage" },
  { value: "tech", label: "Technology" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health & Wellness" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "real_estate", label: "Real Estate" },
  { value: "tourism", label: "Tourism" },
  { value: "art", label: "Art & Culture" },
  { value: "other", label: "Other" },
];

const appPurposeOptions = [
  { value: "sell_more", label: "Sell more products/services" },
  { value: "gain_visibility", label: "Increase brand visibility" },
  { value: "lead_generation", label: "Generate more leads" },
  { value: "customer_engagement", label: "Improve customer engagement" },
  { value: "brand_awareness", label: "Build brand awareness" },
  { value: "community_building", label: "Build a community" },
  { value: "other", label: "Other" },
];

const socialPlatforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-600" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-600" },
  { id: "x", name: "X (Twitter)", icon: X, color: "text-gray-800" },
  { id: "whatsapp", name: "WhatsApp", icon: MessageSquare, color: "text-green-500" },
  //{ id: "snapchat", name: "Snapchat", icon: Snapchat, color: "text-yellow-400" }, // New
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-700" }, // New
  { id: "gmail", name: "Gmail", icon: Mail, color: "text-red-700" }, // New, using Mail icon
  //{ id: "pinterest", name: "Pinterest", icon: Pinterest, color: "text-red-800" }, // New
  //{ id: "tiktok", name: "TikTok", icon: Tiktok, color: "text-black" }, 
];


export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Removed useLanguage as all strings will be English
  const queryClient = useQueryClient();

  // States for configuration
  const [mainColor, setMainColor] = useState<string>("#2563eb"); // Default blue
  const [accentColor1, setAccentColor1] = useState<string>("#60a5fa"); // Default light blue
  const [accentColor2, setAccentColor2] = useState<string>("#1e40af"); // Default dark blue
  const [primaryFont, setPrimaryFont] = useState<string>("Roboto");
  const [secondaryFont, setSecondaryFont] = useState<string>("Open Sans");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [selectedBrandStyle, setSelectedBrandStyle] = useState<string | null>(null);
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [productSold, setProductSold] = useState<string>("");
  const [companySector, setCompanySector] = useState<string>("");
  const [appPurpose, setAppPurpose] = useState<string>("");
  const [socialConnections, setSocialConnections] = useState<SocialConnectionStatus>({
    instagram: false,
    facebook: false,
    youtube: false,
    x: false,
    whatsapp: false,
    snapchat: false, // New
    linkedin: false, // New
    gmail: false, // New
    pinterest: false, // New
    tiktok: false, // New
  });

  // Fetch existing settings
  const { data: currentSettings, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
    retry: false,
  });

  // Effect to load settings when fetched
  useEffect(() => {
    if (currentSettings) {
      setMainColor(currentSettings.mainColor || "#2563eb");
      setAccentColor1(currentSettings.accentColor1 || "#60a5fa");
      setAccentColor2(currentSettings.accentColor2 || "#1e40af");
      setPrimaryFont(currentSettings.primaryFont || "Roboto");
      setSecondaryFont(currentSettings.secondaryFont || "Open Sans");
      setLogoPreviewUrl(currentSettings.logoUrl);
      setSelectedBrandStyle(currentSettings.selectedBrandStyle);
      setBrandAssets(currentSettings.brandAssets || []);
      setProductSold(currentSettings.productSold || "");
      setCompanySector(currentSettings.companySector || "");
      setAppPurpose(currentSettings.appPurpose || "");
      setSocialConnections(currentSettings.socialConnections || {
        instagram: false, facebook: false, youtube: false, x: false, whatsapp: false,
        snapchat: false, linkedin: false, gmail: false, pinterest: false, tiktok: false,
      });
    }
  }, [currentSettings]);

  // Mutation to save settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: SettingsData) => {
      // In a real application, you would likely upload the logo and assets to an object storage
      // and save the URLs to the database. For simplicity, we pass preview URLs here.
      const dataToSave = {
        ...settingsData,
        logoUrl: logoFile ? URL.createObjectURL(logoFile) : settingsData.logoUrl,
        // For brandAssets, if new files were uploaded, they should be processed here.
        // For now, we use the preview URLs.
      };
      const response = await apiRequest("POST", "/api/settings", dataToSave);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Saved!",
        description: "Settings saved successfully",
      });
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "There was an error saving settings.",
        variant: "destructive",
      });
    },
  });

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      setLogoPreviewUrl(URL.createObjectURL(file));
    } else {
      setLogoPreviewUrl(null);
    }
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (brandAssets.length + files.length > 10) {
      toast({
        title: "Asset Limit",
        description: "You can only upload up to 10 brand assets.",
        variant: "destructive",
      });
      return;
    }

    const newAssets: BrandAsset[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Simple unique ID
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setBrandAssets(prev => [...prev, ...newAssets]);
  };

  const handleRemoveAsset = (id: string) => {
    setBrandAssets(prev => prev.filter(asset => asset.id !== id));
  };

  const handleConnectSocialMedia = (platformId: keyof SocialConnectionStatus) => {
    // This is where the actual OAuth flow or API connection logic would go.
    // For simplicity, we simulate the connection with a toggle and a toast.
    setSocialConnections(prev => ({
      ...prev,
      [platformId]: !prev[platformId], // Toggle connection status
    }));

    toast({
      title: "Simulated Connection",
      description: `Successfully ${socialConnections[platformId] ? 'disconnected' : 'connected'} ${platformId} (simulated).`,
      variant: socialConnections[platformId] ? "default" : "success",
    });
  };

  // Function to generate a random hexadecimal color
  const generateRandomHexColor = () => {
    const randomHex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    return `#${randomHex()}${randomHex()}${randomHex()}`;
  };

  // Function to generate a random color palette
  const handleGenerateRandomPalette = () => {
    setMainColor(generateRandomHexColor());
    setAccentColor1(generateRandomHexColor());
    setAccentColor2(generateRandomHexColor());
    toast({
      title: "Palette Generated",
      description: "A new random color palette has been generated.",
    });
  };

  const handleSaveSettings = () => {
    const settingsToSave: SettingsData = {
      mainColor,
      accentColor1,
      accentColor2,
      primaryFont,
      secondaryFont,
      logoUrl: logoPreviewUrl,
      selectedBrandStyle,
      brandAssets,
      productSold,
      companySector,
      appPurpose,
      socialConnections,
    };
    saveSettingsMutation.mutate(settingsToSave);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <TopHeader pageName="Settings" />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName="Settings" />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">

                <Tabs defaultValue="appearance" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="appearance" data-testid="tab-appearance">
                      Appearance
                    </TabsTrigger>
                    <TabsTrigger value="business-info" data-testid="tab-business-info">
                      Business Info
                    </TabsTrigger>
                    <TabsTrigger value="social-media" data-testid="tab-social-media">
                      Social Media
                    </TabsTrigger>
                  </TabsList>

                  {/* Appearance Tab */}
                  <TabsContent value="appearance" className="space-y-6">

                    {/* Brand Style */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Sparkles className="mr-2 h-5 w-5" />
                          Brand Style
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          {brandStyles.map((style) => (
                            <div
                              key={style.id}
                              onClick={() => setSelectedBrandStyle(style.id)}
                              className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                                selectedBrandStyle === style.id
                                  ? 'border-brand-500 ring-2 ring-brand-200'
                                  : 'border-gray-200'
                              } ${style.color}`}
                              data-testid={`style-${style.id}`}
                            >
                              <h3 className="font-semibold text-gray-900 mb-1">{style.name}</h3>
                              <p className="text-sm text-gray-600">{style.description}</p>
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
                          Color Palette
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateRandomPalette}
                          data-testid="button-generate-random-palette"
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Random
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Main Color */}
                          <div>
                            <Label htmlFor="main-color" className="mb-2 block">Main Color</Label>
                            <div className="flex items-center space-x-2 mt-2">
                              <Input
                                id="main-color"
                                type="color"
                                value={mainColor}
                                onChange={(e) => setMainColor(e.target.value)}
                                className="w-20 h-10 p-1 cursor-pointer"
                                data-testid="input-main-color"
                              />
                              <span className="text-sm font-medium text-gray-700">{mainColor.toUpperCase()}</span>
                            </div>
                          </div>
                          {/* Accent Color 1 */}
                          <div>
                            <Label htmlFor="accent-color-1" className="mb-2 block">Accent Color 1</Label>
                            <div className="flex items-center space-x-2 mt-2">
                              <Input
                                id="accent-color-1"
                                type="color"
                                value={accentColor1}
                                onChange={(e) => setAccentColor1(e.target.value)}
                                className="w-20 h-10 p-1 cursor-pointer"
                                data-testid="input-accent-color-1"
                              />
                              <span className="text-sm font-medium text-gray-700">{accentColor1.toUpperCase()}</span>
                            </div>
                          </div>
                          {/* Accent Color 2 */}
                          <div>
                            <Label htmlFor="accent-color-2" className="mb-2 block">Accent Color 2</Label>
                            <div className="flex items-center space-x-2 mt-2">
                              <Input
                                id="accent-color-2"
                                type="color"
                                value={accentColor2}
                                onChange={(e) => setAccentColor2(e.target.value)}
                                className="w-20 h-10 p-1 cursor-pointer"
                                data-testid="input-accent-color-2"
                              />
                              <span className="text-sm font-medium text-gray-700">{accentColor2.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Typography */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Type className="mr-2 h-5 w-5" />
                          Typography
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="primary-font-select">Primary Font</Label>
                            <Select value={primaryFont} onValueChange={setPrimaryFont}>
                              <SelectTrigger id="primary-font-select" className="w-full mt-2" data-testid="select-primary-font">
                                <SelectValue placeholder="Select a font" />
                              </SelectTrigger>
                              <SelectContent>
                                {fontOptions.map(font => (
                                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
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
                            <Label htmlFor="secondary-font-select">Secondary Font</Label>
                            <Select value={secondaryFont} onValueChange={setSecondaryFont}>
                              <SelectTrigger id="secondary-font-select" className="w-full mt-2" data-testid="select-secondary-font">
                                <SelectValue placeholder="Select a font" />
                              </SelectTrigger>
                              <SelectContent>
                                {fontOptions.map(font => (
                                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
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

                    {/* Logo Upload */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Image className="mr-2 h-5 w-5" />
                          Logo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <Label htmlFor="logo-upload" className="cursor-pointer">
                                <span className="font-medium text-brand-600 hover:text-brand-500">
                                  Upload logo
                                </span>
                                <input
                                  id="logo-upload"
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={handleLogoFileChange}
                                  data-testid="input-logo-upload"
                                />
                              </Label>
                            </div>
                            {(logoFile || logoPreviewUrl) && (
                              <div className="mt-4 flex flex-col items-center">
                                {logoFile && <Badge variant="secondary" className="mb-2">{logoFile.name}</Badge>}
                                {logoPreviewUrl && (
                                  <img
                                    src={logoPreviewUrl}
                                    alt="Logo Preview"
                                    className="max-h-32 max-w-full object-contain mt-2 border rounded-md"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Brand Assets (up to 10) */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Image className="mr-2 h-5 w-5" />
                          Brand Assets (up to 10)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <Label htmlFor="asset-upload" className="cursor-pointer">
                                <span className="font-medium text-brand-600 hover:text-brand-500">
                                  Upload assets
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
                                Images, videos or PDFs. Max 10 files.
                              </p>
                            </div>
                          </div>

                          {brandAssets.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                              {brandAssets.map((asset) => (
                                <div key={asset.id} className="relative group border rounded-md p-2 flex flex-col items-center justify-center h-32">
                                  {asset.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                    <img src={asset.url} alt={asset.name} className="max-h-full max-w-full object-contain" />
                                  ) : asset.url.match(/\.(mp4|webm|ogg)$/i) ? (
                                    <video src={asset.url} controls className="max-h-full max-w-full object-contain" />
                                  ) : ( // Assume PDF or other document
                                    <div className="flex flex-col items-center text-gray-500 text-sm">
                                      <FileText className="h-8 w-8 mb-1" />
                                      {asset.name}
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleRemoveAsset(asset.id)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Remove asset"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Business Information Tab */}
                  <TabsContent value="business-info" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Briefcase className="mr-2 h-5 w-5" />
                          Business Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="product-sold">What product/service do you sell?</Label>
                          <Input
                            id="product-sold"
                            value={productSold}
                            onChange={(e) => setProductSold(e.target.value)}
                            placeholder="Ex: Clothing, Consulting, Software"
                            className="mt-2"
                            data-testid="input-product-sold"
                          />
                        </div>
                        <div>
                          <Label htmlFor="company-sector">What is your company's sector?</Label>
                          <Select value={companySector} onValueChange={setCompanySector}>
                            <SelectTrigger id="company-sector" className="w-full mt-2" data-testid="select-company-sector">
                              <SelectValue placeholder="Select a sector" />
                            </SelectTrigger>
                            <SelectContent>
                              {companySectorOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="app-purpose">What is the purpose of using the application?</Label>
                          <Select value={appPurpose} onValueChange={setAppPurpose}>
                            <SelectTrigger id="app-purpose" className="w-full mt-2" data-testid="select-app-purpose">
                              <SelectValue placeholder="Select a purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              {appPurposeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Social Media Tab */}
                  <TabsContent value="social-media" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Link className="mr-2 h-5 w-5" />
                          Social Media Connections
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Connect your social media accounts to automate posts and manage your leads.
                        </p>
                        {socialPlatforms.map((platform) => {
                          const Icon = platform.icon;
                          const isConnected = socialConnections[platform.id as keyof SocialConnectionStatus];
                          return (
                            <div key={platform.id} className="flex items-center justify-between p-3 border rounded-md">
                              <div className="flex items-center">
                                <Icon className={`mr-3 h-6 w-6 ${platform.color}`} />
                                <span className="font-medium">{platform.name}</span>
                              </div>
                              {isConnected ? (
                                <Button
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => handleConnectSocialMedia(platform.id as keyof SocialConnectionStatus)}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Connected
                                </Button>
                              ) : (
                                <Button
                                  className="bg-brand-500 hover:bg-brand-600 text-white"
                                  onClick={() => handleConnectSocialMedia(platform.id as keyof SocialConnectionStatus)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Connect
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Global Save Button */}
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={saveSettingsMutation.isPending}
                      className="bg-gradient-to-r from-brand-500 to-purple-600 text-white"
                      data-testid="button-save-settings"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saveSettingsMutation.isPending
                        ? "Saving..."
                        : "Save Settings"
                      }
                    </Button>
                  </div>
                </Tabs>

              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}