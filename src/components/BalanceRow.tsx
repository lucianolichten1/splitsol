import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { formatBalanceRowForViewer } from "../lib/balanceSummary";
import { BalanceEntry, Participant } from "../types";

type Props = {
  entry: BalanceEntry;
  participants: Participant[];
  currentUserParticipantId?: string | null;
  onMarkSettled?: () => void;
};

export function BalanceRow({ entry, participants, currentUserParticipantId, onMarkSettled }: Props) {
  const line = formatBalanceRowForViewer(entry, participants, currentUserParticipantId ?? null);

  return (
    <View style={[styles.container, entry.settled && styles.containerSettled]}>
      <View style={styles.copy}>
        <Text style={styles.primaryLine} numberOfLines={3}>
          {line}
        </Text>
      </View>
      {entry.settled ? (
        <View style={styles.settledPill}>
          <Text style={styles.settledText}>Settled</Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark this balance as settled"
          android_ripple={{ color: "#00000033" }}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onMarkSettled}
        >
          <Text style={styles.buttonText}>Mark settled</Text>
        </Pressable>
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: touch.minHeight + spacing.md,
    ...shadows.cardSubtle,
  },
  containerSettled: {
    borderColor: colors.borderStrong,
    opacity: 0.92,
    backgroundColor: colors.surface,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  primaryLine: {
    ...typography.subhead,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
    lineHeight: 22,
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
  },
  settledText: {
    color: colors.success,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: touch.minHeight,
    minWidth: touch.minWidth + 40,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
