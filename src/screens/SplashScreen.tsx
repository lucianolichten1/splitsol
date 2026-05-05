import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/RootNavigator";
import { colors, typography } from "../constants/theme";
import { storage } from "../lib/storage";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const start = Date.now();
      try {
        await storage.ensureProfile();
      } catch {
        // Still enter the app; Profile tab can recover via ensureProfile on refresh.
      }
      const elapsed = Date.now() - start;
      const rest = Math.max(0, 1500 - elapsed);
      await new Promise<void>((resolve) => setTimeout(resolve, rest));
      if (!cancelled) {
        navigation.replace("MainTabs");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Text style={styles.logo}>SplitSol</Text>
      <Text style={styles.tagline}>Split fast. Settle clean.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    ...typography.heading,
    fontSize: 34,
    color: colors.primary,
  },
  tagline: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
