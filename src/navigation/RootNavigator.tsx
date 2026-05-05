import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../constants/theme";
import { TabNavigator } from "./TabNavigator";
import { SplashScreen } from "../screens/SplashScreen";
import { CreateSplitScreen } from "../screens/CreateSplitScreen";
import { AddExpensesScreen } from "../screens/AddExpensesScreen";
import { SplitSummaryScreen } from "../screens/SplitSummaryScreen";

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  CreateSplit: undefined;
  AddExpenses: {
    name: string;
    participants: { id: string; nickname: string }[];
  };
  SplitSummary: {
    splitId: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerTintColor: colors.text }}>
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Group screenOptions={{ presentation: "modal" }}>
          <Stack.Screen name="CreateSplit" component={CreateSplitScreen} options={{ title: "Create Split" }} />
          <Stack.Screen name="AddExpenses" component={AddExpensesScreen} options={{ title: "Add Expenses" }} />
          <Stack.Screen name="SplitSummary" component={SplitSummaryScreen} options={{ title: "Split Summary" }} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
