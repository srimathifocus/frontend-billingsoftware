export interface User {
  id: string;
  email: string;
  branch?: string;
  name?: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  // Pawn Shop Stats
  totalLoans: number;
  activeLoans: number;
  repaidLoans: number;
  totalActiveLoanAmount: number;
  totalRepaidLoanAmount: number;
  totalCurrentInterest: number;
  todayBillingAmount: number;
  todayRepaymentAmount: number;
  todayLoanAmount: number;
  todayProfit: number;
  monthlyLoanAmount: number;
  monthlyRepaymentAmount: number;
  monthlyProfit: number;
  totalItems: number;
  pledgedItems: number;
  availableItems: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Pawn Shop Types
export interface Customer {
  _id?: string;
  name: string;
  phone: string;
  address?:
    | string
    | {
        doorNo: string;
        street: string;
        town: string;
        district: string;
        pincode: string;
      };
  nominee?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PawnItem {
  _id?: string;
  code?: string;
  name: string;
  category: string;
  carat?: string;
  weight: number;
  estimatedValue: number;
  status?: "Available" | "Pledged" | "Released";
  createdAt?: string;
  updatedAt?: string;
}

// Alias for consistency with backend
export interface Item extends PawnItem {}

export interface Loan {
  _id?: string;
  loanId: string;
  customerId: string | Customer;
  itemIds?: (string | Item)[];
  amount: number;
  interestType: "monthly" | "yearly" | "daily";
  interestPercent: number;
  validity: string | number;
  loanDate: string;
  status: "active" | "inactive";
  payment?: Payment;
  currentInterest?: number;
  daysPassed?: number;
  totalDue?: number;
  repaymentDetails?: Repayment;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  cash: number;
  online: number;
}

export interface BillingRecord {
  _id?: string;
  customerId: string | Customer;
  loanId: string | Loan;
  items: (string | PawnItem)[];
  payment: Payment;
  createdAt?: string;
  updatedAt?: string;
}

export interface Repayment {
  _id?: string;
  loanId: string | Loan;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  daysPassed: number;
  payment: Payment;
  dateRepaid: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  _id?: string;
  type: "billing" | "repayment";
  mode: "cash" | "online";
  amount: number;
  date: string;
  loanId: string | Loan;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillingCreateRequest {
  customer: Omit<Customer, "_id" | "createdAt" | "updatedAt">;
  items: Omit<PawnItem, "_id" | "status" | "createdAt" | "updatedAt">[];
  loan: {
    amount: number;
    interestType: "monthly" | "yearly" | "daily";
    interestPercent: number;
    validity: string;
  };
  payment: Payment;
}

export interface BillingStats {
  totalLoanAmount: number;
  totalCash: number;
  totalOnline: number;
  totalLoans: number;
}

export interface LoanStats {
  totalLoans: number;
  activeLoans: number;
  repaidLoans: number;
  totalActiveLoanAmount: number;
  totalRepaidLoanAmount: number;
  totalCurrentInterest: number;
  paymentBreakdown: {
    _id: string;
    totalCash: number;
    totalOnline: number;
  }[];
}

export interface TransactionSummary {
  billing: {
    total: number;
    count: number;
    breakdown: {
      cash: { amount: number; count: number };
      online: { amount: number; count: number };
    };
  };
  repayment: {
    total: number;
    count: number;
    breakdown: {
      cash: { amount: number; count: number };
      online: { amount: number; count: number };
    };
  };
}

export interface GroupedTransaction {
  _id: string;
  loanId: string;
  type: "billing" | "repayment";
  date: string;
  totalAmount: number;
  customer: {
    name: string;
    phone?: string;
  };
  paymentMethods: {
    mode: "cash" | "online";
    amount: number;
    transactionId: string;
  }[];
}

export interface RepaymentSearchResult {
  loan: Loan & {
    customerId: Customer;
    itemIds: PawnItem[];
    currentInterest: number;
    daysPassed: number;
    totalDue: number;
  };
}

// Customer Edit History Types
export interface CustomerEditHistory {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    phone: string;
  };
  editedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  editType: "UPDATE" | "DELETE";
  changes: Record<string, { from: any; to: any }>;
  previousData: Customer;
  newData?: Customer;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerEditRequest {
  name?: string;
  phone?: string;
  address?: {
    doorNo?: string;
    street?: string;
    town?: string;
    district?: string;
    pincode?: string;
  };
  nominee?: string;
  reason?: string;
}

export interface CustomerDeleteRequest {
  reason?: string;
}
