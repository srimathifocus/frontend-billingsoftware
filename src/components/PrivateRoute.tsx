import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.tsx";

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading, token, user } = useAuth();

  console.log("PrivateRoute check:", {
    isAuthenticated,
    isLoading,
    token: !!token,
    user: !!user,
  });

  if (isLoading) {
    console.log("PrivateRoute: Loading...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    console.log("PrivateRoute: Authenticated, rendering children");
    return <>{children}</>;
  } else {
    console.log("PrivateRoute: Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }
};
