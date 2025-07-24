import { useState, useEffect } from "react";
import {
  X,
  History,
  User,
  Calendar,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CustomerEditHistory } from "../types";
import { colors } from "../theme/colors";
import api from "../utils/api";

interface CustomerEditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

export const CustomerEditHistoryModal = ({
  isOpen,
  onClose,
  customerId,
  customerName,
}: CustomerEditHistoryModalProps) => {
  const [history, setHistory] = useState<CustomerEditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchEditHistory();
    }
  }, [isOpen, customerId]);

  const fetchEditHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/customers/${customerId}/edit-history`);
      setHistory(response.data.data);
    } catch (error: any) {
      console.error("Error fetching edit history:", error);
      setError(error.response?.data?.message || "Failed to load edit history");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (historyId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(historyId)) {
      newExpanded.delete(historyId);
    } else {
      newExpanded.add(historyId);
    }
    setExpandedItems(newExpanded);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "Not set";
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getEditTypeIcon = (editType: string) => {
    switch (editType) {
      case "UPDATE":
        return <Edit className="h-4 w-4 text-blue-600" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEditTypeColor = (editType: string) => {
    switch (editType) {
      case "UPDATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: colors.primary.light + "20" }}
            >
              <History
                className="h-5 w-5"
                style={{ color: colors.primary.dark }}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit History
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {customerName} - All changes and modifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderBottomColor: colors.primary.dark }}
              ></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Loading edit history...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-2">{error}</div>
              <button
                onClick={fetchEditHistory}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                style={{ backgroundColor: colors.primary.dark }}
              >
                Retry
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Edit History
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This customer has not been edited yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const isExpanded = expandedItems.has(item._id);

                return (
                  <div
                    key={item._id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    {/* Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => toggleExpanded(item._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getEditTypeIcon(item.editType)}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getEditTypeColor(
                                item.editType
                              )}`}
                            >
                              {item.editType}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 text-sm">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {item.editedBy.name}
                              </span>
                              <span className="text-gray-500">
                                ({item.editedBy.role})
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(item.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {item.reason && (
                            <span className="text-xs text-gray-500 max-w-xs truncate">
                              {item.reason}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-600 p-4">
                        {/* Reason */}
                        {item.reason && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Reason:
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border">
                              {item.reason}
                            </p>
                          </div>
                        )}

                        {/* Changes */}
                        {item.editType === "UPDATE" &&
                          Object.keys(item.changes).length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Changes Made:
                              </h4>
                              <div className="space-y-3">
                                {Object.entries(item.changes).map(
                                  ([field, change]) => (
                                    <div
                                      key={field}
                                      className="bg-white dark:bg-gray-800 p-3 rounded border"
                                    >
                                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-2 capitalize">
                                        {field
                                          .replace(/([A-Z])/g, " $1")
                                          .trim()}
                                        :
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                        <div>
                                          <span className="text-red-600 dark:text-red-400 font-medium">
                                            From:
                                          </span>
                                          <pre className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-800 dark:text-red-200 whitespace-pre-wrap">
                                            {formatValue((change as any).from)}
                                          </pre>
                                        </div>
                                        <div>
                                          <span className="text-green-600 dark:text-green-400 font-medium">
                                            To:
                                          </span>
                                          <pre className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded text-green-800 dark:text-green-200 whitespace-pre-wrap">
                                            {formatValue((change as any).to)}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Deletion Info */}
                        {item.editType === "DELETE" && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Deleted Data:
                            </h4>
                            <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded border text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(item.previousData, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Technical Details */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          {item.ipAddress && (
                            <div>IP Address: {item.ipAddress}</div>
                          )}
                          {item.userAgent && (
                            <div>User Agent: {item.userAgent}</div>
                          )}
                          <div>Edit ID: {item._id}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
