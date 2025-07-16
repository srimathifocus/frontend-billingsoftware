import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  Save,
  RotateCcw,
  Package,
  Grid3x3,
  DollarSign,
  Eye,
  Edit3,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DragDropProvider } from "../components/QuickShopping/DragDropContext";
import { DraggableItem } from "../components/QuickShopping/DraggableItem";
import {
  getCategoriesWithProducts,
  getQuickShoppingOrder,
  saveQuickShoppingOrder,
  resetQuickShoppingOrder,
  CategoryWithProducts,
  CategoryOrder,
  PopulatedCategoryOrder,
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
  const [isDefaultState, setIsDefaultState] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check if we're in edit mode for a specific category
  const editCategoryId = searchParams.get('editCategory');
  const isEditMode = !!editCategoryId;
  
  console.log("QuickShoppingPage render:", {
    isEditMode,
    editCategoryId,
    orderedCategoriesLength: orderedCategories.length,
    isInitialized,
    isLoadingCategories,
    isLoadingSavedOrder,
  });

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
      if (isEditMode) {
        toast.success(
          "Category products updated successfully!"
        );
        // Navigate back to view page after successful edit
        navigate('/quick-shopping-view');
      } else {
        toast.success(
          "Quick shopping order saved successfully! Arrangement is now permanent."
        );
        setIsDefaultState(false);
        // Reset initialization flag to force refresh with saved order
        setIsInitialized(false);
      }
      
      // Invalidate both queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["quick-shopping-order"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save order");
    },
  });

  // Reset order mutation
  const resetOrderMutation = useMutation({
    mutationFn: resetQuickShoppingOrder,
    onSuccess: () => {
      toast.success(
        "Quick shopping order reset successfully! Back to default state."
      );
      // Invalidate both queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["quick-shopping-order"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-products"] });
      setIsDefaultState(true);
      // Reset initialization flag to force refresh with default order
      setIsInitialized(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reset order");
    },
  });

  // Initialize from categories without saved order
  const initializeFromCategories = () => {
    console.log(
      "initializeFromCategories called with:",
      categoriesWithProducts?.length,
      "categories"
    );
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
      console.log(
        "Setting orderedCategories to:",
        initialCategories.length,
        "categories"
      );
      setOrderedCategories(initialCategories);
      setIsDefaultState(true);
    }
  };

  // Initialize for edit mode - ensure the specific category is loaded
  const initializeForEditMode = () => {
    if (!categoriesWithProducts || !editCategoryId) return;
    
    console.log("=== INITIALIZING FOR EDIT MODE ===");
    console.log("editCategoryId:", editCategoryId);
    
    // Find the category being edited
    const categoryToEdit = categoriesWithProducts.find(cat => cat._id === editCategoryId);
    if (!categoryToEdit) {
      console.error("Category to edit not found:", editCategoryId);
      toast.error("Category not found for editing");
      navigate('/quick-shopping');
      return;
    }
    
    // Check if there's a saved order for this category
    let categoryData = categoryToEdit;
    let serialNumber = 1;
    
    if (savedOrder && savedOrder.length > 0) {
      const savedCategoryOrder = savedOrder.find(order => {
        const categoryId = typeof order.categoryId === "string" 
          ? order.categoryId 
          : order.categoryId._id;
        return categoryId === editCategoryId;
      });
      
      if (savedCategoryOrder) {
        console.log("Found saved order for category:", savedCategoryOrder);
        serialNumber = savedCategoryOrder.serialNumber;
        
        // Apply saved product order
        const orderedProducts = savedCategoryOrder.products
          .sort((a, b) => a.serialNumber - b.serialNumber)
          .map(savedProduct => {
            const originalProduct = categoryToEdit.products.find(p => p._id === savedProduct.productId);
            if (originalProduct) {
              return {
                ...originalProduct,
                serialNumber: savedProduct.serialNumber,
              };
            }
            return null;
          })
          .filter(Boolean);
        
        // Add any products not in saved order
        const savedProductIds = savedCategoryOrder.products.map(p => p.productId);
        const unsavedProducts = categoryToEdit.products
          .filter(p => !savedProductIds.includes(p._id))
          .map((product, index) => ({
            ...product,
            serialNumber: orderedProducts.length + index + 1,
          }));
        
        categoryData = {
          ...categoryToEdit,
          products: [...orderedProducts, ...unsavedProducts],
        };
      }
    }
    
    const editCategory: OrderedCategory = {
      _id: categoryData._id,
      name: categoryData.name,
      serialNumber: serialNumber,
      products: categoryData.products.map((product, index) => ({
        _id: product._id,
        name: product.name,
        productCode: product.productCode,
        price: product.price,
        offerPrice: product.offerPrice,
        images: product.images,
        serialNumber: product.serialNumber || index + 1,
      })),
    };
    
    console.log("Initialized edit category:", editCategory);
    setOrderedCategories([editCategory]);
    setIsDefaultState(!savedOrder || savedOrder.length === 0);
  };

  // Initialize from saved order
  const initializeFromSavedOrder = () => {
    if (savedOrder && categoriesWithProducts) {
      console.log("=== INITIALIZING FROM SAVED ORDER ===");
      console.log("savedOrder:", savedOrder);
      console.log("categoriesWithProducts:", categoriesWithProducts);

      const orderedCats: OrderedCategory[] = savedOrder
        .sort((a, b) => a.serialNumber - b.serialNumber)
        .map((savedCat, index) => {
          console.log(`Processing category ${index + 1}:`, savedCat);

          // Handle both cases: categoryId as string or as object with _id
          const categoryId =
            typeof savedCat.categoryId === "string"
              ? savedCat.categoryId
              : savedCat.categoryId._id;

          console.log("Looking for categoryId:", categoryId);

          const originalCategory = categoriesWithProducts.find(
            (cat) => cat._id === categoryId
          );

          if (!originalCategory) {
            console.warn("Category not found:", categoryId);
            console.log(
              "Available categories:",
              categoriesWithProducts.map((c) => ({ id: c._id, name: c.name }))
            );
            return null;
          }

          console.log(
            "Found original category:",
            originalCategory.name,
            "with",
            originalCategory.products.length,
            "products"
          );

          const orderedProducts = savedCat.products
            .sort((a, b) => a.serialNumber - b.serialNumber)
            .map((savedProduct, prodIndex) => {
              console.log(
                `  Processing product ${prodIndex + 1}:`,
                savedProduct
              );

              // Handle both cases: productId as string or as object with _id
              const productId =
                typeof savedProduct.productId === "string"
                  ? savedProduct.productId
                  : savedProduct.productId._id;

              console.log("  Looking for productId:", productId);

              const originalProduct = originalCategory.products.find(
                (p) => p._id === productId
              );

              if (!originalProduct) {
                console.warn("  Product not found:", productId);
                console.log(
                  "  Available products:",
                  originalCategory.products.map((p) => ({
                    id: p._id,
                    name: p.name,
                  }))
                );
                return null;
              }

              console.log("  Found product:", originalProduct.name);

              return {
                ...originalProduct,
                serialNumber: savedProduct.serialNumber,
              };
            })
            .filter(Boolean) as OrderedCategory["products"];

          console.log(
            "Category",
            originalCategory.name,
            "processed with",
            orderedProducts.length,
            "products"
          );

          return {
            _id: originalCategory._id,
            name: originalCategory.name,
            serialNumber: savedCat.serialNumber,
            products: orderedProducts,
          };
        })
        .filter(Boolean) as OrderedCategory[];

      console.log("=== FINAL RESULT ===");
      console.log("orderedCats:", orderedCats);
      console.log("Setting", orderedCats.length, "categories");

      setOrderedCategories(orderedCats);
      setIsDefaultState(false);
    } else {
      console.log("Cannot initialize from saved order:", {
        hasSavedOrder: !!savedOrder,
        hasCategoriesWithProducts: !!categoriesWithProducts,
      });
    }
  };

  // Initialize data when both queries are loaded
  useEffect(() => {
    console.log("QuickShoppingPage useEffect:", {
      isLoadingCategories,
      isLoadingSavedOrder,
      categoriesWithProducts: categoriesWithProducts?.length,
      savedOrder: savedOrder?.length,
      isInitialized,
      orderedCategoriesLength: orderedCategories.length,
    });

    if (
      !isLoadingCategories &&
      !isLoadingSavedOrder &&
      categoriesWithProducts &&
      !isInitialized
    ) {
      if (isEditMode) {
        console.log("Initializing for edit mode - category:", editCategoryId);
        initializeForEditMode();
      } else if (savedOrder && savedOrder.length > 0) {
        console.log(
          "Initializing from saved order - showing custom arrangement"
        );
        initializeFromSavedOrder();
      } else {
        console.log("Initializing from default categories (no saved order)");
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
    isEditMode,
    editCategoryId,
  ]);

  // Force re-initialization if data changes but orderedCategories is empty
  useEffect(() => {
    if (
      !isLoadingCategories &&
      !isLoadingSavedOrder &&
      categoriesWithProducts &&
      categoriesWithProducts.length > 0 &&
      orderedCategories.length === 0 &&
      isInitialized
    ) {
      console.log("Force re-initializing due to empty orderedCategories");
      setIsInitialized(false);
    }
  }, [
    categoriesWithProducts,
    orderedCategories.length,
    isInitialized,
    isLoadingCategories,
    isLoadingSavedOrder,
  ]);

  // Handle drag and drop
  const handleItemMove = (
    draggedItem: any,
    targetItem: any,
    draggedType: "category" | "product",
    targetType: "category" | "product",
    draggedFromCategory?: string,
    targetCategory?: string
  ) => {
    setOrderedCategories((prev) => {
      const newCategories = [...prev];

      if (draggedType === "category" && targetType === "category") {
        // Move category
        const draggedIndex = newCategories.findIndex(
          (cat) => cat._id === draggedItem._id
        );
        const targetIndex = newCategories.findIndex(
          (cat) => cat._id === targetItem._id
        );

        if (draggedIndex !== -1 && targetIndex !== -1) {
          const [draggedCat] = newCategories.splice(draggedIndex, 1);
          newCategories.splice(targetIndex, 0, draggedCat);

          // Update serial numbers
          newCategories.forEach((cat, index) => {
            cat.serialNumber = index + 1;
          });
        }
      } else if (
        draggedType === "product" &&
        targetType === "product" &&
        draggedFromCategory &&
        targetCategory
      ) {
        // Move product within same category or between categories
        const sourceCatIndex = newCategories.findIndex(
          (cat) => cat._id === draggedFromCategory
        );
        const targetCatIndex = newCategories.findIndex(
          (cat) => cat._id === targetCategory
        );

        if (sourceCatIndex !== -1 && targetCatIndex !== -1) {
          const sourceProducts = newCategories[sourceCatIndex].products;
          const targetProducts = newCategories[targetCatIndex].products;

          const draggedProductIndex = sourceProducts.findIndex(
            (p) => p._id === draggedItem._id
          );
          const targetProductIndex = targetProducts.findIndex(
            (p) => p._id === targetItem._id
          );

          if (draggedProductIndex !== -1 && targetProductIndex !== -1) {
            const [draggedProduct] = sourceProducts.splice(
              draggedProductIndex,
              1
            );
            targetProducts.splice(targetProductIndex, 0, draggedProduct);

            // Update serial numbers for both categories
            sourceProducts.forEach((product, index) => {
              product.serialNumber = index + 1;
            });
            targetProducts.forEach((product, index) => {
              product.serialNumber = index + 1;
            });
          }
        }
      }

      return newCategories;
    });
  };

  // Handle manual serial number change
  const handleSerialNumberChange = (
    type: "category" | "product",
    itemId: string,
    newSerialNumber: number,
    categoryId?: string
  ) => {
    setOrderedCategories((prev) => {
      const newCategories = [...prev];

      if (type === "category") {
        const category = newCategories.find((cat) => cat._id === itemId);
        if (category) {
          category.serialNumber = newSerialNumber;
          // Re-sort categories by serial number
          newCategories.sort((a, b) => a.serialNumber - b.serialNumber);
        }
      } else if (type === "product" && categoryId) {
        const category = newCategories.find((cat) => cat._id === categoryId);
        if (category) {
          const product = category.products.find((p) => p._id === itemId);
          if (product) {
            product.serialNumber = newSerialNumber;
            // Re-sort products by serial number
            category.products.sort((a, b) => a.serialNumber - b.serialNumber);
          }
        }
      }

      return newCategories;
    });
  };

  // Handle save
  const handleSave = () => {
    if (isEditMode) {
      // In edit mode, merge the edited category with existing saved order
      const editedCategory = orderedCategories.find(cat => cat._id === editCategoryId);
      if (!editedCategory) {
        toast.error("Category not found for editing");
        return;
      }

      // Get existing saved order or create new one
      const existingOrder = savedOrder || [];
      
      // Update or add the edited category
      const updatedOrder = existingOrder.map(categoryOrder => {
        if (categoryOrder.categoryId === editCategoryId) {
          // Update existing category
          return {
            categoryId: editedCategory._id,
            serialNumber: editedCategory.serialNumber,
            products: editedCategory.products.map((product) => ({
              productId: product._id,
              serialNumber: product.serialNumber,
            })),
          };
        }
        return categoryOrder;
      });

      // If category wasn't in saved order, add it
      if (!existingOrder.find(co => co.categoryId === editCategoryId)) {
        updatedOrder.push({
          categoryId: editedCategory._id,
          serialNumber: editedCategory.serialNumber,
          products: editedCategory.products.map((product) => ({
            productId: product._id,
            serialNumber: product.serialNumber,
          })),
        });
      }

      console.log("Saving edited category order:", updatedOrder);
      saveOrderMutation.mutate(updatedOrder);
    } else {
      // Normal save - save all categories
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

      console.log("Saving category order:", categoryOrder);
      saveOrderMutation.mutate(categoryOrder);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (isDefaultState) {
      toast.info("Already in default state - no changes to reset.");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to reset the quick shopping order?\n\nThis will:\n• Remove all custom ordering\n• Return to default category and product arrangement\n• Delete saved arrangement from database\n\nThis action cannot be undone."
      )
    ) {
      resetOrderMutation.mutate();
    }
  };

  if (isLoadingCategories || isLoadingSavedOrder || saveOrderMutation.isPending || resetOrderMutation.isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{
              borderColor: colors.primary.medium,
              borderTopColor: "transparent",
            }}
          ></div>
          <p className="text-lg font-medium text-gray-700">
            {saveOrderMutation.isPending 
              ? "Saving arrangement..." 
              : resetOrderMutation.isPending 
              ? "Resetting to default..." 
              : "Loading quick shopping setup..."}
          </p>
        </div>
      </div>
    );
  }

  // Show empty state if no categories exist at all
  if (!categoriesWithProducts || categoriesWithProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Quick Shopping Setup
            </h1>
          </div>
          <div className="bg-white rounded border border-gray-200 p-12 text-center">
            <Package
              className="w-20 h-20 mx-auto mb-6 text-gray-400"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Categories Available
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Please add categories and products first to set up quick shopping
            </p>
            <button
              onClick={() => navigate("/categories")}
              className="px-8 py-4 text-white rounded transition-opacity text-lg font-semibold"
              style={{ backgroundColor: colors.primary.medium }}
              onMouseEnter={(e) => e.target.style.backgroundColor = colors.primary.dark}
              onMouseLeave={(e) => e.target.style.backgroundColor = colors.primary.medium}
            >
              Add Categories
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Check data before rendering and handle empty state
  if (
    orderedCategories.length === 0 &&
    categoriesWithProducts &&
    categoriesWithProducts.length > 0 &&
    isInitialized
  ) {
    console.warn(
      "Data mismatch: categoriesWithProducts has data but orderedCategories is empty",
      {
        categoriesWithProductsLength: categoriesWithProducts.length,
        isInitialized,
        isLoadingCategories,
        isLoadingSavedOrder,
      }
    );
    
    // Force re-initialization if we have data but empty display
    setTimeout(() => {
      console.log("Force re-initializing due to empty display");
      setIsInitialized(false);
    }, 100);
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-4"
            style={{
              borderColor: colors.primary.medium,
              borderTopColor: "transparent",
            }}
          ></div>
          <p className="text-lg font-medium text-gray-700">
            Initializing quick shopping data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DragDropProvider onItemMove={handleItemMove}>
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Category Products" : "Quick Shopping Setup"}
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <p className="text-gray-600">
                {isEditMode 
                  ? `Editing: ${orderedCategories.find(cat => cat._id === editCategoryId)?.name || 'Category'}`
                  : `${orderedCategories.length} Categories`
                }
              </p>
              <div className="flex items-center space-x-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: isDefaultState
                      ? colors.neutral.gray[400]
                      : colors.primary.medium,
                  }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {isDefaultState
                    ? "Default Order"
                    : "Custom Arrangement"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/quick-shopping-view")}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2 inline" />
              View Menu
            </button>
            <button
              onClick={handleReset}
              disabled={resetOrderMutation.isPending || isDefaultState}
              className={`flex items-center px-4 py-2 text-sm border rounded transition-colors ${
                isDefaultState
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              title={
                isDefaultState
                  ? "Already in default state"
                  : "Reset to default order"
              }
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {resetOrderMutation.isPending ? "Resetting..." : "Reset"}
            </button>
            <button
              onClick={handleSave}
              disabled={saveOrderMutation.isPending}
              className="flex items-center px-4 py-2 text-sm text-white rounded transition-colors disabled:opacity-50"
              style={{ backgroundColor: colors.primary.medium }}
              onMouseEnter={(e) => !saveOrderMutation.isPending && (e.target.style.backgroundColor = colors.primary.dark)}
              onMouseLeave={(e) => !saveOrderMutation.isPending && (e.target.style.backgroundColor = colors.primary.medium)}
              title="Save current arrangement as permanent order"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveOrderMutation.isPending 
                ? "Saving..." 
                : isEditMode 
                ? "Update Category" 
                : "Save Arrangement"}
            </button>
          </div>
        </div>

        {/* Information Banner */}
        <div className="mb-6 p-4 bg-white rounded border border-gray-200">
          <div className="flex items-start space-x-3">
            <div
              className="w-2 h-2 rounded-full mt-2"
              style={{
                backgroundColor: isDefaultState
                  ? colors.neutral.gray[400]
                  : colors.primary.medium,
              }}
            />
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                {isEditMode
                  ? "Edit Mode Active"
                  : isDefaultState
                  ? "Default Order"
                  : "Custom Arrangement Active"}
              </h3>
              <p className="text-sm text-gray-600">
                {isEditMode
                  ? "You are editing products for a specific category. Arrange products and save to update."
                  : isDefaultState
                  ? "Drag and drop to arrange categories and products, then save your custom arrangement."
                  : "Your custom arrangement is saved. Continue editing or reset to default order."}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Mode Header */}
        {isEditMode && (
          <div className="mb-6 p-4 bg-white rounded border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center"
                  style={{ backgroundColor: colors.primary.medium }}
                >
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Category Products
                  </h3>
                  <p className="text-sm text-gray-600">
                    Editing products for: {orderedCategories.find(cat => cat._id === editCategoryId)?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSearchParams({});
                  navigate('/quick-shopping');
                }}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Back to All Categories
              </button>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-6">
          {(isEditMode 
            ? orderedCategories.filter(cat => cat._id === editCategoryId)
            : orderedCategories
          ).map((category, categoryIndex) => (
            <DraggableItem
              key={category._id}
              item={category}
              type="category"
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
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-gray-500" />
                      {category.name}
                    </h2>
                    {!isDefaultState && (
                      <span 
                        className="px-2 py-1 text-xs text-white rounded"
                        style={{ backgroundColor: colors.primary.medium }}
                      >
                        CUSTOM
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {category.products.length} items
                    </span>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">
                        Order:
                      </label>
                      <input
                        type="number"
                        value={category.serialNumber}
                        onChange={(e) =>
                          handleSerialNumberChange(
                            "category",
                            category._id,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-gray-500"
                        min="1"
                      />
                    </div>
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
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {category.products.map((product, index) => (
                      <DraggableItem
                        key={product._id}
                        item={product}
                        type="product"
                        fromCategory={category._id}
                      >
                        <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="flex items-center justify-center w-6 h-6 rounded text-sm font-medium text-white"
                            style={{ backgroundColor: colors.primary.medium }}
                          >
                            {!isDefaultState ? product.serialNumber : index + 1}
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
                                    style={{ backgroundColor: colors.status.error }}
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
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="number"
                            value={product.serialNumber}
                            onChange={(e) =>
                              handleSerialNumberChange(
                                "product",
                                product._id,
                                parseInt(e.target.value) || 1,
                                category._id
                              )
                            }
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-gray-500 text-center"
                            min="1"
                          />
                        </td>
                      </tr>
                      </DraggableItem>
                    ))}
                  </tbody>
                </table>
              </div>
            </DraggableItem>
          ))}
        </div>
      </div>
    </DragDropProvider>
  );
};
