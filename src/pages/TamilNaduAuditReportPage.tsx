import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  FileText,
  Calendar,
  TrendingUp,
  Download,
  Filter,
  ArrowLeft,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  CheckSquare,
  Square,
  Eye,
  ChevronDown,
  ChevronUp,
  Building,
  Shield,
  AlertTriangle,
  CheckCircle,
  Camera,
  Database,
  Printer,
  Share2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

// Types for Tamil Nadu Audit Report
interface BusinessDetails {
  proprietorName: string;
  gstin: string;
  pan: string;
  shopType: string;
  accountingSoftware: string;
  licenseNo: string;
  location: string;
  auditFirm: string;
}

interface ProfitLoss {
  revenue: {
    interestIncomeFromLoans: number;
    saleOfForfeitedItems: number;
    otherOperatingIncome: number;
    totalRevenue: number;
  };
  expenses: {
    employeeSalaries: number;
    officeRent: number;
    goldAppraiserCharges: number;
    utilitiesInternet: number;
    accountingAuditFees: number;
    miscellaneousExpenses: number;
    totalExpenses: number;
  };
  netProfitBeforeTax: number;
}

interface BalanceSheet {
  assets: {
    cashInHandBank: number;
    goldLoanReceivables: number;
    inventoryForfeitedItems: number;
    officeEquipment: number;
    totalAssets: number;
  };
  liabilitiesEquity: {
    proprietorCapital: number;
    sundryCreditors: number;
    taxesPayableGST: number;
    totalLiabilitiesEquity: number;
  };
}

interface LoanRegisterDetail {
  loanId: string;
  customerName: string;
  itemDescription: string;
  itemWeight: number;
  loanAmount: number;
  interestPercent: number;
  status: string;
  loanDate: string;
}

interface LoanRegisterSummary {
  totalPledgedLoans: number;
  activeLoans: number;
  settledLoans: number;
  forfeitedLoans: number;
  totalLoanValue: number;
  averageInterestRate: number;
}

interface Compliance {
  kycCollection: number;
  panForHighValueLoans: number;
  cctvInstalled: boolean;
  goldAppraisalByAuthorizedValuer: boolean;
  authorizedValuerName: string;
  insuranceOnPledgedGold: number;
  gstFilingStatus: string;
  itReturnsStatus: string;
  registersMaintenanceStatus: string;
}

interface AuditorObservations {
  observations: string[];
  conclusion: string;
  auditorName: string;
  auditorQualification: string;
  membershipNo: string;
  auditDate: Date;
}

interface TamilNaduAuditReportData {
  title: string;
  generatedOn: Date;
  generatedBy: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  shopDetails: {
    name: string;
    licenseNo: string;
    location: string;
    proprietorName: string;
    gstin: string;
    pan: string;
  };
  businessDetails: BusinessDetails;
  profitLoss: ProfitLoss;
  balanceSheet: BalanceSheet;
  loanRegisterSummary: LoanRegisterSummary;
  loanRegisterDetails: LoanRegisterDetail[];
  compliance: Compliance;
  auditorObservations: AuditorObservations;
  summary: {
    totalLoansIssued: number;
    totalLoanAmount: number;
    totalRepayments: number;
    totalRepaymentAmount: number;
    totalInterestEarned: number;
  };
}

interface ReportFilter {
  reportType: "monthly" | "yearly" | "financial" | "custom";
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}

export const TamilNaduAuditReportPage = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<ReportFilter>({
    reportType: "monthly",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["business", "profitloss", "balancesheet"])
  );

  // Fetch Tamil Nadu audit report
  const {
    data: auditReport,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tamilNaduAuditReport", filters],
    queryFn: async (): Promise<{
      success: boolean;
      data: TamilNaduAuditReportData;
    }> => {
      const params = new URLSearchParams();
      params.append("reportType", filters.reportType);

      if (filters.reportType === "monthly" && filters.month && filters.year) {
        params.append("month", filters.month.toString());
        params.append("year", filters.year.toString());
      } else if (filters.reportType === "yearly" && filters.year) {
        params.append("year", filters.year.toString());
      } else if (filters.reportType === "financial" && filters.year) {
        params.append("year", filters.year.toString());
      } else if (
        filters.reportType === "custom" &&
        filters.startDate &&
        filters.endDate
      ) {
        params.append("startDate", filters.startDate);
        params.append("endDate", filters.endDate);
      }

      const response = await api.get(
        `/finance/audit-report?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!(
      (filters.reportType === "monthly" && filters.month && filters.year) ||
      (filters.reportType === "yearly" && filters.year) ||
      (filters.reportType === "financial" && filters.year) ||
      (filters.reportType === "custom" && filters.startDate && filters.endDate)
    ),
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 5 + i
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleDownloadPDF = () => {
    if (!auditReport?.data) {
      toast.error("No report data available to download");
      return;
    }

    // Create a printable version
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Generating Tamil Nadu Audit Report...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tamil Nadu Audit Report
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                As per Tamil Nadu & Indian Government Norms
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/tamil-nadu-finance")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Finance Management
            </button>
            {auditReport?.data && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Report Type:
            </span>
          </div>
          <select
            value={filters.reportType}
            onChange={(e) =>
              setFilters({ ...filters, reportType: e.target.value as any })
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="monthly">Monthly Report</option>
            <option value="yearly">Yearly Report</option>
            <option value="financial">Financial Year Report</option>
            <option value="custom">Custom Range</option>
          </select>

          {filters.reportType === "monthly" && (
            <>
              <select
                value={filters.month}
                onChange={(e) =>
                  setFilters({ ...filters, month: parseInt(e.target.value) })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={filters.year}
                onChange={(e) =>
                  setFilters({ ...filters, year: parseInt(e.target.value) })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </>
          )}

          {(filters.reportType === "yearly" ||
            filters.reportType === "financial") && (
            <select
              value={filters.year}
              onChange={(e) =>
                setFilters({ ...filters, year: parseInt(e.target.value) })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}

          {filters.reportType === "custom" && (
            <>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </>
          )}

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-300 font-medium">
              Error generating report
            </p>
          </div>
          <p className="text-red-700 dark:text-red-400 text-sm mt-2">
            {error instanceof Error
              ? error.message
              : "Failed to generate audit report"}
          </p>
        </div>
      )}

      {/* Report Content */}
      {auditReport?.data && (
        <div className="space-y-6" id="audit-report-content">
          {/* Report Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              PAWNSHOP AUDIT REPORT
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              (As per Tamil Nadu & Indian Government Norms)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Shop Name:</span>{" "}
                {auditReport.data.shopDetails.name}
              </div>
              <div>
                <span className="font-medium">License No.:</span>{" "}
                {auditReport.data.shopDetails.licenseNo}
              </div>
              <div>
                <span className="font-medium">Location:</span>{" "}
                {auditReport.data.shopDetails.location}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
              <div>
                <span className="font-medium">Period:</span>{" "}
                {formatDate(auditReport.data.period.startDate)} to{" "}
                {formatDate(auditReport.data.period.endDate)}
              </div>
              <div>
                <span className="font-medium">Generated On:</span>{" "}
                {formatDate(auditReport.data.generatedOn)}
              </div>
            </div>
          </div>

          {/* Section A: Business Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection("business")}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  SECTION A: Business Details
                </h2>
              </div>
              {expandedSections.has("business") ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.has("business") && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Proprietor Name:</span>{" "}
                      {auditReport.data.businessDetails.proprietorName ||
                        auditReport.data.shopDetails.proprietorName}
                    </div>
                    <div>
                      <span className="font-medium">GSTIN:</span>{" "}
                      {auditReport.data.businessDetails.gstin ||
                        auditReport.data.shopDetails.gstin}
                    </div>
                    <div>
                      <span className="font-medium">PAN:</span>{" "}
                      {auditReport.data.businessDetails.pan ||
                        auditReport.data.shopDetails.pan}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Type of Shop:</span>{" "}
                      {auditReport.data.businessDetails.shopType}
                    </div>
                    <div>
                      <span className="font-medium">Accounting Software:</span>{" "}
                      {auditReport.data.businessDetails.accountingSoftware}
                    </div>
                    <div>
                      <span className="font-medium">Date of Audit:</span>{" "}
                      {formatDate(auditReport.data.generatedOn)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section B: Profit & Loss Account */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection("profitloss")}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  SECTION B: Profit & Loss Account
                </h2>
              </div>
              {expandedSections.has("profitloss") ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.has("profitloss") && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3">
                      Revenue
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Interest Income from Loans</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.profitLoss.revenue
                              .interestIncomeFromLoans
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sale of Forfeited Items</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.profitLoss.revenue
                              .saleOfForfeitedItems
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Operating Income</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.profitLoss.revenue
                              .otherOperatingIncome
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Revenue</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.profitLoss.revenue.totalRevenue
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-800 dark:text-red-300 mb-3">
                      Expenses
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Employee Salaries</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.profitLoss.expenses
                              .employeeSalaries
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Office Rent</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.profitLoss.expenses.officeRent
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gold Appraiser Charges</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.profitLoss.expenses
                              .goldAppraiserCharges
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilities & Internet</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.profitLoss.expenses
                              .utilitiesInternet
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Accounting & Audit Fees</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.profitLoss.expenses
                              .accountingAuditFees
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Miscellaneous Expenses</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.profitLoss.expenses
                              .miscellaneousExpenses
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Expenses</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.profitLoss.expenses.totalExpenses
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Net Profit Before Tax</span>
                    <span
                      className={
                        auditReport.data.profitLoss.netProfitBeforeTax >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatCurrency(
                        auditReport.data.profitLoss.netProfitBeforeTax
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section C: Balance Sheet */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection("balancesheet")}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  SECTION C: Balance Sheet
                </h2>
              </div>
              {expandedSections.has("balancesheet") ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.has("balancesheet") && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assets */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
                      Assets
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Cash in Hand/Bank</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.balanceSheet.assets.cashInHandBank
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gold Loan Receivables</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.balanceSheet.assets
                              .goldLoanReceivables
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inventory (Forfeited Items)</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.balanceSheet.assets
                              .inventoryForfeitedItems
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Office Equipment</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.balanceSheet.assets.officeEquipment
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Assets</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.balanceSheet.assets.totalAssets
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3">
                      Liabilities & Equity
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Proprietor Capital</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.balanceSheet.liabilitiesEquity
                              .proprietorCapital
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sundry Creditors</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.balanceSheet.liabilitiesEquity
                              .sundryCreditors
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes Payable (GST)</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.balanceSheet.liabilitiesEquity
                              .taxesPayableGST
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Liabilities + Equity</span>
                        <span>
                          {formatCurrency(
                            auditReport.data.balanceSheet.liabilitiesEquity
                              .totalLiabilitiesEquity
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section D: Loan Register Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection("loanregister")}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  SECTION D: Loan Register Summary
                </h2>
              </div>
              {expandedSections.has("loanregister") ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.has("loanregister") && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {auditReport.data.loanRegisterSummary.totalPledgedLoans}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Pledged Loans
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {auditReport.data.loanRegisterSummary.activeLoans}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Active Loans
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {auditReport.data.loanRegisterSummary.settledLoans}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Settled Loans
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {auditReport.data.loanRegisterSummary.forfeitedLoans}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Forfeited Loans
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-lg font-semibold mb-2">
                    Total Loan Value:{" "}
                    {formatCurrency(
                      auditReport.data.loanRegisterSummary.totalLoanValue
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Average Interest Rate:{" "}
                    {auditReport.data.loanRegisterSummary.averageInterestRate}%
                  </div>
                </div>

                {/* Sample Loan Details */}
                {auditReport.data.loanRegisterDetails &&
                  auditReport.data.loanRegisterDetails.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">
                        Sample Loan Details
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-200 dark:border-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">
                                Loan ID
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">
                                Customer
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">
                                Item
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">
                                Weight (gm)
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">
                                Loan Amt (₹)
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">
                                Interest %
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {auditReport.data.loanRegisterDetails
                              .slice(0, 5)
                              .map((loan, index) => (
                                <tr key={index}>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {loan.loanId}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {loan.customerName}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {loan.itemDescription}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {loan.itemWeight}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {loan.loanAmount.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {loan.interestPercent}%
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        loan.status === "Settled"
                                          ? "bg-green-100 text-green-800"
                                          : loan.status === "Active"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {loan.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Section E: Compliance & Registers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection("compliance")}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  SECTION E: Compliance & Registers
                </h2>
              </div>
              {expandedSections.has("compliance") ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.has("compliance") && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>
                        KYC Collection:{" "}
                        {auditReport.data.compliance.kycCollection}% (Aadhaar +
                        Address Proof)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>
                        PAN for Loans &gt; Rs. 50,000: Available for{" "}
                        {auditReport.data.compliance.panForHighValueLoans} loans
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {auditReport.data.compliance.cctvInstalled ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <span>
                        CCTV Installed:{" "}
                        {auditReport.data.compliance.cctvInstalled
                          ? "Yes (24x7 Recording)"
                          : "No"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {auditReport.data.compliance
                        .goldAppraisalByAuthorizedValuer ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <span>
                        Gold Appraisal by Authorized Valuer:{" "}
                        {auditReport.data.compliance
                          .goldAppraisalByAuthorizedValuer
                          ? `Yes (${auditReport.data.compliance.authorizedValuerName})`
                          : "No"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>
                        Insurance on Pledged Gold: Covered up to{" "}
                        {formatCurrency(
                          auditReport.data.compliance.insuranceOnPledgedGold
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>
                        GST Filing:{" "}
                        {auditReport.data.compliance.gstFilingStatus} (GSTR-1 &
                        3B up-to-date)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>
                        IT Returns:{" "}
                        {auditReport.data.compliance.itReturnsStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>
                        Registers Maintained:{" "}
                        {auditReport.data.compliance.registersMaintenanceStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section F: Auditor Observations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toggleSection("auditor")}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  SECTION F: Auditor Observations
                </h2>
              </div>
              {expandedSections.has("auditor") ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {expandedSections.has("auditor") && (
              <div className="px-6 pb-6">
                {auditReport.data.auditorObservations.observations &&
                  auditReport.data.auditorObservations.observations.length >
                    0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3">Observations:</h4>
                      <ul className="list-disc list-inside space-y-2">
                        {auditReport.data.auditorObservations.observations.map(
                          (observation, index) => (
                            <li
                              key={index}
                              className="text-gray-700 dark:text-gray-300"
                            >
                              {observation}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Conclusion:</h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {auditReport.data.auditorObservations.conclusion ||
                      "The books of accounts, compliance registers, and statutory obligations were reviewed and found to be in accordance with Tamil Nadu Pawnbrokers Act, Income Tax Act, and GST Act."}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="text-right">
                    <p className="font-semibold">Signed:</p>
                    <p>
                      {auditReport.data.auditorObservations.auditorName ||
                        "Auditor Name"}
                    </p>
                    <p>
                      {auditReport.data.auditorObservations
                        .auditorQualification || "Qualification"}
                    </p>
                    <p>
                      Membership No:{" "}
                      {auditReport.data.auditorObservations.membershipNo ||
                        "N/A"}
                    </p>
                    <p>
                      Date:{" "}
                      {formatDate(
                        auditReport.data.auditorObservations.auditDate ||
                          auditReport.data.generatedOn
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!auditReport?.data && !isLoading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Report Generated
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please select the report parameters and click "Generate Report" to
            create your Tamil Nadu audit report.
          </p>
        </div>
      )}
    </div>
  );
};

export default TamilNaduAuditReportPage;
