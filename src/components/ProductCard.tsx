import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Tag,
  Package,
  Edit,
  Trash2,
  Eye,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Product } from "../types";
import { colors, themeConfig } from "../theme/colors";
import { createProductSlug } from "../utils/slugify";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  variant?: "default" | "cube";
}

export const ProductCard = ({
  product,
  onEdit,
  onDelete,
  variant = "default",
}: ProductCardProps) => {
  const navigate = useNavigate();

  const [imageLoaded, setImageLoaded] = useState(false);

  const discountPercentage = product.offerPrice
    ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
    : 0;

  const handleViewProduct = () => {
    const slug = createProductSlug(product.name, product._id);
    navigate(`/products/${slug}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(product);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(product);
  };

  if (variant === "cube") {
    return (
      <div className="group relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 transform hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-102 sm:hover:scale-105">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
          {product.images && product.images.length > 0 ? (
            <>
              <img
                src={product.images[0].url}
                alt={product.name}
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 sm:group-hover:scale-125 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package size={24} className="sm:w-8 sm:h-8 text-gray-400" />
            </div>
          )}

          {/* Enhanced Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

          {/* Overlay Actions - Hidden on mobile, shown on desktop */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100 hidden sm:flex">
            <button
              onClick={handleViewProduct}
              className="inline-flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/95 text-gray-800 rounded-full hover:bg-white transition-colors shadow-xl backdrop-blur-sm font-medium text-xs sm:text-sm"
              title="View Details"
            >
              <Eye size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">View Details</span>
              <span className="sm:hidden">View</span>
            </button>
          </div>

          {/* Enhanced Badges */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col space-y-1 sm:space-y-2">
            {product.bestSeller && (
              <span className="inline-flex items-center space-x-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-full text-xs font-bold shadow-lg animate-pulse">
                <Star
                  size={8}
                  className="sm:w-2.5 sm:h-2.5"
                  fill="currentColor"
                />
                <span className="hidden sm:inline">BEST</span>
                <span className="sm:hidden">★</span>
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-xs font-bold shadow-lg">
                -{discountPercentage}%
              </span>
            )}
            {!product.inStock && (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-500 text-white rounded-full text-xs font-bold shadow-lg">
                <span className="hidden sm:inline">OUT OF STOCK</span>
                <span className="sm:hidden">OUT</span>
              </span>
            )}
          </div>

          {/* Admin Actions - Always visible on mobile, hover on desktop */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col space-y-1 sm:space-y-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform sm:translate-x-4 sm:group-hover:translate-x-0">
            <button
              onClick={handleEdit}
              className="p-1.5 sm:p-2 bg-blue-500/90 text-white rounded-full hover:bg-blue-600/90 transition-colors shadow-lg backdrop-blur-sm"
              title="Edit Product"
            >
              <Edit size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 sm:p-2 bg-red-500/90 text-white rounded-full hover:bg-red-600/90 transition-colors shadow-lg backdrop-blur-sm"
              title="Delete Product"
            >
              <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Stock Status */}
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex flex-col space-y-1">
            <span
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium backdrop-blur-sm shadow-lg ${
                product.inStock
                  ? "bg-green-500/90 text-white"
                  : "bg-red-500/90 text-white"
              }`}
            >
              <span className="hidden sm:inline">
                {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
              <span className="sm:hidden">{product.inStock ? "✓" : "✗"}</span>
            </span>

            {/* Active Status */}
            {product.isActive === false && (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-500/90 text-white rounded-full text-xs font-medium backdrop-blur-sm shadow-lg">
                <span className="hidden sm:inline">Inactive</span>
                <span className="sm:hidden">I</span>
              </span>
            )}

            {/* Stock Quantity */}
            {product.stockQuantity !== undefined &&
              product.stockQuantity > 0 && (
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-500/90 text-white rounded-full text-xs font-medium backdrop-blur-sm shadow-lg">
                  <span className="hidden sm:inline">
                    Qty: {product.stockQuantity}
                  </span>
                  <span className="sm:hidden">Q:{product.stockQuantity}</span>
                </span>
              )}
          </div>

          {/* Mobile Touch Target for View Details */}
          <div
            className="absolute inset-0 sm:hidden"
            onClick={handleViewProduct}
          ></div>
        </div>

        {/* Enhanced Content */}
        <div className="p-2 sm:p-4">
          <div className="mb-1 sm:mb-2">
            <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
              #{product.productCode}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {product.offerPrice ? (
                <>
                  <span className="text-sm sm:text-lg font-bold text-green-600">
                    ₹{product.offerPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 line-through">
                    ₹{product.price.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                  ₹{product.price.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Tags Preview - Show fewer tags on mobile */}
          {product.tags.length > 0 && (
            <div className="mt-1 sm:mt-2 flex flex-wrap gap-1">
              {product.tags.slice(0, 1).map((tag, index) => (
                <span
                  key={index}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {product.tags.length > 1 && (
                <span className="text-xs text-gray-500 px-1.5 sm:px-2 py-0.5 sm:py-1">
                  +{product.tags.length - 1}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 transform hover:-translate-y-2 cursor-pointer"
      onClick={handleViewProduct}
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
        {product.images && product.images.length > 0 ? (
          <>
            <img
              src={product.images[0].url}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package size={48} className="text-gray-400" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Admin Action Buttons */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
          <button
            onClick={handleEdit}
            className="p-2 bg-blue-500/90 text-white rounded-full hover:bg-blue-600/90 transition-colors backdrop-blur-sm shadow-lg"
            title="Edit Product"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-red-500/90 text-white rounded-full hover:bg-red-600/90 transition-colors backdrop-blur-sm shadow-lg"
            title="Delete Product"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          {product.bestSeller && (
            <div className="inline-flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-full text-xs font-bold shadow-lg animate-pulse">
              <Star size={12} fill="currentColor" />
              <span>BEST SELLER</span>
              <TrendingUp size={12} />
            </div>
          )}
          {discountPercentage > 0 && (
            <div className="inline-flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-xs font-bold shadow-lg">
              <Zap size={12} />
              <span>{discountPercentage}% OFF</span>
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div className="absolute bottom-4 left-4 flex flex-col space-y-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm shadow-lg ${
              product.inStock
                ? "bg-green-500/90 text-white"
                : "bg-red-500/90 text-white"
            }`}
          >
            {product.inStock ? "In Stock" : "Out of Stock"}
          </span>

          {/* Active Status */}
          {product.isActive === false && (
            <span className="px-3 py-1 bg-gray-500/90 text-white rounded-full text-xs font-medium backdrop-blur-sm shadow-lg">
              Inactive
            </span>
          )}

          {/* Stock Quantity */}
          {product.stockQuantity !== undefined && product.stockQuantity > 0 && (
            <span className="px-3 py-1 bg-blue-500/90 text-white rounded-full text-xs font-medium backdrop-blur-sm shadow-lg">
              Qty: {product.stockQuantity}
            </span>
          )}
        </div>

        {/* Quick View Button */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewProduct();
            }}
            className="inline-flex items-center space-x-1 px-3 py-1 bg-white/90 text-gray-800 rounded-full text-xs font-medium hover:bg-white transition-colors backdrop-blur-sm shadow-lg"
          >
            <Eye size={12} />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Product Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
              #{product.productCode}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
          {product.description}
        </p>

        {/* Price Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            {product.offerPrice ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-green-600">
                    ₹{product.offerPrice.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    ₹{product.price.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-green-600 font-medium">
                  Save ₹{(product.price - product.offerPrice).toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {product.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
            {product.tags.length > 2 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{product.tags.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewProduct();
          }}
          disabled={!product.inStock}
          className={`w-full inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
            product.inStock
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transform hover:scale-105"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {product.inStock ? (
            <>
              <Eye size={18} />
              <span>View Details</span>
            </>
          ) : (
            <>
              <Package size={18} />
              <span>Out of Stock</span>
            </>
          )}
        </button>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Added {new Date(product.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center space-x-1">
            {product.bestSeller && (
              <Star size={14} className="text-yellow-500" fill="currentColor" />
            )}
            {product.offerPrice && <Tag size={14} className="text-green-500" />}
          </div>
        </div>
      </div>
    </div>
  );
};
