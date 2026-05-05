import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ExpenseItem } from "../components/ExpenseItem";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useProfile } from "../hooks/useProfile";
import { useRewards } from "../hooks/useRewards";
import { useSplits } from "../hooks/useSplits";
import { computeSettlements } from "../lib/calculator";
import { normalizeParticipantsForSplit, resolveCurrentUserParticipantId } from "../lib/currentUserParticipant";
import { storage } from "../lib/storage";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Expense, Split } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "AddExpenses">;

export function AddExpensesScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { name, participants: routeParticipants, groupId, groupName } = route.params;
  const { profile } = useProfile();
  const participants = useMemo(() => {
    if (!profile) return routeParticipants;
    return normalizeParticipantsForSplit(
      routeParticipants.map((p) => ({ ...p })),
      profile
    );
  }, [routeParticipants, profile]);

  const currentUserParticipantId = useMemo(
    () => (profile ? resolveCurrentUserParticipantId(participants, profile) : null),
    [participants, profile]
  );

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { addSplit } = useSplits();
  const { checkAndAwardRewards } = useRewards();
  const userPickedPayer = useRef(false);

  useEffect(() => {
    if (participants.length === 0) return;
    if (userPickedPayer.current) return;
    const uid = profile ? resolveCurrentUserParticipantId(participants, profile) : null;
    setPaidBy(uid ?? participants[0]!.id);
  }, [participants, profile]);

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const addExpense = () => {
    const parsed = Number(amount);
    if (!description.trim() || Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert("Invalid expense", "Add a description and amount > 0.");
      return;
    }
    setExpenses((prev) => [
      ...prev,
      {
        id: `e-${Date.now()}-${prev.length}`,
        description: description.trim(),
        amount: parsed,
        paidBy,
      },
    ]);
    setDescription("");
    setAmount("");
  };

  const calculate = async () => {
    if (participants.length < 2) {
      Alert.alert(
        "Need more people",
        "A split needs at least two participants. Go back and add members to the group."
      );
      return;
    }
    if (expenses.length === 0) {
      Alert.alert("Add expenses", "Please add at least one expense.");
      return;
    }

    const invalidExpense = expenses.some(
      (e) =>
        !participants.some((p) => p.id === e.paidBy) ||
        !Number.isFinite(e.amount) ||
        e.amount <= 0
    );
    if (invalidExpense) {
      Alert.alert("Invalid expense", "Each expense needs a valid payer and amount.");
      return;
    }

    const balances = computeSettlements(participants, expenses);
    const splitId = `s-${Date.now()}`;
    const split: Split = {
      id: splitId,
      name,
      groupId,
      groupName,
      createdAt: new Date().toISOString(),
      createdBy: "local",
      participants,
      expenses,
      balances,
      status: balances.length === 0 ? "settled" : "active",
      totalAmount: Number(total.toFixed(2)),
    };

    await addSplit(split);
    const allSplits = await storage.getSplits();
    await checkAndAwardRewards("split_created", { splits: allSplits });
    navigation.replace("SplitSummary", { splitId });
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList<Expense>
          style={styles.list}
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ScrollView scrollEnabled={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.label, styles.labelFirst]}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Dinner"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />

              <Text style={styles.label}>Amount</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="42.50"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                keyboardType="numeric"
                inputMode="decimal"
              />

              <Text style={styles.label}>Paid By</Text>
              <View style={styles.payerList}>
                {participants.map((participant) => {
                  const selected = participant.id === paidBy;
                  return (
                    <Pressable
                      key={participant.id}
                      onPress={() => {
                        userPickedPayer.current = true;
                        setPaidBy(participant.id);
                      }}
                      style={[styles.payerChip, selected && styles.payerChipSelected]}
                    >
                      <Text style={[styles.payerText, selected && styles.payerTextSelected]}>
                        {participant.nickname}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="button"
                android_ripple={{ color: "#ffffff22" }}
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                onPress={addExpense}
              >
                <Text style={styles.addButtonText}>Add Expense</Text>
              </Pressable>
            </ScrollView>
          }
          renderItem={({ item }) => (
            <ExpenseItem
              expense={item}
              participants={participants}
              currentUserParticipantId={currentUserParticipantId}
            />
          )}
        />
      </KeyboardAvoidingView>

      <Pressable
        accessibilityRole="button"
        android_ripple={{ color: "#00000022" }}
        style={({ pressed }) => [
          styles.calculateButton,
          { marginBottom: spacing.md + Math.max(insets.bottom, spacing.sm) },
          pressed && styles.calculateButtonPressed,
        ]}
        onPress={calculate}
      >
        <Text style={styles.calculateText}>Calculate · Total {total.toFixed(2)}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  label: {
    ...typography.overline,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  labelFirst: {
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    minHeight: 52,
    fontSize: 16,
  },
  payerList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  payerChip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touch.minHeight,
    justifyContent: "center",
    ...shadows.cardSubtle,
  },
  payerChipSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: colors.accentMuted,
  },
  payerText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "600",
  },
  payerTextSelected: {
    color: colors.accent,
    fontWeight: "800",
  },
  addButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    minHeight: touch.minHeight,
    justifyContent: "center",
  },
  addButtonPressed: {
    opacity: 0.92,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  list: {
    marginTop: spacing.sm,
  },
  listContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 140,
  },
  calculateButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    minHeight: touch.minHeight + 8,
    justifyContent: "center",
    ...shadows.card,
  },
  calculateButtonPressed: {
    opacity: 0.94,
  },
  calculateText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
