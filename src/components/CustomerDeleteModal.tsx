import { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { Customer, CustomerDeleteRequest } from "../types";
import { colors } from "../theme/colors";

interface CustomerDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onDelete: (data: CustomerDeleteRequest) => Promise<void>;
  isLoading?: boolean;
}

export const CustomerDeleteModal = ({
  isOpen,
  onClose,
  customer,
  onDelete,
  isLoading = false,
}: CustomerDeleteModalProps) => {
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!reason.trim()) {
      newErrors.reason = "Reason for deletion is required";
    }

    if (confirmText !== "DELETE") {
      newErrors.confirmText = "Please type 'DELETE' to confirm";
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
      await onDelete({ reason });
      onClose();
      setReason("");
      setConfirmText("");
      setErrors({});
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const handleClose = () => {
    onClose();
    setReason("");
    setConfirmText("");
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Delete Customer
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Warning: Permanent Deletion
                </h3>
                <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                  <p>You are about to permanently delete:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      <strong>{customer.name}</strong> ({customer.phone})
                    </li>
                    <li>All associated loan records</li>
                    <li>All repayment history</li>
                    <li>All related transaction data</li>
                  </ul>
                  <p className="mt-2 font-medium">
                    This action cannot be undone!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Deletion *
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) {
                    setErrors((prev) => ({ ...prev, reason: "" }));
                  }
                }}
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
                placeholder="Please provide a detailed reason for deleting this customer..."
                disabled={isLoading}
              />
              {errors.reason && (
                <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type "DELETE" to confirm *
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  if (errors.confirmText) {
                    setErrors((prev) => ({ ...prev, confirmText: "" }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.confirmText
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                style={{
                  focusRing: errors.confirmText
                    ? undefined
                    : `2px solid ${colors.primary.light}`,
                }}
                placeholder="Type DELETE to confirm"
                disabled={isLoading}
              />
              {errors.confirmText && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmText}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || confirmText !== "DELETE"}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isLoading ? "Deleting..." : "Delete Customer"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
