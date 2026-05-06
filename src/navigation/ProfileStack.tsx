import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../constants/theme";
import { CreateEditFriendScreen } from "../screens/CreateEditFriendScreen";
import { EditProfileScreen } from "../screens/EditProfileScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ProfileStackParamList } from "./profileStackTypes";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.surface },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit profile" }} />
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
