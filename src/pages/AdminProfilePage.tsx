import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  User,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Key,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { colors, themeConfig } from "../theme/colors";
import { useAuth } from "../hooks/useAuth";

interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileUpdateFormData {
  name: string;
}

const changePassword = async (
  data: Omit<PasswordChangeFormData, "confirmPassword">
) => {
  const response = await api.put("/auth/change-password", data);
  return response.data;
};

const updateProfile = async (data: ProfileUpdateFormData) => {
  const response = await api.put("/auth/profile", data);
  return response.data;
};

export const AdminProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<PasswordChangeFormData>();

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileUpdateFormData>({
    defaultValues: {
      name: user?.name || "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      toast.success("Password changed successfully!");
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to change password");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      toast.success("Profile updated successfully!");
      setIsEditingName(false);
      // Update the user context with new data
      if (updateUser) {
        updateUser({ ...user, name: data.user.name });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (data: PasswordChangeFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (data.currentPassword === data.newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    const { confirmPassword, ...passwordData } = data;
    await changePasswordMutation.mutateAsync(passwordData);
  };

  const onProfileSubmit = async (data: ProfileUpdateFormData) => {
    await updateProfileMutation.mutateAsync(data);
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

  const passStrength = passwordStrength(newPassword || "");

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
            Admin Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your admin account settings
          </p>
        </div>
      </div>

      {/* Current User Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Account Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            {isEditingName ? (
              <form
                onSubmit={handleSubmitProfile(onProfileSubmit)}
                className="flex gap-2"
              >
                <input
                  type="text"
                  {...registerProfile("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your name"
                />
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? "..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false);
                    resetProfile({ name: user?.name || "" });
                  }}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-900 dark:text-white font-medium">
                  {user?.name || "Admin User"}
                </p>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                >
                  Edit
                </button>
              </div>
            )}
            {profileErrors.name && (
              <p className="text-red-500 text-sm mt-1">
                {profileErrors.name.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-900 dark:text-white capitalize font-medium">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <Key className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Change Password
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showCurrentPassword ? "text" : "password"}
                {...register("currentPassword", {
                  required: "Current password is required",
                })}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  {...register("newPassword", {
                    required: "New password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.newPassword.message}
                </p>
              )}

              {/* Password Strength Indicator */}
              {newPassword && (
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
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword", {
                    required: "Please confirm your new password",
                  })}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Confirm new password"
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
              disabled={changePasswordMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changePasswordMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {changePasswordMutation.isPending
                ? "Changing..."
                : "Change Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Security Guidelines */}
      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
              Password Security Guidelines
            </h3>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• Use a strong password with at least 8 characters</li>
              <li>
                • Include uppercase, lowercase, numbers, and special characters
              </li>
              <li>• Don't reuse your current password</li>
              <li>• Keep your password confidential and secure</li>
              <li>• Change your password regularly for better security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
