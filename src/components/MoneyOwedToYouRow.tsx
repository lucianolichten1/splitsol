import { StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, typography } from "../constants/theme";
import { formatUsd } from "../lib/formatMoney";
import { BalanceEntry, Participant, ParticipantConfirmationStatus } from "../types";

function displayName(participants: Participant[], id: string): string {
  return participants.find((p) => p.id === id)?.nickname ?? "Unknown";
}

function debtorConfirmationLabel(
  confirmations: Record<string, ParticipantConfirmationStatus> | undefined,
  debtorId: string
): string {
  const raw = confirmations?.[debtorId];
  if (raw === "accepted") return "accepted";
  if (raw === "disputed") return "disputed";
  return "pending";
}

type Props = {
  entry: BalanceEntry;
  participants: Participant[];
  participantConfirmations?: Record<string, ParticipantConfirmationStatus>;
};

export function MoneyOwedToYouRow({ entry, participants, participantConfirmations }: Props) {
  const debtorName = displayName(participants, entry.from);
  const theirStatus = debtorConfirmationLabel(participantConfirmations, entry.from);

  return (
    <View style={styles.card}>
      <Text style={styles.line}>
        <Text style={styles.nameEmphasis}>{debtorName}</Text> owes you
      </Text>
      <Text style={styles.amount}>{formatUsd(entry.amount)}</Text>
      <Text style={styles.amountCaption}>US dollars (USD)</Text>
      <Text style={styles.statusLine}>
        Their confirmation: {theirStatus} · Awaiting payment or local settlement from them
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.cardSubtle,
  },
  line: {
    ...typography.body,
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },
  nameEmphasis: {
    color: colors.accentStrong,
    fontWeight: "800",
  },
  amount: {
    ...typography.heading,
    fontSize: 22,
    fontWeight: "700",
    color: colors.accent,
  },
  amountCaption: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textDim,
    fontWeight: "600",
  },
  statusLine: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
