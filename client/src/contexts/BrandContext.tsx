import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface Brand {
  id: string;
  name: string;
  industry: string | null;
  description: string | null;
  brandColor: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface BrandMembership {
  id: string;
  userId: string;
  brandId: string;
  role: string;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  invitedBy: string | null;
}

interface BrandContextType {
  activeBrandId: string | null;
  activeMembership: BrandMembership | null;
  brands: BrandMembership[];
  isLoading: boolean;
  error: Error | null;
  switchBrand: (brandId: string) => void;
  refreshBrands: () => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const BRAND_STORAGE_KEY = "campaigner_active_brand";

export function BrandProvider({ children }: { children: ReactNode }) {
  const [activeBrandId, setActiveBrandId] = useState<string | null>(() => {
    // Load from localStorage on mount
    if (typeof window !== "undefined") {
      return localStorage.getItem(BRAND_STORAGE_KEY);
    }
    return null;
  });

  // Fetch user's brand memberships
  const {
    data: brands = [],
    isLoading,
    error,
    refetch,
  } = useQuery<BrandMembership[]>({
    queryKey: ["/api/brand-memberships"],
  });

  // Auto-select first brand if none selected
  useEffect(() => {
    if (!isLoading && brands.length > 0 && !activeBrandId) {
      const firstBrand = brands[0];
      setActiveBrandId(firstBrand.brandId);
      localStorage.setItem(BRAND_STORAGE_KEY, firstBrand.brandId);
    }
  }, [brands, activeBrandId, isLoading]);

  // Validate that activeBrandId is still valid
  useEffect(() => {
    if (activeBrandId && brands.length > 0) {
      const isValid = brands.some((m) => m.brandId === activeBrandId);
      if (!isValid) {
        // Active brand is not in user's memberships, switch to first available
        const firstBrand = brands[0];
        setActiveBrandId(firstBrand.brandId);
        localStorage.setItem(BRAND_STORAGE_KEY, firstBrand.brandId);
      }
    }
  }, [activeBrandId, brands]);

  const switchBrand = (brandId: string) => {
    setActiveBrandId(brandId);
    localStorage.setItem(BRAND_STORAGE_KEY, brandId);
    // Invalidate all queries when brand changes
    queryClient.invalidateQueries();
  };

  const refreshBrands = () => {
    refetch();
  };

  const activeMembership =
    brands.find((m) => m.brandId === activeBrandId) || null;

  const value: BrandContextType = {
    activeBrandId,
    activeMembership,
    brands,
    isLoading,
    error: error as Error | null,
    switchBrand,
    refreshBrands,
  };

  return (
    <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
