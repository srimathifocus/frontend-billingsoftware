import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Search,
  User,
  Phone,
  IndianRupee,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Calculator,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  CreditCard as PayIcon,
  Download,
  X,
} from "lucide-react";
import api from "../utils/api";
import { Loan, Payment } from "../types";
import { colors, themeConfig } from "../theme/colors";

interface LoanWithCustomer extends Loan {
  customer: {
    _id: string;
    name: string;
    phone: string;
    address: {
      doorNo: string;
      street: string;
      town: string;
      district: string;
      pincode: string;
    };
  };
  interestAmount: number;
  totalAmount: number;
  daysPending: number;
}

const fetchActiveLoansForRepayment = async (): Promise<LoanWithCustomer[]> => {
  const response = await api.get("/loans/active-for-repayment");
  return response.data;
};

const calculateInterest = async (loanId: string) => {
  const response = await api.get(`/repayment/calculate-interest/${loanId}`);
  return response.data;
};

const processRepayment = async (data: { loanId: string; payment: Payment }) => {
  const response = await api.post("/repayment/pay", data);
  return response.data;
};

export const LoanRepaymentManagementPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "overdue" | "high-interest" | "expiring"
  >("all");
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [selectedLoanForRepayment, setSelectedLoanForRepayment] =
    useState<LoanWithCustomer | null>(null);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [repaymentSuccess, setRepaymentSuccess] = useState<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch active loans
  const {
    data: loans = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "active-loans-repayment",
      { search: debouncedSearch, filter: filterBy },
    ],
    queryFn: fetchActiveLoansForRepayment,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Repayment form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ cash: number; online: number }>();

  // Repayment mutation
  const repaymentMutation = useMutation({
    mutationFn: processRepayment,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["active-loans-repayment"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      setRepaymentSuccess({
        loanId: data.loanId,
        loanObjectId: selectedLoanForRepayment?._id,
        customer: selectedLoanForRepayment?.customer,
        amount: data.totalAmount,
        interestAmount: data.interestAmount,
      });

      setShowRepaymentModal(false);
      reset();
    },
    onError: (error: any) => {
      console.error("Repayment error:", error);
    },
  });

  // Direct download function - using loanObjectId for API, loanId for filename
  const downloadInvoice = async (
    loanObjectId: string,
    loanId: string,
    type: "billing" | "repayment"
  ) => {
    try {
      const endpoint =
        type === "billing"
          ? `/invoice/loan/${loanObjectId}/pdf`
          : `/invoice/repayment/${loanObjectId}/pdf`;

      console.log(`Downloading ${type} invoice for loanId: ${loanId}`);

      const response = await api.get(endpoint, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });

      // Check if response is actually a PDF
      if (response.data.type !== "application/pdf") {
        console.error("Response is not a PDF:", response.data.type);
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
    } catch (error: any) {
      console.error(`Error downloading ${type} invoice:`, error);
    }
  };

  // Filter loans based on search and filter
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.loanId.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      loan.customer.name
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase()) ||
      loan.customer.phone.includes(debouncedSearch);

    if (!matchesSearch) return false;

    switch (filterBy) {
      case "overdue":
        return loan.daysPending > 30;
      case "high-interest":
        return loan.interestAmount > loan.amount * 0.1;
      case "expiring":
        return loan.daysPending > 300; // Close to 1 year
      default:
        return true;
    }
  });

  // Status helpers
  const getLoanStatus = (loan: LoanWithCustomer) => {
    if (loan.daysPending > 365) {
      return {
        label: "Critical",
        bg: "bg-red-100",
        text: "text-red-800",
        icon: AlertTriangle,
      };
    } else if (loan.daysPending > 30) {
      return {
        label: "Overdue",
        bg: "bg-orange-100",
        text: "text-orange-800",
        icon: AlertCircle,
      };
    } else {
      return {
        label: "Active",
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle2,
      };
    }
  };

  const formatAddress = (address: any) => {
    return `${address.town}, ${address.district}`;
  };

  const handleLoanExpand = (loanId: string) => {
    setExpandedLoan(expandedLoan === loanId ? null : loanId);
  };

  const handleRepayClick = (loan: LoanWithCustomer) => {
    setSelectedLoanForRepayment(loan);
    setShowRepaymentModal(true);
  };

  const onRepaymentSubmit = (data: { cash: number; online: number }) => {
    if (!selectedLoanForRepayment) return;

    const payment: Payment = {
      cash: parseFloat(data.cash.toString()) || 0,
      online: parseFloat(data.online.toString()) || 0,
    };

    if (
      payment.cash + payment.online !==
      selectedLoanForRepayment.totalAmount
    ) {
      alert(
        `Total payment must equal ₹${selectedLoanForRepayment.totalAmount.toLocaleString()}`
      );
      return;
    }

    repaymentMutation.mutate({
      loanId: selectedLoanForRepayment._id,
      payment,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: colors.primary.dark }}
        ></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  💰 Loan Repayment Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage loan repayments with automatic interest calculation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => refetch()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredLoans.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Active Loans
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹
                  {filteredLoans
                    .reduce((sum, loan) => sum + loan.amount, 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Outstanding
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹
                  {filteredLoans
                    .reduce((sum, loan) => sum + loan.interestAmount, 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Interest
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredLoans.filter((loan) => loan.daysPending > 30).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Overdue Loans
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by Loan ID, Customer Name, or Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Loans</option>
                  <option value="overdue">Overdue</option>
                  <option value="high-interest">High Interest</option>
                  <option value="expiring">Near Expiry</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loans List */}
        <div className="space-y-4">
          {filteredLoans.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No loans found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "No active loans require repayment"}
              </p>
            </div>
          ) : (
            filteredLoans.map((loan) => {
              const statusInfo = getLoanStatus(loan);
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={loan._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Loan Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleLoanExpand(loan._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: colors.primary.light + "20",
                          }}
                        >
                          <CreditCard
                            className="h-6 w-6"
                            style={{ color: colors.primary.dark }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {loan.customer.name}
                            </h3>
                            <div
                              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              <span>{statusInfo.label}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <div className="flex items-center space-x-1">
                              <FileText className="h-4 w-4" />
                              <span>Loan: {loan.loanId}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone className="h-4 w-4" />
                              <span>{loan.customer.phone}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {formatAddress(loan.customer.address)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{loan.daysPending} days pending</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Loan Amount */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            ₹{loan.totalAmount.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Principal: ₹{loan.amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-red-600">
                            Interest: ₹{loan.interestAmount.toLocaleString()}
                          </div>
                        </div>

                        {/* Repay Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRepayClick(loan);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <PayIcon className="h-4 w-4" />
                          <span>Repay Now</span>
                        </button>

                        {expandedLoan === loan._id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedLoan === loan._id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Loan Details */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Loan Details
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                Loan Date:
                              </span>
                              <span className="text-gray-900 dark:text-white">
                                {new Date(loan.loanDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                Interest Rate:
                              </span>
                              <span className="text-gray-900 dark:text-white">
                                {loan.interestPercent}% per month
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                Validity:
                              </span>
                              <span className="text-gray-900 dark:text-white">
                                {loan.validity} months
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                Days Pending:
                              </span>
                              <span
                                className={
                                  loan.daysPending > 30
                                    ? "text-red-600"
                                    : "text-gray-900 dark:text-white"
                                }
                              >
                                {loan.daysPending} days
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Items */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Pledged Items ({loan.items.length})
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {loan.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-2"
                              >
                                <div>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {item.name}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                                    ({item.weight}g)
                                  </span>
                                </div>
                                <span className="text-gray-900 dark:text-white">
                                  ₹{item.estimatedValue.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Repayment Modal */}
      {showRepaymentModal && selectedLoanForRepayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                💰 Process Loan Repayment
              </h3>
              <button
                onClick={() => setShowRepaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            {/* Customer & Loan Info */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Customer:</strong>{" "}
                  {selectedLoanForRepayment.customer.name}
                </div>
                <div>
                  <strong>Loan ID:</strong> {selectedLoanForRepayment.loanId}
                </div>
                <div>
                  <strong>Principal:</strong> ₹
                  {selectedLoanForRepayment.amount.toLocaleString()}
                </div>
                <div>
                  <strong>Interest:</strong> ₹
                  {selectedLoanForRepayment.interestAmount.toLocaleString()}
                </div>
                <div className="col-span-2">
                  <strong className="text-lg">Total Amount:</strong>{" "}
                  <span className="text-xl font-bold text-green-600">
                    ₹{selectedLoanForRepayment.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form
              onSubmit={handleSubmit(onRepaymentSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cash Payment (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("cash", { min: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Online Payment (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("online", { min: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowRepaymentModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={repaymentMutation.isPending}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {repaymentMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span>
                    {repaymentMutation.isPending
                      ? "Processing..."
                      : "Process Repayment"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {repaymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              {/* Success Message with Close Button */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 relative">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setRepaymentSuccess(null);
                  }}
                  className="absolute top-3 right-3 p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded-full transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5 text-green-600 dark:text-green-400" />
                </button>

                <div className="flex items-center gap-3 pr-8">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200">
                      Payment Successful!
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Loan {repaymentSuccess.loanId} has been fully repaid.
                      Download your invoices below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={() =>
                    downloadInvoice(
                      repaymentSuccess.loanObjectId,
                      repaymentSuccess.loanId,
                      "billing"
                    )
                  }
                  className="flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{ backgroundColor: colors.primary.dark }}
                >
                  <Download className="h-4 w-4" />
                  <span>Download Billing Invoice</span>
                </button>

                <button
                  onClick={() =>
                    downloadInvoice(
                      repaymentSuccess.loanObjectId,
                      repaymentSuccess.loanId,
                      "repayment"
                    )
                  }
                  className="flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{ backgroundColor: colors.primary.medium }}
                >
                  <Download className="h-4 w-4" />
                  <span>Download Repayment Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
