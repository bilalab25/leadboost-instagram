import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";
import { Mail } from "lucide-react";
import { FaMicrosoft } from "react-icons/fa";

interface AuthProviderBannerProps {
  provider: string;
  email?: string;
  isSpanish?: boolean;
}

export default function AuthProviderBanner({
  provider,
  email,
  isSpanish = false,
}: AuthProviderBannerProps) {
  // Local email/password accounts don't need a provider banner
  if (provider === "password" || provider === "local") return null;

  const icon =
    provider === "google.com" ? (
      <FcGoogle className="w-6 h-6" />
    ) : provider === "microsoft.com" ? (
      <FaMicrosoft className="w-5 h-5 text-[#0078D4]" />
    ) : provider === "apple.com" ? (
      <SiApple className="w-5 h-5 text-black dark:text-white" />
    ) : (
      <Mail className="w-5 h-5 text-gray-600" />
    );

  const providerName =
    provider === "google.com"
      ? "Google"
      : provider === "microsoft.com"
        ? "Microsoft"
        : provider === "apple.com"
          ? "Apple"
          : (isSpanish ? "otro servicio" : "another service");

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
      {icon}
      <div>
        <p className="font-medium text-sm">
          {isSpanish
            ? `Has iniciado sesión con tu cuenta de ${providerName}.`
            : `You're signed in with your ${providerName} account.`}
        </p>
        <p className="text-xs text-muted-foreground">{email}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {isSpanish
            ? "Los cambios de contraseña deben hacerse desde ese servicio."
            : "Password changes must be managed through that provider."}
        </p>
      </div>
    </div>
  );
}
