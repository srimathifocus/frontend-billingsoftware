import { X, ExternalLink, Download, Printer } from "lucide-react";
import { colors } from "../theme/colors";
import { toast } from "react-toastify";

interface EnhancedPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
}

export const EnhancedPDFModal = ({
  isOpen,
  onClose,
  title,
  pdfUrl,
}: EnhancedPDFModalProps) => {
  if (!isOpen) return null;

  // Generate PDF URL exactly like InvoiceModal does
  const generatePdfUrl = () => {
    const token = sessionStorage.getItem("admin_token");
    // pdfUrl is already a full URL from CustomerManagementPage
    return `${pdfUrl}?token=${token}&timestamp=${Date.now()}`;
  };

  const authenticatedUrl = generatePdfUrl();

  // Handle view PDF - opens in new tab with native browser PDF viewer (same as InvoiceModal)
  const handleViewPDF = () => {
    const pdfWindow = window.open(authenticatedUrl, "_blank");
    if (pdfWindow) {
      toast.success("PDF opened in new tab");
      onClose(); // Close the modal since PDF is now in new tab
    } else {
      toast.error("Please allow popups to view PDF");
    }
  };

  // Handle download - use the same method as InvoiceViewButtons
  const handleDownload = async () => {
    try {
      // Import the api instance
      const { api } = await import("../utils/api");

      // Extract the endpoint from the full URL
      const endpoint = pdfUrl.replace(api.defaults.baseURL, "");

      const response = await api.get(endpoint, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title}.pdf`;

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success("PDF download started");
    } catch (error) {
      toast.error("Failed to download PDF");
      console.error("Download error:", error);
    }
  };

  // Handle print - exact same method as InvoiceModal
  const handlePrint = () => {
    const printWindow = window.open(authenticatedUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
      toast.success("PDF opened for printing");
    } else {
      toast.error("Please allow popups to print PDF");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            PDF Actions
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {title}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleViewPDF}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              <span>View PDF (with annotation tools)</span>
            </button>

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Printer className="h-5 w-5" />
              <span>Print PDF</span>
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 <strong>View PDF</strong> opens in new tab with full browser
              PDF viewer including zoom, search, and annotation tools (colored
              pencils, highlighter, etc.)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
