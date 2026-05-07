import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { formatSolAmount } from "../lib/formatMoney";
import { PAY_ONCHAIN_BUTTON_LABEL, payViaSolDisabledSubtext } from "../lib/solPaymentPolicy";
import { BalanceEntry, Participant } from "../types";

function displayName(participants: Participant[], id: string): string {
  return participants.find((p) => p.id === id)?.nickname ?? "Unknown";
}

type Props = {
  entry: BalanceEntry;
  participants: Participant[];
  viewerParticipantId: string;
  walletConnected: boolean;
  paying: boolean;
  onPayOnChain: () => void;
  onMarkSettled: () => void;
};

export function YourPaymentRow({
  entry,
  participants,
  viewerParticipantId,
  walletConnected,
  paying,
  onPayOnChain,
  onMarkSettled,
}: Props) {
  const recipient = participants.find((p) => p.id === entry.to);
  const recipientName = displayName(participants, entry.to);
  const recipientHasWallet = Boolean(recipient?.walletAddress?.trim());
  const shouldShowPay = !entry.settled && entry.amount > 0;
  const canPayOnChain = shouldShowPay && walletConnected && recipientHasWallet;
  const onchainBlockedHint = payViaSolDisabledSubtext(walletConnected, recipientHasWallet);

  return (
    <View style={styles.card}>
      <Text style={styles.oweLine}>
        You owe <Text style={styles.nameEmphasis}>{recipientName}</Text>
      </Text>
      <Text style={styles.amountLine}>{formatSolAmount(entry.amount)}</Text>
      <Text style={styles.amountUsdCaption}>Amount owed · SOL (hackathon demo units).</Text>
      <Text style={styles.walletStatus}>
        Recipient wallet (on this transaction): {recipientHasWallet ? "saved" : "missing"}
      </Text>
      {!recipientHasWallet ? (
        <Text style={styles.snapshotHint}>
          Add a wallet address to this friend before creating the transaction, or use Mark settled locally.
        </Text>
      ) : null}
      {__DEV__ ? (
        <Text style={styles.devDebug} selectable>
          [dev] your participant id: {viewerParticipantId} · recipient walletAddress:{" "}
          {recipientHasWallet ? "present" : "missing"}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {shouldShowPay ? (
          canPayOnChain ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Pay ${formatSolAmount(entry.amount)} on-chain`}
              android_ripple={{ color: "#14F19533" }}
              disabled={paying}
              style={({ pressed }) => [styles.payBtn, pressed && !paying && styles.payBtnPressed, paying && styles.payBtnDisabled]}
              onPress={onPayOnChain}
            >
              <Text style={styles.payBtnText}>{paying ? "Paying..." : PAY_ONCHAIN_BUTTON_LABEL}</Text>
            </Pressable>
          ) : (
            <View style={[styles.payBtn, styles.payBtnDisabled]}>
              <Text style={styles.payBtnTextDisabled}>{PAY_ONCHAIN_BUTTON_LABEL}</Text>
              <Text style={styles.payBtnCaption}>{onchainBlockedHint}</Text>
            </View>
          )
        ) : null}
        {!entry.settled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark settled locally"
            android_ripple={{ color: "#14F19533" }}
            style={({ pressed }) => [styles.markBtn, pressed && styles.markBtnPressed]}
            onPress={onMarkSettled}
          >
            <Text style={styles.markBtnText}>Mark settled locally</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.cardSubtle,
  },
  oweLine: {
    ...typography.body,
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },
  nameEmphasis: {
    color: colors.accentStrong,
    fontWeight: "800",
  },
  amountLine: {
    ...typography.heading,
    fontSize: 22,
    fontWeight: "700",
    color: colors.warning,
  },
  amountUsdCaption: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 16,
    fontWeight: "600",
  },
  walletStatus: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  snapshotHint: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 16,
  },
  devDebug: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textDim,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  payBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    minHeight: touch.minHeight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accentStrong,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  payBtnPressed: {
    opacity: 0.9,
  },
  payBtnDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    opacity: 0.85,
  },
  payBtnTextDisabled: {
    color: colors.textMuted,
    fontWeight: "800",
    fontSize: 14,
  },
  payBtnText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 14,
  },
  payBtnCaption: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textDim,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: spacing.xs,
  },
  markBtn: {
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: radius.md,
    minHeight: touch.minHeight - 4,
    justifyContent: "center",
    alignItems: "center",
  },
  markBtnPressed: { backgroundColor: colors.accentMuted },
  markBtnText: {
    color: colors.accent,
    fontWeight: "800",
    fontSize: 13,
  },
});
