import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  Package,
  Eye,
  ArrowLeft,
  Utensils,
  Star,
  Clock,
  ChefHat,
  Edit3,
  Save,
  X,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getQuickShoppingOrder,
  getCategoriesWithProducts,
  saveQuickShoppingOrder,
  CategoryOrder,
} from "../utils/quickShoppingApi";
import { colors } from "../theme/colors";

interface ViewProduct {
  _id: string;
  name: string;
  productCode: string;
  price: number;
  offerPrice?: number;
  basePrice?: number;
  profitMarginPrice?: number;
  images: Array<{ url: string; publicId: string }>;
  serialNumber: number;
}

interface ViewCategory {
  _id: string;
  name: string;
  serialNumber: number;
  products: ViewProduct[];
}

export const QuickShoppingViewPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Edit state management
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCategories, setEditingCategories] = useState<ViewCategory[]>(
    []
  );
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Fetch saved order
  const { data: savedOrder, isLoading: isLoadingSavedOrder } = useQuery({
    queryKey: ["quick-shopping-order"],
    queryFn: getQuickShoppingOrder,
  });

  // Fetch categories with products
  const { data: categoriesWithProducts, isLoading: isLoadingCategories } =
    useQuery({
      queryKey: ["categories-with-products"],
      queryFn: getCategoriesWithProducts,
    });

  // Process the data - show saved order if available, otherwise show all categories
  const processedCategories = React.useMemo(() => {
    if (!categoriesWithProducts) return [];

    console.log("=== PROCESSING VIEW DATA ===");
    console.log("savedOrder:", savedOrder);
    console.log("categoriesWithProducts:", categoriesWithProducts);

    // If we have a saved order, use it to determine the order
    if (savedOrder && savedOrder.length > 0) {
      console.log("Using saved custom order for view page");
      const viewCategories: ViewCategory[] = savedOrder
        .sort((a, b) => a.serialNumber - b.serialNumber)
        .map((savedCat) => {
          // Handle both cases: categoryId as string or as populated object
          const categoryId =
            typeof savedCat.categoryId === "string"
              ? savedCat.categoryId
              : savedCat.categoryId._id;

          const originalCategory = categoriesWithProducts.find(
            (cat) => cat._id === categoryId
          );
          if (!originalCategory) {
            return null;
          }

          const orderedProducts = savedCat.products
            .sort((a, b) => a.serialNumber - b.serialNumber)
            .map((savedProduct) => {
              // Handle both cases: productId as string or as populated object
              const productId =
                typeof savedProduct.productId === "string"
                  ? savedProduct.productId
                  : savedProduct.productId._id;

              const originalProduct = originalCategory.products.find(
                (p) => p._id === productId
              );
              if (!originalProduct) {
                return null;
              }
              return {
                ...originalProduct,
                serialNumber: savedProduct.serialNumber,
              };
            })
            .filter(Boolean) as ViewProduct[];

          return {
            _id: originalCategory._id,
            name: originalCategory.name,
            serialNumber: savedCat.serialNumber,
            products: orderedProducts,
          };
        })
        .filter(Boolean) as ViewCategory[];

      console.log("Processed view categories:", viewCategories);
      return viewCategories;
    }

    console.log("No saved order - using default categories");
    // If no saved order, show all categories with default ordering
    const defaultCategories: ViewCategory[] = categoriesWithProducts.map(
      (category, index) => ({
        _id: category._id,
        name: category.name,
        serialNumber: index + 1,
        products: category.products.map((product, productIndex) => ({
          ...product,
          serialNumber: productIndex + 1,
        })),
      })
    );

    return defaultCategories;
  }, [savedOrder, categoriesWithProducts]);

  // Save order mutation
  const saveOrderMutation = useMutation({
    mutationFn: saveQuickShoppingOrder,
    onSuccess: () => {
      toast.success("Quick shopping order saved successfully!");
      setIsEditMode(false);
      setEditingCategories([]);
      setEditingCategoryId(null);
      setEditingProductId(null);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["quick-shopping-order"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save order");
    },
  });

  // Enter edit mode
  const handleEnterEditMode = () => {
    setIsEditMode(true);
    setEditingCategories([...processedCategories]);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingCategories([]);
    setEditingCategoryId(null);
    setEditingProductId(null);
  };

  // Handle serial number change for categories
  const handleCategorySerialChange = (
    categoryId: string,
    newSerial: number
  ) => {
    setEditingCategories((prev) => {
      const updated = prev.map((cat) =>
        cat._id === categoryId ? { ...cat, serialNumber: newSerial } : cat
      );
      return updated.sort((a, b) => a.serialNumber - b.serialNumber);
    });
  };

  // Handle serial number change for products
  const handleProductSerialChange = (
    categoryId: string,
    productId: string,
    newSerial: number
  ) => {
    setEditingCategories((prev) =>
      prev.map((cat) =>
        cat._id === categoryId
          ? {
              ...cat,
              products: cat.products
                .map((prod) =>
                  prod._id === productId
                    ? { ...prod, serialNumber: newSerial }
                    : prod
                )
                .sort((a, b) => a.serialNumber - b.serialNumber),
            }
          : cat
      )
    );
  };

  // Save changes
  const handleSaveChanges = () => {
    const categoryOrder: CategoryOrder[] = editingCategories.map(
      (category) => ({
        categoryId: category._id,
        serialNumber: category.serialNumber,
        products: category.products.map((product) => ({
          productId: product._id,
          serialNumber: product.serialNumber,
        })),
      })
    );

    saveOrderMutation.mutate(categoryOrder);
  };

  // Get the categories to display (editing or processed)
  const displayCategories = isEditMode
    ? editingCategories
    : processedCategories;

  if (
    isLoadingSavedOrder ||
    isLoadingCategories ||
    saveOrderMutation.isPending
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4"
            style={{
              borderColor: colors.primary.medium,
              borderTopColor: "transparent",
            }}
          ></div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {saveOrderMutation.isPending
              ? "Saving changes..."
              : "Loading your menu..."}
          </p>
        </div>
      </div>
    );
  }

  // Show empty state only if no categories exist at all
  if (!categoriesWithProducts || categoriesWithProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate("/quick-shopping")}
              className="flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 mr-4 transition-opacity"
              style={{ backgroundColor: colors.primary.medium }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Setup
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              {/* <Utensils
                className="w-8 h-8 mr-3"
                style={{ color: colors.primary.medium }}
              /> */}
              Quick Shopping Menu
            </h1>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <ChefHat
              className="w-20 h-20 mx-auto mb-6"
              style={{ color: colors.primary.light }}
            />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Categories Available
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Please add categories and products first
            </p>
            <button
              onClick={() => navigate("/categories")}
              className="px-8 py-4 text-white rounded-xl hover:opacity-90 transition-opacity text-lg font-semibold"
              style={{ backgroundColor: colors.primary.medium }}
            >
              Add Categories
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-8 h-8 rounded flex items-center justify-center"
                style={{ backgroundColor: colors.primary.medium }}
              >
                {/* <Utensils className="w-5 h-5 text-white" /> */}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isEditMode
                    ? "Edit Quick Shopping Menu"
                    : "Quick Shopping Menu"}
                </h1>
                <span className="text-sm text-gray-600">
                  {displayCategories.length} Categories Available
                  {isEditMode && " • Edit Mode Active"}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2 inline" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={saveOrderMutation.isPending}
                    className="flex items-center px-4 py-2 text-sm text-white rounded transition-colors disabled:opacity-50"
                    style={{ backgroundColor: colors.primary.medium }}
                    onMouseEnter={(e) =>
                      !saveOrderMutation.isPending &&
                      (e.target.style.backgroundColor = colors.primary.dark)
                    }
                    onMouseLeave={(e) =>
                      !saveOrderMutation.isPending &&
                      (e.target.style.backgroundColor = colors.primary.medium)
                    }
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveOrderMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/quick-shopping")}
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                  >
                    Setup
                  </button>
                  <button
                    onClick={handleEnterEditMode}
                    className="flex items-center px-4 py-2 text-sm text-white rounded transition-colors"
                    style={{ backgroundColor: colors.primary.medium }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = colors.primary.dark)
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = colors.primary.medium)
                    }
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Menu
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Professional Status Indicator */}
        <div className="mb-6">
          <div className="bg-white rounded border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: isEditMode
                      ? colors.status.warning
                      : savedOrder && savedOrder.length > 0
                      ? colors.primary.medium
                      : colors.neutral.gray[400],
                  }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {isEditMode
                    ? "Edit Mode Active"
                    : savedOrder && savedOrder.length > 0
                    ? "Custom Arrangement Active"
                    : "Default Order"}
                </span>
                {isEditMode && (
                  <span
                    className="px-2 py-1 text-xs text-white rounded text-center"
                    style={{ backgroundColor: colors.status.warning }}
                  >
                    EDITING
                  </span>
                )}
                {!isEditMode && savedOrder && savedOrder.length > 0 && (
                  <span
                    className="px-2 py-1 text-xs text-white rounded text-center"
                    style={{ backgroundColor: colors.primary.medium }}
                  >
                    SAVED
                  </span>
                )}
              </div>
              {isEditMode && (
                <div className="text-sm text-gray-600">
                  Drag items or change order numbers to rearrange
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {displayCategories.map((category, categoryIndex) => (
            <div
              key={category._id}
              className="bg-white rounded border border-gray-200 overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: colors.primary.medium }}
                    >
                      {category.serialNumber}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      {category.products.length} items
                    </span>
                    {/* {isEditMode ? (
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">
                          Order:
                        </label>
                        <input
                          type="number"
                          value={category.serialNumber}
                          onChange={(e) =>
                            handleCategorySerialChange(
                              category._id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-gray-500"
                          min="1"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          navigate(
                            `/quick-shopping?editCategory=${category._id}`
                          )
                        }
                        className="flex items-center px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                        title="Edit this category's product arrangement"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Edit Products
                      </button>
                    )} */}
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      {isEditMode && (
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {category.products.map((product, index) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="flex items-center justify-center w-6 h-6 rounded text-sm font-medium text-white"
                            style={{ backgroundColor: colors.primary.medium }}
                          >
                            {isEditMode || (savedOrder && savedOrder.length > 0)
                              ? product.serialNumber
                              : index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.images.length > 0 ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {product.productCode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm">
                            {product.offerPrice &&
                            product.offerPrice < product.price ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-end space-x-1">
                                  <span
                                    className="text-xs text-white px-2 py-1 rounded"
                                    style={{
                                      backgroundColor: colors.status.error,
                                    }}
                                  >
                                    OFFER
                                  </span>
                                </div>
                                <div
                                  className="font-semibold"
                                  style={{ color: colors.primary.medium }}
                                >
                                  ₹{product.offerPrice.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500 line-through">
                                  ₹{product.price.toFixed(2)}
                                </div>
                              </div>
                            ) : (
                              <div className="font-semibold text-gray-900">
                                ₹{product.price.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </td>
                        {isEditMode && (
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <input
                              type="number"
                              value={product.serialNumber}
                              onChange={(e) =>
                                handleProductSerialChange(
                                  category._id,
                                  product._id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-gray-500 text-center"
                              min="1"
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
