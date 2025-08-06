import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Building,
  Users,
  FileText,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Save,
} from "lucide-react";
import api from "../utils/api";

// Types
interface ExpenseData {
  rent: number;
  salaries: number;
  utilities: number;
  electricity: number;
  water: number;
  internet: number;
  security: number;
  maintenance: number;
  officeSupplies: number;
  miscellaneous: number;
}

interface IncomeData {
  loanInterest: number;
  serviceCharges: number;
  otherIncome: number;
}

interface BalanceSheetData {
  assets: {
    cash: number;
    loans: number;
    inventory: number;
    equipment: number;
    otherAssets: number;
  };
  liabilities: {
    accountsPayable: number;
    loans: number;
    otherLiabilities: number;
  };
  equity: {
    ownerEquity: number;
    retainedEarnings: number;
  };
}

interface BusinessMetrics {
  totalLoansGiven: number;
  totalRepaymentsReceived: number;
  totalInterestEarned: number;
  totalOperationalCosts: number;
  newCustomers: number;
  activeLoans: number;
}

interface FinanceData {
  _id?: string;
  year: number;
  month: number;
  expenses: ExpenseData;
  income: IncomeData;
  balanceSheet: BalanceSheetData;
  businessMetrics: BusinessMetrics;
  createdAt?: string;
  updatedAt?: string;
}

// API Functions
const createFinanceData = async (
  data: Omit<FinanceData, "_id" | "createdAt" | "updatedAt">
) => {
  const response = await api.post("/finance", data);
  return response.data;
};

const fetchFinanceData = async (): Promise<FinanceData[]> => {
  const response = await api.get("/finance");
  return response.data;
};

const updateFinanceData = async (id: string, data: Partial<FinanceData>) => {
  const response = await api.put(`/finance/${id}`, data);
  return response.data;
};

const deleteFinanceData = async (id: string) => {
  await api.delete(`/finance/${id}`);
};

export const FinanceManagementPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"create" | "view">("view");
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FinanceData>();

  // Query to fetch finance data
  const { data: financeData = [], isLoading } = useQuery({
    queryKey: ["financeData"],
    queryFn: fetchFinanceData,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createFinanceData,
    onSuccess: () => {
      toast.success("Finance data created successfully!");
      queryClient.invalidateQueries({ queryKey: ["financeData"] });
      reset();
      setCurrentStep(1);
      setActiveTab("view");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create finance data"
      );
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FinanceData> }) =>
      updateFinanceData(id, data),
    onSuccess: () => {
      toast.success("Finance data updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["financeData"] });
      setEditingId(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update finance data"
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFinanceData,
    onSuccess: () => {
      toast.success("Finance data deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["financeData"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete finance data"
      );
    },
  });

  const steps = [
    { id: 1, title: "Select Period", icon: Calendar },
    { id: 2, title: "Monthly Expenses", icon: DollarSign },
    { id: 3, title: "Monthly Income", icon: TrendingUp },
    { id: 4, title: "Balance Sheet", icon: FileText },
    { id: 5, title: "Business Metrics", icon: Building },
    { id: 6, title: "Review & Submit", icon: CheckCircle },
  ];

  const months = [
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
    (_, i) => new Date().getFullYear() - i
  );

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: FinanceData) => {
    const submitData = {
      ...data,
      year: selectedYear,
      month: selectedMonth,
    };
    createMutation.mutate(submitData);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const groupedData = financeData.reduce((acc, item) => {
    const year = item.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(item);
    return acc;
  }, {} as Record<number, FinanceData[]>);

  // Sort years in descending order
  const sortedYears = Object.keys(groupedData)
    .map(Number)
    .sort((a, b) => b - a);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Select Time Period
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose the year and month for finance data entry
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Selected Period:</strong> {months[selectedMonth - 1]}{" "}
                  {selectedYear}
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Monthly Expenses
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter all business expenses for {months[selectedMonth - 1]}{" "}
                {selectedYear}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rent
                </label>
                <input
                  type="number"
                  {...register("expenses.rent", {
                    required: "Rent is required",
                    min: 0,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
                {errors.expenses?.rent && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.expenses.rent.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Salaries
                </label>
                <input
                  type="number"
                  {...register("expenses.salaries", {
                    required: "Salaries is required",
                    min: 0,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
                {errors.expenses?.salaries && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.expenses.salaries.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Utilities
                </label>
                <input
                  type="number"
                  {...register("expenses.utilities", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Electricity
                </label>
                <input
                  type="number"
                  {...register("expenses.electricity", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Water
                </label>
                <input
                  type="number"
                  {...register("expenses.water", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Internet
                </label>
                <input
                  type="number"
                  {...register("expenses.internet", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Security
                </label>
                <input
                  type="number"
                  {...register("expenses.security", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maintenance
                </label>
                <input
                  type="number"
                  {...register("expenses.maintenance", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Office Supplies
                </label>
                <input
                  type="number"
                  {...register("expenses.officeSupplies", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Miscellaneous
                </label>
                <input
                  type="number"
                  {...register("expenses.miscellaneous", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Monthly Income
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter all business income for {months[selectedMonth - 1]}{" "}
                {selectedYear}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loan Interest Income
                </label>
                <input
                  type="number"
                  {...register("income.loanInterest", {
                    required: "Loan interest is required",
                    min: 0,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
                {errors.income?.loanInterest && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.income.loanInterest.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Charges
                </label>
                <input
                  type="number"
                  {...register("income.serviceCharges", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Other Income
                </label>
                <input
                  type="number"
                  {...register("income.otherIncome", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Balance Sheet Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter balance sheet information for {months[selectedMonth - 1]}{" "}
                {selectedYear}
              </p>
            </div>

            <div className="space-y-8">
              {/* Assets */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  Assets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cash
                    </label>
                    <input
                      type="number"
                      {...register("balanceSheet.assets.cash", {
                        required: "Cash is required",
                        min: 0,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Loans Outstanding
                    </label>
                    <input
                      type="number"
                      {...register("balanceSheet.assets.loans", { min: 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inventory (Jewelry)
                    </label>
                    <input
                      type="number"
                      {...register("balanceSheet.assets.inventory", { min: 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Equipment
                    </label>
                    <input
                      type="number"
                      {...register("balanceSheet.assets.equipment", { min: 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Other Assets
                    </label>
                    <input
                      type="number"
                      {...register("balanceSheet.assets.otherAssets", {
                        min: 0,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Liabilities */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 text-red-600 mr-2" />
                  Liabilities
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Accounts Payable
                    </label>
                    <input
                      type="number"
                      {...register("balanceSheet.liabilities.accountsPayable", {
                        min: 0,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Loans Payable
                    </label>
                    <input
                      type="number"
                      {...register("balanceSheet.liabilities.loans", {
                        min: 0,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Other Liabilities
                    </label>
                    <input
                      type="number"
                      {...register(
                        "balanceSheet.liabilities.otherLiabilities",
                        { min: 0 }
                      )}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Equity */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Building className="h-5 w-5 text-blue-600 mr-2" />
                  Equity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Owner Equity
                    </label>
                    <input
                      type="number"
                      {...register("balanceSheet.equity.ownerEquity", {
                        min: 0,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Retained Earnings
                    </label>
                    <input
                      type="number"
                      {...register("balanceSheet.equity.retainedEarnings", {
                        min: 0,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Business Metrics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter key business metrics for {months[selectedMonth - 1]}{" "}
                {selectedYear}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Loans Given
                </label>
                <input
                  type="number"
                  {...register("businessMetrics.totalLoansGiven", {
                    required: "Total loans given is required",
                    min: 0,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
                {errors.businessMetrics?.totalLoansGiven && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.businessMetrics.totalLoansGiven.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Repayments Received
                </label>
                <input
                  type="number"
                  {...register("businessMetrics.totalRepaymentsReceived", {
                    required: "Total repayments is required",
                    min: 0,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
                {errors.businessMetrics?.totalRepaymentsReceived && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.businessMetrics.totalRepaymentsReceived.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Interest Earned
                </label>
                <input
                  type="number"
                  {...register("businessMetrics.totalInterestEarned", {
                    required: "Interest earned is required",
                    min: 0,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
                {errors.businessMetrics?.totalInterestEarned && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.businessMetrics.totalInterestEarned.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Operational Costs
                </label>
                <input
                  type="number"
                  {...register("businessMetrics.totalOperationalCosts", {
                    required: "Operational costs is required",
                    min: 0,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
                {errors.businessMetrics?.totalOperationalCosts && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.businessMetrics.totalOperationalCosts.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Customers
                </label>
                <input
                  type="number"
                  {...register("businessMetrics.newCustomers", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Active Loans
                </label>
                <input
                  type="number"
                  {...register("businessMetrics.activeLoans", { min: 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        const formData = watch();
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Review & Submit
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Review your finance data for {months[selectedMonth - 1]}{" "}
                {selectedYear}
              </p>
            </div>

            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                    Total Expenses
                  </h4>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(
                      (formData.expenses?.rent || 0) +
                        (formData.expenses?.salaries || 0) +
                        (formData.expenses?.utilities || 0) +
                        (formData.expenses?.electricity || 0) +
                        (formData.expenses?.water || 0) +
                        (formData.expenses?.internet || 0) +
                        (formData.expenses?.security || 0) +
                        (formData.expenses?.maintenance || 0) +
                        (formData.expenses?.officeSupplies || 0) +
                        (formData.expenses?.miscellaneous || 0)
                    )}
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                    Total Income
                  </h4>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      (formData.income?.loanInterest || 0) +
                        (formData.income?.serviceCharges || 0) +
                        (formData.income?.otherIncome || 0)
                    )}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Total Assets
                  </h4>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(
                      (formData.balanceSheet?.assets?.cash || 0) +
                        (formData.balanceSheet?.assets?.loans || 0) +
                        (formData.balanceSheet?.assets?.inventory || 0) +
                        (formData.balanceSheet?.assets?.equipment || 0) +
                        (formData.balanceSheet?.assets?.otherAssets || 0)
                    )}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                  <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Net Profit
                  </h4>
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(
                      (formData.income?.loanInterest || 0) +
                        (formData.income?.serviceCharges || 0) +
                        (formData.income?.otherIncome || 0) -
                        ((formData.expenses?.rent || 0) +
                          (formData.expenses?.salaries || 0) +
                          (formData.expenses?.utilities || 0) +
                          (formData.expenses?.electricity || 0) +
                          (formData.expenses?.water || 0) +
                          (formData.expenses?.internet || 0) +
                          (formData.expenses?.security || 0) +
                          (formData.expenses?.maintenance || 0) +
                          (formData.expenses?.officeSupplies || 0) +
                          (formData.expenses?.miscellaneous || 0))
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Business Metrics Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Loans Given:
                    </span>
                    <span className="ml-2 font-medium">
                      {formData.businessMetrics?.totalLoansGiven || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Repayments:
                    </span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(
                        formData.businessMetrics?.totalRepaymentsReceived || 0
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Interest Earned:
                    </span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(
                        formData.businessMetrics?.totalInterestEarned || 0
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Operational Costs:
                    </span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(
                        formData.businessMetrics?.totalOperationalCosts || 0
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      New Customers:
                    </span>
                    <span className="ml-2 font-medium">
                      {formData.businessMetrics?.newCustomers || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Active Loans:
                    </span>
                    <span className="ml-2 font-medium">
                      {formData.businessMetrics?.activeLoans || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
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
            Create and manage financial data for your pawn shop
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("view")}
            className={`px-6 py-4 font-medium text-sm ${
              activeTab === "view"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              View Finance Data ({financeData.length})
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab("create");
              setCurrentStep(1);
              reset();
            }}
            className={`px-6 py-4 font-medium text-sm ${
              activeTab === "create"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Finance Data
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "view" ? (
            <>
              {/* View Finance Data */}
              {financeData.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Finance Data Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Get started by creating your first finance entry
                  </p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Finance Data
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedYears.map((year) => (
                    <div
                      key={year}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-t-lg">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Year {year} ({groupedData[year].length} entries)
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {groupedData[year]
                          .sort((a, b) => b.month - a.month)
                          .map((item) => (
                            <div key={item._id} className="p-4">
                              <button
                                onClick={() => toggleExpanded(item._id!)}
                                className="w-full flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {months[item.month - 1]} {item.year}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Net Profit:{" "}
                                      {formatCurrency(
                                        item.income.loanInterest +
                                          item.income.serviceCharges +
                                          item.income.otherIncome -
                                          (item.expenses.rent +
                                            item.expenses.salaries +
                                            item.expenses.utilities +
                                            item.expenses.electricity +
                                            item.expenses.water +
                                            item.expenses.internet +
                                            item.expenses.security +
                                            item.expenses.maintenance +
                                            item.expenses.officeSupplies +
                                            item.expenses.miscellaneous)
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Handle edit
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (
                                        confirm(
                                          "Are you sure you want to delete this finance data?"
                                        )
                                      ) {
                                        deleteMutation.mutate(item._id!);
                                      }
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                  {expandedItems.has(item._id!) ? (
                                    <ChevronUp className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  )}
                                </div>
                              </button>

                              {expandedItems.has(item._id!) && (
                                <div className="mt-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Summary Cards */}
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                                      <h5 className="text-sm font-medium text-red-800 dark:text-red-300">
                                        Total Expenses
                                      </h5>
                                      <p className="text-lg font-bold text-red-600">
                                        {formatCurrency(
                                          item.expenses.rent +
                                            item.expenses.salaries +
                                            item.expenses.utilities +
                                            item.expenses.electricity +
                                            item.expenses.water +
                                            item.expenses.internet +
                                            item.expenses.security +
                                            item.expenses.maintenance +
                                            item.expenses.officeSupplies +
                                            item.expenses.miscellaneous
                                        )}
                                      </p>
                                    </div>

                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                      <h5 className="text-sm font-medium text-green-800 dark:text-green-300">
                                        Total Income
                                      </h5>
                                      <p className="text-lg font-bold text-green-600">
                                        {formatCurrency(
                                          item.income.loanInterest +
                                            item.income.serviceCharges +
                                            item.income.otherIncome
                                        )}
                                      </p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                      <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                        Total Assets
                                      </h5>
                                      <p className="text-lg font-bold text-blue-600">
                                        {formatCurrency(
                                          item.balanceSheet.assets.cash +
                                            item.balanceSheet.assets.loans +
                                            item.balanceSheet.assets.inventory +
                                            item.balanceSheet.assets.equipment +
                                            item.balanceSheet.assets.otherAssets
                                        )}
                                      </p>
                                    </div>

                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                                      <h5 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                                        Business Metrics
                                      </h5>
                                      <p className="text-sm text-purple-600">
                                        Loans:{" "}
                                        {item.businessMetrics.totalLoansGiven}
                                        <br />
                                        Interest:{" "}
                                        {formatCurrency(
                                          item.businessMetrics
                                            .totalInterestEarned
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Detailed breakdown can be added here */}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Create Finance Data - Step-by-step Wizard */}
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Progress Steps */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-center">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            currentStep >= step.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {currentStep > step.id ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <step.icon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="ml-2 hidden sm:block">
                          <p
                            className={`text-sm font-medium ${
                              currentStep >= step.id
                                ? "text-blue-600"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {step.title}
                          </p>
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className={`flex-1 h-px mx-4 ${
                              currentStep > step.id
                                ? "bg-blue-600"
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">{renderStepContent()}</div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {createMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Finance Data
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
