import React, { forwardRef } from "react";
import { colors } from "../theme/colors";

interface JewelryInvoiceProps {
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

export const JewelryInvoice = forwardRef<HTMLDivElement, JewelryInvoiceProps>(
  ({ invoiceData, shopDetails }, ref) => {
    const totalPaidAmount =
      invoiceData.payment.cash + invoiceData.payment.online;
    const totalItemValue = invoiceData.items.reduce(
      (sum, item) => sum + item.estimatedValue,
      0
    );
    const isRepayment = invoiceData.type === "repayment";

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 font-sans text-sm leading-relaxed"
        style={{
          width: "21cm",
          minHeight: "29.7cm",
          maxHeight: "fit-content",
          fontSize: "14px",
          fontFamily: "Arial, sans-serif",
          lineHeight: "1.5",
          pageBreakInside: "avoid",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-gray-600 pb-6 mb-6">
          <div className="font-bold text-2xl uppercase tracking-wide mb-2">
            {shopDetails.name}
          </div>
          {shopDetails.location && (
            <div className="text-lg font-medium mb-2">
              {shopDetails.location}
            </div>
          )}
          <div className="text-base mb-2">{shopDetails.address}</div>
          <div className="text-base mb-2">
            Phone: {shopDetails.phone}
            {shopDetails.email && ` | Email: ${shopDetails.email}`}
          </div>
          {shopDetails.gstNo && (
            <div className="text-base mb-1">
              GST Number: {shopDetails.gstNo}
            </div>
          )}
          {shopDetails.licenseNo && (
            <div className="text-base">
              License Number: {shopDetails.licenseNo}
            </div>
          )}
        </div>

        {/* Invoice Title & ID */}
        <div className="text-center mb-8">
          <div className="font-bold text-xl uppercase mb-3 p-4 border border-gray-400 rounded-lg bg-gray-100">
            {isRepayment ? "REPAYMENT RECEIPT" : "LOAN INVOICE"}
          </div>
          <div className="text-lg font-medium">
            Invoice ID:{" "}
            <span className="font-bold">{invoiceData.invoiceId}</span> | Date:{" "}
            <span className="font-bold">
              {new Date(invoiceData.date).toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-6">
          <div className="font-bold text-lg border-b-2 border-gray-400 pb-2 mb-4 bg-blue-50 px-4 py-2 rounded-t-lg">
            CUSTOMER DETAILS
          </div>
          <div className="grid grid-cols-2 gap-4 text-base px-4">
            <div className="font-medium">
              Name:{" "}
              <span className="font-normal">{invoiceData.customerName}</span>
            </div>
            <div className="font-medium">
              Phone:{" "}
              <span className="font-normal">{invoiceData.customerPhone}</span>
            </div>
            {invoiceData.customerAddress && (
              <div className="col-span-2 font-medium">
                Address:{" "}
                <span className="font-normal">
                  {invoiceData.customerAddress}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Loan Details */}
        <div className="mb-6">
          <div className="font-bold text-lg border-b-2 border-gray-400 pb-2 mb-4 bg-green-50 px-4 py-2 rounded-t-lg">
            LOAN DETAILS
          </div>
          <div className="grid grid-cols-2 gap-4 text-base px-4">
            <div className="font-medium">
              Loan Amount:{" "}
              <span className="font-bold text-green-700">
                ₹{invoiceData.loanAmount.toLocaleString()}
              </span>
            </div>
            <div className="font-medium">
              Interest Rate:{" "}
              <span className="font-normal">
                {invoiceData.interestRate}% per month
              </span>
            </div>
            <div className="font-medium">
              Validity Period:{" "}
              <span className="font-normal">{invoiceData.validity} months</span>
            </div>
            <div className="font-medium">
              Due Date:{" "}
              <span className="font-normal">
                {new Date(invoiceData.dueDate).toLocaleDateString("en-IN")}
              </span>
            </div>
            {isRepayment && (
              <>
                <div className="font-medium">
                  Days:{" "}
                  <span className="font-normal">
                    {invoiceData.daysDifference}
                  </span>
                </div>
                <div className="font-medium">
                  Interest Amount:{" "}
                  <span className="font-normal">
                    ₹{invoiceData.interestAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="col-span-2 font-bold text-xl bg-red-100 p-3 rounded-lg text-center">
                  Total Amount Paid: ₹
                  {invoiceData.totalAmount?.toLocaleString()}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <div className="font-bold text-lg border-b-2 border-gray-400 pb-2 mb-4 bg-yellow-50 px-4 py-2 rounded-t-lg">
            PLEDGED ITEMS
          </div>
          <div className="text-base">
            <div className="grid grid-cols-6 gap-2 font-bold bg-gray-200 p-3 rounded-t-lg border-b-2 border-gray-400">
              <div>S.No</div>
              <div>Item Name</div>
              <div>Category</div>
              <div>Carat</div>
              <div>Weight (g)</div>
              <div className="text-right">Value (₹)</div>
            </div>
            {invoiceData.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-6 gap-2 items-center py-3 border-b border-gray-300 hover:bg-gray-50"
              >
                <div className="font-medium">{index + 1}</div>
                <div>{item.name}</div>
                <div>{item.category}</div>
                <div>{item.carat}</div>
                <div>{item.weight}g</div>
                <div className="text-right font-medium">
                  ₹{item.estimatedValue.toLocaleString()}
                </div>
              </div>
            ))}
            <div className="bg-blue-100 p-4 rounded-b-lg border-t-2 border-blue-400">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Estimated Value:</span>
                <span className="text-blue-700">
                  ₹{totalItemValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <div className="font-bold text-lg border-b-2 border-gray-400 pb-2 mb-4 bg-purple-50 px-4 py-2 rounded-t-lg">
            PAYMENT DETAILS
          </div>
          <div className="grid grid-cols-2 gap-6 text-base px-4">
            <div className="font-medium">
              Cash Payment:{" "}
              <span className="font-normal">
                ₹{invoiceData.payment.cash.toLocaleString()}
              </span>
            </div>
            <div className="font-medium">
              Online Payment:{" "}
              <span className="font-normal">
                ₹{invoiceData.payment.online.toLocaleString()}
              </span>
            </div>
            <div className="col-span-2 font-bold text-xl bg-purple-100 p-4 rounded-lg text-center">
              Total Payment: ₹{totalPaidAmount.toLocaleString()}
            </div>
            {isRepayment && (
              <div className="col-span-2 font-bold text-xl text-center border-2 border-green-500 bg-green-100 py-4 rounded-lg">
                STATUS: FULLY REPAID ✓
              </div>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="border-t-2 border-gray-600 pt-6 mt-8">
          <div className="font-bold text-lg mb-4 bg-red-50 px-4 py-2 rounded-lg">
            TERMS & CONDITIONS
          </div>
          <div className="text-base leading-relaxed space-y-2 px-4">
            <div>• Interest is calculated monthly from the loan date</div>
            <div>
              • Items will be returned only upon full repayment of loan amount
              plus accrued interest
            </div>
            <div>
              • In case of default, items may be auctioned as per applicable law
            </div>
            <div>
              • This is a computer generated invoice and does not require
              physical signature
            </div>
            <div>
              • Customer acknowledges receipt of loan amount and agrees to all
              terms mentioned
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-base mt-8 border-t-2 border-gray-600 pt-6 bg-gray-100 p-6 rounded-lg">
          <div className="font-bold text-lg mb-2">
            Thank you for your business!
          </div>
          <div className="text-gray-600">
            Invoice generated on: {new Date().toLocaleString("en-IN")}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            For any queries, please contact us at {shopDetails.phone}
          </div>
        </div>
      </div>
    );
  }
);

JewelryInvoice.displayName = "JewelryInvoice";
