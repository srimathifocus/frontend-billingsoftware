import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Users,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle,
} from "lucide-react";
import api from "../utils/api";
import { colors } from "../theme/colors";
import * as XLSX from "xlsx";

interface Transaction {
  _id: string;
  loanId: string;
  customerName: string;
  customerPhone: string;
  type: "billing" | "repayment";
  mode: "cash" | "online";
  amount: number;
  date: string;
  loanAmount?: number;
  interestAmount?: number;
  totalAmount?: number;
  status?: string;
}

interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  billingAmount: number;
  repaymentAmount: number;
  cashAmount: number;
  onlineAmount: number;
  interestEarned: number;
}

const TransactionReportPage = () => {
  const [filterType, setFilterType] = useState<string>("all_time");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [transactionType, setTransactionType] = useState<string>("all");
  const [paymentMode, setPaymentMode] = useState<string>("all");

  // Calculate date ranges based on filter type
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterType) {
      case "all_time":
        return {
          startDate: "", // No start date filter
          endDate: "", // No end date filter
        };
      case "today":
        return {
          startDate: today.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: yesterday.toISOString().split("T")[0],
          endDate: yesterday.toISOString().split("T")[0],
        };
      case "this_week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          startDate: startOfWeek.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
      case "last_week":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        return {
          startDate: lastWeekStart.toISOString().split("T")[0],
          endDate: lastWeekEnd.toISOString().split("T")[0],
        };
      case "this_month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: startOfMonth.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
      case "last_month":
        const lastMonthStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: lastMonthStart.toISOString().split("T")[0],
          endDate: lastMonthEnd.toISOString().split("T")[0],
        };
      case "this_year":
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return {
          startDate: startOfYear.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
      case "last_year":
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
        return {
          startDate: lastYearStart.toISOString().split("T")[0],
          endDate: lastYearEnd.toISOString().split("T")[0],
        };
      case "custom":
        return {
          startDate: customStartDate,
          endDate: customEndDate,
        };
      default:
        return {
          startDate: today.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
    }
  };

  const { startDate, endDate } = getDateRange();

  // Debug: Log the date range
  console.log("Date range:", { filterType, startDate, endDate });

  // Fetch transactions
  const {
    data: transactions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "transaction-report",
      startDate,
      endDate,
      transactionType,
      paymentMode,
    ],
    queryFn: async (): Promise<Transaction[]> => {
      const params = new URLSearchParams();
      // Only add date filters if they exist (not empty for all_time)
      if (startDate && startDate.trim()) params.append("startDate", startDate);
      if (endDate && endDate.trim()) params.append("endDate", endDate);
      if (transactionType !== "all") params.append("type", transactionType);
      if (paymentMode !== "all") params.append("mode", paymentMode);

      // Fetch transactions with filters
      console.log("🔍 Fetching with filters:", params.toString());
      const response = await api.get(`/transactions?${params.toString()}`);
      console.log("📊 Filtered response:", response.data);
      console.log("📊 Filtered count:", response.data.length);

      // Use the filtered data (even if empty - that's what filtering means!)
      const dataToUse = response.data;
      console.log("📊 Using filtered data:", dataToUse.length, "records");

      // Transform the data to match our interface
      const transformedData = dataToUse.map((transaction: any) => ({
        _id: transaction._id,
        loanId: transaction.loanId?.loanId || transaction.loanId || "N/A",
        customerName: transaction.loanId?.customerId?.name || "Unknown",
        customerPhone: transaction.loanId?.customerId?.phone || "N/A",
        type: transaction.type,
        mode: transaction.mode,
        amount: transaction.amount,
        date: transaction.date,
        loanAmount: transaction.loanId?.amount,
        interestAmount: transaction.interestAmount || 0,
        totalAmount: transaction.totalAmount,
        status: transaction.status,
      }));

      console.log("✅ Final transformed data:", transformedData);
      return transformedData;
    },
    enabled: true, // Always enabled, let the API handle empty dates
  });

  // Calculate summary
  const summary: TransactionSummary = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    billingAmount: transactions
      .filter((t) => t.type === "billing")
      .reduce((sum, t) => sum + t.amount, 0),
    repaymentAmount: transactions
      .filter((t) => t.type === "repayment")
      .reduce((sum, t) => sum + t.amount, 0),
    cashAmount: transactions
      .filter((t) => t.mode === "cash")
      .reduce((sum, t) => sum + t.amount, 0),
    onlineAmount: transactions
      .filter((t) => t.mode === "online")
      .reduce((sum, t) => sum + t.amount, 0),
    interestEarned: transactions
      .filter((t) => t.type === "repayment")
      .reduce((sum, t) => sum + (t.interestAmount || 0), 0),
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!transactions.length) {
      toast.error("No data to export");
      return;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["FOCUS PAWN SHOP - TRANSACTION REPORT"],
      [""],
      ["Report Period:", `${startDate} to ${endDate}`],
      ["Generated On:", new Date().toLocaleString()],
      ["Filter Type:", filterType.replace("_", " ").toUpperCase()],
      ["Transaction Type:", transactionType.toUpperCase()],
      ["Payment Mode:", paymentMode.toUpperCase()],
      [""],
      ["SUMMARY"],
      ["Total Transactions:", summary.totalTransactions],
      ["Total Amount:", `₹${summary.totalAmount.toLocaleString()}`],
      ["Billing Amount:", `₹${summary.billingAmount.toLocaleString()}`],
      ["Repayment Amount:", `₹${summary.repaymentAmount.toLocaleString()}`],
      ["Cash Amount:", `₹${summary.cashAmount.toLocaleString()}`],
      ["Online Amount:", `₹${summary.onlineAmount.toLocaleString()}`],
      ["Interest Earned:", `₹${summary.interestEarned.toLocaleString()}`],
    ];

    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

    // Transactions Sheet
    const transactionData = [
      [
        "Date",
        "Loan ID",
        "Customer Name",
        "Phone",
        "Type",
        "Mode",
        "Amount",
        "Interest Amount",
        "Total Amount",
        "Status",
      ],
      ...transactions.map((t) => [
        new Date(t.date).toLocaleDateString(),
        t.loanId,
        t.customerName,
        t.customerPhone,
        t.type.toUpperCase(),
        t.mode.toUpperCase(),
        t.amount,
        t.interestAmount || 0,
        t.totalAmount || t.amount,
        t.status || "COMPLETED",
      ]),
    ];

    const transactionWS = XLSX.utils.aoa_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(wb, transactionWS, "Transactions");

    // Billing Summary Sheet
    const billingTransactions = transactions.filter(
      (t) => t.type === "billing"
    );
    if (billingTransactions.length > 0) {
      const billingData = [
        ["BILLING TRANSACTIONS"],
        [""],
        ["Date", "Loan ID", "Customer Name", "Phone", "Mode", "Amount"],
        ...billingTransactions.map((t) => [
          new Date(t.date).toLocaleDateString(),
          t.loanId,
          t.customerName,
          t.customerPhone,
          t.mode.toUpperCase(),
          t.amount,
        ]),
      ];
      const billingWS = XLSX.utils.aoa_to_sheet(billingData);
      XLSX.utils.book_append_sheet(wb, billingWS, "Billing");
    }

    // Repayment Summary Sheet
    const repaymentTransactions = transactions.filter(
      (t) => t.type === "repayment"
    );
    if (repaymentTransactions.length > 0) {
      const repaymentData = [
        ["REPAYMENT TRANSACTIONS"],
        [""],
        [
          "Date",
          "Loan ID",
          "Customer Name",
          "Phone",
          "Mode",
          "Principal",
          "Interest",
          "Total",
        ],
        ...repaymentTransactions.map((t) => [
          new Date(t.date).toLocaleDateString(),
          t.loanId,
          t.customerName,
          t.customerPhone,
          t.mode.toUpperCase(),
          (t.totalAmount || t.amount) - (t.interestAmount || 0),
          t.interestAmount || 0,
          t.totalAmount || t.amount,
        ]),
      ];
      const repaymentWS = XLSX.utils.aoa_to_sheet(repaymentData);
      XLSX.utils.book_append_sheet(wb, repaymentWS, "Repayments");
    }

    // Save file
    const fileName = `Transaction_Report_${filterType}_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Report exported successfully!");
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "this_week":
        return "This Week";
      case "last_week":
        return "Last Week";
      case "this_month":
        return "This Month";
      case "last_month":
        return "Last Month";
      case "this_year":
        return "This Year";
      case "last_year":
        return "Last Year";
      case "custom":
        return "Custom Range";
      default:
        return "Today";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Transaction Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive transaction analysis and export
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={exportToExcel}
            disabled={!transactions.length}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Time Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Period
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all_time">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction Type
            </label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="billing">Billing Only</option>
              <option value="repayment">Repayment Only</option>
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Modes</option>
              <option value="cash">Cash Only</option>
              <option value="online">Online Only</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {filterType === "custom" && (
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Current Filter Display */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Current Filter:</strong> {getFilterLabel()}
            {startDate && endDate && ` (${startDate} to ${endDate})`}
            {transactionType !== "all" && ` • ${transactionType.toUpperCase()}`}
            {paymentMode !== "all" && ` • ${paymentMode.toUpperCase()}`}
            <span className="ml-2 text-blue-600 dark:text-blue-300">
              • Found {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transactions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totalTransactions}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Amount
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{summary.totalAmount.toLocaleString()}
              </p>
            </div>
            <IndianRupee className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Billing Amount
              </p>
              <p className="text-2xl font-bold text-green-600">
                ₹{summary.billingAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {transactions.filter((t) => t.type === "billing").length}{" "}
                transactions
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Repayment Amount
              </p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{summary.repaymentAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {transactions.filter((t) => t.type === "repayment").length}{" "}
                transactions
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cash Amount
              </p>
              <p className="text-2xl font-bold text-orange-600">
                ₹{summary.cashAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {transactions.filter((t) => t.mode === "cash").length}{" "}
                transactions
              </p>
            </div>
            <Banknote className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Online Amount
              </p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{summary.onlineAmount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {transactions.filter((t) => t.mode === "online").length}{" "}
                transactions
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Interest Earned
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                ₹{summary.interestEarned.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">From repayments</p>
            </div>
            <BarChart3 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Unique Customers
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {new Set(transactions.map((t) => t.customerPhone)).size}
              </p>
              <p className="text-xs text-gray-500">Active customers</p>
            </div>
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transaction Details ({transactions.length} records)
          </h3>
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
                ></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="text-red-500 mb-4">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">Error loading transactions</p>
              <p className="text-sm text-gray-500 mt-1">{error.message}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No transactions found for the selected period
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Try changing the date range or check if there are any loans with
              transactions.
            </p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => {
                  // Reset to show all data
                  setFilterType("all_time");
                  setTransactionType("all");
                  setPaymentMode("all");
                  refetch();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Show All Transactions
              </button>
              <button
                onClick={() => (window.location.href = "/loan-management")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Loan Management
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Interest
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                      {transaction.loanId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.customerName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.customerPhone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === "billing"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {transaction.type === "billing" ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Billing
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Repayment
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.mode === "cash"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                        }`}
                      >
                        {transaction.mode === "cash" ? (
                          <>
                            <Banknote className="h-3 w-3 mr-1" />
                            Cash
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-3 w-3 mr-1" />
                            Online
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₹{transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.interestAmount
                        ? `₹${transaction.interestAmount.toLocaleString()}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionReportPage;
