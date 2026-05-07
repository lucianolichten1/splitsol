import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../constants/theme";
import { TabNavigator } from "./TabNavigator";
import { SplashScreen } from "../screens/SplashScreen";
import { CreateSplitScreen } from "../screens/CreateSplitScreen";
import { AddExpensesScreen } from "../screens/AddExpensesScreen";
import { SplitSummaryScreen } from "../screens/SplitSummaryScreen";
import { CreateEditGroupScreen } from "../screens/CreateEditGroupScreen";
import { Participant } from "../types";

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  CreateSplit: { presetGroupId?: string } | undefined;
  AddExpenses: {
    name: string;
    participants: Participant[];
    groupId?: string;
    groupName?: string;
  };
  SplitSummary: {
    splitId: string;
  };
  CreateEditGroup: { groupId?: string; cameFrom?: "split" | "groups" } | undefined;
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
          <Stack.Screen name="CreateSplit" component={CreateSplitScreen} options={{ title: "Create Transaction" }} />
          <Stack.Screen name="AddExpenses" component={AddExpensesScreen} options={{ title: "Add expenses (SOL)" }} />
          <Stack.Screen name="SplitSummary" component={SplitSummaryScreen} options={{ title: "Split summary (SOL)" }} />
          <Stack.Screen
            name="CreateEditGroup"
            component={CreateEditGroupScreen}
            options={({ route }) => ({
              title: route.params?.groupId ? "Edit Group" : "New Group",
            })}
          />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
