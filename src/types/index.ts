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

export type ExpenseSplitMode = "equal" | "percentage";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  /** Defaults to equal split when omitted (existing data). */
  splitMode?: ExpenseSplitMode;
  /** Participant id → percent 0–100; used when `splitMode` is `"percentage"`. */
  participantPercents?: Record<string, number>;
}

export interface BalanceEntry {
  id: string;
  from: string;
  to: string;
  amount: number;
  settled: boolean;
  txHash?: string;
}

export type SplitStatus = "active" | "pending" | "disputed" | "settled";

export type ParticipantConfirmationStatus = "pending" | "accepted" | "disputed";

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
  /** Local pre-phase-2 acknowledgement status by participant id */
  participantConfirmations?: Record<string, ParticipantConfirmationStatus>;
}

