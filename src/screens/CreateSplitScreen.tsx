import { useCallback, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { GroupCard } from "../components/GroupCard";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useGroups } from "../hooks/useGroups";
import { useProfile } from "../hooks/useProfile";
import { normalizeParticipantsForSplit } from "../lib/currentUserParticipant";
import { storage } from "../lib/storage";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "CreateSplit">;

export function CreateSplitScreen({ navigation, route }: Props) {
  const { groups, refresh } = useGroups();
  const { profile, refreshProfile } = useProfile();
  const [splitName, setSplitName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshProfile();
      const preset = route.params?.presetGroupId;
      setSelectedGroupId(
        typeof preset === "string" && preset.length > 0 ? preset : null
      );
    }, [refresh, refreshProfile, route.params?.presetGroupId])
  );

  const continueNext = async () => {
    if (!selectedGroupId) {
      Alert.alert("Choose a group", "Select a group for this split, or create a new one.");
      return;
    }
    const latestGroups = await storage.getGroups();
    const group = latestGroups.find((g) => g.id === selectedGroupId);
    if (!group) {
      Alert.alert("Group missing", "Refresh and try again, or pick another group.");
      return;
    }
    if (group.members.length < 2) {
      Alert.alert(
        "Need more people",
        "Add at least two members to this group before creating a split."
      );
      return;
    }
    if (!splitName.trim()) {
      Alert.alert("Split name required", "Give this split a name (e.g. Weekend dinner).");
      return;
    }

    const profileData = profile ?? (await storage.ensureProfile());
    const snapshot = normalizeParticipantsForSplit(
      group.members.map((m) => ({ ...m })),
      profileData
    );

    navigation.navigate("AddExpenses", {
      name: splitName.trim(),
      participants: snapshot,
      groupId: group.id,
      groupName: group.name,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, styles.labelFirst]}>Group</Text>
          <Text style={styles.hint}>Pick a saved group. Members are snapshotted when you continue.</Text>

          {groups.length === 0 ? (
            <Text style={styles.emptyGroups}>No groups yet. Create one below.</Text>
          ) : (
            groups.map((g) => (
              <View key={g.id} style={styles.cardWrap}>
                <GroupCard
                  group={g}
                  selected={selectedGroupId === g.id}
                  onPress={() => setSelectedGroupId(g.id)}
                />
              </View>
            ))
          )}

          <Pressable
            accessibilityRole="button"
            android_ripple={{ color: "#ffffff22" }}
            style={({ pressed }) => [styles.newGroupBtn, pressed && { opacity: 0.92 }]}
            onPress={() => navigation.navigate("CreateEditGroup", { cameFrom: "split" })}
          >
            <Text style={styles.newGroupBtnText}>+ Create new group</Text>
          </Pressable>

          <Text style={styles.label}>Split name</Text>
          <TextInput
            value={splitName}
            onChangeText={setSplitName}
            placeholder="Weekend dinner"
            placeholderTextColor={colors.textDim}
            style={styles.input}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <Pressable
        accessibilityRole="button"
        android_ripple={{ color: "#00000022" }}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={continueNext}
      >
        <Text style={styles.ctaText}>Continue to expenses</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.overline,
    marginTop: spacing.lg,
  },
  labelFirst: {
    marginTop: 0,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  emptyGroups: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  cardWrap: {
    marginBottom: spacing.xs,
  },
  newGroupBtn: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    minHeight: touch.minHeight,
    justifyContent: "center",
    ...shadows.cardSubtle,
  },
  newGroupBtnText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 15,
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
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    minHeight: touch.minHeight + 6,
    justifyContent: "center",
    ...shadows.card,
  },
  ctaPressed: {
    opacity: 0.94,
  },
  ctaText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
