import React, { useState } from "react";
import { JewelryInvoice } from "./JewelryInvoice";
import { CompactInvoiceModal } from "./CompactInvoiceModal";
import { FileText, Download, Settings } from "lucide-react";

const InvoiceTest: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"loan" | "repayment">("loan");

  // Professional sample data for jewelry shop
  const shopDetails = {
    name: "GOLDEN JEWELLERY",
    address: "123 Main Street, Jewelry District, City - 500001",
    phone: "+91 9876543210",
    email: "info@goldenjewellery.com",
    gstNo: "29ABCDE1234F1Z5",
    licenseNo: "JWL/2024/001",
  };

  const sampleLoanData = {
    invoiceId: "LOAN-2024-001",
    date: new Date().toISOString(),
    customerName: "Rajesh Kumar",
    customerPhone: "+91 9876543210",
    customerAddress: "456 Customer Street, City - 500002",
    loanAmount: 50000,
    interestRate: 2.5,
    validity: 12,
    dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        name: "Gold Chain",
        category: "Chain",
        carat: "22K",
        weight: 25.5,
        estimatedValue: 75000,
      },
      {
        name: "Gold Earrings",
        category: "Earrings",
        carat: "18K",
        weight: 8.2,
        estimatedValue: 20000,
      },
      {
        name: "Silver Bracelet",
        category: "Bracelet",
        carat: "925",
        weight: 15.0,
        estimatedValue: 5000,
      },
    ],
    payment: {
      cash: 30000,
      online: 20000,
    },
    type: "loan" as const,
  };

  const sampleRepaymentData = {
    ...sampleLoanData,
    invoiceId: "REPAY-2024-001",
    type: "repayment" as const,
    repaymentDate: new Date().toISOString(),
    daysDifference: 90,
    interestAmount: 3750,
    totalAmount: 53750,
    payment: {
      cash: 25000,
      online: 28750,
    },
  };

  const currentData =
    invoiceType === "loan" ? sampleLoanData : sampleRepaymentData;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏆 Professional Jewelry Shop Invoice System
        </h1>
        <p className="text-gray-600">
          Compact 10cm × 8cm Design | Professional Layout | Print Ready
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center space-x-4">
            <Settings className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Invoice Type:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setInvoiceType("loan")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  invoiceType === "loan"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Loan Invoice
              </button>
              <button
                onClick={() => setInvoiceType("repayment")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  invoiceType === "repayment"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Repayment Receipt
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Full Screen Preview</span>
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Live Invoice Preview
          </h2>
          <p className="text-sm text-gray-600">
            Actual Size: 10cm × 8cm | Font: 8px Monospace
          </p>
        </div>

        <div className="flex justify-center">
          <div className="border-2 border-gray-300 shadow-xl rounded-lg overflow-hidden">
            <JewelryInvoice
              invoiceData={currentData}
              shopDetails={shopDetails}
            />
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Printer className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Print Ready</h3>
            <p className="text-sm text-gray-600">
              Optimized for thermal and regular printers with perfect sizing
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Professional</h3>
            <p className="text-sm text-gray-600">
              Clean layout with all required jewelry shop details
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">PDF Export</h3>
            <p className="text-sm text-gray-600">
              Generate PDFs with backend integration for downloads
            </p>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Technical Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Design Specs</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Size: 10cm × 8cm (exact)</li>
              <li>• Font: 8px Monospace</li>
              <li>• Layout: Compact & structured</li>
              <li>• Print: Thermal compatible</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Features</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Shop branding with GST/License</li>
              <li>• Customer & loan details</li>
              <li>• Jewelry items with carat/weight</li>
              <li>• Payment breakdown & T&C</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CompactInvoiceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        invoiceData={currentData}
        shopDetails={shopDetails}
      />
    </div>
  );
};

export default InvoiceTest;
