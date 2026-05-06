# SplitSol — technical data inventory (for database planning)

This document synthesizes the repo as it exists for planning a future database. It does not imply any schema is implemented.

---

## 1. Current data models / types (`src/types/index.ts`)

### `Participant`

| Field | Type | Required | Meaning |
|--------|------|----------|---------|
| `id` | `string` | yes | Ephemeral row id for this person **in this group or split** (e.g. `m-self-${profile.id}`, `m-${timestamp}-…`, or friend-derived). |
| `nickname` | `string` | yes | Display label in UI. |
| `walletAddress` | `string` | no | Optional chain address snapshot. |
| `friendId` | `string` | no | Links row to a saved `Friend.id` when added from friends. |
| `username` | `string` | no | Often copied from friend or profile for matching. |
| `isCurrentUser` | `boolean` | no | UI / logic hint that this row is “you”. |

**Represents:** A **denormalized snapshot** of someone on a group or split—not a global user row.

**Used in:** `Group.members`, `Split.participants`, navigation params to `AddExpenses`, `Expense.paidBy`, `BalanceEntry.from` / `to`, helpers in `src/lib/currentUserParticipant.ts`, `calculator.ts`, `balanceSummary.ts`, many screens.

---

### `UserProfile`

| Field | Type | Required | Meaning |
|--------|------|----------|---------|
| `id` | `string` | yes | Profile id (UUID via `createDefaultUserProfile`). |
| `displayName` | `string` | yes | Shown name. |
| `username` | `string` | yes | Normalized lowercase in `useProfile.updateProfile`. |
| `mockWalletAddress` | `string` | no | Local placeholder until “real” wallet (per comments). |
| `createdAt` | `string` (ISO) | yes | |
| `updatedAt` | `string` (ISO) | yes | |

**Represents:** The **single local device user** identity.

**Used in:** `useProfile`, `SplashScreen` (`storage.ensureProfile`), profile/edit screens, matching to `Participant` via `currentUserParticipant.ts`, aggregates in `balanceSummary.ts`.

---

### `Friend`

| Field | Type | Required | Meaning |
|--------|------|----------|---------|
| `id` | `string` | yes | UUID (`randomUuid` in `useFriends.addFriend`). |
| `displayName` | `string` | yes | |
| `username` | `string` | yes | Unique among friends (case-insensitive). |
| `walletAddress` | `string` | no | |
| `createdAt` / `updatedAt` | `string` | yes | |

**Represents:** A **saved contact** in the local address book (not necessarily on a group).

**Used in:** `useFriends`, `CreateSplitScreen` (direct mode), `CreateEditGroupScreen` / `FriendsGroupsScreen` for picking people; when added to a group/split, copied into a `Participant` with `friendId` set.

---

### `ExpenseSplitMode` (type alias)

- `"equal" | "percentage"` — how an expense is shared among `Split.participants`.

---

### `Expense`

| Field | Type | Required | Meaning |
|--------|------|----------|---------|
| `id` | `string` | yes | Client-generated (e.g. `e-${Date.now()}-…`). |
| `description` | `string` | yes | |
| `amount` | `number` | yes | Total for this line. |
| `paidBy` | `string` | yes | **Participant id** of payer. |
| `splitMode` | `ExpenseSplitMode` | no | Defaults to equal when omitted (legacy). |
| `participantPercents` | `Record<string, number>` | no | Participant id → 0–100 when `splitMode === "percentage"`. |

**Represents:** One line item inside a split.

**Used in:** `AddExpensesScreen`, `calculator.ts` (`expenseSharesForParticipants`, `computeParticipantNets`, `computeSettlements`), `ExpenseItem`, persisted inside `Split.expenses`.

---

### `BalanceEntry`

| Field | Type | Required | Meaning |
|--------|------|----------|---------|
| `id` | `string` | yes | e.g. `balance-${from}-${to}-${seq}`. |
| `from` | `string` | yes | Debtor **participant id**. |
| `to` | `string` | yes | Creditor **participant id**. |
| `amount` | `number` | yes | Owed amount (one direction). |
| `settled` | `boolean` | yes | Local “marked paid” flag. |
| `txHash` | `string` | no | Reserved for on-chain proof (unused in flow today). |

**Represents:** One **pairwise settlement edge** after netting (not a full payment rail).

**Used in:** Produced by `computeSettlements`, stored on `Split.balances`, read in `SplitSummaryScreen`, `BalanceRow`, `WalletScreen`, `netForUserInSplitBalances`, `markBalanceSettled` in `useSplits`.

---

### `SplitStatus`

`"active" | "pending" | "disputed" | "settled"`

**Note:** Values exist on `Split.status`, but **after load the hook re-derives** status (see §4). The stored string can disagree with derived status until the next `normalizeSplit`.

---

### `ParticipantConfirmationStatus`

`"pending" | "accepted" | "disputed"`

**Represents:** Per-participant **acknowledgement** of the split (local simulation; comment in UI: “future multi-user”).

**Stored as:** `Split.participantConfirmations?: Record<participantId, ParticipantConfirmationStatus>`.

**Used in:** `AddExpensesScreen` (initial map), `SplitSummaryScreen` (Accept/Dispute for current user only), `useSplits.setParticipantConfirmation`, and **`deriveSplitStatus` in `useSplits`** (drives `pending` / `disputed` vs `active`).

---

### `Group`

| Field | Type | Required | Meaning |
|--------|------|----------|---------|
| `id` | `string` | yes | e.g. `g-${Date.now()}`. |
| `name` | `string` | yes | |
| `description` | `string` | no | |
| `members` | `Participant[]` | yes | Full member list embedded. |
| `createdAt` / `updatedAt` | `string` | yes | |

**Represents:** A reusable **group container** with embedded roster.

**Used in:** `useGroups`, `CreateEditGroupScreen`, `GroupDetailScreen`, `FriendsGroupsScreen`, `GroupsScreen`, `CreateSplitScreen` (group mode reads latest from `storage.getGroups` for snapshot).

---

### `Split` (the app’s “transaction”)

| Field | Type | Required | Meaning |
|--------|------|----------|---------|
| `id` | `string` | yes | e.g. `s-${Date.now()}`. |
| `name` | `string` | yes | Transaction title. |
| `groupId` | `string` | no | Set for group-backed splits; **omitted** for direct. |
| `groupName` | `string` | no | Snapshot label (“Direct” or group name at creation). |
| `createdAt` | `string` | yes | |
| `createdBy` | `string` | yes | Today literal `"local"`. |
| `participants` | `Participant[]` | yes | Snapshot for this transaction. |
| `expenses` | `Expense[]` | yes | |
| `balances` | `BalanceEntry[]` | yes | Derived settlement edges. |
| `status` | `SplitStatus` | yes | **Overwritten on read** by `normalizeSplit` in `useSplits`. |
| `totalAmount` | `number` | yes | Sum of expense amounts. |
| `participantConfirmations` | `Record<…>` | no | Per-participant ack state. |

**Represents:** One **bill / transaction** (what the product often calls “transaction” in UI) with frozen participants and line items.

**Used in:** `useSplits`, list/detail screens, `WalletScreen`, `getGroupSplitStatsMap`, etc.

---

## 2. Current local storage (`src/lib/storage.ts`)

All values are **JSON in AsyncStorage** via `getJSON` / `setJSON` / `updateJSON`.

| Key | Value shape | TS type | Written by | Read by |
|-----|-------------|---------|------------|---------|
| `splitsol:splits` | `Split[]` | `Split[]` | `storage.setSplits`, `updateSplits`; `useSplits` (`addSplit`, `markBalanceSettled`, `setParticipantConfirmation` uses `setSplits`); indirectly any code using `storage.updateSplits` | `useSplits.refresh`, `useGroups.deleteGroup` (checks splits for `groupId`), `CreateSplitScreen` (split stats via hooks / storage for groups) |
| `splitsol:groups` | `Group[]` | `Group[]` | `useGroups` (`addGroup`, `updateGroup`, `deleteGroup`, member add/remove) | `useGroups.refresh`, `CreateSplitScreen.continueNext` (**direct `storage.getGroups`** for freshest group), `useGroups.deleteGroup` |
| `splitsol:profile` | one object or null | `UserProfile \| null` (treated as non-null after ensure) | `setProfile`, `updateProfile`, `ensureProfile` | `useProfile`, `SplashScreen.ensureProfile` |
| `splitsol:friends` | `Friend[]` | `Friend[]` | `useFriends` (add/update/delete) | `useFriends.refresh` |

**Note:** There is **no separate key** for expenses, balances, or confirmations—they live **inside** each `Split` in the `splits` array.

---

## 3. Hooks / state layer

### `useProfile` (`src/hooks/useProfile.ts`)

- **State:** `profile: UserProfile | null`, `loading`.
- **API:** `refreshProfile`, `getProfile` → `storage.ensureProfile`, `updateProfile` (patch displayName, username, mockWalletAddress).
- **Callers:** Most screens that need “you”; `SplashScreen` calls `storage.ensureProfile` directly once.
- **Likely DB table:** `profiles` (or `users`) **scoped to auth user**, one row per account.

---

### `useFriends` (`src/hooks/useFriends.ts`)

- **State:** `friends: Friend[]`, `loading`.
- **API:** `refresh`, `getFriends`, `getFriendById`, `addFriend`, `updateFriend`, `deleteFriend`.
- **Callers:** `FriendsGroupsScreen`, `CreateSplitScreen`, `CreateEditGroupScreen`, `CreateEditFriendScreen` (also reachable from Profile stack).
- **Likely DB table:** `friends` or `friendships` (owner user id + counterparty or friend record).

---

### `useGroups` (`src/hooks/useGroups.ts`)

- **State:** `groups: Group[]`, `loading`.
- **API:** `refresh`, `getGroupById`, `getGroups`, `addGroup`, `updateGroup`, `deleteGroup` (blocked if any split references `groupId`), `addMemberToGroup`, `removeMemberFromGroup`.
- **Callers:** People tab, group list/detail, create/edit group, transactions (for filters), create split.
- **Likely DB tables:** `groups`, `group_members` (normalize embedded `members[]`).

---

### `useSplits` (`src/hooks/useSplits.ts`)

- **State:** `splits: Split[]` (normalized), `loading`; **derived:** `activeSplits`, `settledSplits`.
- **API:** `refresh`, `addSplit`, **`updateSplit` (exported but no call sites in repo)**, `markBalanceSettled`, `setParticipantConfirmation`.
- **Normalization:** Every read/update runs `deriveSplitStatus` (see §4).
- **Callers:** Home, Transactions, History, Wallet, Group detail, Split summary, Add expenses, Create split (stats), Friends groups.
- **Likely DB tables:** `splits` (or `transactions`), `split_participants`, `expenses`, `balance_entries`, `participant_confirmations`; or document/json column if you keep denormalized blob initially.

---

### Wallet-specific hooks

- **None.** `WalletScreen` composes `useProfile` + `useSplits` only.

---

## 4. Transaction / split logic (end-to-end)

### Creating a “transaction” (split)

1. **`CreateSplitScreen`** (`src/screens/CreateSplitScreen.tsx`): User chooses **group** or **direct**; builds a **participant snapshot** (group: subset of group members; direct: self + friends/manual rows). Navigates to `AddExpenses` with `name`, `participants`, optional `groupId`, optional `groupName` (`"Direct"` for direct).
2. **`AddExpensesScreen`**: User adds one or more expenses; on each **Add expense**, **`saveSplit`** runs when there is at least one expense: computes balances, builds `Split`, **`addSplit`**, navigates to Transactions tab.

### Adding expenses

- **`AddExpensesScreen`**: Validates payer and amount; optional **equal vs percentage** split per expense; appends to local `expenses` state then persists whole split via `saveSplit`.

### Calculating balances

- **`src/lib/calculator.ts`**:  
  - `expenseSharesForParticipants` → per-person share (equal or %).  
  - `computeParticipantNets` → net per participant.  
  - `computeSettlements` → greedy pairwise **`BalanceEntry[]`** (`from` owes `to`).

### Participant confirmations

- **Set on create** in `AddExpensesScreen`: current user `accepted`, everyone else `pending`.
- **Updated in UI** in `SplitSummaryScreen` via `setParticipantConfirmation` (only if viewer id matches row—**you** can tap Accept/Dispute; others show readonly pending until changed in storage by some other means—there is none today).

### Marking settled

- **`SplitSummaryScreen`** → `markBalanceSettled(splitId, balanceId)` flips **`BalanceEntry.settled`** to `true` for that edge. **`txHash` is not set** in app flow.

### `SplitStatus` derivation (`deriveSplitStatus` in `useSplits.ts`)

Order of checks:

1. If **`balances.length > 0`** and **every** balance has `settled === true` → **`settled`**.
2. Else if any confirmation is **`disputed`** → **`disputed`**.
3. Else if any confirmation is **`pending`** → **`pending`**.
4. Else → **`active`**.

**Important:** Initial `status` set in `AddExpensesScreen` (`settled` if no balance rows, else `pending`) is **not authoritative** after `addSplit`; **`normalizeSplit` overwrites** using the rules above. Edge case: **empty `balances`** but **pending** confirmations → derived **`pending`**, not `settled`.

### Current-user balance (per split / lists)

- **`resolveCurrentUserParticipantId(participants, profile)`** (`currentUserParticipant.ts`): match by `m-self-${profile.id}`, or wallet, or username.
- **`netForUserInSplitBalances(me, balances)`** (`balanceSummary.ts`): sum **unsettled** edges where you are `to` (owed) minus where you are `from` (owe).
- **`getCurrentUserBalanceSummary`**: same nets + human-readable lines for summary.
- **`aggregateCurrentUserBalanceAcrossSplits`**: sums nets across splits **skipping `split.status === "settled"`** entirely (not “per open balance” only—**whole split omitted**).

**Files:** `SplitCard` / `HomeScreen` / `TransactionsScreen` / `HistoryScreen` / `GroupDetailScreen` use `netForUserInSplitBalances`; `SplitSummaryScreen` uses `getCurrentUserBalanceSummary`; `HomeScreen` may use aggregate for header (per imports).

---

## 5. Relationships between models (conceptual)

- **UserProfile → Participant:** Not a FK. Participant id for self is **deterministic** `m-self-${profile.id}` when created via `makeSelfParticipant`; matching also uses username/wallet.
- **Friend → Participant:** Optional **`friendId`** on participant; participant **`id`** is still a **new** string when added to group/direct (except self pattern).
- **Group → Participant:** **Embedding**; `Group.members` is the source for group-mode splits until a **new snapshot** is taken in `CreateSplitScreen`.
- **Group → Split:** Optional **`groupId`** + snapshot **`groupName`**. Editing the group later **does not** retroactively change old splits.
- **Split → Expense:** **1:N** array on split.
- **Split → BalanceEntry:** **1:N** computed array; regenerating balances **is not** done on edit today (no expense edit flow).
- **Split → participantConfirmations:** **1:1 map** participant id → status; only your row is interactive.
- **BalanceEntry → payment:** **`settled`** is local boolean; **`txHash`** reserved; no separate payment entity.

---

## 6. Screens and data (main surfaces)

### People tab — **`FriendsGroupsScreen`** (+ stack: groups list, group detail, friend editor)

- **Reads:** `useFriends`, `useGroups`, `useSplits` (e.g. stats), `useProfile` indirectly via flows.
- **Writes:** Navigation to create/edit friend/group; not direct storage except via child screens.

### **GroupsScreen** (“All groups”)

- **Reads:** `useGroups`, `useSplits` (stats).
- **Writes:** Via navigation to create group / FAB.

### **GroupDetailScreen**

- **Reads:** `getGroupById`, `useSplits` (splits for group), `useProfile`.
- **Writes:** `deleteGroup` (if allowed), navigate to create split / edit group.

### **Transactions** — **`TransactionsScreen`**

- **Reads:** `useSplits`, `useGroups` (filters), `useProfile`.
- **Writes:** FAB → `CreateSplit` (no direct split write here).

### **Wallet** — **`WalletScreen`**

- **Reads:** `useProfile`, `useSplits`; aggregates **unsettled** balance rows on **filtered** splits; counts splits by **derived** `split.status`.
- **Writes:** None (display/dashboard).

### **Profile** — **`ProfileScreen`**, **`EditProfileScreen`**

- **Reads / writes:** `useProfile` only (`updateProfile` on edit).

### **Create transaction** — **`CreateSplitScreen`**

- **Reads:** `useGroups`, `useFriends`, `useProfile`, `useSplits`; **`storage.getGroups`**, **`storage.ensureProfile`** on submit path.
- **Writes:** None to storage directly; navigates with participant payload.

### **Add expenses** — **`AddExpensesScreen`**

- **Reads:** route params, `useProfile`, `useSplits` (`addSplit`).
- **Writes:** **`addSplit`** → full new `Split` in AsyncStorage.

### **Split summary** — **`SplitSummaryScreen`**

- **Reads:** `useSplits` (`splits`, `refresh`), `useProfile`.
- **Writes:** `markBalanceSettled`, `setParticipantConfirmation`.

### **Create/Edit group** — **`CreateEditGroupScreen`**

- **Reads:** `useGroups`, `useFriends`, `useProfile`.
- **Writes:** `addGroup` / `updateGroup`.

### **Create/Edit friend** — **`CreateEditFriendScreen`**

- **Reads:** `useFriends`.
- **Writes:** `addFriend`, `updateFriend`, `deleteFriend`.

### Also relevant

- **`HomeScreen`**: `activeSplits`, profile, aggregates.
- **`HistoryScreen`**: all `splits` with filters (read-only list).

---

## 7. Database planning notes (suggested direction)

Below is a **relational sketch** aligned to current concepts—not implementation.

| Table | PK | Suggested columns | FKs | Indexes / notes |
|-------|----|-------------------|-----|------------------|
| **profiles** | `id` (uuid) | `display_name`, `username` (unique per tenant), `wallet_address` nullable, `created_at`, `updated_at` | — | Unique (`owner_id`, `username`) if multi-tenant; **RLS**: row = auth user. |
| **friends** | `id` | `owner_user_id`, `display_name`, `username`, `wallet_address`, timestamps | `owner_user_id` → profiles/users | Index `(owner_user_id, username)`. |
| **groups** | `id` | `owner_user_id` or `created_by`, `name`, `description`, timestamps | | Index `owner_user_id`. |
| **group_members** | `id` or `(group_id, user_ref)` | `group_id`, `participant_key` or `friend_id` nullable, `nickname_snapshot`, `wallet_snapshot`, role | `group_id` → groups | Unique `(group_id, stable_member_id)` once you define identity. |
| **splits** (transactions) | `id` | `created_by`, `name`, `group_id` nullable, `group_name_snapshot`, `status` (derived or stored), `total_amount`, `created_at`, `participant_confirmations` *or* normalized | `group_id` → groups nullable | Index `(created_by)`, `(group_id)`, `(status, created_at)`. |
| **split_participants** | `id` | `split_id`, `display_name`, `friend_id` nullable, `profile_user_id` nullable if real accounts, `sort_order` | `split_id` | Index `split_id`; map to balance `from`/`to` via this id. |
| **expenses** | `id` | `split_id`, `description`, `amount`, `paid_by_participant_id`, `split_mode`, timestamps | `split_id`, `paid_by` → split_participants | Index `split_id`. |
| **expense_percent_shares** | composite | `expense_id`, `participant_id`, `percent` | | Only when mode = percentage. |
| **balance_entries** | `id` | `split_id`, `from_participant_id`, `to_participant_id`, `amount`, `settled`, `tx_hash` nullable | `split_id` | Index `(split_id, settled)`. |
| **participant_confirmations** | composite or `id` | `split_id`, `participant_id`, `status`, `updated_at` | | Unique `(split_id, participant_id)`. |
| **settlements_payments** (later) | `id` | `balance_entry_id`, `payer`, `amount`, `chain_tx`, `status` | | Optional when you outgrow `settled` + `tx_hash`. |

**Security / RLS (later):** splits and children readable only to participants (or to group members if you define that); friends scoped to owner; profile row to self.

---

## 8. Migration notes (local → DB)

| Current artifact | Maps to |
|------------------|---------|
| `splitsol:profile` single JSON | **profiles** (1 row per authenticated user). |
| `splitsol:friends` | **friends** (+ `owner_user_id`). |
| `splitsol:groups` + embedded `members` | **groups** + **group_members** (store snapshots or live FKs). |
| `splitsol:splits` blob | **splits** + **split_participants** + **expenses** (+ percent table) + **balance_entries** + **participant_confirmations**. |

**Stays local (possibly forever):** draft UI state, navigation params, unsaved form state, client-only prefs.

**Becomes user-specific:** profile, friends, groups (if per-user), splits they created or participate in.

**Needs multi-user sync:** confirmations, balance settlement truth, future real-time group membership—today **only one device** writes everything.

**Can wait:** `txHash`, payment records, Solana-specific tables—schema can leave nullable columns.

**ID strategy:** Today mixes `g-${Date.now()}`, `s-${Date.now()}`, `randomUuid`, and random `m-…` participant ids. DB should use **UUIDs or server ids** and a clear rule for **participant id stability** across split/group.

---

## 9. Risks / questions before DB design

1. **Naming:** UI says **“transaction”**; model is **`Split`**. DB name should be chosen once (e.g. `splits` vs `transactions`) to avoid confusion.
2. **Two notions of “settled”:** **`BalanceEntry.settled`** vs **`Split.status === "settled"`** (derived from all balances + confirmation rules). Document which is source of truth for reporting.
3. **Aggregate vs per-split net:** `aggregateCurrentUserBalanceAcrossSplits` **skips entire splits** when `status === "settled"`; `netForUserInSplitBalances` only sums **unsettled** edges. Misaligned expectations if status derivation and balance flags diverge.
4. **Empty balances + confirmations:** Derived status may be **`pending`** even if creator intended “everyone even” (no edges)—worth defining product rules.
5. **Group snapshot vs live group:** `Split.participants` and `groupName` are frozen; **group edits don’t update splits**—DB should keep `group_id` optional + snapshots explicit.
6. **Identity graph:** **Profile id**, **Friend id**, **Participant id**, and **`m-self-${profile.id}`** coexist; multi-user sync needs a **canonical user id** on each participant.
7. **Direct splits:** `groupId` absent; `groupName` often `"Direct"`—first-class in filters (`WalletScreen`, `TransactionsScreen`).
8. **`updateSplit` unused:** Either future feature or dead API—migration shouldn’t assume expense edits exist.
9. **`createdBy: "local"`:** Placeholder for real user / device id.
10. **No server clock / ordering:** `Date.now()` ids risk collisions if bulk-created—UUID recommended server-side.
