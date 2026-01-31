import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, DollarSign, Plus, Trash2, ExternalLink, Loader2, ImageIcon, MessageSquare, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBrand } from "@/contexts/BrandContext";
import { apiRequest } from "@/lib/queryClient";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
}

interface BillingSummary {
  freeImagesRemaining: number;
  hasPaymentMethod: boolean;
  inboxSubscriptionActive: boolean;
  subscriptionStatus: string | null;
  unbilledImages: number;
  unbilledAmountCents: number;
}

interface PaymentMethodsTabProps {
  isSpanish: boolean;
}

function AddPaymentMethodForm({ brandId, onSuccess }: { brandId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/billing/${brandId}/confirm-payment-method`);
      if (!res.ok) throw new Error("Failed to confirm payment method");
      return res.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Error submitting payment details");
        setIsProcessing(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Error confirming payment method");
        setIsProcessing(false);
        return;
      }

      confirmMutation.mutate();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing || confirmMutation.isPending}
      >
        {isProcessing || confirmMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Agregar Tarjeta
          </>
        )}
      </Button>
    </form>
  );
}

export default function PaymentMethodTab({ isSpanish }: PaymentMethodsTabProps) {
  const { activeBrandId } = useBrand();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  const { data: stripeConfig } = useQuery<{ publishableKey: string }>({
    queryKey: ["/api/stripe/config"],
  });

  const { data: billing, isLoading: billingLoading } = useQuery<BillingSummary>({
    queryKey: ["/api/billing", activeBrandId],
    queryFn: async () => {
      if (!activeBrandId) return null;
      const res = await fetch(`/api/billing/${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch billing");
      return res.json();
    },
    enabled: !!activeBrandId,
  });

  const { data: paymentMethodsData, isLoading: pmLoading } = useQuery<{ paymentMethods: PaymentMethod[] }>({
    queryKey: ["/api/billing", activeBrandId, "payment-methods"],
    queryFn: async () => {
      if (!activeBrandId) return { paymentMethods: [] };
      const res = await fetch(`/api/billing/${activeBrandId}/payment-methods`);
      if (!res.ok) throw new Error("Failed to fetch payment methods");
      return res.json();
    },
    enabled: !!activeBrandId,
  });

  const setupIntentMutation = useMutation({
    mutationFn: async () => {
      if (!activeBrandId) throw new Error("No active brand");
      const res = await apiRequest("POST", `/api/billing/${activeBrandId}/setup-intent`);
      if (!res.ok) throw new Error("Failed to create setup intent");
      return res.json();
    },
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      if (!activeBrandId) throw new Error("No active brand");
      const res = await apiRequest("DELETE", `/api/billing/${activeBrandId}/payment-methods/${paymentMethodId}`);
      if (!res.ok) throw new Error("Failed to delete payment method");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing", activeBrandId, "payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing", activeBrandId] });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      if (!activeBrandId) throw new Error("No active brand");
      const res = await apiRequest("POST", `/api/billing/${activeBrandId}/portal`);
      if (!res.ok) throw new Error("Failed to create portal session");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
  });

  const inboxSubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!activeBrandId) throw new Error("No active brand");
      const res = await apiRequest("POST", `/api/billing/${activeBrandId}/subscribe-inbox`);
      if (!res.ok) throw new Error("Failed to create checkout session");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const handleOpenAddDialog = async () => {
    if (!stripeConfig?.publishableKey) return;
    
    setStripePromise(loadStripe(stripeConfig.publishableKey));
    setupIntentMutation.mutate();
    setIsAddDialogOpen(true);
  };

  const handlePaymentMethodAdded = () => {
    setIsAddDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/billing", activeBrandId, "payment-methods"] });
    queryClient.invalidateQueries({ queryKey: ["/api/billing", activeBrandId] });
  };

  const paymentMethods = paymentMethodsData?.paymentMethods || [];

  if (billingLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            {isSpanish ? "Resumen de Facturación" : "Billing Summary"}
          </CardTitle>
          <CardDescription>
            {isSpanish
              ? "Tu uso actual y créditos disponibles"
              : "Your current usage and available credits"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Free Images */}
          <div className="flex justify-between items-center border-b pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {isSpanish ? "Imágenes Gratuitas" : "Free Images"}
              </span>
            </div>
            <Badge variant={billing?.freeImagesRemaining && billing.freeImagesRemaining > 0 ? "default" : "secondary"}>
              {billing?.freeImagesRemaining ?? 0} / 10
            </Badge>
          </div>

          {/* Unbilled Usage */}
          {billing && billing.unbilledImages > 0 && (
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="font-medium">
                  {isSpanish ? "Uso Pendiente de Cobro" : "Pending Charges"}
                </span>
                <p className="text-sm text-muted-foreground">
                  {billing.unbilledImages} {isSpanish ? "imágenes" : "images"} @ $0.12
                </p>
              </div>
              <span className="text-lg font-semibold">
                ${(billing.unbilledAmountCents / 100).toFixed(2)}
              </span>
            </div>
          )}

          {/* Inbox Subscription */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {isSpanish ? "Suscripción Inbox" : "Inbox Subscription"}
              </span>
            </div>
            {billing?.inboxSubscriptionActive ? (
              <Badge className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                {isSpanish ? "Activa" : "Active"} - $99/mes
              </Badge>
            ) : (
              <Button 
                size="sm" 
                onClick={() => inboxSubscribeMutation.mutate()}
                disabled={inboxSubscribeMutation.isPending}
              >
                {inboxSubscribeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isSpanish ? "Suscribirse $99/mes" : "Subscribe $99/mo"
                )}
              </Button>
            )}
          </div>

          {/* Manage Subscription */}
          {billing?.inboxSubscriptionActive && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              className="w-full mt-2"
            >
              {portalMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              {isSpanish ? "Gestionar Suscripción" : "Manage Subscription"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              {isSpanish ? "Métodos de Pago" : "Payment Methods"}
            </CardTitle>
            <CardDescription>
              {isSpanish
                ? "Tarjetas guardadas para pagos automáticos"
                : "Saved cards for automatic payments"}
            </CardDescription>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenAddDialog} disabled={!stripeConfig?.publishableKey}>
                <Plus className="mr-2 h-4 w-4" />
                {isSpanish ? "Añadir Tarjeta" : "Add Card"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {isSpanish ? "Añadir Método de Pago" : "Add Payment Method"}
                </DialogTitle>
                <DialogDescription>
                  {isSpanish
                    ? "Añade una tarjeta para pagar por imágenes generadas"
                    : "Add a card to pay for generated images"}
                </DialogDescription>
              </DialogHeader>

              {setupIntentMutation.isPending && (
                <div className="py-8 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Preparando...</p>
                </div>
              )}

              {stripePromise && setupIntentMutation.data && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: setupIntentMutation.data.clientSecret,
                    appearance: { theme: "stripe" },
                  }}
                >
                  <AddPaymentMethodForm 
                    brandId={activeBrandId!} 
                    onSuccess={handlePaymentMethodAdded} 
                  />
                </Elements>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {pmLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {isSpanish
                  ? "No hay métodos de pago guardados"
                  : "No payment methods saved"}
              </p>
              <p className="text-sm">
                {isSpanish
                  ? "Añade una tarjeta para continuar generando imágenes después de usar tus 10 gratis"
                  : "Add a card to continue generating images after your 10 free ones"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-gray-600" />
                    <div>
                      <h4 className="font-medium capitalize">
                        {method.brand} •••• {method.last4}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {isSpanish ? "Expira" : "Expires"} {method.expMonth}/{method.expYear}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePaymentMethodMutation.mutate(method.id)}
                    disabled={deletePaymentMethodMutation.isPending}
                  >
                    {deletePaymentMethodMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <h4 className="font-medium mb-2">
            {isSpanish ? "Información de Precios" : "Pricing Information"}
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• 10 {isSpanish ? "imágenes gratis para empezar" : "free images to start"}</li>
            <li>• $0.12 USD {isSpanish ? "por imagen después" : "per image after"}</li>
            <li>• {isSpanish ? "Cobro automático cada 2 días" : "Automatic billing every 2 days"}</li>
            <li>• Inbox: $99 USD/{isSpanish ? "mes" : "month"}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
