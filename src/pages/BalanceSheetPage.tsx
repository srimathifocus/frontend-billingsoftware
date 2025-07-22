import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  Users,
  Printer,
  Edit,
  Save,
  X,
} from "lucide-react";
import api from "../utils/api";

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

interface Expense {
  salaries: number;
  rent: number;
  utilities: number;
  miscellaneous: number;
  totalExpenses: number;
}

interface AuditReport {
  month: number;
  year: number;
  balanceSheet: BalanceSheet;
  expenses: Expense;
  netProfit: number;
}

const fetchBalanceSheets = async (): Promise<BalanceSheet[]> => {
  const response = await api.get("/balance-sheet");
  return response.data.data;
};

const fetchAuditReport = async (
  month: number,
  year: number
): Promise<AuditReport> => {
  const response = await api.get(`/balance-sheet/audit/${month}/${year}`);
  return response.data.data;
};

const createOrUpdateBalanceSheet = async (
  data: Partial<BalanceSheet>
): Promise<BalanceSheet> => {
  const response = await api.post("/balance-sheet", data);
  return response.data.data;
};

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

export const BalanceSheetPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BalanceSheet>>({});

  const queryClient = useQueryClient();

  const { data: balanceSheets, isLoading: balanceSheetsLoading } = useQuery({
    queryKey: ["balanceSheets"],
    queryFn: fetchBalanceSheets,
  });

  const { data: auditReport, isLoading: auditReportLoading } = useQuery({
    queryKey: ["auditReport", selectedMonth, selectedYear],
    queryFn: () => fetchAuditReport(selectedMonth, selectedYear),
    enabled: !!selectedMonth && !!selectedYear,
  });

  const updateMutation = useMutation({
    mutationFn: createOrUpdateBalanceSheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balanceSheets"] });
      queryClient.invalidateQueries({
        queryKey: ["auditReport", selectedMonth, selectedYear],
      });
      setIsEditing(false);
      setFormData({});
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(
      auditReport?.balanceSheet || {
        month: selectedMonth,
        year: selectedYear,
        cashInHandBank: 0,
        loanReceivables: 0,
        forfeitedInventory: 0,
        furnitureFixtures: 0,
        customerPayables: 0,
        bankOverdraft: 0,
        ownersEquity: 0,
        interestIncome: 0,
        saleOfForfeitedItems: 0,
      }
    );
  };

  const handleSave = () => {
    updateMutation.mutate({
      ...formData,
      month: selectedMonth,
      year: selectedYear,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleInputChange = (field: keyof BalanceSheet, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const printAuditReport = async () => {
    try {
      // This would generate a PDF report - implement based on your PDF generation logic
      console.log(
        "Printing audit report for",
        monthNames[selectedMonth - 1],
        selectedYear
      );
    } catch (error) {
      console.error("Error printing audit report:", error);
    }
  };

  if (balanceSheetsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Balance Sheet & Audit Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Balance sheet and financial reports for audit purposes
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={printAuditReport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Report</span>
            </button>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Balance Sheet</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{updateMutation.isPending ? "Saving..." : "Save"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Period Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Report Period
        </h3>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Year
            </label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min="2020"
              max="2030"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {auditReportLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : auditReport ? (
        <div className="space-y-6">
          {/* Balance Sheet */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Balance Sheet - {monthNames[selectedMonth - 1]} {selectedYear}
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Assets
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Cash in Hand/Bank:
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.cashInHandBank || 0}
                        onChange={(e) =>
                          handleInputChange(
                            "cashInHandBank",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="font-medium">
                        ₹
                        {auditReport.balanceSheet.cashInHandBank.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Loan Receivables:
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.loanReceivables || 0}
                        onChange={(e) =>
                          handleInputChange(
                            "loanReceivables",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="font-medium">
                        ₹
                        {auditReport.balanceSheet.loanReceivables.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Forfeited Inventory:
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.forfeitedInventory || 0}
                        onChange={(e) =>
                          handleInputChange(
                            "forfeitedInventory",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="font-medium">
                        ₹
                        {auditReport.balanceSheet.forfeitedInventory.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Furniture & Fixtures:
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.furnitureFixtures || 0}
                        onChange={(e) =>
                          handleInputChange(
                            "furnitureFixtures",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="font-medium">
                        ₹
                        {auditReport.balanceSheet.furnitureFixtures.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Assets:</span>
                    <span>
                      ₹{auditReport.balanceSheet.totalAssets.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Liabilities & Equity
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Customer Payables:
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.customerPayables || 0}
                        onChange={(e) =>
                          handleInputChange(
                            "customerPayables",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="font-medium">
                        ₹
                        {auditReport.balanceSheet.customerPayables.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Bank Overdraft:
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.bankOverdraft || 0}
                        onChange={(e) =>
                          handleInputChange(
                            "bankOverdraft",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="font-medium">
                        ₹
                        {auditReport.balanceSheet.bankOverdraft.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Owner's Equity:
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.ownersEquity || 0}
                        onChange={(e) =>
                          handleInputChange(
                            "ownersEquity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="font-medium">
                        ₹
                        {auditReport.balanceSheet.ownersEquity.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Liabilities & Equity:</span>
                    <span>
                      ₹
                      {auditReport.balanceSheet.totalLiabilitiesEquity.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profit & Loss Account */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Profit & Loss Account
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Revenue
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Interest Income:
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.interestIncome || 0}
                        onChange={(e) =>
                          handleInputChange(
                            "interestIncome",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="font-medium">
                        ₹
                        {auditReport.balanceSheet.interestIncome.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Sale of Forfeited Items:
                    </span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.saleOfForfeitedItems || 0}
                        onChange={(e) =>
                          handleInputChange(
                            "saleOfForfeitedItems",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="font-medium">
                        ₹
                        {auditReport.balanceSheet.saleOfForfeitedItems.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Revenue:</span>
                    <span>
                      ₹{auditReport.balanceSheet.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Expenses
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Salaries:
                    </span>
                    <span className="font-medium">
                      ₹{auditReport.expenses.salaries.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Rent:
                    </span>
                    <span className="font-medium">
                      ₹{auditReport.expenses.rent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Utilities:
                    </span>
                    <span className="font-medium">
                      ₹{auditReport.expenses.utilities.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Miscellaneous:
                    </span>
                    <span className="font-medium">
                      ₹{auditReport.expenses.miscellaneous.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Expenses:</span>
                    <span>
                      ₹{auditReport.expenses.totalExpenses.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Net Profit:
                </span>
                <div className="flex items-center space-x-2">
                  {auditReport.netProfit >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <span
                    className={`text-lg font-bold ${
                      auditReport.netProfit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ₹{auditReport.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No data available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No financial data found for {monthNames[selectedMonth - 1]}{" "}
              {selectedYear}. Please add expense and balance sheet data first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
