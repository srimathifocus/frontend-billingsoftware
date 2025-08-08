import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Users,
  UserCheck,
  Eye,
  Edit,
  Trash2,
  History,
  Shield,
  Download,
} from "lucide-react";
import api from "../utils/api";
import { InvoiceViewButtons } from "../components/InvoiceViewButtons";
import { InvoiceModal } from "../components/InvoiceModal";
import { CustomerEditModal } from "../components/CustomerEditModal";
import { CustomerDeleteModal } from "../components/CustomerDeleteModal";
import { CustomerEditHistoryModal } from "../components/CustomerEditHistoryModal";
import { colors } from "../theme/colors";
import { CustomerEditRequest, CustomerDeleteRequest } from "../types";
import { toast } from "react-toastify";

interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: {
    doorNo?: string;
    street?: string;
    town?: string;
    district?: string;
    pincode?: string;
  };
  createdAt: string;
  loanStatus: "active" | "repaid";
}

interface CustomerInvoice {
  loanId: string;
  loanObjectId: string;
  customerName: string;
  customerPhone: string;
  loanAmount: number;
  loanDate: string;
  status: string;
  billingInvoiceAvailable: boolean;
  repaymentInvoiceAvailable: boolean;
  repaymentDate?: string;
  totalAmount?: number;
  items: Array<{
    name: string;
    category: string;
    weight: number;
    estimatedValue: number;
  }>;
}

const fetchCustomers = async (params: any): Promise<Customer[]> => {
  const response = await api.get("/customers", { params });
  return response.data.data;
};

const fetchCustomerInvoices = async (
  customerId: string
): Promise<CustomerInvoice[]> => {
  const response = await api.get(`/customers/${customerId}/invoices`);
  return response.data.data;
};

// Print functionality removed - only download available

export const CustomerManagementPage = () => {
  const queryClient = useQueryClient();

  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<{
    [key: string]: CustomerInvoice[];
  }>({});
  const [selectedInvoice, setSelectedInvoice] =
    useState<CustomerInvoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // New modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Get current user role from session storage
  const currentUser = JSON.parse(sessionStorage.getItem("admin_user") || "{}");
  const isAdmin = currentUser.role === "admin";

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Direct download function
  const downloadInvoice = async (
    loanId: string,
    type: "billing" | "repayment",
    customerName: string
  ) => {
    try {
      const endpoint =
        type === "billing"
          ? `/invoice/loan/${loanId}/pdf`
          : `/invoice/repayment/${loanId}/pdf`;

      console.log(`Downloading ${type} invoice for loanId: ${loanId}`);
      toast.info(`Preparing ${type} invoice for download...`);

      const response = await api.get(endpoint, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });

      // Check if response is actually a PDF
      if (response.data.type !== "application/pdf") {
        console.error("Response is not a PDF:", response.data.type);
        toast.error("Invalid PDF response from server");
        return;
      }

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const prefix = type === "billing" ? "B" : "R";
      link.download = `${prefix}-${loanId}.pdf`;

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success(`${type} invoice downloaded successfully!`);
    } catch (error: any) {
      console.error(`Error downloading ${type} invoice:`, error);

      if (error.response?.status === 404) {
        toast.error(`${type} invoice not found for this loan`);
      } else if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error(`Failed to download ${type} invoice. Please try again.`);
      }
    }
  };

  const {
    data: customers,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["customers", { search: debouncedSearch, status: statusFilter }],
    queryFn: () =>
      fetchCustomers({
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  // Edit customer mutation
  const editCustomerMutation = useMutation({
    mutationFn: async ({
      customerId,
      data,
    }: {
      customerId: string;
      data: CustomerEditRequest;
    }) => {
      const response = await api.put(`/customers/${customerId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update customer");
    },
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async ({
      customerId,
      data,
    }: {
      customerId: string;
      data: CustomerDeleteRequest;
    }) => {
      const response = await api.delete(`/customers/${customerId}`, { data });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete customer");
    },
  });

  const handleCustomerExpand = async (customerId: string) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
      return;
    }

    setExpandedCustomer(customerId);

    // Fetch invoices if not already loaded
    if (!customerInvoices[customerId]) {
      try {
        const invoices = await fetchCustomerInvoices(customerId);
        setCustomerInvoices((prev) => ({
          ...prev,
          [customerId]: invoices,
        }));
      } catch (error) {
        console.error("Error fetching customer invoices:", error);
      }
    }
  };

  const showInvoiceDetails = (invoice: CustomerInvoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  // Handler functions for new modals
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleViewHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const handleSaveEdit = async (data: CustomerEditRequest) => {
    if (selectedCustomer) {
      await editCustomerMutation.mutateAsync({
        customerId: selectedCustomer._id!,
        data,
      });
    }
  };

  const handleConfirmDelete = async (data: CustomerDeleteRequest) => {
    if (selectedCustomer) {
      await deleteCustomerMutation.mutateAsync({
        customerId: selectedCustomer._id!,
        data,
      });
    }
  };

  const formatAddress = (address: Customer["address"]) => {
    const parts = [
      address.doorNo,
      address.street,
      address.town,
      address.district,
      address.pincode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return {
          bg: "bg-blue-100 dark:bg-blue-900/20",
          text: "text-blue-800 dark:text-blue-200",
          icon: Clock,
          label: "Active",
        };
      case "repaid":
        return {
          bg: "bg-blue-200 dark:bg-blue-800/30",
          text: "text-blue-900 dark:text-blue-100",
          icon: CheckCircle,
          label: "Repaid",
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-gray-800",
          text: "text-gray-600 dark:text-gray-400",
          icon: AlertCircle,
          label: "Unknown",
        };
    }
  };

  const getCustomerCardBorder = (status: string) => {
    switch (status) {
      case "active":
        return "border-l-4 border-l-blue-600";
      case "repaid":
        return "border-l-4 border-l-blue-800";
      default:
        return "border-l-4 border-l-gray-400";
    }
  };

  // Filter counts
  const statusCounts =
    customers?.reduce((acc, customer) => {
      acc[customer.loanStatus] = (acc[customer.loanStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderBottomColor: colors.primary.dark }}
        ></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Customer Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Search, filter and manage customer details and invoices
            </p>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white"
                style={{
                  focusRing: `2px solid ${colors.primary.light}`,
                  borderColor: searchTerm ? colors.primary.light : undefined,
                }}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:border-transparent dark:bg-gray-800 dark:text-white min-w-[160px]"
                style={{
                  focusRing: `2px solid ${colors.primary.light}`,
                  borderColor:
                    statusFilter !== "all" ? colors.primary.light : undefined,
                }}
              >
                <option value="all">All Customers</option>
                <option value="active">
                  Active ({statusCounts.active || 0})
                </option>
                <option value="repaid">
                  Repaid ({statusCounts.repaid || 0})
                </option>
              </select>
            </div>
          </div>

          {/* Status Summary */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total: {customers?.length || 0}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock
                className="h-4 w-4"
                style={{ color: colors.status.active }}
              />
              <span className="text-sm" style={{ color: colors.status.active }}>
                Active: {statusCounts.active || 0}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle
                className="h-4 w-4"
                style={{ color: colors.status.repaid }}
              />
              <span className="text-sm" style={{ color: colors.status.repaid }}>
                Repaid: {statusCounts.repaid || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {customers?.map((customer) => {
          const statusInfo = getStatusColor(customer.loanStatus);
          const StatusIcon = statusInfo.icon;

          return (
            <div
              key={customer._id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${getCustomerCardBorder(
                customer.loanStatus
              )}`}
            >
              {/* Customer Header */}
              <div
                className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleCustomerExpand(customer._id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                    <div
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: colors.primary.light + "20" }}
                    >
                      <User
                        className="h-5 w-5"
                        style={{ color: colors.primary.dark }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {customer.name}
                        </h3>
                        {/* Status Badge */}
                        <div
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text} w-fit`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusInfo.label}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {formatAddress(customer.address)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>
                            Added:{" "}
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                    {/* Admin-only action buttons */}
                    {isAdmin && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCustomer(customer);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit Customer"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewHistory(customer);
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="View Edit History"
                        >
                          <History className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomer(customer);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    )}

                    {/* Role indicator */}
                    {!isAdmin && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Shield className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          Manager View
                        </span>
                      </div>
                    )}

                    {expandedCustomer === customer._id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content - Invoices */}
              {expandedCustomer === customer._id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Loan Invoices
                  </h4>

                  {customerInvoices[customer._id] ? (
                    <div className="space-y-4">
                      {customerInvoices[customer._id].map((invoice) => (
                        <div
                          key={invoice.loanId}
                          className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 ${getCustomerCardBorder(
                            invoice.status
                          )}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div className="flex items-start space-x-3">
                              <div
                                className="p-2 rounded-lg flex-shrink-0"
                                style={{
                                  backgroundColor: colors.primary.medium + "20",
                                }}
                              >
                                <FileText
                                  className="h-4 w-4"
                                  style={{ color: colors.primary.medium }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white mb-2">
                                  Loan ID: {invoice.loanId}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                    <span>
                                      {new Date(
                                        invoice.loanDate
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <IndianRupee className="h-4 w-4 flex-shrink-0" />
                                    <span>
                                      ₹{invoice.loanAmount.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {invoice.status === "active" ? (
                                      <>
                                        <Clock
                                          className="h-4 w-4"
                                          style={{
                                            color: colors.status.active,
                                          }}
                                        />
                                        <span
                                          style={{
                                            color: colors.status.active,
                                          }}
                                        >
                                          Active
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle
                                          className="h-4 w-4"
                                          style={{
                                            color: colors.status.repaid,
                                          }}
                                        />
                                        <span
                                          style={{
                                            color: colors.status.repaid,
                                          }}
                                        >
                                          Repaid
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              {invoice.billingInvoiceAvailable && (
                                <button
                                  onClick={() =>
                                    downloadInvoice(
                                      invoice.loanObjectId,
                                      "billing",
                                      invoice.customerName
                                    )
                                  }
                                  className="flex items-center justify-center space-x-1 px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-colors"
                                  style={{
                                    backgroundColor: colors.primary.dark,
                                  }}
                                  title="Download Billing Invoice PDF"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Billing</span>
                                </button>
                              )}
                              {invoice.repaymentInvoiceAvailable && (
                                <button
                                  onClick={() =>
                                    downloadInvoice(
                                      invoice.loanObjectId,
                                      "repayment",
                                      invoice.customerName
                                    )
                                  }
                                  className="flex items-center justify-center space-x-1 px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-colors"
                                  style={{
                                    backgroundColor: colors.primary.medium,
                                  }}
                                  title="Download Repayment Invoice PDF"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Repayment</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Items Summary */}
                          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Items: </span>
                            {invoice.items.map((item, index) => (
                              <span key={index}>
                                {item.name} ({item.weight}g)
                                {index < invoice.items.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>

                          {invoice.repaymentDate && (
                            <div
                              className="mt-2 text-sm"
                              style={{ color: colors.status.repaid }}
                            >
                              Repaid on:{" "}
                              {new Date(
                                invoice.repaymentDate
                              ).toLocaleDateString()}
                              {invoice.totalAmount && (
                                <span>
                                  {" "}
                                  - Total: ₹
                                  {invoice.totalAmount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div
                        className="animate-spin rounded-full h-6 w-6 border-b-2"
                        style={{ borderBottomColor: colors.primary.dark }}
                      ></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        Loading invoices...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {customers?.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || statusFilter !== "all"
              ? "No customers found matching your criteria"
              : "No customers found"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Customers will appear here once you create billing records."}
          </p>
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="mt-4 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: colors.primary.dark }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedInvoice(null);
          }}
          loanId={selectedInvoice.loanId}
          loanObjectId={selectedInvoice.loanObjectId}
          type="view"
          invoiceData={{
            customerName: selectedInvoice.customerName,
            customerPhone: selectedInvoice.customerPhone,
            loanAmount: selectedInvoice.loanAmount,
            totalAmount: selectedInvoice.totalAmount,
            repaymentDate: selectedInvoice.repaymentDate,
            items: selectedInvoice.items,
          }}
        />
      )}

      {/* Edit Customer Modal */}
      {selectedCustomer && (
        <CustomerEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onSave={handleSaveEdit}
          isLoading={editCustomerMutation.isPending}
        />
      )}

      {/* Delete Customer Modal */}
      {selectedCustomer && (
        <CustomerDeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onDelete={handleConfirmDelete}
          isLoading={deleteCustomerMutation.isPending}
        />
      )}

      {/* Edit History Modal */}
      {selectedCustomer && (
        <CustomerEditHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedCustomer(null);
          }}
          customerId={selectedCustomer._id!}
          customerName={selectedCustomer.name}
        />
      )}
    </div>
  );
};
