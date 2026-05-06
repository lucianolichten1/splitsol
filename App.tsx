import { useEffect } from "react";
import { Caveat_600SemiBold } from "@expo-google-fonts/caveat";
import { Kalam_400Regular, Kalam_700Bold } from "@expo-google-fonts/kalam";
import { PatrickHand_400Regular } from "@expo-google-fonts/patrick-hand";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Caveat_600SemiBold,
    Kalam_400Regular,
    Kalam_700Bold,
    PatrickHand_400Regular,
  });

  useEffect(() => {
    if (fontError) {
      console.error(fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
