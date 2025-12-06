import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import BrandSwitcher from "@/components/BrandSwitcher";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Inbox,
  Bot,
  Calendar,
  BarChart3,
  Megaphone,
  Users,
  Settings,
  Instagram,
  UserCheck,
  Link2,
  Sparkles,
  Zap,
  Palette,
  Activity,
  GitBranch,
  Facebook,
  FacebookIcon,
  Plug,
  ShoppingCart,
} from "lucide-react";
import { SiWhatsapp, SiTiktok } from "react-icons/si";
import { Mail } from "lucide-react";
import { translations } from "@/lib/translations";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig"; // Asegúrate de que la ruta a firebaseConfig sea correcta
import { useBrand } from "@/contexts/BrandContext";

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  isActive: boolean;
}

// Navigation will be dynamically translated

const platformIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  whatsapp_baileys: SiWhatsapp,
  email: Mail,
  tiktok: SiTiktok,
  facebook: FacebookIcon,
};

const platformColors = {
  instagram: "text-pink-500",
  whatsapp: "text-green-500",
  whatsapp_baileys: "text-green-500",
  email: "text-primary",
  tiktok: "text-gray-800",
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language]; // Use current language setting
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const navigation = [
    { name: t.sidebar.dashboard, href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Boosty",
      href: "/waterfall",
      icon: Sparkles,
      special: true,
    },
    { name: t.sidebar.inbox, href: "/inbox", icon: Inbox, badge: "12" },
    { name: t.sidebar.brandStudio, href: "/brand-studio", icon: Palette },
    { name: "Automation Flows", href: "/flows-dashboard", icon: GitBranch },
    {
      name: "WhatsApp Templates",
      href: "/whatsapp-templates",
      icon: SiWhatsapp,
    },
    /*{ name: t.sidebar.calendar, href: "/calendar", icon: Calendar },*/
    { name: t.sidebar.analytics, href: "/analytics", icon: BarChart3 },
    /*{ name: t.sidebar.campaigns, href: "/campaigns", icon: Megaphone },*/
    { name: t.sidebar.customers, href: "/customers", icon: UserCheck },
    { name: t.sidebar.sales, href: "/sales", icon: ShoppingCart },
    { name: t.sidebar.team, href: "/team", icon: Users },
    { name: t.sidebar.integrations, href: "/integrations", icon: Plug },
    { name: t.sidebar.settings, href: "/settings", icon: Settings },
  ];

  const { activeBrandId } = useBrand();

  const { data: integrations, isLoading } = useQuery({
    enabled: !!activeBrandId, // ⬅ importante
    queryKey: ["integrations", activeBrandId],
    queryFn: async () => {
      const res = await fetch(`/api/integrations?brandId=${activeBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch integrations");
      return res.json();
    },
    retry: false,
  });

  const socialAccounts = (integrations || []).filter(
    (intg) =>
      intg.category === "social" ||
      intg.category === "social_media" ||
      intg.category === "messaging", // <--- ¡AÑADIR ESTA LÍNEA!
  );

  const handleLogout = async () => {
    try {
      // 1. Cerrar sesión en Firebase (lado del cliente)
      await signOut(auth);
      console.log("Logged out from Firebase client.");

      // 2. Llamar a tu endpoint de logout del backend para destruir la sesión del servidor
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (response.ok) {
        console.log("Logged out from backend session.");
        // Opcional: Invalidar o resetear los datos de react-query relacionados con el usuario
        // Esto asegura que la UI refleje el estado de no autenticado
        queryClient.setQueryData(["/api/auth/user"], null); // Establece el usuario a null
        // O si quieres limpiar toda la caché de react-query:
        // queryClient.clear();

        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
        navigate("/login"); // Redirigir a la página de login o a la raíz
      } else {
        const errorData = await response.json();
        console.error("Backend logout failed:", errorData.message);
        toast({
          title: "Logout Failed",
          description:
            errorData.message || "An error occurred during backend logout.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Firebase logout error:", error);
      let errorMessage = "An unexpected error occurred during logout.";
      // Puedes añadir manejo de errores específicos de Firebase aquí si lo deseas
      // if (error && typeof error === 'object' && 'code' in error) {
      //   switch ((error as any).code) {
      //     case "auth/no-current-user":
      //       errorMessage = "No user is currently signed in.";
      //       break;
      //     default:
      //       errorMessage = (error as any).message;
      //       break;
      //   }
      // } else if (error.message) {
      //   errorMessage = error.message;
      // }

      toast({
        title: "Logout Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
        {/* Navigation */}
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                      item.special
                        ? "bg-gradient-to-r from-brand-600 to-cyan-500 text-white hover:from-brand-700 hover:to-cyan-600 shadow-md"
                        : isActive
                          ? "bg-brand-50 text-brand-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 mr-3",
                        item.special ? "text-white" : "",
                      )}
                    />
                    {item.name}
                    {item.badge && (
                      <span className="bg-red-100 text-red-800 ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Connected Accounts */}
          <div className="px-4 mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t.messages.connectedAccounts}
            </h3>

            <div className="mt-3 space-y-2">
              {console.log(socialAccounts, "social accounts")}
              {isLoading ? (
                <div className="px-3 py-2 text-xs text-gray-400 animate-pulse">
                  Loading accounts...
                </div>
              ) : socialAccounts.length > 0 ? (
                socialAccounts.map((account) => {
                  const Icon =
                    platformIcons[
                      account.provider as keyof typeof platformIcons
                    ] || Link2;
                  const colorClass =
                    platformColors[
                      account.provider as keyof typeof platformColors
                    ] || "text-gray-500";

                  return (
                    <div
                      key={account.id}
                      className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition"
                      data-testid={`social-account-${account.provider}`}
                    >
                      <Icon className={cn("w-5 h-5 mr-3", colorClass)} />
                      <span className="flex-1 truncate">
                        {account.accountName || "Unnamed"}
                      </span>
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          account.isActive ? "bg-green-400" : "bg-gray-300",
                        )}
                        title={account.isActive ? "Active" : "Inactive"}
                      />
                    </div>
                  );
                })
              ) : (
                <div
                  className="px-3 py-2 text-xs text-gray-500"
                  data-testid="text-no-accounts"
                >
                  {t.common.noAccountsConnected}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center w-full">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user?.profileImageUrl || undefined}
                alt="User avatar"
              />
              <AvatarFallback>
                {user?.firstName?.[0] || ""}
                {user?.lastName?.[0] || ""}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1">
              <p
                className="text-sm font-medium text-gray-700"
                data-testid="text-user-name"
              >
                {user?.firstName} {user?.lastName}
              </p>
              <p
                className="text-xs font-medium text-gray-500"
                data-testid="text-user-role"
              >
                {user?.role || t.common.user}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              {t.common.logout}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
