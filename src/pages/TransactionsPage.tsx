import { useState } from "react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  CreditCard,
  Banknote,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import api from "../utils/api";
import { Transaction, TransactionSummary, GroupedTransaction } from "../types";
import { colors, themeConfig } from "../theme/colors";

const fetchTransactions = async (filters: {
  type?: string;
  mode?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Transaction[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const response = await api.get(`/transactions?${params.toString()}`);
  return response.data;
};

const fetchTransactionSummary = async (filters: {
  startDate?: string;
  endDate?: string;
}): Promise<TransactionSummary> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const response = await api.get(`/transactions/summary?${params.toString()}`);
  return response.data;
};

// Group transactions by loan ID and type
const groupTransactions = (
  transactions: Transaction[]
): GroupedTransaction[] => {
  const grouped = transactions.reduce((acc, transaction) => {
    const loan = transaction.loanId as any;
    const key = `${loan?.loanId || "N/A"}-${transaction.type}`;

    if (!acc[key]) {
      acc[key] = {
        _id: key,
        loanId: loan?.loanId || "N/A",
        type: transaction.type,
        date: transaction.date,
        totalAmount: 0,
        customer: {
          name: loan?.customerId?.name || "N/A",
          phone: loan?.customerId?.phone || "",
        },
        paymentMethods: [],
      };
    }

    acc[key].totalAmount += transaction.amount;
    acc[key].paymentMethods.push({
      mode: transaction.mode,
      amount: transaction.amount,
      transactionId: transaction._id || "",
    });

    // Keep the latest transaction date
    if (new Date(transaction.date) > new Date(acc[key].date)) {
      acc[key].date = transaction.date;
    }

    return acc;
  }, {} as Record<string, GroupedTransaction>);

  return Object.values(grouped).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const TransactionsPage = () => {
  const [filters, setFilters] = useState({
    type: "",
    mode: "",
    startDate: "",
    endDate: "",
  });

  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(
    new Set()
  );

  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactions(filters),
    refetchInterval: 15000, // Auto-refresh every 15 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: [
      "transaction-summary",
      { startDate: filters.startDate, endDate: filters.endDate },
    ],
    queryFn: () =>
      fetchTransactionSummary({
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      mode: "",
      startDate: "",
      endDate: "",
    });
  };

  // Group transactions for display
  const groupedTransactions = transactions
    ? groupTransactions(transactions)
    : [];

  const toggleExpand = (transactionId: string) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const getTransactionIcon = (type: string, mode: string) => {
    if (type === "billing") {
      return mode === "cash" ? Banknote : CreditCard;
    }
    return mode === "cash" ? Banknote : CreditCard;
  };

  const getTransactionColor = (type: string) => {
    return type === "billing" ? "text-green-600" : "text-blue-600";
  };

  const getTransactionBg = (type: string) => {
    return type === "billing"
      ? "bg-green-50 dark:bg-green-900/20"
      : "bg-blue-50 dark:bg-blue-900/20";
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Transactions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all transactions
            </p>
          </div>
        </div>
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
            Failed to load transactions
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
            Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all transactions ({groupedTransactions?.length || 0}{" "}
            grouped records, {transactions?.length || 0} total) -
            {/* Auto-refreshing every 15 seconds */}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : summary && summary.billing && summary.repayment ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Billing
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹{(summary.billing?.total || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {summary.billing?.count || 0} transactions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Repayment
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹{(summary.repayment?.total || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {summary.repayment?.count || 0} transactions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Banknote className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Cash
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹
                  {(
                    (summary.billing?.breakdown?.cash?.amount || 0) +
                    (summary.repayment?.breakdown?.cash?.amount || 0)
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(summary.billing?.breakdown?.cash?.count || 0) +
                    (summary.repayment?.breakdown?.cash?.count || 0)}{" "}
                  transactions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Online
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹
                  {(
                    (summary.billing?.breakdown?.online?.amount || 0) +
                    (summary.repayment?.breakdown?.online?.amount || 0)
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(summary.billing?.breakdown?.online?.count || 0) +
                    (summary.repayment?.breakdown?.online?.count || 0)}{" "}
                  transactions
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No transaction data available
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filters
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transaction Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="billing">Billing</option>
              <option value="repayment">Repayment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Mode
            </label>
            <select
              value={filters.mode}
              onChange={(e) => handleFilterChange("mode", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Modes</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : groupedTransactions && groupedTransactions.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Payment Methods
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {groupedTransactions.map((groupedTransaction) => {
                  const isExpanded = expandedTransactions.has(
                    groupedTransaction._id
                  );
                  const hasMultiplePayments =
                    groupedTransaction.paymentMethods.length > 1;

                  return (
                    <>
                      {/* Main Transaction Row */}
                      <tr
                        key={groupedTransaction._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasMultiplePayments && (
                            <button
                              onClick={() =>
                                toggleExpand(groupedTransaction._id)
                              }
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(groupedTransaction.date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1 rounded ${getTransactionBg(
                                groupedTransaction.type
                              )}`}
                            >
                              {groupedTransaction.type === "billing" ? (
                                <TrendingUp
                                  className={`h-4 w-4 ${getTransactionColor(
                                    groupedTransaction.type
                                  )}`}
                                />
                              ) : (
                                <TrendingDown
                                  className={`h-4 w-4 ${getTransactionColor(
                                    groupedTransaction.type
                                  )}`}
                                />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {groupedTransaction.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {groupedTransaction.loanId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {groupedTransaction.customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasMultiplePayments ? (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {groupedTransaction.paymentMethods.length} methods
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(
                                groupedTransaction.type,
                                groupedTransaction.paymentMethods[0].mode
                              ) &&
                                React.createElement(
                                  getTransactionIcon(
                                    groupedTransaction.type,
                                    groupedTransaction.paymentMethods[0].mode
                                  ),
                                  { className: "h-4 w-4 text-gray-400" }
                                )}
                              <span className="text-sm text-gray-900 dark:text-white capitalize">
                                {groupedTransaction.paymentMethods[0].mode}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          ₹{groupedTransaction.totalAmount.toLocaleString()}
                        </td>
                      </tr>

                      {/* Expanded Payment Methods */}
                      {isExpanded &&
                        hasMultiplePayments &&
                        groupedTransaction.paymentMethods.map(
                          (method, index) => (
                            <tr
                              key={`${groupedTransaction._id}-${method.transactionId}`}
                              className="bg-gray-50 dark:bg-gray-700/50"
                            >
                              <td className="px-6 py-2"></td>
                              <td className="px-6 py-2"></td>
                              <td className="px-6 py-2"></td>
                              <td className="px-6 py-2"></td>
                              <td className="px-6 py-2"></td>
                              <td className="px-6 py-2 whitespace-nowrap">
                                <div className="flex items-center gap-2 pl-4">
                                  {React.createElement(
                                    getTransactionIcon(
                                      groupedTransaction.type,
                                      method.mode
                                    ),
                                    { className: "h-4 w-4 text-gray-400" }
                                  )}
                                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                                    {method.mode}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                ₹{method.amount.toLocaleString()}
                              </td>
                            </tr>
                          )
                        )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No transactions found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or date range
          </p>
        </div>
      )}
    </div>
  );
};
