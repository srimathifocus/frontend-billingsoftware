import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Star,
  LayoutGrid,
  List,
  Eye,
  Loader2,
} from "lucide-react";
import api from "../utils/api";
import { Product, Category, Subcategory } from "../types";
import { colors, themeConfig } from "../theme/colors";
import ProductFormModal from "../components/ProductFormModal";
import { ProductCard } from "../components/ProductCard";
import { useDebounce } from "../hooks/useDebounce";
import { createProductSlug } from "../utils/slugify";

interface FetchProductsParams {
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const fetchProducts = async (params: FetchProductsParams) => {
  const queryParams = new URLSearchParams();

  if (params.categoryId) queryParams.append("categoryId", params.categoryId);
  if (params.search) queryParams.append("search", params.search);
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());

  try {
    const response = await api.get(`/products?${queryParams.toString()}`);

    // Get the response data
    const data = response.data;

    // Handle different response structures
    if (data && typeof data === "object") {
      // If the response has a products property, use it directly
      if ("products" in data && Array.isArray(data.products)) {
        return data;
      }

      // If the response has a data property that is an array, wrap it
      if ("data" in data && Array.isArray(data.data)) {
        return {
          products: data.data,
          total: data.total || data.data.length,
          page: data.page || 1,
          pages: data.pages || 1,
        };
      }
    }

    // If the response is an array, wrap it
    if (Array.isArray(data)) {
      return { products: data, total: data.length, page: 1, pages: 1 };
    }

    // Default fallback
    return { products: [], total: 0, page: 1, pages: 1 };
  } catch (error) {
    throw error;
  }
};

const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get("/categories");

    const data = response.data;

    // Handle different response structures
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === "object") {
      // Check for data property
      if ("data" in data && Array.isArray(data.data)) {
        return data.data;
      }

      // Check for categories property
      if ("categories" in data && Array.isArray(data.categories)) {
        return data.categories;
      }

      // Check for results property
      if ("results" in data && Array.isArray(data.results)) {
        return data.results;
      }

      // Check for items property
      if ("items" in data && Array.isArray(data.items)) {
        return data.items;
      }

      // If the object itself has _id and name properties, wrap it in an array
      if ("_id" in data && "name" in data) {
        return [data as Category];
      }

      // If it's an object with numeric keys (like {0: {...}, 1: {...}}), convert to array
      const possibleArray = Object.values(data).filter(
        (item) =>
          item && typeof item === "object" && "_id" in item && "name" in item
      );

      if (possibleArray.length > 0) {
        return possibleArray as Category[];
      }
    }

    // Default fallback
    return [];
  } catch (error) {
    throw error;
  }
};

const fetchSubcategories = async (): Promise<Subcategory[]> => {
  try {
    const response = await api.get("/subcategories");

    const data = response.data;

    // Handle different response structures
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === "object") {
      // Check for data property
      if ("data" in data && Array.isArray(data.data)) {
        return data.data;
      }

      // Check for subcategories property
      if ("subcategories" in data && Array.isArray(data.subcategories)) {
        return data.subcategories;
      }

      // Check for results property
      if ("results" in data && Array.isArray(data.results)) {
        return data.results;
      }

      // Check for items property
      if ("items" in data && Array.isArray(data.items)) {
        return data.items;
      }

      // If the object itself has _id and name properties, wrap it in an array
      if ("_id" in data && "name" in data && "categoryId" in data) {
        return [data as Subcategory];
      }

      // If it's an object with numeric keys (like {0: {...}, 1: {...}}), convert to array
      const possibleArray = Object.values(data).filter(
        (item) =>
          item &&
          typeof item === "object" &&
          "_id" in item &&
          "name" in item &&
          "categoryId" in item
      );

      if (possibleArray.length > 0) {
        return possibleArray as Subcategory[];
      }
    }

    // Default fallback
    return [];
  } catch (error) {
    throw error;
  }
};

export const ProductsPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState({
    categoryId: "",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cube" | "list">("list"); // Set list as default, removed grid

  // Debounce search to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  const queryClient = useQueryClient();

  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
    error: productsError,
  } = useQuery({
    queryKey: [
      "products",
      { ...filters, search: debouncedSearchTerm },
      currentPage,
    ],
    queryFn: () =>
      fetchProducts({
        categoryId: filters.categoryId,
        search: debouncedSearchTerm,
        page: currentPage,
        limit: 10,
      }),
    staleTime: 30000, // 30 seconds
  });

  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    onError: () => {
      toast.error("Failed to load categories. Please try again.");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  const {
    data: subcategories,
    isLoading: subcategoriesLoading,
    refetch: refetchSubcategories,
    error: subcategoriesError,
  } = useQuery({
    queryKey: ["subcategories"],
    queryFn: fetchSubcategories,
    onError: () => {
      toast.error("Failed to load subcategories. Please try again.");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    enabled: !!categories, // Only fetch subcategories after categories are loaded
  });

  // Silent component mount
  useEffect(() => {
    // React Query will handle initial data fetch based on staleTime and cache
  }, []);

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post("/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      // Only invalidate what's actually affected
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categoryStats"] });

      toast.success("Product created successfully!");
      closeModal();
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to create product";
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: FormData;
    }) => {
      const response = await api.put(`/products/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      // Only invalidate what's actually affected
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categoryStats"] });

      toast.success("Product updated successfully!");
      closeModal();
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to update product";
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      // Only invalidate what's actually affected
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categoryStats"] });

      toast.success("Product deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete product");
    },
  });

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setEditingProduct(null);
  };

  const handleFormSubmit = (formData: FormData) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteMutation.mutate(product._id);
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setIsCreateModalOpen(true);
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64">
        <div className="text-red-500 mb-4">Error loading products</div>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["products"] })
          }
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
            Products Management
          </h1>
          <div className="mt-2 text-gray-600 dark:text-gray-400 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
            <span className="text-sm sm:text-base">
              Manage your product catalog
            </span>
            {productsData?.total !== undefined && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs sm:text-sm font-medium w-fit">
                  {productsData.total}{" "}
                  {productsData.total === 1 ? "product" : "products"}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("cube")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "cube"
                  ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
              title="Card View"
            >
              <LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
              title="List View"
            >
              <List size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-white font-medium hover:shadow-md transition-all text-sm sm:text-base"
            style={{
              backgroundColor: colors.primary.medium,
              borderRadius: themeConfig.borderRadius,
            }}
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Create Product</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        style={{
          borderRadius: themeConfig.borderRadius,
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-2">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            {productsFetching && debouncedSearchTerm !== filters.search && (
              <Loader2
                size={16}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin"
              />
            )}
            <input
              type="text"
              placeholder="Search products instantly..."
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm sm:text-base"
              style={{ borderRadius: themeConfig.borderRadius }}
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }));
                setCurrentPage(1); // Reset to first page when search changes
              }}
            />
            {filters.search && (
              <div className="absolute -bottom-5 sm:-bottom-6 left-0 text-xs text-gray-500 flex items-center space-x-2">
                {debouncedSearchTerm === filters.search ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="truncate max-w-[250px] sm:max-w-none">
                      Showing results for "{filters.search}"
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="truncate max-w-[250px] sm:max-w-none">
                      Searching for "{filters.search}"...
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="col-span-1">
            <select
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              style={{ borderRadius: themeConfig.borderRadius }}
              value={filters.categoryId}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, categoryId: e.target.value }));
                setCurrentPage(1); // Reset to first page when category changes
              }}
            >
              <option value="">All Categories</option>
              {categories?.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="relative">
        {/* Background Loading Indicator - Subtle */}
        {productsFetching && !productsLoading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse z-10"></div>
        )}

        {/* Improved Card Layout */}
        {viewMode === "cube" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4 md:gap-6">
            {(productsData?.products ? productsData.products : []).map(
              (product: Product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  variant="cube"
                />
              )
            )}
          </div>
        )}

        {/* List Layout */}
        {viewMode === "list" && (
          <div className="space-y-3 sm:space-y-4">
            {(productsData?.products ? productsData.products : []).map(
              (product: Product) => (
                <div
                  key={product._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-600"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="w-full h-48 sm:w-32 sm:h-32 lg:w-40 lg:h-40 flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={32} className="text-gray-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 sm:p-4 lg:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 mb-3 lg:mb-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                              {product.name}
                            </h3>
                            {product.bestSeller && (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-medium w-fit mt-1 sm:mt-0">
                                <Star size={12} fill="currentColor" />
                                <span>Best Seller</span>
                              </span>
                            )}
                          </div>

                          <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 text-sm sm:text-base">
                            {product.description}
                          </p>

                          {/* YouTube Link */}
                          {product.youtubeLink && (
                            <div className="mb-3">
                              <a
                                href={product.youtubeLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs sm:text-sm text-red-600 hover:text-red-800"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                </svg>
                                Watch Video
                              </a>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-3 gap-2 sm:gap-0">
                            <div className="flex items-center space-x-2">
                              {product.offerPrice ? (
                                <>
                                  <span className="text-xl sm:text-2xl font-bold text-green-600">
                                    ₹{product.offerPrice.toLocaleString()}
                                  </span>
                                  <span className="text-base sm:text-lg text-gray-500 line-through">
                                    ₹{product.price.toLocaleString()}
                                  </span>
                                  <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">
                                    {Math.round(
                                      ((product.price - product.offerPrice) /
                                        product.price) *
                                        100
                                    )}
                                    % OFF
                                  </span>
                                </>
                              ) : (
                                <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                  ₹{product.price.toLocaleString()}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
                                  product.inStock
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                }`}
                              >
                                {product.inStock ? "In Stock" : "Out of Stock"}
                              </span>

                              {/* Stock Quantity */}
                              {product.stockQuantity !== undefined &&
                                product.stockQuantity > 0 && (
                                  <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium w-fit">
                                    Qty: {product.stockQuantity}
                                  </span>
                                )}

                              {/* Active Status */}
                              {product.isActive === false && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 rounded-full text-sm font-medium w-fit">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>

                          {product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {product.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {product.tags.length > 3 && (
                                <span className="text-xs text-gray-500 px-2 py-1">
                                  +{product.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 lg:ml-6">
                          <button
                            onClick={() => {
                              const slug = createProductSlug(
                                product.name,
                                product._id
                              );
                              window.open(`/products/${slug}`, "_blank");
                            }}
                            className="inline-flex items-center justify-center space-x-1 px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium flex-1 lg:flex-none"
                            title="View Product Details"
                          >
                            <Eye size={14} className="sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">
                              View Details
                            </span>
                            <span className="sm:hidden">View</span>
                          </button>
                          <button
                            onClick={() => startEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit
                              size={16}
                              className="sm:w-[18px] sm:h-[18px]"
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2
                              size={16}
                              className="sm:w-[18px] sm:h-[18px]"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {(!productsData?.products || productsData.products.length === 0) &&
        !productsLoading && (
          <div className="text-center py-12 sm:py-16 px-4">
            <Package
              size={48}
              className="sm:w-16 sm:h-16 mx-auto text-gray-400 mb-4 sm:mb-6"
            />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {filters.search || filters.categoryId
                ? "No products match your filters"
                : "No products found"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {filters.search || filters.categoryId
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : "Create your first product to get started with your catalog management."}
            </p>
            {!filters.search && !filters.categoryId && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-white font-medium hover:shadow-md transition-all text-sm sm:text-base"
                style={{
                  backgroundColor: colors.primary.medium,
                  borderRadius: themeConfig.borderRadius,
                }}
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                <span>Create Your First Product</span>
              </button>
            )}
          </div>
        )}

      {/* Pagination */}
      {productsData?.products && productsData.products.length > 0 && (
        <div className="flex justify-center mt-6 sm:mt-8 px-4">
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || productsFetching}
              className="px-2 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 flex items-center text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              style={{ borderRadius: themeConfig.borderRadius }}
            >
              {productsFetching && currentPage > 1 ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-t-2 border-blue-500 rounded-full animate-spin mr-1 sm:mr-2"></div>
              ) : null}
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            <span className="px-2 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 flex items-center text-sm sm:text-base text-gray-900 dark:text-white">
              {productsFetching ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-blue-500 rounded-full animate-spin mr-1 sm:mr-2"></div>
              ) : null}
              <span className="hidden sm:inline">
                Page {currentPage} of {productsData.pages || 1}
              </span>
              <span className="sm:hidden">
                {currentPage}/{productsData.pages || 1}
              </span>
            </span>

            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={
                !productsData.pages ||
                currentPage >= productsData.pages ||
                productsFetching
              }
              className="px-2 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 flex items-center text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              style={{ borderRadius: themeConfig.borderRadius }}
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              {productsFetching && currentPage < (productsData.pages || 1) ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-t-2 border-blue-500 rounded-full animate-spin ml-1 sm:ml-2"></div>
              ) : null}
            </button>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {isCreateModalOpen && (
        <ProductFormModal
          isOpen={isCreateModalOpen}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
          initialData={
            editingProduct
              ? {
                  productCode: editingProduct.productCode,
                  name: editingProduct.name,
                  description: editingProduct.description,
                  price: editingProduct.price.toString(),
                  offerPrice: editingProduct.offerPrice?.toString() || "",
                  categoryId: editingProduct.categoryId,
                  subcategoryId: editingProduct.subcategoryId || "",
                  inStock: editingProduct.inStock,
                  bestSeller: editingProduct.bestSeller,
                  tags: editingProduct.tags.join(", "),
                  // Add new fields
                  isActive:
                    editingProduct.isActive !== undefined
                      ? editingProduct.isActive
                      : true,
                  youtubeLink: editingProduct.youtubeLink || "",
                  stockQuantity: editingProduct.stockQuantity?.toString() || "",
                  images: editingProduct.images.map((img) => ({
                    preview: img.url,
                    name: img.url.split("/").pop() || "image",
                    size: 0,
                    isValid: true,
                  })),
                }
              : undefined
          }
          categories={categories || []}
          subcategories={subcategories || []}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          isEditing={!!editingProduct}
          categoriesLoading={categoriesLoading}
          subcategoriesLoading={subcategoriesLoading}
          onRetryCategories={() => {
            refetchCategories();
            toast.info("Refreshing categories...");
          }}
          onRetrySubcategories={() => {
            refetchSubcategories();
            toast.info("Refreshing subcategories...");
          }}
        />
      )}
    </div>
  );
};
