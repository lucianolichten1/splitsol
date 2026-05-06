import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { formatUsd } from "../lib/formatMoney";
import { PAY_ONCHAIN_BUTTON_LABEL, payViaSolDisabledSubtext as onchainPayDisabledHint } from "../lib/solPaymentPolicy";
import { BalanceEntry, Participant } from "../types";

function displayName(participants: Participant[], id: string): string {
  return participants.find((p) => p.id === id)?.nickname ?? "Unknown";
}

type Props = {
  entry: BalanceEntry;
  participants: Participant[];
  viewerParticipantId: string;
  onMarkSettled: () => void;
};

export function YourPaymentRow({ entry, participants, viewerParticipantId, onMarkSettled }: Props) {
  const recipient = participants.find((p) => p.id === entry.to);
  const recipientName = displayName(participants, entry.to);
  const recipientHasWallet = Boolean(recipient?.walletAddress?.trim());
  const showOnchainPayPlaceholder = !entry.settled && entry.amount > 0;
  const onchainBlockedHint = onchainPayDisabledHint();

  return (
    <View style={styles.card}>
      <Text style={styles.oweLine}>
        You owe <Text style={styles.nameEmphasis}>{recipientName}</Text>
      </Text>
      <Text style={styles.amountLine}>{formatUsd(entry.amount)}</Text>
      <Text style={styles.amountUsdCaption}>Amount owed · US dollars (USD), not crypto.</Text>
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
        {showOnchainPayPlaceholder ? (
          <View
            style={[styles.payBtn, styles.payBtnDisabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityLabel={`You owe ${formatUsd(entry.amount)} in US dollars. ${PAY_ONCHAIN_BUTTON_LABEL} is unavailable. ${onchainBlockedHint}`}
          >
            <Text style={styles.payBtnTextDisabled}>{PAY_ONCHAIN_BUTTON_LABEL}</Text>
            <Text style={styles.payBtnCaption}>{onchainBlockedHint}</Text>
          </View>
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
  payBtnDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    opacity: 0.9,
  },
  payBtnTextDisabled: {
    color: colors.textMuted,
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
