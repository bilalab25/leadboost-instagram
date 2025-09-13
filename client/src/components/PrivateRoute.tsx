// src/components/PrivateRoute.tsx
import React from "react";
import { Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth"; // Asegúrate de que la ruta sea correcta

interface PrivateRouteProps {
  path: string;
  component: React.ComponentType<any>;
  // Si tus rutas protegidas tienen parámetros, asegúrate de que 'rest' los propague
  // Por ejemplo, si tienes /campaigns/:id, 'id' se pasaría a tu componente Campaigns
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ path, component: Component, ...rest }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Muestra un spinner de carga mientras se verifica el estado de autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si el usuario no está autenticado, redirige a la página de login
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Si el usuario está autenticado, renderiza el componente solicitado
  // Asegúrate de pasar 'rest' para que los parámetros de ruta se propaguen
  return <Route path={path} component={Component} {...rest} />;
};

export default PrivateRoute;