import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Palette, Type, Image, Sparkles, Upload, Trash2 } from "lucide-react";
import { ZoomIn } from "lucide-react";
import ColorPreviewWithPicker from "./ColorPreviewWithPicker";
import FontPickerDrawer from "./FontSelector";
import FontSelector from "@/components/brand-studio/FontSelector";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function BrandIdentity({
  brandDesign,
  brandStyles,
  selectedStyle,
  handleStyleSelect,
  styleImages,
  mainColor,
  setMainColor,
  accentColor1,
  setAccentColor1,
  accentColor2,
  setAccentColor2,
  text1Color,
  setText1Color,
  text2Color,
  setText2Color,
  accentColor3,
  setAccentColor3,
  accentColor4,
  setAccentColor4,
  text3Color,
  setText3Color,
  text4Color,
  setText4Color,
  showAccentColor3,
  setShowAccentColor3,
  showAccentColor4,
  setShowAccentColor4,
  showText3Color,
  setShowText3Color,
  showText4Color,
  setShowText4Color,
  handleGenerateRandomPalette,
  primaryFont,
  setPrimaryFont,
  secondaryFont,
  setSecondaryFont,
  customFontFiles,
  setCustomFontFiles,
  handleFontUpload,
  setCustomFontOptions,
  handleSaveBrandDesign,
  saveBrandDesignMutation,
  handleFileUpload,
  whiteLogoFile,
  setWhiteLogoFile,
  whiteLogoPreviewUrl,
  setWhiteLogoPreviewUrl,
  blackLogoFile,
  setBlackLogoFile,
  blackLogoPreviewUrl,
  setBlackLogoPreviewUrl,
  whiteFaviconFile,
  setWhiteFaviconFile,
  whiteFaviconPreviewUrl,
  setWhiteFaviconPreviewUrl,
  blackFaviconFile,
  setBlackFaviconFile,
  blackFaviconPreviewUrl,
  setBlackFaviconPreviewUrl,
}) {
  const { isSpanish } = useLanguage();
  const queryClient = useQueryClient(); // 👈 para invalidar cache tras borrar

  const LogoUploadField = ({
    id,
    label,
    file,
    previewUrl,
    setFile,
    setPreviewUrl,
    logoType,
  }: {
    id: string;
    label: string;
    file: File | null;
    previewUrl: string | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    setPreviewUrl: React.Dispatch<React.SetStateAction<string | null>>;
    logoType: "whiteLogo" | "blackLogo" | "whiteFavicon" | "blackFavicon";
  }) => {
    const handleRemove = async () => {
      try {
        // Si ya está en Cloudinary
        if (previewUrl && previewUrl.startsWith("http") && brandDesign?.id) {
          const res = await apiRequest(
            "DELETE",
            `/api/brand-design/logo/${logoType}?brandDesignId=${brandDesign.id}`,
          );

          if (!res.ok) throw new Error("Failed to delete from Cloudinary");
        }

        // Limpia el estado local
        setFile(null);
        setPreviewUrl(null);

        toast({
          title: isSpanish ? "Eliminado" : "Deleted",
          description: isSpanish
            ? `${label} eliminado correctamente`
            : `${label} deleted successfully`,
        });
      } catch (err) {
        console.error("❌ Error deleting logo:", err);
        toast({
          title: isSpanish ? "Error" : "Error",
          description: isSpanish
            ? "No se pudo eliminar el archivo"
            : "Failed to delete file",
          variant: "destructive",
        });
      }
    };

    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          {file || previewUrl ? (
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
                onClick={handleRemove}
                className="mt-2 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
          )}
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
        </div>
      </div>
    );
  };

  return (
    <TabsContent value="brand-identity" className="space-y-6">
      <Accordion
        type="multiple" // allows more than one open at once
        defaultValue={["style", "colors", "logos", "typography"]}
        className="space-y-4"
      >
        {/* Brand Style */}
        <AccordionItem value="style">
          <AccordionTrigger
            className="
              text-lg font-semibold text-left hover:no-underline hover:bg-transparent
              focus-visible:outline-none
            "
          >
            <div className="flex items-center justify-start gap-2">
              <Sparkles className="h-5 w-5" />
              {isSpanish ? "Estilo de Marca" : "Brand Style"}
            </div>
          </AccordionTrigger>

          <AccordionContent>
            {/* Brand Style Selection */}
            <Card>
              <CardHeader></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {brandStyles.map((style: any) => (
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
                      <p className="text-sm text-gray-600 mb-2">
                        {style.description}
                      </p>

                      {styleImages[style.id] && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="relative group">
                              <img
                                src={styleImages[style.id]}
                                alt={style.name}
                                className="w-full h-28 object-cover rounded-md shadow-md cursor-pointer"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn className="text-white h-6 w-6" />
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
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
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
        {/* Color Palette */}
        <AccordionItem value="colors">
          <AccordionTrigger
            className="
                text-lg font-semibold text-left hover:no-underline hover:bg-transparent
                focus-visible:outline-none
              "
          >
            <div className="flex items-center justify-start gap-2">
              <Palette className="h-5 w-5" />
              {isSpanish ? "Paleta de Colores" : "Color Palette"}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                {/*         <CardTitle className="flex items-center">
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
                </Button> */}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <div>
                    <ColorPreviewWithPicker
                      label={isSpanish ? "Color Principal" : "Main Color"}
                      value={mainColor}
                      onChange={setMainColor}
                      allowGradient={true}
                    />
                  </div>

                  {/* Accent Color 1 */}
                  <div>
                    <ColorPreviewWithPicker
                      label={isSpanish ? "Color Acento 1" : "Accent Color 1"}
                      value={accentColor1}
                      onChange={setAccentColor1}
                      allowGradient={true}
                    />
                  </div>
                  {/* Accent Color 2 */}
                  <div>
                    <ColorPreviewWithPicker
                      label={isSpanish ? "Color Acento 2" : "Accent Color 2"}
                      value={accentColor2}
                      onChange={setAccentColor2}
                      allowGradient={true}
                    />
                  </div>
                  {/* Text Color 1 */}
                  <div>
                    <ColorPreviewWithPicker
                      label={isSpanish ? "Color Texto 1" : "Text Color 1"}
                      value={text1Color}
                      onChange={setText1Color}
                      allowGradient={false}
                    />
                  </div>
                  {/* Text Color 2 */}
                  <div>
                    <ColorPreviewWithPicker
                      label={isSpanish ? "Color Texto 2" : "Text Color 2"}
                      value={text2Color}
                      onChange={setText2Color}
                      allowGradient={false}
                    />
                  </div>

                  {/* Optional Accent Color 3 */}
                  {showAccentColor3 && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          🧩 {isSpanish ? "Opcional" : "Optional"}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                                onClick={() => {
                                  setShowAccentColor3(false);
                                  setAccentColor3(null);
                                  toast({
                                    title: isSpanish ? "Color eliminado" : "Color removed",
                                    description: isSpanish ? "Color Acento 3 eliminado" : "Accent Color 3 removed",
                                  });
                                }}
                                data-testid="button-remove-accent-color-3"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isSpanish ? "Eliminar este color" : "Remove this color"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <ColorPreviewWithPicker
                        label={isSpanish ? "Color Acento 3" : "Accent Color 3"}
                        value={accentColor3 || "#9333ea"}
                        onChange={setAccentColor3}
                        allowGradient={true}
                      />
                    </div>
                  )}

                  {/* Optional Accent Color 4 */}
                  {showAccentColor4 && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          🧩 {isSpanish ? "Opcional" : "Optional"}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                                onClick={() => {
                                  setShowAccentColor4(false);
                                  setAccentColor4(null);
                                  toast({
                                    title: isSpanish ? "Color eliminado" : "Color removed",
                                    description: isSpanish ? "Color Acento 4 eliminado" : "Accent Color 4 removed",
                                  });
                                }}
                                data-testid="button-remove-accent-color-4"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isSpanish ? "Eliminar este color" : "Remove this color"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <ColorPreviewWithPicker
                        label={isSpanish ? "Color Acento 4" : "Accent Color 4"}
                        value={accentColor4 || "#db2777"}
                        onChange={setAccentColor4}
                        allowGradient={true}
                      />
                    </div>
                  )}

                  {/* Optional Text Color 3 */}
                  {showText3Color && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          🧩 {isSpanish ? "Opcional" : "Optional"}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                                onClick={() => {
                                  setShowText3Color(false);
                                  setText3Color(null);
                                  toast({
                                    title: isSpanish ? "Color eliminado" : "Color removed",
                                    description: isSpanish ? "Color Texto 3 eliminado" : "Text Color 3 removed",
                                  });
                                }}
                                data-testid="button-remove-text-color-3"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isSpanish ? "Eliminar este color" : "Remove this color"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <ColorPreviewWithPicker
                        label={isSpanish ? "Color Texto 3" : "Text Color 3"}
                        value={text3Color || "#94a3b8"}
                        onChange={setText3Color}
                        allowGradient={false}
                      />
                    </div>
                  )}

                  {/* Optional Text Color 4 */}
                  {showText4Color && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          🧩 {isSpanish ? "Opcional" : "Optional"}
                        </Badge>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                                onClick={() => {
                                  setShowText4Color(false);
                                  setText4Color(null);
                                  toast({
                                    title: isSpanish ? "Color eliminado" : "Color removed",
                                    description: isSpanish ? "Color Texto 4 eliminado" : "Text Color 4 removed",
                                  });
                                }}
                                data-testid="button-remove-text-color-4"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isSpanish ? "Eliminar este color" : "Remove this color"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <ColorPreviewWithPicker
                        label={isSpanish ? "Color Texto 4" : "Text Color 4"}
                        value={text4Color || "#475569"}
                        onChange={setText4Color}
                        allowGradient={false}
                      />
                    </div>
                  )}
                </div>

                {/* Add Color Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {!showAccentColor3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAccentColor3(true);
                        if (!accentColor3) setAccentColor3("#9333ea");
                      }}
                      disabled={showAccentColor3}
                      data-testid="button-add-accent-color"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      + {isSpanish ? "Agregar Color Acento" : "Add Accent Color"}
                    </Button>
                  )}
                  {showAccentColor3 && !showAccentColor4 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAccentColor4(true);
                        if (!accentColor4) setAccentColor4("#db2777");
                      }}
                      disabled={showAccentColor4}
                      data-testid="button-add-accent-color-2"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      + {isSpanish ? "Agregar Color Acento" : "Add Accent Color"}
                    </Button>
                  )}
                  {!showText3Color && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowText3Color(true);
                        if (!text3Color) setText3Color("#94a3b8");
                      }}
                      disabled={showText3Color}
                      data-testid="button-add-text-color"
                    >
                      <Type className="h-4 w-4 mr-2" />
                      + {isSpanish ? "Agregar Color Texto" : "Add Text Color"}
                    </Button>
                  )}
                  {showText3Color && !showText4Color && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowText4Color(true);
                        if (!text4Color) setText4Color("#475569");
                      }}
                      disabled={showText4Color}
                      data-testid="button-add-text-color-2"
                    >
                      <Type className="h-4 w-4 mr-2" />
                      + {isSpanish ? "Agregar Color Texto" : "Add Text Color"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Typography */}
        <AccordionItem value="typography">
          <AccordionTrigger
            className="
                  text-lg font-semibold text-left hover:no-underline hover:bg-transparent
                  focus-visible:outline-none
                "
          >
            <div className="flex items-center justify-start gap-2">
              <Type className="h-5 w-5" />
              {isSpanish ? "Tipografía" : "Typography"}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                {/* Botón para subir fuentes personalizadas */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isSpanish ? "Agregar fuente" : "Add Font"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 font-semibold">
                        {isSpanish
                          ? "Subir fuentes personalizadas"
                          : "Upload Custom Fonts"}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {isSpanish
                          ? "Archivos .ttf, .otf, .woff, .woff2"
                          : ".ttf, .otf, .woff, .woff2 files"}
                      </p>
                      <Label htmlFor="font-upload" className="cursor-pointer">
                        <span className="font-medium text-brand-600 hover:text-brand-500">
                          {isSpanish
                            ? "Seleccionar archivo(s)"
                            : "Select font file(s)"}
                        </span>
                        <input
                          id="font-upload"
                          type="file"
                          accept=".ttf,.otf,.woff,.woff2"
                          multiple
                          className="sr-only"
                          onChange={handleFontUpload}
                          data-testid="input-font-upload"
                        />
                      </Label>
                    </div>

                    {customFontFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-semibold text-left">
                          {isSpanish ? "Fuentes Subidas:" : "Uploaded Fonts:"}
                        </h4>
                        {customFontFiles.map((font: any) => (
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
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="primary-font-select">
                      {isSpanish ? "Fuente Principal" : "Primary Font"}
                    </Label>
                    <FontPickerDrawer
                      value={primaryFont}
                      onChange={setPrimaryFont}
                    />
                    <div
                      className="mt-2 p-4 border rounded-lg text-2xl font-bold"
                      style={{ fontFamily: primaryFont }}
                    >
                      {primaryFont}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondary-font-select">
                      {isSpanish ? "Fuente Secundaria" : "Secondary Font"}
                    </Label>
                    <FontSelector
                      value={secondaryFont}
                      onChange={setSecondaryFont}
                    />
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
          </AccordionContent>
        </AccordionItem>

        {/* Logo and Favicon Uploads */}
        <AccordionItem value="logos">
          <AccordionTrigger
            className="
                text-lg font-semibold text-left hover:no-underline hover:bg-transparent
                focus-visible:outline-none
              "
          >
            <div className="flex items-center justify-start gap-2">
              <Image className="h-5 w-5" />
              Logos & Favicons
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader></CardHeader>
              <CardContent>
                <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 mb-4">
                  💡 Please upload your logos and favicons in{" "}
                  <strong>PNG format</strong> with a
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
                    logoType="whiteLogo"
                  />
                  <LogoUploadField
                    id="black-logo-upload"
                    label="Dark Logo"
                    file={blackLogoFile}
                    previewUrl={blackLogoPreviewUrl}
                    setFile={setBlackLogoFile}
                    setPreviewUrl={setBlackLogoPreviewUrl}
                    logoType="blackLogo"
                  />
                  <LogoUploadField
                    id="white-favicon-upload"
                    label="Light Favicon"
                    file={whiteFaviconFile}
                    previewUrl={whiteFaviconPreviewUrl}
                    setFile={setWhiteFaviconFile}
                    setPreviewUrl={setWhiteFaviconPreviewUrl}
                    logoType="whiteFavicon"
                  />
                  <LogoUploadField
                    id="black-favicon-upload"
                    label="Dark Favicon"
                    file={blackFaviconFile}
                    previewUrl={blackFaviconPreviewUrl}
                    setFile={setBlackFaviconFile}
                    setPreviewUrl={setBlackFaviconPreviewUrl}
                    logoType="blackFavicon"
                  />
                </div>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveBrandDesign}
          disabled={!selectedStyle || saveBrandDesignMutation.isPending}
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
  );
}
