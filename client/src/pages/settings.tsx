import { useState } from "react";
// Eliminadas: useMutation, useQuery, useQueryClient, useAuth, useToast, apiRequest
// Eliminadas: useForm, Form, FormControl, FormField, FormItem, FormLabel, FormMessage de react-hook-form
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Trash2,
  Plus,
  Loader2,
  DollarSign,
  Wallet, // New icons for payment methods tab
  User, // New icon for Account Information
  Lock, // New icon for Security
  Settings as SettingsIcon, // New icon for Account Management
  Save, // For save button
} from "lucide-react";

// New imports for integration/payment dialogs
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- Interfaces (solo para tipado de datos simulados) ---
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

// --- Dummy Data for UI Preview ---
const dummyAccountInfo = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  address: "123 Main St, Anytown, USA",
  currentPlan: "Pro Plan",
  memberSince: "January 1, 2023",
  twoFactorAuthEnabled: true,
};

const dummyPaymentMethods: PaymentMethod[] = [
  {
    id: "pm_1",
    brand: "Visa",
    last4: "4242",
    expMonth: "12",
    expYear: "26",
    isDefault: true,
  },
  {
    id: "pm_2",
    brand: "Mastercard",
    last4: "5555",
    expMonth: "08",
    expYear: "27",
    isDefault: false,
  },
];

const dummySubscription: SubscriptionDetails = {
  plan: "Pro Plan",
  price: "$29.00",
  billingCycle: "monthly",
  nextBillingDate: "October 19, 2025",
  status: "active",
};

export default function Settings() {
  // --- States para la UI (todos inicializados con dummy data) ---

  // States para Payment Methods
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>(dummyPaymentMethods);
  const [currentSubscription, setCurrentSubscription] =
    useState<SubscriptionDetails>(dummySubscription);
  const [isAddPaymentMethodDialogOpen, setIsAddPaymentMethodDialogOpen] =
    useState(false);

  // States para el diálogo de Add Payment Method
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpMonth, setNewCardExpMonth] = useState("");
  const [newCardExpYear, setNewCardExpYear] = useState("");
  const [newCardCvc, setNewCardCvc] = useState("");
  const [newCardIsDefault, setNewCardIsDefault] = useState(false);

  // States para Account Information
  const [userName, setUserName] = useState(dummyAccountInfo.name);
  const [userEmail, setUserEmail] = useState(dummyAccountInfo.email);
  const [userPhone, setUserPhone] = useState(dummyAccountInfo.phone);
  const [userAddress, setUserAddress] = useState(dummyAccountInfo.address);
  const [twoFactorAuthEnabled, setTwoFactorAuthEnabled] = useState(
    dummyAccountInfo.twoFactorAuthEnabled,
  );

  // --- Funciones Dummy (simulan acciones sin backend) ---
  const handleSaveSettings = () => {
    console.log("Simulating saving settings...");
    // Aquí se mostraría un toast de éxito en una app real
  };

  const handleAddPaymentMethod = () => {
    console.log("Simulating adding payment method...");
    const newMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      brand: "Visa", // Dummy brand
      last4: newCardNumber.slice(-4),
      expMonth: newCardExpMonth,
      expYear: newCardExpYear,
      isDefault: newCardIsDefault,
    };

    setPaymentMethods((prev) => {
      let updatedMethods = prev;
      if (newCardIsDefault) {
        updatedMethods = prev.map((m) => ({ ...m, isDefault: false }));
        return [newMethod, ...updatedMethods];
      } else {
        return [...updatedMethods, newMethod];
      }
    });

    setIsAddPaymentMethodDialogOpen(false);
    setNewCardNumber("");
    setNewCardExpMonth("");
    setNewCardExpYear("");
    setNewCardCvc("");
    setNewCardIsDefault(false);
  };

  const handleRemovePaymentMethod = (id: string) => {
    console.log(`Simulating removal of payment method ${id}`);
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
  };

  const handleSetDefaultPaymentMethod = (id: string) => {
    console.log(`Simulating setting default payment method ${id}`);
    setPaymentMethods((prev) =>
      prev.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      })),
    );
  };

  const handleChangeSubscriptionPlan = () => {
    console.log("Simulating changing subscription plan...");
  };

  const handleCancelSubscription = () => {
    console.log("Simulating canceling subscription...");
    setCurrentSubscription((prev) => ({ ...prev, status: "canceled" }));
  };

  const handleUpdateAccountInfo = () => {
    console.log("Simulating updating account information...");
  };

  const handleChangePassword = () => {
    console.log("Simulating changing password...");
  };

  const handleToggleTwoFactorAuth = () => {
    setTwoFactorAuthEnabled((prev) => !prev);
    console.log("Simulating toggling 2FA...");
  };

  const handleDeleteAccount = () => {
    console.log("Simulating account deletion...");
    // En una app real, esto requeriría confirmación y lógica de backend
  };

  // --- Funciones de Formato ---
  // No se usa en este componente simplificado, pero se mantiene por si se añade de nuevo
  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName="Settings" />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            {/* Ajuste de padding y espacio vertical aquí */}
            <div className="container mx-auto px-4 py-8 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Settings
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your account and payment information.
                  </p>
                </div>
              </div>

              <Tabs defaultValue="account-information" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  {" "}
                  {/* 2 columnas para las pestañas */}
                  <TabsTrigger
                    value="account-information"
                    data-testid="tab-account-information"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment-methods"
                    data-testid="tab-payment-methods"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Payment Methods
                  </TabsTrigger>
                </TabsList>

                {/* Account Information Tab */}
                <TabsContent value="account-information" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="mr-2 h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      <CardDescription>
                        Update your personal details and contact information.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="user-name">Name</Label>
                        <Input
                          id="user-name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-email">Email</Label>
                        <Input
                          id="user-email"
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-phone">Phone Number</Label>
                        <Input
                          id="user-phone"
                          type="tel"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="user-address">Address</Label>
                        <Input
                          id="user-address"
                          value={userAddress}
                          onChange={(e) => setUserAddress(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <Button onClick={handleUpdateAccountInfo}>
                        Update Profile
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Lock className="mr-2 h-5 w-5" />
                        Security
                      </CardTitle>
                      <CardDescription>
                        Manage your account security settings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Password</h4>
                          <p className="text-sm text-muted-foreground">
                            Change your password regularly to keep your account
                            secure.
                          </p>
                        </div>
                        <Button variant="outline" onClick={handleChangePassword}>
                          Change Password
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Two-Factor
                            Authentication</h4>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account.
                          </p>
                        </div>
                        <Button
                          variant={twoFactorAuthEnabled ? "destructive" : "default"}
                          onClick={handleToggleTwoFactorAuth}
                        >
                          {twoFactorAuthEnabled ? "Disable" : "Enable"} 2FA
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <SettingsIcon className="mr-2 h-5 w-5" />
                        Account Management
                      </CardTitle>
                      <CardDescription>
                        Manage your subscription and account actions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Current Plan</h4>
                          <p className="text-sm text-muted-foreground">
                            You are currently on the {dummyAccountInfo.currentPlan}.
                          </p>
                        </div>
                        <Button variant="outline">View Plans</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-red-600">
                            Delete Account
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete your account and all associated
                            data.
                          </p>
                        </div>
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Payment Methods Tab */}
                <TabsContent value="payment-methods" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="mr-2 h-5 w-5" />
                        Current Subscription
                      </CardTitle>
                      <CardDescription>
                        Manage your plan and billing cycle.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">Plan:</p>
                        <Badge variant="default" className="text-sm">
                          {currentSubscription.plan} (
                          {currentSubscription.billingCycle})
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">Price:</p>
                        <p className="text-sm">
                          {currentSubscription.price}/
                          {currentSubscription.billingCycle.replace("ly", "")}
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <p className="font-medium">Next Billing Date:</p>
                        <p className="text-sm">
                          {currentSubscription.nextBillingDate}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Status:</p>
                        <Badge
                          variant={
                            currentSubscription.status === "active"
                              ? "default"
                              : "destructive"
                          }
                          className="text-sm"
                        >
                          {currentSubscription.status
                            .charAt(0)
                            .toUpperCase() +
                            currentSubscription.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={handleChangeSubscriptionPlan}
                        >
                          Change Plan
                        </Button>
                        {currentSubscription.status === "active" && (
                          <Button
                            variant="destructive"
                            onClick={handleCancelSubscription}
                          >
                            Cancel Subscription
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="flex items-center">
                          <CreditCard className="mr-2 h-5 w-5" />
                          Payment Methods
                        </CardTitle>
                        <CardDescription>
                          Add or manage your credit/debit cards for subscription
                          payments.
                        </CardDescription>
                      </div>
                      <Dialog
                        open={isAddPaymentMethodDialogOpen}
                        onOpenChange={setIsAddPaymentMethodDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Card
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Add New Payment Method</DialogTitle>
                            <DialogDescription>
                              Add a new credit or debit card to your account.
                            </DialogDescription>
                          </DialogHeader>
                          {/* Formulario simplificado sin react-hook-form */}
                          <div className="grid gap-4 py-4">
                            <div>
                              <Label htmlFor="card-number">Card Number</Label>
                              <Input
                                id="card-number"
                                placeholder="**** **** **** 1234"
                                value={newCardNumber}
                                onChange={(e) => setNewCardNumber(e.target.value)}
                                maxLength={19}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="card-exp-month">
                                  Exp. Month
                                </Label>
                                <Input
                                  id="card-exp-month"
                                  placeholder="MM"
                                  value={newCardExpMonth}
                                  onChange={(e) => setNewCardExpMonth(e.target.value)}
                                  maxLength={2}
                                />
                              </div>
                              <div>
                                <Label htmlFor="card-exp-year">Exp. Year</Label>
                                <Input
                                  id="card-exp-year"
                                  placeholder="YY"
                                  value={newCardExpYear}
                                  onChange={(e) => setNewCardExpYear(e.target.value)}
                                  maxLength={2}
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
                                />
                              </div>
                            </div>
                            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <input
                                type="checkbox"
                                checked={newCardIsDefault}
                                onChange={(e) => setNewCardIsDefault(e.target.checked)}
                                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                              />
                              <div className="space-y-1 leading-none">
                                <Label>Set as default payment method</Label>
                              </div>
                            </div>
                            <Button onClick={handleAddPaymentMethod} className="w-full">
                              Add Card
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {paymentMethods.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No payment methods added yet</p>
                          <p className="text-sm">
                            Add a credit or debit card to pay for your
                            subscription
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
                                    {method.brand} ending in {method.last4}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Expires {method.expMonth}/{method.expYear}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {method.isDefault ? (
                                  <Badge variant="secondary">Default</Badge>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleSetDefaultPaymentMethod(method.id)
                                    }
                                  >
                                    Set Default
                                  </Button>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleRemovePaymentMethod(method.id)
                                  }
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
                </TabsContent>

                {/* Global Save Button */}
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleSaveSettings}
                    className="bg-gradient-to-r from-brand-500 to-purple-600 text-white"
                    data-testid="button-save-settings"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}