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
      inactiveLoans: loanStats.data.inactiveLoans || 0,
      totalActiveLoanAmount: loanStats.data.totalActiveLoanAmount || 0,
      totalInactiveLoanAmount: loanStats.data.totalInactiveLoanAmount || 0,
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
      inactiveLoans: 0,
      totalActiveLoanAmount: 0,
      totalInactiveLoanAmount: 0,
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Loading loan management statistics...
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
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time Loan Management & Performance Metrics
            </p>
          </div>
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

  const statCards = [
    {
      title: "Today's Loans Given",
      value: `₹${(stats?.todayLoanAmount || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "blue",
      description: "Total amount of loans disbursed today",
    },
    {
      title: "Today's Loan Repayment",
      value: `₹${(stats?.todayRepaymentAmount || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "green",
      description: "Total repayments received today",
    },
    {
      title: "Today's Profit",
      value: `₹${(stats?.todayProfit || 0).toLocaleString()}`,
      icon: Target,
      color: (stats?.todayProfit || 0) >= 0 ? "green" : "red",
      description: "Interest earned from repayments",
    },
    {
      title: "Total Active Loans",
      value: stats?.activeLoans || 0,
      icon: Activity,
      color: "blue",
      description: "Number of currently active loans",
    },
    // {
    //   title: "Total Active Loan Amount",
    //   value: `₹${(stats?.totalActiveLoanAmount || 0).toLocaleString()}`,
    //   icon: Banknote,
    //   color: "green",
    //   description: "Total principal amount of active loans",
    // },
    // {
    //   title: "Current Interest",
    //   value: `₹${(stats?.totalCurrentInterest || 0).toLocaleString()}`,
    //   icon: IndianRupee,
    //   color: "red",
    //   description: "Total accumulated interest on active loans",
    // },
    // {
    //   title: "This Month's Profit",
    //   value: `₹${(stats?.monthlyProfit || 0).toLocaleString()}`,
    //   icon: TrendingUp,
    //   color: (stats?.monthlyProfit || 0) >= 0 ? "green" : "red",
    //   description: "Total interest earned this month",
    // },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time Loan Management & Performance Metrics
            {/* (Auto-refreshing
            every 10 seconds) */}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/billing/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Create Billing
          </Link>
        </div>
      </div>

      {/* Stats Grid - 7 Cards in Same Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          const colorClasses = getColorClasses(stat.color);

          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 h-[200px]"
            >
              <div className="h-full flex flex-col">
                {/* Header with Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colorClasses}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {stat.title}
                </h3>

                {/* Value */}
                <div className="flex-1 flex items-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>

                {/* Description */}
                {stat.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {stat.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Today's Performance Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Loans Given */}
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
              Loans Given
            </p>
            <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
              ₹{(stats?.todayLoanAmount || 0).toLocaleString()}
            </p>
          </div>

          {/* Repayments Received */}
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
              Repayments Received
            </p>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">
              ₹{(stats?.todayRepaymentAmount || 0).toLocaleString()}
            </p>
          </div>

          {/* Net Profit/Loss */}
          <div
            className={`text-center p-4 rounded-lg ${
              (stats?.todayProfit || 0) >= 0
                ? "bg-green-50 dark:bg-green-900/20"
                : "bg-red-50 dark:bg-red-900/20"
            }`}
          >
            <Target
              className={`h-6 w-6 mx-auto mb-2 ${
                (stats?.todayProfit || 0) >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            />
            <p
              className={`text-sm font-medium mb-1 ${
                (stats?.todayProfit || 0) >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              Net Profit/Loss
            </p>
            <p
              className={`text-xl font-bold ${
                (stats?.todayProfit || 0) >= 0
                  ? "text-green-900 dark:text-green-100"
                  : "text-red-900 dark:text-red-100"
              }`}
            >
              {(stats?.todayProfit || 0) >= 0 ? "+" : ""}₹
              {(stats?.todayProfit || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Interest Earned
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Performance Summary */}
      {/* <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          This Month's Performance Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
              Loans Given
            </p>
            <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
              ₹{(stats?.monthlyLoanAmount || 0).toLocaleString()}
            </p>
          </div>

     
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
              Repayments Received
            </p>
            <p className="text-xl font-bold text-green-900 dark:text-green-100">
              ₹{(stats?.monthlyRepaymentAmount || 0).toLocaleString()}
            </p>
          </div>

          <div
            className={`text-center p-4 rounded-lg ${
              (stats?.monthlyProfit || 0) >= 0
                ? "bg-green-50 dark:bg-green-900/20"
                : "bg-red-50 dark:bg-red-900/20"
            }`}
          >
            <Target
              className={`h-6 w-6 mx-auto mb-2 ${
                (stats?.monthlyProfit || 0) >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            />
            <p
              className={`text-sm font-medium mb-1 ${
                (stats?.monthlyProfit || 0) >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              Total Profit
            </p>
            <p
              className={`text-xl font-bold ${
                (stats?.monthlyProfit || 0) >= 0
                  ? "text-green-900 dark:text-green-100"
                  : "text-red-900 dark:text-red-100"
              }`}
            >
              {(stats?.monthlyProfit || 0) >= 0 ? "+" : ""}₹
              {(stats?.monthlyProfit || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Interest Earned
            </p>
          </div>
        </div>
      </div> */}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/billing/create"
            className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-100">
              Create Billing
            </span>
          </Link>
          <Link
            to="/loans/active"
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-900 dark:text-green-100">
              View Active Loans
            </span>
          </Link>
          <Link
            to="/repayment"
            className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <IndianRupee className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-900 dark:text-purple-100">
              Process Repayment
            </span>
          </Link>
          <Link
            to="/transactions"
            className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium text-yellow-900 dark:text-yellow-100">
              View Transactions
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
