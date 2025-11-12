import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { BrandMembershipWithBrand } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface Brand {
  id: string;
  name: string;
  industry: string | null;
  description: string | null;
  primaryColor: string | null;
}

interface BrandContextType {
  activeBrandId: string | null;
  activeMembership: BrandMembershipWithBrand | null;
  memberships: BrandMembershipWithBrand[];
  brands: Brand[];
  isLoading: boolean;
  error: Error | null;
  switchBrand: (brandId: string) => void;
  setActiveBrandId: (brandId: string) => void;
  refreshBrands: () => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const BRAND_STORAGE_KEY = "campaigner_active_brand";

export function BrandProvider({ children }: { children: ReactNode }) {
  // 🚨 Ahora esperamos sesión antes de cargar brands
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeBrandId, setActiveBrandId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(BRAND_STORAGE_KEY);
    }
    return null;
  });

  // 🔥 Cargar memberships SOLO cuando el usuario YA está autenticado
  const {
    data: memberships = [],
    isLoading: membershipsLoading,
    error,
    refetch,
  } = useQuery<BrandMembershipWithBrand[]>({
    queryKey: ["/api/brand-memberships"],
    enabled: isAuthenticated && !authLoading, // ❤️ clave del fix
  });

  // 🔄 Auto-select primera brand si no hay activa
  useEffect(() => {
    if (
      !authLoading &&
      isAuthenticated &&
      !membershipsLoading &&
      memberships.length > 0 &&
      !activeBrandId
    ) {
      const firstMembership = memberships[0];
      setActiveBrandId(firstMembership.brandId);
      localStorage.setItem(BRAND_STORAGE_KEY, firstMembership.brandId);
    }
  }, [
    memberships,
    activeBrandId,
    membershipsLoading,
    authLoading,
    isAuthenticated,
  ]);

  // 🛡 Validar que activeBrandId sigue siendo válida
  useEffect(() => {
    if (
      !authLoading &&
      isAuthenticated &&
      activeBrandId &&
      memberships.length > 0
    ) {
      const isValid = memberships.some((m) => m.brandId === activeBrandId);
      if (!isValid) {
        const firstMembership = memberships[0];
        setActiveBrandId(firstMembership.brandId);
        localStorage.setItem(BRAND_STORAGE_KEY, firstMembership.brandId);
      }
    }
  }, [activeBrandId, memberships, authLoading, isAuthenticated]);

  const switchBrand = (brandId: string) => {
    setActiveBrandId(brandId);
    localStorage.setItem(BRAND_STORAGE_KEY, brandId);
    queryClient.invalidateQueries(); // invalidar queries dependientes
  };

  const refreshBrands = () => refetch();

  const activeMembership =
    memberships.find((m) => m.brandId === activeBrandId) || null;

  const brands: Brand[] = memberships.map((m) => ({
    id: m.brandId,
    name: m.brandName,
    industry: m.brandIndustry,
    description: m.brandDescription,
    primaryColor: m.brandColor,
  }));

  const isLoading = authLoading || membershipsLoading;

  const value: BrandContextType = {
    activeBrandId,
    activeMembership,
    memberships,
    brands,
    isLoading,
    error: error as Error | null,
    switchBrand,
    setActiveBrandId: switchBrand,
    refreshBrands,
  };

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
