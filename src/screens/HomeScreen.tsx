import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { HowSplitSolWorksCard } from "../components/HowSplitSolWorksCard";
import { SplitCard } from "../components/SplitCard";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useProfile } from "../hooks/useProfile";
import { useSplits } from "../hooks/useSplits";
import { aggregateCurrentUserBalanceAcrossSplits, netForUserInSplitBalances } from "../lib/balanceSummary";
import { resolveCurrentUserParticipantId } from "../lib/currentUserParticipant";
import { navigateRoot } from "../lib/navigateRoot";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FAB_SIZE = 60;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { activeSplits, refresh, loading } = useSplits();
  const { profile, refreshProfile, loading: profileLoading } = useProfile();

  const homeBalance = useMemo(
    () => aggregateCurrentUserBalanceAcrossSplits(profile, activeSplits),
    [profile, activeSplits]
  );

  const listContentStyle = useMemo(
    () => [
      styles.list,
      {
        paddingBottom: FAB_SIZE + spacing.xl + spacing.lg + Math.max(insets.bottom, 8),
      },
    ],
    [insets.bottom]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshProfile();
    }, [refresh, refreshProfile])
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Your balance · active splits only</Text>
        <Text style={styles.summaryHint}>
          Net of what you owe vs. what you&apos;re owed across open splits (SOL).
        </Text>
        {profileLoading && !profile ? (
          <ActivityIndicator
            style={styles.summaryLoading}
            size="small"
            color={colors.accent}
            accessibilityLabel="Loading profile"
          />
        ) : (
          <Text style={styles.summaryAmount}>{homeBalance.label}</Text>
        )}
      </View>

      <FlatList
        data={activeSplits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={listContentStyle}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.accent} accessibilityLabel="Loading splits" />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No active splits</Text>
              <Text style={styles.emptySub}>
                Next: open the Groups tab and create a group (or use + here after you have one). Then add a split and expenses.
              </Text>
              <HowSplitSolWorksCard />
            </View>
          )
        }
        renderItem={({ item }) => {
          const me = profile ? resolveCurrentUserParticipantId(item.participants, profile) : null;
          const viewerNet = profile ? netForUserInSplitBalances(me, item.balances) : undefined;
          return (
            <SplitCard
              split={item}
              viewerNet={viewerNet}
              onPress={() => navigateRoot(navigation, "SplitSummary", { splitId: item.id })}
            />
          );
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create new split"
        android_ripple={{ color: "#ffffff33" }}
        style={({ pressed }) => [
          styles.fab,
          { bottom: spacing.lg + Math.max(insets.bottom, 12) },
          pressed && styles.fabPressed,
        ]}
        onPress={() => navigateRoot(navigation, "CreateSplit", {}, false)}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  summary: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
    ...shadows.cardSubtle,
  },
  summaryTitle: {
    ...typography.overline,
    fontSize: 10,
  },
  summaryHint: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  summaryAmount: {
    ...typography.screenTitle,
    fontSize: 22,
    color: colors.accent,
    marginTop: spacing.xs,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  summaryLoading: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  list: {
    flexGrow: 1,
    gap: spacing.md,
  },
  separator: {
    height: spacing.xs,
  },
  emptyWrap: {
    paddingHorizontal: 0,
    paddingVertical: spacing.md,
    alignItems: "stretch",
    gap: spacing.md,
    width: "100%",
  },
  emptyTitle: {
    ...typography.subhead,
    fontSize: 18,
    textAlign: "center",
    alignSelf: "center",
  },
  emptySub: {
    ...typography.body,
    textAlign: "center",
    color: colors.textMuted,
    lineHeight: 22,
    maxWidth: 320,
    alignSelf: "center",
  },
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    backgroundColor: colors.primary,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    minWidth: touch.minWidth + 12,
    minHeight: touch.minHeight + 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.14)",
    ...shadows.fab,
  },
  fabPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  fabText: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    marginTop: -2,
  },
});
