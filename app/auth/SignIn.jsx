import { useLocalSearchParams, useRouter } from 'expo-router'
import Colors from './../../services/Colors';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserDetailContext } from './../../context/UserDetailContext'
import { auth, db } from '../../services/FirebaseConfig';

import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Pressable, ToastAndroid, ActivityIndicator } from 'react-native'
import { useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This screen lets users sign in with their email and password
// It handles both regular users and business owners
export default function SignIn() {
    // Used to navigate between screens
    const router = useRouter();
    // State for the email input
    const [email, setEmail] = useState();
    // State for the password input
    const [password, setPassword] = useState()
    // Get and set the current user's details from context
    const { userDetail, setUserDetail } = useContext(UserDetailContext)
    // State to show a loading spinner while signing in
    const [loading, setLoading] = useState(false);

    // Get the isBusinessOwner flag from the URL params (if present)
    const { isBusinessOwner } = useLocalSearchParams();

    // This function is called when the user presses the Sign In button
    const onSignInClick = () => {
        setLoading(true)
        signInWithEmailAndPassword(auth, email, password)
            .then(async (resp) => {
                const user = resp.user
                await getUserDetail();
                setLoading(false);
            }).catch(e => {
                setLoading(false);
                ToastAndroid.show('Incorrect Email & Password', ToastAndroid.BOTTOM)
            })
    }

    // This function fetches the user's details from the database
    // It also navigates to the correct home screen (owner or user)
    const getUserDetail = async () => {
        const result = await getDoc(doc(db, 'salon_users', email));
        const user = result.data()
        setUserDetail(user)
        if (isBusinessOwner && user?.isBusinessOwner) {
            router.replace('/(owner)/Home');
        } else {
            router.replace('/(tabs)/Home');
        }
    }
    // This is the main UI for the Sign In screen
    return (
        <View style={{
            display: 'flex',
            alignItems: 'center',
            paddingTop: 100,
            flex: 1,
            padding: 25,
            backgroundColor: Colors.WHITE
        }}>
            {/* App logo */}
            <Image source={require('./../../assets/images/logo.png')}
                style={{
                    width: 180,
                    height: 180
                }}
            />

            <Text style={{
                fontSize: 30,
                fontFamily: 'outfit-bold'
            }}>Welcome Back</Text>

            {/* Email input */}
            <TextInput placeholder='Email'
                onChangeText={(value) => setEmail(value)}
                style={styles.textInput} />
            {/* Password input */}
            <TextInput placeholder='Password'
                onChangeText={(value) => setPassword(value)}
                secureTextEntry={true}
                style={styles.textInput} />

            {/* Sign In button */}
            <TouchableOpacity
                onPress={onSignInClick}
                disabled={loading}
                style={{
                    padding: 15,
                    backgroundColor: Colors.PRIMARY,
                    width: '100%',
                    marginTop: 25,
                    borderRadius: 10
                }}
            >
                {!loading ? <Text style={{
                    fontFamily: 'outfit',
                    fontSize: 20,
                    color: Colors.WHITE,
                    textAlign: 'center'
                }}>Sign In</Text> :
                    <ActivityIndicator size={'large'} color={Colors.WHITE} />
                }
            </TouchableOpacity>

            {/* Link to sign up if the user doesn't have an account */}
            <View style={{
                display: 'flex',
                flexDirection: 'row', gap: 5,
                marginTop: 20
            }}>
                <Text style={{
                    fontFamily: 'outfit'
                }}>Don't have an account?</Text>
                <Pressable
                    onPress={() => router.push({
                        pathname: '/auth/SignUp',
                        params: {
                            isBusinessOwner: isBusinessOwner
                        }
                    })}
                >
                    <Text style={{
                        color: Colors.PRIMARY,
                        fontFamily: 'outfit-bold'
                    }}>Create New Here</Text>
                </Pressable>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    textInput: {
        borderWidth: 1,
        width: '100%',
        padding: 15,
        fontSize: 18,
        marginTop: 20,
        borderRadius: 8,
    }
}) 