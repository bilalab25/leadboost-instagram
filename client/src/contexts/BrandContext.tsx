import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { BrandMembershipWithBrand } from "@shared/schema";

interface BrandContextType {
  activeBrandId: string | null;
  activeMembership: BrandMembershipWithBrand | null;
  memberships: BrandMembershipWithBrand[];
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
    data: memberships = [],
    isLoading,
    error,
    refetch,
  } = useQuery<BrandMembershipWithBrand[]>({
    queryKey: ["/api/brand-memberships"],
  });

  // Auto-select first brand if none selected
  useEffect(() => {
    if (!isLoading && memberships.length > 0 && !activeBrandId) {
      const firstMembership = memberships[0];
      setActiveBrandId(firstMembership.brandId);
      localStorage.setItem(BRAND_STORAGE_KEY, firstMembership.brandId);
    }
  }, [memberships, activeBrandId, isLoading]);

  // Validate that activeBrandId is still valid
  useEffect(() => {
    if (activeBrandId && memberships.length > 0) {
      const isValid = memberships.some((m) => m.brandId === activeBrandId);
      if (!isValid) {
        // Active brand is not in user's memberships, switch to first available
        const firstMembership = memberships[0];
        setActiveBrandId(firstMembership.brandId);
        localStorage.setItem(BRAND_STORAGE_KEY, firstMembership.brandId);
      }
    }
  }, [activeBrandId, memberships]);

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
    memberships.find((m) => m.brandId === activeBrandId) || null;

  const value: BrandContextType = {
    activeBrandId,
    activeMembership,
    memberships,
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
