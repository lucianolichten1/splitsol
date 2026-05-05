export interface Participant {
  id: string;
  nickname: string;
  walletAddress?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
}

export interface BalanceEntry {
  id: string;
  from: string;
  to: string;
  amount: number;
  settled: boolean;
  txHash?: string;
}

export type SplitStatus = "active" | "settled";

export interface Split {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  participants: Participant[];
  expenses: Expense[];
  balances: BalanceEntry[];
  status: SplitStatus;
  totalAmount: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
}

export interface RewardsProfile {
  totalPoints: number;
  badges: Badge[];
}

export type RewardAction =
  | "split_created"
  | "balance_settled"
  | "split_fully_settled";
