import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useFriends } from "../hooks/useFriends";
import { useProfile } from "../hooks/useProfile";
import { ProfileStackParamList } from "../navigation/profileStackTypes";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileHome">;

function profileInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const one = parts[0] ?? "?";
  return one.slice(0, 2).toUpperCase();
}

function truncateId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function ProfileScreen({ navigation }: Props) {
  const { profile, loading, refreshProfile } = useProfile();
  const { friends, loading: friendsLoading, refresh: refreshFriends } = useFriends();

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      refreshFriends();
    }, [refreshProfile, refreshFriends])
  );

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.centered} edges={["top"]}>
        <ActivityIndicator size="large" color={colors.accent} accessibilityLabel="Loading profile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profileInitials(profile.displayName)}</Text>
          </View>
          <Text style={styles.displayName}>{profile.displayName}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
        </View>

        <View style={styles.rowCard}>
          <Text style={styles.rowLabel}>User ID</Text>
          <Text style={styles.rowValue} selectable>
            {truncateId(profile.id)}
          </Text>
        </View>

        <View style={styles.rowCard}>
          <Text style={styles.rowLabel}>Wallet</Text>
          <Text style={styles.rowValueMuted}>
            {profile.mockWalletAddress?.trim() || "Not connected yet"}
          </Text>
        </View>

        <Text style={styles.phaseNote}>Wallet connection coming in Phase 2.</Text>

        <Pressable
          accessibilityRole="button"
          android_ripple={{ color: "#ffffff22" }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.94 }]}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.primaryBtnText}>Edit profile</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          android_ripple={{ color: "#ffffff22" }}
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.92 }]}
          onPress={() => navigation.navigate("Rewards")}
        >
          <Text style={styles.secondaryBtnText}>Rewards</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My friends</Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => navigation.navigate("CreateEditFriend", {})}
          >
            <Text style={styles.addLink}>+ Add</Text>
          </Pressable>
        </View>

        {friendsLoading ? (
          <ActivityIndicator color={colors.accent} style={styles.friendsLoading} />
        ) : friends.length === 0 ? (
          <Text style={styles.emptyFriends}>No saved friends yet. Add people you split with often.</Text>
        ) : (
          <View style={styles.friendList}>
            {friends.map((f) => (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                android_ripple={{ color: "#ffffff18" }}
                style={({ pressed }) => [styles.friendRow, pressed && { opacity: 0.92 }]}
                onPress={() => navigation.navigate("CreateEditFriend", { friendId: f.id })}
              >
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>{profileInitials(f.displayName)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendName}>{f.displayName}</Text>
                  <Text style={styles.friendMeta}>@{f.username}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  profileCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.card,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(20, 241, 149, 0.35)",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: -0.5,
  },
  displayName: {
    ...typography.screenTitle,
    fontSize: 22,
  },
  username: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: "600",
  },
  rowCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xs,
    ...shadows.cardSubtle,
  },
  rowLabel: {
    ...typography.overline,
    fontSize: 11,
  },
  rowValue: {
    ...typography.body,
    fontWeight: "600",
    fontSize: 15,
  },
  rowValueMuted: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: "600",
  },
  phaseNote: {
    ...typography.caption,
    color: colors.textDim,
    lineHeight: 18,
    paddingHorizontal: spacing.xs,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    minHeight: touch.minHeight + 6,
    justifyContent: "center",
    ...shadows.cardSubtle,
  },
  primaryBtnText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    minHeight: touch.minHeight + 2,
    justifyContent: "center",
    ...shadows.cardSubtle,
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.overline,
    fontSize: 12,
  },
  addLink: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 15,
  },
  friendsLoading: {
    marginVertical: spacing.lg,
  },
  emptyFriends: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 20,
  },
  friendList: {
    gap: spacing.sm,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: touch.minHeight + 8,
    ...shadows.cardSubtle,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  friendAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  friendName: {
    ...typography.body,
    fontWeight: "700",
  },
  friendMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: "300",
  },
});
