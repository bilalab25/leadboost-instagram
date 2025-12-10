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
  domain: string | null;
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
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const userId = user?.id ?? null;

  const [activeBrandId, setActiveBrandId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(BRAND_STORAGE_KEY);
    }
    return null;
  });

  // 🔥 Ejecutamos SIEMPRE useQuery, pero deshabilitado si no hay usuario
  const {
    data: memberships = [],
    isLoading: membershipsLoading,
    error,
    refetch,
  } = useQuery<BrandMembershipWithBrand[]>({
    queryKey: ["/api/brand-memberships", userId],
    enabled: !!userId && isAuthenticated, // <--- clave
  });

  // 🟦 Si NO hay usuario autenticado → simplemente NO hay brands
  const noUser = !isAuthenticated || !userId;

  useEffect(() => {
    if (noUser || membershipsLoading) return;

    if (memberships.length === 0) {
      setActiveBrandId(null);
      localStorage.removeItem(BRAND_STORAGE_KEY);
      return;
    }

    const brandExists = memberships.some((m) => m.brandId === activeBrandId);

    if (!brandExists) {
      const first = memberships[0];
      setActiveBrandId(first.brandId);
      localStorage.setItem(BRAND_STORAGE_KEY, first.brandId);
    }
  }, [noUser, memberships, membershipsLoading, activeBrandId]);

  const switchBrand = (brandId: string) => {
    setActiveBrandId(brandId);
    localStorage.setItem(BRAND_STORAGE_KEY, brandId);
  };

  const brands = noUser
    ? []
    : memberships.map((m) => ({
        id: m.brandId,
        name: m.brandName,
        domain: m.brandDomain,
        industry: m.brandIndustry,
        description: m.brandDescription,
        primaryColor: m.brandColor,
      }));

  const activeMembership = noUser
    ? null
    : (memberships.find((m) => m.brandId === activeBrandId) ?? null);

  const isLoading = noUser ? false : authLoading || membershipsLoading;

  return (
    <BrandContext.Provider
      value={{
        activeBrandId: noUser ? null : activeBrandId,
        activeMembership,
        memberships: noUser ? [] : memberships,
        brands,
        isLoading,
        error: error as Error | null,
        switchBrand: noUser ? () => {} : switchBrand,
        setActiveBrandId: noUser ? () => {} : switchBrand,
        refreshBrands: noUser ? () => {} : refetch,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
