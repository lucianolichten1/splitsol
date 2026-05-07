# SplitSol

SplitSol is a mobile-first expense-sharing app built for the Solana Mobile Track at the EasyA Consensus Miami Hackathon.

The app helps users add friends, create groups or direct transactions, record shared expenses, calculate who owes who, and settle balances on-chain using Solana Mobile Wallet Adapter.

## Overview

Splitting expenses with friends is often messy. Someone pays for dinner, someone else pays for an Uber, and later everyone has to figure out who owes who.

SplitSol solves this by giving users a mobile-first way to:

- Add friends
- Create groups
- Create direct transactions
- Add shared expenses
- Calculate net balances
- Accept or dispute transaction participation
- Connect a Solana wallet
- View devnet SOL balance
- Settle balances on-chain through Solana

For the hackathon demo, transaction amounts are entered directly in SOL so the full on-chain settlement flow can be shown clearly on devnet.

## Built for Solana Mobile

SplitSol is designed for the Solana Mobile ecosystem and tested on a Solana Seeker device.

The app integrates:

- Solana Mobile Wallet Adapter for wallet connection and signing
- Solana devnet for demo payments
- `@solana/web3.js` for balance fetching, transaction building, and confirmation
- Android custom development build for native wallet support

Expo Go is not used for the Solana wallet features because Mobile Wallet Adapter requires native Android functionality. SplitSol uses a custom Expo development build.

## Main Features

### Friends & Groups

Users can manage the people they split with.

- Add friends
- Create groups
- Edit groups
- Add saved friends or manual members to groups
- Create transactions from groups

### Transactions

Users can create and manage shared expenses.

- Create group transactions
- Create direct transactions without a group
- Add expenses
- Select who paid
- Calculate balances automatically
- View who owes who
- Accept or dispute participation
- Mark balances as settled locally
- Pay eligible balances on-chain

### Wallet

Users can connect their Solana wallet and view wallet-related information.

- Connect wallet through Mobile Wallet Adapter
- Display connected wallet address
- View devnet SOL balance
- Refresh wallet balance
- Use wallet for on-chain settlement

### Profile

Users can manage their local identity.

- Display name
- Username
- User ID
- Connected wallet address
- Edit profile

## Demo Flow

A simple demo scenario:

1. Open SplitSol on the Seeker.
2. Connect a Solana wallet.
3. Add a friend with a valid devnet wallet address.
4. Create a direct transaction with that friend.
5. Add an expense, for example `0.02 SOL` paid by the friend.
6. SplitSol calculates that the current user owes `0.01 SOL`.
7. The user taps Pay on-chain.
8. The wallet signs the transaction through Mobile Wallet Adapter.
9. SplitSol confirms the transaction, saves the transaction hash, and marks the balance as settled.

## Tech Stack

- React Native
- Expo
- TypeScript
- EAS Build
- Solana Mobile Wallet Adapter
- `@solana/web3.js`
- AsyncStorage
- Solana devnet

## Project Structure

```text
src/
  components/       Reusable UI components
  constants/        Shared app constants
  hooks/            App state and wallet hooks
  lib/              Core helpers and Solana utilities
  navigation/       App navigation stacks and tabs
  screens/          Main app screens
  types/            TypeScript data models
```

## Key Data Models

SplitSol currently uses local storage for the hackathon MVP.

Main models include:

- `UserProfile`
- `Friend`
- `Group`
- `Participant`
- `Split`
- `Expense`
- `BalanceEntry`
- `ParticipantConfirmationStatus`

Data is stored locally using AsyncStorage. A future production version would move this data to a backend database so multiple users can share groups, transactions, confirmations, and settlements in real time.

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npx expo start --dev-client
```

For LAN testing on a physical device:

```bash
npx expo start --dev-client --lan --clear
```

## Android Development Build

Because Solana Mobile Wallet Adapter requires native Android support, use a custom development build.

Configure EAS:

```bash
eas build:configure
```

Create an Android development build:

```bash
eas build --profile development --platform android
```

Install the generated build on the Android device or Solana Seeker, then run:

```bash
npx expo start --dev-client --lan --clear
```

## Solana Demo Notes

- SplitSol currently uses Solana devnet.
- Demo amounts should be small, such as `0.01 SOL` or `0.02 SOL`.
- The connected wallet must be on devnet.
- Recipient friends must have a valid devnet wallet address saved before creating the transaction.
- Mainnet SOL will not appear in the devnet balance.

## Current Limitations

- Data is local to the device.
- There is no backend database yet.
- Push notifications are not implemented yet.
- QR friend/group sharing is not implemented yet.
- Expenses are entered directly in SOL for the hackathon demo.
- USD-to-SOL conversion is planned for a future production version.

## Future Roadmap

- Supabase database for shared profiles, friends, groups, and transactions
- Real multi-user group collaboration
- Push notifications for new transactions and disputes
- QR codes for adding friends or joining groups
- USD input with SOL or USDC settlement conversion
- Production-ready Solana payment flow
- Solana dApp Store readiness

## Hackathon Submission

SplitSol was built for the EasyA Consensus Miami Hackathon - Solana Mobile Track: Build for the dApp Store.

The project demonstrates a mobile-first crypto expense-sharing experience using Solana Mobile Wallet Adapter and devnet on-chain settlement.

## Author

Luciano Lichtenfeld  
University of South Florida