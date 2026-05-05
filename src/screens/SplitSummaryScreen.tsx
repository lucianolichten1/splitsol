import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { BadgePopup } from "../components/BadgePopup";
import { BalanceRow } from "../components/BalanceRow";
import { colors, radius, shadows, spacing, typography } from "../constants/theme";
import { useProfile } from "../hooks/useProfile";
import { useRewards } from "../hooks/useRewards";
import { useSplits } from "../hooks/useSplits";
import { getCurrentUserBalanceSummary } from "../lib/balanceSummary";
import { resolveCurrentUserParticipantId } from "../lib/currentUserParticipant";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "SplitSummary">;

export function SplitSummaryScreen({ route }: Props) {
  const { splitId } = route.params;
  const { splits, refresh, markBalanceSettled, loading } = useSplits();
  const { checkAndAwardRewards, newBadge, dismissBadge } = useRewards();
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

    const nextSplits = await refresh();
    await checkAndAwardRewards("balance_settled", { splits: nextSplits });

    const refreshedSplit = nextSplits.find((item) => item.id === split.id);
    if (refreshedSplit?.status === "settled") {
      await checkAndAwardRewards("split_fully_settled", { splits: nextSplits });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.headerCard}>
        <Text style={styles.title} numberOfLines={2}>
          {split.name}
        </Text>
        {split.groupName ? (
          <Text style={styles.groupLine} numberOfLines={1}>
            Group · {split.groupName}
          </Text>
        ) : null}
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalBig}>
            {(typeof split.totalAmount === "number" ? split.totalAmount : 0).toFixed(2)}
          </Text>
        </View>
        {userBalanceSummary?.label ? (
          <Text style={styles.youSummary} numberOfLines={3}>
            {userBalanceSummary.label}
          </Text>
        ) : null}
      </View>
      <Text style={styles.listSectionTitle}>Balances</Text>
      <FlatList
        data={balancesSafe}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        ListEmptyComponent={<Text style={styles.empty}>All settled. No balances remaining.</Text>}
        renderItem={({ item }) => (
          <BalanceRow
            entry={item}
            participants={participantsSafe}
            currentUserParticipantId={viewerParticipantId}
            onMarkSettled={() => onMarkSettled(item.id)}
          />
        )}
      />
      <BadgePopup badge={newBadge} onClose={dismissBadge} />
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
    gap: spacing.md,
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
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 22,
  },
  listSectionTitle: {
    ...typography.overline,
    fontSize: 10,
    marginTop: spacing.xs,
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
