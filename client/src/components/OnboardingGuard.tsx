import { useEffect } from "react";
import { useLocation } from "wouter";
import { useBrand } from "@/contexts/BrandContext";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { brands, isLoading } = useBrand();
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();

  const isPublicRoute =
    location === "/" ||
    location === "/login" ||
    location === "/pricing" ||
    location === "/privacy-policy" ||
    location === "/spanish-preview" ||
    location === "/waitlist";

  useEffect(() => {
    if (authLoading || isLoading) return;
    if (!user) return; // 👈 EVITA EL LOOP
    if (isPublicRoute || location === "/onboarding") return;
    if (brands && brands.length === 0) {
      setLocation("/onboarding");
    }
  }, [authLoading, isLoading, user, brands, location]);

  if ((authLoading || isLoading) && !isPublicRoute) {
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
