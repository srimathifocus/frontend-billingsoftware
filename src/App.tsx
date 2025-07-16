import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./hooks/useAuth.tsx";
import { ThemeProvider } from "./hooks/useTheme.tsx";
import { PrivateRoute } from "./components/PrivateRoute";
import { Layout } from "./components/Layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BannersPage } from "./pages/BannersPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { QuickShoppingPage } from "./pages/QuickShoppingPageSimple";
import { QuickShoppingViewPage } from "./pages/QuickShoppingViewPage";
import { QuickShoppingTableView } from "./pages/QuickShoppingTableView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Only refetch manually or when needed
      retry: 2,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
      refetchOnMount: "always", // Always fetch fresh data when component mounts
      refetchOnReconnect: true, // Refetch when connection is restored
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes - Each route wrapped individually */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Navigate to="/dashboard" replace />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <DashboardPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/banners/*"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <BannersPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/categories/*"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ErrorBoundary
                          fallback={
                            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                              <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
                                Categories Page Error
                              </h2>
                              <p className="text-red-600 dark:text-red-300 mb-4">
                                There was a problem loading the categories data.
                                This might be due to a server issue or data
                                format problem.
                              </p>
                              <div className="flex space-x-4">
                                <button
                                  onClick={() => window.location.reload()}
                                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                  Reload Page
                                </button>
                                <button
                                  onClick={() =>
                                    (window.location.href = "/dashboard")
                                  }
                                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                >
                                  Go to Dashboard
                                </button>
                              </div>
                            </div>
                          }
                        >
                          <CategoriesPage />
                        </ErrorBoundary>
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Redirect /subcategories to /categories?view=subcategories */}
                <Route
                  path="/subcategories/*"
                  element={
                    <PrivateRoute>
                      <Navigate to="/categories?view=subcategories" replace />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/products"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ProductsPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/products/:id"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ProductDetailPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/quick-shopping"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <QuickShoppingPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/quick-shopping-view"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <QuickShoppingViewPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/quick-shopping/view"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <QuickShoppingViewPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/quick-shopping-table"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <QuickShoppingTableView />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Fallback route */}
                <Route
                  path="*"
                  element={
                    <PrivateRoute>
                      <Navigate to="/dashboard" replace />
                    </PrivateRoute>
                  }
                />
              </Routes>

              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
