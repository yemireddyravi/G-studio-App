export type BankAccountStatus = "connected" | "syncing" | "error" | "disconnected";
export type AccountType = "checking" | "savings" | "credit_card";

export interface BankAccount {
  id: string;
  institution: string;
  name: string;
  accountType: AccountType;
  status: BankAccountStatus;
  balance: number;
  lastSynced: string;
}

export interface Transaction {
  id: string;
  bankAccountId: string;
  bankName: string;
  date: string;
  description: string;
  amount: number; // Positive for income, negative for expense
  category: string;
  status: "pending" | "cleared";
  realTimeSync?: boolean;
}

export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  color: string; // Tailwind color class prefix (e.g., "emerald", "amber", "rose", "blue", "violet")
  icon: string; // Lucide icon component name
}

export interface RealTimeStats {
  totalBalance: number;
  monthlySpent: number;
  monthlyLimit: number;
  monthlyIncome: number;
}
