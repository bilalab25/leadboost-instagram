import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import BrandSwitcher from "@/components/BrandSwitcher";

export default function TopHeader() {
  const { toggleLanguage, isSpanish } = useLanguage();

  return (
    <div className="flex items-center justify-end gap-4 px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
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
      </div>
    </div>
  );
}