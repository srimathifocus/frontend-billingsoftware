import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Redirect component to the new Modern Finance Management Page
const TamilNaduFinanceManagementPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new Modern Finance Management page
    navigate("/admin/modern-finance", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Redirecting to Modern Finance Management...
        </p>
      </div>
    </div>
  );
};

export default TamilNaduFinanceManagementPage;
