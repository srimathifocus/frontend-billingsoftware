import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
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
  X,
} from "lucide-react";
import api from "../utils/api";
import { RepaymentSearchResult, Payment } from "../types";
import { colors, themeConfig } from "../theme/colors";
import { InvoiceViewButtons } from "../components/InvoiceViewButtons";

const searchLoanForRepayment = async (
  identifier: string
): Promise<RepaymentSearchResult> => {
  try {
    const response = await api.get(`/repayment/search/${identifier}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const processRepayment = async (data: { loanId: string; payment: Payment }) => {
  try {
    const response = await api.post("/repayment/pay", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const RepaymentPage = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState(loanId || "");
  const [selectedLoan, setSelectedLoan] =
    useState<RepaymentSearchResult | null>(null);
  const [repaymentSuccess, setRepaymentSuccess] = useState<{
    loanId: string;
    loanObjectId: string;
    payment: Payment;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<{
    payment: Payment;
  }>({
    defaultValues: {
      payment: {
        cash: 0,
        online: 0,
      },
    },
  });

  const [isSearching, setIsSearching] = useState(false);

  const repaymentMutation = useMutation({
    mutationFn: processRepayment,
    onSuccess: () => {
      toast.success("Loan repaid successfully!");
      queryClient.invalidateQueries({ queryKey: ["active-loans"] });
      queryClient.invalidateQueries({ queryKey: ["inactive-loans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to process repayment"
      );
    },
  });

  // Auto-search when loanId is provided in URL
  useEffect(() => {
    if (loanId && loanId.trim() && searchTerm === loanId && !selectedLoan) {
      const autoSearch = async () => {
        try {
          const result = await searchLoanForRepayment(loanId);
          if (result) {
            setSelectedLoan(result);
            setValue("payment.cash", result.loan.totalDue);
            setValue("payment.online", 0);
            toast.success("Loan loaded successfully!");
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to load loan");
        }
      };
      autoSearch();
    }
  }, [loanId, searchTerm, selectedLoan, setValue]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchTerm.trim()) {
        toast.error("Please enter a loan ID or phone number");
        return;
      }

      setIsSearching(true);
      setSelectedLoan(null);

      try {
        const result = await searchLoanForRepayment(searchTerm);
        if (result) {
          setSelectedLoan(result);
          setValue("payment.cash", result.loan.totalDue, {
            shouldValidate: true,
          });
          setValue("payment.online", 0, { shouldValidate: true });
          toast.success("Loan found successfully!");
        } else {
          toast.error("No loan data received");
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Loan not found";
        toast.error(errorMessage);
        setSelectedLoan(null);
      } finally {
        setIsSearching(false);
      }
    },
    [searchTerm, setValue]
  );

  const watchedPayment = watch("payment");

  // Calculate total payment directly
  const totalPayment = watchedPayment
    ? Number(watchedPayment.cash || 0) + Number(watchedPayment.online || 0)
    : 0;

  // Debug: Log the values to help troubleshoot
  console.log("Debug payment values:", {
    watchedPayment,
    cash: Number(watchedPayment?.cash || 0),
    online: Number(watchedPayment?.online || 0),
    totalPayment,
  });

  const paymentBalance = selectedLoan
    ? selectedLoan.loan.totalDue - totalPayment
    : 0;

  const onSubmit = async (data: { payment: Payment }) => {
    if (!selectedLoan) {
      toast.error("No loan selected");
      return;
    }

    if (totalPayment !== selectedLoan.loan.totalDue) {
      toast.error("Payment amount must equal total due amount");
      return;
    }

    if (totalPayment <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    try {
      const result = await repaymentMutation.mutateAsync({
        loanId: selectedLoan.loan.loanId,
        payment: {
          cash: Number(data.payment.cash),
          online: Number(data.payment.online),
        },
      });

      setRepaymentSuccess({
        loanId: selectedLoan.loan.loanId,
        loanObjectId: selectedLoan.loan._id,
        payment: {
          cash: Number(data.payment.cash),
          online: Number(data.payment.online),
        },
      });
    } catch (error: any) {
      // Error is already handled in mutation onError
    }
  };

  const fillExactAmount = useCallback(() => {
    if (selectedLoan) {
      setValue("payment.cash", selectedLoan.loan.totalDue, {
        shouldValidate: true,
      });
      setValue("payment.online", 0, { shouldValidate: true });
    }
  }, [selectedLoan, setValue]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Loan Repayment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Process loan repayment with interest calculation
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Loan
          </h2>
        </div>

        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter loan ID or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Loan Details */}
      {selectedLoan && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <User className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Loan Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Customer Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {selectedLoan.loan.customerId.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {selectedLoan.loan.customerId.phone}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Loan Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {selectedLoan.loan.loanId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {new Date(
                      selectedLoan.loan.createdAt ||
                        selectedLoan.loan.dateGranted
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">
                    {selectedLoan.loan.daysPassed} days passed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Payment Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Principal Amount
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ₹{selectedLoan.loan.amount.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Interest ({selectedLoan.loan.interestPercent}%)
                </p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  ₹{selectedLoan.loan.currentInterest.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Due
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ₹{selectedLoan.loan.totalDue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form */}
      {selectedLoan && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <IndianRupee className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Payment Details
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cash Payment
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("payment.cash", {
                    required: "Cash payment is required",
                    min: {
                      value: 0,
                      message: "Cash payment cannot be negative",
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter cash amount"
                  autoComplete="off"
                />
                {errors.payment?.cash && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.payment.cash.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Online Payment
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("payment.online", {
                    min: {
                      value: 0,
                      message: "Online payment cannot be negative",
                    },
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter online amount"
                  autoComplete="off"
                />
                {errors.payment?.online && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.payment.online.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={fillExactAmount}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Calculator className="h-4 w-4" />
                Fill Exact Amount
              </button>
            </div>

            {/* Debug Section - Remove this in production */}
            {/* <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Debug Values (Remove in Production)
              </h4>
              <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                <div>Raw watchedPayment: {JSON.stringify(watchedPayment)}</div>
                <div>Cash as string: "{watchedPayment?.cash}"</div>
                <div>Online as string: "{watchedPayment?.online}"</div>
                <div>Cash as number: {Number(watchedPayment?.cash || 0)}</div>
                <div>
                  Online as number: {Number(watchedPayment?.online || 0)}
                </div>
                <div>
                  Total calculated:{" "}
                  {Number(watchedPayment?.cash || 0) +
                    Number(watchedPayment?.online || 0)}
                </div>
              </div>
            </div> */}

            {/* Payment Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Payment Breakdown
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Cash Payment:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₹{Number(watchedPayment?.cash || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Online Payment:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₹{Number(watchedPayment?.online || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Payment:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₹{totalPayment.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Direct calculation:</span>
                  <span>
                    ₹
                    {(
                      Number(watchedPayment?.cash || 0) +
                      Number(watchedPayment?.online || 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Amount Due:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ₹{selectedLoan.loan.totalDue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Balance:
                  </span>
                  <span
                    className={`font-medium ${
                      paymentBalance === 0
                        ? "text-green-600 dark:text-green-400"
                        : paymentBalance < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    ₹{paymentBalance.toLocaleString()}
                  </span>
                </div>
                {paymentBalance !== 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-600 dark:text-yellow-400">
                      {paymentBalance > 0
                        ? "Insufficient payment amount"
                        : "Payment exceeds due amount"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={repaymentMutation.isPending || paymentBalance !== 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="h-4 w-4" />
                {repaymentMutation.isPending
                  ? "Processing..."
                  : "Process Payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty State */}
      {!selectedLoan && !isSearching && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Search for a Loan
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a loan ID or phone number to process repayment
          </p>
        </div>
      )}

      {/* Enhanced Invoice Modal with Success State */}
      {repaymentSuccess && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-xl">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Repayment Completed Successfully!
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Loan ID: {repaymentSuccess.loanId}
              </p>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Amount: ₹{selectedLoan?.loan.totalDue?.toLocaleString()}
              </p>

              <div className="flex flex-col gap-4">
                {/* Success Message with Close Button */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 relative">
                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setRepaymentSuccess(null);
                      setSelectedLoan(null);
                      setSearchTerm("");
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
                <div className="flex justify-center">
                  <InvoiceViewButtons
                    loanObjectId={repaymentSuccess.loanObjectId}
                    loanId={repaymentSuccess.loanId}
                    customerName={repaymentSuccess.customer?.name || "Customer"}
                    billingAvailable={true}
                    repaymentAvailable={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
