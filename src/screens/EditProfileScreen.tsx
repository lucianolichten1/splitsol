import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useProfile } from "../hooks/useProfile";
import { ProfileStackParamList } from "../navigation/profileStackTypes";

type Props = NativeStackScreenProps<ProfileStackParamList, "EditProfile">;

export function EditProfileScreen({ navigation }: Props) {
  const { profile, refreshProfile, updateProfile } = useProfile();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [mockWallet, setMockWallet] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setUsername(profile.username);
      setMockWallet(profile.mockWalletAddress ?? "");
    }
  }, [profile]);

  const save = async () => {
    if (!displayName.trim() || !username.trim()) {
      Alert.alert("Required", "Display name and username cannot be empty.");
      return;
    }
    try {
      await updateProfile({
        displayName: displayName.trim(),
        username: username.trim(),
        mockWalletAddress: mockWallet.trim(),
      });
      await refreshProfile();
      navigation.goBack();
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : "Try again.");
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.loading} edges={["bottom"]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Display name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.textDim}
            style={styles.input}
          />

          <Text style={styles.label}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="handle"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Mock wallet (optional)</Text>
          <Text style={styles.hint}>Phase 2 will connect a real Solana wallet. This field is local-only.</Text>
          <TextInput
            value={mockWallet}
            onChangeText={setMockWallet}
            placeholder="Not connected yet"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <Pressable
        accessibilityRole="button"
        android_ripple={{ color: "#00000022" }}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.94 }]}
        onPress={save}
      >
        <Text style={styles.ctaText}>Save</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.overline,
    marginTop: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.textDim,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
    minHeight: 52,
    fontSize: 16,
  },
  cta: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    minHeight: touch.minHeight + 4,
    justifyContent: "center",
    ...shadows.cardSubtle,
  },
  ctaText: {
    color: colors.background,
    fontWeight: "700",
    fontSize: 16,
  },
});
