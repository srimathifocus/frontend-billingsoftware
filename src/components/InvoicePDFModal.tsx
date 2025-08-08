import { useState, useEffect, useRef } from "react";
import { X, FileText, Download, AlertCircle } from "lucide-react";
import { colors } from "../theme/colors";
import api from "../utils/api";
import { toast } from "react-toastify";

interface InvoicePDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanObjectId: string;
  loanId: string;
  customerName: string;
  billingAvailable: boolean;
  repaymentAvailable: boolean;
  invoiceType: "billing" | "repayment";
}

export const InvoicePDFModal = ({
  isOpen,
  onClose,
  loanObjectId,
  loanId,
  customerName,
  billingAvailable,
  repaymentAvailable,
  invoiceType,
}: InvoicePDFModalProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loadedPdf = useRef<boolean>(false);

  // Load PDF when modal opens
  useEffect(() => {
    if (isOpen && !loadedPdf.current && !loading) {
      loadPDF();
    }
  }, [isOpen]);

  const loadPDF = async () => {
    console.log("Loading PDF with:", { loanObjectId, loanId, invoiceType }); // Debug log
    setLoading(true);
    setError(null);

    try {
      // Use loanObjectId if available, otherwise use loanId
      const loanIdentifier = loanObjectId || loanId;
      console.log("Using loan identifier:", loanIdentifier); // Debug log

      const endpoint =
        invoiceType === "billing"
          ? `/invoice/loan/${loanIdentifier}/pdf`
          : `/invoice/repayment/${loanIdentifier}/pdf`;

      console.log("PDF endpoint:", endpoint); // Debug log

      const response = await api.get(endpoint, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (response.data.type !== "application/pdf") {
        throw new Error("Invalid PDF response from server");
      }

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      setPdfUrl(url);
      loadedPdf.current = true;
    } catch (error: any) {
      console.error(`Error loading ${invoiceType} PDF:`, error);
      const errorMessage =
        error.response?.status === 404
          ? `${invoiceType} invoice not found`
          : `Failed to load ${invoiceType} invoice`;

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      // Use loanObjectId if available, otherwise use loanId
      const loanIdentifier = loanObjectId || loanId;
      console.log("Downloading PDF with identifier:", loanIdentifier); // Debug log

      const endpoint =
        invoiceType === "billing"
          ? `/invoice/loan/${loanIdentifier}/pdf`
          : `/invoice/repayment/${loanIdentifier}/pdf`;

      const response = await api.get(endpoint, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const prefix = invoiceType === "billing" ? "B" : "R";
      link.download = `${prefix}-${loanId}.pdf`;

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success(`${invoiceType} invoice downloaded successfully`);
    } catch (error) {
      console.error(`Error downloading ${invoiceType} PDF:`, error);
      toast.error(`Failed to download ${invoiceType} invoice`);
    }
  };

  const printPDF = () => {
    try {
      const printUrl = `${api.defaults.baseURL}/invoice/${invoiceType}/${loanObjectId}/print`;
      const printWindow = window.open(
        printUrl,
        "_blank",
        "width=800,height=600"
      );

      if (!printWindow) {
        toast.error("Pop-up blocked. Please allow pop-ups and try again.");
        return;
      }

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

      printWindow.onerror = () => {
        toast.error("Failed to load print preview");
      };
    } catch (error) {
      console.error("Error opening print window:", error);
      toast.error("Failed to open print preview");
    }
  };

  // Cleanup URLs when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Clean up URLs when modal closes
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      // Reset error states and loaded flags
      setError(null);
      loadedPdf.current = false;
    }
  }, [isOpen]);

  // Cleanup URLs on component unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: colors.primary.light + "20" }}
            >
              <FileText
                className="h-6 w-6"
                style={{ color: colors.primary.dark }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {invoiceType === "billing" ? "Billing" : "Repayment"} Invoice
                PDF
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {customerName} - Loan ID: {loanId}
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={downloadPDF}
              className="flex items-center space-x-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: colors.primary.dark }}
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            {/* <button
              onClick={printPDF}
              className="flex items-center space-x-2 px-3 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: colors.primary.medium }}
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button> */}
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 p-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                  style={{ borderBottomColor: colors.primary.dark }}
                ></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading {invoiceType} invoice...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Failed to Load Invoice Preview
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  PDF preview is not available, but you can still download the
                  invoice.
                </p>
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={downloadPDF}
                    className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                    style={{ backgroundColor: colors.primary.dark }}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Invoice</span>
                  </button>
                  <button
                    onClick={loadPDF}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Retry Preview
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {pdfUrl && !loading && !error && (
            <div className="h-full">
              <iframe
                key={`${invoiceType}-${pdfUrl}`}
                src={pdfUrl}
                className="w-full h-full border border-gray-300 dark:border-gray-600 rounded-lg"
                title={`${invoiceType} Invoice PDF`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
