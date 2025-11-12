import { useEffect } from "react";
import { useLocation } from "wouter";
import { useBrand } from "@/contexts/BrandContext";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { brands, isLoading, activeBrandId } = useBrand();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Don't redirect if:
    // 1. Still loading brands
    // 2. Already on onboarding page
    // 3. On public pages
    if (isLoading) return;
    if (location === "/onboarding") return;
    if (location === "/" || location === "/login" || location === "/pricing" || location === "/privacy-policy" || location === "/spanish-preview") return;

    // Redirect to onboarding if user has no brands
    if (brands.length === 0) {
      setLocation("/onboarding");
    }
  }, [brands, isLoading, location, setLocation, activeBrandId]);

  // Show loading state while checking brands
  if (isLoading && location !== "/" && location !== "/login" && location !== "/pricing" && location !== "/privacy-policy" && location !== "/spanish-preview") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
