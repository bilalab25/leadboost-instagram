import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import BrandSwitcher from "@/components/BrandSwitcher";
import { Bell } from "lucide-react";
import { Link } from "wouter";
import leadBoostLogo from "@assets/Lead Boost (500 x 200 px) (500 x 160 px)_1756771199959.png";

interface TopHeaderProps {
  pageName?: string;
}

export default function TopHeader({ pageName }: TopHeaderProps) {
  const { toggleLanguage, isSpanish } = useLanguage();

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
      {/* Left side - Logo and Page Name */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <Link href="/">
          <img 
            src={leadBoostLogo} 
            alt="Lead Boost Logo" 
            className="h-10 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
        
        {/* Page Name */}
        {pageName && (
          <div className="text-xl font-semibold text-gray-900">
            {pageName}
          </div>
        )}
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center gap-3">
        {/* Brand Switcher */}
        <BrandSwitcher />
        
        {/* Language Switcher */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleLanguage}
          className="font-medium text-sm"
          data-testid="button-language-toggle-top"
        >
          {isSpanish ? '🇺🇸 English' : '🇪🇸 Español'}
        </Button>
        
        {/* Notifications */}
        <Button variant="ghost" size="icon" data-testid="button-notifications-header">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}