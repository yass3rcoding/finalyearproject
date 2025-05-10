import { Stack } from "expo-router";
import { useFonts } from 'expo-font';
import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { UserDetailContext } from './../context/UserDetailContext'
import { useState } from "react";
export default function RootLayout() {

  const [userDetail, setUserDetail] = useState();
  const [loaded, error] = useFonts({
    'outfit-bold': require('./../assets/fonts/Outfit-Bold.ttf'),
    'outfit': require('./../assets/fonts/Outfit-Regular.ttf'),

  });



  return (
    <ClerkProvider tokenCache={tokenCache}>
      <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
        <Stack screenOptions={{
          headerShown: false
        }}>
          <Stack.Screen name="landing/index" />
        </Stack>
      </UserDetailContext.Provider>
    </ClerkProvider>
  )
}
