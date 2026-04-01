import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";
import BrandSwitcher from "@/components/BrandSwitcher";
import { HelpDropdown } from "@/components/HelpDropdown";
import { Bell, Zap, Database, Menu, X, LayoutDashboard, Inbox, Palette, BarChart3, Plug, Settings, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
const leadBoostLogo = "/images/leadboost-logo-alt.png";

interface TopHeaderProps {
  pageName?: string;
}

export default function TopHeader({ pageName }: TopHeaderProps) {
  const { toggleLanguage, isSpanish, language } = useLanguage();
  const t = translations[language];
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if we're on the dashboard to show full header
  const isDashboard = location === "/dashboard" || location === "/";
  const isCompact = !isDashboard;

  const mobileNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: isSpanish ? "Contenido" : "Content", href: "/waterfall", icon: Sparkles },
    { name: "Inbox", href: "/inbox", icon: Inbox },
    { name: "Brand Studio", href: "/brand-studio", icon: Palette },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: isSpanish ? "Integraciones" : "Integrations", href: "/integrations", icon: Plug },
    { name: isSpanish ? "Configuración" : "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 shadow-lg">
      <div className={`flex items-center ${isCompact ? "py-1" : "py-2"}`}>
        {isCompact ? (
          /* Compact Header - Logo + Mobile Menu */
          <div className="w-full px-4 md:px-8 flex items-center justify-between">
            <Link href="/" className="flex-shrink-0">
              <img
                src={leadBoostLogo}
                alt="Lead Boost Logo"
                className="h-10 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity duration-200 drop-shadow-sm"
              />
            </Link>
            {/* Mobile hamburger button — only visible below md */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        ) : (
          /* Full Header - Dashboard */
          <>
            {/* Mobile hamburger for dashboard */}
            <button
              className="md:hidden p-2 ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            {/* Left side - Logo (exact width to match sidebar) */}
            <div className="w-64 pl-4 md:pl-8 pr-4 flex items-center flex-shrink-0">
              <Link href="/" className="flex-shrink-0">
                <img
                  src={leadBoostLogo}
                  alt="Lead Boost Logo"
                  className="h-16 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity duration-200 drop-shadow-sm"
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
              <Link href="/waterfall">
                <Button
                  size="default"
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                  data-testid="button-campaigner-header"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Create with Boosty
                </Button>
              </Link>

              {/* Secondary Actions */}
              <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                {/* Load Demo Data Button */}
                {/* <Button
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
                  <span className="hidden md:inline">
                    {t.common.loadDemoData}
                  </span>
                </Button> */}

                {/* Help Dropdown */}
                <HelpDropdown isSpanish={isSpanish} />

                {/* Brand Switcher */}
                <BrandSwitcher />

                {/* Language Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium transition-colors duration-150 min-w-[40px]"
                  data-testid="button-language-toggle"
                >
                  {isSpanish ? "EN" : "ES"}
                </Button>

                {/* Notifications with Badge */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-gray-100 transition-colors duration-150"
                    aria-label="Notifications"
                    data-testid="button-notifications-header"
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {/* Notification Badge */}
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Navigation Menu — slides down below header */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
