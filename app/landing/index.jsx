import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Redirect, useRouter } from 'expo-router'
import Colors from '../../services/Colors'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { useSSO } from '@clerk/clerk-expo'
import { UserDetailContext } from '../../context/UserDetailContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../services/FirebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'
export const useWarmUpBrowser = () => {
    useEffect(() => {
        // Preloads the browser for Android devices to reduce authentication load time
        // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
        void WebBrowser.warmUpAsync()
        return () => {
            // Cleanup: closes browser when component unmounts
            void WebBrowser.coolDownAsync()
        }
    }, [])
}

WebBrowser.maybeCompleteAuthSession()
export default function Index() {
    const { userDetail, setUserDetail } = useContext(UserDetailContext)
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    useWarmUpBrowser()



    // Use the `useSSO()` hook to access the `startSSOFlow()` method
    const { startSSOFlow } = useSSO()

    const onPress = useCallback(async () => {
        try {
            console.log("CLICK")
            // Start the authentication process by calling `startSSOFlow()`
            const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
                strategy: 'oauth_google',
                // For web, defaults to current path
                // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
                // For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
                redirectUrl: AuthSession.makeRedirectUri(),
            })

            // If sign in was successful, set the active session
            if (createdSessionId) {
                setActive({ session: createdSessionId })
            } else {
                // If there is no `createdSessionId`,
                // there are missing requirements, such as MFA
                // Use the `signIn` or `signUp` returned from `startSSOFlow`
                // to handle next steps
            }
        } catch (err) {
            // See https://clerk.com/docs/custom-flows/error-handling
            // for more info on error handling
            console.error(JSON.stringify(err, null, 2))
        }
    }, [])

    // onAuthStateChanged(auth, async (user) => {
    //     setLoading(true);
    //     if (user && !userDetail?.name) {
    //         // console.log("--", user);
    //         const result = await getDoc(doc(db, 'salon_users', user?.email));
    //         const userData = result.data();
    //         setUserDetail(result.data())
    //         // setTimeout(() => {
    //         console.log(userData)
    //         if (userData?.isBusinessOwner) {
    //             router.replace('/(owner)/Home');

    //         } else {
    //             router.replace('/(tabs)/Home');

    //         }
    //         setLoading(false);
    //         // })
    //     }

    // })

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onAuthStateChanged(auth, async (userInfo) => {
            if (!userInfo) {
                setLoading(false);
                return;
            }
            const result = await getDoc(doc(db, 'salon_users', userInfo?.email));
            const userData = result.data();
            setUserDetail(userData);

            // Get the current path
            const currentPath = router?.asPath || router?.pathname || "";

            if (userData?.isBusinessOwner && !currentPath.includes('/(owner)/Home')) {
                router.replace('/(owner)/Home');
            } else if (!userData?.isBusinessOwner && !currentPath.includes('/(tabs)/Home')) {
                router.replace('/(tabs)/Home');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);



    // const CheckUserSignIn = async () => {
    //     // setUserDetail({
    //     //     name: 'Tubeguruji',
    //     //     email: 'tubeguruji@gmail.com',
    //     //     picture: 'https://static.vecteezy.com/system/resources/thumbnails/005/346/410/small_2x/close-up-portrait-of-smiling-handsome-young-caucasian-man-face-looking-at-camera-on-isolated-light-gray-studio-background-photo.jpg'
    //     // });

    //     const isLogin = await AsyncStorage.getItem('isLogin');

    //     if (isLogin == 'true') {
    //         router.replace('/(tabs)/Home')
    //     }

    // }



    return (
        <View style={{
            marginTop: 100
        }}>
            <View style={{
                display: 'flex',
                alignItems: 'center'
            }}>
                <Image source={require('./../../assets/images/login.png')} style={{
                    width: 200,
                    height: 440,
                    borderWidth: 4,
                    borderRadius: 20
                }} />

            </View>

            <View style={{
                backgroundColor: Colors.PRIMARY,
                height: '100%',
                marginTop: -50,
                borderTopLeftRadius: 25,
                borderTopRightRadius: 25,
                padding: 25
            }}>
                <Text style={{
                    color: Colors.WHITE,
                    textAlign: 'center',
                    fontSize: 25,
                    fontWeight: 'bold',
                    fontFamily: 'outfit'
                }}>Welcome to Trimconnect</Text>

                <Text style={{
                    color: Colors.WHITE,
                    textAlign: 'center',
                    marginTop: 15,
                    fontFamily: 'outfit'
                }}>Effortlessly discover top salons and book appointments instantly! </Text>

                <TouchableOpacity
                    onPress={() => router.push('/auth/SignIn')}
                    style={{
                        backgroundColor: Colors.WHITE,
                        padding: 15,
                        borderRadius: 99,
                        marginTop: 50
                    }}>
                    <Text style={{
                        textAlign: 'center',
                        fontSize: 18,
                        fontFamily: 'outfit'
                    }}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push({
                        pathname: '/auth/SignIn',
                        params: {
                            isBusinessOwner: 'true'
                        }
                    })}
                >
                    <Text style={{
                        color: Colors.GARY,
                        textAlign: 'center',
                        marginTop: 50
                    }}>  Business Owner? Click Here</Text>
                </TouchableOpacity>
            </View>

        </View>
    )
}