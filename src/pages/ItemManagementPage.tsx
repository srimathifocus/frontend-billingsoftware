import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Package, Plus, Edit, Trash2, Save, X, Tag, Gem } from "lucide-react";
import api from "../utils/api";
import { colors } from "../theme/colors";

interface MasterItem {
  _id: string;
  code: string;
  name: string;
  categories: string[];
  carats: string[];
  createdAt: string;
  updatedAt: string;
}

interface ItemFormData {
  code: string;
  name: string;
  categories: string[];
  carats: string[];
}

// API functions
const fetchMasterItems = async (): Promise<MasterItem[]> => {
  const response = await api.get("/items/master");
  return response.data;
};

const createMasterItem = async (data: ItemFormData): Promise<MasterItem> => {
  const response = await api.post("/items", data);
  return response.data;
};

const updateMasterItem = async ({
  id,
  data,
}: {
  id: string;
  data: ItemFormData;
}): Promise<MasterItem> => {
  const response = await api.put(`/items/${id}`, data);
  return response.data;
};

const deleteMasterItem = async (id: string): Promise<void> => {
  await api.delete(`/items/${id}`);
};

export const ItemManagementPage = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [categoryInput, setCategoryInput] = useState("");
  const [caratInput, setCaratInput] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ItemFormData>({
    defaultValues: {
      code: "",
      name: "",
      categories: [],
      carats: [],
    },
  });

  const watchedCategories = watch("categories");
  const watchedCarats = watch("carats");

  // Queries
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["master-items"],
    queryFn: fetchMasterItems,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createMasterItem,
    onSuccess: () => {
      toast.success("Item created successfully!");
      queryClient.invalidateQueries({ queryKey: ["master-items"] });
      handleCloseForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create item");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMasterItem,
    onSuccess: () => {
      toast.success("Item updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["master-items"] });
      handleCloseForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update item");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMasterItem,
    onSuccess: () => {
      toast.success("Item deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["master-items"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete item");
    },
  });

  // Form handlers
  const handleOpenForm = (item?: MasterItem) => {
    if (item) {
      setEditingItem(item);
      setValue("code", item.code);
      setValue("name", item.name);
      setValue("categories", item.categories);
      setValue("carats", item.carats);
    } else {
      setEditingItem(null);
      reset();
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setCategoryInput("");
    setCaratInput("");
    reset();
  };

  const onSubmit = (data: ItemFormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteMutation.mutate(id);
    }
  };

  // Category and Carat handlers
  const addCategory = () => {
    if (
      categoryInput.trim() &&
      !watchedCategories.includes(categoryInput.trim())
    ) {
      const newCategories = [...watchedCategories, categoryInput.trim()];
      setValue("categories", newCategories);
      setCategoryInput("");
    }
  };

  const removeCategory = (category: string) => {
    const newCategories = watchedCategories.filter((c) => c !== category);
    setValue("categories", newCategories);
  };

  const addCarat = () => {
    if (caratInput.trim() && !watchedCarats.includes(caratInput.trim())) {
      const newCarats = [...watchedCarats, caratInput.trim()];
      setValue("carats", newCarats);
      setCaratInput("");
    }
  };

  const removeCarat = (carat: string) => {
    const newCarats = watchedCarats.filter((c) => c !== carat);
    setValue("carats", newCarats);
  };

  const handleCategoryKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCategory();
    }
  };

  const handleCaratKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCarat();
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Item Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage master items for billing process
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Items List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Loading items...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No items found</p>
            <button
              onClick={() => handleOpenForm()}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Create your first item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Item Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Carats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-wrap gap-1">
                        {item.categories.map((category, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-wrap gap-1">
                        {item.carats.map((carat, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          >
                            {carat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenForm(item)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="text-red-600 hover:text-red-700 p-1 rounded"
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
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingItem ? "Edit Item" : "Add New Item"}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Item Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Item Code *
                  </label>
                  <input
                    type="text"
                    {...register("code", { required: "Item code is required" })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., GD01"
                  />
                  {errors.code && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    {...register("name", { required: "Item name is required" })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., GOLD"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categories *
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      onKeyPress={handleCategoryKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., CHAIN, RING, BANGLES"
                    />
                    <button
                      type="button"
                      onClick={addCategory}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {watchedCategories.map((category, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                      >
                        <Tag className="h-3 w-3" />
                        {category}
                        <button
                          type="button"
                          onClick={() => removeCategory(category)}
                          className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {watchedCategories.length === 0 && (
                    <p className="text-red-500 text-sm mt-1">
                      At least one category is required
                    </p>
                  )}
                </div>

                {/* Carats */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Carats *
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={caratInput}
                      onChange={(e) => setCaratInput(e.target.value)}
                      onKeyPress={handleCaratKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., 14K, 18K, 22K, 24K"
                    />
                    <button
                      type="button"
                      onClick={addCarat}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {watchedCarats.map((carat, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      >
                        <Gem className="h-3 w-3" />
                        {carat}
                        <button
                          type="button"
                          onClick={() => removeCarat(carat)}
                          className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {watchedCarats.length === 0 && (
                    <p className="text-red-500 text-sm mt-1">
                      At least one carat is required
                    </p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending ||
                      updateMutation.isPending ||
                      watchedCategories.length === 0 ||
                      watchedCarats.length === 0
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    {editingItem ? "Update" : "Create"} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
