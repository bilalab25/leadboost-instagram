import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  User,
  Lock,
  Settings as SettingsIcon,
  AlertCircle,
} from "lucide-react";
import ChangePasswordDialog from "./ChangePasswordDialog";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  isSpanish: boolean;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAddress: string;
  twoFactorAuthEnabled: boolean;
  setUserName: (value: string) => void;
  setUserEmail: (value: string) => void;
  setUserPhone: (value: string) => void;
  setUserAddress: (value: string) => void;
  handleUpdateAccountInfo: () => void;
  handleDeleteAccount: () => void;
}

export default function AccountTab({
  isSpanish,
  userName,
  userEmail,
  userPhone,
  userAddress,
  twoFactorAuthEnabled,
  setUserName,
  setUserEmail,
  setUserPhone,
  setUserAddress,
  handleUpdateAccountInfo,
  handleDeleteAccount,
}: Props) {
  // ✅ Hook de autenticación
  const { user } = useAuth();
  const provider = user?.provider || "password";
  const userId = user?.id || "";

  // ✅ Estado del modal de cambio de contraseña
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Información de Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            {isSpanish ? "Información de Perfil" : "Profile Information"}
          </CardTitle>
          <CardDescription>
            {isSpanish
              ? "Actualiza tus datos personales y de contacto."
              : "Update your personal details and contact information."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="user-name">{isSpanish ? "Nombre" : "Name"}</Label>
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
            <Label htmlFor="user-phone">
              {isSpanish ? "Número de Teléfono" : "Phone Number"}
            </Label>
            <Input
              id="user-phone"
              type="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="user-address">
              {isSpanish ? "Dirección" : "Address"}
            </Label>
            <Input
              id="user-address"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              className="mt-2"
            />
          </div>
          <Button
            className="bg-gradient-to-r from-brand-500 to-purple-600 text-white"
            onClick={handleUpdateAccountInfo}
          >
            {isSpanish ? "Actualizar Perfil" : "Update Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="mr-2 h-5 w-5" />
            {isSpanish ? "Seguridad" : "Security"}
          </CardTitle>
          <CardDescription>
            {isSpanish
              ? "Gestiona la configuración de seguridad de tu cuenta."
              : "Manage your account security settings."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sección de contraseña */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">
                {isSpanish ? "Contraseña" : "Password"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isSpanish
                  ? "Cambia tu contraseña regularmente para mantener tu cuenta segura."
                  : "Change your password regularly to keep your account secure."}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(true)}
              disabled={provider !== "password"}
              className={
                provider !== "password" ? "opacity-60 cursor-not-allowed" : ""
              }
            >
              {isSpanish ? "Cambiar Contraseña" : "Change Password"}
            </Button>
          </div>

          {/* Mostrar alerta si el proveedor no es "password" */}
          {provider !== "password" && (
            <Alert className="mt-3 border-yellow-300 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="font-semibold text-yellow-700">
                {isSpanish
                  ? "Cambio de contraseña no disponible"
                  : "Password change not available"}
              </AlertTitle>
              <AlertDescription className="text-yellow-700">
                {isSpanish
                  ? "Tu cuenta usa un proveedor externo (Google, Apple o Microsoft). Debes cambiar tu contraseña desde ese servicio."
                  : "Your account uses an external provider (Google, Apple, or Microsoft). Please change your password from that service."}
              </AlertDescription>
            </Alert>
          )}

          {/* Modal de cambio de contraseña */}
          <ChangePasswordDialog
            open={isPasswordDialogOpen}
            onOpenChange={setIsPasswordDialogOpen}
            userId={userId}
            isSpanish={isSpanish}
          />
        </CardContent>
      </Card>

      {/* Gestión de Cuenta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="mr-2 h-5 w-5" />
            {isSpanish ? "Gestión de Cuenta" : "Account Management"}
          </CardTitle>
          <CardDescription>
            {isSpanish
              ? "Gestiona tu suscripción y acciones de cuenta."
              : "Manage your subscription and account actions."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-600">
                {isSpanish ? "Eliminar Cuenta" : "Delete Account"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isSpanish
                  ? "Elimina permanentemente tu cuenta y todos los datos asociados."
                  : "Permanently delete your account and all associated data."}
              </p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              {isSpanish ? "Eliminar Cuenta" : "Delete Account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
