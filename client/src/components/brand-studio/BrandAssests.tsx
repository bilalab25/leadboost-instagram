import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardTitle,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";

export default function BrandAssets({
  assets,
  assetCategories,
  currentAssetUploadCategory,
  setCurrentAssetUploadCategory,
  handleAssetUpload,
  handleRemoveAsset,
  uploads,
}) {
  const { isSpanish } = useLanguage();

  return (
    <TabsContent value="assets" className="space-y-6">
      {/* Brand Assets Upload Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            {isSpanish ? "Subir Recursos de Marca" : "Upload Brand Assets"}
          </CardTitle>

          {/* Upload progress */}
          {uploads.length > 0 && (
            <div className="mt-4 space-y-3">
              {uploads.map((u) => (
                <div key={u.id} className="text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 truncate">{u.name}</span>
                    <span className="text-xs text-gray-500">{u.percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-brand-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${u.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardHeader>

        {/* Accordion with categories */}
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {assetCategories.map((category) => {
              const assetsInCategory = assets.filter(
                (asset) => asset.category === category.value
              );

              return (
                <AccordionItem key={category.value} value={category.value}>
                  <AccordionTrigger className="text-lg font-semibold">
                    {isSpanish ? category.labelEs : category.label} ({assetsInCategory.length})
                  </AccordionTrigger>

                  <AccordionContent className="space-y-4">
                    {/* Category description banner */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {isSpanish ? category.descriptionEs : category.description}
                      </p>
                    </div>
                    {/* Upload section per category */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <div className="mt-3">
                        <Label htmlFor={`asset-upload-${category.value}`} className="cursor-pointer">
                          <span className="font-medium text-brand-600 hover:text-brand-500">
                            {isSpanish ? "Subir recurso" : "Upload asset"}
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
                                onClick={() => handleRemoveAsset(asset.id)}
                                className="m-1"
                                aria-label={isSpanish ? "Eliminar recurso" : "Remove asset"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <a
                                href={asset.url}
                                download={asset.name}
                                className="m-1"
                                aria-label={isSpanish ? "Descargar recurso" : "Download asset"}
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

          {assets.length === 0 && (
            <p className="text-center text-gray-500 mt-8">
              {isSpanish
                ? "No hay recursos subidos aún. ¡Sube algunos para empezar!"
                : "No assets uploaded yet. Upload some to get started!"}
            </p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
