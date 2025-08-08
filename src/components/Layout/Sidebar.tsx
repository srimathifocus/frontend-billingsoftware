import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Banknote,
  Receipt,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  Eye,
  Search,
  Package,
  Settings,
  Users,
  UserCog,
} from "lucide-react";
import { colors, themeConfig } from "../../theme/colors";
import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    path: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    label: "Billing",
    icon: CreditCard,
    id: "billing",
    submenu: [{ path: "/billing/create", label: "Create Billing", icon: Plus }],
  },
  {
    label: "Loans",
    icon: Banknote,
    id: "loans",
    submenu: [
      { path: "/loans/active", label: "Active Loans", icon: List },
      { path: "/loans/inactive", label: "Completed Loans", icon: Eye },
      { path: "/repayment", label: "Search Repayment", icon: Search },
    ],
  },
  {
    path: "/repayments/manage",
    icon: Receipt,
    label: "💰 Loan Repayments",
  },
  {
    path: "/customers",
    icon: Users,
    label: "Customer Management",
  },
  {
    label: "Admin",
    icon: Settings,
    id: "admin",
    submenu: [
      { path: "/admin/profile", label: "Admin Profile", icon: UserCog },
      { path: "/admin/items", label: "Item Management", icon: Package },
      { path: "/admin/managers", label: "Manager Management", icon: Users },
      {
        path: "/admin/modern-finance",
        label: "Finance Management",
        icon: TrendingUp,
      },
      { path: "/admin/expenses", label: "Expense Management", icon: Receipt },
      { path: "/admin/shop-details", label: "Shop Details", icon: Settings },
    ],
  },
  {
    label: "Transactions",
    icon: TrendingUp,
    id: "transactions",
    submenu: [
      { path: "/transactions", label: "Transaction List", icon: List },
      {
        path: "/transactions/report",
        label: "Transaction Reports",
        icon: Receipt,
      },
    ],
  },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [manuallyToggledMenus, setManuallyToggledMenus] = useState<Set<string>>(
    new Set()
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Auto-expand menus based on current location (only for non-manually toggled menus)
  useEffect(() => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    // Find which menu should be expanded based on the current path
    const autoExpandedMenus: string[] = [];

    menuItems.forEach((item) => {
      if (item.submenu) {
        const menuId = item.id || item.label;

        // Skip if this menu was manually toggled
        if (manuallyToggledMenus.has(menuId)) {
          return;
        }

        const shouldExpand = item.submenu.some((subItem) => {
          if (subItem.path) {
            // Check if current path matches and handle search params
            if (subItem.search) {
              return (
                currentPath === subItem.path && currentSearch === subItem.search
              );
            }
            return currentPath === subItem.path;
          }
          return false;
        });

        if (shouldExpand) {
          autoExpandedMenus.push(menuId);
        }
      }
    });

    // Merge auto-expanded menus with manually toggled ones
    setExpandedMenus((prev) => {
      const manuallyExpanded = prev.filter((id) =>
        manuallyToggledMenus.has(id)
      );
      const combined = [
        ...new Set([...manuallyExpanded, ...autoExpandedMenus]),
      ];
      return combined;
    });
  }, [location.pathname, location.search, manuallyToggledMenus]);

  const toggleSubmenu = (id: string) => {
    // Mark this menu as manually toggled
    setManuallyToggledMenus((prev) => new Set(prev).add(id));

    // Toggle the menu state
    setExpandedMenus((prev) => {
      const isCurrentlyExpanded = prev.includes(id);
      if (isCurrentlyExpanded) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleMenuAction = (action: string) => {
    // Handle any future menu actions here
    console.log("Menu action:", action);
  };

  // Check if a menu item is active based on path and search params
  const isMenuItemActive = (item: any) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (item.exact && currentPath === item.path && !currentSearch) {
      return true;
    }

    if (
      item.path === currentPath &&
      item.search &&
      currentSearch === item.search
    ) {
      return true;
    }

    return !item.exact && currentPath === item.path && !item.search;
  };

  const renderMenuItem = (item: any, index: number) => {
    if (item.path && !item.submenu) {
      return (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? "text-white shadow-md"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`
          }
          style={({ isActive }) => ({
            backgroundColor: isActive ? colors.primary.medium : undefined,
          })}
          onClick={() => window.innerWidth < 1024 && onClose()}
        >
          <item.icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      );
    }

    const isExpanded = expandedMenus.includes(item.id || item.label);

    return (
      <div key={item.id || index}>
        <button
          onClick={() => toggleSubmenu(item.id || item.label)}
          className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <item.icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </div>
          {isExpanded ? (
            <ChevronDown size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
          ) : (
            <ChevronRight size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="ml-4 sm:ml-6 mt-1 space-y-1">
            {item.submenu.map((subItem: any, subIndex: number) => {
              if (subItem.path) {
                // Construct the full path with search params if needed
                const fullPath = subItem.search
                  ? `${subItem.path}${subItem.search}`
                  : subItem.path;

                const isActive = isMenuItemActive(subItem);

                return (
                  <NavLink
                    key={`${subItem.path}-${subItem.search || ""}-${subIndex}`}
                    to={fullPath}
                    state={subItem.state}
                    className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? "text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    style={{
                      backgroundColor: isActive
                        ? colors.primary.medium
                        : undefined,
                    }}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                  >
                    <subItem.icon
                      size={14}
                      className="sm:w-4 sm:h-4 flex-shrink-0"
                    />
                    <span className="truncate">{subItem.label}</span>
                  </NavLink>
                );
              } else if (subItem.action) {
                return (
                  <button
                    key={subItem.action}
                    onClick={() => handleMenuAction(subItem.action)}
                    className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 text-sm rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <subItem.icon
                      size={14}
                      className="sm:w-4 sm:h-4 flex-shrink-0"
                    />
                    <span className="truncate">{subItem.label}</span>
                  </button>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-80 lg:w-80`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0"
                style={{ backgroundColor: colors.primary.medium }}
              >
                C
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                  Pawn Shop
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Billing & Loan Management
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
            <div className="space-y-1 sm:space-y-2">
              {menuItems
                .filter((item) => {
                  // Hide admin menu for managers
                  if (item.id === "admin" && user?.role !== "admin") {
                    return false;
                  }
                  return true;
                })
                .map((item, index) => renderMenuItem(item, index))}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};
