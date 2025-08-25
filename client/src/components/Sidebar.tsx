import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
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
} from "lucide-react";
import { SiWhatsapp, SiTiktok } from "react-icons/si";
import { Mail } from "lucide-react";
import leadBoostLogo from "@assets/logo azul sin fondo_1756142427945.png";

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  isActive: boolean;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Unified Inbox", href: "/inbox", icon: Inbox, badge: "12" },
  { name: "AI Planner", href: "/ai-planner", icon: Bot },
  { name: "Content Calendar", href: "/calendar", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "Customers", href: "/customers", icon: UserCheck },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

const platformIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  email: Mail,
  tiktok: SiTiktok,
};

const platformColors = {
  instagram: "text-pink-500",
  whatsapp: "text-green-500",
  email: "text-blue-500",
  tiktok: "text-gray-800",
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: socialAccounts } = useQuery<SocialAccount[]>({
    queryKey: ["/api/social-accounts"],
    retry: false,
  });

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center justify-center flex-shrink-0 px-6">
          <img 
            src={leadBoostLogo} 
            alt="LeadBoost Logo" 
            className="h-60 w-auto"
          />
        </div>
        
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
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
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
              Connected Accounts
            </h3>
            <div className="mt-3 space-y-2">
              {socialAccounts && socialAccounts.length > 0 ? (
                socialAccounts.map((account) => {
                  const Icon = platformIcons[account.platform as keyof typeof platformIcons];
                  const colorClass = platformColors[account.platform as keyof typeof platformColors];
                  
                  return (
                    <div
                      key={account.id}
                      className="flex items-center px-3 py-2 text-sm text-gray-600"
                      data-testid={`social-account-${account.platform}`}
                    >
                      {Icon && <Icon className={cn("w-5 h-5 mr-3", colorClass)} />}
                      <span className="flex-1">{account.accountName}</span>
                      <div className={cn("w-2 h-2 rounded-full", account.isActive ? "bg-green-400" : "bg-gray-300")} />
                    </div>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-xs text-gray-500" data-testid="text-no-accounts">
                  No accounts connected
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* User Profile */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center w-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl || undefined} alt="User avatar" />
              <AvatarFallback>
                {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700" data-testid="text-user-name">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs font-medium text-gray-500" data-testid="text-user-role">{user?.role || "User"}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
