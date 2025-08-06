import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Redirect component to the new Tamil Nadu Finance Management Page
export const EnhancedFinanceManagementPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new Tamil Nadu Finance Management page
    navigate("/tamil-nadu-finance", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Redirecting to Tamil Nadu Finance Management...
        </p>
      </div>
    </div>
  );
};
