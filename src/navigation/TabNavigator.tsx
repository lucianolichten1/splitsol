import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, radius, typography } from "../constants/theme";
import { TransactionsScreen } from "../screens/TransactionsScreen";
import { WalletScreen } from "../screens/WalletScreen";
import { GroupsStack } from "./GroupsStack";
import { ProfileStack } from "./ProfileStack";

export type MainTabParamList = {
  FriendsGroups: undefined;
  Transactions: undefined;
  Wallet: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_INNER_ROW = Platform.OS === "android" ? 64 : 58;

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 4);
  const paddingTop = layout.stack;
  const tabBarHeight = paddingTop + TAB_INNER_ROW + bottomInset;

  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.background,
        tabBarInactiveTintColor: colors.textDim,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingTop,
          paddingBottom: bottomInset,
          paddingHorizontal: layout.inline,
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          justifyContent: "center",
          alignItems: "center",
          minHeight: 48,
          borderRadius: radius.pill,
          marginHorizontal: 4,
        },
        tabBarActiveBackgroundColor: "transparent",
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontSize: 11,
          fontWeight: "700",
          marginBottom: 0,
          marginTop: 0,
        },
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: colors.surface }} />,
      }}
    >
      <Tab.Screen
        name="FriendsGroups"
        component={GroupsStack}
        options={{
          tabBarLabel: "People",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
              <Ionicons name="people-outline" size={size ?? 22} color={focused ? colors.background : color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarLabel: "Transactions",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
              <Ionicons name="reader-outline" size={size ?? 22} color={focused ? colors.background : color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarLabel: "Wallet",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
              <Ionicons name="wallet-outline" size={size ?? 22} color={focused ? colors.background : color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: "Me",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
              <Ionicons name="person-circle-outline" size={size ?? 22} color={focused ? colors.background : color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleActive: {
    backgroundColor: colors.accent,
  },
});
