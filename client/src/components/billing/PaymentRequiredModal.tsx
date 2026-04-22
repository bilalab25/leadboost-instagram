import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useBrand } from "@/contexts/BrandContext";
import { useLanguage } from "@/hooks/useLanguage";

interface PaymentRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function PaymentForm({ brandId, onSuccess }: { brandId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { isSpanish } = useLanguage();
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

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(
          submitError.message ||
            (isSpanish
              ? "Error al enviar los datos de pago"
              : "Error submitting payment details"),
        );
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
        setError(
          confirmError.message ||
            (isSpanish
              ? "Error al confirmar el método de pago"
              : "Error confirming payment method"),
        );
        setIsProcessing(false);
        return;
      }

      // Payment method added successfully
      confirmMutation.mutate();
    } catch (err: any) {
      setError(
        err.message ||
          (isSpanish
            ? "Ocurrió un error inesperado"
            : "An unexpected error occurred"),
      );
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
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
            {isSpanish ? "Procesando..." : "Processing..."}
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {isSpanish ? "Agregar método de pago" : "Add payment method"}
          </>
        )}
      </Button>
    </form>
  );
}

export function PaymentRequiredModal({ isOpen, onClose, onSuccess }: PaymentRequiredModalProps) {
  const { activeBrandId } = useBrand();
  const { isSpanish } = useLanguage();
  const [step, setStep] = useState<"info" | "payment" | "success">("info");
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  // Get Stripe publishable key
  const { data: stripeConfig } = useQuery<{ publishableKey: string }>({
    queryKey: ["/api/stripe/config"],
    enabled: isOpen,
  });

  // Create setup intent when ready to add payment
  const setupIntentMutation = useMutation({
    mutationFn: async () => {
      if (!activeBrandId) throw new Error("No active brand");
      const res = await apiRequest("POST", `/api/billing/${activeBrandId}/setup-intent`);
      if (!res.ok) throw new Error("Failed to create setup intent");
      return res.json();
    },
  });

  const handleStartPayment = async () => {
    if (!stripeConfig?.publishableKey) return;
    
    setStripePromise(loadStripe(stripeConfig.publishableKey));
    setupIntentMutation.mutate();
    setStep("payment");
  };

  const handlePaymentSuccess = () => {
    setStep("success");
    setTimeout(() => {
      onSuccess?.();
      onClose();
      setStep("info");
    }, 2000);
  };

  const handleClose = () => {
    onClose();
    setStep("info");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "info" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {isSpanish
                  ? "Créditos de imágenes agotados"
                  : "Image credits exhausted"}
              </DialogTitle>
              <DialogDescription>
                {isSpanish
                  ? "Has utilizado tus 10 imágenes gratuitas. Para continuar generando contenido de alta calidad, necesitas agregar un método de pago."
                  : "You've used your 10 free images. To continue generating high-quality content, please add a payment method."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium">
                  {isSpanish ? "Precio por imagen" : "Price per image"}
                </h4>
                <p className="text-2xl font-bold text-primary">$0.12 USD</p>
                <p className="text-sm text-muted-foreground">
                  {isSpanish
                    ? "Se cobra cada 2 días por las imágenes generadas"
                    : "Billed every 2 days for images generated"}
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  {isSpanish
                    ? "Tu tarjeta solo será cargada por las imágenes que generes. Sin cargos mensuales fijos."
                    : "Your card is only charged for images you generate. No fixed monthly fees."}
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                {isSpanish ? "Cancelar" : "Cancel"}
              </Button>
              <Button onClick={handleStartPayment} className="flex-1" disabled={!stripeConfig?.publishableKey}>
                {isSpanish ? "Agregar tarjeta" : "Add card"}
              </Button>
            </div>
          </>
        )}

        {step === "payment" && stripePromise && setupIntentMutation.data && (
          <>
            <DialogHeader>
              <DialogTitle>
                {isSpanish ? "Agregar método de pago" : "Add payment method"}
              </DialogTitle>
              <DialogDescription>
                {isSpanish
                  ? "Ingresa los datos de tu tarjeta de crédito o débito"
                  : "Enter your credit or debit card details"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: setupIntentMutation.data.clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#0ea5e9",
                    },
                  },
                }}
              >
                <PaymentForm 
                  brandId={activeBrandId!} 
                  onSuccess={handlePaymentSuccess} 
                />
              </Elements>
            </div>
          </>
        )}

        {step === "payment" && setupIntentMutation.isPending && (
          <div className="py-8 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {isSpanish
                ? "Preparando formulario de pago..."
                : "Preparing payment form..."}
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isSpanish
                ? "¡Método de pago agregado!"
                : "Payment method added!"}
            </h3>
            <p className="text-muted-foreground">
              {isSpanish
                ? "Ahora puedes generar imágenes ilimitadas. Se te cobrará cada 2 días."
                : "You can now generate unlimited images. You'll be billed every 2 days."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PaymentRequiredAlert({
  freeRemaining = 0,
  onAddPayment
}: {
  freeRemaining?: number;
  onAddPayment: () => void;
}) {
  const { isSpanish } = useLanguage();
  if (freeRemaining > 3) return null;

  const warningText =
    freeRemaining === 0
      ? isSpanish
        ? "Has agotado tus imágenes gratuitas."
        : "You've used all your free images."
      : isSpanish
        ? `Te quedan ${freeRemaining} imagen${freeRemaining === 1 ? "" : "es"} gratis.`
        : `You have ${freeRemaining} free image${freeRemaining === 1 ? "" : "s"} left.`;

  return (
    <Alert className={freeRemaining === 0 ? "border-destructive" : "border-yellow-500"}>
      <CreditCard className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{warningText}</span>
        <Button variant="outline" size="sm" onClick={onAddPayment}>
          {isSpanish ? "Agregar tarjeta" : "Add card"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
