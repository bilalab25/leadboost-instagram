import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: false, // Disable automatic fetching completely
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
