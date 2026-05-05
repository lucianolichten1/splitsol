import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../constants/theme";
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
          <Pressable style={styles.button} onPress={onClose}>
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
    ...typography.subhead,
  },
  name: {
    ...typography.heading,
  },
  description: {
    ...typography.caption,
    textAlign: "center",
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  buttonText: {
    color: colors.text,
    fontWeight: "700",
  },
});
