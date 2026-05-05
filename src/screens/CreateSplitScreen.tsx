import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, radius, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "CreateSplit">;

export function CreateSplitScreen({ navigation }: Props) {
  const [name, setName] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<{ id: string; nickname: string }[]>([]);

  const addParticipant = () => {
    const nickname = participantInput.trim();
    if (!nickname) return;
    setParticipants((prev) => [...prev, { id: `p-${Date.now()}-${prev.length}`, nickname }]);
    setParticipantInput("");
  };

  const continueNext = () => {
    if (!name.trim()) {
      Alert.alert("Split name required", "Please add a group name.");
      return;
    }
    if (participants.length < 2) {
      Alert.alert("Need participants", "Add at least 2 participants.");
      return;
    }
    navigation.navigate("AddExpenses", { name: name.trim(), participants });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Group Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="ETHDenver Dinner"
        placeholderTextColor={colors.textDim}
        style={styles.input}
      />

      <Text style={styles.label}>Participants</Text>
      <View style={styles.row}>
        <TextInput
          value={participantInput}
          onChangeText={setParticipantInput}
          placeholder="Alice"
          placeholderTextColor={colors.textDim}
          style={[styles.input, styles.flex]}
        />
        <Pressable style={styles.addButton} onPress={addParticipant}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.chips}>
        {participants.map((participant) => (
          <View key={participant.id} style={styles.chip}>
            <Text style={styles.chipText}>{participant.nickname}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.cta} onPress={continueNext}>
        <Text style={styles.ctaText}>Continue</Text>
      </Pressable>
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
  label: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  flex: {
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: {
    ...typography.caption,
  },
  cta: {
    marginTop: "auto",
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  ctaText: {
    color: colors.background,
    fontWeight: "700",
  },
});
