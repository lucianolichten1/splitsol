import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { Group } from "../types";

type Props = {
  group: Group;
  onPress?: () => void;
  selected?: boolean;
};

export function GroupCard({ group, onPress, selected }: Props) {
  const n = group.members.length;
  const memberLine =
    n === 0 ? null : group.members.map((m) => m.nickname).join(" · ");

  const body = (
    <>
      <Text style={styles.name} numberOfLines={2}>
        {group.name}
      </Text>
      {group.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {group.description}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{n === 1 ? "1 member" : `${n} members`}</Text>
        </View>
        {memberLine ? (
          <Text style={styles.names} numberOfLines={2}>
            {memberLine}
          </Text>
        ) : (
          <Text style={styles.namesMuted}>Add people to start splitting</Text>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        android_ripple={{ color: "#ffffff18" }}
        style={({ pressed }) => [
          styles.card,
          selected && styles.cardSelected,
          pressed && styles.cardPressed,
        ]}
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
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: touch.minHeight + spacing.md,
    ...shadows.cardSubtle,
  },
  cardSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: colors.accentMuted,
  },
  cardPressed: {
    opacity: 0.94,
  },
  name: {
    ...typography.subhead,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  description: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  footer: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  countPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.3,
  },
  names: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  namesMuted: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textDim,
    fontStyle: "italic",
  },
});
