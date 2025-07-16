import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  ArrowLeft,
  Utensils,
  Star,
  Printer,
  Eye,
  Edit3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getQuickShoppingOrder,
  getCategoriesWithProducts,
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

export const QuickShoppingTableView: React.FC = () => {
  const navigate = useNavigate();

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

    // If we have a saved order, use it
    if (savedOrder && savedOrder.length > 0) {
      const viewCategories: ViewCategory[] = savedOrder
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
            .filter(Boolean) as ViewProduct[];

          return {
            _id: originalCategory._id,
            name: originalCategory.name,
            serialNumber: savedCat.serialNumber,
            products: orderedProducts,
          };
        })
        .filter(Boolean) as ViewCategory[];

      return viewCategories;
    }

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

  if (isLoadingSavedOrder || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4"
            style={{
              borderColor: colors.primary.medium,
              borderTopColor: "transparent",
            }}
          ></div>
          <p className="text-lg font-medium text-gray-700">
            Loading table view...
          </p>
        </div>
      </div>
    );
  }

  // Show empty state only if no categories exist at all
  if (!categoriesWithProducts || categoriesWithProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate("/quick-shopping")}
              className="flex items-center px-4 py-2 text-white rounded transition-opacity mr-4"
              style={{ backgroundColor: colors.primary.medium }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = colors.primary.dark)
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = colors.primary.medium)
              }
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Setup
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Utensils className="w-8 h-8 mr-3 text-gray-400" />
              Quick Shopping Table
            </h1>
          </div>

          <div className="bg-white rounded border border-gray-200 p-12 text-center">
            <Package className="w-20 h-20 mx-auto mb-6 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Categories Available
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Please add categories and products first
            </p>
            <button
              onClick={() => navigate("/categories")}
              className="px-8 py-4 text-white rounded transition-opacity text-lg font-semibold"
              style={{ backgroundColor: colors.primary.medium }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = colors.primary.dark)
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = colors.primary.medium)
              }
            >
              Add Categories
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hide on print */}
      <div className="bg-white shadow-sm border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/quick-shopping")}
                className="flex items-center px-4 py-2 text-white rounded transition-opacity"
                style={{ backgroundColor: colors.primary.medium }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = colors.primary.dark)
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = colors.primary.medium)
                }
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Setup
              </button>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{ backgroundColor: colors.primary.medium }}
                >
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Quick Shopping Table View
                  </h1>
                  <p className="text-gray-600 flex items-center">
                    <div
                      className="w-2 h-2 rounded-full mr-2"
                      style={{
                        backgroundColor:
                          savedOrder && savedOrder.length > 0
                            ? colors.primary.medium
                            : colors.neutral.gray[400],
                      }}
                    />
                    <span className="font-medium mr-2">
                      {savedOrder && savedOrder.length > 0
                        ? "Custom Arrangement"
                        : "Default Order"}
                    </span>
                    • {processedCategories.length} Categories
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate("/quick-shopping-view")}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2 inline" />
                Card View
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm text-white rounded transition-colors"
                style={{ backgroundColor: colors.primary.medium }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = colors.primary.dark)
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = colors.primary.medium)
                }
              >
                <Printer className="w-4 h-4 mr-2 inline" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary - Hide on print */}
      {savedOrder && savedOrder.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-4 print:hidden">
          <div className="bg-white border border-gray-200 rounded p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Custom Arrangement Summary
            </h3>
            <div className="space-y-3">
              {processedCategories.map((category) => (
                <div
                  key={category._id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: colors.status.success }}
                    >
                      {category.serialNumber}
                    </div>
                    <span className="text-base font-semibold text-gray-900">
                      {category.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({category.products.length} products)
                    </span>
                    <button
                      onClick={() =>
                        navigate(`/quick-shopping?editCategory=${category._id}`)
                      }
                      className="ml-3 px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                      title="Edit this category's product arrangement"
                    >
                      <Edit3 className="w-3 h-3 mr-1 inline" />
                      Edit
                    </button>
                  </div>

                  {/* Products List - Compact for table view */}
                  <div className="flex flex-wrap gap-2 ml-9">
                    {category.products.map((product, index) => (
                      <div
                        key={product._id}
                        className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-700 rounded px-2 py-1"
                      >
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-xs"
                          style={{ backgroundColor: colors.primary.medium }}
                        >
                          {product.serialNumber}
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {product.name.length > 15
                            ? product.name.substring(0, 15) + "..."
                            : product.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* A4 Table Content */}
      <div className="max-w-7xl mx-auto p-6 print:p-4 print:max-w-full">
        <div className="bg-white rounded border border-gray-200 overflow-hidden print:shadow-none print:rounded-none">
          {/* Table Header */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-4 w-16">
                    <div className="flex items-center justify-center">#</div>
                  </th>
                  <th scope="col" className="px-6 py-4 w-24">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Image
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4">
                    <div className="flex items-center">Product Name</div>
                  </th>
                  <th scope="col" className="px-6 py-4 w-32">
                    <div className="flex items-center">Product Price</div>
                  </th>
                  <th scope="col" className="px-6 py-4 w-32">
                    <div className="flex items-center">Offer Price</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedCategories.map((category) => (
                  <React.Fragment key={category._id}>
                    {/* Category Header Row */}
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 border-b border-gray-200 dark:border-gray-700">
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-center"
                        style={{ backgroundColor: colors.primary.light + "20" }}
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              savedOrder && savedOrder.length > 0
                                ? "ring-2 ring-green-400"
                                : ""
                            }`}
                            style={{
                              backgroundColor:
                                savedOrder && savedOrder.length > 0
                                  ? colors.status.success
                                  : colors.primary.medium,
                            }}
                          >
                            {category.serialNumber}
                          </div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                            {category.name}
                          </h2>
                          {savedOrder && savedOrder.length > 0 && (
                            <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full font-medium">
                              ✓ Custom Order
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Product Rows */}
                    {category.products.map((product, index) => (
                      <tr
                        key={product._id}
                        className={`${
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800"
                        } border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
                      >
                        {/* Serial Number */}
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                                savedOrder && savedOrder.length > 0
                                  ? "ring-1 ring-green-400"
                                  : ""
                              }`}
                              style={{
                                backgroundColor:
                                  savedOrder && savedOrder.length > 0
                                    ? colors.status.success
                                    : colors.primary.medium,
                              }}
                            >
                              {savedOrder && savedOrder.length > 0
                                ? product.serialNumber
                                : index + 1}
                            </div>
                          </div>
                        </td>

                        {/* Product Image */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            {product.images.length > 0 ? (
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                                style={{
                                  borderColor: colors.primary.light + "50",
                                }}
                              />
                            ) : (
                              <div
                                className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                                style={{
                                  borderColor: colors.primary.light + "50",
                                }}
                              >
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Product Name */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900 dark:text-white text-lg">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Code: {product.productCode}
                            </div>
                          </div>
                        </td>

                        {/* Product Price */}
                        <td className="px-6 py-4">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            ₹{product.price.toFixed(2)}
                          </div>
                        </td>

                        {/* Offer Price */}
                        <td className="px-6 py-4">
                          {product.offerPrice &&
                          product.offerPrice < product.price ? (
                            <div className="space-y-1">
                              <div
                                className="text-lg font-bold"
                                style={{ color: colors.status.success }}
                              >
                                ₹{product.offerPrice.toFixed(2)}
                              </div>
                              <div className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded-full font-medium inline-block">
                                SAVE ₹
                                {(product.price - product.offerPrice).toFixed(
                                  2
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                              No offer
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer - Hide on print */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
              <Utensils className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Quick Shopping Table View
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            This table view shows all categories and products in the arranged
            order. Use the print button to get a physical copy or navigate back
            to setup to make changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickShoppingTableView;
