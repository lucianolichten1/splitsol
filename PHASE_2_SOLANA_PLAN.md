# Phase 2 — Solana Mobile integration plan (SplitSol)

This document plans Phase 2 only. **No Solana code, app-logic changes, database, or UI redesign** are implied until implementation begins. **Phase 1.6** (Friends & Groups, Transactions, Wallet, Profile, local AsyncStorage) stays the source of truth for navigation and data shape.

**Out of scope for this phase:** rewards (removed), any server/database, redesign of tab structure or visual system.

---

## 1. Goal of Phase 2

Add a **Solana devnet settlement layer** on top of the existing local-first app:

- Connect an on-device wallet via **Mobile Wallet Adapter (MWA)** on **Android** (primary target: **Seeker** and MWA-compatible wallets).
- Show **devnet SOL balance** and support a **devnet airdrop** for demos.
- Let the current user **pay a specific `BalanceEntry` in SOL** (sign + send), then **persist `txHash`** on that entry and show a **confirmation** screen with an **explorer link**.
- Preserve **manual settlement** when the user cannot or will not use chain (wallet missing, RPC errors, user rejection).

Core splitting, groups, friends, and history remain **local AsyncStorage** only—no new persistence backend.

---

## 2. Why Expo Go is not enough and why we need a custom Android development build

**Expo Go** is a generic client. **Mobile Wallet Adapter** relies on:

- **Native Android integration** (e.g. intent-based association between the dApp and wallet apps, and MWA-specific native wiring expected by the Solana Mobile stack).
- **A stable app identity** (your package name / signing) so wallets can treat SplitSol as a first-class requesting app—not the Expo Go host.

**Custom development builds** (Expo `expo-dev-client` or equivalent **prebuild + run** workflow) compile **your** native project with the plugins and native dependencies MWA needs. That is what Seeker and production-like testing require.

**Practical rule:** Phase 2 development and QA assume **installing a dev build APK** on device, not scanning Expo Go.

---

## 3. Required dependencies for Solana Mobile / Mobile Wallet Adapter

Plan to add (exact versions pinned at implementation time; names are the usual stack):

| Area | Packages / pieces |
|------|-------------------|
| Solana RPC + transactions | `@solana/web3.js` |
| MWA protocol + Web3.js binding | `@solana-mobile/mobile-wallet-adapter-protocol`, `@solana-mobile/mobile-wallet-adapter-protocol-web3.js` |
| RN / JS crypto & encoding helpers | Often `buffer`, `react-native-get-random-values` (or Expo-aligned equivalents), `text-encoding` if needed by toolchain |
| Custom native client | `expo-dev-client` (if staying on Expo managed workflow with prebuild) |
| Build / config | `expo-build-properties` or direct **Gradle** tweaks if required by MWA template docs at implementation time |

**Note:** Follow the **current Solana Mobile + Expo/React Native** quickstart when pinning versions; the ecosystem moves faster than this doc.

---

## 4. Android / Seeker setup

1. **Developer mode** on Seeker (or test Android device) and **USB debugging** as needed.
2. **Install a compatible wallet** (Seeker built-in wallet and/or Phantom Mobile, etc., per MWA compatibility).
3. **Network:** wallet and app both on **Solana devnet** for demos.
4. **Build:** generate and install the **development build APK** (not Expo Go).
5. **RPC:** configure a **devnet RPC URL** (public or project-specific) with sane rate limits; document env for local dev only (no secrets in repo if using paid RPC keys).

---

## 5. Wallet connect flow

**High-level:**

1. User opens **Wallet** tab (primary) or triggers connect from Profile if we keep a single “source of truth” CTA—*implementation chooses one primary entry to avoid duplicate state*, without redesigning tabs.
2. App starts an **MWA session** (authorize); user approves in the wallet.
3. App receives **authorized account(s)**; store **`publicKey` (base58)** as the connected address.
4. **Profile** should reflect the same address (see §6). **Disconnect** clears session state and UI.

**Edge cases to handle in implementation:** no wallet installed, user dismisses sheet, timeout, wrong cluster (mainnet vs devnet)—surface clear errors and leave local data untouched.

---

## 6. How wallet address maps to Profile and Wallet screen

**Today (Phase 1.6):**

- `UserProfile` includes `mockWalletAddress?: string` — a **local placeholder** (`src/types/index.ts`, `useProfile` / `storage`).
- **Profile** screen shows that field as “Wallet” (`ProfileScreen.tsx`).
- **Wallet** tab has a **non-functional** “Connect Wallet” placeholder (`WalletScreen.tsx`).

**Phase 2 mapping (conceptual):**

- On successful MWA authorize, persist the **real** public key in the same storage path Profile already uses—**either** by continuing to use `mockWalletAddress` as the persisted display/connect field **or** by renaming in a follow-up refactor. **Prefer minimal churn:** keep Phase 1.6 fields stable; treat `mockWalletAddress` as “last known on-chain address” until a rename is justified.
- **Wallet** tab: show **connection status**, **truncated address**, **devnet SOL balance**, **airdrop** (§7–8), and keep existing **local** net owed/owe cards unchanged in spirit (no redesign).
- **Profile** tab: show the **same** truncated address so identity and wallet stay consistent.
- **Participant `walletAddress`:** optional field on `Participant` already exists for payee resolution; payment flow should resolve **recipient** from the **creditor participant** (`balance.to`) and require an address before Pay (or fall back to manual—§12).

---

## 7. Devnet SOL balance display

- After connect, use `@solana/web3.js` **`Connection.getBalance`** (devnet) for the authorized pubkey.
- Show **SOL** with modest formatting (e.g. 4–6 decimals) and **loading / error** states.
- Refresh on **Wallet focus**, **after successful tx**, and optionally **pull-to-refresh** if we add it without layout redesign.

---

## 8. Devnet airdrop button

- Expose a **“Request devnet SOL”** control on **Wallet** (demo-only).
- Call **`requestAirdrop`** + **`confirmTransaction`** (or polling) with strict **rate-limit / cooldown** UX to avoid hammering public RPC.
- Guard with **devnet-only** checks so production builds are safe by configuration.

---

## 9. Pay via SOL from a BalanceEntry

**Context:** `BalanceEntry` already has `id`, `from`, `to`, `amount`, `settled`, optional `txHash` (`src/types/index.ts`).

**Flow:**

1. From **Split Summary**, for a row where **`balance.from` is the current user**, **`settled` is false**, and **amount** is the SOL owed:
2. **Pay via SOL** builds a **devnet** transfer from **user’s connected pubkey** to **`Participant.walletAddress`** for **`balance.to`** (creditor).
3. If creditor has no `walletAddress`, **block Pay** and point user to **manual settle** or editing participant metadata—*without* adding database; still local-only.
4. Use MWA to **sign and send**; on **confirmed** success, update storage: **`settled: true`**, **`txHash`** set, then navigate to confirmation (§11).

**Amount semantics:** PRD already notes Phase 2 treats amounts as SOL for settlement; implementation must align **expense amounts** and **balance amounts** with that rule consistently (no redesign—just consistent units when turning on chain).

---

## 10. Saving `txHash` on `BalanceEntry`

- Extend **`useSplits`** / storage update helpers to accept **`txHash`** (and optionally a **`settledAt`** later—only if needed; not required by this plan).
- Ensure **History / Transactions** views show settled rows consistently with **`txHash`** when present (minimal UI delta: small “on-chain” indicator or hash snippet—no full redesign).
- **Idempotency:** if save fails after broadcast, avoid double-pay—implementation should reconcile via wallet history or explicit “pending” state *only if necessary*; if kept simple, use user-confirmed retry with caution.

---

## 11. Confirmation screen and devnet explorer link

- Add a **modal stack screen** (or reuse **Split Summary** inline success—prefer **dedicated screen** per PRD) showing:
  - success / failure
  - **truncated `txHash`** + **copy** (optional nice-to-have)
  - **Open in explorer** → Solana **devnet** explorer URL for the signature
- **Back** returns to **Split Summary** with updated row state.

**Navigation:** extend `RootStackParamList` in `RootNavigator.tsx` with a `PaymentConfirmation`-style route when implementing.

---

## 12. Manual fallback if wallet / payment fails

Preserve **`markBalanceSettled`** (or equivalent) as **“Mark settled locally”** when:

- Wallet not connected
- User rejects signature
- RPC / simulation errors
- Payee has no `walletAddress`

Copy should clarify this is **off-chain bookkeeping** only. **Phase 1.6 behavior must remain available** so demos never block on chain.

---

## 13. Files likely to change

| File / area | Why |
|-------------|-----|
| `package.json` | New dependencies, scripts for dev client |
| `app.json` / `app.config.*` | Plugins, Android package, intent / MWA config per docs |
| `android/**` | Prebuild output; Gradle, manifests |
| `src/screens/WalletScreen.tsx` | Connect, balance, airdrop |
| `src/screens/ProfileScreen.tsx` | Show connected address |
| `src/hooks/useProfile.ts`, `src/lib/storage.ts` | Persist wallet public key |
| `src/screens/SplitSummaryScreen.tsx`, `src/components/BalanceRow.tsx` | Pay CTA, tx state, manual fallback |
| `src/hooks/useSplits.ts`, `src/lib/storage.ts` | Update `BalanceEntry` with `txHash`, settled |
| `src/navigation/RootNavigator.tsx` | Payment confirmation route |
| New: `src/screens/PaymentConfirmationScreen.tsx` (name TBD) | Explorer link |
| New: `src/lib/solana/**` or similar (TBD) | Connection, cluster, airdrop, transfer helpers |

---

## 14. Implementation order

1. **Tooling:** Expo dev client / prebuild, Android dev build on Seeker, verify app launches (no feature flags needed if Solana code is isolated).
2. **Dependencies:** add Solana + MWA packages; polyfills; fix build until **blank** MWA smoke test passes.
3. **Wallet session module:** connect / disconnect / pubkey in memory + persist to profile field.
4. **Wallet + Profile UI:** wire placeholders to real state; devnet balance + refresh.
5. **Airdrop:** devnet only, with cooldown messaging.
6. **Pay pipeline:** build transfer, sign via MWA, confirm, persist `txHash` + `settled`.
7. **Confirmation screen:** explorer link; navigate from Split Summary.
8. **Manual fallback:** ensure old path still works; error messages.
9. **Polish:** loading states, truncation, copy; no visual redesign pass unless broken.

---

## 15. Seeker testing checklist

- [ ] Dev build installs and opens (cold start).
- [ ] Connect wallet succeeds; address matches Profile and Wallet.
- [ ] Disconnect clears UI state.
- [ ] Devnet balance loads; refresh after payment matches expectation.
- [ ] Airdrop works with cooldown; handles RPC failure gracefully.
- [ ] Pay: happy path → `txHash` saved, row settled, explorer opens correct devnet tx.
- [ ] Pay: user rejects → no state corruption; can manual settle.
- [ ] Pay: payee missing `walletAddress` → blocked with clear message; manual settle works.
- [ ] Airplane mode / bad RPC → errors only; AsyncStorage data intact.
- [ ] Regression: create split, add expenses, summary math unchanged from Phase 1.6.
- [ ] Regression: Friends & Groups, Transactions tab flows unchanged.

---

## 16. Rollback plan

- **Version control:** implement Phase 2 on a **branch**; tag **last Phase-1.6-only** commit for quick reset.
- **Feature isolation:** keep Solana code in **dedicated modules**; Wallet tab can revert to placeholder by **not mounting** MWA providers if a thin wrapper is used.
- **Data compatibility:** `BalanceEntry.txHash` and `Participant.walletAddress` are **optional**; rolling back the app **must not require** migrating DB (there is none)—old builds ignore extra fields in JSON if present, or implementation keeps forward-compatible parsing.
- **Play-it-safe:** if MWA blocks the hackathon, **ship Phase 1.6 APK** and treat Phase 2 as optional; manual settlement remains full MVP.

---

*Document version: planning only — created for Phase 2 kickoff.*
