import { useCallback, useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { BalanceRow } from "../components/BalanceRow";
import { MoneyOwedToYouRow } from "../components/MoneyOwedToYouRow";
import { YourPaymentRow } from "../components/YourPaymentRow";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useProfile } from "../hooks/useProfile";
import { useSplits } from "../hooks/useSplits";
import { getCurrentUserBalanceSummary } from "../lib/balanceSummary";
import { resolveCurrentUserParticipantId } from "../lib/currentUserParticipant";
import { formatUsd } from "../lib/formatMoney";
import { ONCHAIN_PAY_DISABLED_MESSAGE } from "../lib/solPaymentPolicy";
import { RootStackParamList } from "../navigation/RootNavigator";
import { BalanceEntry } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "SplitSummary">;

export function SplitSummaryScreen({ route }: Props) {
  const { splitId } = route.params;
  const { splits, refresh, markBalanceSettled, setParticipantConfirmation, loading } = useSplits();
  const { profile, refreshProfile } = useProfile();

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshProfile();
    }, [refresh, refreshProfile])
  );

  const split = useMemo(() => splits.find((item) => item.id === splitId), [splits, splitId]);

  const participantsSafe = useMemo(
    () => (split && Array.isArray(split.participants) ? split.participants : []),
    [split]
  );
  const balancesSafe = useMemo(
    () => (split && Array.isArray(split.balances) ? split.balances : []),
    [split]
  );

  const viewerParticipantId = useMemo(
    () => (split && profile ? resolveCurrentUserParticipantId(participantsSafe, profile) : null),
    [split, profile, participantsSafe]
  );

  const userBalanceSummary = useMemo(
    () =>
      split
        ? getCurrentUserBalanceSummary(viewerParticipantId, balancesSafe, participantsSafe)
        : null,
    [split, viewerParticipantId, balancesSafe, participantsSafe]
  );

  const netSummaryTone = useMemo(() => {
    const label = userBalanceSummary?.label ?? "";
    if (label.startsWith("You owe")) return "owe" as const;
    if (label.startsWith("You are owed")) return "owed" as const;
    return "neutral" as const;
  }, [userBalanceSummary?.label]);

  const owingToPay = useMemo(() => {
    if (!viewerParticipantId) return [];
    return balancesSafe.filter((b) => !b.settled && b.from === viewerParticipantId);
  }, [balancesSafe, viewerParticipantId]);

  const owedToViewer = useMemo(() => {
    if (!viewerParticipantId) return [];
    return balancesSafe.filter((b) => !b.settled && b.to === viewerParticipantId);
  }, [balancesSafe, viewerParticipantId]);

  if (loading && !split) {
    return (
      <SafeAreaView style={styles.centered} edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color={colors.accent} accessibilityLabel="Loading split" />
      </SafeAreaView>
    );
  }

  if (!split) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <Text style={styles.empty}>Split not found.</Text>
      </SafeAreaView>
    );
  }

  const onMarkSettled = async (balanceId: string) => {
    const changed = await markBalanceSettled(split.id, balanceId);
    if (!changed) return;

    await refresh();
  };

  const confirmations = split?.participantConfirmations ?? {};

  const onSetConfirmation = async (participantId: string, status: "accepted" | "disputed") => {
    if (!viewerParticipantId || participantId !== viewerParticipantId) return;
    await setParticipantConfirmation(split.id, participantId, status);
    await refresh();
  };


  const referenceOnlyForBalance = (entry: BalanceEntry) => {
    if (!viewerParticipantId || entry.settled) return false;
    return entry.from === viewerParticipantId || entry.to === viewerParticipantId;
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <Text style={styles.title} numberOfLines={2}>
            {split.name}
          </Text>
          {split.groupName ? (
            <Text style={styles.groupLine} numberOfLines={1}>
              Group · {split.groupName}
            </Text>
          ) : (
            <Text style={styles.groupLine} numberOfLines={1}>
              Direct transaction
            </Text>
          )}
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Total (USD)</Text>
            <Text style={styles.totalBig}>
              {formatUsd(typeof split.totalAmount === "number" ? split.totalAmount : 0)}
            </Text>
          </View>
          {userBalanceSummary?.label ? (
            <Text
              style={[
                styles.youSummary,
                netSummaryTone === "owe" && styles.youSummaryOwe,
                netSummaryTone === "owed" && styles.youSummaryOwed,
              ]}
              numberOfLines={3}
            >
              {userBalanceSummary.label}
            </Text>
          ) : null}
          <Text style={styles.netHelper}>These are net balances after all expenses (USD).</Text>
        </View>

        <View style={styles.prominentSection}>
          <Text style={styles.prominentSectionTitle}>Your payments</Text>
          <Text style={styles.snapshotNote}>
            Balances and payments below are in US dollars (USD). Wallet addresses are saved on each participant when
            this transaction is created. Editing a friend&apos;s wallet later does not update older transactions —
            create a new transaction to use an updated address.
          </Text>
          {viewerParticipantId ? (
            owingToPay.length === 0 ? (
              <Text style={styles.emptyOwe}>You do not owe anything for this transaction.</Text>
            ) : (
              <View style={styles.prominentStack}>
                {owingToPay.map((entry) => (
                  <YourPaymentRow
                    key={entry.id}
                    entry={entry}
                    participants={participantsSafe}
                    viewerParticipantId={viewerParticipantId}
                    onMarkSettled={() => onMarkSettled(entry.id)}
                  />
                ))}
              </View>
            )
          ) : (
            <Text style={styles.emptyOwe}>You do not owe anything for this transaction.</Text>
          )}
        </View>

        {owedToViewer.length > 0 ? (
          <View style={styles.prominentSection}>
            <Text style={styles.prominentSectionTitle}>Money owed to you</Text>
            <View style={styles.prominentStack}>
              {owedToViewer.map((entry) => (
                <MoneyOwedToYouRow
                  key={entry.id}
                  entry={entry}
                  participants={participantsSafe}
                  participantConfirmations={split.participantConfirmations}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.confirmCard}>
        <Text style={styles.listSectionTitle}>Participant confirmations</Text>
        <Text style={styles.listSectionHint}>Local simulation for future multi-user accept/dispute flow.</Text>
        <View style={styles.confirmList}>
          {participantsSafe.map((p) => {
            const isCurrentUser = p.id === viewerParticipantId;
            const rawStatus = confirmations[p.id];
            const status =
              rawStatus === "accepted" || rawStatus === "disputed"
                ? rawStatus
                : isCurrentUser
                  ? "accepted"
                  : "pending";
            return (
              <View key={p.id} style={styles.confirmRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmName}>{isCurrentUser ? "You" : p.nickname}</Text>
                  <Text style={styles.confirmStatus}>Status: {status}</Text>
                </View>
                {isCurrentUser ? (
                  <View style={styles.confirmActions}>
                    <Pressable
                      style={({ pressed }) => [styles.confirmBtn, status === "accepted" && styles.confirmBtnAccepted, pressed && { opacity: 0.9 }]}
                      onPress={() => onSetConfirmation(p.id, "accepted")}
                    >
                      <Text style={[styles.confirmBtnText, status === "accepted" && styles.confirmBtnTextSelected]}>Accept</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.confirmBtn, status === "disputed" && styles.confirmBtnDisputed, pressed && { opacity: 0.9 }]}
                      onPress={() => onSetConfirmation(p.id, "disputed")}
                    >
                      <Text style={[styles.confirmBtnText, status === "disputed" && styles.confirmBtnTextSelected]}>Dispute</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.readonlyStatusPill,
                      status === "accepted" && styles.readonlyStatusAccepted,
                      status === "disputed" && styles.readonlyStatusDisputed,
                    ]}
                  >
                    <Text style={styles.readonlyStatusText}>{status}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

        <View style={styles.balancesHeader}>
          <Text style={styles.listSectionTitle}>All balances</Text>
          <Text style={styles.listSectionHint}>
            Full list for reference. Use Your payments above to mark settled when you owe someone.{" "}
            {ONCHAIN_PAY_DISABLED_MESSAGE}
          </Text>
        </View>
        {balancesSafe.length === 0 ? (
          <Text style={styles.empty}>All settled. No balances remaining.</Text>
        ) : (
          <View style={styles.listContent}>
            {balancesSafe.map((item) => (
              <View key={item.id} style={{ marginBottom: spacing.xs }}>
                <BalanceRow
                  entry={item}
                  participants={participantsSafe}
                  currentUserParticipantId={viewerParticipantId}
                  referenceOnly={referenceOnlyForBalance(item)}
                  onMarkSettled={() => onMarkSettled(item.id)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  prominentSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accentStrong,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.cardSubtle,
  },
  prominentSectionTitle: {
    ...typography.heading,
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  snapshotNote: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 17,
  },
  prominentStack: {
    gap: spacing.md,
  },
  emptyOwe: {
    ...typography.body,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  headerCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.cardSubtle,
  },
  title: {
    ...typography.screenTitle,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  groupLine: {
    ...typography.caption,
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  totalBlock: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  totalLabel: {
    ...typography.overline,
    fontSize: 10,
  },
  totalBig: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: -0.6,
  },
  youSummary: {
    ...typography.body,
    marginTop: spacing.sm,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 24,
  },
  youSummaryOwe: {
    color: colors.warning,
  },
  youSummaryOwed: {
    color: colors.accent,
  },
  netHelper: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  balancesHeader: {
    gap: 4,
    marginTop: spacing.xs,
  },
  listSectionTitle: {
    ...typography.overline,
    fontSize: 10,
  },
  listSectionHint: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textDim,
  },

  confirmCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.cardSubtle,
  },
  confirmList: {
    gap: spacing.xs,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: touch.minHeight,
    paddingVertical: spacing.xs,
  },
  confirmName: {
    ...typography.body,
    fontWeight: "700",
  },
  confirmStatus: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  confirmActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  confirmBtn: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    minHeight: touch.minHeight - 8,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  confirmBtnAccepted: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  confirmBtnDisputed: {
    borderColor: colors.warning,
    backgroundColor: colors.warningMuted,
  },
  confirmBtnText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text,
    fontWeight: "700",
  },
  confirmBtnTextSelected: {
    color: colors.text,
  },
  readonlyStatusPill: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    minHeight: touch.minHeight - 8,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  readonlyStatusAccepted: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  readonlyStatusDisputed: {
    borderColor: colors.warning,
    backgroundColor: colors.warningMuted,
  },
  readonlyStatusText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  empty: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.xl,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
  },
});
