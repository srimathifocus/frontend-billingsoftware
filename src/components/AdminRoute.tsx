import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    // Show toast notification and redirect managers to dashboard if they try to access admin routes
    useEffect(() => {
      toast.error("Access denied. Admin privileges required.");
    }, []);

    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
