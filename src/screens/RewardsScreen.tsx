import { useCallback } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
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
    <View style={styles.container}>
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Total Points</Text>
        <Text style={styles.pointsValue}>{profile.totalPoints}</Text>
      </View>
      <Text style={styles.heading}>Badges</Text>
      <FlatList
        data={profile.badges}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pointsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pointsLabel: {
    ...typography.caption,
  },
  pointsValue: {
    ...typography.heading,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  heading: {
    ...typography.subhead,
    marginTop: spacing.sm,
  },
  badgeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeName: {
    ...typography.body,
    fontWeight: "700",
  },
  badgeDescription: {
    ...typography.caption,
  },
  empty: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
