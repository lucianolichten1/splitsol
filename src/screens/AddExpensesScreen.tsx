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
import { SafeAreaView } from "react-native-safe-area-context";
import { ExpenseItem } from "../components/ExpenseItem";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useProfile } from "../hooks/useProfile";
import { useSplits } from "../hooks/useSplits";
import { computeSettlements } from "../lib/calculator";
import { navigateRoot } from "../lib/navigateRoot";
import { normalizeParticipantsForSplit, resolveCurrentUserParticipantId } from "../lib/currentUserParticipant";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Expense, ExpenseSplitMode, Participant, ParticipantConfirmationStatus, Split } from "../types";

function defaultEqualPercentInputs(parts: { id: string }[]): Record<string, string> {
  const n = parts.length;
  if (n === 0) return {};
  const base = Math.floor(100 / n);
  const rem = 100 - base * n;
  const out: Record<string, string> = {};
  parts.forEach((p, i) => {
    out[p.id] = String(base + (i < rem ? 1 : 0));
  });
  return out;
}

function parsePercentageInputs(
  participantList: Participant[],
  percentInputs: Record<string, string>
): { ok: true; values: Record<string, number> } | { ok: false; message: string } {
  let sum = 0;
  const values: Record<string, number> = {};
  for (const p of participantList) {
    const raw = (percentInputs[p.id] ?? "").trim();
    const n = Number(raw);
    if (raw === "" || Number.isNaN(n) || n < 0 || n > 100) {
      return { ok: false, message: `Enter a percentage from 0–100 for ${p.nickname}.` };
    }
    values[p.id] = n;
    sum += n;
  }
  if (Math.abs(sum - 100) > 0.01) {
    return { ok: false, message: "Percentages must add up to 100%." };
  }
  return { ok: true, values };
}

type Props = NativeStackScreenProps<RootStackParamList, "AddExpenses">;

export function AddExpensesScreen({ route, navigation }: Props) {
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
  const [splitMode, setSplitMode] = useState<ExpenseSplitMode>("equal");
  const [percentInputs, setPercentInputs] = useState<Record<string, string>>({});
  const [paidBy, setPaidBy] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { addSplit } = useSplits();
  const userPickedPayer = useRef(false);

  const participantIdsKey = useMemo(() => participants.map((p) => p.id).join(","), [participants]);

  useEffect(() => {
    if (participants.length === 0) return;
    setPercentInputs(defaultEqualPercentInputs(participants));
  }, [participantIdsKey, participants.length]);

  useEffect(() => {
    if (participants.length === 0) return;
    if (userPickedPayer.current) return;
    const uid = profile ? resolveCurrentUserParticipantId(participants, profile) : null;
    setPaidBy(uid ?? participants[0]!.id);
  }, [participants, profile]);

  const percentRunningTotal = useMemo(() => {
    if (splitMode !== "percentage") return null;
    let sum = 0;
    let any = false;
    for (const p of participants) {
      const raw = (percentInputs[p.id] ?? "").trim();
      if (raw === "") continue;
      const n = Number(raw);
      if (Number.isNaN(n)) continue;
      any = true;
      sum += n;
    }
    return any ? sum : null;
  }, [splitMode, percentInputs, participants]);

  const saveSplit = async (expensesToSave: Expense[]) => {
    if (participants.length < 2) {
      Alert.alert(
        "Need more people",
        "A split needs at least two participants. Go back and add members to the group."
      );
      return;
    }
    if (expensesToSave.length === 0) {
      Alert.alert(
        "Add expenses first",
        "Add one or more expenses with Add expense."
      );
      return;
    }

    const invalidExpense = expensesToSave.some(
      (e) =>
        !participants.some((p) => p.id === e.paidBy) ||
        !Number.isFinite(e.amount) ||
        e.amount <= 0
    );
    if (invalidExpense) {
      Alert.alert(
        "Fix your expenses",
        "Each line needs someone who paid and an amount greater than 0. Remove bad rows or edit the group and start over."
      );
      return;
    }

    const balances = computeSettlements(participants, expensesToSave);
    const splitId = `s-${Date.now()}`;
    const confirmationBase = participants.reduce<Record<string, ParticipantConfirmationStatus>>(
      (acc, p) => {
        acc[p.id] = p.id === currentUserParticipantId ? "accepted" : "pending";
        return acc;
      },
      {}
    );
    const split: Split = {
      id: splitId,
      name,
      groupId,
      groupName,
      createdAt: new Date().toISOString(),
      createdBy: "local",
      participants,
      expenses: expensesToSave,
      balances,
      status: balances.length === 0 ? "settled" : "pending",
      totalAmount: Number(expensesToSave.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)),
      participantConfirmations: confirmationBase,
    };

    await addSplit(split);
    navigateRoot(navigation, "MainTabs", { screen: "Transactions" }, false);
  };

  const addExpense = async () => {
    const parsed = Number(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert(
        "Amount must be greater than 0",
        "Enter a positive USD amount for how much was paid (decimals are OK)."
      );
      return;
    }
    if (!paidBy || !participants.some((p) => p.id === paidBy)) {
      Alert.alert("Payer required", "Choose who paid under Paid by.");
      return;
    }

    let participantPercents: Record<string, number> | undefined;
    if (splitMode === "percentage") {
      const parsedPercents = parsePercentageInputs(participants, percentInputs);
      if (!parsedPercents.ok) {
        Alert.alert("Check split percentages", parsedPercents.message);
        return;
      }
      participantPercents = parsedPercents.values;
    }

    const nextExpense: Expense = {
      id: `e-${Date.now()}-${expenses.length}`,
      description: description.trim() || `Expense ${expenses.length + 1}`,
      amount: parsed,
      paidBy,
      ...(splitMode === "percentage" ? { splitMode: "percentage" as const, participantPercents } : {}),
    };
    const nextExpenses = [...expenses, nextExpense];
    setExpenses(nextExpenses);
    setDescription("");
    setAmount("");
    await saveSplit(nextExpenses);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <FlatList<Expense>
          style={styles.list}
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <ScrollView scrollEnabled={false} keyboardShouldPersistTaps="handled">
              {groupName ? (
                <Text style={styles.groupContext} numberOfLines={1}>
                  Group · {groupName}
                </Text>
              ) : null}
              <Text style={styles.usdCallout}>
                All expense amounts are US dollars (USD). Splits and balances use these dollar amounts.
              </Text>
              <Text style={[styles.label, styles.labelFirst]}>Description</Text>
              <Text style={styles.fieldHint}>Optional: what was purchased or shared?</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Team dinner"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />

              <Text style={styles.label}>Amount (USD)</Text>
              <Text style={styles.fieldHint}>
                Total paid on this line in US dollars (must be greater than 0).
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="e.g. 24.50 (USD)"
                placeholderTextColor={colors.textDim}
                style={styles.input}
                keyboardType="decimal-pad"
                inputMode="decimal"
              />

              <Text style={styles.label}>Split this expense</Text>
              <Text style={styles.fieldHint}>
                Equal divides the USD amount across everyone. Percentage sets each person&apos;s share of the total
                (must add up to 100%).
              </Text>
              <View style={styles.splitModeRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: splitMode === "equal" }}
                  onPress={() => setSplitMode("equal")}
                  style={[styles.splitModeChip, splitMode === "equal" && styles.splitModeChipSelected]}
                >
                  <Text style={[styles.splitModeChipText, splitMode === "equal" && styles.splitModeChipTextSelected]}>
                    Equally
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: splitMode === "percentage" }}
                  onPress={() => {
                    setSplitMode("percentage");
                    setPercentInputs(defaultEqualPercentInputs(participants));
                  }}
                  style={[styles.splitModeChip, splitMode === "percentage" && styles.splitModeChipSelected]}
                >
                  <Text
                    style={[styles.splitModeChipText, splitMode === "percentage" && styles.splitModeChipTextSelected]}
                  >
                    By percentage
                  </Text>
                </Pressable>
              </View>

              {splitMode === "percentage" ? (
                <View style={styles.percentBlock}>
                  {participants.map((participant) => {
                    const isMe = currentUserParticipantId === participant.id;
                    return (
                      <View key={participant.id} style={styles.percentRow}>
                        <Text style={styles.percentName} numberOfLines={1}>
                          {participant.nickname}
                          {isMe ? " (you)" : ""}
                        </Text>
                        <View style={styles.percentInputWrap}>
                          <TextInput
                            value={percentInputs[participant.id] ?? ""}
                            onChangeText={(text) =>
                              setPercentInputs((prev) => ({ ...prev, [participant.id]: text }))
                            }
                            placeholder="0"
                            placeholderTextColor={colors.textDim}
                            style={styles.percentInput}
                            keyboardType="decimal-pad"
                            inputMode="decimal"
                            maxLength={6}
                          />
                          <Text style={styles.percentSuffix}>%</Text>
                        </View>
                      </View>
                    );
                  })}
                  {percentRunningTotal !== null ? (
                    <Text
                      style={[
                        styles.percentTotal,
                        Math.abs(percentRunningTotal - 100) <= 0.01
                          ? styles.percentTotalOk
                          : styles.percentTotalWarn,
                      ]}
                    >
                      Total: {percentRunningTotal.toFixed(2).replace(/\.?0+$/, "")}%
                      {Math.abs(percentRunningTotal - 100) > 0.01 ? " · should be 100%" : ""}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <Text style={styles.label}>Paid by</Text>
              <Text style={styles.fieldHint}>Who paid this amount? Defaults to you when possible.</Text>
              <View style={styles.payerList}>
                {participants.map((participant) => {
                  const selected = participant.id === paidBy;
                  const isMe = currentUserParticipantId === participant.id;
                  return (
                    <Pressable
                      key={participant.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        userPickedPayer.current = true;
                        setPaidBy(participant.id);
                      }}
                      style={[styles.payerChip, selected && styles.payerChipSelected]}
                    >
                      <Text style={[styles.payerText, selected && styles.payerTextSelected]}>
                        {participant.nickname}
                        {isMe ? " (you)" : ""}
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
                <Text style={styles.addButtonText}>Add expense</Text>
              </Pressable>

              <Text style={styles.addedSectionLabel}>Added expenses</Text>
              <Text style={styles.addedSectionHint}>
                {expenses.length === 0
                  ? "Nothing yet-add at least one expense."
                  : `${expenses.length} line item${expenses.length !== 1 ? "s" : ""} · review below`}
              </Text>
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
  splitModeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  splitModeChip: {
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
  splitModeChipSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: colors.accentMuted,
  },
  splitModeChipText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "600",
  },
  splitModeChipTextSelected: {
    color: colors.accent,
    fontWeight: "800",
  },
  percentBlock: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  percentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  percentName: {
    ...typography.caption,
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "600",
  },
  percentInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    minWidth: 100,
  },
  percentInput: {
    flex: 1,
    minWidth: 48,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  percentSuffix: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textMuted,
  },
  percentTotal: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  percentTotalOk: {
    color: colors.success,
  },
  percentTotalWarn: {
    color: colors.warning,
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
    paddingBottom: 160,
  },
  groupContext: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
    marginBottom: spacing.sm,
    fontSize: 13,
  },
  usdCallout: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 17,
    color: colors.text,
    fontWeight: "600",
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    fontSize: 12,
    lineHeight: 17,
  },
  addedSectionLabel: {
    ...typography.overline,
    marginTop: spacing.lg,
    fontSize: 11,
  },
  addedSectionHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
});
