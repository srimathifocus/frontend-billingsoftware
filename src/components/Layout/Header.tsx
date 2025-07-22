import { User, Moon, Sun, Menu, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.tsx";
import { useTheme } from "../../hooks/useTheme.tsx";
import { colors, themeConfig } from "../../theme/colors";

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const Header = ({ isSidebarOpen, toggleSidebar }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 w-full">
      <div className="mx-auto px-2 sm:px-4 lg:px-8 max-w-full">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left section - Logo and menu toggle */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 sm:p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {isSidebarOpen ? (
                <X size={20} className="sm:w-6 sm:h-6" />
              ) : (
                <Menu size={20} className="sm:w-6 sm:h-6" />
              )}
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0"
                style={{ backgroundColor: colors.primary.medium }}
              >
                C
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  <span className="hidden sm:inline">BILLING SOFTWARE</span>
                  <span className="sm:hidden">
                    {user?.role === "admin" ? "Admin" : "Manager"}
                  </span>
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  {user?.role === "admin"
                    ? "Only for Administration Purpose"
                    : "Manager Dashboard"}
                </p>
              </div>
            </div>
          </div>

          {/* Right section - Admin info and controls */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isDark ? (
                <Sun size={18} className="sm:w-5 sm:h-5" />
              ) : (
                <Moon size={18} className="sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Admin info */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: colors.primary.dark }}
              >
                <User size={14} className="sm:w-4 sm:h-4" />
              </div>
              <div className="hidden md:block min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] lg:max-w-none">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role === "admin" ? "Administrator" : "Manager"}
                  {user?.branch && ` • Branch: ${user.branch}`}
                </p>
              </div>
              <button
                onClick={logout}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 whitespace-nowrap"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
