import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Save,
  RotateCcw,
  Package,
  Grid3x3,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";
import { SerialNumberInput } from "../components/QuickShopping/SerialNumberInput";
import {
  getCategoriesWithProducts,
  getQuickShoppingOrder,
  saveQuickShoppingOrder,
  resetQuickShoppingOrder,
  CategoryWithProducts,
  CategoryOrder,
  Product,
} from "../utils/quickShoppingApi";
import { colors } from "../theme/colors";

interface OrderedCategory {
  _id: string;
  name: string;
  serialNumber: number;
  products: Array<{
    _id: string;
    name: string;
    productCode: string;
    price: number;
    offerPrice?: number;
    images: Array<{ url: string; publicId: string }>;
    serialNumber: number;
  }>;
}

export const QuickShoppingPage: React.FC = () => {
  const [orderedCategories, setOrderedCategories] = useState<OrderedCategory[]>(
    []
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch categories with products
  const { data: categoriesWithProducts, isLoading: isLoadingCategories } =
    useQuery({
      queryKey: ["categories-with-products"],
      queryFn: getCategoriesWithProducts,
    });

  // Fetch saved order
  const { data: savedOrder, isLoading: isLoadingSavedOrder } = useQuery({
    queryKey: ["quick-shopping-order"],
    queryFn: getQuickShoppingOrder,
  });

  // Save order mutation
  const saveOrderMutation = useMutation({
    mutationFn: saveQuickShoppingOrder,
    onSuccess: () => {
      toast.success("Quick shopping order saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["quick-shopping-order"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save order");
    },
  });

  // Reset order mutation
  const resetOrderMutation = useMutation({
    mutationFn: resetQuickShoppingOrder,
    onSuccess: () => {
      toast.success("Quick shopping order reset successfully!");
      queryClient.invalidateQueries({ queryKey: ["quick-shopping-order"] });
      initializeFromCategories();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reset order");
    },
  });

  // Initialize from categories without saved order
  const initializeFromCategories = () => {
    if (categoriesWithProducts) {
      const initialCategories: OrderedCategory[] = categoriesWithProducts.map(
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
      setOrderedCategories(initialCategories);
    }
  };

  // Initialize from saved order
  const initializeFromSavedOrder = () => {
    if (savedOrder && categoriesWithProducts) {
      const orderedCats: OrderedCategory[] = savedOrder
        .sort((a, b) => a.serialNumber - b.serialNumber)
        .map((savedCat) => {
          const originalCategory = categoriesWithProducts.find(
            (cat) => cat._id === savedCat.categoryId
          );
          if (!originalCategory) return null;

          const orderedProducts = savedCat.products
            .sort((a, b) => a.serialNumber - b.serialNumber)
            .map((savedProduct) => {
              const originalProduct = originalCategory.products.find(
                (p) => p._id === savedProduct.productId
              );
              return originalProduct
                ? {
                    ...originalProduct,
                    serialNumber: savedProduct.serialNumber,
                  }
                : null;
            })
            .filter(Boolean) as OrderedCategory["products"];

          return {
            _id: originalCategory._id,
            name: originalCategory.name,
            serialNumber: savedCat.serialNumber,
            products: orderedProducts,
          };
        })
        .filter(Boolean) as OrderedCategory[];

      setOrderedCategories(orderedCats);
    }
  };

  // Initialize data when both queries are loaded
  useEffect(() => {
    if (
      !isLoadingCategories &&
      !isLoadingSavedOrder &&
      categoriesWithProducts &&
      !isInitialized
    ) {
      if (savedOrder && savedOrder.length > 0) {
        initializeFromSavedOrder();
      } else {
        initializeFromCategories();
      }
      setIsInitialized(true);
    }
  }, [
    isLoadingCategories,
    isLoadingSavedOrder,
    categoriesWithProducts,
    savedOrder,
    isInitialized,
  ]);

  // Handle category serial number change
  const handleCategorySerialChange = (
    categoryId: string,
    newSerialNumber: number
  ) => {
    setOrderedCategories((prev) => {
      const newCategories = prev.map((cat) =>
        cat._id === categoryId ? { ...cat, serialNumber: newSerialNumber } : cat
      );
      return newCategories.sort((a, b) => a.serialNumber - b.serialNumber);
    });
  };

  // Handle product serial number change
  const handleProductSerialChange = (
    categoryId: string,
    productId: string,
    newSerialNumber: number
  ) => {
    setOrderedCategories((prev) => {
      return prev.map((category) => {
        if (category._id !== categoryId) return category;

        const newProducts = category.products.map((product) =>
          product._id === productId
            ? { ...product, serialNumber: newSerialNumber }
            : product
        );

        return {
          ...category,
          products: newProducts.sort((a, b) => a.serialNumber - b.serialNumber),
        };
      });
    });
  };

  // Move category up/down
  const moveCategoryUp = (categoryId: string) => {
    setOrderedCategories((prev) => {
      const categoryIndex = prev.findIndex((cat) => cat._id === categoryId);
      if (categoryIndex > 0) {
        const newCategories = [...prev];
        [newCategories[categoryIndex - 1], newCategories[categoryIndex]] = [
          newCategories[categoryIndex],
          newCategories[categoryIndex - 1],
        ];

        // Update serial numbers
        newCategories.forEach((cat, index) => {
          cat.serialNumber = index + 1;
        });

        return newCategories;
      }
      return prev;
    });
  };

  const moveCategoryDown = (categoryId: string) => {
    setOrderedCategories((prev) => {
      const categoryIndex = prev.findIndex((cat) => cat._id === categoryId);
      if (categoryIndex < prev.length - 1) {
        const newCategories = [...prev];
        [newCategories[categoryIndex], newCategories[categoryIndex + 1]] = [
          newCategories[categoryIndex + 1],
          newCategories[categoryIndex],
        ];

        // Update serial numbers
        newCategories.forEach((cat, index) => {
          cat.serialNumber = index + 1;
        });

        return newCategories;
      }
      return prev;
    });
  };

  // Move product up/down
  const moveProductUp = (categoryId: string, productId: string) => {
    setOrderedCategories((prev) => {
      return prev.map((category) => {
        if (category._id !== categoryId) return category;

        const productIndex = category.products.findIndex(
          (p) => p._id === productId
        );
        if (productIndex > 0) {
          const newProducts = [...category.products];
          [newProducts[productIndex - 1], newProducts[productIndex]] = [
            newProducts[productIndex],
            newProducts[productIndex - 1],
          ];

          // Update serial numbers
          newProducts.forEach((product, index) => {
            product.serialNumber = index + 1;
          });

          return { ...category, products: newProducts };
        }
        return category;
      });
    });
  };

  const moveProductDown = (categoryId: string, productId: string) => {
    setOrderedCategories((prev) => {
      return prev.map((category) => {
        if (category._id !== categoryId) return category;

        const productIndex = category.products.findIndex(
          (p) => p._id === productId
        );
        if (productIndex < category.products.length - 1) {
          const newProducts = [...category.products];
          [newProducts[productIndex], newProducts[productIndex + 1]] = [
            newProducts[productIndex + 1],
            newProducts[productIndex],
          ];

          // Update serial numbers
          newProducts.forEach((product, index) => {
            product.serialNumber = index + 1;
          });

          return { ...category, products: newProducts };
        }
        return category;
      });
    });
  };

  // Handle save
  const handleSave = () => {
    const categoryOrder: CategoryOrder[] = orderedCategories.map(
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

  // Handle reset
  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the quick shopping order? This will remove all custom ordering."
      )
    ) {
      resetOrderMutation.mutate();
    }
  };

  if (isLoadingCategories || isLoadingSavedOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quick Shopping
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Arrange categories and products in your preferred order
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/quick-shopping-view")}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2 inline" />
            View Menu
          </button>
          <button
            onClick={handleReset}
            disabled={resetOrderMutation.isPending}
            className="flex items-center px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {resetOrderMutation.isPending ? "Resetting..." : "Reset"}
          </button>
          <button
            onClick={handleSave}
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
            {saveOrderMutation.isPending ? "Saving..." : "Save Arrangement"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {orderedCategories.map((category, categoryIndex) => (
          <div
            key={category._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Grid3x3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({category.products.length} products)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => moveCategoryUp(category._id)}
                  disabled={categoryIndex === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveCategoryDown(category._id)}
                  disabled={categoryIndex === orderedCategories.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Serial No:
                </label>
                <SerialNumberInput
                  value={category.serialNumber}
                  onChange={(value) =>
                    handleCategorySerialChange(category._id, value)
                  }
                  className="w-16"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.products.map((product, productIndex) => (
                <div
                  key={product._id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() =>
                              moveProductUp(category._id, product._id)
                            }
                            disabled={productIndex === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              moveProductDown(category._id, product._id)
                            }
                            disabled={
                              productIndex === category.products.length - 1
                            }
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <SerialNumberInput
                            value={product.serialNumber}
                            onChange={(value) =>
                              handleProductSerialChange(
                                category._id,
                                product._id,
                                value
                              )
                            }
                            className="w-10 text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Code: {product.productCode}
                      </p>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-3 h-3 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          ${product.offerPrice || product.price}
                        </span>
                        {product.offerPrice && (
                          <span className="text-xs text-gray-500 line-through">
                            ${product.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
