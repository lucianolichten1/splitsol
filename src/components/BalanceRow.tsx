import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { formatBalanceRowForViewer } from "../lib/balanceSummary";
import { PAY_ONCHAIN_BUTTON_LABEL, payViaSolDisabledSubtext } from "../lib/solPaymentPolicy";
import { truncateTxSignature } from "../lib/truncateWalletAddress";
import { BalanceEntry, Participant } from "../types";

type Props = {
  entry: BalanceEntry;
  participants: Participant[];
  currentUserParticipantId?: string | null;
  onMarkSettled?: () => void;
  /** Read-only line for "All balances" when actions live in Your payments. */
  referenceOnly?: boolean;
};

export function BalanceRow({
  entry,
  participants,
  currentUserParticipantId,
  onMarkSettled,
  referenceOnly = false,
}: Props) {
  const line = formatBalanceRowForViewer(entry, participants, currentUserParticipantId ?? null);
  const viewer = currentUserParticipantId ?? null;
  const userOwes =
    Boolean(viewer) && entry.from === viewer && !entry.settled && entry.amount > 0;
  const userIsOwed =
    Boolean(viewer) && entry.to === viewer && !entry.settled && entry.amount > 0;

  if (referenceOnly) {
    return (
      <View style={[styles.container, styles.referenceContainer, entry.settled && styles.containerSettled]}>
        <View style={styles.copy}>
          <Text
            style={[styles.primaryLine, entry.settled && styles.primaryLineSettled]}
            numberOfLines={3}
          >
            {line}
          </Text>
          {entry.settled && entry.txHash ? (
            <Text style={styles.onChainLine} selectable>
              On-chain · {truncateTxSignature(entry.txHash)}
            </Text>
          ) : null}
          {userOwes ? (
            <Text style={styles.referenceHint}>Pay or mark settled in &quot;Your payments&quot; above.</Text>
          ) : null}
          {userIsOwed ? (
            <Text style={styles.referenceHint}>Waiting on them — see &quot;Money owed to you&quot; above.</Text>
          ) : null}
        </View>
        {entry.settled ? (
          <View style={styles.settledPill}>
            <Text style={styles.settledText}>Settled</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, entry.settled && styles.containerSettled]}>
      <View style={styles.copy}>
        <Text
          style={[styles.primaryLine, entry.settled && styles.primaryLineSettled]}
          numberOfLines={3}
        >
          {line}
        </Text>
        {entry.settled && entry.txHash ? (
          <Text style={styles.onChainLine} selectable>
            On-chain · {truncateTxSignature(entry.txHash)}
          </Text>
        ) : null}
      </View>
      {entry.settled ? (
        <View style={styles.settledPill}>
          <Text style={styles.settledText}>Settled</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          {userOwes ? (
            <View style={[styles.paySolBtn, styles.paySolBtnDisabled]}>
              <Text style={styles.paySolBtnTextDisabled}>{PAY_ONCHAIN_BUTTON_LABEL}</Text>
              <Text style={styles.paySolSubDisabled}>{payViaSolDisabledSubtext()}</Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark this balance as settled locally"
            android_ripple={{ color: "#14F19533" }}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onMarkSettled}
          >
            <Text style={styles.buttonText}>Mark settled</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: touch.minHeight + spacing.md,
    ...shadows.cardSubtle,
  },
  containerSettled: {
    borderColor: colors.border,
    opacity: 1,
    backgroundColor: colors.surface,
  },
  referenceContainer: {
    borderStyle: "dashed",
    opacity: 0.95,
  },
  referenceHint: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textDim,
    fontStyle: "italic",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  primaryLine: {
    ...typography.subhead,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
    lineHeight: 22,
  },
  primaryLineSettled: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  onChainLine: {
    ...typography.caption,
    fontSize: 11,
    color: colors.accentStrong,
    fontWeight: "600",
  },
  settledPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: touch.minHeight,
    justifyContent: "center",
    flexShrink: 0,
  },
  settledText: {
    color: colors.success,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  actions: {
    flexShrink: 0,
    gap: spacing.sm,
    alignItems: "stretch",
    minWidth: touch.minWidth + 24,
  },
  paySolBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minHeight: touch.minHeight - 4,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
  },
  paySolBtnDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    opacity: 0.85,
  },
  paySolBtnTextDisabled: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },
  paySolSubDisabled: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textDim,
    marginTop: 4,
    textAlign: "center",
  },
  button: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: touch.minHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.88,
    backgroundColor: colors.accentMuted,
  },
  buttonText: {
    color: colors.accent,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
