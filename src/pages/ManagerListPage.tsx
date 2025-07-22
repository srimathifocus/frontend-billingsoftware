import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Shield,
  ArrowLeft,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "../utils/api";
import { colors } from "../theme/colors";

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

export const ManagerListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "manager">(
    "all"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Manager | null>(null);

  // Query to fetch managers
  const {
    data: managers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["managers"],
    queryFn: fetchManagers,
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">
          Error loading managers. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Manager Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your pawn shop staff members
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/managers/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Manager
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
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

          {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={filterRole}
              onChange={(e) =>
                setFilterRole(e.target.value as "all" | "admin" | "manager")
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | "active" | "inactive")
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Manager List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Managers ({filteredManagers.length})
            </h2>
          </div>
        </div>

        {filteredManagers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No managers found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Get started by adding a new manager"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredManagers.map((manager) => (
                  <tr
                    key={manager._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {manager.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {manager.department || "No Department"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-gray-400" />
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {manager.email}
                        </div>
                        {manager.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {manager.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          manager.isActive !== false
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {manager.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(manager.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(manager)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(manager)}
                          className={`${
                            manager.isActive !== false
                              ? "text-yellow-600 hover:text-yellow-800 dark:text-yellow-400"
                              : "text-green-600 hover:text-green-800 dark:text-green-400"
                          }`}
                          title={
                            manager.isActive !== false
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          {manager.isActive !== false ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(manager)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingManager && (
        <EditManagerModal
          manager={editingManager}
          onClose={() => setEditingManager(null)}
          onSave={handleSaveEdit}
          isLoading={updateManagerMutation.isPending}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          manager={showDeleteModal}
          onClose={() => setShowDeleteModal(null)}
          onConfirm={confirmDelete}
          isLoading={deleteManagerMutation.isPending}
        />
      )}
    </div>
  );
};

// Edit Manager Modal Component
const EditManagerModal = ({
  manager,
  onClose,
  onSave,
  isLoading,
}: {
  manager: Manager;
  onClose: () => void;
  onSave: (data: EditManagerData) => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<EditManagerData>({
    name: manager.name,
    email: manager.email,
    phone: manager.phone || "",
    department: manager.department || "",
    role: manager.role,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Edit Manager
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as "admin" | "manager",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({
  manager,
  onClose,
  onConfirm,
  isLoading,
}: {
  manager: Manager;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Delete Manager
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete <strong>{manager.name}</strong>? This
          action cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};
