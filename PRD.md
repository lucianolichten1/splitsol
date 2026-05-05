# SplitSol — MVP Product Requirements Document
**Solana Mobile Hackathon Submission**
Version 2.0 | React Native Expo · Mobile Wallet Adapter · Solana Devnet

---

## 1. Product Summary

SplitSol is a mobile-first Android app that lets friend groups split shared expenses and settle up using SOL on Solana devnet. It removes the friction of manual splitting and cross-app payment coordination by combining expense tracking and wallet-based settlement in a single interface.

The app is built in two distinct phases. Phase 1 produces a fully working expense-splitting app using only local state and AsyncStorage — no blockchain dependency. Phase 2 layers Solana on top: wallet connection via Mobile Wallet Adapter, devnet SOL balances, and real on-chain payment signing. This order means the core product works and can be demoed at any point, and Solana becomes the settlement layer rather than the foundation.

No backend. No accounts. No friction.

---

## 2. Target User

**Primary:** Crypto-native Android users (18–35) who already hold a Solana wallet (Phantom, Solflare, or any MWA-compatible wallet), travel or go out with friends, and prefer settling debts on-chain over Venmo or manual transfers.

**Hackathon demo persona:** A group of 3–4 devs or conference attendees who want to split a dinner check, an Uber, or a hotel. One person pays, others owe them — settled in SOL.

---

## 3. Core User Flow

**Phase 1 (local-first):**
```
Launch → Home (splits list)
  → Create Split → Add participants (by nickname) → Add expenses
  → Auto-calculate who owes what → Review summary
  → Mark payment as settled (local) → Reward earned → History updated
```

**Phase 2 (Solana layer added on top):**
```
Launch → Connect Wallet (optional, enhances experience)
  → Home shows devnet SOL balance + wallet address
  → Split Summary → Pay via MWA signing → TX confirmed on devnet
  → Confirmation shows tx hash → Badge popup
```

Wallet connection is additive. The splitting and rewards flow works without it.

---

## 4. MVP Features

### Phase 1 — Local App (Build First)
- **Home screen** — list of active/settled splits, total balance summary
- **Create Split** — group name, add participants by nickname, equal split type
- **Add Expenses** — line items with description, amount (numeric), and who paid
- **Balance Calculator** — greedy algorithm computing minimum settlements
- **Split Summary** — who owes who, amounts, "Mark as Settled" per balance entry
- **History tab** — past splits stored in AsyncStorage, filterable by status
- **Rewards tab** — points and badges earned from app actions (fully local)
- **Empty states** — friendly UI when no splits or history exist yet

### Phase 2 — Solana Layer (Add After Phase 1 is Complete)
- **Wallet Connect** via Mobile Wallet Adapter (connect, disconnect, display truncated address)
- **Devnet SOL balance** displayed on home screen, pulled from devnet RPC
- **Pay Now** — replaces "Mark as Settled"; sends real SOL via MWA signing on devnet
- **Payment status** — confirmed / pending / failed per balance entry
- **Confirmation screen** — tx hash, devnet explorer deeplink
- **Devnet airdrop button** — request 1 SOL for demo purposes

### Nice-to-Have (If Time Allows, Either Phase)
- Percentage-based custom splits
- QR code or deeplink for payment requests
- Haptic feedback on badge award
- Animated transaction confirmation
- Short tx hash copy button

---

## 5. Screens

| # | Screen | Phase | Purpose |
|---|--------|-------|---------|
| 1 | **Splash** | 1 | Logo, tagline, "Get Started" CTA (no wallet required) |
| 2 | **Home** | 1→2 | Splits list + balance summary card; Phase 2 adds wallet chip + SOL balance |
| 3 | **Create Split** | 1 | Group name, participants (nicknames), split type toggle |
| 4 | **Add Expenses** | 1 | Line item form — description, amount, who paid |
| 5 | **Split Summary** | 1→2 | Balances calculated; Phase 1 shows "Mark Settled", Phase 2 shows "Pay via SOL" |
| 6 | **Pay Screen** | 2 | Confirm SOL amount + recipient address, MWA sign & send |
| 7 | **Confirmation** | 2 | Tx hash, success state, reward badge popup |
| 8 | **History** | 1 | Past splits — date, group, status, total amount |
| 9 | **Rewards** | 1 | Points total, earned badges, progress bar to next badge |

Screens 1–5, 8, 9 are fully functional in Phase 1. Screens 6–7 are Phase 2 only. Screens 2 and 5 get enhanced in Phase 2 without being rebuilt.

---

## 6. Data Model (AsyncStorage — Local Only)

```typescript
// Participant — nickname only in Phase 1; walletAddress added in Phase 2
interface Participant {
  id: string;             // uuid
  nickname: string;
  walletAddress?: string; // Phase 2: required to send SOL; optional otherwise
}

// Expense line item — amount is always a plain number
// Phase 1: treat as a unitless amount (e.g. dollars or arbitrary units)
// Phase 2: amounts are in SOL
interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;         // participant id
}

// Balance entry — output of the calculator, stored with the split
interface BalanceEntry {
  from: string;           // participant id (owes)
  to: string;             // participant id (is owed)
  amount: number;
  settled: boolean;       // Phase 1: toggled manually; Phase 2: set on tx confirm
  txHash?: string;        // Phase 2 only
}

// Split
interface Split {
  id: string;             // uuid
  name: string;
  createdAt: string;      // ISO timestamp
  createdBy: string;      // Phase 1: 'local'; Phase 2: connected wallet public key
  participants: Participant[];
  expenses: Expense[];
  balances: BalanceEntry[];     // computed on save, not recalculated after
  status: 'active' | 'settled';
  totalAmount: number;
}

// Transaction record — Phase 2 only, stored inside BalanceEntry or separately
interface Transaction {
  id: string;
  splitId: string;
  balanceEntryId: string;
  from: string;           // public key
  to: string;             // public key
  amount: number;         // SOL (lamports / 1e9)
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
}

// Rewards — fully functional in Phase 1
interface RewardsProfile {
  totalPoints: number;
  badges: Badge[];
}

interface Badge {
  id: string;
  name: string;
  icon: string;           // emoji
  earnedAt: string;
  description: string;
}

// AsyncStorage keys
// 'splitsol:splits'    → Split[]
// 'splitsol:rewards'   → RewardsProfile
// 'splitsol:wallet'    → { publicKey: string } | null  (Phase 2)
```

**Key design note:** `BalanceEntry.settled` is the single source of truth for whether a payment is done. In Phase 1 the user taps "Mark Settled" to flip it. In Phase 2 the MWA transaction confirmation flips it and also writes `txHash`. No other model changes are needed between phases.

---

## 7. Rewards Logic

Fully implemented in Phase 1. Phase 2 adds two additional triggers but doesn't change the structure.

**Points:**

| Action | Points | Phase |
|--------|--------|-------|
| Create first split | +25 pts | 1 |
| Settle a balance entry (any method) | +20 pts | 1 |
| Fully settle a split | +100 pts | 1 |
| Create 3 splits total | +50 pts bonus | 1 |
| First wallet connect | +50 pts | 2 |
| First on-chain SOL payment | +30 pts | 2 |
| Send 5 on-chain payments | +75 pts bonus | 2 |

**Badges (earned once):**

| Badge | Icon | Trigger | Phase |
|-------|------|---------|-------|
| First Split | 🔱 | Created first split | 1 |
| All Square | ✅ | First fully settled split | 1 |
| Group Treasurer | 🏦 | 3 splits created | 1 |
| On-Chain | ⛓️ | First SOL payment sent | 2 |
| Solana Native | 🌊 | 5 on-chain payments sent | 2 |

Rewards are stored in AsyncStorage and computed deterministically — no server, no sync. All badge checks run after every state-changing action (create split, settle entry, complete split).

---

## 8. Demo Flow (Hackathon Pitch — 3 Minutes)

The demo runs end-to-end using Phase 2 (Solana connected), but every step before step 6 works without it as a fallback.

1. **Open app** → Splash → "Get Started" (no wallet required yet)
2. **Home** → Tap wallet chip → MWA sheet slides up → Connect Phantom → Home shows devnet balance + truncated address
3. **Tap "+"** → Create Split → Name: "ETHDenver Dinner" → Add Alice, Bob, Carlos
4. **Add Expenses** → "Dinner" 0.42 SOL (paid by you) → "Taxi" 0.11 SOL (paid by Alice)
5. **Tap "Calculate"** → Split Summary: Bob owes you 0.14 SOL, you owe Alice 0.06 SOL
6. **Tap "Pay Alice 0.06 SOL"** → Pay screen → MWA signing sheet → Approve → TX confirmed
7. **Confirmation** → tx hash shown → badge popup: "On-Chain ⛓️ +30 pts"
8. **Show History tab** → show settled split → **Show Rewards tab** → badges earned

**Fallback if MWA fails on stage:** Skip steps 2 and 6–7. Use "Mark Settled" instead of "Pay via SOL". The split logic, history, and rewards all work identically. Tell judges: "The Solana layer is built and working — here's the transaction from our test run" (show screenshot of tx hash).

**Key talking points:**
- The app works without a wallet — Solana is the settlement layer, not the gatekeeper
- No backend, no account, no email — wallet IS identity when connected
- Settlement is a real on-chain SOL transfer (show devnet explorer link)
- Rewards gamify the behavior loop entirely client-side

---

## 9. What NOT to Build Yet

- ❌ Real mainnet payments
- ❌ Backend / database / user accounts
- ❌ SPL token support (USDC, etc.)
- ❌ Push notifications
- ❌ ENS / SNS name resolution
- ❌ Multi-currency expense entry (keep it simple for MVP)
- ❌ Group chat or comments on splits
- ❌ iOS support
- ❌ Social login or Privy
- ❌ On-chain split program / smart contract (use direct SOL transfers)
- ❌ Wallet-gated app entry (wallet connect is optional, not required to use the app)

---

## 10. Cursor Implementation Instructions

### Project Setup

```bash
npx create-expo-app SplitSol --template blank-typescript
cd SplitSol

# Phase 1 deps (install all upfront, use Solana ones in Phase 2)
npx expo install \
  @react-native-async-storage/async-storage \
  @react-navigation/native \
  @react-navigation/native-stack \
  @react-navigation/bottom-tabs \
  react-native-safe-area-context \
  react-native-screens \
  expo-haptics \
  expo-crypto
  
# Phase 2 deps (install now, import only in Phase 2)
npx expo install \
  @solana-mobile/mobile-wallet-adapter-protocol \
  @solana/web3.js
```

Install all dependencies upfront. Just don't wire up the Solana imports until Phase 2.

---

### File Structure

```
src/
  screens/
    SplashScreen.tsx
    HomeScreen.tsx
    CreateSplitScreen.tsx
    AddExpensesScreen.tsx
    SplitSummaryScreen.tsx
    PayScreen.tsx           ← Phase 2
    ConfirmationScreen.tsx  ← Phase 2
    HistoryScreen.tsx
    RewardsScreen.tsx
  components/
    SplitCard.tsx
    ExpenseItem.tsx
    BalanceRow.tsx
    BadgePopup.tsx
    WalletChip.tsx          ← Phase 2
    TxStatusBadge.tsx       ← Phase 2
  hooks/
    useSplits.ts            ← CRUD on AsyncStorage
    useRewards.ts           ← points + badge logic
    useWallet.ts            ← Phase 2: MWA connect/sign/send
  lib/
    calculator.ts           ← balance computation
    storage.ts              ← typed AsyncStorage wrappers
    solana.ts               ← Phase 2: RPC client, sendSol()
  constants/
    rewards.ts              ← badge definitions, point values
    theme.ts                ← colors, typography
  navigation/
    RootNavigator.tsx
    TabNavigator.tsx
```

---

### Phase 1 Build Order

Build in this exact sequence. Each step is independently testable.

**Step 1 — Theme + Navigation shell**
Set up `theme.ts` with the full color palette. Build `RootNavigator` (stack) and `TabNavigator` (3 tabs: Splits, History, Rewards) with placeholder screens. Confirm navigation works before writing any logic.

**Step 2 — Storage layer**
Write `storage.ts` with typed `get`, `set`, and `update` wrappers around AsyncStorage. Write `useSplits.ts` hook exposing `getSplits`, `addSplit`, `updateSplit`. Test with hardcoded mock data before connecting to UI.

**Step 3 — Balance calculator**
Write `calculator.ts` as a pure function — no side effects, no imports. Input: `Participant[]` and `Expense[]`. Output: `BalanceEntry[]`. Use the greedy algorithm (sort by net balance, pair largest creditor with largest debtor, iterate). Unit test this function with a few manual examples before wiring it to screens.

```typescript
// lib/calculator.ts
export function computeSettlements(
  participants: Participant[],
  expenses: Expense[]
): BalanceEntry[] {
  // 1. Compute net balance per participant
  //    positive = owed money, negative = owes money
  const net: Record<string, number> = {};
  participants.forEach(p => net[p.id] = 0);
  expenses.forEach(e => {
    const share = e.amount / participants.length;
    participants.forEach(p => {
      net[p.id] -= share;           // everyone shares the cost
    });
    net[e.paidBy] += e.amount;      // payer gets credit
  });

  // 2. Greedy settle
  const creditors = Object.entries(net).filter(([,v]) => v > 0.001)
    .sort((a,b) => b[1]-a[1]);
  const debtors = Object.entries(net).filter(([,v]) => v < -0.001)
    .sort((a,b) => a[1]-b[1]);
  const results: BalanceEntry[] = [];

  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const [credId, cred] = creditors[ci];
    const [debtId, debt] = debtors[di];
    const amount = Math.min(cred, -debt);
    results.push({ from: debtId, to: credId, amount, settled: false });
    creditors[ci][1] -= amount;
    debtors[di][1] += amount;
    if (creditors[ci][1] < 0.001) ci++;
    if (debtors[di][1] > -0.001) di++;
  }
  return results;
}
```

**Step 4 — Rewards hook**
Write `useRewards.ts` with `checkAndAwardRewards(action, splits)` that reads current `RewardsProfile` from storage, evaluates triggers, awards new points/badges if conditions are met, and writes back. Import `rewards.ts` for badge definitions. This hook is called after every state-changing action.

**Step 5 — Screens (in flow order)**
Build one screen at a time, in the order a user would encounter them:
- `SplashScreen` → static, just navigate to Home after 1.5s
- `HomeScreen` → reads splits from `useSplits`, renders `SplitCard` list, FAB navigates to CreateSplit
- `CreateSplitScreen` → controlled form, validates before proceeding to AddExpenses
- `AddExpensesScreen` → line item list + form, "Calculate" runs `computeSettlements` and navigates to SplitSummary
- `SplitSummaryScreen` → renders `BalanceRow` for each entry; "Mark Settled" flips `settled: true`, triggers rewards check
- `HistoryScreen` → reads all splits, filters by status
- `RewardsScreen` → reads `RewardsProfile`, renders badge grid

**Step 6 — Polish**
Empty states on Home and History. `BadgePopup` modal triggered by new badge award in `useRewards`. Haptics on badge award via `expo-haptics`. Confirm the full end-to-end flow works before starting Phase 2.

---

### Phase 2 Build Order

Only start Phase 2 when Phase 1 is fully working and demo-ready.

**Step 7 — Wallet hook**
Write `useWallet.ts` using `@solana-mobile/mobile-wallet-adapter-protocol`. Expose `connect()`, `disconnect()`, `publicKey`, `connected`. Store `publicKey` in AsyncStorage on connect so it survives app restarts.

```typescript
// hooks/useWallet.ts
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol';

async function connect() {
  return await transact(async wallet => {
    const auth = await wallet.authorize({
      cluster: 'devnet',
      identity: { name: 'SplitSol', uri: 'https://splitsol.app', icon: 'favicon.png' }
    });
    return auth.accounts[0].address;
  });
}
```

**Step 8 — Solana RPC**
Write `solana.ts` with `getBalance(publicKey)` and `buildTransferTx(from, to, lamports)`. The tx is built here but signed in `useWallet` via `transact()`. Keep RPC calls isolated in this file.

```typescript
// lib/solana.ts
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

export async function getBalance(pubkey: string): Promise<number> {
  const lamports = await connection.getBalance(new PublicKey(pubkey));
  return lamports / 1e9; // return SOL
}

export async function buildTransferTx(
  from: PublicKey, to: PublicKey, lamports: number
): Promise<Transaction> {
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports })
  );
  tx.feePayer = from;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return tx;
}
```

**Step 9 — Update HomeScreen + SplitSummary**
Add `WalletChip` to `HomeScreen` header. When connected, show devnet balance. On `SplitSummaryScreen`, if wallet is connected and the balance entry recipient has a `walletAddress`, show "Pay via SOL" instead of "Mark Settled".

**Step 10 — PayScreen + ConfirmationScreen**
Build `PayScreen` showing amount + recipient address with a "Sign & Send" button. On tap, call `buildTransferTx`, then `transact()` to sign and send via MWA. On success, navigate to `ConfirmationScreen` with tx hash. Update `BalanceEntry.settled = true` and `txHash`. Trigger rewards check for on-chain payment badges.

**Step 11 — Devnet airdrop button**
Add a small "Request SOL" button on `HomeScreen` (visible only in devnet + connected state). Calls `connection.requestAirdrop(publicKey, 1e9)` and refreshes balance.

---

### Theme

```typescript
// constants/theme.ts
export const colors = {
  primary:     '#9945FF',  // Solana purple
  accent:      '#14F195',  // Solana green
  background:  '#0A0A0F',  // near-black
  surface:     '#141420',  // card background
  border:      '#2A2A3A',
  text:        '#FFFFFF',
  textMuted:   '#8888AA',
  textDim:     '#444466',
  success:     '#14F195',
  error:       '#FF4444',
  warning:     '#FF8866',
};

export const typography = {
  heading:  { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  subhead:  { fontSize: 14, fontWeight: '500' as const, color: colors.text },
  body:     { fontSize: 14, fontWeight: '400' as const, color: colors.text },
  caption:  { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
  mono:     { fontFamily: 'monospace', fontSize: 11, color: colors.textMuted },
};
```

### Navigation Structure

```
RootStack:
  SplashScreen
  MainTabs (Bottom Tab Navigator):
    Tab 1 — Splits → HomeScreen
    Tab 2 — History → HistoryScreen
    Tab 3 — Rewards → RewardsScreen

  Modal Stack (presented over tabs):
    CreateSplitScreen
    AddExpensesScreen
    SplitSummaryScreen
    PayScreen          ← Phase 2
    ConfirmationScreen ← Phase 2
```

### Phase 1 Polish Checklist (Before Starting Phase 2)
- [ ] End-to-end flow works: create → add expenses → calculate → settle → history → rewards
- [ ] Empty states on Home and History
- [ ] Badge popup appears on first split creation
- [ ] Haptic feedback on badge award
- [ ] All splits persist across app restarts (AsyncStorage confirmed)
- [ ] Calculator handles edge cases: one payer, all equal, 2-person split

### Phase 2 Polish Checklist
- [ ] Wallet connect/disconnect works reliably on physical Android device
- [ ] Devnet balance refreshes after connect and after tx
- [ ] Airdrop button tops up balance for demo
- [ ] Pay flow handles tx failure gracefully (show error, don't mark settled)
- [ ] Tx hash displayed truncated (first 8 + last 4 chars) with copy button
- [ ] Devnet explorer deeplink on confirmation screen
- [ ] MWA not available → show friendly error, fall back to manual settle

---

*Built for Solana Mobile Hackathon · Devnet only · No backend · Local storage*
*Phase 1 = working product. Phase 2 = Solana settlement layer.*