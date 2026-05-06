import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../constants/theme";
import { CreateEditFriendScreen } from "../screens/CreateEditFriendScreen";
import { FriendsGroupsScreen } from "../screens/FriendsGroupsScreen";
import { GroupDetailScreen } from "../screens/GroupDetailScreen";
import { GroupsScreen } from "../screens/GroupsScreen";
import { GroupsStackParamList } from "./groupsStackTypes";

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export function GroupsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.surface },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="FriendsGroupsHome"
        component={FriendsGroupsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="GroupsList" component={GroupsScreen} options={{ title: "All groups" }} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: "Group" }} />
      <Stack.Screen
        name="CreateEditFriend"
        component={CreateEditFriendScreen}
        options={({ route }) => ({
          title: route.params?.friendId ? "Edit friend" : "Add friend",
        })}
      />
    </Stack.Navigator>
  );
}
