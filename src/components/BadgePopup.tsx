import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, touch, typography } from "../constants/theme";
import { Badge } from "../types";

type Props = {
  badge: Badge | null;
  onClose: () => void;
};

export function BadgePopup({ badge, onClose }: Props) {
  return (
    <Modal visible={!!badge} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>{badge?.icon}</Text>
          <Text style={styles.title}>Badge Unlocked!</Text>
          <Text style={styles.name}>{badge?.name}</Text>
          <Text style={styles.description}>{badge?.description}</Text>
          <Pressable
            accessibilityRole="button"
            android_ripple={{ color: "#ffffff22" }}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Nice</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    ...typography.overline,
    color: colors.accent,
  },
  name: {
    ...typography.screenTitle,
    fontSize: 22,
    textAlign: "center",
  },
  description: {
    ...typography.caption,
    textAlign: "center",
  },
  button: {
    marginTop: spacing.md,
    alignSelf: "stretch",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    minHeight: touch.minHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
});
