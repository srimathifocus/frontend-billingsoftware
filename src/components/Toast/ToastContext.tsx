import React, { createContext, useContext, useState, useCallback } from "react";
import {
  CheckCircle,
  AlertTriangle,
  X,
  Info,
  AlertCircle,
  Clock,
  Shield,
  Star,
  Heart,
  Zap,
} from "lucide-react";
import { colors } from "../../theme/colors";

interface Toast {
  id: string;
  type:
    | "success"
    | "error"
    | "warning"
    | "info"
    | "logout"
    | "security"
    | "premium"
    | "celebration"
    | "loading";
  title: string;
  message?: string;
  duration?: number;
  closeable?: boolean;
  onClose?: () => void;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => string;
  hideToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  logout: (title: string, message?: string, duration?: number) => string;
  security: (title: string, message?: string, duration?: number) => string;
  premium: (title: string, message?: string, duration?: number) => string;
  celebration: (title: string, message?: string, duration?: number) => string;
  loading: (title: string, message?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      ...toast,
      id,
      closeable: toast.closeable !== false, // Default to true
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-hide after duration (default varies by type)
    const defaultDurations = {
      success: 4000,
      error: 6000,
      warning: 5000,
      info: 4000,
      logout: 20000,
      security: 6000,
      premium: 4000,
      celebration: 5000,
      loading: 2000,
    };

    const duration =
      toast.duration !== undefined
        ? toast.duration
        : defaultDurations[toast.type];

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }

    return id;
  }, []);

  const hideToast = useCallback(
    (id: string) => {
      const toast = toasts.find((t) => t.id === id);
      if (toast?.onClose) {
        toast.onClose();
      }
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    },
    [toasts]
  );

  // Convenience methods
  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: "success", title, message, duration }),
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: "error", title, message, duration }),
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: "warning", title, message, duration }),
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: "info", title, message, duration }),
    [showToast]
  );

  const logout = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: "logout", title, message, duration }),
    [showToast]
  );

  const security = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: "security", title, message, duration }),
    [showToast]
  );

  const premium = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: "premium", title, message, duration }),
    [showToast]
  );

  const celebration = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: "celebration", title, message, duration }),
    [showToast]
  );

  const loading = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: "loading", title, message, duration }),
    [showToast]
  );

  const getToastIcon = (type: Toast["type"]) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case "success":
        return (
          <CheckCircle
            className={iconClass}
            style={{ color: colors.status?.success || "#10B981" }}
          />
        );
      case "error":
        return (
          <AlertCircle
            className={iconClass}
            style={{ color: colors.status?.error || "#EF4444" }}
          />
        );
      case "warning":
        return (
          <AlertTriangle
            className={iconClass}
            style={{ color: colors.status?.warning || "#F59E0B" }}
          />
        );
      case "info":
        return (
          <Info
            className={iconClass}
            style={{
              color:
                colors.primary?.medium || colors.primary?.dark || "#3B82F6",
            }}
          />
        );
      case "logout":
        return (
          <Clock
            className={`${iconClass} animate-pulse`}
            style={{ color: "#EA580C" }}
          />
        );
      case "security":
        return <Shield className={iconClass} style={{ color: "#7C3AED" }} />;
      case "premium":
        return <Star className={iconClass} style={{ color: "#D97706" }} />;
      case "celebration":
        return (
          <Heart
            className={`${iconClass} animate-pulse`}
            style={{ color: "#EC4899" }}
          />
        );
      case "loading":
        return (
          <Zap
            className={`${iconClass} animate-spin`}
            style={{ color: "#6366F1" }}
          />
        );
      default:
        return (
          <Info
            className={iconClass}
            style={{ color: colors.primary?.medium || "#3B82F6" }}
          />
        );
    }
  };

  const getToastColor = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return colors.status?.success || "#10B981";
      case "error":
        return colors.status?.error || "#EF4444";
      case "warning":
        return colors.status?.warning || "#F59E0B";
      case "info":
        return colors.primary?.medium || colors.primary?.dark || "#3B82F6";
      case "logout":
        return "#EA580C";
      case "security":
        return "#7C3AED";
      case "premium":
        return "#D97706";
      case "celebration":
        return "#EC4899";
      case "loading":
        return "#6366F1";
      default:
        return colors.primary?.medium || "#3B82F6";
    }
  };

  const getToastBackground = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20";
      case "error":
        return "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20";
      case "warning":
        return "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20";
      case "info":
        return "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20";
      case "logout":
        return "bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20";
      case "security":
        return "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20";
      case "premium":
        return "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20";
      case "celebration":
        return "bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20";
      case "loading":
        return "bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20";
      default:
        return "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20";
    }
  };

  const getShadowClass = (type: Toast["type"]) => {
    switch (type) {
      case "logout":
        return "shadow-2xl ring-2 ring-orange-200 dark:ring-orange-800";
      case "celebration":
        return "shadow-xl ring-2 ring-pink-200 dark:ring-pink-800";
      case "premium":
        return "shadow-xl ring-1 ring-yellow-200 dark:ring-yellow-800";
      default:
        return "shadow-xl";
    }
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        hideToast,
        success,
        error,
        warning,
        info,
        logout,
        security,
        premium,
        celebration,
        loading,
      }}
    >
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              rounded-xl border-l-4 p-4 min-w-[320px] transition-all duration-300 ease-out
              animate-in slide-in-from-right-full pointer-events-auto
              ${getToastBackground(toast.type)} 
              ${getShadowClass(toast.type)}
              backdrop-blur-sm
            `}
            style={{
              borderLeftColor: getToastColor(toast.type),
            }}
          >
            <div className="flex items-start space-x-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110"
                style={{
                  backgroundColor: `${getToastColor(toast.type)}20`,
                  border: `1px solid ${getToastColor(toast.type)}30`,
                }}
              >
                {getToastIcon(toast.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100">
                  {toast.title}
                </h4>
                {toast.message && (
                  <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                    {toast.message}
                  </p>
                )}
              </div>
              {toast.closeable && toast.type !== "logout" && (
                <button
                  onClick={() => hideToast(toast.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                           transition-colors p-1 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {toast.type === "logout" && (
                <button
                  onClick={() => hideToast(toast.id)}
                  className="flex-shrink-0 text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 
                           transition-colors p-1 rounded-full hover:bg-orange-100/50 dark:hover:bg-orange-800/50
                           font-medium text-xs"
                  title="Click to dismiss (will still auto-logout)"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
