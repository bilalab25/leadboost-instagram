import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Loader2,
  DollarSign,
  Settings as SettingsIcon,
  Building,
  RefreshCw,
  Trash2,
  Store, // For Leadboost CRM
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

interface Integration {
  id: string;
  provider: string;
  category: "pos" | "ecommerce" | "social_media" | "crm";
  storeName: string;
  storeUrl?: string;
  isActive: boolean;
  syncEnabled: boolean;
  lastSyncAt?: string;
  settings?: any;
  createdAt: string;
}

export default function IntegrationsTab({
  isAddIntegrationDialogOpen,
  setIsAddIntegrationDialogOpen,
  setDialogSelectedCategory,
  setDialogSelectedProvider,
  setNewIntegrationStoreName,
  setNewIntegrationFields,
  handleCreateIntegration,
  dialogSelectedCategory,
  dialogSelectedProvider,
  filteredProviders,
  newIntegrationStoreName,
  newIntegrationFields,
  integrations,
  INTEGRATION_CATEGORIES_DISPLAY,
  INTEGRATION_PROVIDERS,
  integrationsLoading,
  handleSyncProducts,
  handleDeleteIntegration,
}) {
  const { isSpanish } = useLanguage(); // Assuming useLanguage hook is available

  // 🔄 Unified connection handler for all Meta integrations
  const handleConnect = (provider: string) => {
    let url = "";

    if (["facebook", "instagram", "threads"].includes(provider)) {
      // 🔁 Facebook, Instagram, and Threads all use Facebook OAuth flow
      url = "/api/integrations/facebook/connect";
    } else if (provider === "whatsapp") {
      // 🔁 WhatsApp uses a direct POST request
      fetch("/api/integrations/whatsapp/connect", { 
        method: "POST",
        credentials: "include",
      })
        .then(res => {
          if (!res.ok) throw new Error("WhatsApp connection failed");
          return res.json();
        })
        .then(() => {
          window.location.reload();
        })
        .catch(err => {
          console.error("WhatsApp connect error:", err);
          alert(isSpanish 
            ? "Error al conectar WhatsApp. Verifica que las credenciales estén configuradas."
            : "Error connecting WhatsApp. Please verify credentials are configured.");
        });
      return;
    } else {
      alert(
        isSpanish
          ? `La conexión para ${provider} aún no está disponible.`
          : `Connection for ${provider} is not available yet.`
      );
      return;
    }

    // 🔄 For OAuth providers (Facebook/Instagram/Threads)
    const popup = window.open(url, "_blank", "width=600,height=700");

    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        window.location.reload();
      }
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderIntegrationCard = (integration: Integration) => {
    const providerInfo = INTEGRATION_PROVIDERS[integration.provider];
    const IconComponent = providerInfo?.icon || Store;

    return (
      <div
        key={integration.id}
        className="flex items-center justify-between p-4 border rounded-lg"
        data-testid={`integration-${integration.id}`}
      >
        <div className="flex items-center gap-3">
          <IconComponent className="h-8 w-8 text-primary" />
          <div>
            <h3 className="font-semibold">{integration.storeName}</h3>
            <p className="text-sm text-muted-foreground">
              {providerInfo?.name} •{" "}
              {integration.storeUrl || (isSpanish ? "N/A" : "N/A")}
            </p>
            {integration.lastSyncAt && (
              <p className="text-xs text-muted-foreground">
                {isSpanish ? "Última sincronización:" : "Last sync:"}{" "}
                {formatDate(integration.lastSyncAt)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={integration.isActive ? "default" : "secondary"}>
            {integration.isActive
              ? isSpanish
                ? "Activo"
                : "Active"
              : isSpanish
                ? "Inactivo"
                : "Inactive"}
          </Badge>

          {(integration.category === "pos" ||
            integration.category === "ecommerce") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSyncProducts(integration.id)}
              data-testid={`sync-products-${integration.id}`}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteIntegration(integration.id)}
            data-testid={`delete-integration-${integration.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">
            {isSpanish ? "Gestión de Integraciones" : "Integration Management"}
          </h2>
          <p className="text-muted-foreground">
            {isSpanish
              ? "Conecta varias plataformas para activar campañas geniales y la creación de contenido."
              : "Connect various platforms to activate genius campaign and content creation."}
          </p>
        </div>
        {/* The dialog is now triggered by category-specific buttons */}
      </div>

      <Dialog
        open={isAddIntegrationDialogOpen}
        onOpenChange={setIsAddIntegrationDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isSpanish ? "Añadir Nueva Integración" : "Add New Integration"}
            </DialogTitle>
            <DialogDescription>
              {isSpanish
                ? "Selecciona un proveedor para conectar un nuevo servicio."
                : "Select a provider to connect a new service."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Integration Category Selection (pre-selected if opened from category button) */}
            <div>
              <Label htmlFor="category-select">
                {isSpanish
                  ? "Categoría de Integración"
                  : "Integration Category"}
              </Label>
              <Select
                onValueChange={(value: Integration["category"]) => {
                  setDialogSelectedCategory(value);
                  setDialogSelectedProvider(""); // Reset provider when category changes
                  setNewIntegrationFields({}); // Reset fields too
                }}
                value={dialogSelectedCategory}
                disabled={!!dialogSelectedCategory} // Disable if pre-selected
              >
                <SelectTrigger
                  id="category-select"
                  data-testid="category-select"
                >
                  <SelectValue
                    placeholder={
                      isSpanish
                        ? "Selecciona una categoría"
                        : "Select a category"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INTEGRATION_CATEGORIES_DISPLAY).map(
                    ([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <info.icon className="h-4 w-4" />
                          {info.name}
                        </div>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Integration Provider Selection (filtered by category) */}
            {dialogSelectedCategory && (
              <div>
                <Label htmlFor="provider-select">
                  {isSpanish ? "Proveedor" : "Provider"}
                </Label>
                <Select
                  onValueChange={(value) => {
                    setDialogSelectedProvider(value);
                    setNewIntegrationFields({}); // Reset fields when provider changes
                  }}
                  value={dialogSelectedProvider}
                  disabled={!dialogSelectedCategory}
                >
                  <SelectTrigger
                    id="provider-select"
                    data-testid="provider-select"
                  >
                    <SelectValue
                      placeholder={
                        isSpanish
                          ? "Selecciona un proveedor"
                          : "Select a provider"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProviders.map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <info.icon className="h-4 w-4" />
                          {info.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dialogSelectedProvider && (
              <>
                <div>
                  <Label htmlFor="store-name-input">
                    {INTEGRATION_PROVIDERS[dialogSelectedProvider]?.category ===
                    "social_media"
                      ? isSpanish
                        ? "Nombre de la Cuenta"
                        : "Account Name"
                      : INTEGRATION_PROVIDERS[dialogSelectedProvider]
                            ?.category === "crm"
                        ? isSpanish
                          ? "Nombre de Instancia CRM"
                          : "CRM Instance Name"
                        : isSpanish
                          ? "Nombre de Tienda/Sitio"
                          : "Store/Site Name"}
                  </Label>
                  <Input
                    id="store-name-input"
                    placeholder={
                      INTEGRATION_PROVIDERS[dialogSelectedProvider]
                        ?.category === "social_media"
                        ? isSpanish
                          ? "Tu Cuenta de Instagram"
                          : "Your Instagram Account"
                        : INTEGRATION_PROVIDERS[dialogSelectedProvider]
                              ?.category === "crm"
                          ? isSpanish
                            ? "Mi Instancia CRM de Ventas"
                            : "My Sales CRM"
                          : isSpanish
                            ? "El nombre de tu tienda/sitio"
                            : "Your store/site name"
                    }
                    value={newIntegrationStoreName}
                    onChange={(e) => setNewIntegrationStoreName(e.target.value)}
                    data-testid="store-name-input"
                  />
                </div>

                {INTEGRATION_PROVIDERS[dialogSelectedProvider].fields.map(
                  (field) => (
                    <div key={field.name}>
                      <Label htmlFor={`${field.name}-input`}>
                        {field.label}
                      </Label>
                      {field.type === "select" ? (
                        <Select
                          value={newIntegrationFields[field.name] || ""}
                          onValueChange={(val) =>
                            setNewIntegrationFields((prev) => ({
                              ...prev,
                              [field.name]: val,
                            }))
                          }
                        >
                          <SelectTrigger id={`${field.name}-input`}>
                            <SelectValue
                              placeholder={field.placeholder || ""}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`${field.name}-input`}
                          type={field.type}
                          placeholder={field.placeholder || ""}
                          value={newIntegrationFields[field.name] || ""}
                          onChange={(e) =>
                            setNewIntegrationFields((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }))
                          }
                        />
                      )}
                    </div>
                  ),
                )}
              </>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddIntegrationDialogOpen(false);
                  setDialogSelectedCategory("");
                  setDialogSelectedProvider("");
                  setNewIntegrationStoreName("");
                  setNewIntegrationFields({});
                }}
                data-testid="cancel-button"
              >
                {isSpanish ? "Cancelar" : "Cancel"}
              </Button>
              <Button
                type="button"
                onClick={handleCreateIntegration}
                disabled={!dialogSelectedProvider || !newIntegrationStoreName}
                data-testid="create-integration-button"
              >
                <Plus className="mr-2 h-4 w-4" />
                {isSpanish ? "Crear Integración" : "Create Integration"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Render Integrations by Category as Accordion */}
      <Accordion type="multiple" defaultValue={["social_media"]}>
        {" "}
        {/* 'multiple' allows several open, 'single' only one. DefaultValue opens one on load. */}
        {Object.entries(INTEGRATION_CATEGORIES_DISPLAY).map(
          ([categoryKey, categoryInfo]) => (
            <AccordionItem key={categoryKey} value={categoryKey}>
              <AccordionTrigger>
                <div className="flex items-center gap-2 py-2">
                  {" "}
                  {/* Added padding to trigger for better spacing */}
                  <categoryInfo.icon className="h-5 w-5" />
                  <span className="text-lg font-semibold">
                    {categoryInfo.name}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {/* The Card structure is maintained inside AccordionContent for consistent styling */}
                <Card className="border-none shadow-none">
                  {" "}
                  {/* Remove border/shadow from inner card if AccordionItem already provides it */}
                  <CardHeader className="pt-0">
                    {" "}
                    {/* Adjust padding if needed */}
                    <CardDescription>
                      {categoryInfo.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {integrationsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      (() => {
                        const integrationsInCategory = integrations.filter(
                          // Usando el estado real de integraciones
                          (integration) => integration.category === categoryKey,
                        );

                        if (categoryKey === "social_media") {
                          return (
                            <>
                              <h3 className="text-lg font-semibold mb-4">
                                {isSpanish
                                  ? "Plataformas de Redes Sociales Disponibles"
                                  : "Available Social Media Platforms"}
                              </h3>
                              <div className="space-y-4 mb-8">
                                {Object.entries(INTEGRATION_PROVIDERS)
                                  .filter(
                                    ([, info]) =>
                                      info.category === "social_media",
                                  )
                                  .map(([providerKey, providerInfo]) => {
                                    const connectedIntegration =
                                      integrations.find(
                                        (int) =>
                                          int.provider === providerKey &&
                                          int.isActive,
                                      );

                                    const Icon = providerInfo.icon;

                                    return (
                                      <div
                                        key={providerKey}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Icon className="h-8 w-8 text-primary" />
                                          <div>
                                            <h3 className="font-semibold">
                                              {providerInfo.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                              {providerInfo.description}
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
                                              handleDeleteIntegration(
                                                connectedIntegration.id,
                                              )
                                            }
                                            className="text-red-600 border-red-400 hover:bg-red-50"
                                          >
                                            {isSpanish
                                              ? "Desconectar"
                                              : "Disconnect"}
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            onClick={() => handleConnect(providerKey)}
                                            data-testid={`connect-${providerKey}`}
                                          >
                                            {isSpanish ? "Conectar" : "Connect"}
                                          </Button>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </>
                          );
                        } else {
                          // Lógica existente para otras categorías
                          return integrationsInCategory.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <categoryInfo.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>
                                {isSpanish
                                  ? `No hay integraciones de ${categoryInfo.name.toLowerCase()} conectadas aún.`
                                  : `No ${categoryInfo.name.toLowerCase()} connected yet.`}
                              </p>
                              <p className="text-sm">
                                {isSpanish
                                  ? `Añade tu primera integración de ${categoryInfo.name.toLowerCase().replace("integrations", "integration")} para empezar.`
                                  : `Add your first ${categoryInfo.name.toLowerCase().replace("integrations", "integration")} to get started.`}
                              </p>
                              <Button
                                className="mt-4"
                                onClick={() => {
                                  setDialogSelectedCategory(
                                    categoryKey as Integration["category"],
                                  );
                                  setIsAddIntegrationDialogOpen(true);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                {isSpanish
                                  ? `Añadir Integración ${categoryInfo.name}`
                                  : `Add ${categoryInfo.name} Integration`}
                              </Button>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {integrationsInCategory.map(
                                renderIntegrationCard,
                              )}
                              <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => {
                                  setDialogSelectedCategory(
                                    categoryKey as Integration["category"],
                                  );
                                  setIsAddIntegrationDialogOpen(true);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                {isSpanish
                                  ? `Añadir otra Integración ${categoryInfo.name}`
                                  : `Add another ${categoryInfo.name} Integration`}
                              </Button>
                            </div>
                          );
                        }
                      })()
                    )}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ),
        )}
      </Accordion>

      {/* Leadboost CRM Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Leadboost CRM
          </CardTitle>
          <CardDescription>
            {isSpanish
              ? "¿No tienes un CRM? Usa el potente CRM de Leadboost para gestionar tus clientes y leads."
              : "Don't have a CRM? Use Leadboost's powerful CRM to manage your customers and leads."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            <p className="text-lg font-semibold">
              {isSpanish ? "Solo $29 USD/mes" : "Only $29 USD/month"}
            </p>
          </div>
          <Button
            onClick={() =>
              window.open("https://www.leadboost.com/crm-signup", "_blank")
            }
          >
            {isSpanish ? "Saber Más y Suscribirse" : "Learn More & Subscribe"}
          </Button>
        </CardContent>
      </Card>

      {/* Products and Transactions Grid (still relevant for POS/E-commerce data) */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Products */}
        {/* <Card>
          <CardHeader>
            <CardTitle>
              {isSpanish
                ? "Productos Sincronizados"
                : "Synced Products"}
            </CardTitle>
            <CardDescription>
              {isSpanish
                ? "Productos importados de tus sistemas POS y E-commerce conectados"
                : "Products imported from your connected POS and E-commerce systems"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : dummyProducts.length === 0 ? ( // Usando dummy data
              <p className="text-center text-muted-foreground py-4">
                {isSpanish
                  ? "No hay productos sincronizados aún"
                  : "No products synced yet"}
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {dummyProducts
                  .slice(0, 10)
                  .map((product: Product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded"
                      data-testid={`product-${product.id}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {product.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {product.sku} • {product.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatCurrency(
                            product.price,
                            product.currency,
                          )}
                        </p>
                        {product.stockQuantity !== null && (
                          <p className="text-xs text-muted-foreground">
                            {isSpanish ? "Stock:" : "Stock:"}{" "}
                            {product.stockQuantity}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>*/}

        {/* Recent Transactions */}
        {/*<Card>
          <CardHeader>
            <CardTitle>
              {isSpanish
                ? "Transacciones Recientes"
                : "Recent Transactions"}
            </CardTitle>
            <CardDescription>
              {isSpanish
                ? "Últimas ventas de tus sistemas POS y E-commerce conectados"
                : "Latest sales from your connected POS and E-commerce systems"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : dummyTransactions.length === 0 ? ( // Usando dummy data
              <p className="text-center text-muted-foreground py-4">
                {isSpanish
                  ? "No hay transacciones sincronizadas aún"
                  : "No transactions synced yet"}
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {dummyTransactions
                  .slice(0, 10)
                  .map((transaction: SalesTransaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded"
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {transaction.customerName ||
                            (isSpanish
                              ? "Cliente Invitado"
                              : "Guest Customer")}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {transaction.paymentMethod} •{" "}
                          {formatDate(transaction.transactionDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatCurrency(
                            transaction.totalAmount,
                            transaction.currency,
                          )}
                        </p>
                        <Badge
                          variant={
                            transaction.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>*/}
      </div>
    </>
  );
}
