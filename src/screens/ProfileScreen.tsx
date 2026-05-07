import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, layout, radius, shadows, touch, typography } from "../constants/theme";
import { useProfile } from "../hooks/useProfile";
import { storage } from "../lib/storage";
import { truncateWalletAddress } from "../lib/truncateWalletAddress";
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
  const [clearingData, setClearingData] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile])
  );

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.centered} edges={["top"]}>
        <ActivityIndicator size="large" color={colors.accentStrong} accessibilityLabel="Loading profile" />
      </SafeAreaView>
    );
  }

  const confirmClearLocalData = () => {
    if (clearingData) return;
    Alert.alert(
      "Clear local data?",
      "This will delete your local profile, friends, groups, transactions, and wallet connection from this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear data",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setClearingData(true);
              try {
                await storage.clearLocalData();
                await refreshProfile();
                Alert.alert("Local data cleared.");
              } catch {
                Alert.alert("Could not clear local data", "Please try again.");
              } finally {
                setClearingData(false);
              }
            })();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Me</Text>
            <Text style={styles.pageSubtitle}>identity + settings</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            android_ripple={{ color: "#ffffff22" }}
            style={({ pressed }) => [styles.editPill, pressed && { opacity: 0.94 }]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Text style={styles.editPillText}>edit</Text>
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profileInitials(profile.displayName)}</Text>
          </View>
          <Text style={styles.displayName}>{profile.displayName}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          <View style={styles.idChip}>
            <Text style={styles.idChipText}>id · {truncateId(profile.id)}</Text>
          </View>
        </View>

        <View style={styles.rowCard}>
          <Text style={styles.rowLabel}>Wallet</Text>
          <Text style={styles.rowValueMuted} selectable>
            {profile.mockWalletAddress?.trim()
              ? truncateWalletAddress(profile.mockWalletAddress.trim())
              : "not connected"}
          </Text>
        </View>

        <Text style={styles.settingsTitle}>Settings</Text>
        <View style={styles.rowCard}>
          <Text style={styles.rowLabel}>Appearance</Text>
          <Text style={styles.rowValueMuted}>dark · auto</Text>
        </View>
        <View style={styles.rowCard}>
          <Text style={styles.rowLabel}>Notifications</Text>
          <Text style={styles.rowValueMuted}>on</Text>
        </View>
        <View style={styles.rowCard}>
          <Text style={styles.rowLabel}>Default currency</Text>
          <Text style={styles.rowValueMuted}>SOL</Text>
        </View>

        <Text style={styles.settingsTitle}>Local Data</Text>
        <View style={styles.rowCard}>
          <Text style={styles.rowLabel}>Reset local app state</Text>
          <Text style={styles.rowValueMuted}>Use this to reset the app before creating demo data.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear local data"
            android_ripple={{ color: "#ff4d4d22" }}
            disabled={clearingData}
            style={({ pressed }) => [
              styles.dangerBtn,
              pressed && !clearingData && styles.dangerBtnPressed,
              clearingData && styles.disabledBtn,
            ]}
            onPress={confirmClearLocalData}
          >
            <Text style={styles.dangerBtnText}>{clearingData ? "Clearing..." : "Clear local data"}</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          android_ripple={{ color: "#ffffff22" }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.94 }]}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.primaryBtnText}>Edit profile</Text>
        </Pressable>
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
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: layout.screenPaddingV,
    paddingBottom: layout.scrollBottom,
    gap: layout.block,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageTitle: {
    ...typography.screenTitle,
  },
  pageSubtitle: {
    ...typography.caption,
    marginTop: -layout.titleGap,
    fontStyle: "italic",
  },
  editPill: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    minHeight: touch.minHeight - 6,
    paddingHorizontal: layout.cardPadding,
    justifyContent: "center",
  },
  editPillText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "700",
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    padding: layout.section,
    alignItems: "center",
    gap: layout.stack,
    ...shadows.card,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: colors.background,
    letterSpacing: -0.7,
  },
  displayName: {
    ...typography.heading,
    fontSize: 44,
    fontWeight: "500",
  },
  username: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: "600",
  },
  idChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.pill,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: layout.inline,
    backgroundColor: colors.surfaceElevated,
  },
  idChipText: {
    ...typography.caption,
    color: colors.textDim,
    fontWeight: "600",
  },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    paddingHorizontal: layout.cardPadding,
    paddingVertical: layout.cardPadding,
    gap: layout.inline,
    ...shadows.cardSubtle,
  },
  rowLabel: {
    ...typography.overline,
    fontSize: 10,
  },
  rowValueMuted: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: "600",
  },
  settingsTitle: {
    ...typography.heading,
    fontSize: 34,
    fontWeight: "500",
    marginTop: layout.stack,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: layout.section,
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
  dangerBtn: {
    marginTop: layout.inline,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.warningMuted,
    minHeight: touch.minHeight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: layout.cardPadding,
    paddingVertical: layout.inline,
  },
  dangerBtnPressed: {
    opacity: 0.9,
  },
  dangerBtnText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "800",
    color: colors.error,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
