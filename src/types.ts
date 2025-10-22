export type TransactionKind = 'saving' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionKind;
  amount: number;
  note?: string;
  createdAt: string; // ISO string
}

export interface TrendPoint {
  date: string; // yyyy-mm-dd
  savings: number;
  expenses: number;
  net: number;
}

export type TrendDirection = 'down' | 'flat' | 'up';
export type TrendMood = 'happy' | 'neutral' | 'sad';

export interface TrendSummary {
  points: TrendPoint[];
  windowDays: number;
  totalSavings: number;
  totalExpenses: number;
  net: number;
  averageDailyNet: number;
  direction: TrendDirection;
  mood: TrendMood;
  backgroundTint: string;
  changeFromPreviousWindow: number;
  previousWindowNet: number;
}

export interface UseStorageState {
  loading: boolean;
  error: string | null;
  transactions: Transaction[];
  balance: number;
  trend: TrendSummary;
}
