import { useCallback } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useRewards } from "../hooks/useRewards";

export function RewardsScreen() {
  const { profile, refresh } = useRewards();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Total Points</Text>
        <Text style={styles.pointsValue}>{profile.totalPoints}</Text>
      </View>
      <Text style={styles.heading}>Badges</Text>
      <FlatList
        data={profile.badges}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        ListEmptyComponent={<Text style={styles.empty}>No badges yet. Create your first split.</Text>}
        renderItem={({ item }) => (
          <View style={styles.badgeCard}>
            <Text style={styles.badgeIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.badgeName}>{item.name}</Text>
              <Text style={styles.badgeDescription}>{item.description}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  pointsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  pointsLabel: {
    ...typography.overline,
  },
  pointsValue: {
    ...typography.screenTitle,
    fontSize: 36,
    color: colors.accent,
    marginTop: spacing.xs,
    letterSpacing: -0.5,
  },
  heading: {
    ...typography.subhead,
    fontSize: 17,
    marginTop: spacing.xs,
    color: colors.text,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  badgeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 72,
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeName: {
    ...typography.body,
    fontWeight: "700",
    fontSize: 16,
    color: colors.text,
  },
  badgeDescription: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  empty: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.xl,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
  },
});
