import { BalanceEntry, Expense, Participant } from "../types";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Net balance per participant: positive = owed money, negative = owes money. */
export function computeParticipantNets(
  participants: Participant[],
  expenses: Expense[]
): Record<string, number> {
  const net: Record<string, number> = {};
  participants.forEach((p) => {
    net[p.id] = 0;
  });

  const validExpenses = expenses.filter(
    (e) =>
      participants.some((p) => p.id === e.paidBy) &&
      typeof e.amount === "number" &&
      Number.isFinite(e.amount) &&
      e.amount > 0
  );

  validExpenses.forEach((expense) => {
    const share = expense.amount / participants.length;
    participants.forEach((p) => {
      net[p.id] -= share;
    });
    net[expense.paidBy] += expense.amount;
  });

  Object.keys(net).forEach((k) => {
    net[k] = round2(net[k]);
  });
  return net;
}

export function computeSettlements(
  participants: Participant[],
  expenses: Expense[]
): BalanceEntry[] {
  if (!participants.length || !expenses.length) return [];

  const net = computeParticipantNets(participants, expenses);

  const creditors = Object.entries(net)
    .filter(([, amount]) => amount > 0.009)
    .sort((a, b) => b[1] - a[1]);
  const debtors = Object.entries(net)
    .filter(([, amount]) => amount < -0.009)
    .sort((a, b) => a[1] - b[1]);

  const settlements: BalanceEntry[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;
  let seq = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const [creditorId, creditorAmount] = creditors[creditorIndex];
    const [debtorId, debtorAmount] = debtors[debtorIndex];
    const amount = round2(Math.min(creditorAmount, -debtorAmount));

    settlements.push({
      id: `balance-${debtorId}-${creditorId}-${seq++}`,
      from: debtorId,
      to: creditorId,
      amount,
      settled: false,
    });

    creditors[creditorIndex][1] = round2(creditors[creditorIndex][1] - amount);
    debtors[debtorIndex][1] = round2(debtors[debtorIndex][1] + amount);

    if (creditors[creditorIndex][1] <= 0.009) creditorIndex += 1;
    if (debtors[debtorIndex][1] >= -0.009) debtorIndex += 1;
  }

  return settlements;
}

/** Throws if calculator examples A–B fail (two-person nets / single settlement). */
export function assertCalculatorExamples(): void {
  const me: Participant = { id: "me", nickname: "Me", isCurrentUser: true };
  const friend: Participant = { id: "friend", nickname: "Friend" };
  const participants = [me, friend];

  const exp = (paidBy: string, amount: number, i: number): Expense => ({
    id: `e-${i}`,
    description: "test",
    amount,
    paidBy,
  });

  let s = computeSettlements(participants, [exp("me", 50, 0)]);
  if (s.length !== 1 || s[0].from !== "friend" || s[0].to !== "me" || s[0].amount !== 25) {
    throw new Error(`Example A: expected Friend→Me $25, got ${JSON.stringify(s)}`);
  }

  s = computeSettlements(participants, [exp("me", 50, 0), exp("friend", 100, 1)]);
  if (s.length !== 1 || s[0].from !== "me" || s[0].to !== "friend" || s[0].amount !== 25) {
    throw new Error(`Example B: expected Me→Friend $25, got ${JSON.stringify(s)}`);
  }

  const alice: Participant = { id: "alice", nickname: "Alice" };
  const bob: Participant = { id: "bob", nickname: "Bob" };
  const p3 = [me, alice, bob];
  s = computeSettlements(p3, [exp("me", 90, 0)]);
  if (s.length !== 2) throw new Error(`Example C: expected 2 settlements, got ${s.length}`);
  const toMe = s.filter((x) => x.to === "me" && x.amount === 30);
  if (toMe.length !== 2) throw new Error(`Example C: expected two $30 to me`);

  s = computeSettlements(p3, [exp("alice", 90, 0)]);
  if (s.length !== 2) throw new Error(`Example D: expected 2 settlements`);
  const meOwesAlice = s.find((x) => x.from === "me" && x.to === "alice");
  if (!meOwesAlice || meOwesAlice.amount !== 30) throw new Error(`Example D: Me→Alice $30`);
}
