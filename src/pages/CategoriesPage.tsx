import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Tag,
  BarChart3,
} from "lucide-react";
import api from "../utils/api";
import { Category, Subcategory, Product, CategoryStats } from "../types";
import { colors, themeConfig } from "../theme/colors";
import { useSmartRefresh } from "../hooks/useSmartRefresh";

const fetchCategories = async (): Promise<Category[]> => {
  try {
    console.log("Fetching categories...");
    const response = await api.get("/categories");

    // Log the response for debugging
    console.log("Categories API response:", response);

    // Check if response.data exists
    if (!response.data) {
      console.error("Categories API returned empty response");
      return [];
    }

    // Ensure we always return an array, even if the API returns something unexpected
    if (Array.isArray(response.data)) {
      console.log(`Successfully fetched ${response.data.length} categories`);
      return response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      // Some APIs wrap the data in a data property
      console.log(
        `Successfully fetched ${response.data.data.length} categories from nested data property`
      );
      return response.data.data;
    } else {
      console.error("Categories API did not return an array:", response.data);
      toast.error("Categories data format is invalid. Please contact support.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    toast.error("Failed to load categories. Please try refreshing the page.");
    return [];
  }
};

const fetchSubcategories = async (): Promise<Subcategory[]> => {
  try {
    console.log("Fetching subcategories...");
    const response = await api.get("/subcategories");

    // Log the response for debugging
    console.log("Subcategories API response:", response);

    // Check if response.data exists
    if (!response.data) {
      console.error("Subcategories API returned empty response");
      return [];
    }

    // Ensure we always return an array, even if the API returns something unexpected
    if (Array.isArray(response.data)) {
      console.log(`Successfully fetched ${response.data.length} subcategories`);
      return response.data;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      // Some APIs wrap the data in a data property
      console.log(
        `Successfully fetched ${response.data.data.length} subcategories from nested data property`
      );
      return response.data.data;
    } else {
      console.error(
        "Subcategories API did not return an array:",
        response.data
      );
      toast.error(
        "Subcategories data format is invalid. Please contact support."
      );
      return [];
    }
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    toast.error(
      "Failed to load subcategories. Please try refreshing the page."
    );
    return [];
  }
};

const fetchProducts = async (): Promise<Product[]> => {
  try {
    console.log("Fetching products...");
    // Add a large limit to get all products for the categories page
    const response = await api.get("/products?limit=1000");

    // Log the response for debugging
    console.log("Products API response:", response);

    // Check if response.data exists
    if (!response.data) {
      console.error("Products API returned empty response");
      return [];
    }

    // Handle the specific response structure from our backend
    if (response.data.products && Array.isArray(response.data.products)) {
      console.log(
        `Successfully fetched ${response.data.products.length} products`
      );
      return response.data.products;
    }
    // Fallback for direct array response (if API changes in future)
    else if (Array.isArray(response.data)) {
      console.log(`Successfully fetched ${response.data.length} products`);
      return response.data;
    }
    // Fallback for other nested data structures
    else if (response.data.data && Array.isArray(response.data.data)) {
      console.log(
        `Successfully fetched ${response.data.data.length} products from nested data property`
      );
      return response.data.data;
    } else {
      console.error(
        "Products API did not return an expected format:",
        response.data
      );
      toast.error("Products data format is invalid. Please contact support.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    toast.error("Failed to load products. Please try refreshing the page.");
    return [];
  }
};

const fetchCategoryStats = async (): Promise<CategoryStats> => {
  try {
    console.log("Fetching category statistics...");
    const response = await api.get("/products/stats/categories");

    // Log the response for debugging
    console.log("Category stats API response:", response);

    // Check if response.data exists
    if (!response.data) {
      console.error("Category stats API returned empty response");
      return {
        totalProducts: 0,
        categoryCounts: [],
        subcategoryCounts: [],
      };
    }

    // Validate the response structure
    if (
      typeof response.data.totalProducts === "number" &&
      Array.isArray(response.data.categoryCounts) &&
      Array.isArray(response.data.subcategoryCounts)
    ) {
      console.log(
        `Successfully fetched category stats - Total products: ${response.data.totalProducts}, Categories: ${response.data.categoryCounts.length}, Subcategories: ${response.data.subcategoryCounts.length}`
      );
      return response.data;
    } else {
      console.error(
        "Category stats API did not return expected format:",
        response.data
      );
      toast.error(
        "Category stats data format is invalid. Please contact support."
      );
      return {
        totalProducts: 0,
        categoryCounts: [],
        subcategoryCounts: [],
      };
    }
  } catch (error) {
    console.error("Error fetching category stats:", error);
    toast.error(
      "Failed to load category statistics. Please try refreshing the page."
    );
    return {
      totalProducts: 0,
      categoryCounts: [],
      subcategoryCounts: [],
    };
  }
};

export const CategoriesPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateSubcategoryModalOpen, setIsCreateSubcategoryModalOpen] =
    useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] =
    useState<Subcategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"categories" | "subcategories">(
    "categories"
  );
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get data first with safe defaults
  const {
    data: categories = [], // Provide empty array as default value
    isLoading: categoriesLoading,
    refetch: refetchCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer stale time
    initialData: [], // Initialize with empty array if data is undefined
  });

  const {
    data: subcategories = [], // Provide empty array as default value
    isLoading: subcategoriesLoading,
    refetch: refetchSubcategories,
    error: subcategoriesError,
  } = useQuery({
    queryKey: ["subcategories"],
    queryFn: fetchSubcategories,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer stale time
    initialData: [], // Initialize with empty array if data is undefined
  });

  const {
    data: products = [], // Provide empty array as default value
    isLoading: productsLoading,
    refetch: refetchProducts,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes for products (they change less frequently)
    initialData: [], // Initialize with empty array if data is undefined
  });

  const {
    data: categoryStats = {
      totalProducts: 0,
      categoryCounts: [],
      subcategoryCounts: [],
    },
    isLoading: categoryStatsLoading,
    refetch: refetchCategoryStats,
    error: categoryStatsError,
  } = useQuery({
    queryKey: ["categoryStats"],
    queryFn: fetchCategoryStats,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: {
      totalProducts: 0,
      categoryCounts: [],
      subcategoryCounts: [],
    },
  });

  // Silent component mount
  useEffect(() => {
    // Let React Query handle the initial fetch based on staleTime
  }, []);

  // Handle URL query parameters and location state
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const state = location.state as { action?: string } | null;

    // Check if we should show subcategories view
    if (searchParams.get("view") === "subcategories") {
      setViewMode("subcategories");
      // Expand all categories to show subcategories
      if (Array.isArray(categories) && categories.length > 0) {
        try {
          setExpandedCategories(categories.map((cat) => cat._id));
        } catch (error) {
          console.error("Error expanding categories:", error);
        }
      }
    } else {
      setViewMode("categories");
    }

    // Check if we should open the create subcategory modal
    if (searchParams.get("create") === "subcategory") {
      setIsCreateSubcategoryModalOpen(true);
      // Clear the URL parameter after opening the modal
      navigate("/categories", { replace: true });
    }

    // Check if we should open the create category modal from state
    if (state?.action === "create-category") {
      setIsCreateModalOpen(true);
      // Clear the state after opening the modal
      navigate("/categories", { replace: true, state: {} });
    }
  }, [location.search, location.state, categories, navigate]);

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      try {
        const response = await api.post("/categories", { name });
        return response.data;
      } catch (error) {
        console.error("Error creating category:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Only invalidate what's actually affected
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryStats"] });

      toast.success("Category created successfully!");
      setIsCreateModalOpen(false);
      setCategoryName("");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to create category";
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      try {
        const response = await api.put(`/categories/${id}`, { name });
        return response.data;
      } catch (error) {
        console.error("Error updating category:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Only invalidate what's actually affected
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryStats"] });

      toast.success("Category updated successfully!");
      setEditingCategory(null);
      setCategoryName("");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update category";
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/categories/${id}`);
      } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // When deleting a category, need to refresh all related data
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryStats"] });

      toast.success("Category deleted successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to delete category";
      toast.error(errorMessage);
    },
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: async ({
      name,
      categoryId,
    }: {
      name: string;
      categoryId: string;
    }) => {
      try {
        const response = await api.post("/subcategories", { name, categoryId });
        return response.data;
      } catch (error) {
        console.error("Error creating subcategory:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch all related data
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryStats"] });

      toast.success("Subcategory created successfully!");
      setIsCreateSubcategoryModalOpen(false);
      setSubcategoryName("");
      setSelectedCategoryId("");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to create subcategory";
      toast.error(errorMessage);
    },
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      try {
        // Get the categoryId from the editing subcategory
        let categoryId;
        if (editingSubcategory) {
          categoryId =
            typeof editingSubcategory.categoryId === "object" &&
            editingSubcategory.categoryId !== null
              ? editingSubcategory.categoryId._id
              : editingSubcategory.categoryId;
        }

        const response = await api.put(`/subcategories/${id}`, {
          name,
          categoryId, // Include the categoryId in the update
        });
        return response.data;
      } catch (error) {
        console.error("Error updating subcategory:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch all related data
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryStats"] });

      toast.success("Subcategory updated successfully!");
      setEditingSubcategory(null);
      setSubcategoryName("");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to update subcategory";
      toast.error(errorMessage);
    },
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/subcategories/${id}`);
      } catch (error) {
        console.error("Error deleting subcategory:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch all related data
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categoryStats"] });

      toast.success("Subcategory deleted successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to delete subcategory";
      toast.error(errorMessage);
    },
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getSubcategoriesForCategory = (categoryId: string) => {
    // Ensure subcategories is an array before filtering
    if (!Array.isArray(subcategories)) {
      console.warn("Subcategories is not an array:", subcategories);
      return [];
    }

    return subcategories.filter((sub) => {
      try {
        const subCategoryId =
          typeof sub.categoryId === "object" && sub.categoryId !== null
            ? sub.categoryId._id
            : sub.categoryId;
        return subCategoryId === categoryId;
      } catch (error) {
        console.error("Error processing subcategory:", sub, error);
        return false;
      }
    });
  };

  const getProductsForCategory = (categoryId: string) => {
    // Ensure products is an array before filtering
    if (!Array.isArray(products)) {
      console.warn("Products is not an array:", products);
      return [];
    }
    return products.filter((product) => product.categoryId === categoryId);
  };

  const getProductsForSubcategory = (subcategoryId: string) => {
    // Ensure products is an array before filtering
    if (!Array.isArray(products)) {
      console.warn("Products is not an array:", products);
      return [];
    }
    return products.filter(
      (product) => product.subcategoryId === subcategoryId
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    createMutation.mutate(categoryName.trim());
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !editingCategory) {
      toast.error("Category name is required");
      return;
    }
    updateMutation.mutate({
      id: editingCategory._id,
      name: categoryName.trim(),
    });
  };

  const handleDelete = (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      deleteMutation.mutate(category._id);
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
  };

  const startEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryName(subcategory.name);
  };

  const handleCreateSubcategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcategoryName.trim() || !selectedCategoryId) {
      toast.error("Subcategory name and category are required");
      return;
    }
    createSubcategoryMutation.mutate({
      name: subcategoryName.trim(),
      categoryId: selectedCategoryId,
    });
  };

  const handleUpdateSubcategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcategoryName.trim() || !editingSubcategory) {
      toast.error("Subcategory name is required");
      return;
    }
    updateSubcategoryMutation.mutate({
      id: editingSubcategory._id,
      name: subcategoryName.trim(),
    });
  };

  const handleDeleteSubcategory = (subcategory: Subcategory) => {
    if (
      window.confirm(`Are you sure you want to delete "${subcategory.name}"?`)
    ) {
      deleteSubcategoryMutation.mutate(subcategory._id);
    }
  };

  const startCreateSubcategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setIsCreateSubcategoryModalOpen(true);
  };

  // Function to refresh all data manually (only when user clicks refresh button)
  const refreshAllData = async () => {
    try {
      toast.info("Refreshing data...");
      await smartRefresh();
      toast.success("Data refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh data. Please try again.");
    }
  };

  // Use smart refresh strategy similar to e-commerce sites
  const { smartRefresh } = useSmartRefresh({
    queryKeys: [
      ["categories"],
      ["subcategories"],
      ["categoryStats"],
      ["products"],
    ],
    staleTime: 5 * 60 * 1000, // 5 minutes
    backgroundRefreshInterval: 20 * 60 * 1000, // 20 minutes
    onlyWhenStale: true,
  });

  // Show loading state only for initial data loading
  // This prevents unnecessary loading screens during refetches
  if (
    (categoriesLoading && (!categories || categories.length === 0)) ||
    (subcategoriesLoading && (!subcategories || subcategories.length === 0)) ||
    (categoryStatsLoading &&
      (!categoryStats || categoryStats.categoryCounts.length === 0))
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Mobile-Optimized Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
            {viewMode === "subcategories"
              ? "Subcategories Management"
              : "Categories Management"}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {viewMode === "subcategories"
              ? "Manage all subcategories across different categories"
              : "Organize your products with categories and subcategories"}
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <button
            onClick={refreshAllData}
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 w-full sm:w-auto"
            style={{ borderRadius: themeConfig.borderRadius }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">Refresh Data</span>
            <span className="sm:hidden">Refresh</span>
          </button>
          {viewMode === "categories" ? (
            <>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white font-medium hover:shadow-md transition-all w-full sm:w-auto"
                style={{
                  backgroundColor: colors.primary.medium,
                  borderRadius: themeConfig.borderRadius,
                }}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Create Category</span>
                <span className="sm:hidden">Category</span>
              </button>
              <button
                onClick={() => setIsCreateSubcategoryModalOpen(true)}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all w-full sm:w-auto"
                style={{ borderRadius: themeConfig.borderRadius }}
              >
                <Tag size={18} />
                <span className="hidden sm:inline">Create Subcategory</span>
                <span className="sm:hidden">Subcategory</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCreateSubcategoryModalOpen(true)}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white font-medium hover:shadow-md transition-all w-full sm:w-auto"
              style={{
                backgroundColor: colors.primary.medium,
                borderRadius: themeConfig.borderRadius,
              }}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Create Subcategory</span>
              <span className="sm:hidden">Create</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile-Optimized View Mode Toggle */}
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
        <button
          onClick={() => setViewMode("categories")}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            viewMode === "categories"
              ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          style={{ borderRadius: themeConfig.borderRadius }}
        >
          <span className="hidden sm:inline">Categories View</span>
          <span className="sm:hidden">Categories</span>
        </button>
        <button
          onClick={() => setViewMode("subcategories")}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            viewMode === "subcategories"
              ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          style={{ borderRadius: themeConfig.borderRadius }}
        >
          <span className="hidden sm:inline">Subcategories View</span>
          <span className="sm:hidden">Subcategories</span>
        </button>
      </div>

      {/* Mobile-Optimized Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div
          className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          style={{ borderRadius: themeConfig.borderRadius }}
        >
          <h3 className="text-sm sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Categories
          </h3>
          <div className="flex items-center">
            <FolderTree size={20} className="text-blue-500 mr-2 sm:mr-3" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {categoryStats.categoryCounts.length}
            </span>
          </div>
        </div>

        <div
          className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          style={{ borderRadius: themeConfig.borderRadius }}
        >
          <h3 className="text-sm sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Subcategories
          </h3>
          <div className="flex items-center">
            <Tag size={20} className="text-green-500 mr-2 sm:mr-3" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {categoryStats.subcategoryCounts.length}
            </span>
          </div>
        </div>

        <div
          className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 sm:col-span-2 lg:col-span-1"
          style={{ borderRadius: themeConfig.borderRadius }}
        >
          <h3 className="text-sm sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Products
          </h3>
          <div className="flex items-center">
            <BarChart3 size={20} className="text-purple-500 mr-2 sm:mr-3" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {categoryStats.totalProducts}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Overview - Mobile Optimized */}
      {categoryStats.categoryCounts.length > 0 && (
        <div
          className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6"
          style={{ borderRadius: themeConfig.borderRadius }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
            Quick Stats Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-2 sm:p-0">
              <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {categoryStats.categoryCounts.reduce(
                  (sum, cat) => sum + cat.directProducts,
                  0
                )}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Direct Products
              </div>
            </div>
            <div className="text-center p-2 sm:p-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {categoryStats.categoryCounts.reduce(
                  (sum, cat) => sum + cat.subcategoryProducts,
                  0
                )}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                In Subcategories
              </div>
            </div>
            <div className="text-center p-2 sm:p-0">
              <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {categoryStats.categoryCounts.length > 0
                  ? Math.round(
                      categoryStats.totalProducts /
                        categoryStats.categoryCounts.length
                    )
                  : 0}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Avg per Category
              </div>
            </div>
            <div className="text-center p-2 sm:p-0">
              <div className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {categoryStats.subcategoryCounts.length > 0
                  ? Math.round(
                      categoryStats.categoryCounts.reduce(
                        (sum, cat) => sum + cat.subcategoryProducts,
                        0
                      ) / categoryStats.subcategoryCounts.length
                    )
                  : 0}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Avg per Subcategory
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle for Detailed Stats - Mobile Optimized */}
      <div className="flex justify-center mb-4 sm:mb-6">
        <button
          onClick={() => setShowDetailedStats(!showDetailedStats)}
          className="flex items-center px-3 sm:px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
          style={{ borderRadius: themeConfig.borderRadius }}
        >
          {showDetailedStats ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline">
                Hide Detailed Product Statistics
              </span>
              <span className="sm:hidden">Hide Details</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline">
                Show Detailed Product Statistics
              </span>
              <span className="sm:hidden">Show Details</span>
            </>
          )}
        </button>
      </div>

      {showDetailedStats && (
        <>
          {/* Detailed Product Distribution by Category - Mobile Optimized */}
          <div
            className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6"
            style={{ borderRadius: themeConfig.borderRadius }}
          >
            <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
              Product Distribution by Category
            </h3>

            {/* Mobile Cards View (visible on small screens) */}
            <div className="block sm:hidden space-y-3">
              {categoryStats.categoryCounts.map((categoryCount) => {
                const percentage =
                  categoryStats.totalProducts > 0
                    ? (
                        (categoryCount.totalProducts /
                          categoryStats.totalProducts) *
                        100
                      ).toFixed(1)
                    : "0";

                return (
                  <div
                    key={categoryCount.categoryId}
                    className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {categoryCount.categoryName}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Direct:
                        </span>
                        <span className="ml-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-blue-600 dark:text-blue-300 font-medium">
                          {categoryCount.directProducts}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Subcategory:
                        </span>
                        <span className="ml-1 px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-green-600 dark:text-green-300 font-medium">
                          {categoryCount.subcategoryProducts}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Total:
                        </span>
                        <span className="ml-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded text-purple-600 dark:text-purple-300 font-medium">
                          {categoryCount.totalProducts}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Percentage:
                        </span>
                        <span className="ml-1 font-medium">{percentage}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (hidden on small screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Direct Products
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Subcategory Products
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Total Products
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {categoryStats.categoryCounts.map((categoryCount) => {
                    const percentage =
                      categoryStats.totalProducts > 0
                        ? (
                            (categoryCount.totalProducts /
                              categoryStats.totalProducts) *
                            100
                          ).toFixed(1)
                        : "0";

                    return (
                      <tr
                        key={categoryCount.categoryId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {categoryCount.categoryName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-md text-blue-600 dark:text-blue-300 font-medium">
                            {categoryCount.directProducts}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded-md text-green-600 dark:text-green-300 font-medium">
                            {categoryCount.subcategoryProducts}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded-md text-purple-600 dark:text-purple-300 font-medium">
                            {categoryCount.totalProducts}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Product Distribution by Subcategory - Mobile Optimized */}
          <div
            className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6"
            style={{ borderRadius: themeConfig.borderRadius }}
          >
            <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
              Product Distribution by Subcategory
            </h3>

            {/* Mobile Cards View (visible on small screens) */}
            <div className="block sm:hidden space-y-3">
              {categoryStats.subcategoryCounts.map((subcategoryCount) => {
                // Find the category count for percentage calculation
                const parentCategoryCount = categoryStats.categoryCounts.find(
                  (catCount) =>
                    catCount.categoryId === subcategoryCount.categoryId
                );

                const percentOfCategory =
                  parentCategoryCount && parentCategoryCount.totalProducts > 0
                    ? (
                        (subcategoryCount.productCount /
                          parentCategoryCount.totalProducts) *
                        100
                      ).toFixed(1)
                    : "0";
                const percentOfTotal =
                  categoryStats.totalProducts > 0
                    ? (
                        (subcategoryCount.productCount /
                          categoryStats.totalProducts) *
                        100
                      ).toFixed(1)
                    : "0";

                return (
                  <div
                    key={subcategoryCount.subcategoryId}
                    className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {subcategoryCount.subcategoryName}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Parent: {subcategoryCount.categoryName}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Products:
                        </span>
                        <span className="ml-1 px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-green-600 dark:text-green-300 font-medium">
                          {subcategoryCount.productCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          % of Category:
                        </span>
                        <span className="ml-1 font-medium">
                          {percentOfCategory}%
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">
                          % of Total:
                        </span>
                        <span className="ml-1 font-medium">
                          {percentOfTotal}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (hidden on small screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Subcategory
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Parent Category
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Products
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      % of Category
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {categoryStats.subcategoryCounts.map((subcategoryCount) => {
                    // Find the category count for percentage calculation
                    const parentCategoryCount =
                      categoryStats.categoryCounts.find(
                        (catCount) =>
                          catCount.categoryId === subcategoryCount.categoryId
                      );

                    const percentOfCategory =
                      parentCategoryCount &&
                      parentCategoryCount.totalProducts > 0
                        ? (
                            (subcategoryCount.productCount /
                              parentCategoryCount.totalProducts) *
                            100
                          ).toFixed(1)
                        : "0";
                    const percentOfTotal =
                      categoryStats.totalProducts > 0
                        ? (
                            (subcategoryCount.productCount /
                              categoryStats.totalProducts) *
                            100
                          ).toFixed(1)
                        : "0";

                    return (
                      <tr
                        key={subcategoryCount.subcategoryId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {subcategoryCount.subcategoryName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {subcategoryCount.categoryName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded-md text-green-600 dark:text-green-300 font-medium">
                            {subcategoryCount.productCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {percentOfCategory}%
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {percentOfTotal}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Content based on view mode - Mobile Optimized */}
      {viewMode === "categories" ? (
        /* Categories List - Mobile Optimized */
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          style={{
            borderRadius: themeConfig.borderRadius,
          }}
        >
          {!Array.isArray(categories) || categories.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <FolderTree
                size={40}
                className="mx-auto text-gray-400 mb-3 sm:mb-4"
              />
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                No categories found. Create your first category to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories.map((category) => {
                const categorySubcategories = getSubcategoriesForCategory(
                  category._id
                );
                const categoryProducts = getProductsForCategory(category._id);
                // Get category stats from API
                const categoryStats_count = categoryStats.categoryCounts.find(
                  (count) => count.categoryId === category._id
                );
                const categoryProductCount =
                  categoryStats_count?.totalProducts || 0;
                const isExpanded = expandedCategories.includes(category._id);

                return (
                  <div key={category._id} className="p-3 sm:p-4">
                    {/* Category Row - Mobile Optimized */}
                    <div className="flex items-start sm:items-center justify-between">
                      <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <button
                          onClick={() => toggleCategory(category._id)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-0.5 sm:mt-0 flex-shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate">
                            {category.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className="flex items-center space-x-1">
                              <Tag size={12} />
                              <span>
                                {categorySubcategories.length} subcategories
                              </span>
                            </span>
                            <span className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-md w-fit">
                              <BarChart3
                                size={12}
                                className="text-blue-600 dark:text-blue-300"
                              />
                              <span className="font-medium text-blue-600 dark:text-blue-300">
                                {categoryProductCount} products
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={() => startCreateSubcategory(category._id)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Add Subcategory"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => startEdit(category)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories - Mobile Optimized */}
                    {isExpanded && categorySubcategories.length > 0 && (
                      <div className="mt-3 sm:mt-4 ml-4 sm:ml-8 space-y-2">
                        {categorySubcategories.map((subcategory) => {
                          // Get subcategory stats from API
                          const subcategoryStats_count =
                            categoryStats.subcategoryCounts.find(
                              (count) => count.subcategoryId === subcategory._id
                            );
                          const subcategoryProductCount =
                            subcategoryStats_count?.productCount || 0;
                          return (
                            <div
                              key={subcategory._id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2 sm:space-y-0"
                              style={{ borderRadius: themeConfig.borderRadius }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium truncate">
                                  {subcategory.name}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  <span className="flex items-center space-x-1 bg-green-100 dark:bg-green-900 px-2 py-1 rounded-md w-fit">
                                    <BarChart3
                                      size={10}
                                      className="text-green-600 dark:text-green-300"
                                    />
                                    <span className="font-medium text-green-600 dark:text-green-300">
                                      {subcategoryProductCount} products
                                    </span>
                                  </span>
                                  <span className="hidden sm:inline">
                                    Created:{" "}
                                    {new Date(
                                      subcategory.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 self-end sm:self-center">
                                <button
                                  onClick={() =>
                                    startEditSubcategory(subcategory)
                                  }
                                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteSubcategory(subcategory)
                                  }
                                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isExpanded && categorySubcategories.length === 0 && (
                      <div className="mt-3 sm:mt-4 ml-4 sm:ml-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        No subcategories yet
                      </div>
                    )}

                    {/* Product Count Summary - Mobile Optimized */}
                    {isExpanded && categoryProducts.length > 0 && (
                      <div
                        className="mt-3 sm:mt-4 ml-4 sm:ml-8 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        style={{ borderRadius: themeConfig.borderRadius }}
                      >
                        <h4 className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <BarChart3 size={14} className="mr-2 text-blue-500" />
                          Product Count Summary
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">
                              Direct in category:
                            </span>
                            <span className="ml-1 sm:ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-blue-600 dark:text-blue-300">
                              {
                                categoryProducts.filter((p) => !p.subcategoryId)
                                  .length
                              }
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">
                              In subcategories:
                            </span>
                            <span className="ml-1 sm:ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900 rounded text-green-600 dark:text-green-300">
                              {
                                categoryProducts.filter((p) => p.subcategoryId)
                                  .length
                              }
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 sm:col-span-2">
                            <span className="font-medium">Total products:</span>
                            <span className="ml-1 sm:ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900 rounded text-purple-600 dark:text-purple-300">
                              {categoryProducts.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Subcategories List View - Mobile Optimized */
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          style={{
            borderRadius: themeConfig.borderRadius,
          }}
        >
          {!Array.isArray(subcategories) || subcategories.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <Tag size={40} className="mx-auto text-gray-400 mb-3 sm:mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                No subcategories found. Create your first subcategory to get
                started.
              </p>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {subcategories.map((subcategory) => {
                  const subcategoryProducts = getProductsForSubcategory(
                    subcategory._id
                  );

                  // Get subcategory stats from API with proper error handling
                  const subcategoryStats_count =
                    categoryStats.subcategoryCounts.find(
                      (count) => count.subcategoryId === subcategory._id
                    );
                  const subcategoryProductCount =
                    subcategoryStats_count?.productCount ||
                    subcategoryProducts.length;

                  // Get category name with error handling
                  let categoryName = "Unknown Category";
                  try {
                    if (
                      typeof subcategory.categoryId === "object" &&
                      subcategory.categoryId !== null &&
                      subcategory.categoryId.name
                    ) {
                      categoryName = subcategory.categoryId.name;
                    } else if (Array.isArray(categories)) {
                      const foundCategory = categories.find(
                        (cat) => cat._id === subcategory.categoryId
                      );
                      if (foundCategory && foundCategory.name) {
                        categoryName = foundCategory.name;
                      }
                    }
                  } catch (error) {
                    console.error("Error getting category name:", error);
                  }

                  return (
                    <div
                      key={subcategory._id}
                      className="flex flex-col p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                      style={{ borderRadius: themeConfig.borderRadius }}
                    >
                      <div className="flex items-start sm:items-center justify-between mb-2">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate pr-2">
                          {subcategory.name}
                        </h3>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            onClick={() => startEditSubcategory(subcategory)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubcategory(subcategory)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <span className="inline-flex items-center px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-md text-xs">
                          <FolderTree size={10} className="mr-1" />
                          {categoryName}
                        </span>
                      </div>

                      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-600 rounded-md">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product Statistics:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900 px-2 py-1 rounded-md">
                            <BarChart3
                              size={10}
                              className="text-green-600 dark:text-green-300"
                            />
                            <span className="text-xs font-medium text-green-600 dark:text-green-300">
                              {subcategoryProductCount} products
                            </span>
                          </div>
                          {subcategoryProductCount > 0 &&
                            categoryStats.totalProducts > 0 && (
                              <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-md">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                                  {(
                                    (subcategoryProductCount /
                                      categoryStats.totalProducts) *
                                    100
                                  ).toFixed(1)}
                                  % of total
                                </span>
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span className="hidden sm:inline">
                          Created:{" "}
                          {new Date(subcategory.createdAt).toLocaleDateString()}
                        </span>
                        <span className="sm:hidden">
                          {new Date(subcategory.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal - Mobile Optimized */}
      {(isCreateModalOpen || editingCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full mx-2 sm:mx-0"
            style={{
              borderRadius: themeConfig.borderRadius,
            }}
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
              {editingCategory ? "Edit Category" : "Create Category"}
            </h3>

            <form
              onSubmit={
                editingCategory ? handleUpdateSubmit : handleCreateSubmit
              }
            >
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                    style={{ borderRadius: themeConfig.borderRadius }}
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingCategory(null);
                      setCategoryName("");
                    }}
                    className="w-full sm:flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
                    style={{ borderRadius: themeConfig.borderRadius }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="w-full sm:flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-all text-sm sm:text-base"
                    style={{
                      backgroundColor: colors.primary.medium,
                      borderRadius: themeConfig.borderRadius,
                    }}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingCategory
                      ? "Update"
                      : "Create"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Subcategory Modal - Mobile Optimized */}
      {(isCreateSubcategoryModalOpen || editingSubcategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full mx-2 sm:mx-0"
            style={{
              borderRadius: themeConfig.borderRadius,
            }}
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
              {editingSubcategory ? "Edit Subcategory" : "Create Subcategory"}
            </h3>

            <form
              onSubmit={
                editingSubcategory
                  ? handleUpdateSubcategorySubmit
                  : handleCreateSubcategorySubmit
              }
            >
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subcategory Name
                  </label>
                  <input
                    type="text"
                    value={subcategoryName}
                    onChange={(e) => setSubcategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                    style={{ borderRadius: themeConfig.borderRadius }}
                    placeholder="Enter subcategory name"
                    required
                  />
                </div>

                {!editingSubcategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                      style={{ borderRadius: themeConfig.borderRadius }}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories?.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateSubcategoryModalOpen(false);
                      setEditingSubcategory(null);
                      setSubcategoryName("");
                      setSelectedCategoryId("");
                    }}
                    className="w-full sm:flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
                    style={{ borderRadius: themeConfig.borderRadius }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createSubcategoryMutation.isPending ||
                      updateSubcategoryMutation.isPending
                    }
                    className="w-full sm:flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-all text-sm sm:text-base"
                    style={{
                      backgroundColor: colors.primary.medium,
                      borderRadius: themeConfig.borderRadius,
                    }}
                  >
                    {createSubcategoryMutation.isPending ||
                    updateSubcategoryMutation.isPending
                      ? "Saving..."
                      : editingSubcategory
                      ? "Update"
                      : "Create"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
