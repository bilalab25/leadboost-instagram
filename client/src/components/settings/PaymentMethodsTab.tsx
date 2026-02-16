import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, DollarSign, Plus, Trash2, ExternalLink, Loader2, CheckCircle, Sparkles, Rocket, Crown, Check, ArrowRight } from "lucide-react";
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

  const currentPlan = billing?.subscriptionStatus === "pro" ? "pro" 
    : billing?.subscriptionStatus === "growth" ? "growth" 
    : "free";

  const planTiers = [
    {
      key: "free",
      name: "FREE",
      price: 0,
      icon: Sparkles,
      gradient: "from-slate-500 to-slate-600",
      features: isSpanish
        ? ["5 Posts/Stories (Instagram, Facebook, Twitter)", "Auto-programación y publicación"]
        : ["5 Posts/Stories (Instagram, Facebook, Twitter)", "Auto-scheduling & posting"],
      tagline: isSpanish ? "Experimenta el Marketing en Autopilot." : "Experience Autopilot Marketing.",
    },
    {
      key: "growth",
      name: "GROWTH",
      price: 29,
      icon: Rocket,
      gradient: "from-blue-500 to-blue-700",
      features: isSpanish
        ? ["30 Posts/Stories (Instagram, Facebook, Twitter)", "8 Videos TikTok/Reels", "4 Campañas de Email", "Auto-programación y publicación", "Dashboard de analíticas básicas"]
        : ["30 Posts/Stories (Instagram, Facebook, Twitter)", "8 TikTok/Reels videos", "4 Email campaigns", "Auto-scheduling & posting", "Basic analytics dashboard"],
      tagline: isSpanish ? "Marketing en Autopilot para marcas en crecimiento." : "Autopilot Marketing for growing brands.",
    },
    {
      key: "pro",
      name: "PRO",
      price: 79,
      icon: Crown,
      gradient: "from-purple-500 to-indigo-600",
      features: isSpanish
        ? ["90 Posts/Stories (Instagram, Facebook, Twitter)", "16 Videos TikTok/Reels", "20 Campañas de Email", "Auto-programación y publicación", "Analíticas avanzadas", "Estrategia de crecimiento IA avanzada"]
        : ["90 Posts/Stories (Instagram, Facebook, Twitter)", "16 TikTok/Reels videos", "20 Email campaigns", "Auto-scheduling & posting", "Advanced analytics", "Advanced AI Growth Strategy"],
      tagline: isSpanish ? "Sistema completo de Marketing en Autopilot." : "Full Autopilot Marketing System.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            {isSpanish ? "Tu Plan Actual" : "Your Current Plan"}
          </CardTitle>
          <CardDescription>
            {isSpanish
              ? "Gestiona tu suscripción y consulta los planes disponibles"
              : "Manage your subscription and view available plans"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {planTiers.map((plan) => {
              const isCurrent = currentPlan === plan.key;
              const PlanIcon = plan.icon;

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-xl border-2 p-5 transition-all duration-200 ${
                    isCurrent
                      ? "border-blue-500 bg-blue-50/50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white text-xs px-3">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {isSpanish ? "Plan Actual" : "Current Plan"}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3 mt-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${plan.gradient} shadow-sm`}>
                      <PlanIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{plan.name}</h4>
                      <p className="text-xs text-gray-500">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-black text-gray-900">
                      {plan.price === 0 ? (isSpanish ? "Gratis" : "Free") : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500 text-sm ml-1">/{isSpanish ? "mes" : "mo"}</span>
                    )}
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && plan.price > 0 && (
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg"
                      onClick={() => window.location.href = "/pricing"}
                    >
                      {isSpanish ? "Mejorar Plan" : "Upgrade"}
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  )}

                  {!isCurrent && plan.price === 0 && currentPlan !== "free" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-lg"
                      onClick={() => portalMutation.mutate()}
                      disabled={portalMutation.isPending}
                    >
                      {portalMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        isSpanish ? "Cambiar a Free" : "Downgrade"
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {billing?.subscriptionStatus && billing.subscriptionStatus !== "free" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              className="w-full mt-4"
            >
              {portalMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              {isSpanish ? "Gestionar Suscripción en Stripe" : "Manage Subscription on Stripe"}
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

      {/* Full Pricing Link */}
      <Card className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200/50">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            {isSpanish
              ? "¿Quieres ver todos los detalles, add-ons y precios anuales?"
              : "Want to see all details, add-ons, and annual pricing?"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={() => window.location.href = "/pricing"}
          >
            {isSpanish ? "Ver página de precios completa" : "View full pricing page"}
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
