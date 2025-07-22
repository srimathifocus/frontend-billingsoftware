import React, { useState, useRef } from "react";
import { X, Download, Printer, Eye } from "lucide-react";
import { JewelryInvoice } from "./JewelryInvoice";

interface CompactInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: {
    invoiceId: string;
    date: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    loanAmount: number;
    interestRate: number;
    validity: number;
    dueDate: string;
    items: Array<{
      name: string;
      category: string;
      carat: string;
      weight: number;
      estimatedValue: number;
    }>;
    payment: {
      cash: number;
      online: number;
    };
    type: "loan" | "repayment";
    repaymentDate?: string;
    interestAmount?: number;
    totalAmount?: number;
    daysDifference?: number;
  };
  shopDetails: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    gstNo?: string;
    licenseNo?: string;
  };
}

export const CompactInvoiceModal: React.FC<CompactInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceData,
  shopDetails,
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${invoiceData.invoiceId}</title>
              <style>
                @media print {
                  body {
                    margin: 0;
                    padding: 0;
                    font-family: monospace;
                  }
                  .invoice-container {
                    width: 10cm;
                    height: 8cm;
                    font-size: 8px;
                    line-height: 1.1;
                  }
                  @page {
                    size: 10cm 8cm;
                    margin: 0;
                  }
                }
                body {
                  font-family: monospace;
                  margin: 0;
                  padding: 20px;
                }
                .invoice-container {
                  width: 10cm;
                  height: 8cm;
                  border: 1px solid #ccc;
                  padding: 12px;
                  box-sizing: border-box;
                  font-size: 8px;
                  line-height: 1.1;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .uppercase { text-transform: uppercase; }
                .border-b { border-bottom: 1px solid #ccc; }
                .border-t { border-top: 1px solid #ccc; }
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                .gap-1 { gap: 4px; }
                .mb-1 { margin-bottom: 4px; }
                .mb-2 { margin-bottom: 8px; }
                .mt-1 { margin-top: 4px; }
                .mt-2 { margin-top: 8px; }
                .p-1 { padding: 4px; }
                .pb-1 { padding-bottom: 4px; }
                .pt-1 { padding-top: 4px; }
                .py-1 { padding-top: 4px; padding-bottom: 4px; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .items-center { align-items: center; }
                .flex-1 { flex: 1; }
              </style>
            </head>
            <body>
              <div class="invoice-container">
                ${invoiceRef.current.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    // For now, we'll use the print functionality
    // In a real implementation, you might want to generate a PDF
    handlePrint();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {invoiceData.type === "repayment"
              ? "Repayment Receipt"
              : "Loan Invoice"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Invoice Preview */}
            <div className="flex-1">
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Invoice Preview
                  </h3>
                  <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{isPreviewMode ? "Actual Size" : "Fit Preview"}</span>
                  </button>
                </div>

                <div
                  className={`flex justify-center ${
                    isPreviewMode ? "scale-150 py-8" : ""
                  }`}
                >
                  <div className="border border-gray-400 shadow-lg">
                    <JewelryInvoice
                      ref={invoiceRef}
                      invoiceData={invoiceData}
                      shopDetails={shopDetails}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="lg:w-80">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Actions
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={handlePrint}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Printer className="h-5 w-5" />
                    <span>Print Invoice</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* Invoice Details Summary */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Invoice Details
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Invoice ID:</span>
                      <span className="font-medium">
                        {invoiceData.invoiceId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span className="font-medium">
                        {invoiceData.customerName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium capitalize">
                        {invoiceData.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">
                        ₹
                        {(invoiceData.type === "repayment"
                          ? invoiceData.totalAmount
                          : invoiceData.loanAmount
                        )?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span className="font-medium">
                        {invoiceData.items.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
