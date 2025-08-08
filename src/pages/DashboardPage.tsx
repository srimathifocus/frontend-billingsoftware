import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CreditCard,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Clock,
  Users,
  Package,
  ArrowRight,
  DollarSign,
  Target,
  Activity,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { DashboardStats } from "../types";
import { colors, themeConfig } from "../theme/colors";

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Fetch pawn shop statistics
    const [loanStats, billingStats, transactionStats] = await Promise.all([
      api.get("/loans/statistics"),
      api.get("/billing/stats"),
      api.get("/transactions/statistics"),
    ]);

    console.log("Pawn shop stats response:", {
      loanStats: loanStats.data,
      billingStats: billingStats.data,
    });

    // Combine stats from different endpoints
    const combinedStats: DashboardStats = {
      totalLoans: loanStats.data.totalLoans || 0,
      activeLoans: loanStats.data.activeLoans || 0,
      repaidLoans: loanStats.data.repaidLoans || 0,
      totalActiveLoanAmount: loanStats.data.totalActiveLoanAmount || 0,
      totalRepaidLoanAmount: loanStats.data.totalRepaidLoanAmount || 0,
      totalCurrentInterest: loanStats.data.totalCurrentInterest || 0,
      todayBillingAmount: billingStats.data.totalLoanAmount || 0,
      todayRepaymentAmount: loanStats.data.todayRepaymentAmount || 0,
      todayLoanAmount: loanStats.data.todayLoanAmount || 0,
      todayProfit: loanStats.data.todayProfit || 0,
      totalItems: transactionStats.data.totalItems || 0,
      pledgedItems: transactionStats.data.pledgedItems || 0,
      availableItems: transactionStats.data.availableItems || 0,
    };

    return combinedStats;
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);

    // If endpoints don't exist, return default stats
    return {
      totalLoans: 0,
      activeLoans: 0,
      repaidLoans: 0,
      totalActiveLoanAmount: 0,
      totalRepaidLoanAmount: 0,
      totalCurrentInterest: 0,
      todayBillingAmount: 0,
      todayRepaymentAmount: 0,
      todayLoanAmount: 0,
      todayProfit: 0,
      totalItems: 0,
      pledgedItems: 0,
      availableItems: 0,
    };
  }
};

export const DashboardPage = () => {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Loading loan management statistics...
            </p>
          </div>
          <Link
            to="/billing/create"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            style={{
              backgroundColor: colors.primary.medium,
              borderRadius: themeConfig.borderRadius,
            }}
          >
            <Plus className="h-5 w-5" />
            <span>Create Billing</span>
          </Link>
        </div>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time Loan Management & Performance Metrics
            </p>
          </div>
          <Link
            to="/billing/create"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            style={{
              backgroundColor: colors.primary.medium,
              borderRadius: themeConfig.borderRadius,
            }}
          >
            <Plus className="h-5 w-5" />
            <span>Create Billing</span>
          </Link>
        </div>
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
            Failed to load dashboard statistics
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

  // Non-repeating essential stats only
  const statCards = [
    {
      title: "Total Active Loans",
      value: stats?.activeLoans || 0,
      icon: Activity,
      color: "blue",
      description: "Currently active loans",
    },
    {
      title: "Total Active Amount",
      value: `₹${(stats?.totalActiveLoanAmount || 0).toLocaleString()}`,
      icon: Banknote,
      color: "green",
      description: "Total principal amount",
    },
    {
      title: "Current Interest",
      value: `₹${(stats?.totalCurrentInterest || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: "red",
      description: "Accumulated interest",
    },
    {
      title: "Total Items",
      value: stats?.totalItems || 0,
      icon: Package,
      color: "gray",
      description: "Items in inventory",
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
      green:
        "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
      red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
      gray: "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time Loan Management & Performance Metrics
          </p>
        </div>
        {/* Billing Button - Opposite side of Dashboard */}
        <Link
          to="/billing/create"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          style={{
            backgroundColor: colors.primary.medium,
            borderRadius: themeConfig.borderRadius,
          }}
        >
          <Plus className="h-5 w-5" />
          <span>Create Billing</span>
        </Link>
      </div>

      {/* Quick Actions - Very Small */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/loans/active"
            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-xs"
          >
            <Banknote className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300">
              View Active Loans
            </span>
          </Link>
          <Link
            to="/repayment"
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-xs"
          >
            <IndianRupee className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            <span className="text-purple-700 dark:text-purple-300">
              Process Repayment
            </span>
          </Link>
          <Link
            to="/transactions"
            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-xs"
          >
            <TrendingUp className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            <span className="text-yellow-700 dark:text-yellow-300">
              View Transactions
            </span>
          </Link>
        </div>
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          const colorClasses = getColorClasses(stat.color);

          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClasses}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                    {stat.title}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Summary - Today & Monthly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            Today's Performance
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Loans Given
              </span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                ₹{(stats?.todayLoanAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Repayments
              </span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                ₹{(stats?.todayRepaymentAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Profit
              </span>
              <span
                className={`text-sm font-semibold ${
                  (stats?.todayProfit || 0) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {(stats?.todayProfit || 0) >= 0 ? "+" : ""}₹
                {(stats?.todayProfit || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            This Month's Performance
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Total Loans
              </span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                ₹
                {(
                  (stats?.totalActiveLoanAmount || 0) +
                  (stats?.totalRepaidLoanAmount || 0)
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Total Repaid
              </span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                ₹{(stats?.totalRepaidLoanAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Total Interest
              </span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                ₹{(stats?.totalCurrentInterest || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Profit Highlight - Real Data Only */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Today's Profit Status
        </h2>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                (stats?.todayProfit || 0) >= 0
                  ? "bg-green-100 dark:bg-green-900/20"
                  : "bg-red-100 dark:bg-red-900/20"
              }`}
            >
              <Target
                className={`h-8 w-8 ${
                  (stats?.todayProfit || 0) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Today's Profit
            </p>
            <p
              className={`text-2xl font-bold ${
                (stats?.todayProfit || 0) >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {(stats?.todayProfit || 0) >= 0 ? "+" : ""}₹
              {(stats?.todayProfit || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Interest earned from repayments
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
