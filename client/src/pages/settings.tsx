import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
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
import { Wallet, User, Bell, Building2, Instagram, Sliders, Trash2, Plus, GripVertical, Loader2, Sparkles, CheckCircle, XCircle, Send, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBrand } from "@/contexts/BrandContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AccountTab from "@/components/settings/AccountTab";
import PaymentMethodTab from "@/components/settings/PaymentMethodsTab";
import HelpChatbot from "@/components/HelpChatbot";
import BrandsTab from "@/components/settings/BrandsTab";
import { useAuth } from "@/hooks/useAuth";
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

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

interface NotificationSettings {
  email: {
    newMessage: boolean;
    accountActivity: boolean;
    promotional: boolean;
  };
  sms: {
    newMessage: boolean;
    accountActivity: boolean;
  };
  inApp: {
    newMessage: boolean;
    promotional: boolean;
  };
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

const initialNotificationSettings: NotificationSettings = {
  email: {
    newMessage: true,
    accountActivity: true,
    promotional: false,
  },
  sms: {
    newMessage: false,
    accountActivity: true,
  },
  inApp: {
    newMessage: true,
    promotional: true,
  },
};

export default function Settings() {
  const { isSpanish, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
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

  // States para Notifications
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>(initialNotificationSettings);

  // --- Funciones Dummy (simulan acciones sin backend) ---
  const handleSaveSettings = () => {
    console.log("Simulating saving settings...");
    console.log({
      userName,
      userEmail,
      userPhone,
      userAddress,
      twoFactorAuthEnabled,
      paymentMethods,
      currentSubscription,
      notificationSettings,
    });
    toast({
      title: isSpanish ? "¡Configuración Guardada!" : "Settings Saved!",
      description: isSpanish
        ? "Tu configuración se ha guardado exitosamente."
        : "Your settings have been saved successfully.",
    });
  };

  const handleAddPaymentMethod = () => {
    console.log("Simulating adding payment method...");
    const newMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      brand: "Visa", // Dummy brand, ideally derived from card number
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
    toast({
      title: isSpanish ? "Método de Pago Añadido" : "Payment Method Added",
      description: isSpanish
        ? "El nuevo método de pago se ha añadido."
        : "The new payment method has been added.",
    });
  };

  const handleRemovePaymentMethod = (id: string) => {
    console.log(`Simulating removal of payment method ${id}`);
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
    toast({
      title: isSpanish ? "Método de Pago Eliminado" : "Payment Method Removed",
      description: isSpanish
        ? "El método de pago ha sido eliminado."
        : "The payment method has been removed.",
    });
  };

  const handleSetDefaultPaymentMethod = (id: string) => {
    console.log(`Simulating setting default payment method ${id}`);
    setPaymentMethods((prev) =>
      prev.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      })),
    );
    toast({
      title: isSpanish ? "Predeterminado Actualizado" : "Default Updated",
      description: isSpanish
        ? "El método de pago predeterminado ha cambiado."
        : "Default payment method has been changed.",
    });
  };

  const handleChangeSubscriptionPlan = () => {
    console.log("Simulating changing subscription plan...");
    toast({
      title: isSpanish ? "Cambiar Plan" : "Change Plan",
      description: isSpanish
        ? "Funcionalidad para cambiar plan."
        : "Functionality to change plan.",
    });
  };

  const handleCancelSubscription = () => {
    console.log("Simulating canceling subscription...");
    setCurrentSubscription((prev) => ({ ...prev, status: "canceled" }));
    toast({
      title: isSpanish ? "Suscripción Cancelada" : "Subscription Canceled",
      description: isSpanish
        ? "Tu suscripción ha sido cancelada."
        : "Your subscription has been canceled.",
    });
  };

  const handleUpdateAccountInfo = async () => {
    try {
      const [firstName, ...rest] = userName.split(" ");
      const lastName = rest.join(" ");

      const phoneRegex = /^\+?\d{7,15}$/;
      // ✅ acepta +52 o sin +, y entre 7–15 dígitos

      if (!phoneRegex.test(userPhone)) {
        toast({
          title: isSpanish ? "Número inválido" : "Invalid phone number",
          description: isSpanish
            ? "Por favor introduce un número de teléfono válido (solo dígitos y opcionalmente el prefijo +)."
            : "Please enter a valid phone number (digits only, optional + prefix).",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        firstName,
        lastName,
        email: userEmail,
        phone: userPhone,
        address: userAddress,
      };

      const res = await fetch(`/api/users/${user!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include", // mantiene la sesión activa
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "✅ Perfil actualizado",
          description: "Tus cambios se guardaron correctamente.",
        });
      } else {
        const err = await res.json();
        toast({
          title: "⚠️ Error al actualizar",
          description: err.message || "No se pudo actualizar tu perfil.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      toast({
        title: "⚠️ Error inesperado",
        description: "Intenta de nuevo más tarde.",
        variant: "destructive",
      });
    }
  };

  async function handleChangePassword() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        toast({
          title: "No autenticado",
          description: "Debes iniciar sesión para cambiar tu contraseña.",
          variant: "destructive",
        });
        return;
      }

      // Verificar proveedor (para evitar el cambio si es Google/Apple/Microsoft)
      const providerId = user.providerData[0]?.providerId;
      if (providerId !== "password") {
        toast({
          title: "Cambio de contraseña no disponible",
          description:
            "Tu cuenta usa un proveedor externo (Google, Apple o Microsoft). Por favor cambia tu contraseña desde ese servicio.",
          variant: "destructive",
        });
        return;
      }

      // ✅ Pedir nueva contraseña
      const newPassword = prompt("Introduce tu nueva contraseña:");
      if (!newPassword) {
        toast({
          title: "Operación cancelada",
          description: "No se cambió la contraseña.",
        });
        return;
      }

      // 🔑 Pedir contraseña actual para reautenticar (seguridad)
      const currentPassword = prompt(
        "Introduce tu contraseña actual para confirmar:",
      );

      if (!currentPassword) {
        toast({
          title: "Operación cancelada",
          description: "Debes ingresar tu contraseña actual para continuar.",
        });
        return;
      }

      // 🔐 Reautenticar
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      // 🚀 Actualizar contraseña
      await updatePassword(user, newPassword);

      // (Opcional) — notificar al backend para actualizar updatedAt
      await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedAt: new Date().toISOString() }),
      });

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente.",
      });
    } catch (error: any) {
      console.error("Error cambiando contraseña:", error);
      let message = "Ocurrió un error inesperado.";

      if (error.code === "auth/wrong-password") {
        message = "La contraseña actual es incorrecta.";
      } else if (error.code === "auth/weak-password") {
        message = "La nueva contraseña es demasiado débil.";
      } else if (error.code === "auth/requires-recent-login") {
        message =
          "Por seguridad, vuelve a iniciar sesión antes de cambiar tu contraseña.";
      }

      toast({
        title: "Error al cambiar contraseña",
        description: message,
        variant: "destructive",
      });
    }
  }

  const handleToggleTwoFactorAuth = () => {
    setTwoFactorAuthEnabled((prev) => !prev);
    console.log("Simulating toggling 2FA...");
    toast({
      title: isSpanish ? "2FA Actualizado" : "2FA Updated",
      description: isSpanish
        ? `Autenticación de dos factores ${twoFactorAuthEnabled ? "desactivada" : "activada"}.`
        : `Two-factor authentication ${twoFactorAuthEnabled ? "disabled" : "enabled"}.`,
    });
  };

  const handleDeleteAccount = () => {
    console.log("Simulating account deletion...");
    toast({
      title: isSpanish ? "Eliminar Cuenta" : "Delete Account",
      description: isSpanish
        ? "Funcionalidad para eliminar cuenta."
        : "Functionality to delete account.",
      variant: "destructive",
    });
    // En una app real, esto requeriría confirmación y lógica de backend
  };

  const handleNotificationToggle = (
    category: keyof NotificationSettings,
    type: string,
    isChecked: boolean,
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: isChecked,
      },
    }));
    toast({
      title: isSpanish ? "Notificación Actualizada" : "Notification Updated",
      description: isSpanish
        ? "Tus preferencias de notificación han sido actualizadas."
        : "Your notification preferences have been updated.",
    });
  };

  useEffect(() => {
    if (user) {
      setUserName(`${user.firstName || ""} ${user.lastName || ""}`);
      setUserEmail(user.email || "");
      setUserPhone(user.phone || "");
      setUserAddress(user.address || "");
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName={isSpanish ? "Configuración" : "Settings"} />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="container mx-auto px-4 py-8 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {isSpanish ? "Configuración" : "Settings"}
                  </h1>
                  <p className="text-muted-foreground">
                    {isSpanish
                      ? "Gestiona tu cuenta, pagos, integraciones y notificaciones."
                      : "Manage your account, payment information, integrations, and notifications."}
                  </p>
                </div>
              </div>

              <Tabs defaultValue="account-information" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger
                    value="account-information"
                    data-testid="tab-account-information"
                  >
                    <User className="mr-2 h-4 w-4" />
                    {isSpanish ? "Cuenta" : "Account"}
                  </TabsTrigger>
                  <TabsTrigger value="brands" data-testid="tab-brands">
                    <Building2 className="mr-2 h-4 w-4" />
                    {isSpanish ? "Marcas" : "Brands"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment-methods"
                    data-testid="tab-payment-methods"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {isSpanish ? "Pagos" : "Payment Methods"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="instagram"
                    data-testid="tab-instagram"
                  >
                    <Instagram className="mr-2 h-4 w-4" />
                    Instagram
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai-builder"
                    data-testid="tab-ai-builder"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isSpanish ? "AI Builder" : "AI Builder"}
                  </TabsTrigger>
                </TabsList>

                {/* Account Information Tab */}
                <TabsContent value="account-information" className="space-y-6">
                  <AccountTab
                    isSpanish={isSpanish}
                    userName={userName}
                    userEmail={userEmail}
                    userPhone={userPhone}
                    userAddress={userAddress}
                    twoFactorAuthEnabled={twoFactorAuthEnabled}
                    setUserName={setUserName}
                    setUserEmail={setUserEmail}
                    setUserPhone={setUserPhone}
                    setUserAddress={setUserAddress}
                    handleUpdateAccountInfo={handleUpdateAccountInfo}
                    handleChangePassword={handleChangePassword}
                    handleToggleTwoFactorAuth={handleToggleTwoFactorAuth}
                    handleDeleteAccount={handleDeleteAccount}
                  />
                </TabsContent>

                {/* Brands Tab */}
                <TabsContent value="brands" className="space-y-6">
                  <BrandsTab />
                </TabsContent>

                {/* Payment Methods Tab */}
                <TabsContent value="payment-methods" className="space-y-6">
                  <PaymentMethodTab isSpanish={isSpanish} />
                </TabsContent>

                {/* Notifications Tab — removed (no tab trigger, dead code) */}
                <TabsContent value="notifications" className="space-y-6 hidden">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bell className="mr-2 h-5 w-5" />
                        {isSpanish
                          ? "Preferencias de Notificación"
                          : "Notification Preferences"}
                      </CardTitle>
                      <CardDescription>
                        {isSpanish
                          ? "Controla cómo y cuándo recibes notificaciones."
                          : "Control how and when you receive notifications."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Email Notifications */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          {isSpanish
                            ? "Notificaciones por Correo Electrónico"
                            : "Email Notifications"}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish ? "Nuevos Mensajes" : "New Messages"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe un correo cuando tengas nuevos mensajes."
                                  : "Receive an email when you have new messages."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.email.newMessage}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "email",
                                  "newMessage",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish
                                  ? "Actividad de la Cuenta"
                                  : "Account Activity"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe notificaciones sobre inicios de sesión y cambios de seguridad."
                                  : "Get alerts for login attempts and security changes."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={
                                notificationSettings.email.accountActivity
                              }
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "email",
                                  "accountActivity",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish
                                  ? "Ofertas Promocionales"
                                  : "Promotional Offers"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe correos sobre nuevas características, productos y ofertas."
                                  : "Receive emails about new features, products, and offers."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.email.promotional}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "email",
                                  "promotional",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SMS Notifications */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          {isSpanish
                            ? "Notificaciones por SMS"
                            : "SMS Notifications"}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish ? "Nuevos Mensajes" : "New Messages"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe un SMS cuando tengas nuevos mensajes."
                                  : "Receive an SMS when you have new messages."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.sms.newMessage}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "sms",
                                  "newMessage",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish
                                  ? "Actividad de la Cuenta"
                                  : "Account Activity"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe alertas por SMS para inicios de sesión y cambios de seguridad."
                                  : "Get SMS alerts for login attempts and security changes."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.sms.accountActivity}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "sms",
                                  "accountActivity",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>

                      {/* In-App Notifications */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          {isSpanish
                            ? "Notificaciones en la Aplicación"
                            : "In-App Notifications"}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish ? "Nuevos Mensajes" : "New Messages"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe notificaciones dentro de la aplicación para nuevos mensajes."
                                  : "Receive in-app notifications for new messages."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.inApp.newMessage}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "inApp",
                                  "newMessage",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {isSpanish
                                  ? "Ofertas Promocionales"
                                  : "Promotional Offers"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {isSpanish
                                  ? "Recibe notificaciones en la aplicación sobre nuevas características y ofertas."
                                  : "Receive in-app notifications about new features and offers."}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationSettings.inApp.promotional}
                              onChange={(e) =>
                                handleNotificationToggle(
                                  "inApp",
                                  "promotional",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Global Save Button - Moved outside TabsContent but inside Tabs */}
                {/*    <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleSaveSettings}
                    className="bg-gradient-to-r from-brand-500 to-purple-600 text-white"
                    data-testid="button-save-settings"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSpanish ? "Guardar Configuración" : "Save Settings"}
                  </Button>
                </div> */}
                {/* Instagram Settings Tab */}
                <TabsContent value="instagram" className="space-y-6">
                  <InstagramSettingsTab />
                </TabsContent>

                {/* AI Builder Tab */}
                <TabsContent value="ai-builder" className="space-y-6">
                  <AIBuilderTab />
                </TabsContent>
              </Tabs>
            </div>
            {/* Help AI Chatbot */}
            <HelpChatbot
              isSpanish={isSpanish}
              toggleLanguage={toggleLanguage}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

function InstagramSettingsTab() {
  const { isSpanish } = useLanguage();
  const { activeBrandId } = useBrand();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Feature flags
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: [`/api/brands/${activeBrandId}/settings`],
    enabled: !!activeBrandId,
    queryFn: async () => {
      const res = await fetch(`/api/brands/${activeBrandId}/settings`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Approval pipeline
  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: [`/api/brands/${activeBrandId}/approval-pipeline`],
    enabled: !!activeBrandId,
    queryFn: async () => {
      const res = await fetch(`/api/brands/${activeBrandId}/approval-pipeline`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [stages, setStages] = useState<{ id: string; name: string; approverRole: string; order: number }[]>([]);
  const [newStageName, setNewStageName] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [prevBrand, setPrevBrand] = useState(activeBrandId);

  // Reset when brand changes
  if (activeBrandId !== prevBrand) {
    setPrevBrand(activeBrandId);
    setInitialized(false);
  }

  if (settings && pipeline && !initialized) {
    setFlags(settings.featureFlags || {});
    setStages(pipeline.stages || []);
    setInitialized(true);
  }

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/brands/${activeBrandId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ featureFlags: flags }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-settings", activeBrandId] });
      queryClient.invalidateQueries({ queryKey: [`/api/brands/${activeBrandId}/settings`] });
      toast({ title: isSpanish ? "Guardado" : "Saved", description: isSpanish ? "Módulos actualizados." : "Module visibility updated." });
    },
    onError: () => {
      toast({ title: "Error", description: isSpanish ? "No se pudo guardar." : "Failed to save settings.", variant: "destructive" });
    },
  });

  const savePipelineMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/brands/${activeBrandId}/approval-pipeline`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ stages }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/brands/${activeBrandId}/approval-pipeline`] });
      toast({ title: isSpanish ? "Guardado" : "Saved", description: isSpanish ? "Pipeline actualizado." : "Approval pipeline updated." });
    },
    onError: () => {
      toast({ title: "Error", description: isSpanish ? "No se pudo guardar." : "Failed to save pipeline.", variant: "destructive" });
    },
  });

  if (settingsLoading || pipelineLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        {isSpanish ? "Cargando..." : "Loading..."}
      </div>
    );
  }

  const moduleOptions = [
    { key: "calendar", label: isSpanish ? "Calendario de Contenido" : "Content Calendar" },
    { key: "analytics", label: "Instagram Analytics" },
    { key: "inbox", label: isSpanish ? "Inbox / Mensajes" : "Inbox / Messages" },
    { key: "brandStudio", label: "Brand Studio" },
    { key: "integrations", label: isSpanish ? "Integraciones" : "Integrations" },
    { key: "campaigns", label: isSpanish ? "Campañas" : "Campaigns" },
    { key: "customers", label: isSpanish ? "Clientes" : "Customers" },
    { key: "team", label: isSpanish ? "Equipo" : "Team" },
  ];

  return (
    <div className="space-y-6">
      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-500" />
            {isSpanish ? "Módulos Visibles" : "Visible Modules"}
          </CardTitle>
          <CardDescription>
            {isSpanish
              ? "Controla qué secciones aparecen en el menú lateral para esta marca."
              : "Control which sections appear in the sidebar for this brand."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {moduleOptions.map((mod) => (
            <div key={mod.key} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <Label className="text-sm">{mod.label}</Label>
              <Switch
                checked={flags[mod.key] !== false}
                onCheckedChange={(checked) =>
                  setFlags((prev) => ({ ...prev, [mod.key]: checked }))
                }
              />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saveSettingsMutation.isPending
                ? isSpanish ? "Guardando..." : "Saving..."
                : isSpanish ? "Guardar Módulos" : "Save Modules"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approval Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            {isSpanish ? "Pipeline de Aprobación" : "Approval Pipeline"}
          </CardTitle>
          <CardDescription>
            {isSpanish
              ? "Define los pasos de aprobación antes de publicar contenido en Instagram."
              : "Define the approval steps before publishing content to Instagram."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-medium flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <div className="flex-1">
                <span className="text-sm font-medium">{i + 1}. {stage.name}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({isSpanish ? "Rol" : "Role"}: {stage.approverRole})
                </span>
              </div>
              <select
                value={stage.approverRole}
                onChange={(e) => {
                  const updated = [...stages];
                  updated[i] = { ...stage, approverRole: e.target.value };
                  setStages(updated);
                }}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
              {stages.length > 1 && (
                <button
                  onClick={() => setStages(stages.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder={isSpanish ? "Nombre del paso..." : "Stage name..."}
              className="flex-1 px-3 py-2 border rounded text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!newStageName.trim()}
              onClick={() => {
                setStages([
                  ...stages,
                  {
                    id: `stage_${Date.now()}`,
                    name: newStageName.trim(),
                    approverRole: "editor",
                    order: stages.length + 1,
                  },
                ]);
                setNewStageName("");
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              {isSpanish ? "Agregar" : "Add"}
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              onClick={() => savePipelineMutation.mutate()}
              disabled={savePipelineMutation.isPending || stages.length === 0}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {savePipelineMutation.isPending
                ? isSpanish ? "Guardando..." : "Saving..."
                : isSpanish ? "Guardar Pipeline" : "Save Pipeline"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AIBuilderTab() {
  const { isSpanish } = useLanguage();
  const { activeBrandId } = useBrand();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [requestText, setRequestText] = useState("");
  const [currentProposal, setCurrentProposal] = useState<{
    id: string;
    summary: string;
    proposals: { type: string; description: string; changes: any }[];
  } | null>(null);

  // History
  const { data: history } = useQuery<any[]>({
    queryKey: [`/api/brands/${activeBrandId}/ai-customize/history`],
    enabled: !!activeBrandId,
  });

  // Generate proposal
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/brands/${activeBrandId}/ai-customize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ request: requestText }),
      });
      if (!res.ok) throw new Error("Failed to generate proposal");
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentProposal(data);
      setRequestText("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: isSpanish ? "No se pudo generar la propuesta." : "Failed to generate proposal.",
        variant: "destructive",
      });
    },
  });

  // Apply proposal
  const applyMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(
        `/api/brands/${activeBrandId}/ai-customize/${requestId}/apply`,
        { method: "POST", credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setCurrentProposal(null);
      queryClient.invalidateQueries({ queryKey: [`/api/brands/${activeBrandId}/ai-customize/history`] });
      queryClient.invalidateQueries({ queryKey: ["brand-settings", activeBrandId] });
      queryClient.invalidateQueries({ queryKey: [`/api/brands/${activeBrandId}/settings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/brands/${activeBrandId}/caption-templates`] });
      queryClient.invalidateQueries({ queryKey: [`/api/brands/${activeBrandId}/hashtag-sets`] });
      queryClient.invalidateQueries({ queryKey: [`/api/brands/${activeBrandId}/approval-pipeline`] });
      toast({
        title: isSpanish ? "Aplicado" : "Applied",
        description: isSpanish ? "Los cambios han sido aplicados." : "Changes have been applied.",
      });
    },
    onError: () => {
      toast({ title: "Error", description: isSpanish ? "No se pudieron aplicar los cambios." : "Failed to apply changes.", variant: "destructive" });
    },
  });

  // Reject proposal
  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await fetch(
        `/api/brands/${activeBrandId}/ai-customize/${requestId}/reject`,
        { method: "POST", credentials: "include" },
      );
    },
    onSuccess: () => {
      setCurrentProposal(null);
      queryClient.invalidateQueries({ queryKey: [`/api/brands/${activeBrandId}/ai-customize/history`] });
      toast({ title: isSpanish ? "Rechazado" : "Rejected", description: isSpanish ? "La propuesta fue rechazada." : "Proposal rejected." });
    },
    onError: () => {
      toast({ title: "Error", description: isSpanish ? "No se pudo rechazar." : "Failed to reject.", variant: "destructive" });
    },
  });

  const suggestions = [
    isSpanish ? "Crea plantillas de caption para promociones" : "Create caption templates for promotions",
    isSpanish ? "Agrega sets de hashtags para belleza y skincare" : "Add hashtag sets for beauty and skincare",
    isSpanish ? "Configura aprobación de 3 pasos: creador, editor, cliente" : "Set up 3-step approval: creator, editor, client",
    isSpanish ? "Habilita Stories y Reels en mi configuración" : "Enable Stories and Reels in my config",
    isSpanish ? "Activa el módulo de analytics y calendario" : "Enable the analytics and calendar modules",
  ];

  const proposalTypeLabels: Record<string, string> = {
    feature_flags: isSpanish ? "Módulos" : "Modules",
    caption_template: isSpanish ? "Plantilla de Caption" : "Caption Template",
    hashtag_set: isSpanish ? "Set de Hashtags" : "Hashtag Set",
    approval_pipeline: isSpanish ? "Pipeline de Aprobación" : "Approval Pipeline",
    instagram_config: isSpanish ? "Config Instagram" : "Instagram Config",
  };

  return (
    <div className="space-y-6">
      {/* AI Input */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {isSpanish ? "AI Builder para Instagram" : "AI Builder for Instagram"}
          </CardTitle>
          <CardDescription>
            {isSpanish
              ? "Describe lo que necesitas y la IA creará la configuración por ti."
              : "Describe what you need and AI will create the configuration for you."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder={
                isSpanish
                  ? "Ej: Crea plantillas de caption para mi marca de belleza..."
                  : "E.g. Create caption templates for my beauty brand..."
              }
              className="flex-1 px-3 py-2 border rounded-lg text-sm resize-none min-h-[80px] focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && requestText.trim()) {
                  e.preventDefault();
                  generateMutation.mutate();
                }
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRequestText(s)}
                  className="px-2 py-1 rounded-full text-[11px] bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!requestText.trim() || generateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2 ml-3 flex-shrink-0"
            >
              {generateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {generateMutation.isPending
                ? isSpanish ? "Generando..." : "Generating..."
                : isSpanish ? "Generar" : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Proposal */}
      {currentProposal && (
        <Card className="border-2 border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {isSpanish ? "Propuesta del AI" : "AI Proposal"}
            </CardTitle>
            <CardDescription>{currentProposal.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentProposal.proposals.map((p, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {proposalTypeLabels[p.type] || p.type}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{p.description}</p>
                <pre className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(p.changes, null, 2)}
                </pre>
              </div>
            ))}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => rejectMutation.mutate(currentProposal.id)}
                disabled={rejectMutation.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                {isSpanish ? "Rechazar" : "Reject"}
              </Button>
              <Button
                size="sm"
                onClick={() => applyMutation.mutate(currentProposal.id)}
                disabled={applyMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {applyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1" />
                )}
                {isSpanish ? "Aprobar y Aplicar" : "Approve & Apply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              {isSpanish ? "Historial" : "History"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((req: any) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex-1 mr-4">
                    <p className="text-gray-700 line-clamp-1">{req.requestText}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      req.status === "applied"
                        ? "bg-green-100 text-green-700"
                        : req.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {req.status === "applied"
                      ? isSpanish ? "Aplicado" : "Applied"
                      : req.status === "rejected"
                        ? isSpanish ? "Rechazado" : "Rejected"
                        : isSpanish ? "Pendiente" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
