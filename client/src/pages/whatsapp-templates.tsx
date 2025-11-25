import { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Send,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Video,
  File,
  MessageSquare,
  Search,
  Eye,
  Copy,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: "AUTHENTICATION" | "UTILITY" | "MARKETING";
  language: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAUSED";
  headerType?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  headerContent?: string;
  body: string;
  footer?: string;
  buttons?: { type: string; text: string; url?: string }[];
  createdAt: string;
}

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").regex(/^[a-z_]+$/, "Only lowercase letters and underscores allowed"),
  category: z.enum(["AUTHENTICATION", "UTILITY", "MARKETING"]),
  language: z.string().min(1, "Language is required"),
  headerType: z.enum(["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"]),
  headerContent: z.string().optional(),
  body: z.string().min(1, "Body is required").max(1024, "Body must be 1024 characters or less"),
  footer: z.string().optional(),
  buttonType: z.enum(["NONE", "URL", "QUICK_REPLY", "CALL"]),
  buttonText: z.string().optional(),
  buttonUrl: z.string().optional(),
}).refine(
  (data) => data.headerType !== "TEXT" || (data.headerContent && data.headerContent.length > 0),
  { message: "Header text is required when header type is TEXT", path: ["headerContent"] }
).refine(
  (data) => data.buttonType === "NONE" || (data.buttonText && data.buttonText.length > 0),
  { message: "Button text is required", path: ["buttonText"] }
).refine(
  (data) => data.buttonType !== "URL" || (data.buttonUrl && data.buttonUrl.length > 0),
  { message: "Button URL is required for URL buttons", path: ["buttonUrl"] }
);

type CreateTemplateForm = z.infer<typeof createTemplateSchema>;

const sendTemplateSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required").regex(/^\+?[0-9]+$/, "Invalid phone number"),
  variables: z.record(z.string(), z.string()),
});

type SendTemplateForm = z.infer<typeof sendTemplateSchema>;

const mockTemplates: WhatsAppTemplate[] = [
  {
    id: "1",
    name: "order_confirmation",
    category: "UTILITY",
    language: "es",
    status: "APPROVED",
    headerType: "TEXT",
    headerContent: "Confirmación de Pedido",
    body: "Hola {{1}}, tu pedido #{{2}} ha sido confirmado. El total es ${{3}}. Recibirás actualizaciones de envío pronto.",
    footer: "Gracias por tu compra",
    buttons: [{ type: "URL", text: "Ver pedido", url: "https://example.com/order/{{2}}" }],
    createdAt: "2025-01-15",
  },
  {
    id: "2",
    name: "appointment_reminder",
    category: "UTILITY",
    language: "es",
    status: "APPROVED",
    body: "Hola {{1}}, te recordamos que tienes una cita programada para el {{2}} a las {{3}}. Por favor confirma tu asistencia.",
    footer: "Responde SI para confirmar",
    buttons: [
      { type: "QUICK_REPLY", text: "Confirmar" },
      { type: "QUICK_REPLY", text: "Reagendar" },
    ],
    createdAt: "2025-01-10",
  },
  {
    id: "3",
    name: "promo_descuento",
    category: "MARKETING",
    language: "es",
    status: "PENDING",
    headerType: "IMAGE",
    headerContent: "https://example.com/promo-banner.jpg",
    body: "¡Hola {{1}}! Tenemos una oferta especial para ti: {{2}}% de descuento en toda nuestra tienda. Usa el código: {{3}}. Válido hasta {{4}}.",
    footer: "No te lo pierdas",
    buttons: [{ type: "URL", text: "Comprar ahora", url: "https://example.com/shop" }],
    createdAt: "2025-01-20",
  },
  {
    id: "4",
    name: "otp_verification",
    category: "AUTHENTICATION",
    language: "es",
    status: "APPROVED",
    body: "Tu código de verificación es: {{1}}. No compartas este código con nadie. Expira en 5 minutos.",
    createdAt: "2025-01-05",
  },
  {
    id: "5",
    name: "shipping_update",
    category: "UTILITY",
    language: "es",
    status: "REJECTED",
    body: "Tu pedido #{{1}} está en camino. Número de seguimiento: {{2}}. Llegará aproximadamente el {{3}}.",
    footer: "Rastrear envío",
    createdAt: "2025-01-18",
  },
];

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  PAUSED: "bg-gray-100 text-gray-800",
};

const statusIcons = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  PAUSED: AlertCircle,
};

const categoryColors = {
  AUTHENTICATION: "bg-purple-100 text-purple-800",
  UTILITY: "bg-blue-100 text-blue-800",
  MARKETING: "bg-pink-100 text-pink-800",
};

interface VariablesSectionProps {
  template: WhatsAppTemplate | null;
  sendForm: UseFormReturn<SendTemplateForm>;
  getPlaceholders: (text: string) => string[];
}

const placeholderToKey = (placeholder: string): string => {
  const num = placeholder.replace(/[{}]/g, "");
  return `var${num}`;
};

const keyToPlaceholder = (key: string): string => {
  const num = key.replace("var", "");
  return `{{${num}}}`;
};

function VariablesSection({ template, sendForm, getPlaceholders }: VariablesSectionProps) {
  const variables = sendForm.watch("variables") || {};
  
  if (!template) return null;
  
  const placeholders = getPlaceholders(template.body);
  
  if (placeholders.length === 0) return null;
  
  return (
    <>
      <div className="space-y-2">
        <p className="text-sm font-medium">Template Variables</p>
        {placeholders.map((placeholder, idx) => {
          const normalizedKey = placeholderToKey(placeholder);
          const fieldName = `variables.${normalizedKey}` as const;
          const hasError = sendForm.formState.errors.variables?.[normalizedKey];
          
          return (
            <div key={placeholder} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-16">{placeholder}</span>
                <Input
                  placeholder={`Value for ${placeholder}`}
                  {...sendForm.register(fieldName as `variables.${string}`, { 
                    required: `${placeholder} is required` 
                  })}
                  className={hasError ? "border-red-500" : ""}
                  data-testid={`input-variable-${idx + 1}`}
                />
              </div>
              {hasError && (
                <p className="text-sm text-red-500 ml-20" data-testid={`error-variable-${idx + 1}`}>
                  {hasError.message?.toString() || `${placeholder} is required`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Message Preview</p>
        <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500" data-testid="send-preview">
          <p className="text-sm text-gray-700">
            {template.body.replace(/\{\{(\d+)\}\}/g, (match) => {
              const key = placeholderToKey(match);
              return variables[key] || match;
            })}
          </p>
        </div>
      </div>
    </>
  );
}

export default function WhatsAppTemplates() {
  const { toast } = useToast();
  const { isLoading } = useAuth();
  const { activeBrandId } = useBrand();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

  // Fetch WhatsApp templates from Meta API
  const { 
    data: templatesData, 
    isLoading: isLoadingTemplates,
    error: templatesError,
    refetch: refetchTemplates,
  } = useQuery<{ templates: WhatsAppTemplate[]; total: number }>({
    queryKey: ["/api/whatsapp-templates", { brandId: activeBrandId }],
    enabled: !!activeBrandId,
  });

  // Use API templates if available, fallback to mock data only for "no integration" (404) errors
  const is404Error = templatesError && (templatesError as any)?.message?.includes("404");
  const isUsingMockData = is404Error;
  const templates = templatesData?.templates ?? (isUsingMockData ? mockTemplates : []);

  const createForm = useForm<CreateTemplateForm>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: "",
      category: "UTILITY",
      language: "es",
      headerType: "NONE",
      headerContent: "",
      body: "",
      footer: "",
      buttonType: "NONE",
      buttonText: "",
      buttonUrl: "",
    },
  });

  const sendForm = useForm<SendTemplateForm>({
    resolver: zodResolver(sendTemplateSchema),
    defaultValues: {
      phoneNumber: "",
      variables: {},
    },
  });

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || template.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateTemplate = (data: CreateTemplateForm) => {
    toast({
      title: "Template Created",
      description: `Template "${data.name}" has been submitted for approval.`,
    });
    setIsCreateModalOpen(false);
    createForm.reset();
  };

  const getPlaceholders = (text: string): string[] => {
    const matches = text.match(/\{\{(\d+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches)).sort((a, b) => {
      const numA = parseInt(a.replace(/[{}]/g, ""));
      const numB = parseInt(b.replace(/[{}]/g, ""));
      return numA - numB;
    });
  };

  const handleSendTemplate = (data: SendTemplateForm) => {
    if (selectedTemplate) {
      const placeholders = getPlaceholders(selectedTemplate.body);
      const missingPlaceholders: string[] = [];
      
      placeholders.forEach((placeholder) => {
        const normalizedKey = placeholderToKey(placeholder);
        const value = data.variables?.[normalizedKey];
        if (value === undefined || value === null || value.trim() === "") {
          missingPlaceholders.push(placeholder);
        }
      });
      
      if (missingPlaceholders.length > 0) {
        toast({
          title: "Missing Variables",
          description: `Please fill in all required variables: ${missingPlaceholders.join(", ")}`,
          variant: "destructive",
        });
        return;
      }
    }
    
    toast({
      title: "Message Sent",
      description: `Template sent to ${data.phoneNumber}`,
    });
    setIsSendModalOpen(false);
    sendForm.reset();
    setSelectedTemplate(null);
  };

  const openSendModal = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    const placeholders = getPlaceholders(template.body);
    const initialVariables = Object.fromEntries(
      placeholders.map((p) => [placeholderToKey(p), ""])
    );
    sendForm.reset({ phoneNumber: "", variables: initialVariables });
    setIsSendModalOpen(true);
  };

  const headerType = createForm.watch("headerType");
  const buttonType = createForm.watch("buttonType");
  const bodyContent = createForm.watch("body");
  const headerContent = createForm.watch("headerContent");
  const footerContent = createForm.watch("footer");
  const buttonText = createForm.watch("buttonText");

  const getVariableCount = (text: string) => {
    const matches = text.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.length : 0;
  };

  if (isLoading || isLoadingTemplates) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <TopHeader />
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {templatesError && (
                  <div className={`mb-6 p-4 border rounded-lg ${isUsingMockData ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`} data-testid="banner-status">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`w-5 h-5 ${isUsingMockData ? 'text-yellow-600' : 'text-red-600'}`} />
                      <div>
                        <p className={`font-medium ${isUsingMockData ? 'text-yellow-800' : 'text-red-800'}`}>
                          {isUsingMockData ? 'Demo Mode' : 'Error Loading Templates'}
                        </p>
                        <p className={`text-sm ${isUsingMockData ? 'text-yellow-700' : 'text-red-700'}`}>
                          {isUsingMockData 
                            ? "Connect your WhatsApp Business account in Settings to manage real templates."
                            : (templatesError as any)?.message || "Unable to fetch templates from Meta."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2" data-testid="text-page-title">
                      <SiWhatsapp className="w-7 h-7 text-green-600" />
                      WhatsApp Templates
                    </h1>
                    <p className="text-gray-600 mt-1" data-testid="text-page-description">
                      Create and manage message templates for WhatsApp Business
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!isUsingMockData && (
                      <Button
                        variant="outline"
                        onClick={() => refetchTemplates()}
                        data-testid="button-refresh-templates"
                      >
                        Refresh
                      </Button>
                    )}
                    <Button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-create-template"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card data-testid="card-stat-total">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Templates</p>
                          <p className="text-2xl font-bold" data-testid="text-stat-total">{templates.length}</p>
                        </div>
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-stat-approved">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Approved</p>
                          <p className="text-2xl font-bold text-green-600" data-testid="text-stat-approved">
                            {templates.filter((t) => t.status === "APPROVED").length}
                          </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-stat-pending">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Pending</p>
                          <p className="text-2xl font-bold text-yellow-600" data-testid="text-stat-pending">
                            {templates.filter((t) => t.status === "PENDING").length}
                          </p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card data-testid="card-stat-rejected">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Rejected</p>
                          <p className="text-2xl font-bold text-red-600" data-testid="text-stat-rejected">
                            {templates.filter((t) => t.status === "REJECTED").length}
                          </p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mb-6" data-testid="card-filters">
                  <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            data-testid="input-search-templates"
                          />
                        </div>
                      </div>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full md:w-48" data-testid="select-category-filter">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" data-testid="option-category-all">All Categories</SelectItem>
                          <SelectItem value="AUTHENTICATION" data-testid="option-category-auth">Authentication</SelectItem>
                          <SelectItem value="UTILITY" data-testid="option-category-utility">Utility</SelectItem>
                          <SelectItem value="MARKETING" data-testid="option-category-marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" data-testid="option-status-all">All Status</SelectItem>
                          <SelectItem value="APPROVED" data-testid="option-status-approved">Approved</SelectItem>
                          <SelectItem value="PENDING" data-testid="option-status-pending">Pending</SelectItem>
                          <SelectItem value="REJECTED" data-testid="option-status-rejected">Rejected</SelectItem>
                          <SelectItem value="PAUSED" data-testid="option-status-paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-templates">
                  {filteredTemplates.map((template) => {
                    const StatusIcon = statusIcons[template.status];
                    return (
                      <Card key={template.id} className="hover:shadow-md transition-shadow" data-testid={`card-template-${template.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-green-600" />
                                <span data-testid={`text-template-name-${template.id}`}>{template.name}</span>
                              </CardTitle>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge className={categoryColors[template.category]} data-testid={`badge-category-${template.id}`}>
                                  {template.category}
                                </Badge>
                                <Badge className={statusColors[template.status]} data-testid={`badge-status-${template.id}`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {template.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {template.headerType && template.headerType !== "TEXT" && (
                            <div className="mb-2 p-2 bg-gray-100 rounded flex items-center gap-2 text-sm text-gray-600" data-testid={`header-media-${template.id}`}>
                              {template.headerType === "IMAGE" && <ImageIcon className="w-4 h-4" />}
                              {template.headerType === "VIDEO" && <Video className="w-4 h-4" />}
                              {template.headerType === "DOCUMENT" && <File className="w-4 h-4" />}
                              <span>{template.headerType} Header</span>
                            </div>
                          )}
                          {template.headerType === "TEXT" && template.headerContent && (
                            <p className="font-semibold text-sm mb-2" data-testid={`header-text-${template.id}`}>{template.headerContent}</p>
                          )}

                          <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                            <p className="text-sm text-gray-700 line-clamp-3" data-testid={`text-template-body-${template.id}`}>{template.body}</p>
                          </div>

                          {template.footer && (
                            <p className="text-xs text-gray-500 mt-2 italic" data-testid={`text-template-footer-${template.id}`}>{template.footer}</p>
                          )}

                          {template.buttons && template.buttons.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2" data-testid={`buttons-${template.id}`}>
                              {template.buttons.map((btn, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-green-600 border-green-600"
                                  data-testid={`badge-button-${template.id}-${idx}`}
                                >
                                  {btn.text}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-gray-500">
                            <span data-testid={`text-language-${template.id}`}>Language: {template.language.toUpperCase()}</span>
                            <span data-testid={`text-date-${template.id}`}>{template.createdAt}</span>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => openSendModal(template)}
                              disabled={template.status !== "APPROVED"}
                              data-testid={`button-send-template-${template.id}`}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Send
                            </Button>
                            <Button size="sm" variant="ghost" data-testid={`button-view-template-${template.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" data-testid={`button-copy-template-${template.id}`}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {filteredTemplates.length === 0 && (
                  <Card className="mt-6" data-testid="card-empty-state">
                    <CardContent className="py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900" data-testid="text-empty-title">No templates found</h3>
                      <p className="text-gray-500 mt-2" data-testid="text-empty-description">
                        {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Create your first WhatsApp template to get started"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-template">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="w-5 h-5 text-green-600" />
              Create WhatsApp Template
            </DialogTitle>
            <DialogDescription>
              Create a new message template. Templates must be approved by Meta before use.
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateTemplate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., order_confirmation" {...field} data-testid="input-template-name" />
                      </FormControl>
                      <FormDescription>Lowercase, underscores only</FormDescription>
                      <FormMessage data-testid="error-template-name" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-template-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AUTHENTICATION" data-testid="option-create-cat-auth">Authentication</SelectItem>
                          <SelectItem value="UTILITY" data-testid="option-create-cat-utility">Utility</SelectItem>
                          <SelectItem value="MARKETING" data-testid="option-create-cat-marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage data-testid="error-template-category" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-template-language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="es" data-testid="option-lang-es">Spanish (es)</SelectItem>
                        <SelectItem value="en" data-testid="option-lang-en">English (en)</SelectItem>
                        <SelectItem value="en_US" data-testid="option-lang-en-us">English US (en_US)</SelectItem>
                        <SelectItem value="pt_BR" data-testid="option-lang-pt-br">Portuguese BR (pt_BR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-template-language" />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="headerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Header (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-header-type">
                          <SelectValue placeholder="Select header type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE" data-testid="option-header-none">No Header</SelectItem>
                        <SelectItem value="TEXT" data-testid="option-header-text">Text</SelectItem>
                        <SelectItem value="IMAGE" data-testid="option-header-image">Image</SelectItem>
                        <SelectItem value="VIDEO" data-testid="option-header-video">Video</SelectItem>
                        <SelectItem value="DOCUMENT" data-testid="option-header-document">Document</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-header-type" />
                  </FormItem>
                )}
              />

              {headerType === "TEXT" && (
                <FormField
                  control={createForm.control}
                  name="headerContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Header Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Header text..." {...field} data-testid="input-header-text" />
                      </FormControl>
                      <FormMessage data-testid="error-header-text" />
                    </FormItem>
                  )}
                />
              )}

              {(headerType === "IMAGE" || headerType === "VIDEO" || headerType === "DOCUMENT") && (
                <div className="border-2 border-dashed rounded-lg p-4 text-center" data-testid="media-upload-placeholder">
                  <p className="text-sm text-gray-500">
                    Media will be uploaded when sending the template
                  </p>
                </div>
              )}

              <FormField
                control={createForm.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body (Required)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Hello {{1}}, your order #{{2}} is confirmed..."
                        rows={4}
                        {...field}
                        data-testid="textarea-template-body"
                      />
                    </FormControl>
                    <FormDescription>
                      Use {"{{1}}"}, {"{{2}}"}, etc. for variables. Max 1024 characters.
                    </FormDescription>
                    <FormMessage data-testid="error-template-body" />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="footer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Thank you for your purchase" {...field} data-testid="input-template-footer" />
                    </FormControl>
                    <FormMessage data-testid="error-template-footer" />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="buttonType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Button (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-button-type">
                          <SelectValue placeholder="Select button type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE" data-testid="option-button-none">No Button</SelectItem>
                        <SelectItem value="URL" data-testid="option-button-url">URL Button</SelectItem>
                        <SelectItem value="QUICK_REPLY" data-testid="option-button-quick">Quick Reply</SelectItem>
                        <SelectItem value="CALL" data-testid="option-button-call">Call Button</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage data-testid="error-button-type" />
                  </FormItem>
                )}
              />

              {buttonType !== "NONE" && (
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={createForm.control}
                    name="buttonText"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Button text" {...field} data-testid="input-button-text" />
                        </FormControl>
                        <FormMessage data-testid="error-button-text" />
                      </FormItem>
                    )}
                  />
                  {buttonType === "URL" && (
                    <FormField
                      control={createForm.control}
                      name="buttonUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} data-testid="input-button-url" />
                          </FormControl>
                          <FormMessage data-testid="error-button-url" />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Preview</p>
                <div className="bg-gray-100 rounded-lg p-4" data-testid="preview-container">
                  <div className="bg-white rounded-lg shadow-sm p-3 max-w-xs">
                    {headerType === "TEXT" && headerContent && (
                      <p className="font-semibold text-sm mb-2" data-testid="preview-header">{headerContent}</p>
                    )}
                    {headerType === "IMAGE" && (
                      <div className="bg-gray-200 h-32 rounded mb-2 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <p className="text-sm text-gray-700" data-testid="preview-body">
                      {bodyContent || "Your message body will appear here..."}
                    </p>
                    {footerContent && (
                      <p className="text-xs text-gray-500 mt-2" data-testid="preview-footer">{footerContent}</p>
                    )}
                    {buttonType !== "NONE" && buttonText && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 text-green-600 border-green-600"
                        data-testid="preview-button"
                      >
                        {buttonText}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} data-testid="button-cancel-create">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-submit-template"
                >
                  Submit for Approval
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-send-template">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Send Template Message
            </DialogTitle>
            <DialogDescription>
              Send "{selectedTemplate?.name}" to a WhatsApp number
            </DialogDescription>
          </DialogHeader>

          <Form {...sendForm}>
            <form onSubmit={sendForm.handleSubmit(handleSendTemplate)} className="space-y-4">
              <FormField
                control={sendForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} data-testid="input-phone-number" />
                    </FormControl>
                    <FormDescription>Include country code</FormDescription>
                    <FormMessage data-testid="error-phone-number" />
                  </FormItem>
                )}
              />

              <VariablesSection 
                template={selectedTemplate} 
                sendForm={sendForm} 
                getPlaceholders={getPlaceholders} 
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSendModalOpen(false)} data-testid="button-cancel-send">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
