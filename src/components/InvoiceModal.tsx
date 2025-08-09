import { useState, useRef, useEffect } from "react";
import {
  X,
  Download,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  IndianRupee,
  Package,
  CheckCircle,
  Clock,
  Printer,
} from "lucide-react";
import { JewelryInvoice } from "./JewelryInvoice";
import { PDFViewer } from "./PDFViewer";
import { colors } from "../theme/colors";
import { fetchShopDetails } from "../utils/api";

// Get API base URL based on environment
const getApiBaseUrl = () => {
  return (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV
      ? "/api" // Use Vite proxy in development
      : "https://backend-billingsoftware.onrender.com/api")
  ); // Production backend URL
};

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  loanObjectId: string;
  type: "success" | "view";
  invoiceData?: {
    customerName: string;
    customerPhone: string;
    loanAmount: number;
    totalAmount?: number;
    repaymentDate?: string;
    payment?: {
      cash: number;
      online: number;
    };
    items: Array<{
      name: string;
      category: string;
      weight: number;
      estimatedValue: number;
    }>;
  };
}

const downloadInvoice = async (
  loanId: string,
  type: "billing" | "repayment"
) => {
  try {
    const endpoint =
      type === "billing"
        ? `/invoice/loan/${loanId}/pdf`
        : `/invoice/repayment/${loanId}/pdf`;
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem("admin_token")}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download invoice: ${errorText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const prefix = type === "billing" ? "B" : "R";
    link.download = `${prefix}-${loanId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert(`Failed to download ${type} invoice. Please try again.`);
  }
};

export const InvoiceModal = ({
  isOpen,
  onClose,
  loanId,
  loanObjectId,
  type,
  invoiceData,
}: InvoiceModalProps) => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [shopDetails, setShopDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Generate PDF URL for preview
  const generatePdfUrl = (invoiceType: "billing" | "repayment") => {
    const endpoint =
      invoiceType === "billing"
        ? `/invoice/loan/${loanObjectId}/pdf`
        : `/invoice/repayment/${loanObjectId}/pdf`;
    const token = sessionStorage.getItem("admin_token");
    return `${getApiBaseUrl()}${endpoint}?token=${token}&timestamp=${Date.now()}`;
  };

  // Fetch shop details and load PDF on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setPdfLoading(true);

        // Load shop details
        const details = await fetchShopDetails();
        setShopDetails(details);

        // Generate PDF URL for preview
        const invoiceType = type === "success" ? "repayment" : "billing";
        const url = generatePdfUrl(invoiceType);
        setPdfUrl(url);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // Fallback shop details will be used from the API function
      } finally {
        setLoading(false);
        setPdfLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, loanObjectId, type]);

  if (!isOpen) return null;

  const handleDownload = async (invoiceType: "billing" | "repayment") => {
    setDownloading(invoiceType);
    await downloadInvoice(loanObjectId, invoiceType);
    setDownloading(null);
  };

  const handlePrint = () => {
    if (pdfUrl) {
      // Open the PDF in a new window and trigger print
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else {
      alert("PDF is still loading. Please wait and try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: colors.primary[100] }}
            >
              {type === "success" ? (
                <CheckCircle
                  className="h-6 w-6"
                  style={{ color: colors.primary.dark }}
                />
              ) : (
                <FileText
                  className="h-6 w-6"
                  style={{ color: colors.primary.dark }}
                />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {type === "success"
                  ? "Payment Successful!"
                  : "🎉 Billing Created Successfully!"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loan ID:{" "}
                <span className="font-bold text-blue-600">{loanId}</span> |
                Professional invoice ready for download and print
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Action Buttons Section */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-blue-200 dark:border-gray-600">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
              📋 Invoice Actions Available
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* View Invoice */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="mb-2">
                    <FileText className="h-8 w-8 mx-auto text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                    👁️ View Invoice
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Same PDF content as download
                  </p>
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    ✅ PDF preview below
                  </div>
                </div>
              </div>

              {/* Print Invoice */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="mb-2">
                    <Printer className="h-8 w-8 mx-auto text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                    🖨️ Print Invoice
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Same PDF format as download
                  </p>
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm w-full"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Now</span>
                  </button>
                </div>
              </div>

              {/* Download Invoice */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="mb-2">
                    <Download className="h-8 w-8 mx-auto text-purple-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                    💾 Download PDF
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Professional PDF invoice
                  </p>
                  <button
                    onClick={() => handleDownload("billing")}
                    disabled={downloading === "billing"}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full"
                  >
                    {downloading === "billing" ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {type === "success" && (
            <div
              className="rounded-lg p-4 mb-6"
              style={{ backgroundColor: colors.primary[50] }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle
                  className="h-5 w-5"
                  style={{ color: colors.primary.dark }}
                />
                <span
                  className="font-medium"
                  style={{ color: colors.primary.dark }}
                >
                  Loan has been fully repaid
                </span>
              </div>
              <p className="text-sm" style={{ color: colors.primary.medium }}>
                The loan has been successfully repaid. You can download both
                billing and repayment invoices below.
              </p>
            </div>
          )}

          {/* Professional PDF Invoice Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-center flex-1">
                Professional PDF Invoice Preview
              </h3>
              <button
                onClick={handlePrint}
                disabled={!pdfUrl || pdfLoading}
                className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Print Invoice"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
            </div>
            <div className="flex justify-center">
              <div className="border-2 border-gray-300 dark:border-gray-600 shadow-lg rounded-lg overflow-hidden bg-white">
                {pdfUrl ? (
                  <PDFViewer
                    pdfUrl={pdfUrl}
                    width={500}
                    height={700}
                    scale={0.8}
                    onLoadError={(error) => {
                      console.error("PDF load error:", error);
                    }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center"
                    style={{ width: 500, height: 700 }}
                  >
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Loading PDF preview...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Loan Info */}
          {invoiceData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Customer Details</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {invoiceData.customerName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {invoiceData.customerPhone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <IndianRupee className="h-4 w-4" />
                  <span>Payment Details</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Loan Amount:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      ₹{invoiceData.loanAmount.toLocaleString()}
                    </span>
                  </div>
                  {invoiceData.totalAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total Paid:
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        ₹{invoiceData.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {invoiceData.repaymentDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Repaid On:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(
                          invoiceData.repaymentDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          {invoiceData?.items && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2 mb-3">
                <Package className="h-4 w-4" />
                <span>Pledged Items</span>
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="space-y-2">
                  {invoiceData.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          ({item.category})
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900 dark:text-white">
                          {item.weight}g
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          ₹{item.estimatedValue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Summary */}
          <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  📋 Invoice Ready!
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your professional invoice is generated and ready for use
                </p>
              </div>
              <div className="flex space-x-2">
                <div className="text-center px-3 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Status
                  </div>
                  <div className="text-sm font-bold text-green-600">
                    ✅ Ready
                  </div>
                </div>
                <div className="text-center px-3 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Format
                  </div>
                  <div className="text-sm font-bold text-blue-600">
                    📄 A4 PDF
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
