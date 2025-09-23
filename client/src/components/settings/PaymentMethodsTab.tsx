import { useState } from "react";
import { CreditCard, DollarSign, Plus, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
}

interface SubscriptionDetails {
  plan: string;
  price: string;
  billingCycle: string;
  nextBillingDate: string;
  status: "active" | "canceled" | "paused";
}

interface PaymentMethodsTabProps {
  isSpanish: boolean;
  paymentMethods: PaymentMethod[];
  currentSubscription: SubscriptionDetails;

  // Add Card dialog controlled from parent
  isAddPaymentMethodDialogOpen: boolean;
  setIsAddPaymentMethodDialogOpen: (value: boolean) => void;

  // New card controlled fields
  newCardNumber: string;
  setNewCardNumber: (value: string) => void;
  newCardExpMonth: string;
  setNewCardExpMonth: (value: string) => void;
  newCardExpYear: string;
  setNewCardExpYear: (value: string) => void;
  newCardCvc: string;
  setNewCardCvc: (value: string) => void;
  newCardIsDefault: boolean;
  setNewCardIsDefault: (value: boolean) => void;

  // Handlers
  handleAddPaymentMethod: () => void;
  handleRemovePaymentMethod: (id: string) => void;
  handleSetDefaultPaymentMethod: (id: string) => void;
  handleChangeSubscriptionPlan: (plan: string) => void; // <-- ahora recibe el plan
  handleCancelSubscription: () => void;
}

export default function PaymentMethodTab({
  isSpanish,
  paymentMethods,
  currentSubscription,
  isAddPaymentMethodDialogOpen,
  setIsAddPaymentMethodDialogOpen,
  newCardNumber,
  setNewCardNumber,
  newCardExpMonth,
  setNewCardExpMonth,
  newCardExpYear,
  setNewCardExpYear,
  newCardCvc,
  setNewCardCvc,
  newCardIsDefault,
  setNewCardIsDefault,
  handleAddPaymentMethod,
  handleRemovePaymentMethod,
  handleSetDefaultPaymentMethod,
  handleChangeSubscriptionPlan,
  handleCancelSubscription,
}: PaymentMethodsTabProps) {
  const [isPlansOpen, setIsPlansOpen] = useState(false);

  const plans = [
    {
      code: "free",
      name: isSpanish ? "Gratis" : "Free",
      price: "$0",
      description: isSpanish ? "Funcionalidad básica" : "Basic features",
    },
    {
      code: "pro",
      name: "Pro",
      price: "$39",
      description: isSpanish ? "Ideal para profesionales" : "Great for pros",
    },
    {
      code: "premium",
      name: isSpanish ? "Premium" : "Premium",
      price: "$99",
      description: isSpanish ? "Para equipos exigentes" : "For growing teams",
    },
  ];

  const isCurrentPlan = (code: string) => {
    const normalizedCurrent = currentSubscription.plan.toLowerCase();
    return (
      normalizedCurrent === code ||
      normalizedCurrent.includes(code) ||
      (code === "free" &&
        ["gratis", "free", "$0"].some((k) => normalizedCurrent.includes(k)))
    );
  };

  return (
    <div className="space-y-6">
      {/* ===== Suscripción Actual + selector de planes (collapsible) ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            {isSpanish ? "Suscripción Actual" : "Current Subscription"}
          </CardTitle>
          <CardDescription>
            {isSpanish
              ? "Gestiona tu plan y ciclo de facturación."
              : "Manage your plan and billing cycle."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mantengo todo igual que tu código original */}
          <div className="flex justify-between items-center border-b pb-2">
            <p className="font-medium">{isSpanish ? "Plan:" : "Plan:"}</p>
            <Badge variant="default" className="text-sm">
              {currentSubscription.plan} ({currentSubscription.billingCycle})
            </Badge>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <p className="font-medium">{isSpanish ? "Precio:" : "Price:"}</p>
            <p className="text-sm">
              {currentSubscription.price}/
              {currentSubscription.billingCycle.replace("ly", "")}
            </p>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <p className="font-medium">
              {isSpanish
                ? "Próxima Fecha de Facturación:"
                : "Next Billing Date:"}
            </p>
            <p className="text-sm">{currentSubscription.nextBillingDate}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="font-medium">{isSpanish ? "Estado:" : "Status:"}</p>
            <Badge
              variant={
                currentSubscription.status === "active"
                  ? "default"
                  : "destructive"
              }
              className="text-sm"
            >
              {currentSubscription.status.charAt(0).toUpperCase() +
                currentSubscription.status.slice(1)}
            </Badge>
          </div>

          {/* Botones + Collapsible de planes */}
          <div className="pt-4">
            <Collapsible open={isPlansOpen} onOpenChange={setIsPlansOpen}>
              <div className="flex gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="outline">
                    {isSpanish ? "Cambiar Plan" : "Change Plan"}
                  </Button>
                </CollapsibleTrigger>

                {currentSubscription.status === "active" && (
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                  >
                    {isSpanish ? "Cancelar Suscripción" : "Cancel Subscription"}
                  </Button>
                )}
              </div>

              <CollapsibleContent className="mt-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* opciones fijas */}
                  {[
                    { name: "Free", price: "$0" },
                    { name: "Pro", price: "$39" },
                    { name: "Premium", price: "$99" },
                  ].map((plan) => {
                    const selected = currentSubscription.plan
                      .toLowerCase()
                      .includes(plan.name.toLowerCase());
                    return (
                      <Card
                        key={plan.name}
                        className={`p-4 flex flex-col justify-between border transition hover:shadow-lg ${
                          selected ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <div>
                          <h3 className="text-lg font-semibold">{plan.name}</h3>
                          <p className="text-2xl font-bold mt-2">
                            {plan.price}
                          </p>
                        </div>
                        <Button
                          className="mt-4"
                          variant={selected ? "secondary" : "default"}
                          onClick={() => {
                            handleChangeSubscriptionPlan(plan.name);
                            setIsPlansOpen(false);
                          }}
                          disabled={selected}
                        >
                          {selected
                            ? isSpanish
                              ? "Seleccionado"
                              : "Selected"
                            : isSpanish
                              ? "Elegir"
                              : "Choose"}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* ===== Métodos de pago ===== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              {isSpanish ? "Métodos de Pago" : "Payment Methods"}
            </CardTitle>
            <CardDescription>
              {isSpanish
                ? "Añade o gestiona tus tarjetas de crédito/débito para los pagos de suscripción."
                : "Add or manage your credit/debit cards for subscription payments."}
            </CardDescription>
          </div>

          {/* Dialog para añadir tarjeta (con control externo) */}
          <Dialog
            open={isAddPaymentMethodDialogOpen}
            onOpenChange={setIsAddPaymentMethodDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {isSpanish ? "Añadir Tarjeta" : "Add Card"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {isSpanish
                    ? "Añadir Nuevo Método de Pago"
                    : "Add New Payment Method"}
                </DialogTitle>
                <DialogDescription>
                  {isSpanish
                    ? "Añade una nueva tarjeta de crédito o débito a tu cuenta."
                    : "Add a new credit or debit card to your account."}
                </DialogDescription>
              </DialogHeader>

              {/* Formulario controlado por props del padre */}
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="card-number">
                    {isSpanish ? "Número de Tarjeta" : "Card Number"}
                  </Label>
                  <Input
                    id="card-number"
                    placeholder="**** **** **** 1234"
                    value={newCardNumber}
                    onChange={(e) => setNewCardNumber(e.target.value)}
                    maxLength={19}
                    inputMode="numeric"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="card-exp-month">
                      {isSpanish ? "Mes Exp." : "Exp. Month"}
                    </Label>
                    <Input
                      id="card-exp-month"
                      placeholder="MM"
                      value={newCardExpMonth}
                      onChange={(e) => setNewCardExpMonth(e.target.value)}
                      maxLength={2}
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-exp-year">
                      {isSpanish ? "Año Exp." : "Exp. Year"}
                    </Label>
                    <Input
                      id="card-exp-year"
                      placeholder="YY"
                      value={newCardExpYear}
                      onChange={(e) => setNewCardExpYear(e.target.value)}
                      maxLength={2}
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-cvc">CVC</Label>
                    <Input
                      id="card-cvc"
                      placeholder="123"
                      value={newCardCvc}
                      onChange={(e) => setNewCardCvc(e.target.value)}
                      maxLength={4}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="flex flex-row items-start space-x-3 rounded-md border p-4">
                  <input
                    id="card-default"
                    type="checkbox"
                    checked={newCardIsDefault}
                    onChange={(e) => setNewCardIsDefault(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-2 focus:ring-primary/30 border-input rounded"
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="card-default">
                      {isSpanish
                        ? "Establecer como método de pago predeterminado"
                        : "Set as default payment method"}
                    </Label>
                  </div>
                </div>

                <Button onClick={handleAddPaymentMethod} className="w-full">
                  {isSpanish ? "Añadir Tarjeta" : "Add Card"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {isSpanish
                  ? "No se han añadido métodos de pago aún"
                  : "No payment methods added yet"}
              </p>
              <p className="text-sm">
                {isSpanish
                  ? "Añade una tarjeta de crédito o débito para pagar tu suscripción"
                  : "Add a credit or debit card to pay for your subscription"}
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
                      <h4 className="font-medium">
                        {method.brand}{" "}
                        {isSpanish ? "terminada en" : "ending in"}{" "}
                        {method.last4}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {isSpanish ? "Expira" : "Expires"} {method.expMonth}/
                        {method.expYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.isDefault ? (
                      <Badge variant="secondary">
                        {isSpanish ? "Predeterminado" : "Default"}
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefaultPaymentMethod(method.id)}
                      >
                        {isSpanish
                          ? "Establecer Predeterminado"
                          : "Set Default"}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      aria-label={
                        isSpanish ? "Eliminar tarjeta" : "Remove card"
                      }
                      title={isSpanish ? "Eliminar tarjeta" : "Remove card"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
