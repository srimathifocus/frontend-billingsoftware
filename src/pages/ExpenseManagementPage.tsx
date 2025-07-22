import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  IndianRupee,
} from "lucide-react";
import api from "../utils/api";

interface Expense {
  _id: string;
  month: number;
  year: number;
  salaries: number;
  rent: number;
  utilities: number;
  miscellaneous: number;
  totalExpenses: number;
  createdAt: string;
  updatedAt: string;
}

const fetchExpenses = async (): Promise<Expense[]> => {
  const response = await api.get("/expenses");
  return response.data.data;
};

const createOrUpdateExpense = async (
  data: Partial<Expense>
): Promise<Expense> => {
  const response = await api.post("/expenses", data);
  return response.data.data;
};

const deleteExpense = async (month: number, year: number): Promise<void> => {
  await api.delete(`/expenses/${month}/${year}`);
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

export const ExpenseManagementPage = () => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Expense>>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    salaries: undefined,
    rent: undefined,
    utilities: undefined,
    miscellaneous: undefined,
  });

  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
  });

  const createMutation = useMutation({
    mutationFn: createOrUpdateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setIsAddingNew(false);
      setEditingExpense(null);
      setFormData({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        salaries: undefined,
        rent: undefined,
        utilities: undefined,
        miscellaneous: undefined,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      deleteExpense(month, year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const handleAddNew = () => {
    setIsAddingNew(true);
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      salaries: undefined,
      rent: undefined,
      utilities: undefined,
      miscellaneous: undefined,
    });
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense._id);
    setFormData(expense);
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingExpense(null);
    setFormData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      salaries: undefined,
      rent: undefined,
      utilities: undefined,
      miscellaneous: undefined,
    });
  };

  const handleSave = () => {
    // Convert undefined values to 0 before sending to API
    const dataToSave = {
      ...formData,
      salaries: formData.salaries || 0,
      rent: formData.rent || 0,
      utilities: formData.utilities || 0,
      miscellaneous: formData.miscellaneous || 0,
    };
    createMutation.mutate(dataToSave);
  };

  const handleDelete = (expense: Expense) => {
    if (
      window.confirm(
        `Are you sure you want to delete expenses for ${
          monthNames[expense.month - 1]
        } ${expense.year}?`
      )
    ) {
      deleteMutation.mutate({ month: expense.month, year: expense.year });
    }
  };

  const handleInputChange = (field: keyof Expense, value: string | number) => {
    // For numeric fields, if the value is empty string or NaN, set to undefined
    if (
      field === "salaries" ||
      field === "rent" ||
      field === "utilities" ||
      field === "miscellaneous"
    ) {
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      setFormData((prev) => ({
        ...prev,
        [field]: isNaN(numValue) || value === "" ? undefined : numValue,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Expense Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track monthly expenses for audit reports
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingExpense) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {isAddingNew ? "Add New Expense" : "Edit Expense"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Month
              </label>
              <select
                value={formData.month || 1}
                onChange={(e) =>
                  handleInputChange("month", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                value={formData.year || new Date().getFullYear()}
                onChange={(e) =>
                  handleInputChange("year", parseInt(e.target.value))
                }
                min="2020"
                max="2030"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Salaries (₹)
              </label>
              <input
                type="number"
                value={formData.salaries !== undefined ? formData.salaries : ""}
                onChange={(e) => handleInputChange("salaries", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rent (₹)
              </label>
              <input
                type="number"
                value={formData.rent !== undefined ? formData.rent : ""}
                onChange={(e) => handleInputChange("rent", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Utilities (₹)
              </label>
              <input
                type="number"
                value={
                  formData.utilities !== undefined ? formData.utilities : ""
                }
                onChange={(e) => handleInputChange("utilities", e.target.value)}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Miscellaneous (₹)
              </label>
              <input
                type="number"
                value={
                  formData.miscellaneous !== undefined
                    ? formData.miscellaneous
                    : ""
                }
                onChange={(e) =>
                  handleInputChange("miscellaneous", e.target.value)
                }
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={createMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{createMutation.isPending ? "Saving..." : "Save"}</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Expenses
          </h3>

          {expenses && expenses.length > 0 ? (
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
                  {expenses.map((expense) => (
                    <tr
                      key={expense._id}
                      className="border-b border-gray-100 dark:border-gray-700"
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
                        ₹{expense.miscellaneous.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                        ₹{expense.totalExpenses.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No expenses recorded
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start by adding your first monthly expense record.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
