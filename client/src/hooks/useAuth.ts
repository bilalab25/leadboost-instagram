// src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";

interface ApiUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  role?: string;
  profileImageUrl?: string;
  [key: string]: any;
}

export function useAuth() {
  const { data, isLoading, error } = useQuery<{ user: ApiUser | null }>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // 👈 al refrescar, vuelve a pedir al backend
    refetchInterval: false,
  });

  return {
    user: data?.user ?? null,
    isAuthenticated: !!data?.user && !error,
    isLoading,
    loading: isLoading,
  };
}
