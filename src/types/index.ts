export interface Participant {
  id: string;
  nickname: string;
  walletAddress?: string;
  /** Snapshot link to a saved friend; omitted for legacy / manual members */
  friendId?: string;
  username?: string;
  /** True when this row is the device user; set on new groups/splits when known */
  isCurrentUser?: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  /** Local-only placeholder until Phase 2 wallet connection */
  mockWalletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  id: string;
  displayName: string;
  username: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
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

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface Split {
  id: string;
  name: string;
  /** Owning group; omitted on legacy splits saved before Groups shipped */
  groupId?: string;
  /** Snapshot of group name at split creation */
  groupName?: string;
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
  | "split_fully_settled"
  | "group_created";
