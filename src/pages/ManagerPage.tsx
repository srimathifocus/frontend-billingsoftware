import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Shield,
  ArrowLeft,
  Search,
  Eye,
  EyeOff,
  User,
  Lock,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import api from "../utils/api";

interface ManagerFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  department?: string;
  role: "manager";
}

interface Manager {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager";
  phone?: string;
  department?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditManagerData {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role: "admin" | "manager";
}

// API Functions
const createManager = async (
  data: Omit<ManagerFormData, "confirmPassword">
) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

const fetchManagers = async (): Promise<Manager[]> => {
  const response = await api.get("/users/managers");
  return response.data;
};

const updateManager = async (
  id: string,
  data: EditManagerData
): Promise<Manager> => {
  const response = await api.put(`/users/managers/${id}`, data);
  return response.data;
};

const deleteManager = async (id: string): Promise<void> => {
  await api.delete(`/users/managers/${id}`);
};

const toggleManagerStatus = async (
  id: string,
  isActive: boolean
): Promise<Manager> => {
  const response = await api.patch(`/users/managers/${id}/status`, {
    isActive,
  });
  return response.data;
};

export const ManagerPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "manager">(
    "all"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Manager | null>(null);

  // Form for creating managers
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

  // Query to fetch managers
  const {
    data: managers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["managers"],
    queryFn: fetchManagers,
  });

  // Mutation for creating manager
  const createManagerMutation = useMutation({
    mutationFn: createManager,
    onSuccess: () => {
      toast.success("Manager created successfully!");
      reset();
      queryClient.invalidateQueries({ queryKey: ["managers"] });
      setActiveTab("list");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create manager");
    },
  });

  // Mutation for updating manager
  const updateManagerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditManagerData }) =>
      updateManager(id, data),
    onSuccess: () => {
      toast.success("Manager updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["managers"] });
      setEditingManager(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update manager");
    },
  });

  // Mutation for deleting manager
  const deleteManagerMutation = useMutation({
    mutationFn: deleteManager,
    onSuccess: () => {
      toast.success("Manager deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["managers"] });
      setShowDeleteModal(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete manager");
    },
  });

  // Mutation for toggling manager status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleManagerStatus(id, isActive),
    onSuccess: () => {
      toast.success("Manager status updated!");
      queryClient.invalidateQueries({ queryKey: ["managers"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
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

  // Filter managers based on search and filters
  const filteredManagers = managers.filter((manager) => {
    const matchesSearch =
      manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || manager.role === filterRole;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && manager.isActive !== false) ||
      (filterStatus === "inactive" && manager.isActive === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEdit = (manager: Manager) => {
    setEditingManager(manager);
  };

  const handleSaveEdit = (data: EditManagerData) => {
    if (editingManager) {
      updateManagerMutation.mutate({ id: editingManager._id, data });
    }
  };

  const handleDelete = (manager: Manager) => {
    setShowDeleteModal(manager);
  };

  const confirmDelete = () => {
    if (showDeleteModal) {
      deleteManagerMutation.mutate(showDeleteModal._id);
    }
  };

  const handleToggleStatus = (manager: Manager) => {
    const newStatus = manager.isActive === false ? true : false;
    toggleStatusMutation.mutate({ id: manager._id, isActive: newStatus });
  };

  const passStrength = passwordStrength(password || "");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Manager Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your pawn shop staff members
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-6 py-4 font-medium text-sm ${
              activeTab === "list"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Manager List ({managers.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-4 font-medium text-sm ${
              activeTab === "create"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create Manager
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "list" ? (
            <>
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search managers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="sm:w-40">
                  <select
                    value={filterRole}
                    onChange={(e) =>
                      setFilterRole(
                        e.target.value as "all" | "admin" | "manager"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div className="sm:w-40">
                  <select
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(
                        e.target.value as "all" | "active" | "inactive"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Manager List */}
              {filteredManagers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No managers found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "Get started by creating a new manager"}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setActiveTab("create")}
                      className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Create Manager
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredManagers.map((manager) => (
                    <div
                      key={manager._id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {manager.name}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                manager.role === "admin"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              }`}
                            >
                              {manager.role}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleStatus(manager)}
                            className={`p-1 rounded ${
                              manager.isActive !== false
                                ? "text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                                : "text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                            }`}
                            title={
                              manager.isActive !== false
                                ? "Deactivate Manager"
                                : "Activate Manager"
                            }
                          >
                            {manager.isActive !== false ? (
                              <UserCheck className="h-4 w-4" />
                            ) : (
                              <UserX className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(manager)}
                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                            title="Delete Manager"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">
                            {manager.email}
                          </span>
                        </div>
                        {manager.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {manager.phone}
                            </span>
                          </div>
                        )}
                        {manager.department && (
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {manager.department}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Created:{" "}
                          {new Date(manager.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Create Manager Form */}
              <div className="max-w-2xl">
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
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
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
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {createManagerMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Create Manager
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Manager
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete {showDeleteModal.name}? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteManagerMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteManagerMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
