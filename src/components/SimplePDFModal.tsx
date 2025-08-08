import { X } from "lucide-react";
import { colors } from "../theme/colors";

interface SimplePDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
}

export const SimplePDFModal = ({
  isOpen,
  onClose,
  title,
  pdfUrl,
}: SimplePDFModalProps) => {
  if (!isOpen) return null;

  // Add authentication token to PDF URL
  const token = sessionStorage.getItem("admin_token");
  const authenticatedUrl = token ? `${pdfUrl}?token=${token}` : pdfUrl;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 p-4">
          <iframe
            src={authenticatedUrl}
            className="w-full h-full border border-gray-300 dark:border-gray-600 rounded-lg"
            title="PDF Viewer"
          />
        </div>
      </div>
    </div>
  );
};
