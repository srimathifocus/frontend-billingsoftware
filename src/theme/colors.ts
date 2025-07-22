// Centralized color system - Dark Blue and White only
export const colors = {
  primary: {
    dark: "#00008B", // Dark Blue
    medium: "#1E3A8A", // Medium Dark Blue
    light: "#3B82F6", // Lighter Dark Blue
    50: "#EBF8FF", // Very light blue tint
    100: "#DBEAFE", // Light blue tint
    200: "#BFDBFE", // Light blue
    300: "#93C5FD", // Medium light blue
    400: "#60A5FA", // Medium blue
    500: "#3B82F6", // Base blue
    600: "#2563EB", // Dark blue
    700: "#1D4ED8", // Darker blue
    800: "#1E40AF", // Very dark blue
    900: "#1E3A8A", // Darkest blue
  },
  neutral: {
    white: "#FFFFFF",
    black: "#000000",
    // Using blue-tinted grays instead of regular grays
    gray: {
      50: "#F8FAFC", // Very light blue-gray
      100: "#F1F5F9", // Light blue-gray
      200: "#E2E8F0", // Medium light blue-gray
      300: "#CBD5E1", // Medium blue-gray
      400: "#94A3B8", // Dark blue-gray
      500: "#64748B", // Darker blue-gray
      600: "#475569", // Dark blue-gray
      700: "#334155", // Very dark blue-gray
      800: "#1E293B", // Almost black blue
      900: "#0F172A", // Deep dark blue
    },
  },
  status: {
    success: "#00008B", // Use dark blue for success
    warning: "#1E3A8A", // Use medium dark blue for warning
    error: "#00008B", // Use dark blue for error
    info: "#3B82F6", // Use light dark blue for info
    active: "#00008B", // Dark blue for active status
    repaid: "#1E3A8A", // Medium blue for repaid status
    inactive: "#64748B", // Blue-gray for inactive status
  },
};

export const themeConfig = {
  sizing: "95%", // Configurable sizing - can be changed to 100% if needed
  borderRadius: "8px",
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },
};
