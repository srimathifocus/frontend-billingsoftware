import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Building,
  Users,
  Target,
  Activity,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import api from "../utils/api";

// Interfaces
interface Expense {
  _id: string;
  month: number;
  year: number;
  salaries: number;
  rent: number;
  utilities: number;
  miscellaneous: number;
  goldAppraiserCharges: number;
  accountingAuditFees: number;
  totalExpenses: number;
  createdAt: string;
  updatedAt: string;
}

interface BalanceSheet {
  _id: string;
  month: number;
  year: number;
  cashInHandBank: number;
  loanReceivables: number;
  forfeitedInventory: number;
  furnitureFixtures: number;
  totalAssets: number;
  customerPayables: number;
  bankOverdraft: number;
  ownersEquity: number;
  totalLiabilitiesEquity: number;
  interestIncome: number;
  saleOfForfeitedItems: number;
  totalRevenue: number;
  netProfit: number;
  createdAt: string;
  updatedAt: string;
}

interface FinanceData {
  _id?: string;
  year: number;
  month: number;
  financialYear: string;
  businessDetails: any;
  profitLoss: {
    revenue: {
      interestIncomeFromLoans: number;
      saleOfForfeitedItems: number;
      otherOperatingIncome: number;
      totalRevenue: number;
    };
    expenses: {
      employeeSalaries: number;
      officeRent: number;
      goldAppraiserCharges: number;
      utilitiesInternet: number;
      accountingAuditFees: number;
      miscellaneousExpenses: number;
      totalExpenses: number;
    };
    netProfitBeforeTax: number;
  };
  balanceSheet: any;
  loanRegisterSummary: any;
  compliance: any;
  auditorObservations: any;
}

// API Functions
const fetchExpenses = async (): Promise<Expense[]> => {
  const response = await api.get("/expenses");
  return response.data.data;
};

const fetchBalanceSheets = async (): Promise<BalanceSheet[]> => {
  const response = await api.get("/balance-sheet");
  return response.data.data;
};

const fetchFinanceData = async (): Promise<FinanceData[]> => {
  const response = await api.get("/finance");
  return response.data.data;
};

const deleteExpense = async (month: number, year: number): Promise<void> => {
  await api.delete(`/expenses/${month}/${year}`);
};

const deleteBalanceSheet = async (
  month: number,
  year: number
): Promise<void> => {
  await api.delete(`/balance-sheet/${month}/${year}`);
};

export const ModernFinanceManagementPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState<
    "overview" | "expenses" | "balancesheet" | "revenue" | "reports"
  >("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "monthly" | "yearly" | "financial"
  >("monthly");

  // Queries
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
    onSuccess: (data) => {
      console.log("📊 Expenses fetched:", data.length, "records");
    },
  });

  const { data: balanceSheets = [], isLoading: balanceSheetsLoading } =
    useQuery({
      queryKey: ["balanceSheets"],
      queryFn: fetchBalanceSheets,
      onSuccess: (data) => {
        console.log("📊 Balance Sheets fetched:", data.length, "records");
      },
    });

  const { data: financeData = [], isLoading: financeLoading } = useQuery({
    queryKey: ["finance"],
    queryFn: fetchFinanceData,
  });

  // Mutations
  const deleteExpenseMutation = useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      deleteExpense(month, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete expense");
    },
  });

  const deleteBalanceSheetMutation = useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      deleteBalanceSheet(month, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balanceSheets"] });
      toast.success("Balance sheet deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete balance sheet");
    },
  });

  // Helper functions
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i
  );

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      monthNames[expense.month - 1]
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      expense.year.toString().includes(searchTerm);

    const matchesYear =
      filterYear === "all" || expense.year.toString() === filterYear;

    return matchesSearch && matchesYear;
  });

  const filteredBalanceSheets = balanceSheets.filter((balanceSheet) => {
    const matchesSearch =
      monthNames[balanceSheet.month - 1]
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      balanceSheet.year.toString().includes(searchTerm);

    const matchesYear =
      filterYear === "all" || balanceSheet.year.toString() === filterYear;

    return matchesSearch && matchesYear;
  });

  // Calculate statistics
  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + exp.totalExpenses,
    0
  );
  const totalRevenue = financeData.reduce(
    (sum, data) => sum + (data.profitLoss?.revenue?.totalRevenue || 0),
    0
  );
  const totalAssets = balanceSheets.reduce(
    (sum, bs) => sum + bs.totalAssets,
    0
  );
  const totalLiabilities = balanceSheets.reduce(
    (sum, bs) => sum + bs.totalLiabilitiesEquity,
    0
  );
  const netProfit = totalRevenue - totalExpenses;
  const averageMonthlyExpense =
    expenses.length > 0 ? totalExpenses / expenses.length : 0;

  const handleDeleteExpense = (expense: Expense) => {
    if (
      window.confirm(
        `Are you sure you want to delete expenses for ${
          monthNames[expense.month - 1]
        } ${expense.year}?`
      )
    ) {
      deleteExpenseMutation.mutate({
        month: expense.month,
        year: expense.year,
      });
    }
  };

  const handleDeleteBalanceSheet = (balanceSheet: BalanceSheet) => {
    if (
      window.confirm(
        `Are you sure you want to delete balance sheet for ${
          monthNames[balanceSheet.month - 1]
        } ${balanceSheet.year}?`
      )
    ) {
      deleteBalanceSheetMutation.mutate({
        month: balanceSheet.month,
        year: balanceSheet.year,
      });
    }
  };

  if (expensesLoading || financeLoading || balanceSheetsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Finance Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive financial overview and expense management
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 min-w-0">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total Expenses
            </p>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              ₹{totalExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 min-w-0">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total Revenue
            </p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              ₹{totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 min-w-0">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Net Profit
            </p>
            <p
              className={`text-sm font-bold ${
                netProfit >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              ₹{netProfit.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 min-w-0">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Avg Monthly Expense
            </p>
            <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
              ₹{Math.round(averageMonthlyExpense).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 min-w-0">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total Assets
            </p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
              ₹{totalAssets.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 min-w-0">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total Liabilities
            </p>
            <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
              ₹{totalLiabilities.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-4 font-medium text-sm ${
              activeTab === "overview"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-6 py-4 font-medium text-sm ${
              activeTab === "expenses"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Expenses ({expenses.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("balancesheet")}
            className={`px-6 py-4 font-medium text-sm ${
              activeTab === "balancesheet"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Balance Sheet ({balanceSheets.length})
            </div>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`px-6 py-4 font-medium text-sm ${
              activeTab === "reports"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Financial Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Monthly Expense Breakdown
                  </h3>
                  <div className="space-y-3">
                    {expenses.slice(0, 5).map((expense) => (
                      <div
                        key={expense._id}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {monthNames[expense.month - 1]} {expense.year}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ₹{expense.totalExpenses.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Expense Categories (Latest Month)
                  </h3>
                  {expenses.length > 0 && (
                    <div className="space-y-3">
                      {[
                        { label: "Salaries", value: expenses[0].salaries },
                        { label: "Rent", value: expenses[0].rent },
                        { label: "Utilities", value: expenses[0].utilities },
                        {
                          label: "Gold Appraiser",
                          value: expenses[0].goldAppraiserCharges,
                        },
                        {
                          label: "Audit Fees",
                          value: expenses[0].accountingAuditFees,
                        },
                        {
                          label: "Miscellaneous",
                          value: expenses[0].miscellaneous,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {item.label}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ₹{item.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Balance Sheet Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Recent Balance Sheets
                  </h3>
                  <div className="space-y-3">
                    {balanceSheets.slice(0, 5).map((balanceSheet) => (
                      <div
                        key={balanceSheet._id}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {monthNames[balanceSheet.month - 1]}{" "}
                          {balanceSheet.year}
                        </span>
                        <div className="text-right">
                          <div className="font-medium text-green-600 dark:text-green-400 text-sm">
                            Assets: ₹{balanceSheet.totalAssets.toLocaleString()}
                          </div>
                          <div className="font-medium text-red-600 dark:text-red-400 text-sm">
                            Liabilities: ₹
                            {balanceSheet.totalLiabilitiesEquity.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {balanceSheets.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No balance sheet data available
                        </p>
                        <button
                          onClick={() => navigate("/admin/balance-sheet")}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Add Balance Sheet
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Asset Breakdown (Latest Month)
                  </h3>
                  {balanceSheets.length > 0 ? (
                    <div className="space-y-3">
                      {[
                        {
                          label: "Cash & Bank",
                          value: balanceSheets[0].cashInHandBank,
                        },
                        {
                          label: "Loan Receivables",
                          value: balanceSheets[0].loanReceivables,
                        },
                        {
                          label: "Forfeited Inventory",
                          value: balanceSheets[0].forfeitedInventory,
                        },
                        {
                          label: "Furniture & Fixtures",
                          value: balanceSheets[0].furnitureFixtures,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {item.label}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ₹{item.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No balance sheet data available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => navigate("/admin/expenses")}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Add Expense
                    </span>
                  </button>
                  <button
                    onClick={() => navigate("/admin/balance-sheet")}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Building className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Add Balance Sheet
                    </span>
                  </button>
                  <button
                    onClick={() => navigate("/tamil-nadu-audit-report")}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Generate Report
                    </span>
                  </button>
                  <button
                    onClick={() => queryClient.invalidateQueries()}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <RefreshCw className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Refresh Data
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "expenses" && (
            <>
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => navigate("/admin/expenses")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Expense
                </button>
              </div>

              {/* Expenses Table */}
              {filteredExpenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Period
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Salaries
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Rent
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Utilities
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Gold Appraiser
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Audit Fees
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Miscellaneous
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Total
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((expense) => (
                        <tr
                          key={expense._id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {monthNames[expense.month - 1]} {expense.year}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            ₹{expense.salaries.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            ₹{expense.rent.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            ₹{expense.utilities.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            ₹
                            {(
                              expense.goldAppraiserCharges || 0
                            ).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            ₹
                            {(
                              expense.accountingAuditFees || 0
                            ).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            ₹{expense.miscellaneous.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                            ₹{expense.totalExpenses.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/expenses?edit=${expense._id}`
                                  )
                                }
                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense)}
                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No expenses found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm || filterYear !== "all"
                      ? "Try adjusting your search or filters"
                      : "Start by adding your first expense record"}
                  </p>
                  <button
                    onClick={() => navigate("/admin/expenses")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Expense
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "balancesheet" && (
            <>
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search balance sheets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => navigate("/admin/balance-sheet")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Balance Sheet
                </button>
              </div>

              {/* Balance Sheet Table */}
              {filteredBalanceSheets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Period
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Cash & Bank
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Loan Receivables
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Forfeited Inventory
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Furniture & Fixtures
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Total Assets
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Total Liabilities
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBalanceSheets.map((balanceSheet) => (
                        <tr
                          key={balanceSheet._id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {monthNames[balanceSheet.month - 1]}{" "}
                                {balanceSheet.year}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            ₹{balanceSheet.cashInHandBank.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            ₹{balanceSheet.loanReceivables.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            ₹{balanceSheet.forfeitedInventory.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            ₹{balanceSheet.furnitureFixtures.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                            ₹{balanceSheet.totalAssets.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-red-600 dark:text-red-400">
                            ₹
                            {balanceSheet.totalLiabilitiesEquity.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/admin/balance-sheet?edit=${balanceSheet._id}`
                                  )
                                }
                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteBalanceSheet(balanceSheet)
                                }
                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No balance sheets found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm || filterYear !== "all"
                      ? "Try adjusting your search or filters"
                      : "Start by adding your first balance sheet record"}
                  </p>
                  <button
                    onClick={() => navigate("/admin/balance-sheet")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Balance Sheet
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Audit Reports
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Generate comprehensive audit reports as per Tamil Nadu norms
                  </p>
                  <button
                    onClick={() => navigate("/tamil-nadu-audit-report")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
