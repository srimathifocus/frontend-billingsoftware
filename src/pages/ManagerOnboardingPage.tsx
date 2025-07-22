import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  User,
  Mail,
  Lock,
  UserPlus,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { colors, themeConfig } from "../theme/colors";

interface ManagerFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  department?: string;
  role: "manager";
}

const createManager = async (
  data: Omit<ManagerFormData, "confirmPassword">
) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const ManagerOnboardingPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ManagerFormData>({
    defaultValues: {
      role: "manager",
    },
  });

  const createManagerMutation = useMutation({
    mutationFn: createManager,
    onSuccess: (data) => {
      toast.success("Manager created successfully!");
      reset();
      queryClient.invalidateQueries({ queryKey: ["managers"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create manager");
    },
  });

  const password = watch("password");

  const onSubmit = async (data: ManagerFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const { confirmPassword, ...managerData } = data;
    await createManagerMutation.mutateAsync(managerData);
  };

  const passwordStrength = (password: string) => {
    if (!password) return { strength: 0, text: "" };

    let strength = 0;
    const checks = [
      { test: password.length >= 8, text: "At least 8 characters" },
      { test: /[a-z]/.test(password), text: "Lowercase letter" },
      { test: /[A-Z]/.test(password), text: "Uppercase letter" },
      { test: /[0-9]/.test(password), text: "Number" },
      { test: /[^A-Za-z0-9]/.test(password), text: "Special character" },
    ];

    strength = checks.filter((check) => check.test).length;

    const strengthText =
      strength < 2 ? "Weak" : strength < 4 ? "Medium" : "Strong";

    const strengthColor =
      strength < 2
        ? "text-red-500"
        : strength < 4
        ? "text-yellow-500"
        : "text-green-500";

    return {
      strength: (strength / 5) * 100,
      text: strengthText,
      color: strengthColor,
    };
  };

  const passStrength = passwordStrength(password || "");

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Manager Onboarding
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create new manager accounts for your pawn shop
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Manager
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter full name"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Optional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                {...register("phone", {
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Phone number must be 10 digits",
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <input
                type="text"
                {...register("department")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter department (optional)"
              />
            </div>
          </div>

          {/* Role Selection - Fixed to Manager only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  {...register("role", { required: "Role is required" })}
                  value="manager"
                  className="text-blue-600 focus:ring-blue-500"
                  checked
                  readOnly
                />
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  Manager
                </span>
              </label>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Only manager accounts can be created through this form
            </p>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passStrength.strength < 40
                            ? "bg-red-500"
                            : passStrength.strength < 80
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${passStrength.strength}%` }}
                      />
                    </div>
                    <span className={`text-sm ${passStrength.color}`}>
                      {passStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                  })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={createManagerMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createManagerMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {createManagerMutation.isPending
                ? "Creating..."
                : "Create Manager"}
            </button>
          </div>
        </form>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Manager Account Guidelines
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>
                • Managers will have access to daily operations and reporting
              </li>
              <li>
                • Only managers can be created through this onboarding process
              </li>
              <li>• New managers will receive login credentials via email</li>
              <li>• Passwords should be strong and unique for security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
