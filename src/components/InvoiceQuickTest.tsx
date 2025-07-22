import React from "react";
import { JewelryInvoice } from "./JewelryInvoice";

const InvoiceQuickTest: React.FC = () => {
  const testInvoiceData = {
    invoiceId: "LN250717002",
    date: "2025-07-17",
    customerName: "Test Customer",
    customerPhone: "9876543210",
    customerAddress: "123 Test Street, Test Town, Test District - 123456",
    loanAmount: 40000,
    interestRate: 2.5,
    validity: 6,
    dueDate: "2026-01-17",
    items: [
      {
        name: "Gold Ring",
        category: "Gold",
        carat: "22K",
        weight: 10.5,
        estimatedValue: 50000,
      },
    ],
    payment: {
      cash: 40000,
      online: 0,
    },
    type: "loan" as const,
  };

  const shopDetails = {
    name: "GOLDEN JEWELLERY",
    address: "123 Main Street, Jewelry District, City - 500001",
    phone: "+91 9876543210",
    email: "info@goldenjewellery.com",
    gstNo: "29ABCDE1234F1Z5",
    licenseNo: "JWL/2024/001",
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">
        🏆 Professional Styled Invoice Test
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 text-center">
          This is your new styled invoice (10cm × 8cm)
        </h2>

        <div className="flex justify-center">
          <div className="border-2 border-gray-400 shadow-xl">
            <JewelryInvoice
              invoiceData={testInvoiceData}
              shopDetails={shopDetails}
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            ✅ Professional design with colors and styling
            <br />
            ✅ Compact 10cm × 8cm size
            <br />
            ✅ All jewelry shop details included
            <br />✅ Print-ready format
          </p>

          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🖨️ Print Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceQuickTest;
