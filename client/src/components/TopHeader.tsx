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
    <header className="bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 shadow-lg">
      <div className="flex items-center py-4">
        {/* Left side - Logo (exact width to match sidebar) */}
        <div className="w-64 pl-8 pr-4 flex items-center flex-shrink-0">
          <Link href="/" className="flex-shrink-0">
            <img 
              src={leadBoostLogo} 
              alt="Lead Boost Logo" 
              className="h-14 w-auto object-contain cursor-pointer hover:scale-105 transition-all duration-200 drop-shadow-sm"
            />
          </Link>
        </div>
        
        {/* Page Name */}
        {pageName && (
          <div className="flex items-center ml-8 flex-1">
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              {pageName}
            </h1>
          </div>
        )}

        {/* Right side - Controls */}
        <div className="flex items-center gap-4">
          {/* Primary CTA - CampAIgner (Marketing Focus) */}
          <Link href="/campaigns">
            <Button 
              size="default"
              className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-0"
              data-testid="button-campaigner-header"
            >
              <Zap className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Create with</span> CampAIgner
            </Button>
          </Link>
          
          {/* Secondary Actions */}
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            {/* Load Demo Data Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                // Add demo data loading logic here
                window.location.reload();
              }}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-150"
              data-testid="button-load-demo-data-header"
            >
              <Database className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">{t.common.loadDemoData}</span>
            </Button>
            
            {/* Brand Switcher */}
            <BrandSwitcher />
            
            {/* Notifications with Badge */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-gray-100 transition-colors duration-150" 
                data-testid="button-notifications-header"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {/* Notification Badge */}
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}