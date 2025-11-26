import { useState, useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Settings,
  Type,
  MousePointer,
  Upload,
  X,
  Variable,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
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

const createTemplateSchema = z
  .object({
    name: z
      .string()
      .min(1, "Template name is required")
      .regex(/^[a-z_]+$/, "Only lowercase letters and underscores allowed"),
    category: z.enum(["AUTHENTICATION", "UTILITY", "MARKETING"]),
    language: z.string().min(1, "Language is required"),
    headerType: z.enum(["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"]),
    headerContent: z.string().optional(),
    body: z
      .string()
      .min(1, "Body is required")
      .max(1024, "Body must be 1024 characters or less"),
    footer: z.string().optional(),
    buttonType: z.enum(["NONE", "URL", "QUICK_REPLY", "CALL"]),
    buttonText: z.string().optional(),
    buttonUrl: z.string().optional(),
  })
  .refine(
    (data) =>
      data.headerType !== "TEXT" ||
      (data.headerContent && data.headerContent.length > 0),
    {
      message: "Header text is required when header type is TEXT",
      path: ["headerContent"],
    },
  )
  .refine(
    (data) =>
      data.buttonType === "NONE" ||
      (data.buttonText && data.buttonText.length > 0),
    { message: "Button text is required", path: ["buttonText"] },
  )
  .refine(
    (data) =>
      data.buttonType !== "URL" ||
      (data.buttonUrl && data.buttonUrl.length > 0),
    { message: "Button URL is required for URL buttons", path: ["buttonUrl"] },
  );

type CreateTemplateForm = z.infer<typeof createTemplateSchema>;

const sendTemplateSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?[0-9]+$/, "Invalid phone number"),
  variables: z.record(z.string(), z.string()),
});

type SendTemplateForm = z.infer<typeof sendTemplateSchema>;

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

function VariablesSection({
  template,
  sendForm,
  getPlaceholders,
}: VariablesSectionProps) {
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
                <span className="text-sm text-gray-500 w-16">
                  {placeholder}
                </span>
                <Input
                  placeholder={`Value for ${placeholder}`}
                  {...sendForm.register(fieldName as `variables.${string}`, {
                    required: `${placeholder} is required`,
                  })}
                  className={hasError ? "border-red-500" : ""}
                  data-testid={`input-variable-${idx + 1}`}
                />
              </div>
              {hasError && (
                <p
                  className="text-sm text-red-500 ml-20"
                  data-testid={`error-variable-${idx + 1}`}
                >
                  {hasError.message?.toString() || `${placeholder} is required`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Message Preview</p>
        <div
          className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500"
          data-testid="send-preview"
        >
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

interface PhonePreviewProps {
  headerType?: string;
  headerContent?: string;
  body?: string;
  footer?: string;
  buttonType?: string;
  buttonText?: string;
}

function PhonePreview({
  headerType,
  headerContent,
  body,
  footer,
  buttonType,
  buttonText,
}: PhonePreviewProps) {
  return (
    <div
      className="flex flex-col items-center"
      data-testid="phone-preview-container"
    >
      <div className="w-[240px] border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="bg-[#075E54] text-white px-3 py-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center">
            <SiWhatsapp className="w-4 h-4 text-[#075E54]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Business</p>
            <p className="text-[9px] text-green-200">online</p>
          </div>
        </div>

        <div className="bg-[#e5ddd5] p-3 min-h-[280px]">
          <div className="flex justify-end">
            <div
              className="max-w-[95%] bg-[#dcf8c6] rounded-lg p-2 shadow-sm"
              style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              data-testid="phone-preview-message"
            >
              {headerType === "TEXT" && headerContent && (
                <p
                  className="font-semibold text-[11px] text-gray-800 mb-1"
                  data-testid="phone-preview-header"
                >
                  {headerContent}
                </p>
              )}
              {headerType === "IMAGE" && (
                <div className="bg-gray-200 h-16 rounded mb-2 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                </div>
              )}
              {headerType === "VIDEO" && (
                <div className="bg-gray-200 h-16 rounded mb-2 flex items-center justify-center">
                  <Video className="w-4 h-4 text-gray-400" />
                </div>
              )}
              {headerType === "DOCUMENT" && (
                <div className="bg-gray-200 h-12 rounded mb-2 flex items-center justify-center gap-1">
                  <File className="w-3 h-3 text-gray-400" />
                  <span className="text-[9px] text-gray-500">Document</span>
                </div>
              )}

              <p
                className="text-[11px] text-gray-800"
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}
                data-testid="phone-preview-body"
              >
                {body || "Your message will appear here..."}
              </p>

              {footer && (
                <p
                  className="text-[9px] text-gray-500 mt-1"
                  data-testid="phone-preview-footer"
                >
                  {footer}
                </p>
              )}

              <div className="flex justify-end mt-0.5">
                <span className="text-[8px] text-gray-400">
                  {new Date().toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </div>
          </div>

          {buttonType && buttonType !== "NONE" && buttonText && (
            <div className="flex justify-end mt-1">
              <button
                className="max-w-[95%] w-full bg-white text-[#128C7E] rounded py-1.5 text-[10px] font-medium"
                data-testid="phone-preview-button"
              >
                {buttonText}
              </button>
            </div>
          )}
        </div>

        <div className="bg-[#f0f0f0] px-2 py-1.5 flex items-center gap-1.5">
          <div className="flex-1 bg-white rounded-full px-3 py-1 text-gray-400 text-[9px]">
            Message...
          </div>
          <div className="w-6 h-6 bg-[#25D366] rounded-full flex items-center justify-center">
            <Send className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    </div>
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
  const [selectedTemplate, setSelectedTemplate] =
    useState<WhatsAppTemplate | null>(null);
  const [headerMediaFile, setHeaderMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Check if error is due to no WhatsApp integration (404)
  const isNoIntegration =
    templatesError && (templatesError as any)?.message?.includes("404");
  const templates = templatesData?.templates ?? [];

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
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || template.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || template.status === statusFilter;
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

  // Mutation for sending template messages
  const sendTemplateMutation = useMutation({
    mutationFn: async (payload: {
      phoneNumber: string;
      templateName: string;
      languageCode: string;
      components: any[];
      templateBody: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/whatsapp-templates/send?brandId=${activeBrandId}`,
        payload,
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Message Sent",
        description: `Template successfully sent to ${data.to}`,
      });
      setIsSendModalOpen(false);
      sendForm.reset();
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send template message",
        variant: "destructive",
      });
    },
  });

  const handleSendTemplate = (data: SendTemplateForm) => {
    if (!selectedTemplate) return;

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

    // Build components array for variables following Meta's schema
    // Meta requires uppercase type values: HEADER, BODY, BUTTONS
    const components: any[] = [];

    // Handle HEADER parameters if template has header with variables
    if (
      selectedTemplate.headerType === "TEXT" &&
      selectedTemplate.headerContent
    ) {
      const headerPlaceholders = getPlaceholders(
        selectedTemplate.headerContent,
      );
      if (headerPlaceholders.length > 0) {
        const headerParams = headerPlaceholders.map((placeholder) => {
          const normalizedKey = placeholderToKey(placeholder);
          return {
            type: "text",
            text: data.variables[normalizedKey] || "",
          };
        });
        components.push({
          type: "header",
          parameters: headerParams,
        });
      }
    }

    // Handle BODY parameters
    if (placeholders.length > 0) {
      const bodyParams = placeholders.map((placeholder) => {
        const normalizedKey = placeholderToKey(placeholder);
        return {
          type: "text",
          text: data.variables[normalizedKey] || "",
        };
      });
      components.push({
        type: "body",
        parameters: bodyParams,
      });
    }

    // Handle BUTTONS parameters if template has dynamic URL buttons
    if (selectedTemplate.buttons && selectedTemplate.buttons.length > 0) {
      selectedTemplate.buttons.forEach((button: any, index: number) => {
        if (button.type === "URL" && button.url?.includes("{{1}}")) {
          const buttonKey = `button_${index + 1}`;
          if (data.variables[buttonKey]) {
            components.push({
              type: "button",
              sub_type: "url",
              index: index,
              parameters: [
                {
                  type: "text",
                  text: data.variables[buttonKey],
                },
              ],
            });
          }
        }
      });
    }

    // Build the template body with variables substituted for storage
    let templateBody = selectedTemplate.body;
    placeholders.forEach((placeholder) => {
      const normalizedKey = placeholderToKey(placeholder);
      const value = data.variables[normalizedKey] || "";
      templateBody = templateBody.replace(placeholder, value);
    });

    // Send the template via API
    sendTemplateMutation.mutate({
      phoneNumber: data.phoneNumber,
      templateName: selectedTemplate.name,
      languageCode: selectedTemplate.language,
      components: components,
      templateBody: templateBody,
    });
  };

  const openSendModal = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);
    const placeholders = getPlaceholders(template.body);
    const initialVariables = Object.fromEntries(
      placeholders.map((p) => [placeholderToKey(p), ""]),
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
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="loading-spinner"
      >
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
                {templatesError && !isNoIntegration && (
                  <div
                    className="mb-6 p-4 border rounded-lg bg-red-50 border-red-200"
                    data-testid="banner-status"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-800">
                          Error Loading Templates
                        </p>
                        <p className="text-sm text-red-700">
                          {(templatesError as any)?.message ||
                            "Unable to fetch templates from Meta."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h1
                      className="text-2xl font-bold text-gray-900 flex items-center gap-2"
                      data-testid="text-page-title"
                    >
                      <SiWhatsapp className="w-7 h-7 text-green-600" />
                      WhatsApp Templates
                    </h1>
                    <p
                      className="text-gray-600 mt-1"
                      data-testid="text-page-description"
                    >
                      Create and manage message templates for WhatsApp Business
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!isNoIntegration && (
                      <Button
                        variant="outline"
                        onClick={() => refetchTemplates()}
                        data-testid="button-refresh-templates"
                      >
                        Refresh
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        if (isNoIntegration) {
                          toast({
                            title: "No WhatsApp Integration",
                            description: "Please connect a WhatsApp Business account first to create templates.",
                            variant: "destructive",
                          });
                          return;
                        }
                        setIsCreateModalOpen(true);
                      }}
                      className={isNoIntegration ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}
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
                          <p className="text-sm text-gray-500">
                            Total Templates
                          </p>
                          <p
                            className="text-2xl font-bold"
                            data-testid="text-stat-total"
                          >
                            {templates.length}
                          </p>
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
                          <p
                            className="text-2xl font-bold text-green-600"
                            data-testid="text-stat-approved"
                          >
                            {
                              templates.filter((t) => t.status === "APPROVED")
                                .length
                            }
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
                          <p
                            className="text-2xl font-bold text-yellow-600"
                            data-testid="text-stat-pending"
                          >
                            {
                              templates.filter((t) => t.status === "PENDING")
                                .length
                            }
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
                          <p
                            className="text-2xl font-bold text-red-600"
                            data-testid="text-stat-rejected"
                          >
                            {
                              templates.filter((t) => t.status === "REJECTED")
                                .length
                            }
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
                      <Select
                        value={categoryFilter}
                        onValueChange={setCategoryFilter}
                      >
                        <SelectTrigger
                          className="w-full md:w-48"
                          data-testid="select-category-filter"
                        >
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="all"
                            data-testid="option-category-all"
                          >
                            All Categories
                          </SelectItem>
                          <SelectItem
                            value="AUTHENTICATION"
                            data-testid="option-category-auth"
                          >
                            Authentication
                          </SelectItem>
                          <SelectItem
                            value="UTILITY"
                            data-testid="option-category-utility"
                          >
                            Utility
                          </SelectItem>
                          <SelectItem
                            value="MARKETING"
                            data-testid="option-category-marketing"
                          >
                            Marketing
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger
                          className="w-full md:w-48"
                          data-testid="select-status-filter"
                        >
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="all"
                            data-testid="option-status-all"
                          >
                            All Status
                          </SelectItem>
                          <SelectItem
                            value="APPROVED"
                            data-testid="option-status-approved"
                          >
                            Approved
                          </SelectItem>
                          <SelectItem
                            value="PENDING"
                            data-testid="option-status-pending"
                          >
                            Pending
                          </SelectItem>
                          <SelectItem
                            value="REJECTED"
                            data-testid="option-status-rejected"
                          >
                            Rejected
                          </SelectItem>
                          <SelectItem
                            value="PAUSED"
                            data-testid="option-status-paused"
                          >
                            Paused
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  data-testid="grid-templates"
                >
                  {filteredTemplates.map((template) => {
                    const StatusIcon = statusIcons[template.status];
                    return (
                      <Card
                        key={template.id}
                        className="hover:shadow-md transition-shadow"
                        data-testid={`card-template-${template.id}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-green-600" />
                                <span
                                  data-testid={`text-template-name-${template.id}`}
                                >
                                  {template.name}
                                </span>
                              </CardTitle>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge
                                  className={categoryColors[template.category]}
                                  data-testid={`badge-category-${template.id}`}
                                >
                                  {template.category}
                                </Badge>
                                <Badge
                                  className={statusColors[template.status]}
                                  data-testid={`badge-status-${template.id}`}
                                >
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {template.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {template.headerType &&
                            template.headerType !== "TEXT" && (
                              <div
                                className="mb-2 p-2 bg-gray-100 rounded flex items-center gap-2 text-sm text-gray-600"
                                data-testid={`header-media-${template.id}`}
                              >
                                {template.headerType === "IMAGE" && (
                                  <ImageIcon className="w-4 h-4" />
                                )}
                                {template.headerType === "VIDEO" && (
                                  <Video className="w-4 h-4" />
                                )}
                                {template.headerType === "DOCUMENT" && (
                                  <File className="w-4 h-4" />
                                )}
                                <span>{template.headerType} Header</span>
                              </div>
                            )}
                          {template.headerType === "TEXT" &&
                            template.headerContent && (
                              <p
                                className="font-semibold text-sm mb-2"
                                data-testid={`header-text-${template.id}`}
                              >
                                {template.headerContent}
                              </p>
                            )}

                          <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                            <p
                              className="text-sm text-gray-700 line-clamp-3"
                              data-testid={`text-template-body-${template.id}`}
                            >
                              {template.body}
                            </p>
                          </div>

                          {template.footer && (
                            <p
                              className="text-xs text-gray-500 mt-2 italic"
                              data-testid={`text-template-footer-${template.id}`}
                            >
                              {template.footer}
                            </p>
                          )}

                          {template.buttons && template.buttons.length > 0 && (
                            <div
                              className="mt-3 flex flex-wrap gap-2"
                              data-testid={`buttons-${template.id}`}
                            >
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
                            <span data-testid={`text-language-${template.id}`}>
                              Language: {template.language.toUpperCase()}
                            </span>
                            <span data-testid={`text-date-${template.id}`}>
                              {template.createdAt}
                            </span>
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
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`button-view-template-${template.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid={`button-copy-template-${template.id}`}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {isNoIntegration && (
                  <Card className="mt-6" data-testid="card-no-integration">
                    <CardContent className="py-12 text-center">
                      <SiWhatsapp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3
                        className="text-lg font-medium text-gray-900"
                        data-testid="text-no-integration-title"
                      >
                        No WhatsApp Integration
                      </h3>
                      <p
                        className="text-gray-500 mt-2"
                        data-testid="text-no-integration-description"
                      >
                        Connect your WhatsApp Business account in Settings to
                        manage templates.
                      </p>
                      <Button
                        className="mt-4 bg-green-600 hover:bg-green-700"
                        onClick={() => (window.location.href = "/settings")}
                        data-testid="button-go-to-settings"
                      >
                        Go to Settings
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {!isNoIntegration && filteredTemplates.length === 0 && (
                  <Card className="mt-6" data-testid="card-empty-state">
                    <CardContent className="py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3
                        className="text-lg font-medium text-gray-900"
                        data-testid="text-empty-title"
                      >
                        {searchQuery ||
                        categoryFilter !== "all" ||
                        statusFilter !== "all"
                          ? "No templates found"
                          : "No Templates on This Account"}
                      </h3>
                      <p
                        className="text-gray-500 mt-2"
                        data-testid="text-empty-description"
                      >
                        {searchQuery ||
                        categoryFilter !== "all" ||
                        statusFilter !== "all"
                          ? "Try adjusting your filters"
                          : "There are no message templates on this WhatsApp Business account."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) {
          setHeaderMediaFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }}>
        <DialogContent
          className="max-w-5xl max-h-[90vh] overflow-hidden p-0"
          data-testid="dialog-create-template"
        >
          <div className="flex h-full">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-6 py-4 border-b flex-shrink-0">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">
                    Create Template
                  </DialogTitle>
                  <DialogDescription>
                    Configure your message template for WhatsApp
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <Form {...createForm}>
                  <form
                    onSubmit={createForm.handleSubmit(handleCreateTemplate)}
                    className="space-y-6"
                  >
                    <Card className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-3 gap-4">
                        <FormField
                          control={createForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="order_confirmation"
                                  {...field}
                                  data-testid="input-template-name"
                                />
                              </FormControl>
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
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-template-category">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem
                                    value="AUTHENTICATION"
                                    data-testid="option-create-cat-auth"
                                  >
                                    Authentication
                                  </SelectItem>
                                  <SelectItem
                                    value="UTILITY"
                                    data-testid="option-create-cat-utility"
                                  >
                                    Utility
                                  </SelectItem>
                                  <SelectItem
                                    value="MARKETING"
                                    data-testid="option-create-cat-marketing"
                                  >
                                    Marketing
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage data-testid="error-template-category" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Language</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-template-language">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem
                                    value="es"
                                    data-testid="option-lang-es"
                                  >
                                    Spanish
                                  </SelectItem>
                                  <SelectItem
                                    value="en"
                                    data-testid="option-lang-en"
                                  >
                                    English
                                  </SelectItem>
                                  <SelectItem
                                    value="en_US"
                                    data-testid="option-lang-en-us"
                                  >
                                    English US
                                  </SelectItem>
                                  <SelectItem
                                    value="pt_BR"
                                    data-testid="option-lang-pt-br"
                                  >
                                    Portuguese BR
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage data-testid="error-template-language" />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Message Content
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <FormLabel className="mb-2 block">
                            Header (Optional)
                          </FormLabel>
                          <div className="flex border rounded-lg overflow-hidden">
                            {[
                              { value: "TEXT", label: "Text", icon: Type },
                              {
                                value: "IMAGE",
                                label: "Image",
                                icon: ImageIcon,
                              },
                              { value: "VIDEO", label: "Video", icon: Video },
                              { value: "DOCUMENT", label: "File", icon: File },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  createForm.setValue(
                                    "headerType",
                                    option.value as any,
                                  );
                                  setHeaderMediaFile(null);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }}
                                className={`flex-1 py-2 px-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                                  headerType === option.value
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background hover:bg-muted text-muted-foreground"
                                }`}
                                data-testid={`tab-header-${option.value.toLowerCase()}`}
                              >
                                <option.icon className="w-4 h-4" />
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {headerType === "TEXT" && (
                          <FormField
                            control={createForm.control}
                            name="headerContent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Header Text</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your header text"
                                    {...field}
                                    data-testid="input-header-text"
                                  />
                                </FormControl>
                                <FormMessage data-testid="error-header-text" />
                              </FormItem>
                            )}
                          />
                        )}

                        {(headerType === "IMAGE" ||
                          headerType === "VIDEO" ||
                          headerType === "DOCUMENT") && (
                          <div>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setHeaderMediaFile(file);
                                }
                              }}
                              accept={
                                headerType === "IMAGE" ? "image/jpeg,image/png" :
                                headerType === "VIDEO" ? "video/mp4" :
                                ".pdf,.doc,.docx"
                              }
                              className="hidden"
                              data-testid="input-media-file"
                            />
                            {headerMediaFile ? (
                              <div className="border rounded-lg p-4 bg-muted/20" data-testid="media-preview">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {headerType === "IMAGE" ? (
                                      <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                                        <img 
                                          src={URL.createObjectURL(headerMediaFile)} 
                                          alt="Preview" 
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                        {headerType === "VIDEO" ? <Video className="w-6 h-6 text-muted-foreground" /> : <File className="w-6 h-6 text-muted-foreground" />}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">{headerMediaFile.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {(headerMediaFile.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setHeaderMediaFile(null);
                                      if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                      }
                                    }}
                                    data-testid="button-remove-media"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="border border-dashed rounded-lg p-6 text-center bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer" 
                                onClick={() => fileInputRef.current?.click()}
                                data-testid="media-upload-area"
                              >
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm font-medium text-foreground">
                                  {headerType === "IMAGE"
                                    ? "Upload Image"
                                    : headerType === "VIDEO"
                                      ? "Upload Video"
                                      : "Upload Document"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {headerType === "IMAGE"
                                    ? "JPG, PNG up to 5MB"
                                    : headerType === "VIDEO"
                                      ? "MP4 up to 16MB"
                                      : "PDF up to 100MB"}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <FormField
                          control={createForm.control}
                          name="body"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Hello {{1}}, your appointment is scheduled for {{2}}."
                                  rows={3}
                                  {...field}
                                  data-testid="textarea-template-body"
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Use {"{{variable_name}}"} to insert variables.
                                Ex: {"{{first_name}}"}
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
                              <FormLabel>Footer</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Optional footer text"
                                  {...field}
                                  data-testid="input-template-footer"
                                />
                              </FormControl>
                              <FormMessage data-testid="error-template-footer" />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {bodyContent && bodyContent.match(/\{\{[^}]+\}\}/g) && (
                      <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Variable className="w-4 h-4" />
                            Variable Samples
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            Provide sample values for your variables. These will
                            be verified by WhatsApp.
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {bodyContent
                            .match(/\{\{[^}]+\}\}/g)
                            ?.filter((v, i, arr) => arr.indexOf(v) === i)
                            .map((variable, index) => {
                              const varName = variable.replace(
                                /\{\{|\}\}/g,
                                "",
                              );
                              return (
                                <div
                                  key={index}
                                  className="flex items-center gap-3"
                                >
                                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-medium text-primary">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <Input
                                      placeholder={`Sample for ${varName}`}
                                      className="h-9"
                                      data-testid={`input-variable-sample-${index}`}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-24 truncate">
                                    {variable}
                                  </span>
                                </div>
                              );
                            })}
                        </CardContent>
                      </Card>
                    )}

                    <Card className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <MousePointer className="w-4 h-4" />
                          Call to Action
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={createForm.control}
                          name="buttonType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Button Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-button-type">
                                    <SelectValue placeholder="None" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem
                                    value="NONE"
                                    data-testid="option-button-none"
                                  >
                                    None
                                  </SelectItem>
                                  <SelectItem
                                    value="URL"
                                    data-testid="option-button-url"
                                  >
                                    URL
                                  </SelectItem>
                                  <SelectItem
                                    value="QUICK_REPLY"
                                    data-testid="option-button-quick"
                                  >
                                    Quick Reply
                                  </SelectItem>
                                  <SelectItem
                                    value="CALL"
                                    data-testid="option-button-call"
                                  >
                                    Phone Call
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage data-testid="error-button-type" />
                            </FormItem>
                          )}
                        />

                        {buttonType !== "NONE" && (
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={createForm.control}
                              name="buttonText"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Button Label</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Click here"
                                      {...field}
                                      data-testid="input-button-text"
                                    />
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
                                    <FormLabel>URL</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="https://example.com"
                                        {...field}
                                        data-testid="input-button-url"
                                      />
                                    </FormControl>
                                    <FormMessage data-testid="error-button-url" />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </form>
                </Form>
              </div>

              <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createForm.handleSubmit(handleCreateTemplate)}
                  data-testid="button-submit-template"
                >
                  Submit for Approval
                </Button>
              </div>
            </div>

            <div className="w-[300px] border-l bg-muted/20 hidden lg:flex flex-col">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium">Preview</p>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                <PhonePreview
                  headerType={headerType}
                  headerContent={headerContent}
                  body={bodyContent}
                  footer={footerContent}
                  buttonType={buttonType}
                  buttonText={buttonText}
                />
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogContent
          className="max-w-5xl max-h-[90vh] overflow-hidden p-0 rounded-2xl border bg-white shadow-xl"
          data-testid="dialog-create-template"
        >
          <div className="flex h-full">
            {/* LEFT SIDE */}
            <div className="flex-1 flex flex-col">
              {/* HEADER */}
              <div className="px-6 py-5 border-b bg-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold tracking-tight">
                    Create Template
                  </DialogTitle>

                  <DialogDescription className="text-gray-500 mt-1">
                    Configure your message template for WhatsApp
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* BODY SCROLL */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <Form {...createForm}>
                  <form
                    onSubmit={createForm.handleSubmit(handleCreateTemplate)}
                    className="space-y-6"
                  >
                    {/* SETTINGS */}
                    <Card className="border rounded-xl shadow-sm bg-white overflow-hidden">
                      <CardHeader className="bg-gray-50 border-b px-5 py-3">
                        <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <Settings className="w-4 h-4 text-green-600" />
                          Settings
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="grid grid-cols-3 gap-4 pt-4 pb-6 px-5">
                        {/* Template Name */}
                        <FormField
                          control={createForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium text-gray-700">
                                Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="order_confirmation"
                                  className="h-11 rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Category */}
                        <FormField
                          control={createForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium text-gray-700">
                                Category
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 rounded-lg">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="AUTHENTICATION">
                                    Authentication
                                  </SelectItem>
                                  <SelectItem value="UTILITY">
                                    Utility
                                  </SelectItem>
                                  <SelectItem value="MARKETING">
                                    Marketing
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Language */}
                        <FormField
                          control={createForm.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium text-gray-700">
                                Language
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 rounded-lg">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="es">Spanish</SelectItem>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="en_US">
                                    English US
                                  </SelectItem>
                                  <SelectItem value="pt_BR">
                                    Portuguese BR
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* MESSAGE CONTENT */}
                    <Card className="border rounded-xl shadow-sm bg-white overflow-hidden">
                      <CardHeader className="bg-gray-50 border-b px-5 py-3">
                        <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-green-600" />
                          Message Content
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-6 pt-6 pb-8 px-5">
                        {/* HEADER TYPE TABS */}
                        <div>
                          <FormLabel className="font-medium text-gray-700 mb-2 block">
                            Header (Optional)
                          </FormLabel>

                          <div className="flex rounded-xl overflow-hidden border bg-gray-50">
                            {[
                              { value: "TEXT", label: "Text", icon: Type },
                              {
                                value: "IMAGE",
                                label: "Image",
                                icon: ImageIcon,
                              },
                              { value: "VIDEO", label: "Video", icon: Video },
                              { value: "DOCUMENT", label: "File", icon: File },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  createForm.setValue(
                                    "headerType",
                                    option.value as any,
                                  )
                                }
                                className={`flex-1 py-2.5 text-sm flex items-center justify-center gap-1.5 transition-all
                                  ${
                                    headerType === option.value
                                      ? "bg-green-600 text-white shadow-inner"
                                      : "hover:bg-white text-gray-600"
                                  }`}
                                data-testid={`tab-header-${option.value.toLowerCase()}`}
                              >
                                <option.icon className="w-4 h-4" />
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* HEADER TEXT */}
                        {headerType === "TEXT" && (
                          <FormField
                            control={createForm.control}
                            name="headerContent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-medium text-gray-700">
                                  Header Text
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your header text"
                                    className="h-11 rounded-lg"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* MEDIA UPLOAD PLACEHOLDER */}
                        {(headerType === "IMAGE" ||
                          headerType === "VIDEO" ||
                          headerType === "DOCUMENT") && (
                          <div
                            className="border border-dashed rounded-xl p-6 text-center bg-gray-50"
                            data-testid="media-upload-area"
                          >
                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-700">
                              {headerType === "IMAGE"
                                ? "Upload Image"
                                : headerType === "VIDEO"
                                  ? "Upload Video"
                                  : "Upload Document"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {headerType === "IMAGE"
                                ? "JPG, PNG up to 5MB"
                                : headerType === "VIDEO"
                                  ? "MP4 up to 16MB"
                                  : "PDF up to 100MB"}
                            </p>
                          </div>
                        )}

                        {/* MESSAGE BODY */}
                        <FormField
                          control={createForm.control}
                          name="body"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium text-gray-700">
                                Message *
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Hello {{1}}, your appointment is scheduled for {{2}}."
                                  rows={3}
                                  className="resize-none rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-gray-500">
                                Use {"{{1}}"}, {"{{2}}"} for variables.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* VARIABLE EXAMPLES (INSIDE SAME CARD) */}
                        {bodyContent && bodyContent.match(/\{\{[^}]+\}\}/g) && (
                          <div className="bg-gray-50 border rounded-xl p-5 space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Variable className="w-4 h-4 text-green-600" />
                              <p className="text-sm font-semibold text-gray-800">
                                Variable Samples
                              </p>
                            </div>

                            <p className="text-xs text-gray-600">
                              Provide sample values for each variable (required
                              by Meta).
                            </p>

                            {bodyContent
                              .match(/\{\{[^}]+\}\}/g)
                              ?.filter((v, i, arr) => arr.indexOf(v) === i)
                              .map((variable, index) => {
                                const varName = variable.replace(
                                  /\{\{|\}\}/g,
                                  "",
                                );

                                return (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3"
                                  >
                                    <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                                      <span className="text-xs font-medium text-green-700">
                                        {index + 1}
                                      </span>
                                    </div>

                                    <Input
                                      placeholder={`Sample for ${varName}`}
                                      className="h-9 rounded-lg flex-1"
                                      data-testid={`input-variable-sample-${index}`}
                                    />

                                    <span className="text-xs text-gray-500 w-24 truncate">
                                      {variable}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {/* FOOTER */}
                        <FormField
                          control={createForm.control}
                          name="footer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium text-gray-700">
                                Footer
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Optional footer text"
                                  className="h-11 rounded-lg"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* CTA */}
                    <Card className="border rounded-xl shadow-sm bg-white overflow-hidden">
                      <CardHeader className="bg-gray-50 border-b px-5 py-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-800">
                          <MousePointer className="w-4 h-4 text-green-600" />
                          Call to Action
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4 px-5 py-6">
                        <FormField
                          control={createForm.control}
                          name="buttonType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-medium text-gray-700">
                                Button Type
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 rounded-lg">
                                    <SelectValue placeholder="None" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="NONE">None</SelectItem>
                                  <SelectItem value="URL">URL</SelectItem>
                                  <SelectItem value="QUICK_REPLY">
                                    Quick Reply
                                  </SelectItem>
                                  <SelectItem value="CALL">
                                    Phone Call
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {buttonType !== "NONE" && (
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={createForm.control}
                              name="buttonText"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-medium text-gray-700">
                                    Button Label
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Click here"
                                      className="h-11 rounded-lg"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {buttonType === "URL" && (
                              <FormField
                                control={createForm.control}
                                name="buttonUrl"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-medium text-gray-700">
                                      URL
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="https://example.com"
                                        className="h-11 rounded-lg"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </form>
                </Form>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  className="rounded-lg bg-green-600 hover:bg-green-700 text-white"
                  onClick={createForm.handleSubmit(handleCreateTemplate)}
                >
                  Submit for Approval
                </Button>
              </div>
            </div>

            {/* RIGHT SIDE PREVIEW */}
            <div className="w-[300px] border-l bg-gray-50 hidden lg:flex flex-col">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium text-gray-700">Preview</p>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                <PhonePreview
                  headerType={headerType}
                  headerContent={headerContent}
                  body={bodyContent}
                  footer={footerContent}
                  buttonType={buttonType}
                  buttonText={buttonText}
                />
              </div>
            </div>
          </div>
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
            <form
              onSubmit={sendForm.handleSubmit(handleSendTemplate)}
              className="space-y-4"
            >
              <FormField
                control={sendForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1234567890"
                        {...field}
                        data-testid="input-phone-number"
                      />
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSendModalOpen(false)}
                  data-testid="button-cancel-send"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={sendTemplateMutation.isPending}
                  data-testid="button-send-message"
                >
                  {sendTemplateMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
