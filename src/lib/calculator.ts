import { BalanceEntry, Expense, Participant } from "../types";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeSettlements(
  participants: Participant[],
  expenses: Expense[]
): BalanceEntry[] {
  if (!participants.length || !expenses.length) return [];

  const net: Record<string, number> = {};
  participants.forEach((p) => {
    net[p.id] = 0;
  });

  expenses.forEach((expense) => {
    const share = expense.amount / participants.length;
    participants.forEach((p) => {
      net[p.id] -= share;
    });
    net[expense.paidBy] += expense.amount;
  });

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
