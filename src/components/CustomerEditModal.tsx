import { useState, useEffect } from "react";
import { X, Save, User, Phone, MapPin, UserCheck } from "lucide-react";
import { Customer, CustomerEditRequest } from "../types";
import { colors } from "../theme/colors";

interface CustomerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSave: (data: CustomerEditRequest) => Promise<void>;
  isLoading?: boolean;
}

export const CustomerEditModal = ({
  isOpen,
  onClose,
  customer,
  onSave,
  isLoading = false,
}: CustomerEditModalProps) => {
  const [formData, setFormData] = useState<CustomerEditRequest>({
    name: "",
    phone: "",
    address: {
      doorNo: "",
      street: "",
      town: "",
      district: "",
      pincode: "",
    },
    nominee: "",
    reason: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        address: {
          doorNo:
            typeof customer.address === "object"
              ? customer.address.doorNo || ""
              : "",
          street:
            typeof customer.address === "object"
              ? customer.address.street || ""
              : "",
          town:
            typeof customer.address === "object"
              ? customer.address.town || ""
              : "",
          district:
            typeof customer.address === "object"
              ? customer.address.district || ""
              : "",
          pincode:
            typeof customer.address === "object"
              ? customer.address.pincode || ""
              : "",
        },
        nominee: customer.nominee || "",
        reason: "",
      });
      setErrors({});
    }
  }, [customer, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.reason?.trim()) {
      newErrors.reason = "Reason for edit is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: colors.primary.light + "20" }}
            >
              <User
                className="h-5 w-5"
                style={{ color: colors.primary.dark }}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Customer
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update customer information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Basic Information
            </h3>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.name
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                style={{
                  focusRing: errors.name
                    ? undefined
                    : `2px solid ${colors.primary.light}`,
                }}
                placeholder="Enter customer name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.phone
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                style={{
                  focusRing: errors.phone
                    ? undefined
                    : `2px solid ${colors.primary.light}`,
                }}
                placeholder="Enter phone number"
                disabled={isLoading}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Nominee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <UserCheck className="h-4 w-4 inline mr-1" />
                Nominee
              </label>
              <input
                type="text"
                value={formData.nominee}
                onChange={(e) => handleInputChange("nominee", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white"
                style={{
                  focusRing: `2px solid ${colors.primary.light}`,
                }}
                placeholder="Enter nominee name (optional)"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              <MapPin className="h-4 w-4 inline mr-1" />
              Address Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Door No.
                </label>
                <input
                  type="text"
                  value={formData.address?.doorNo || ""}
                  onChange={(e) =>
                    handleAddressChange("doorNo", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  style={{
                    focusRing: `2px solid ${colors.primary.light}`,
                  }}
                  placeholder="Door No."
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street
                </label>
                <input
                  type="text"
                  value={formData.address?.street || ""}
                  onChange={(e) =>
                    handleAddressChange("street", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  style={{
                    focusRing: `2px solid ${colors.primary.light}`,
                  }}
                  placeholder="Street"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Town
                </label>
                <input
                  type="text"
                  value={formData.address?.town || ""}
                  onChange={(e) => handleAddressChange("town", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  style={{
                    focusRing: `2px solid ${colors.primary.light}`,
                  }}
                  placeholder="Town"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  District
                </label>
                <input
                  type="text"
                  value={formData.address?.district || ""}
                  onChange={(e) =>
                    handleAddressChange("district", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  style={{
                    focusRing: `2px solid ${colors.primary.light}`,
                  }}
                  placeholder="District"
                  disabled={isLoading}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.address?.pincode || ""}
                  onChange={(e) =>
                    handleAddressChange("pincode", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  style={{
                    focusRing: `2px solid ${colors.primary.light}`,
                  }}
                  placeholder="Pincode"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Reason for Edit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Edit *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.reason
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              style={{
                focusRing: errors.reason
                  ? undefined
                  : `2px solid ${colors.primary.light}`,
              }}
              placeholder="Please provide a reason for this edit..."
              disabled={isLoading}
            />
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
              style={{ backgroundColor: colors.primary.dark }}
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
