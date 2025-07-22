import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Search,
  Clock,
  User,
  Phone,
  IndianRupee,
  Calendar,
  Filter,
  Eye,
  AlertCircle,
} from "lucide-react";
import api from "../utils/api";
import { Loan, Customer } from "../types";
import { colors, themeConfig } from "../theme/colors";

const fetchActiveLoans = async (): Promise<Loan[]> => {
  const response = await api.get("/loans/active");
  return response.data;
};

const searchLoansByPhone = async (phone: string): Promise<Loan[]> => {
  const response = await api.get(`/loans/search/${phone}`);
  return response.data;
};

export const ActiveLoansPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "high-interest" | "expiring"
  >("all");

  const {
    data: loans,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["active-loans"],
    queryFn: fetchActiveLoans,
    refetchInterval: 15000, // Auto-refresh every 15 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ["search-loans", searchTerm],
    queryFn: () => searchLoansByPhone(searchTerm),
    enabled: searchTerm.length >= 10, // Only search when phone number is complete
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the query above
  };

  // Use search results if searching, otherwise use all loans
  const displayLoans = searchTerm.length >= 10 ? searchResults : loans;

  const filteredLoans =
    displayLoans?.filter((loan) => {
      if (filterBy === "all") return true;
      if (filterBy === "high-interest")
        return (loan.currentInterest || 0) > 5000;
      if (filterBy === "expiring") return (loan.daysPassed || 0) > 150; // 5 months
      return true;
    }) || [];

  const getStatusColor = (daysPassed: number = 0) => {
    if (daysPassed > 180)
      return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
    if (daysPassed > 120)
      return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
    return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
  };

  const getStatusLabel = (daysPassed: number = 0) => {
    if (daysPassed > 180) return "Overdue";
    if (daysPassed > 120) return "Due Soon";
    return "Current";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Active Loans
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Loading active loans...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Active Loans
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage active loans and track payments
            </p>
          </div>
        </div>
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
            Failed to load active loans
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Active Loans
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage active loans and track payments ({filteredLoans.length}{" "}
            loans) 
            {/* - Auto-refreshing every 15 seconds */}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by phone number, loan ID, or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Loans</option>
              <option value="high-interest">High Interest (₹5000+)</option>
              <option value="expiring">Expiring Soon</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loans List */}
      {filteredLoans.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No active loans found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There are no active loans at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLoans.map((loan) => {
            const customer = loan.customerId as Customer;
            const daysPassed = loan.daysPassed || 0;
            const currentInterest = loan.currentInterest || 0;
            const totalDue = loan.totalDue || loan.amount;

            return (
              <div
                key={loan.loanId}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {customer.name}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {loan.loanId}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            daysPassed
                          )}`}
                        >
                          {getStatusLabel(daysPassed)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Principal Amount
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ₹{loan.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Current Interest
                        </p>
                        <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                          ₹{currentInterest.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total Due
                        </p>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          ₹{totalDue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Days Passed
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {daysPassed} days
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Rate: {loan.interestPercent}% {loan.interestType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Validity: {loan.validity} months</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-32">
                    <Link
                      to={`/repayment/${loan.loanId}`}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <IndianRupee className="h-4 w-4" />
                      Pay
                    </Link>
                    <Link
                      to={`/loans/${loan.loanId}`}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
