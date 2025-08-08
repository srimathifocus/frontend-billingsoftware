import { FileText, Download } from "lucide-react";
import { colors } from "../theme/colors";
import { toast } from "react-toastify";
import { api } from "../utils/api";

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
  const downloadInvoice = async (
    loanObjectId: string,
    loanId: string,
    type: "billing" | "repayment"
  ) => {
    try {
      const endpoint =
        type === "billing"
          ? `/invoice/loan/${loanObjectId}/pdf`
          : `/invoice/repayment/${loanObjectId}/pdf`;

      console.log(`Downloading ${type} invoice for loanId: ${loanId}`);

      toast.info(`Preparing ${type} invoice for download...`);

      const response = await api.get(endpoint, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });

      // Check if response is actually a PDF
      if (response.data.type !== "application/pdf") {
        console.error("Response is not a PDF:", response.data.type);
        toast.error("Invalid PDF response from server");
        return;
      }

      // Check response size - if too small, might be empty/error
      if (response.data.size < 1000) {
        console.warn("PDF response size is very small:", response.data.size);
      }

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const prefix = type === "billing" ? "B" : "R";
      link.download = `${prefix}-${loanId}.pdf`;

      // Ensure link is added to DOM before clicking
      document.body.appendChild(link);
      link.click();

      // Clean up immediately after download
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast.success(`${type} invoice downloaded successfully!`);
    } catch (error: any) {
      console.error(`Error downloading ${type} invoice:`, error);

      if (error.response?.status === 404) {
        toast.error(`${type} invoice not found for this loan`);
      } else if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
      } else {
        toast.error(`Failed to download ${type} invoice. Please try again.`);
      }
    }
  };

  const handleInvoiceClick = (type: "billing" | "repayment") => {
    downloadInvoice(loanObjectId, loanId, type);
  };

  return (
    <>
      <div className="flex space-x-1">
        {billingAvailable && (
          <button
            onClick={() => handleInvoiceClick("billing")}
            className="flex items-center space-x-1 px-2 py-1 text-white text-sm rounded hover:opacity-90 transition-colors"
            style={{ backgroundColor: colors.primary.dark }}
            title="Download Billing Invoice PDF"
          >
            <Download className="h-3 w-3" />
            <span>Billing</span>
          </button>
        )}

        {repaymentAvailable && (
          <button
            onClick={() => handleInvoiceClick("repayment")}
            className="flex items-center space-x-1 px-2 py-1 text-white text-sm rounded hover:opacity-90 transition-colors"
            style={{ backgroundColor: colors.primary.medium }}
            title="Download Repayment Invoice PDF"
          >
            <Download className="h-3 w-3" />
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
    </>
  );
};
