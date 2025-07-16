import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Star,
  AlertTriangle,
  CheckCircle,
  Tag,
  DollarSign,
  Image,
  FolderTree,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { DashboardStats } from "../types";
import { colors, themeConfig } from "../theme/colors";

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get("/products/dashboard/stats");
    console.log("Dashboard stats response:", response.data);

    // Handle different possible response structures
    if (response.data.success && response.data.stats) {
      // If the response has a success flag and stats object (new format)
      return response.data.stats;
    } else if (response.data.data) {
      // If the response is wrapped in a data object
      return response.data.data;
    } else if (response.data.success && response.data.data) {
      // If the response has a success flag and data
      return response.data.data;
    } else {
      // If the response is direct
      return response.data;
    }
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);

    // If endpoint doesn't exist (404), try to get stats from existing endpoints
    if (error.response?.status === 404) {
      console.log(
        "Dashboard stats endpoint not found, calculating from products endpoint..."
      );
      return await calculateStatsFromProducts();
    }

    throw error;
  }
};

const calculateStatsFromProducts = async (): Promise<DashboardStats> => {
  try {
    // Fetch all products to calculate stats
    const response = await api.get("/products");
    console.log("Products response for stats calculation:", response.data);

    let products = [];

    // Handle different response structures for products
    if (response.data.data) {
      products = response.data.data;
    } else if (Array.isArray(response.data)) {
      products = response.data;
    } else {
      // Return mock data if products endpoint also fails
      console.log("Using mock data for dashboard stats");
      return {
        totalProducts: 0,
        bestSellers: 0,
        outOfStock: 0,
        inStock: 0,
        productsWithOffer: 0,
        productsOriginalPrice: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        totalStock: 0,
      };
    }

    // Calculate stats from products
    const totalProducts = products.length;
    const bestSellers = products.filter((p) => p.bestSeller).length;
    const outOfStock = products.filter((p) => !p.inStock).length;
    const inStock = products.filter((p) => p.inStock).length;
    const productsWithOffer = products.filter(
      (p) => p.offerPrice && p.offerPrice < p.price
    ).length;
    const activeProducts = products.filter((p) => p.isActive !== false).length;
    const inactiveProducts = products.filter(
      (p) => p.isActive === false
    ).length;
    const totalStock = products.reduce(
      (sum, p) => sum + (p.stockQuantity || 0),
      0
    );
    const productsOriginalPrice = products.reduce(
      (sum, p) => sum + (p.price || 0),
      0
    );

    const stats = {
      totalProducts,
      bestSellers,
      outOfStock,
      inStock,
      productsWithOffer,
      activeProducts,
      inactiveProducts,
      totalStock,
      productsOriginalPrice,
    };

    console.log("Calculated stats from products:", stats);
    return stats;
  } catch (error) {
    console.error("Failed to calculate stats from products:", error);

    // Return mock data as final fallback
    console.log("Using mock data as final fallback");
    return {
      totalProducts: 0,
      bestSellers: 0,
      outOfStock: 0,
      inStock: 0,
      productsWithOffer: 0,
      productsOriginalPrice: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      totalStock: 0,
    };
  }
};

export const DashboardPage = () => {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 px-2 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Loading dashboard data...
          </p>
        </div>
        <div className="flex items-center justify-center min-h-48 sm:min-h-64">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 sm:space-y-8 px-2 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Welcome to your admin dashboard.
          </p>
        </div>
        <div className="text-center p-6 sm:p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <AlertTriangle size={40} className="sm:w-12 sm:h-12 mx-auto mb-2" />
            <h3 className="text-base sm:text-lg font-semibold">
              Failed to load dashboard data
            </h3>
            <p className="text-xs sm:text-sm mt-1">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred"}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts ?? 0,
      icon: Package,
      color: colors.primary.medium,
      bgColor: colors.primary.light + "20",
    },
    {
      title: "Best Sellers",
      value: stats?.bestSellers ?? 0,
      icon: Star,
      color: colors.status.warning,
      bgColor: colors.status.warning + "20",
    },
    {
      title: "Out of Stock",
      value: stats?.outOfStock ?? 0,
      icon: AlertTriangle,
      color: colors.status.error,
      bgColor: colors.status.error + "20",
    },
    {
      title: "In Stock",
      value: stats?.inStock ?? 0,
      icon: CheckCircle,
      color: colors.status.success,
      bgColor: colors.status.success + "20",
    },
    {
      title: "Products on Offer",
      value: stats?.productsWithOffer ?? 0,
      icon: Tag,
      color: colors.status.info,
      bgColor: colors.status.info + "20",
    },
    {
      title: "Total Value",
      value: stats?.productsOriginalPrice
        ? `₹${stats.productsOriginalPrice.toLocaleString()}`
        : "₹0",
      icon: DollarSign,
      color: colors.primary.dark,
      bgColor: colors.primary.dark + "20",
    },
    {
      title: "Active Products",
      value: stats?.activeProducts ?? 0,
      icon: CheckCircle,
      color: colors.status.success,
      bgColor: colors.status.success + "20",
    },
    {
      title: "Inactive Products",
      value: stats?.inactiveProducts ?? 0,
      icon: AlertTriangle,
      color: colors.status.error,
      bgColor: colors.status.error + "20",
    },
    {
      title: "Total Stock",
      value: stats?.totalStock ?? 0,
      icon: Package,
      color: colors.primary.medium,
      bgColor: colors.primary.light + "20",
    },
  ];

  const quickLinks = [
    {
      title: "Manage Banners",
      description: "Upload and manage banner images",
      icon: Image,
      path: "/banners",
      color: colors.primary.medium,
    },
    {
      title: "Categories",
      description: "Organize product categories",
      icon: FolderTree,
      path: "/categories",
      color: colors.primary.light,
    },
    {
      title: "Products",
      description: "Add and manage products",
      icon: Package,
      path: "/products",
      color: colors.primary.dark,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
            Dashboard
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Welcome to your admin dashboard. Here's an overview of your store.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base w-full sm:w-auto"
          disabled={isLoading}
        >
          <RefreshCw
            size={14}
            className={`sm:w-4 sm:h-4 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            style={{
              borderRadius: themeConfig.borderRadius,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                  {stat.title}
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                  {stat.value}
                </p>
              </div>
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: stat.bgColor }}
              >
                <stat.icon
                  size={20}
                  className="sm:w-6 sm:h-6"
                  color={stat.color}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 group"
              style={{
                borderRadius: themeConfig.borderRadius,
              }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: link.color + "20" }}
                >
                  <link.icon
                    size={20}
                    className="sm:w-6 sm:h-6"
                    color={link.color}
                  />
                </div>
                <ArrowRight
                  size={16}
                  className="sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0"
                />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 truncate">
                {link.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm line-clamp-2">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
