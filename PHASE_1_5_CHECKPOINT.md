# Phase 1.5 checkpoint (stable)

**TypeScript:** `npx tsc --noEmit` completed with exit code 0 when this checkpoint file was added.

---

## Checkpoint summary — Phase 1.5 (stable)

### 1. Current app flow

- **Splash** → **Main tabs** (after “Get Started”): **Groups** | **Splits** (Home) | **History** | **Profile** (stack: Profile, Rewards, Edit profile, Add/Edit friend).
- **Groups tab:** list groups → **Group detail** (members, splits for that group) → **Create/Edit group** (members include **Me**, can’t remove yourself) → optional **Create split** preset.
- **Splits tab (Home):** active splits list + **your** net balance across active splits (“You owe / You are owed / All settled”) → FAB **Create split**.
- **Create split (modal):** pick a **saved group** → name split → **Add expenses** (participants are a **snapshot** of group members, normalized so **Me** is included when the profile is known) → **Calculate** persists split → **Split summary** (balances, user-relative copy, mark settled per row). Rewards hooks run on split/settle events (unchanged by this checkpoint doc).
- **History tab:** all splits, filter all/active/settled → open **Split summary** (same modal stack).
- **Profile:** view/edit **UserProfile**, manage **Friends**, open **Rewards**.

Navigation modals are defined in `RootNavigator.tsx` (Create split, Add expenses, Split summary, Create/Edit group).

---

### 2. Current data models

Defined in `src/types/index.ts`:

| Model | Role |
|--------|------|
| **UserProfile** | Local “current user”: id, displayName, username, optional `mockWalletAddress`, timestamps |
| **Friend** | Saved contact: displayName, username, optional wallet, timestamps |
| **Group** | id, name, optional description, **members: Participant[]**, timestamps |
| **Participant** | id, nickname, optional friendId, username, walletAddress, optional **isCurrentUser** |
| **Split** | id, name, optional groupId/groupName, participants, expenses, balances, status, totalAmount, createdAt, createdBy |
| **Expense** | id, description, amount, paidBy (participant id) |
| **BalanceEntry** | id, from, to, amount, settled, optional txHash (for Phase 2) |
| **RewardsProfile** / **Badge** | Local points and badges |

**Persistence:** AsyncStorage via `src/lib/storage.ts` — keys `splitsol:splits`, `groups`, `profile`, `friends`, `rewards`. No backend.

---

### 3. Important files

| Area | Files |
|------|--------|
| **Navigation** | `RootNavigator.tsx`, `TabNavigator.tsx`, `GroupsStack.tsx`, `ProfileStack.tsx`, `navigateRoot.ts` |
| **Screens** | `SplashScreen`, `HomeScreen`, `CreateSplitScreen`, `AddExpensesScreen`, `SplitSummaryScreen`, `HistoryScreen`, `GroupsScreen`, `GroupDetailScreen`, `CreateEditGroupScreen`, `ProfileScreen`, `EditProfileScreen`, `CreateEditFriendScreen`, `RewardsScreen` |
| **Domain logic** | `lib/calculator.ts` (equal split + greedy settlements), `lib/balanceSummary.ts` (user-relative labels / home aggregate), `lib/currentUserParticipant.ts` (Me / profile resolution) |
| **State** | `hooks/useSplits.ts`, `useGroups.ts`, `useProfile.ts`, `useFriends.ts`, `useRewards.ts` |
| **UI pieces** | `SplitCard`, `GroupCard`, `BalanceRow`, `ExpenseItem`, `BadgePopup` |
| **Theme** | `constants/theme.ts` |

---

### 4. Known limitations

- **All local:** no sync, no multi-device account; clearing app data loses everything.
- **Settlement:** “Mark settled” is **manual** and local only; `txHash` on `BalanceEntry` is unused until Phase 2.
- **Splitting model:** **Equal split only** among all participants on each expense; no per-expense custom shares or percentages (PRD nice-to-have).
- **Currency / units:** amounts are plain numbers (unitless); no multi-currency.
- **Groups vs legacy:** older splits may lack `groupId` / full participant tagging; code defends missing `participants` / `balances` in several places, but very old JSON could still be odd.
- **Wallet:** `mockWalletAddress` on profile is a **placeholder**; not tied to a real chain in Phase 1.5.
- **Rewards:** fully local rules in `useRewards` / `constants/rewards.ts` — not part of Phase 2 scope for this checkpoint.

---

### 5. What is ready for Phase 2

- **Stable split lifecycle:** create from group → expenses → computed balances → summary → per-row settle → split can become fully settled.
- **Participant model** already has optional `walletAddress` and balance `txHash` fields aligned with PRD.
- **Clear “current user” story:** profile + `m-self-{profile.id}` style participants and user-relative UI strings; good hook for “pay as this user” later.
- **Single-app architecture:** one place to add MWA (e.g. Profile/Home), RPC balance, and replace or augment “Mark settled” with real payments.

---

### 6. What to test on Seeker before Phase 2

Seeker is the right device to validate **Android + real hardware** before layering Solana:

- **Cold start & Splash** → tabs, no crashes.
- **Groups:** create/edit, **Me** always present, cannot remove self; friend vs manual members.
- **Splits:** create from group, **Add expenses** (default payer **Me** until user taps another), totals and **Split summary** wording (“you” vs names).
- **Balances:** 2- and 3-person cases (who owes whom, home aggregate vs multiple active splits).
- **History:** filters, open old splits (including any **legacy** data you still have).
- **Profile & friends:** edit profile, add friend, use friend in a group.
- **Rewards:** trigger actions (split created, settle) and confirm UI still behaves (no requirement to change rewards code).
- **Regression:** rotation, background/foreground, low-memory kill/relaunch, **AsyncStorage** persistence across restarts.
- **Phase 2 prep (smoke only, no implementation required here):** note where wallet UI will go; confirm app id / deep links if you plan explorer links later.
