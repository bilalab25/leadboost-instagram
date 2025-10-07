import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  isSpanish?: boolean;
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
  userId,
  isSpanish = true,
}: ChangePasswordDialogProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: isSpanish ? "Campos incompletos" : "Missing fields",
        description: isSpanish
          ? "Por favor completa todos los campos antes de continuar."
          : "Please fill in all fields before continuing.",
        variant: "destructive",
      });
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      toast({
        title: isSpanish ? "No autenticado" : "Not authenticated",
        description: isSpanish
          ? "Inicia sesión para cambiar tu contraseña."
          : "Please sign in to change your password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: isSpanish
          ? "Las contraseñas no coinciden"
          : "Passwords do not match",
        description: isSpanish
          ? "Verifica los campos e inténtalo nuevamente."
          : "Please check the fields and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // 🔐 Reautenticar usuario antes de cambiar contraseña
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);

      // 🚀 Actualizar contraseña
      await updatePassword(user, newPassword);

      // (Opcional) Notificar al backend para actualizar `updatedAt`
      await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedAt: new Date().toISOString() }),
      });

      toast({
        title: isSpanish
          ? "Contraseña actualizada"
          : "Password updated successfully",
        description: isSpanish
          ? "Tu contraseña ha sido cambiada correctamente."
          : "Your password has been changed successfully.",
      });

      // 🔄 Reset & cerrar modal
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al cambiar contraseña:", error);
      let message = isSpanish
        ? "Ocurrió un error inesperado."
        : "An unexpected error occurred.";

      if (error.code === "auth/wrong-password")
        message = isSpanish
          ? "Tu contraseña actual es incorrecta."
          : "Your current password is incorrect.";
      if (error.code === "auth/weak-password")
        message = isSpanish
          ? "La nueva contraseña es demasiado débil."
          : "The new password is too weak.";
      if (error.code === "auth/requires-recent-login")
        message = isSpanish
          ? "Por seguridad, inicia sesión nuevamente antes de cambiar la contraseña."
          : "For security reasons, please log in again before changing your password.";

      toast({
        title: isSpanish
          ? "Error al cambiar la contraseña"
          : "Password change failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {isSpanish ? "Cambiar contraseña" : "Change Password"}
          </DialogTitle>
          <DialogDescription>
            {isSpanish
              ? "Introduce tu contraseña actual y una nueva para continuar."
              : "Enter your current and new password to continue."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="currentPassword">
              {isSpanish ? "Contraseña actual" : "Current password"}
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="********"
            />
          </div>
          <div>
            <Label htmlFor="newPassword">
              {isSpanish ? "Nueva contraseña" : "New password"}
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="********"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">
              {isSpanish
                ? "Confirmar nueva contraseña"
                : "Confirm new password"}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-500 to-purple-600 text-white"
          >
            {loading
              ? isSpanish
                ? "Guardando..."
                : "Saving..."
              : isSpanish
                ? "Actualizar contraseña"
                : "Update password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
