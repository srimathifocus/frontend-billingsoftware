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
import { CreateBillingPage } from "./pages/CreateBillingPage";
import { ActiveLoansPage } from "./pages/ActiveLoansPage";
import { InactiveLoansPage } from "./pages/InactiveLoansPage";
import { LoanDetailPage } from "./pages/LoanDetailPage";
import { RepaymentPage } from "./pages/RepaymentPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { ItemManagementPage } from "./pages/ItemManagementPage";
import { CustomerManagementPage } from "./pages/CustomerManagementPage";
import { ManagerOnboardingPage } from "./pages/ManagerOnboardingPage";
import { ManagerListPage } from "./pages/ManagerListPage";
import { TransactionReportPage } from "./pages/TransactionReportPage";
import { AuditReportPage } from "./pages/AuditReportPage";
import { ShopDetailsPage } from "./pages/ShopDetailsPage";
import { ExpenseManagementPage } from "./pages/ExpenseManagementPage";
import { BalanceSheetPage } from "./pages/BalanceSheetPage";
import { AdminProfilePage } from "./pages/AdminProfilePage";

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
                  path="/billing/create"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CreateBillingPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/loans/active"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ActiveLoansPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/loans/inactive"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <InactiveLoansPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/loans/:id"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <LoanDetailPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/repayment"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <RepaymentPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/repayment/:loanId"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <RepaymentPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/transactions"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <TransactionsPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/profile"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <AdminProfilePage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/items"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ItemManagementPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/customers"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CustomerManagementPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/managers"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ManagerOnboardingPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/managers/create"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ManagerOnboardingPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/managers/list"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ManagerListPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/reports/transactions"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <TransactionReportPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/reports/audit"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <AuditReportPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/shop-details"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ShopDetailsPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/expenses"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <ExpenseManagementPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/balance-sheet"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <BalanceSheetPage />
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
