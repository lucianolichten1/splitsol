import { BalanceEntry, Participant, Split, UserProfile } from "../types";
import { assertCalculatorExamples } from "./calculator";
import { resolveCurrentUserParticipantId } from "./currentUserParticipant";
import { formatUsd } from "./formatMoney";

export type CurrentUserBalanceSummary = {
  /** Positive = you are owed money; negative = you owe. */
  netAmount: number;
  label: string;
  detailRows: string[];
};

function displayName(participants: Participant[], id: string): string {
  return participants.find((p) => p.id === id)?.nickname ?? "Unknown";
}

function balanceEntryCaptionParts(
  entry: BalanceEntry,
  participants: Participant[],
  currentUserParticipantId: string | null
): string {
  const fromName = displayName(participants ?? [], entry.from);
  const toName = displayName(participants ?? [], entry.to);

  if (!currentUserParticipantId) {
    return `${fromName} owes ${toName}`;
  }
  if (entry.from === currentUserParticipantId) {
    return `You owe ${toName}`;
  }
  if (entry.to === currentUserParticipantId) {
    return `${fromName} owes you`;
  }
  return `${fromName} owes ${toName}`;
}

/**
 * Relationship line + amount for list rows (Split Summary).
 */
export function formatBalanceRowForViewer(
  entry: BalanceEntry,
  participants: Participant[] | undefined,
  currentUserParticipantId: string | null
): string {
  const list = participants ?? [];
  return `${balanceEntryCaptionParts(entry, list, currentUserParticipantId)} ${formatUsd(entry.amount)}`;
}

export function getCurrentUserBalanceSummary(
  currentUserParticipantId: string | null,
  balances: BalanceEntry[] | undefined,
  participants: Participant[] | undefined
): CurrentUserBalanceSummary {
  const list = balances ?? [];
  const people = participants ?? [];
  const open = list.filter((b) => !b.settled);

  if (open.length === 0) {
    return { netAmount: 0, label: "All settled", detailRows: [] };
  }

  if (!currentUserParticipantId) {
    return {
      netAmount: 0,
      label: "",
      detailRows: open.map((b) => formatBalanceRowForViewer(b, people, null)),
    };
  }

  let net = 0;
  const detailRows: string[] = [];

  for (const b of open) {
    detailRows.push(formatBalanceRowForViewer(b, people, currentUserParticipantId));
    if (b.to === currentUserParticipantId) net += b.amount;
    if (b.from === currentUserParticipantId) net -= b.amount;
  }

  const rounded = Math.round(net * 100) / 100;
  let label: string;
  if (Math.abs(rounded) < 0.005) {
    label = "All settled";
  } else if (rounded > 0) {
    label = `You are owed ${formatUsd(rounded)}`;
  } else {
    label = `You owe ${formatUsd(-rounded)}`;
  }

  return { netAmount: rounded, label, detailRows };
}

/** Net for the current user across unsettled balances in one split. */
export function netForUserInSplitBalances(
  currentUserParticipantId: string | null,
  balances: BalanceEntry[] | undefined
): number {
  if (!currentUserParticipantId) return 0;
  let net = 0;
  for (const b of balances ?? []) {
    if (b.settled) continue;
    if (b.to === currentUserParticipantId) net += b.amount;
    if (b.from === currentUserParticipantId) net -= b.amount;
  }
  return Math.round(net * 100) / 100;
}

export type HomeBalanceAggregate = {
  netAmount: number;
  label: string;
};

export function aggregateCurrentUserBalanceAcrossSplits(
  profile: UserProfile | null,
  splits: Split[]
): HomeBalanceAggregate {
  if (!profile) {
    return { netAmount: 0, label: "Set up your profile to see your balance" };
  }

  let total = 0;
  for (const split of splits) {
    if (split.status === "settled") continue;
    const uid = resolveCurrentUserParticipantId(split.participants, profile);
    total += netForUserInSplitBalances(uid, split.balances);
  }

  const net = Math.round(total * 100) / 100;
  if (Math.abs(net) < 0.005) {
    return { netAmount: 0, label: "All settled" };
  }
  if (net > 0) {
    return { netAmount: net, label: `You are owed ${formatUsd(net)}` };
  }
  return { netAmount: net, label: `You owe ${formatUsd(-net)}` };
}

/** Dev/manual checks for examples A–D (throws on failure). */
export function assertBalanceSummaryExamples(): void {
  const me: Participant = { id: "me", nickname: "Me", isCurrentUser: true };
  const friend: Participant = { id: "friend", nickname: "Friend" };
  const alice: Participant = { id: "alice", nickname: "Alice" };
  const bob: Participant = { id: "bob", nickname: "Bob" };
  const p2 = [me, friend];
  const p3 = [me, alice, bob];

  const bal = (from: string, to: string, amount: number): BalanceEntry => ({
    id: `${from}-${to}`,
    from,
    to,
    amount,
    settled: false,
  });

  let s = getCurrentUserBalanceSummary("me", [bal("friend", "me", 25)], p2);
  if (s.netAmount !== 25 || !s.label.includes("owed")) throw new Error("Example A failed");

  s = getCurrentUserBalanceSummary("me", [bal("me", "friend", 25)], p2);
  if (s.netAmount !== -25 || !s.label.includes("You owe")) throw new Error("Example B failed");

  s = getCurrentUserBalanceSummary(
    "me",
    [bal("alice", "me", 30), bal("bob", "me", 30)],
    p3
  );
  if (s.netAmount !== 60 || s.detailRows.length !== 2) throw new Error("Example C failed");

  s = getCurrentUserBalanceSummary(
    "me",
    [bal("me", "alice", 30), bal("bob", "alice", 30)],
    p3
  );
  if (s.netAmount !== -30) throw new Error("Example D net failed");
  if (!s.detailRows.some((r) => r.includes("You owe"))) throw new Error("Example D wording failed");

  assertCalculatorExamples();
}
