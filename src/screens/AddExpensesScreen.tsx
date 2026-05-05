import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ExpenseItem } from "../components/ExpenseItem";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useRewards } from "../hooks/useRewards";
import { useSplits } from "../hooks/useSplits";
import { computeSettlements } from "../lib/calculator";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Expense, Split } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "AddExpenses">;

export function AddExpensesScreen({ route, navigation }: Props) {
  const { name, participants } = route.params;
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(participants[0]?.id ?? "");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { addSplit, splits } = useSplits();
  const { checkAndAwardRewards } = useRewards();

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
    if (expenses.length === 0) {
      Alert.alert("Add expenses", "Please add at least one expense.");
      return;
    }

    const balances = computeSettlements(participants, expenses);
    const splitId = `s-${Date.now()}`;
    const split: Split = {
      id: splitId,
      name,
      createdAt: new Date().toISOString(),
      createdBy: "local",
      participants,
      expenses,
      balances,
      status: balances.length === 0 ? "settled" : "active",
      totalAmount: Number(total.toFixed(2)),
    };

    await addSplit(split);
    await checkAndAwardRewards("split_created", [split, ...splits]);
    navigation.replace("SplitSummary", { splitId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Description</Text>
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
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Paid By</Text>
      <View style={styles.payerList}>
        {participants.map((participant) => {
          const selected = participant.id === paidBy;
          return (
            <Pressable
              key={participant.id}
              onPress={() => setPaidBy(participant.id)}
              style={[styles.payerChip, selected && styles.payerChipSelected]}
            >
              <Text style={[styles.payerText, selected && styles.payerTextSelected]}>
                {participant.nickname}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.addButton} onPress={addExpense}>
        <Text style={styles.addButtonText}>Add Expense</Text>
      </Pressable>

      <FlatList
        style={styles.list}
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm }}
        renderItem={({ item }) => <ExpenseItem expense={item} participants={participants} />}
      />

      <Pressable style={styles.calculateButton} onPress={calculate}>
        <Text style={styles.calculateText}>Calculate • Total {total.toFixed(2)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  label: {
    ...typography.caption,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  payerList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  payerChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  payerChipSelected: {
    borderColor: colors.accent,
  },
  payerText: {
    ...typography.caption,
  },
  payerTextSelected: {
    color: colors.accent,
  },
  addButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  addButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
  list: {
    marginTop: spacing.md,
  },
  calculateButton: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  calculateText: {
    color: colors.background,
    fontWeight: "700",
  },
});
