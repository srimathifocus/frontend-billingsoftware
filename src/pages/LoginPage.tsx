import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../hooks/useAuth.tsx";
import api from "../utils/api";
import { colors, themeConfig } from "../theme/colors";

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const { login, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(schema),
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    // Clear any previous field errors
    setFieldErrors({});

    try {
      // Clear any existing corrupted data before login
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_user");

      const response = await api.post("/auth/login", data);
      console.log("Full API Response:", response);
      console.log("Response Data:", response.data);
      console.log("Response Data Keys:", Object.keys(response.data || {}));

      // Handle different possible response structures
      let token, user;

      if (response.data.token && response.data.user) {
        // Backend returns: { token: "...", user: { ... } }
        token = response.data.token;
        user = {
          id: response.data.user._id,
          name: response.data.user.name,
          email: response.data.user.email,
          branch: response.data.user.branch,
          role: response.data.user.role, // Use the actual role from the user object
        };
        console.log("Parsed API structure with separate user object");
      } else if (response.data.token) {
        // Fallback: token is directly in response, user data might be mixed in
        token = response.data.token;
        user = {
          id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          branch: response.data.branch,
          role: response.data.role, // Don't default to admin, use actual role
        };
        console.log("Parsed API structure with mixed data");
      } else if (
        response.data.data &&
        response.data.data.token &&
        response.data.data.user
      ) {
        // Nested in 'data' property
        token = response.data.data.token;
        user = response.data.data.user;
      } else if (response.data.access_token || response.data.accessToken) {
        // Different token field names
        token = response.data.access_token || response.data.accessToken;
        user =
          response.data.user || response.data.userData || response.data.profile;
      } else {
        // Generic fallback
        const responseKeys = Object.keys(response.data);
        const tokenKey = responseKeys.find(
          (key) =>
            key.toLowerCase().includes("token") ||
            key.toLowerCase().includes("jwt") ||
            key.toLowerCase().includes("auth")
        );

        if (tokenKey) {
          token = response.data[tokenKey];
          // Use the whole response as user data
          user = { ...response.data };
          delete user[tokenKey]; // Remove token from user object
        }
      }

      console.log("Extracted Token:", token);
      console.log("Extracted User:", user);

      if (!token || !user) {
        console.error("Could not extract token or user from response");
        console.error("Available response data:", response.data);
        throw new Error(
          `Invalid login response - missing token or user. Available keys: ${Object.keys(
            response.data
          ).join(", ")}`
        );
      }

      // Validate that role is properly set
      if (!user.role) {
        console.error("User role is missing from response");
        console.error("User object:", user);
        console.error("Full response:", response.data);
        throw new Error("User role is missing from login response");
      }

      console.log("User role validated:", user.role);

      console.log("About to call login with:", { token, user });
      login(token, user);

      toast.success("Login successful!");
      console.log("Login successful, navigating...");

      // Force immediate navigation
      window.location.href = "/dashboard";
    } catch (error: unknown) {
      console.error("Login error:", error);

      // Handle specific field errors from backend
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
            field?: string;
          };
        };
      };

      const errorData = axiosError?.response?.data;
      const errorMessage = errorData?.message || "Login failed";
      const errorField = errorData?.field;

      if (errorField && (errorField === "email" || errorField === "password")) {
        // Set field-specific error
        setFieldErrors({
          [errorField]: errorMessage,
        });
      } else {
        // Show generic error in toast
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md" style={{ width: themeConfig.sizing }}>
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg"
          style={{ borderRadius: themeConfig.borderRadius }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4"
              style={{ backgroundColor: colors.primary.medium }}
            >
              C
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">BILLING SOFTWARE</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              (Authorized Personnel Only)
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  {...register("email")}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-offset-2 focus:outline-none transition-colors"
                  style={{
                    focusRingColor: colors.primary.medium,
                    borderRadius: themeConfig.borderRadius,
                  }}
                  placeholder="admin@bs.com"
                />
              </div>
              {/* Show form validation errors or field-specific errors */}
              {(errors.email || fieldErrors.email) && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.email || errors.email?.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-offset-2 focus:outline-none transition-colors"
                  style={{
                    focusRingColor: colors.primary.medium,
                    borderRadius: themeConfig.borderRadius,
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff
                      size={20}
                      className="text-gray-400 hover:text-gray-600"
                    />
                  ) : (
                    <Eye
                      size={20}
                      className="text-gray-400 hover:text-gray-600"
                    />
                  )}
                </button>
              </div>
              {/* Show form validation errors or field-specific errors */}
              {(errors.password || fieldErrors.password) && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {fieldErrors.password || errors.password?.message}
                </p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-white font-medium rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors.primary.medium,
                borderRadius: themeConfig.borderRadius,
                focusRingColor: colors.primary.light,
              }}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Secure access for authorized personnel only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
