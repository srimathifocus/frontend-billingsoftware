import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  IndianRupee,
  Calendar,
  Clock,
  Package,
  Eye,
  AlertCircle,
  CheckCircle,
  Receipt,
} from "lucide-react";
import api from "../utils/api";
import { Loan, Customer, Item } from "../types";
import { colors } from "../theme/colors";

const fetchLoanById = async (id: string): Promise<Loan> => {
  const response = await api.get(`/loans/${id}`);
  return response.data;
};

export const LoanDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: loan,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["loan-detail", id],
    queryFn: () => fetchLoanById(id!),
    enabled: !!id,
    refetchInterval: 20000, // Auto-refresh every 20 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Loan Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Loading loan details...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Loan Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View loan information
            </p>
          </div>
        </div>
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
            Failed to load loan details
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error instanceof Error ? error.message : "Loan not found"}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const customer = loan.customerId as Customer;
  const items = loan.itemIds as Item[];
  const isActive = loan.status === "active";
  const daysPassed = loan.daysPassed || 0;
  const currentInterest = loan.currentInterest || 0;
  const totalDue = loan.totalDue || loan.amount;

  const getStatusColor = (status: string) => {
    if (status === "active") {
      if (daysPassed > 180)
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
      if (daysPassed > 120)
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
      return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20";
    }
    return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
  };

  const getStatusLabel = (status: string) => {
    if (status === "active") {
      if (daysPassed > 180) return "Overdue";
      if (daysPassed > 120) return "Due Soon";
      return "Active";
    }
    return "Completed";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Loan Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Loan ID: {loan.loanId}
          </p>
        </div>
        <div className="flex gap-2">
          {isActive && (
            <Link
              to={`/repayment/${loan.loanId}`}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <IndianRupee className="h-4 w-4" />
              Make Payment
            </Link>
          )}
        </div>
      </div>

      {/* Loan Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Loan Status
          </h2>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
              loan.status
            )}`}
          >
            {getStatusLabel(loan.status)}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Principal Amount
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              ₹{loan.amount.toLocaleString()}
            </p>
          </div>
          {isActive ? (
            <>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current Interest
                </p>
                <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  ₹{currentInterest.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Due
                </p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  ₹{totalDue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Days Passed
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {daysPassed} days
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Interest Paid
                </p>
                <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  ₹{currentInterest.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Repaid
                </p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  ₹{totalDue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Duration
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {daysPassed} days
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Customer Information
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {customer.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="font-semibold text-gray-900 dark:text-white">
                  {customer.phone}
                </p>
              </div>
            </div>
            {customer.address && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Address
                </p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {typeof customer.address === "string"
                      ? customer.address
                      : `${customer.address.doorNo}, ${customer.address.street}, ${customer.address.town}, ${customer.address.district} - ${customer.address.pincode}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loan Terms */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Loan Terms
            </h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Interest Rate
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {loan.interestPercent}% {loan.interestType}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Validity
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {loan.validity} months
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loan Date
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(loan.loanDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cash Payment
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  ₹{(loan.payment?.cash || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Online Payment
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  ₹{(loan.payment?.online || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pledged Items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Pledged Items ({items?.length || 0})
          </h2>
        </div>
        {items && items.length > 0 ? (
          <div className="grid gap-4">
            {items.map((item, index) => (
              <div
                key={item._id || index}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Name
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Category
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Weight
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.weight}g
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Estimated Value
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₹{item.estimatedValue?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No items found</p>
          </div>
        )}
      </div>

      {/* Repayment Details (for completed loans) */}
      {!isActive && loan.repaymentDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Repayment Details
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Repayment Date
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(
                  loan.repaymentDetails.dateRepaid
                ).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Amount
              </p>
              <p className="font-semibold text-green-600 dark:text-green-400">
                ₹{loan.repaymentDetails.totalAmount?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cash Payment
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                ₹{(loan.repaymentDetails.payment?.cash || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Online Payment
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                ₹{(loan.repaymentDetails.payment?.online || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
