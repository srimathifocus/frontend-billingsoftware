import { NavLink } from "react-router-dom";
import { LayoutDashboard, Image, FolderTree, Package, Zap } from "lucide-react";
import { colors, themeConfig } from "../../theme/colors";

const navItems = [
  {
    path: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    path: "/quick-shopping",
    icon: Zap,
    label: "Quick Shop",
  },
  {
    path: "/banners",
    icon: Image,
    label: "Banners",
  },
  {
    path: "/categories",
    icon: FolderTree,
    label: "Categories",
  },
  {
    path: "/products",
    icon: Package,
    label: "Products",
  },
];

export const BottomNav = () => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 w-full">
      <div className="flex items-center justify-around py-1.5 sm:py-2 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center space-y-0.5 sm:space-y-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-colors ${
                isActive ? "text-white" : "text-gray-600 dark:text-gray-400"
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? colors.primary.medium : undefined,
            })}
          >
            <item.icon size={18} className="sm:w-5 sm:h-5" />
            <span className="text-xs font-medium truncate max-w-[50px] sm:max-w-none">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
