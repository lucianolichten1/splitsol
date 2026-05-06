import { useEffect, useState } from "react";
import {
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
import { useFriends } from "../hooks/useFriends";

type FriendEditorParamList = {
  CreateEditFriend: { friendId?: string } | undefined;
};

type Props = NativeStackScreenProps<FriendEditorParamList, "CreateEditFriend">;

export function CreateEditFriendScreen({ navigation, route }: Props) {
  const friendId = route.params?.friendId;
  const isEdit = !!friendId;
  const { friends, refresh, addFriend, updateFriend, deleteFriend } = useFriends();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    if (!friendId) return;
    const f = friends.find((x) => x.id === friendId);
    if (f) {
      setDisplayName(f.displayName);
      setUsername(f.username);
      setWalletAddress(f.walletAddress ?? "");
    } else {
      refresh();
    }
  }, [friendId, friends, refresh]);

  const save = async () => {
    if (!displayName.trim()) {
      Alert.alert("Display name required", "Enter how you’ll recognize this person in your groups.");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Username required", "Add a handle (letters, numbers). Used to match them later—no @ needed in the field.");
      return;
    }
    try {
      if (isEdit && friendId) {
        await updateFriend(friendId, {
          displayName: displayName.trim(),
          username: username.trim(),
          walletAddress: walletAddress.trim(),
        });
      } else {
        await addFriend({
          displayName: displayName.trim(),
          username: username.trim(),
          walletAddress: walletAddress.trim() || undefined,
        });
      }
      await refresh();
      navigation.goBack();
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : "Try again.");
    }
  };

  const tryDelete = () => {
    if (!friendId) return;
    Alert.alert(
      "Remove friend?",
      "They will stay on any groups they were already added to. This only removes them from your saved friends list.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFriend(friendId);
              await refresh();
              navigation.goBack();
            } catch (e) {
              Alert.alert("Could not remove", e instanceof Error ? e.message : "Try again.");
            }
          },
        },
      ]
    );
  };

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
            placeholder="e.g. Alex Kim"
            placeholderTextColor={colors.textDim}
            style={styles.input}
          />

          <Text style={styles.label}>Username</Text>
          <Text style={styles.hint}>Lowercase handle, no spaces. Shown as @handle in the app.</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. alexkim"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Wallet address (optional)</Text>
          <Text style={styles.hint}>Optional for now. For future payouts—stored only on this device.</Text>
          <TextInput
            value={walletAddress}
            onChangeText={setWalletAddress}
            placeholder="Paste Solana address if you have it"
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
        <Text style={styles.ctaText}>{isEdit ? "Save changes" : "Save friend"}</Text>
      </Pressable>

      {isEdit ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.danger, pressed && { opacity: 0.9 }]}
          onPress={tryDelete}
        >
          <Text style={styles.dangerText}>Remove from friends</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: spacing.sm,
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
  danger: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  dangerText: {
    color: colors.error,
    fontWeight: "600",
    fontSize: 15,
  },
});
