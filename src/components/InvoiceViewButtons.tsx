import { useState } from "react";
import { FileText, Eye } from "lucide-react";
import { colors } from "../theme/colors";
import { InvoicePDFModal } from "./InvoicePDFModal";

interface InvoiceViewButtonsProps {
  loanObjectId: string;
  loanId: string;
  customerName: string;
  billingAvailable: boolean;
  repaymentAvailable: boolean;
}

export const InvoiceViewButtons = ({
  loanObjectId,
  loanId,
  customerName,
  billingAvailable,
  repaymentAvailable,
}: InvoiceViewButtonsProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<
    "billing" | "repayment"
  >("billing");

  const openModal = (type: "billing" | "repayment") => {
    setSelectedInvoiceType(type);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <div className="flex space-x-1">
        {billingAvailable && (
          <button
            onClick={() => openModal("billing")}
            className="flex items-center space-x-1 px-2 py-1 text-white text-sm rounded hover:opacity-90 transition-colors"
            style={{ backgroundColor: colors.primary.dark }}
            title="View Billing Invoice"
          >
            <Eye className="h-3 w-3" />
            <span>Billing</span>
          </button>
        )}

        {repaymentAvailable && (
          <button
            onClick={() => openModal("repayment")}
            className="flex items-center space-x-1 px-2 py-1 text-white text-sm rounded hover:opacity-90 transition-colors"
            style={{ backgroundColor: colors.primary.medium }}
            title="View Repayment Invoice"
          >
            <Eye className="h-3 w-3" />
            <span>Repayment</span>
          </button>
        )}

        {!billingAvailable && !repaymentAvailable && (
          <div className="flex items-center space-x-1 px-2 py-1 text-gray-500 bg-gray-100 dark:bg-gray-700 rounded text-sm">
            <FileText className="h-3 w-3" />
            <span>No Invoices</span>
          </div>
        )}
      </div>

      <InvoicePDFModal
        isOpen={modalOpen}
        onClose={closeModal}
        loanObjectId={loanObjectId}
        loanId={loanId}
        customerName={customerName}
        billingAvailable={billingAvailable}
        repaymentAvailable={repaymentAvailable}
        invoiceType={selectedInvoiceType}
      />
    </>
  );
};
