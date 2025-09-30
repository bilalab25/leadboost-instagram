// src/hooks/useAuth.ts
import { useQuery } from "@tanstack/react-query";

interface ApiUser {
  id: string;
  email: string;
  // agrega aquí los campos que regreses en req.user (ej. name, role, etc.)
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
    user: data?.user ?? null, // 👈 ahora sí devuelve el objeto user directo
    isAuthenticated: !!data?.user && !error,
    isLoading,
  };
}
