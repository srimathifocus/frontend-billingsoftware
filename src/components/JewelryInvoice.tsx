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
        className="bg-white text-black p-3 font-mono text-xs leading-tight"
        style={{
          width: "10cm",
          minHeight: "auto",
          maxHeight: "fit-content",
          fontSize: "7px",
          fontFamily: "monospace",
          lineHeight: "1.0",
          pageBreakInside: "avoid",
        }}
      >
        {/* Header */}
        <div className="text-center border-b border-gray-400 pb-1 mb-1">
          <div className="font-bold text-xs uppercase tracking-wide">
            {shopDetails.name}
          </div>
          <div className="text-xs">{shopDetails.address}</div>
          <div className="text-xs">
            Ph: {shopDetails.phone}
            {shopDetails.email && ` | ${shopDetails.email}`}
          </div>
          {shopDetails.gstNo && (
            <div className="text-xs">GST: {shopDetails.gstNo}</div>
          )}
          {shopDetails.licenseNo && (
            <div className="text-xs">License: {shopDetails.licenseNo}</div>
          )}
        </div>

        {/* Invoice Title & ID */}
        <div className="text-center mb-1">
          <div className="font-bold text-xs uppercase">
            {isRepayment ? "REPAYMENT RECEIPT" : "LOAN INVOICE"}
          </div>
          <div className="text-xs">
            ID: {invoiceData.invoiceId} | Date:{" "}
            {new Date(invoiceData.date).toLocaleDateString("en-IN")}
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-1">
          <div className="font-bold text-xs border-b border-gray-300 pb-0.5 mb-0.5">
            CUSTOMER DETAILS
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>Name: {invoiceData.customerName}</div>
            <div>Phone: {invoiceData.customerPhone}</div>
            {invoiceData.customerAddress && (
              <div className="col-span-2">
                Address: {invoiceData.customerAddress}
              </div>
            )}
          </div>
        </div>

        {/* Loan Details */}
        <div className="mb-1">
          <div className="font-bold text-xs border-b border-gray-300 pb-0.5 mb-0.5">
            LOAN DETAILS
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>Amount: ₹{invoiceData.loanAmount.toLocaleString()}</div>
            <div>Interest: {invoiceData.interestRate}%/month</div>
            <div>Validity: {invoiceData.validity} months</div>
            <div>
              Due: {new Date(invoiceData.dueDate).toLocaleDateString("en-IN")}
            </div>
            {isRepayment && (
              <>
                <div>Days: {invoiceData.daysDifference}</div>
                <div>
                  Interest: ₹{invoiceData.interestAmount?.toLocaleString()}
                </div>
                <div className="col-span-2 font-bold">
                  Total Paid: ₹{invoiceData.totalAmount?.toLocaleString()}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="mb-1">
          <div className="font-bold text-xs border-b border-gray-300 pb-0.5 mb-0.5">
            PLEDGED ITEMS
          </div>
          <div className="text-xs">
            {invoiceData.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-0.5"
              >
                <div className="flex-1">
                  {index + 1}. {item.name} - {item.category} - {item.carat} -{" "}
                  {item.weight}g
                </div>
                <div className="text-right">
                  ₹{item.estimatedValue.toLocaleString()}
                </div>
              </div>
            ))}
            <div className="border-t border-gray-300 pt-0.5 mt-0.5">
              <div className="flex justify-between font-bold">
                <span>Total Value:</span>
                <span>₹{totalItemValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-1">
          <div className="font-bold text-xs border-b border-gray-300 pb-0.5 mb-0.5">
            PAYMENT DETAILS
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>Cash: ₹{invoiceData.payment.cash.toLocaleString()}</div>
            <div>Online: ₹{invoiceData.payment.online.toLocaleString()}</div>
            <div className="col-span-2 font-bold">
              Total: ₹{totalPaidAmount.toLocaleString()}
            </div>
            {isRepayment && (
              <div className="col-span-2 font-bold text-center border border-gray-400 py-0.5">
                STATUS: FULLY REPAID
              </div>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="border-t border-gray-400 pt-0.5 mt-1">
          <div className="font-bold text-xs mb-0.5">TERMS & CONDITIONS</div>
          <div className="text-xs leading-tight">
            • Interest calculated monthly from loan date • Items returned upon
            full repayment only • Default may result in auction as per law •
            Computer generated invoice
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs mt-1 border-t border-gray-400 pt-0.5">
          <div>Thank you for your business!</div>
          <div>Generated on: {new Date().toLocaleString("en-IN")}</div>
        </div>
      </div>
    );
  }
);

JewelryInvoice.displayName = "JewelryInvoice";
