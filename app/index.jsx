import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {

  // const { isSignedIn } = useAuth()

  // if (isSignedIn) {
  //   return <Redirect href={'/'} />
  // }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Redirect href={'/landing'} />
    </View>
  );
}
