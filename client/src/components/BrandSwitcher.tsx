import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Building2,
  Globe,
  Crown,
  Shield,
  Edit,
  Eye,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useBrand } from "@/contexts/BrandContext";
import { useLocation } from "wouter";

export default function BrandSwitcher() {
  const { toggleLanguage, isSpanish } = useLanguage();
  const {
    activeBrandId,
    activeMembership,
    memberships,
    isLoading,
    switchBrand,
  } = useBrand();
  const [, setLocation] = useLocation();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />;
      case "admin":
        return <Shield className="h-3 w-3" />;
      case "editor":
        return <Edit className="h-3 w-3" />;
      case "viewer":
        return <Eye className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-2 py-1">
        <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
        <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <Button
        variant="outline"
        className="justify-start h-auto p-2"
        data-testid="button-add-first-brand"
        onClick={() => setLocation("/onboarding")}
      >
        <Building2 className="mr-2 h-4 w-4" />
        <span className="text-sm">Add First Brand</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="justify-start h-auto p-2"
          data-testid="button-brand-switcher"
        >
          <Avatar className="h-6 w-6 mr-2">
            <AvatarFallback
              style={{
                backgroundColor: activeMembership?.brandColor || "#3f82d1",
              }}
              className="text-white text-xs"
            >
              {activeMembership?.brandName?.charAt(0) || "B"}
            </AvatarFallback>
          </Avatar>

          <span className="text-sm font-medium truncate flex-1 max-w-[120px]">
            {activeMembership?.brandName || "Select Brand"}
          </span>

          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72" align="start">
        <DropdownMenuLabel>Switch Brand</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.id}
            onClick={() => switchBrand(membership.brandId)}
            className="flex items-center space-x-3 p-3"
            data-testid={`menu-item-brand-${membership.brandId}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback
                style={{ backgroundColor: membership.brandColor || "#0066cc" }}
                className="text-white text-sm"
              >
                {membership.brandName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{membership.brandName}</span>
                {membership.brandId === activeBrandId && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                {getRoleIcon(membership.role)}
                <span>{membership.role}</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center space-x-2"
          data-testid="menu-item-manage-brands"
          onClick={() => setLocation("/settings")}
        >
          <Building2 className="h-4 w-4" />
          <span>Manage Brands</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={toggleLanguage}
          className="flex items-center space-x-2"
          data-testid="menu-item-language-toggle"
        >
          <Globe className="h-4 w-4" />
          <span>{isSpanish ? "🇺🇸 English" : "🇪🇸 Español"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
