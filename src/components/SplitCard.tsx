import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, layout, radius, shadows, typography } from "../constants/theme";
import { Split } from "../types";

type Props = {
  split: Split;
  onPress?: () => void;
  /** Your net in this split (unsettled). Omit when profile unknown. */
  viewerNet?: number;
};

function formatBalanceEffect(net: number): string {
  if (Math.abs(net) < 0.005) return "$0.00";
  if (net > 0) return `+ $${net.toFixed(2)}`;
  return `- $${Math.abs(net).toFixed(2)}`;
}

export function SplitCard({ split, onPress, viewerNet }: Props) {
  const totalAmount = typeof split.totalAmount === "number" ? split.totalAmount : 0;
  const groupLabel = split.groupName ? split.groupName : "Direct";
  const isSettled = split.status === "settled";

  const statusTextStyle =
    split.status === "disputed"
      ? styles.statusTextDisputed
      : split.status === "pending"
        ? styles.statusTextPending
        : styles.statusTextActive;

  const body = (
    <View style={styles.main}>
      <View style={styles.lineTop}>
        <Text style={styles.title} numberOfLines={1}>
          {split.name}
        </Text>
        <View style={styles.amountCol}>
          <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
          {viewerNet !== undefined ? (
            <Text
              style={[
                styles.balanceEffect,
                viewerNet > 0.005 && styles.balanceEffectPositive,
                viewerNet < -0.005 && styles.balanceEffectNegative,
                Math.abs(viewerNet) < 0.005 && styles.balanceEffectNeutral,
              ]}
              numberOfLines={1}
            >
              {formatBalanceEffect(viewerNet)}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.lineBottom}>
        {isSettled ? (
          <View style={styles.groupSettledRow}>
            <Text style={[styles.groupLine, styles.groupLineBesideStatus]} numberOfLines={1}>
              {groupLabel}
            </Text>
            <Text style={styles.settledBesideGroup} accessible={false}>
              ·
            </Text>
            <Text style={styles.settledBesideGroupLabel}>Settled</Text>
          </View>
        ) : (
          <>
            <Text style={styles.groupLine} numberOfLines={1}>
              {groupLabel}
            </Text>
            <View style={[styles.statusPill, styles.statusPillDefault]}>
              <Text style={[styles.statusText, statusTextStyle]}>{split.status}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isSettled ? `${split.name}, ${groupLabel}, settled` : `${split.name}, ${groupLabel}, ${split.status}`
        }
        accessibilityHint="Opens split summary and balances"
        android_ripple={{ color: "#ffffff18" }}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={styles.card}>{body}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.xl,
    paddingVertical: layout.cardPadding,
    paddingHorizontal: layout.cardPadding,
    ...shadows.cardSubtle,
  },
  cardPressed: {
    opacity: 0.94,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: layout.titleGap,
  },
  lineTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: layout.inline,
  },
  amountCol: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 2,
  },
  title: {
    ...typography.heading,
    flex: 1,
    minWidth: 0,
    fontSize: 26,
    fontWeight: "500",
    letterSpacing: -0.4,
    color: colors.text,
  },
  totalAmount: {
    ...typography.heading,
    fontSize: 26,
    fontWeight: "500",
    color: colors.text,
    letterSpacing: -0.4,
  },
  balanceEffect: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  balanceEffectPositive: {
    color: colors.accentStrong,
  },
  balanceEffectNegative: {
    color: colors.warning,
  },
  balanceEffectNeutral: {
    color: colors.textDim,
    fontWeight: "600",
  },
  lineBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: layout.inline,
  },
  groupSettledRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    gap: 4,
  },
  groupLineBesideStatus: {
    flexShrink: 1,
  },
  settledBesideGroup: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textDim,
    fontStyle: "italic",
  },
  settledBesideGroupLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
    letterSpacing: 0.2,
    textTransform: "capitalize",
    flexShrink: 0,
  },
  groupLine: {
    ...typography.caption,
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  statusPill: {
    flexShrink: 0,
    paddingHorizontal: layout.cardPaddingDense,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
  },
  statusPillDefault: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.primaryMuted,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.2,
    textTransform: "capitalize",
  },
  statusTextActive: {
    color: colors.accentStrong,
  },
  statusTextPending: {
    color: colors.textMuted,
  },
  statusTextDisputed: {
    color: colors.warning,
  },
});
