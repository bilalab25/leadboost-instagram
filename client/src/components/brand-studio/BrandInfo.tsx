import { TabsContent } from "@radix-ui/react-tabs";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Info,
  Mic,
  MicOff,
  ShoppingBag,
  Upload,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Textarea } from "../ui/textarea";
import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useBrand } from "@/contexts/BrandContext";

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

const brandCategoryOptions = [
  { value: "physical_product", en: "Physical Product", es: "Producto físico" },
  { value: "digital_product", en: "Digital Product", es: "Producto digital" },
  {
    value: "professional_service",
    en: "Professional Service",
    es: "Servicio profesional",
  },
  {
    value: "personal_service",
    en: "Personal Service",
    es: "Servicio personal",
  },
  {
    value: "subscription",
    en: "Subscription or Membership",
    es: "Suscripción o membresía",
  },
  { value: "combined", en: "Combined (Products + Services)", es: "Combinado" },
  { value: "experiences", en: "Experiences", es: "Experiencias" },
  { value: "digital_content", en: "Digital Content", es: "Contenido digital" },
  {
    value: "licenses",
    en: "Licenses / Intellectual Property",
    es: "Licencias / propiedad intelectual",
  },
  { value: "ngo", en: "NGO / Social Causes", es: "ONG / causas sociales" },
  { value: "food_beverage", en: "Food & Beverage", es: "Alimentos y bebidas" },
  { value: "fashion", en: "Fashion & Accessories", es: "Moda y accesorios" },
  {
    value: "electronics",
    en: "Electronics & Gadgets",
    es: "Electrónica y gadgets",
  },
  { value: "home_decor", en: "Home & Decor", es: "Hogar y decoración" },
  {
    value: "transportation",
    en: "Transportation & Mobility",
    es: "Transporte y movilidad",
  },
  {
    value: "art_entertainment",
    en: "Art & Entertainment",
    es: "Arte y entretenimiento",
  },
  {
    value: "education",
    en: "Education & Training",
    es: "Educación y formación",
  },
  { value: "real_estate", en: "Real Estate", es: "Bienes raíces" },
  {
    value: "health_wellness",
    en: "Health & Wellness",
    es: "Salud y bienestar",
  },
  {
    value: "b2b_tech",
    en: "B2B Technology & Software",
    es: "Tecnología y software empresarial",
  },
  { value: "hobbies", en: "Hobbies & Crafts", es: "Hobbies y manualidades" },
  {
    value: "financial_services",
    en: "Financial Services",
    es: "Servicios financieros",
  },
  {
    value: "legal_accounting",
    en: "Legal & Accounting Services",
    es: "Servicios legales y contables",
  },
  {
    value: "eco_friendly",
    en: "Eco-friendly / Sustainable Products",
    es: "Productos ecológicos / sostenibles",
  },
  { value: "pets", en: "Pets & Animals", es: "Mascotas y animales" },
];

const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  industry: z.string().min(1, "Industry is required"),
  description: z.string().min(1, "Description is required"),
  preferredLanguage: z.string().min(1, "Preferred language is required"),
  brandCategory: z.string().min(1, "Brand category is required"),
  domain: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional()
    .nullable(),
});
type CreateBrandForm = z.infer<typeof createBrandSchema>;

export default function BrandIdentity() {
  const { isSpanish } = useLanguage();
  const [isOtherIndustry, setIsOtherIndustry] = useState(false);
  const [customIndustry, setCustomIndustry] = useState("");
  const { refreshBrands, brands, setActiveBrandId, activeBrandId } = useBrand();
  const [createdBrandId, setCreatedBrandId] = useState<
    string | number | null
  >();

  console.log("🏷️ brands:", brands);
  console.log("🔑 activeBrandId:", activeBrandId);

  const selectedBrand = useMemo(() => {
    if (!activeBrandId) return null;
    return (
      brands.find((b: any) => String(b.id) === String(activeBrandId)) ?? null
    );
  }, [brands, activeBrandId]);

  // Forms
  const createForm = useForm<CreateBrandForm>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: "",
      industry: "",
      description: "",
      preferredLanguage: "",
      brandCategory: "",
      domain: "",
    },
  });

  useEffect(() => {
    if (!selectedBrand) return;

    const industryValue = selectedBrand.industry || "";
    const domainValue = selectedBrand.domain || "";

    const isStandardIndustry = INDUSTRY_OPTIONS.some(
      (option) => option.value === industryValue,
    );

    if (!isStandardIndustry && industryValue) {
      setIsOtherIndustry(true);
      setCustomIndustry(industryValue);

      createForm.reset({
        name: selectedBrand.name || "",
        industry: "other",
        description: selectedBrand.description || "",
        preferredLanguage: selectedBrand.preferredLanguage || "",
        brandCategory: selectedBrand.brandCategory || "",
        domain: domainValue,
      });
    } else {
      setIsOtherIndustry(false);
      setCustomIndustry("");

      createForm.reset({
        name: selectedBrand.name || "",
        industry: industryValue,
        description: selectedBrand.description || "",
        preferredLanguage: selectedBrand.preferredLanguage || "",
        brandCategory: selectedBrand.brandCategory || "",
        domain: domainValue,
      });
    }
  }, [selectedBrand, createForm]);

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

  const onCreateSubmit = (data: CreateBrandForm) => {
    let finalData = data;
    if (isOtherIndustry) finalData = { ...data, industry: customIndustry };

    if (!activeBrandId) return;

    updateBrandMutation.mutate({ ...finalData, brandId: activeBrandId });
  };

  useEffect(() => {
    if (createdBrandId && brands.length > 0) {
      const existingBrand = brands.find((b: any) => b.id === createdBrandId);

      if (existingBrand) {
        const industryValue = existingBrand.industry || "";
        const domainValue = existingBrand.domain || "";

        const isStandardIndustry = INDUSTRY_OPTIONS.some(
          (option) => option.value === industryValue,
        );

        if (!isStandardIndustry && industryValue) {
          setIsOtherIndustry(true);
          setCustomIndustry(industryValue);

          createForm.reset({
            name: existingBrand.name || "",
            industry: "other",
            description: existingBrand.description || "",
            preferredLanguage: existingBrand.preferredLanguage || "",
            brandCategory: existingBrand.brandCategory || "",
            domain: domainValue,
          });
        } else {
          setIsOtherIndustry(false);
          setCustomIndustry("");
          createForm.reset({
            name: existingBrand.name || "",
            industry: industryValue,
            description: existingBrand.description || "",
            preferredLanguage: existingBrand.preferredLanguage || "",
            brandCategory: existingBrand.brandCategory || "",
            domain: domainValue,
          });
        }
      }
    }
  }, [createdBrandId, brands]);

  return (
    <TabsContent value="information" className="space-y-6 mt-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            {isSpanish ? "Información de la marca" : "Brand Info"}
          </CardTitle>
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
                          <SelectItem key={option.value} value={option.value}>
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
                        event.results[event.results.length - 1][0].transcript;
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
                          onClick={listening ? stopListening : startListening}
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
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) => {
                        console.log(
                          "[preferredLanguage] User selected:",
                          value,
                        );
                        field.onChange(value);
                      }}
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
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="zh">中文 (简体)</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="ar">ا �عربية</SelectItem>
                        <SelectItem value="hi">हिन्दी</SelectItem>
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
                name="brandCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <ShoppingBag className="w-4 h-4 inline mr-1" />
                      {isSpanish
                        ? "¿Qué vende tu marca?"
                        : "What does your brand sell?"}
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-brand-category">
                          <SelectValue
                            placeholder={
                              isSpanish
                                ? "Selecciona una categoría"
                                : "Select a category"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {brandCategoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {isSpanish ? option.es : option.en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={updateBrandMutation.isPending}
                    data-testid="button-next-step-1"
                  >
                    {updateBrandMutation.isPending
                      ? isSpanish
                        ? "Actualizando..."
                        : "Updating..."
                      : isSpanish
                        ? "Guardar"
                        : "Save"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
