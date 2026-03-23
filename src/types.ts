import { format } from 'date-fns';

export type TransactionType = 'income' | 'expense';

export type Category = 
  | 'Food' 
  | 'Transport' 
  | 'Entertainment' 
  | 'Bills' 
  | 'Health' 
  | 'Savings' 
  | 'Other';

export interface Transaction {
  id: string;
  date: string; // ISO string
  amount: number;
  category: Category;
  note: string;
  type: TransactionType;
}

export interface BudgetLimit {
  category: Category;
  limit: number;
  carryOver: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyAllocation: number;
  deadline?: string;
}

export interface AppSettings {
  currency: string;
  soundEnabled: boolean;
  fxEnabled: boolean;
}

export interface MonthSnapshot {
  monthId: string; // YYYY-MM
  transactions: Transaction[];
  budgets: BudgetLimit[];
  goals: Goal[];
}

export interface AppState {
  transactions: Transaction[];
  budgets: BudgetLimit[];
  goals: Goal[];
  settings: AppSettings;
  snapshots: Record<string, MonthSnapshot>;
}

export const CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Entertainment',
  'Bills',
  'Health',
  'Savings',
  'Other'
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: '#00f5ff', // Cyan
  Transport: '#ff2d78', // Pink
  Entertainment: '#9d00ff', // Violet
  Bills: '#ffb800', // Amber
  Health: '#00ff9d', // Emerald
  Savings: '#ffffff', // White
  Other: '#888888' // Gray
};

export const INITIAL_STATE: AppState = {
  transactions: [],
  budgets: CATEGORIES.map(cat => ({ category: cat, limit: 0, carryOver: false })),
  goals: [],
  settings: {
    currency: 'AUD',
    soundEnabled: true,
    fxEnabled: true
  },
  snapshots: {}
};
