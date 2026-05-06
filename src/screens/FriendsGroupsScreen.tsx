import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { GroupCard } from "../components/GroupCard";
import { colors, layout, radius, shadows, touch, typography } from "../constants/theme";
import { useFriends } from "../hooks/useFriends";
import { useGroups } from "../hooks/useGroups";
import { useSplits } from "../hooks/useSplits";
import { getGroupSplitStatsMap } from "../lib/groupSplitStats";
import { navigateRoot } from "../lib/navigateRoot";
import { GroupsStackParamList } from "../navigation/groupsStackTypes";

const PREVIEW_GROUP_LIMIT = 4;

type Nav = NativeStackNavigationProp<GroupsStackParamList>;

export function FriendsGroupsScreen() {
  const navigation = useNavigation<Nav>();
  const { friends, loading: friendsLoading, refresh: refreshFriends } = useFriends();
  const { groups, loading: groupsLoading, refresh: refreshGroups } = useGroups();
  const { splits, refresh: refreshSplits } = useSplits();

  useFocusEffect(
    useCallback(() => {
      refreshFriends();
      refreshGroups();
      refreshSplits();
    }, [refreshFriends, refreshGroups, refreshSplits])
  );

  const splitStatsByGroup = useMemo(() => getGroupSplitStatsMap(groups, splits), [groups, splits]);
  const previewGroups = useMemo(() => groups.slice(0, PREVIEW_GROUP_LIMIT), [groups]);

  const loading = friendsLoading || groupsLoading;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accentStrong} accessibilityLabel="Loading friends and groups" />
        </View>
      ) : (
        <FlatList
          data={previewGroups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scroll}
          ListHeaderComponent={
            <View style={styles.headerColumn}>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>People</Text>
                <Text style={styles.subtitle}>friends + groups you split with</Text>
              </View>

              <View style={styles.searchShell}>
                <TextInput
                  placeholder="find or add a friend..."
                  placeholderTextColor={colors.textDim}
                  style={styles.searchInput}
                  editable={false}
                  pointerEvents="none"
                />
              </View>

              <View style={styles.quickActions}>
                <Pressable
                  accessibilityRole="button"
                  android_ripple={{ color: "#00000018" }}
                  style={({ pressed }) => [styles.actionBtnPrimary, pressed && { opacity: 0.92 }]}
                  onPress={() => navigation.navigate("CreateEditFriend", {})}
                >
                  <Text style={styles.actionBtnPrimaryText}>+ Add Friend</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  android_ripple={{ color: "#ffffff22" }}
                  style={({ pressed }) => [styles.actionBtnSecondary, pressed && { opacity: 0.94 }]}
                  onPress={() => navigateRoot(navigation, "CreateEditGroup", { cameFrom: "groups" })}
                >
                  <Text style={styles.actionBtnSecondaryText}>◇ New Group</Text>
                </Pressable>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Groups</Text>
                <Text style={styles.sectionMeta}>{splitStatsByGroup.size} active</Text>
              </View>
              {groups.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No groups yet</Text>
                  <Text style={styles.emptyCopy}>Create one to start splitting expenses.</Text>
                </View>
              ) : (
                <Text style={styles.groupHint}>tap a group to open details</Text>
              )}
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: layout.listGap }} />}
          ListFooterComponent={
            <View style={styles.footerColumn}>
              {groups.length > PREVIEW_GROUP_LIMIT ? (
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.viewAllBtn, pressed && { opacity: 0.92 }]}
                  onPress={() => navigation.navigate("GroupsList")}
                >
                  <Text style={styles.viewAllText}>View all groups ({groups.length})</Text>
                </Pressable>
              ) : null}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Friends</Text>
                <Text style={styles.sectionMeta}>recent</Text>
              </View>
              {friends.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No friends yet</Text>
                  <Text style={styles.emptyCopy}>Add people you split with often.</Text>
                </View>
              ) : (
                <View style={styles.friendTiles}>
                  {friends.slice(0, 4).map((friend) => (
                    <Pressable
                      key={friend.id}
                      accessibilityRole="button"
                      android_ripple={{ color: "#ffffff18" }}
                      style={({ pressed }) => [styles.friendTile, pressed && { opacity: 0.94 }]}
                      onPress={() => navigation.navigate("CreateEditFriend", { friendId: friend.id })}
                    >
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendAvatarText}>{friend.displayName.slice(0, 2).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.friendName} numberOfLines={1}>
                        {friend.displayName}
                      </Text>
                      <Text style={styles.friendMeta} numberOfLines={1}>
                        @{friend.username}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const stats = splitStatsByGroup.get(item.id);
            return (
              <GroupCard
                group={item}
                activeSplitsCount={stats?.activeSplitsCount}
                latestSplitName={stats?.latestSplitName}
                onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: layout.screenPaddingV,
    paddingBottom: layout.scrollBottom,
  },
  headerColumn: {
    gap: layout.block,
    marginBottom: layout.listGap,
  },
  titleBlock: {
    gap: layout.titleGap,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  searchShell: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    paddingHorizontal: layout.cardPaddingDense,
  },
  searchInput: {
    minHeight: touch.minHeight,
    ...typography.body,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  quickActions: {
    flexDirection: "row",
    gap: layout.stack,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    minHeight: touch.minHeight + 6,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.card,
  },
  actionBtnPrimaryText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 16,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    minHeight: touch.minHeight + 6,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.cardSubtle,
  },
  actionBtnSecondaryText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerColumn: {
    gap: layout.block,
    marginTop: layout.section,
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 32,
    fontWeight: "500",
  },
  sectionMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
    fontStyle: "italic",
  },
  groupHint: {
    ...typography.caption,
    color: colors.textDim,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    padding: layout.cardPadding,
    gap: layout.titleGap,
  },
  emptyTitle: {
    ...typography.subhead,
    fontSize: 18,
  },
  emptyCopy: {
    ...typography.caption,
    color: colors.textMuted,
  },
  friendTiles: {
    flexDirection: "row",
    gap: layout.stack,
  },
  friendTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    paddingHorizontal: layout.cardPaddingDense,
    paddingVertical: layout.cardPadding,
    minHeight: touch.minHeight + 24,
    ...shadows.cardSubtle,
    gap: layout.titleGap,
  },
  friendAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  friendAvatarText: {
    ...typography.caption,
    color: colors.accentStrong,
    fontWeight: "800",
    fontSize: 14,
  },
  friendName: {
    ...typography.caption,
    fontWeight: "700",
    fontSize: 13,
    color: colors.text,
  },
  friendMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  viewAllBtn: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    minHeight: touch.minHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllText: {
    color: colors.accentStrong,
    fontWeight: "700",
    fontSize: 14,
  },
});
