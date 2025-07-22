import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  FileText,
  User,
  Save,
  Edit,
  Building,
} from "lucide-react";
import api from "../utils/api";

interface ShopDetails {
  _id: string;
  shopName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  licenseNumber: string;
  location: string;
  auditorName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const fetchShopDetails = async (): Promise<ShopDetails> => {
  const response = await api.get("/shop-details");
  return response.data.data;
};

const updateShopDetails = async (
  data: Partial<ShopDetails>
): Promise<ShopDetails> => {
  const response = await api.put("/shop-details", data);
  return response.data.data;
};

export const ShopDetailsPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ShopDetails>>({});
  const queryClient = useQueryClient();

  const { data: shopDetails, isLoading } = useQuery({
    queryKey: ["shopDetails"],
    queryFn: fetchShopDetails,
  });

  const updateMutation = useMutation({
    mutationFn: updateShopDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopDetails"] });
      setIsEditing(false);
      setFormData({});
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(shopDetails || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ShopDetails, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Shop Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your shop information and business details
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Details</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{updateMutation.isPending ? "Saving..." : "Save"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shop Name */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Store className="h-4 w-4" />
              <span>Shop Name</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.shopName || ""}
                onChange={(e) => handleInputChange("shopName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {shopDetails?.shopName}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building className="h-4 w-4" />
              <span>Location</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.location || ""}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {shopDetails?.location}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="h-4 w-4" />
              <span>Address</span>
            </label>
            {isEditing ? (
              <textarea
                value={formData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {shopDetails?.address}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="h-4 w-4" />
              <span>Phone Number</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {shopDetails?.phone}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {shopDetails?.email}
              </p>
            )}
          </div>

          {/* GST Number */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="h-4 w-4" />
              <span>GST Number</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.gstNumber || ""}
                onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {shopDetails?.gstNumber}
              </p>
            )}
          </div>

          {/* License Number */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="h-4 w-4" />
              <span>License Number</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.licenseNumber || ""}
                onChange={(e) =>
                  handleInputChange("licenseNumber", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {shopDetails?.licenseNumber}
              </p>
            )}
          </div>

          {/* Auditor Name */}
          <div className="md:col-span-2">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="h-4 w-4" />
              <span>Auditor Name</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.auditorName || ""}
                onChange={(e) =>
                  handleInputChange("auditorName", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {shopDetails?.auditorName || "Not specified"}
              </p>
            )}
          </div>
        </div>

        {shopDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>
                Last updated: {new Date(shopDetails.updatedAt).toLocaleString()}
              </p>
              <p>Created: {new Date(shopDetails.createdAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
