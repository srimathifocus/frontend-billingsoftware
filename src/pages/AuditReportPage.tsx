import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  Users,
  Printer,
  Edit,
  Save,
  X,
  ArrowLeft,
  Filter,
  Download,
  Check,
  Shield,
  FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import api from "../utils/api";

interface AuditReportData {
  title: string;
  auditPeriod: string;
  location: string;
  licenseNo: string;
  preparedBy: string;
  generatedOn: string;
  generatedBy: string;
  executiveSummary: {
    totalLoans: number;
    totalLoanValue: number;
    activeLoans: number;
    settledLoans: number;
    forfeitedLoans: number;
    totalCustomers: number;
    complianceStatus: string;
  };
  balanceSheet: {
    assets: {
      cashInHand: number;
      loanReceivables: number;
      forfeitedInventory: number;
      furnitureFixtures: number;
      totalAssets: number;
    };
    liabilities: {
      customerPayables: number;
      bankOverdraft: number;
      totalLiabilities: number;
    };
    equity: {
      ownersEquity: number;
    };
  };
  profitLoss: {
    revenue: {
      interestIncome: number;
      saleOfForfeitedItems: number;
      totalRevenue: number;
    };
    expenses: {
      salaries: number;
      rent: number;
      utilities: number;
      miscellaneous: number;
      totalExpenses: number;
    };
    netProfit: number;
  };
  loanRegister: {
    goldJewelry: {
      count: number;
      totalValue: number;
      avgInterestRate: number;
    };
    electronics: {
      count: number;
      totalValue: number;
      avgInterestRate: number;
    };
    others: {
      count: number;
      totalValue: number;
      avgInterestRate: number;
    };
  };
  inventoryReport: {
    totalGoldWeight: number;
    estimatedValue: number;
    totalForfeitedSales: number;
    activeLoans: any[];
  };
  interestCharges: {
    interestCollected: number;
    lateFees: number;
    valuationCharges: number;
    waivedInterest: number;
  };

  observations: string[];
  conclusion: string;
}

export const AuditReportPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [financialYear, setFinancialYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  const [isFormUpdating, setIsFormUpdating] = useState(false);

  // Get current financial year and previous year options
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentFinancialYear =
    currentMonth >= 4 ? currentYear : currentYear - 1;

  const yearOptions = [
    {
      value: currentFinancialYear.toString(),
      label: `${currentFinancialYear}-${(currentFinancialYear + 1)
        .toString()
        .slice(-2)} (Current)`,
    },
    {
      value: (currentFinancialYear - 1).toString(),
      label: `${currentFinancialYear - 1}-${currentFinancialYear
        .toString()
        .slice(-2)} (Previous)`,
    },
  ];

  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const {
    data: auditData,
    isLoading,
    error,
    refetch,
  } = useQuery<AuditReportData>({
    queryKey: ["auditReport", financialYear, startMonth, endMonth],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (financialYear) params.append("financialYear", financialYear);
      if (startMonth) params.append("startMonth", startMonth);
      if (endMonth) params.append("endMonth", endMonth);

      const queryString = params.toString();
      const response = await api.get(
        `/reports/audit${queryString ? `?${queryString}` : ""}`
      );
      return response.data;
    },
    enabled: false, // Disable automatic fetching
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the data
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount
  });

  const handleGenerateReport = () => {
    // Clear the cache to force fresh data fetch
    queryClient.invalidateQueries({ queryKey: ["auditReport"] });
    // Manually trigger the fetch with current parameters
    refetch();
  };

  // Debug: Log the audit data to verify what's being received
  if (auditData) {
    console.log("Audit Report Data Received:", auditData);
    console.log("Expense Data:", auditData.profitLoss?.expenses);
  }

  const handleServerPdfDownload = async () => {
    if (!financialYear) {
      alert("Please select a financial year first");
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append("financialYear", financialYear);

      const response = await api.get(
        `/reports/audit/download?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-report-${financialYear}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading server PDF:", error);
      alert("Error downloading PDF. Please try again.");
    }
  };

  const handleDownloadReport = async (format: "pdf" | "word") => {
    if (!auditData) return;

    const periodText =
      startMonth && endMonth
        ? `${monthOptions.find((m) => m.value === startMonth)?.label} to ${
            monthOptions.find((m) => m.value === endMonth)?.label
          } ${financialYear || currentFinancialYear}`
        : auditData.auditPeriod;

    const fileName = `audit-report-${financialYear || currentFinancialYear}${
      startMonth && endMonth ? `-${startMonth}-to-${endMonth}` : ""
    }`;

    if (format === "pdf") {
      // Create a properly formatted PDF using jsPDF directly
      const pdf = new jsPDF("p", "mm", "a4");

      // A4 dimensions: 210mm x 297mm
      // Margins: 20mm on all sides
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      let currentY = margin;

      // Helper function to add text with word wrapping
      const addText = (
        text: string,
        x: number,
        y: number,
        options: any = {}
      ) => {
        const fontSize = options.fontSize || 10;
        const maxWidth = options.maxWidth || contentWidth;
        const lineHeight = options.lineHeight || fontSize * 0.35;

        pdf.setFontSize(fontSize);
        if (options.bold) pdf.setFont("helvetica", "bold");
        else pdf.setFont("helvetica", "normal");

        const lines = pdf.splitTextToSize(text, maxWidth);

        lines.forEach((line: string, index: number) => {
          if (y + index * lineHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, x, y + index * lineHeight);
        });

        return y + lines.length * lineHeight;
      };

      // Helper function to add a table
      const addTable = (
        headers: string[],
        rows: string[][],
        startY: number
      ) => {
        const colWidth = contentWidth / headers.length;
        let y = startY;

        // Check if we need a new page
        if (y + (rows.length + 2) * 6 > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }

        // Headers
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, y, contentWidth, 8, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);

        headers.forEach((header, index) => {
          pdf.text(header, margin + index * colWidth + 2, y + 5);
        });

        y += 8;

        // Rows
        pdf.setFont("helvetica", "normal");
        rows.forEach((row, rowIndex) => {
          if (y > pageHeight - margin - 10) {
            pdf.addPage();
            y = margin;
          }

          // Draw row border
          pdf.rect(margin, y, contentWidth, 6);

          row.forEach((cell, cellIndex) => {
            const cellX = margin + cellIndex * colWidth + 2;
            const isNumber = !isNaN(Number(cell.replace(/[₹,\s]/g, "")));

            if (isNumber && cellIndex > 0) {
              // Right align numbers
              const textWidth = pdf.getTextWidth(cell);
              pdf.text(
                cell,
                margin + (cellIndex + 1) * colWidth - textWidth - 2,
                y + 4
              );
            } else {
              pdf.text(cell, cellX, y + 4);
            }
          });

          y += 6;
        });

        return y + 5;
      };

      // Title and Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(auditData.title, pageWidth / 2, currentY + 10, {
        align: "center",
      });

      // Draw line under title
      pdf.setLineWidth(0.5);
      pdf.line(margin, currentY + 15, pageWidth - margin, currentY + 15);

      currentY += 25;

      // Header information
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const headerInfo = [
        `Audit Period: ${periodText}`,
        `Location: ${auditData.location}`,
        `License No: ${auditData.licenseNo}`,
        `Prepared by: ${auditData.preparedBy}`,
        `Generated on: ${new Date(auditData.generatedOn).toLocaleDateString()}`,
        `Generated by: ${auditData.generatedBy}`,
      ];

      headerInfo.forEach((info) => {
        currentY = addText(info, margin, currentY, { fontSize: 10 });
        currentY += 2;
      });

      currentY += 10;

      // 1. Executive Summary
      currentY = addText("1. EXECUTIVE SUMMARY", margin, currentY, {
        fontSize: 14,
        bold: true,
      });
      pdf.line(margin, currentY + 2, pageWidth - margin, currentY + 2);
      currentY += 8;

      const summaryData = [
        [`Total Loans`, auditData.executiveSummary.totalLoans.toString()],
        [`Active Loans`, auditData.executiveSummary.activeLoans.toString()],
        [`Settled Loans`, auditData.executiveSummary.settledLoans.toString()],
        [
          `Forfeited Loans`,
          auditData.executiveSummary.forfeitedLoans.toString(),
        ],
        [
          `Total Loan Value`,
          `₹ ${auditData.executiveSummary.totalLoanValue.toLocaleString()}`,
        ],
        [
          `Total Customers`,
          auditData.executiveSummary.totalCustomers.toString(),
        ],
      ];

      currentY = addTable(["Metric", "Value"], summaryData, currentY);
      currentY += 10;

      // 2. Financial Statements
      currentY = addText("2. FINANCIAL STATEMENTS", margin, currentY, {
        fontSize: 14,
        bold: true,
      });
      pdf.line(margin, currentY + 2, pageWidth - margin, currentY + 2);
      currentY += 8;

      // Balance Sheet
      currentY = addText("Balance Sheet - Assets", margin, currentY, {
        fontSize: 12,
        bold: true,
      });
      currentY += 5;

      const assetsData = [
        [
          "Cash in Hand/Bank",
          `₹ ${auditData.balanceSheet.assets.cashInHand.toLocaleString()}`,
        ],
        [
          "Loan Receivables",
          `₹ ${auditData.balanceSheet.assets.loanReceivables.toLocaleString()}`,
        ],
        [
          "Forfeited Inventory",
          `₹ ${auditData.balanceSheet.assets.forfeitedInventory.toLocaleString()}`,
        ],
        [
          "Furniture & Fixtures",
          `₹ ${auditData.balanceSheet.assets.furnitureFixtures.toLocaleString()}`,
        ],
        [
          "TOTAL ASSETS",
          `₹ ${auditData.balanceSheet.assets.totalAssets.toLocaleString()}`,
        ],
      ];

      currentY = addTable(["Asset Type", "Amount"], assetsData, currentY);
      currentY += 5;

      // Profit & Loss
      currentY = addText("Profit & Loss Account", margin, currentY, {
        fontSize: 12,
        bold: true,
      });
      currentY += 5;

      const plData = [
        [
          "Interest Income",
          `₹ ${auditData.profitLoss.revenue.interestIncome.toLocaleString()}`,
        ],
        [
          "Sale of Forfeited Items",
          `₹ ${auditData.profitLoss.revenue.saleOfForfeitedItems.toLocaleString()}`,
        ],
        [
          "Total Revenue",
          `₹ ${auditData.profitLoss.revenue.totalRevenue.toLocaleString()}`,
        ],
        ["", ""],
        [
          "Salaries",
          `₹ ${auditData.profitLoss.expenses.salaries.toLocaleString()}`,
        ],
        ["Rent", `₹ ${auditData.profitLoss.expenses.rent.toLocaleString()}`],
        [
          "Utilities",
          `₹ ${auditData.profitLoss.expenses.utilities.toLocaleString()}`,
        ],
        [
          "Miscellaneous",
          `₹ ${auditData.profitLoss.expenses.miscellaneous.toLocaleString()}`,
        ],
        [
          "Total Expenses",
          `₹ ${auditData.profitLoss.expenses.totalExpenses.toLocaleString()}`,
        ],
        ["", ""],
        ["NET PROFIT", `₹ ${auditData.profitLoss.netProfit.toLocaleString()}`],
      ];

      currentY = addTable(["Particulars", "Amount"], plData, currentY);
      currentY += 10;

      // 3. Loan Register Summary
      if (currentY > pageHeight - margin - 50) {
        pdf.addPage();
        currentY = margin;
      }

      currentY = addText("3. PAWN LOAN REGISTER SUMMARY", margin, currentY, {
        fontSize: 14,
        bold: true,
      });
      pdf.line(margin, currentY + 2, pageWidth - margin, currentY + 2);
      currentY += 8;

      const loanRegisterData = [
        [
          "Gold Jewelry",
          auditData.loanRegister.goldJewelry.count.toString(),
          `₹ ${auditData.loanRegister.goldJewelry.totalValue.toLocaleString()}`,
          `${auditData.loanRegister.goldJewelry.avgInterestRate}%`,
        ],
        [
          "Electronics",
          auditData.loanRegister.electronics.count.toString(),
          `₹ ${auditData.loanRegister.electronics.totalValue.toLocaleString()}`,
          `${auditData.loanRegister.electronics.avgInterestRate}%`,
        ],
        [
          "Others",
          auditData.loanRegister.others.count.toString(),
          `₹ ${auditData.loanRegister.others.totalValue.toLocaleString()}`,
          `${auditData.loanRegister.others.avgInterestRate}%`,
        ],
      ];

      currentY = addTable(
        ["Category", "Count", "Total Value", "Avg Interest"],
        loanRegisterData,
        currentY
      );
      currentY += 10;

      // 4. Auditor Observations
      if (currentY > pageHeight - margin - 40) {
        pdf.addPage();
        currentY = margin;
      }

      currentY = addText("4. AUDITOR OBSERVATIONS", margin, currentY, {
        fontSize: 14,
        bold: true,
      });
      pdf.line(margin, currentY + 2, pageWidth - margin, currentY + 2);
      currentY += 8;

      auditData.observations.forEach((observation) => {
        currentY = addText(`• ${observation}`, margin, currentY, {
          fontSize: 10,
        });
        currentY += 3;
      });

      currentY += 5;

      // 5. Conclusion
      if (currentY > pageHeight - margin - 30) {
        pdf.addPage();
        currentY = margin;
      }

      currentY = addText("5. CONCLUSION", margin, currentY, {
        fontSize: 14,
        bold: true,
      });
      pdf.line(margin, currentY + 2, pageWidth - margin, currentY + 2);
      currentY += 8;

      currentY = addText(auditData.conclusion, margin, currentY, {
        fontSize: 10,
        maxWidth: contentWidth,
      });

      // Footer
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.text(
        `Report generated on ${new Date().toLocaleDateString()} by ${
          auditData.generatedBy
        }`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      pdf.save(`${fileName}.pdf`);
    } else {
      // Word format - generate HTML content with proper A4 formatting
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Audit Report</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        
        body { 
            font-family: 'Times New Roman', serif; 
            line-height: 1.5; 
            color: #000; 
            font-size: 12pt;
            margin: 0;
            padding: 0;
            background: white;
        }
        
        .page-container {
            width: 21cm;
            min-height: 29.7cm;
            margin: 0 auto;
            padding: 2cm;
            box-sizing: border-box;
            background: white;
        }
        
        .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        
        .title { 
            font-size: 20pt; 
            font-weight: bold; 
            margin-bottom: 15px; 
            text-transform: uppercase;
        }
        
        .header-info {
            font-size: 11pt;
            line-height: 1.4;
        }
        
        .section { 
            margin-bottom: 25px; 
            page-break-inside: avoid;
        }
        
        .section-title { 
            font-size: 14pt; 
            font-weight: bold; 
            border-bottom: 1px solid #000; 
            padding-bottom: 5px; 
            margin-bottom: 15px; 
            text-transform: uppercase;
        }
        
        .subsection-title { 
            font-size: 12pt; 
            font-weight: bold; 
            margin: 15px 0 10px 0; 
        }
        
        .info-grid { 
            display: table;
            width: 100%;
            margin-bottom: 20px; 
        }
        
        .info-row {
            display: table-row;
        }
        
        .info-cell {
            display: table-cell;
            padding: 4px 10px 4px 0;
            vertical-align: top;
            width: 50%;
        }
        
        .info-label { 
            font-weight: bold; 
            display: inline-block; 
            min-width: 140px; 
        }
        
        .financial-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
            font-size: 11pt;
        }
        
        .financial-table th, .financial-table td { 
            border: 1px solid #000; 
            padding: 8px; 
            text-align: left; 
        }
        
        .financial-table th { 
            background-color: #f5f5f5; 
            font-weight: bold; 
            text-align: center;
        }
        
        .text-right { 
            text-align: right; 
        }
        
        .total-row { 
            font-weight: bold; 
            border-top: 2px solid #000; 
            background-color: #f9f9f9;
        }
        
        .observations ul { 
            margin: 0; 
            padding-left: 25px; 
        }
        
        .observations li {
            margin-bottom: 5px;
        }
        
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #000; 
            text-align: center; 
            font-size: 10pt; 
            font-style: italic;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            .page-container {
                margin: 0;
                padding: 0;
            }
            
            body {
                margin: 2cm;
            }
        }
    </style>
</head>
<body>
    <div class="page-container">
        <div class="header">
            <div class="title">${auditData.title}</div>
            <div class="header-info">
                <div><strong>Audit Period:</strong> ${periodText}</div>
                <div><strong>Location:</strong> ${auditData.location}</div>
                <div><strong>License No:</strong> ${auditData.licenseNo}</div>
                <div><strong>Prepared by:</strong> ${auditData.preparedBy}</div>
            <div><strong>Generated on:</strong> ${new Date(
              auditData.generatedOn
            ).toLocaleDateString()}</div>
            <div><strong>Generated by:</strong> ${auditData.generatedBy}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">1. EXECUTIVE SUMMARY</div>
        <table class="financial-table">
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Loans</td><td class="text-right">${
              auditData.executiveSummary.totalLoans
            }</td></tr>
            <tr><td>Active Loans</td><td class="text-right">${
              auditData.executiveSummary.activeLoans
            }</td></tr>
            <tr><td>Settled Loans</td><td class="text-right">${
              auditData.executiveSummary.settledLoans
            }</td></tr>
            <tr><td>Forfeited Loans</td><td class="text-right">${
              auditData.executiveSummary.forfeitedLoans
            }</td></tr>
            <tr><td>Total Loan Value</td><td class="text-right">Rs. ${auditData.executiveSummary.totalLoanValue.toLocaleString()}</td></tr>
            <tr><td>Total Customers</td><td class="text-right">${
              auditData.executiveSummary.totalCustomers
            }</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">2. FINANCIAL STATEMENTS</div>
        
        <div class="subsection-title">Balance Sheet</div>
        <table class="financial-table">
            <tr><th colspan="2">ASSETS</th></tr>
            <tr><td>Cash in Hand/Bank</td><td class="text-right">Rs. ${auditData.balanceSheet.assets.cashInHand.toLocaleString()}</td></tr>
            <tr><td>Loan Receivables</td><td class="text-right">Rs. ${auditData.balanceSheet.assets.loanReceivables.toLocaleString()}</td></tr>
            <tr><td>Forfeited Inventory</td><td class="text-right">Rs. ${auditData.balanceSheet.assets.forfeitedInventory.toLocaleString()}</td></tr>
            <tr><td>Furniture & Fixtures</td><td class="text-right">Rs. ${auditData.balanceSheet.assets.furnitureFixtures.toLocaleString()}</td></tr>
            <tr class="total-row"><td><strong>Total Assets</strong></td><td class="text-right"><strong>Rs. ${auditData.balanceSheet.assets.totalAssets.toLocaleString()}</strong></td></tr>
        </table>

        <div class="subsection-title">Profit & Loss Account</div>
        <table class="financial-table">
            <tr><th colspan="2">REVENUE</th></tr>
            <tr><td>Interest Income</td><td class="text-right">Rs. ${auditData.profitLoss.revenue.interestIncome.toLocaleString()}</td></tr>
            <tr><td>Sale of Forfeited Items</td><td class="text-right">Rs. ${auditData.profitLoss.revenue.saleOfForfeitedItems.toLocaleString()}</td></tr>
            <tr class="total-row"><td><strong>Total Revenue</strong></td><td class="text-right"><strong>Rs. ${auditData.profitLoss.revenue.totalRevenue.toLocaleString()}</strong></td></tr>
        </table>

        <table class="financial-table">
            <tr><th colspan="2">EXPENSES</th></tr>
            <tr><td>Salaries</td><td class="text-right">Rs. ${auditData.profitLoss.expenses.salaries.toLocaleString()}</td></tr>
            <tr><td>Rent</td><td class="text-right">Rs. ${auditData.profitLoss.expenses.rent.toLocaleString()}</td></tr>
            <tr><td>Utilities</td><td class="text-right">Rs. ${auditData.profitLoss.expenses.utilities.toLocaleString()}</td></tr>
            <tr><td>Miscellaneous</td><td class="text-right">Rs. ${auditData.profitLoss.expenses.miscellaneous.toLocaleString()}</td></tr>
            <tr class="total-row"><td><strong>Total Expenses</strong></td><td class="text-right"><strong>Rs. ${auditData.profitLoss.expenses.totalExpenses.toLocaleString()}</strong></td></tr>
        </table>

        <table class="financial-table">
            <tr class="total-row"><td><strong>Net Profit</strong></td><td class="text-right"><strong>Rs. ${auditData.profitLoss.netProfit.toLocaleString()}</strong></td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">3. PAWN LOAN REGISTER SUMMARY</div>
        <table class="financial-table">
            <tr><th>Category</th><th>Count</th><th>Total Value</th><th>Avg Interest Rate</th></tr>
            <tr><td>Gold Jewelry</td><td>${
              auditData.loanRegister.goldJewelry.count
            }</td><td class="text-right">Rs. ${auditData.loanRegister.goldJewelry.totalValue.toLocaleString()}</td><td class="text-right">${
        auditData.loanRegister.goldJewelry.avgInterestRate
      }%</td></tr>
            <tr><td>Electronics</td><td>${
              auditData.loanRegister.electronics.count
            }</td><td class="text-right">Rs. ${auditData.loanRegister.electronics.totalValue.toLocaleString()}</td><td class="text-right">${
        auditData.loanRegister.electronics.avgInterestRate
      }%</td></tr>
            <tr><td>Others</td><td>${
              auditData.loanRegister.others.count
            }</td><td class="text-right">Rs. ${auditData.loanRegister.others.totalValue.toLocaleString()}</td><td class="text-right">${
        auditData.loanRegister.others.avgInterestRate
      }%</td></tr>
        </table>
    </div>

    <div class="section observations">
        <div class="section-title">4. AUDITOR OBSERVATIONS</div>
        <ul>
            ${auditData.observations.map((obs) => `<li>${obs}</li>`).join("")}
        </ul>
    </div>

    <div class="section">
        <div class="section-title">5. CONCLUSION</div>
        <p>${auditData.conclusion}</p>
    </div>

        <div class="footer">
            Report generated on ${new Date().toLocaleDateString()} by ${
        auditData.generatedBy
      }
        </div>
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: "application/msword" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.doc`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Audit Report
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Generate comprehensive audit reports for GST filing and compliance
            </p>
          </div>
        </div>

        {/* Report Generation Form */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 transition-all duration-200 ${
            isFormUpdating ? "ring-2 ring-blue-200 dark:ring-blue-800" : ""
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generate Audit Report
            </h2>
            {isFormUpdating && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Financial Year
              </label>
              <select
                value={financialYear}
                onChange={(e) => {
                  setIsFormUpdating(true);
                  setFinancialYear(e.target.value);
                  setTimeout(() => setIsFormUpdating(false), 200);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              >
                <option value="">Select Financial Year</option>
                {yearOptions.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Month (Optional)
              </label>
              <select
                value={startMonth}
                onChange={(e) => {
                  setIsFormUpdating(true);
                  setStartMonth(e.target.value);
                  if (e.target.value === "") setEndMonth(""); // Clear end month if start month is cleared
                  setTimeout(() => setIsFormUpdating(false), 200);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              >
                <option value="">All Months</option>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Month (Optional)
              </label>
              <select
                value={endMonth}
                onChange={(e) => {
                  setIsFormUpdating(true);
                  setEndMonth(e.target.value);
                  setTimeout(() => setIsFormUpdating(false), 200);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 disabled:opacity-50"
                disabled={!startMonth}
              >
                <option value="">Select End Month</option>
                {monthOptions
                  .filter(
                    (month) =>
                      !startMonth ||
                      parseInt(month.value) >= parseInt(startMonth)
                  )
                  .map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <p>• Select a financial year to generate the audit report</p>
            <p>• Optionally specify month range (e.g., Jan to Mar 2025)</p>
            <p>• Leave months empty to include the entire financial year</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerateReport}
              disabled={isLoading || isFormUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate Audit Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Audit Report Results */}
        {auditData && (
          <div
            className="space-y-6 opacity-0 animate-fade-in"
            style={{ animation: "fadeIn 0.5s ease-in-out forwards" }}
          >
            {/* Report Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {auditData.title}
                  </h2>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>Audit Period: {auditData.auditPeriod}</p>
                    <p>Location: {auditData.location}</p>
                    <p>License No: {auditData.licenseNo}</p>
                    <p>Prepared by: {auditData.preparedBy}</p>
                    <p>
                      Generated on:{" "}
                      {new Date(auditData.generatedOn).toLocaleDateString()}
                    </p>
                    <p>Generated by: {auditData.generatedBy}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleDownloadReport("word")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileDown className="h-4 w-4" />
                    Download Word
                  </button>
                  <button
                    onClick={() => handleDownloadReport("pdf")}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                     PDF
                  </button>
                  
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                1. Executive Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {auditData.executiveSummary.totalLoans}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Loans
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(auditData.executiveSummary.totalLoanValue)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Loan Value
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {auditData.executiveSummary.activeLoans}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Active Loans
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {auditData.executiveSummary.totalCustomers}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Customers
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Statements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Balance Sheet */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  2. Balance Sheet
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Assets
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Cash in Hand/Bank:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.balanceSheet.assets.cashInHand
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Loan Receivables:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.balanceSheet.assets.loanReceivables
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Forfeited Inventory:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.balanceSheet.assets.forfeitedInventory
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Furniture & Fixtures:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.balanceSheet.assets.furnitureFixtures
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold">
                        <span>Total Assets:</span>
                        <span>
                          {formatCurrency(
                            auditData.balanceSheet.assets.totalAssets
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Liabilities & Equity
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Customer Payables:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.balanceSheet.liabilities.customerPayables
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Bank Overdraft:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.balanceSheet.liabilities.bankOverdraft
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Owner's Equity:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.balanceSheet.equity.ownersEquity
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit & Loss */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Profit & Loss Account
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Revenue
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Interest Income:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.profitLoss.revenue.interestIncome
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Sale of Forfeited Items:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.profitLoss.revenue.saleOfForfeitedItems
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold">
                        <span>Total Revenue:</span>
                        <span>
                          {formatCurrency(
                            auditData.profitLoss.revenue.totalRevenue
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Expenses
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Salaries:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.profitLoss.expenses.salaries
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Rent:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(auditData.profitLoss.expenses.rent)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Utilities:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.profitLoss.expenses.utilities
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Miscellaneous:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            auditData.profitLoss.expenses.miscellaneous
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold">
                        <span>Total Expenses:</span>
                        <span>
                          {formatCurrency(
                            auditData.profitLoss.expenses.totalExpenses
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Net Profit:</span>
                      <span
                        className={
                          auditData.profitLoss.netProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatCurrency(auditData.profitLoss.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loan Register Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                3. Pawn Loan Register Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Gold Jewelry
                  </h4>
                  <p className="text-2xl font-bold text-yellow-600">
                    {auditData.loanRegister.goldJewelry.count}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    loans
                  </p>
                  <p className="text-sm font-medium">
                    {formatCurrency(
                      auditData.loanRegister.goldJewelry.totalValue
                    )}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Electronics
                  </h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {auditData.loanRegister.electronics.count}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    loans
                  </p>
                  <p className="text-sm font-medium">
                    {formatCurrency(
                      auditData.loanRegister.electronics.totalValue
                    )}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Others
                  </h4>
                  <p className="text-2xl font-bold text-green-600">
                    {auditData.loanRegister.others.count}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    loans
                  </p>
                  <p className="text-sm font-medium">
                    {formatCurrency(auditData.loanRegister.others.totalValue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Auditor Observations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                4. Auditor Observations
              </h3>
              <ul className="space-y-2">
                {auditData.observations.map((observation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {observation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conclusion */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                5. Conclusion
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {auditData.conclusion}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
