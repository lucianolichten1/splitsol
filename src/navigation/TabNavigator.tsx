import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HistoryScreen } from "../screens/HistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { colors, spacing, typography } from "../constants/theme";
import { GroupsStack } from "./GroupsStack";
import { ProfileStack } from "./ProfileStack";

export type MainTabParamList = {
  Groups: undefined;
  Splits: undefined;
  History: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Space for icon + label row inside the bar (below paddingTop, above safe inset) */
const TAB_INNER_ROW = Platform.OS === "android" ? 58 : 54;

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0);
  const paddingTop = spacing.sm;
  /** Total bar height; explicit height overrides React Navigation’s default (~49 + inset) so icons + labels fit on Android. */
  const tabBarHeight = paddingTop + TAB_INNER_ROW + bottomInset;

  // Bottom inset is applied once in tabBarStyle (avoids stacking with tab bar’s default inset).
  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingTop,
          paddingBottom: bottomInset,
          paddingHorizontal: spacing.xs,
          elevation: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 0,
          marginTop: 0,
        },
      }}
    >
      <Tab.Screen
        name="Groups"
        component={GroupsStack}
        options={{
          tabBarLabel: "Groups",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Splits"
        component={HomeScreen}
        options={{
          tabBarLabel: "Splits",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
