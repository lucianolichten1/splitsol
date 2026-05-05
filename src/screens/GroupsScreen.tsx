import { useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GroupCard } from "../components/GroupCard";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useGroups } from "../hooks/useGroups";
import { navigateRoot } from "../lib/navigateRoot";
import { GroupsStackParamList } from "../navigation/groupsStackTypes";

type Nav = NativeStackNavigationProp<GroupsStackParamList>;

const FAB_SIZE = 60;

export function GroupsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { groups, loading, refresh } = useGroups();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.accent} accessibilityLabel="Loading groups" />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptySub}>
                Groups hold your people and past splits. Tap + to create your first group.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}
          />
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create new group"
        android_ripple={{ color: "#ffffff33" }}
        style={({ pressed }) => [
          styles.fab,
          { bottom: spacing.lg + Math.max(insets.bottom, 6) },
          pressed && styles.fabPressed,
        ]}
        onPress={() => navigateRoot(navigation, "CreateEditGroup", { cameFrom: "groups" })}
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  list: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: FAB_SIZE + spacing.xl + spacing.lg,
  },
  separator: {
    height: spacing.xs,
  },
  emptyWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.subhead,
    fontSize: 18,
    textAlign: "center",
  },
  emptySub: {
    ...typography.body,
    textAlign: "center",
    color: colors.textMuted,
    lineHeight: 22,
    maxWidth: 320,
  },
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
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
