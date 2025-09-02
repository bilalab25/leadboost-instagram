import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";
import BrandSwitcher from "@/components/BrandSwitcher";
import { Bell, Zap, Database } from "lucide-react";
import { Link } from "wouter";
import leadBoostLogo from "@assets/Lead Boost (500 x 200 px) (500 x 160 px)_1756771199959.png";

interface TopHeaderProps {
  pageName?: string;
}

export default function TopHeader({ pageName }: TopHeaderProps) {
  const { toggleLanguage, isSpanish, language } = useLanguage();
  const t = translations[language];

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
      {/* Left side - Logo and Page Name */}
      <div className="flex items-center gap-16">
        {/* Logo */}
        <Link href="/">
          <img 
            src={leadBoostLogo} 
            alt="Lead Boost Logo" 
            className="h-16 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
        
        {/* Page Name */}
        {pageName && (
          <div className="text-xl font-semibold text-gray-900 ml-8">
            {pageName}
          </div>
        )}
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center gap-3">
        {/* CampAIgner Button */}
        <Link href="/campaigns">
          <Button 
            variant="default" 
            size="sm" 
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 shadow-md font-medium"
            data-testid="button-campaigner-header"
          >
            <Zap className="h-4 w-4 mr-2" />
            CampAIgner
          </Button>
        </Link>
        
        {/* Load Demo Data Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            // Add demo data loading logic here
            window.location.reload();
          }}
          className="font-medium text-sm"
          data-testid="button-load-demo-data-header"
        >
          <Database className="h-4 w-4 mr-2" />
          {t.common.loadDemoData}
        </Button>
        
        {/* Brand Switcher */}
        <BrandSwitcher />
        
        {/* Notifications */}
        <Button variant="ghost" size="icon" data-testid="button-notifications-header">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}