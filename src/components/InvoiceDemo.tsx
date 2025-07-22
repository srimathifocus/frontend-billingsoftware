import React, { useState } from "react";
import { CompactInvoiceModal } from "./CompactInvoiceModal";

export const InvoiceDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"loan" | "repayment">("loan");

  // Sample shop details - customize this for your jewelry shop
  const shopDetails = {
    name: "GOLDEN JEWELLERY",
    address: "123 Main Street, Jewelry District, City - 500001",
    phone: "+91 9876543210",
    email: "info@goldenjewellery.com",
    gstNo: "29ABCDE1234F1Z5",
    licenseNo: "JWL/2024/001",
  };

  // Sample invoice data - this would come from your backend
  const sampleLoanData = {
    invoiceId: "LOAN-2024-001",
    date: new Date().toISOString(),
    customerName: "Ramesh Kumar",
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

  const handleShowInvoice = (type: "loan" | "repayment") => {
    setInvoiceType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Jewelry Shop Invoice System
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Professional Invoice Design Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">
              Design Features
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Compact 10cm × 8cm size</li>
              <li>• Professional monospace font</li>
              <li>• Clean, structured layout</li>
              <li>• Optimized for small printers</li>
              <li>• Light and professional design</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              Included Information
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Shop details with GST/License</li>
              <li>• Customer information</li>
              <li>• Loan/Repayment details</li>
              <li>• Itemized jewelry list</li>
              <li>• Payment breakdown</li>
              <li>• Terms & conditions</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleShowInvoice("loan")}
            className="flex-1 min-w-[200px] bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Preview Loan Invoice
          </button>

          <button
            onClick={() => handleShowInvoice("repayment")}
            className="flex-1 min-w-[200px] bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Preview Repayment Receipt
          </button>
        </div>
      </div>

      {/* Invoice Modal */}
      <CompactInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoiceData={
          invoiceType === "loan" ? sampleLoanData : sampleRepaymentData
        }
        shopDetails={shopDetails}
      />

      {/* Instructions */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">How to Use:</h3>
        <ol className="text-sm text-gray-700 space-y-2">
          <li>
            1. <strong>Customize Shop Details:</strong> Update the shopDetails
            object with your jewelry shop information
          </li>
          <li>
            2. <strong>Integration:</strong> Replace sample data with real data
            from your backend API
          </li>
          <li>
            3. <strong>Printing:</strong> Use the print function for thermal or
            regular printers
          </li>
          <li>
            4. <strong>Colors:</strong> Modify colors in the theme file to match
            your brand
          </li>
          <li>
            5. <strong>Layout:</strong> Adjust the invoice layout if needed for
            your specific requirements
          </li>
        </ol>
      </div>
    </div>
  );
};
