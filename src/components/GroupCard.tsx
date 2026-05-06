import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, layout, radius, shadows, touch, typography } from "../constants/theme";
import { Group } from "../types";

type Props = {
  group: Group;
  onPress?: () => void;
  selected?: boolean;
  activeSplitsCount?: number;
  latestSplitName?: string | null;
};

export function GroupCard({ group, onPress, selected, activeSplitsCount, latestSplitName }: Props) {
  const n = group.members.length;
  const memberLine = n === 0 ? null : group.members.map((m) => m.nickname).join(" · ");

  const splitStatsLine =
    activeSplitsCount !== undefined ? (
      <Text style={styles.splitStats} numberOfLines={1}>
        {activeSplitsCount === 0 ? "no active" : `${activeSplitsCount} active`}
        {latestSplitName ? ` · ${latestSplitName}` : ""}
      </Text>
    ) : null;

  const body = (
    <View style={styles.main}>
      <Text style={styles.name} numberOfLines={1}>
        {group.name}
      </Text>
      {group.description ? (
        <Text style={styles.description} numberOfLines={1}>
          {group.description}
        </Text>
      ) : null}
      <Text style={styles.meta} numberOfLines={1}>
        {n === 1 ? "1 ppl" : `${n} ppl`} · last: yesterday
      </Text>
      {splitStatsLine}
      {memberLine ? (
        <Text style={styles.names} numberOfLines={1}>
          {memberLine}
        </Text>
      ) : (
        <Text style={styles.namesMuted}>add people to start</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens group details"
        android_ripple={{ color: "#ffffff18" }}
        style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.cardPressed]}
        onPress={onPress}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={styles.card}>{body}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.xl,
    paddingVertical: layout.cardPadding,
    paddingHorizontal: layout.cardPadding,
    minHeight: touch.minHeight + layout.cardPadding,
    ...shadows.cardSubtle,
  },
  cardSelected: {
    borderColor: colors.accentStrong,
    borderWidth: 2,
    backgroundColor: colors.primaryMuted,
  },
  cardPressed: {
    opacity: 0.94,
  },
  main: {
    gap: 2,
  },
  name: {
    ...typography.heading,
    fontSize: 30,
    fontWeight: "500",
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
  },
  meta: {
    ...typography.caption,
    color: colors.textDim,
    fontStyle: "italic",
  },
  names: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
  },
  namesMuted: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textDim,
    fontStyle: "italic",
  },
  splitStats: {
    ...typography.caption,
    fontSize: 12,
    color: colors.accentStrong,
    fontWeight: "600",
  },
});
