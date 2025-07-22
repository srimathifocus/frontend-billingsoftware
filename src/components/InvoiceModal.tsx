import { useState, useRef } from "react";
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
import { colors } from "../theme/colors";

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
    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
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
    link.download = `${type}_invoice_${loanId}.pdf`;
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
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async (invoiceType: "billing" | "repayment") => {
    setDownloading(invoiceType);
    await downloadInvoice(loanObjectId, invoiceType);
    setDownloading(null);
  };

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        const invoiceContent = invoiceRef.current.innerHTML;

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${loanId}</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                body {
                  font-family: monospace;
                  font-size: 7px;
                  line-height: 1.0;
                  color: black;
                  background: white;
                  margin: 0;
                  padding: 0;
                }
                
                .invoice-container {
                  width: 10cm;
                  height: auto;
                  margin: 0 auto;
                  background: white;
                  border: 1px solid #ccc;
                  padding: 12px;
                  box-sizing: border-box;
                }
                
                @media print {
                  body {
                    margin: 0;
                    padding: 0;
                  }
                  
                  .invoice-container {
                    width: 10cm;
                    height: auto;
                    margin: 0;
                    border: none;
                    padding: 8px;
                    page-break-inside: avoid;
                    box-sizing: border-box;
                  }
                  
                  @page {
                    size: A4;
                    margin: 0.5cm;
                  }
                  
                  * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }
                }
              </style>
            </head>
            <body>
              <div class="invoice-container">
                ${invoiceContent}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                };
              </script>
            </body>
          </html>
        `);

        printWindow.document.close();
      }
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
                {type === "success" ? "Payment Successful!" : "Invoice Details"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loan ID: {loanId}
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

          {/* Professional Invoice Preview */}
          {invoiceData && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-center flex-1">
                  Professional Invoice Preview
                </h3>
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  title="Print Invoice"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
              </div>
              <div className="flex justify-center">
                <div className="border-2 border-gray-300 dark:border-gray-600 shadow-lg rounded-lg overflow-hidden">
                  <JewelryInvoice
                    ref={invoiceRef}
                    invoiceData={{
                      invoiceId: loanId,
                      date: new Date().toISOString(),
                      customerName: invoiceData.customerName,
                      customerPhone: invoiceData.customerPhone,
                      customerAddress: "", // Add if available
                      loanAmount: invoiceData.loanAmount,
                      interestRate: 2.5, // Default or get from data
                      validity: 12, // Default or get from data
                      dueDate:
                        invoiceData.repaymentDate || new Date().toISOString(),
                      items: invoiceData.items.map((item) => ({
                        name: item.name,
                        category: item.category,
                        carat: "22K", // Default or get from data
                        weight: item.weight,
                        estimatedValue: item.estimatedValue,
                      })),
                      payment: invoiceData.payment || {
                        cash: Math.floor(invoiceData.loanAmount * 0.6), // Example split
                        online: Math.floor(invoiceData.loanAmount * 0.4),
                      },
                      type: type === "success" ? "repayment" : "loan",
                      repaymentDate: invoiceData.repaymentDate,
                      interestAmount: invoiceData.totalAmount
                        ? invoiceData.totalAmount - invoiceData.loanAmount
                        : 0,
                      totalAmount: invoiceData.totalAmount,
                      daysDifference: invoiceData.repaymentDate
                        ? Math.floor(
                            (new Date(invoiceData.repaymentDate).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : 0,
                    }}
                    shopDetails={{
                      name: "GOLDEN JEWELLERY",
                      address:
                        "123 Main Street, Jewelry District, City - 500001",
                      phone: "+91 9876543210",
                      email: "info@goldenjewellery.com",
                      gstNo: "29ABCDE1234F1Z5",
                      licenseNo: "JWL/2024/001",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

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

          {/* Download Buttons */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Download Invoices
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleDownload("billing")}
                disabled={downloading === "billing"}
                className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.primary.dark }}
              >
                {downloading === "billing" ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Billing Invoice</span>
              </button>

              {type === "success" && (
                <button
                  onClick={() => handleDownload("repayment")}
                  disabled={downloading === "repayment"}
                  className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: colors.primary.medium }}
                >
                  {downloading === "repayment" ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Repayment Invoice</span>
                </button>
              )}
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
