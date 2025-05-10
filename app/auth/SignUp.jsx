import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Pressable, ToastAndroid, ActivityIndicator, ScrollView } from 'react-native'
import React, { useContext, useState } from 'react'
import Colors from './../../services/Colors'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { doc, setDoc } from 'firebase/firestore';
import { UserDetailContext } from './../../context/UserDetailContext'
import { auth, db } from '../../services/FirebaseConfig';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';

// This screen lets users sign up for a new account (regular user or business owner)
// Business owners can also enter business details and pick a location
export default function SignUp() {
    // Used to navigate between screens
    const router = useRouter();
    // State for the user's full name
    const [fullName, setFullName] = useState();
    // State for the user's email
    const [email, setEmail] = useState();
    // State for the user's password
    const [password, setPassowrd] = useState();
    // Get and set the current user's details from context
    const { userDetail, setUserDetail } = useContext(UserDetailContext)
    // Get the isBusinessOwner flag from the URL params (if present)
    const { isBusinessOwner } = useLocalSearchParams();
    console.log("busiessOwner", isBusinessOwner);

    // Business info states
    const [businessName, setBusinessName] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [phone, setPhone] = useState('');
    const [image, setImage] = useState(null);
    const [location, setLocation] = useState({ latitude: 51.5074, longitude: -0.1278 }); // Default: London
    const [loading, setLoading] = useState(false);

    // This function is called when the user presses the Create Account button
    const CreateNewAccount = () => {
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (resp) => {
                const user = resp.user;
                console.log(user);
                await SaveUser(user);
                // Save User to Database
            })
            .catch(e => {
                console.log(e.message)
            })
    }

    // Image picker for business image
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    // This function saves the user (and business, if owner) to the database
    const SaveUser = async (user) => {
        setLoading(true);
        const data = {
            name: fullName,
            email: email,
            member: false,
            uid: user?.uid,
            isBusinessOwner: isBusinessOwner ?? false
        }
        await setDoc(doc(db, 'salon_users', email), data)
        setUserDetail(data);
        let businessId = null;
        if (isBusinessOwner) {
            let imageUrl = '';
            if (image) {
                imageUrl = image;
            }
            businessId = Date.now().toString();
            const businessData = {
                name: businessName,
                address: address,
                contact: phone,
                about: description,
                email: email,
                banner: imageUrl,
                premium: true,
                rating: '0.0',
                id: businessId,
                workers: [],
                location: location
            };
            await setDoc(doc(db, 'salon_business', businessId), businessData);
            // No need to fetch or set business context here
        }
        setLoading(false);
        if (isBusinessOwner) {
            router.replace('/(owner)/Home')
        } else {
            router.replace('/(tabs)/Home')
        }
    }

    // This is the main UI for the Sign Up screen
    return (
        <ScrollView contentContainerStyle={{
            display: 'flex',
            alignItems: 'center',
            paddingTop: 100,
            flexGrow: 1,
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
            }}>Create New Account</Text>

            {/* Full name input */}
            <TextInput placeholder='Full Name' onChangeText={(value) => setFullName(value)} style={styles.textInput} />
            {/* Email input */}
            <TextInput placeholder='Email' onChangeText={(value) => setEmail(value)} style={styles.textInput} />
            {/* Password input */}
            <TextInput placeholder='Password' onChangeText={(value) => setPassowrd(value)} secureTextEntry={true}
                style={styles.textInput} />

            {/* Business owner extra fields */}
            {isBusinessOwner && (
                <>
                    {/* Business name input */}
                    <TextInput placeholder='Business Name' onChangeText={setBusinessName} style={styles.textInput} />
                    {/* Business address input */}
                    <TextInput placeholder='Business Address' onChangeText={setAddress} style={styles.textInput} />
                    {/* Business description input */}
                    <TextInput placeholder='Description' onChangeText={setDescription} style={styles.textInput} />
                    {/* Business phone input */}
                    <TextInput placeholder='Phone Number' onChangeText={setPhone} style={styles.textInput} keyboardType='phone-pad' />
                    {/* Button to pick a business image */}
                    <TouchableOpacity onPress={pickImage} style={{ ...styles.textInput, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                        <Text>{image ? 'Change Business Image' : 'Pick Business Image'}</Text>
                    </TouchableOpacity>
                    {/* Show the picked image */}
                    {image && <Image source={{ uri: image }} style={{ width: 100, height: 100, borderRadius: 8, marginBottom: 10 }} />}
                    {/* Map to pick the shop location */}
                    <Text style={{ marginTop: 10, marginBottom: 5 }}>Pick Shop Location:</Text>
                    <MapView
                        style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 10 }}
                        initialRegion={{
                            latitude: location.latitude,
                            longitude: location.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        onPress={e => setLocation(e.nativeEvent.coordinate)}
                    >
                        <Marker coordinate={location} />
                    </MapView>
                </>
            )}

            {/* Button to create the account */}
            <TouchableOpacity
                onPress={CreateNewAccount}
                style={{
                    padding: 15,
                    backgroundColor: Colors.PRIMARY,
                    width: '100%',
                    marginTop: 25,
                    borderRadius: 10
                }}
            >
                <Text style={{
                    fontFamily: 'outfit',
                    fontSize: 20,
                    color: Colors.WHITE,
                    textAlign: 'center'
                }}>Create Account</Text>
            </TouchableOpacity>

            {/* Link to sign in if the user already has an account */}
            <View style={{
                display: 'flex',
                flexDirection: 'row', gap: 5,
                marginTop: 20
            }}>
                <Text style={{
                    fontFamily: 'outfit'
                }}>Already have an account?</Text>
                <Pressable
                    onPress={() => router.push({
                        params: {
                            isBusinessOwner: isBusinessOwner
                        },
                        pathname: '/auth/SignIn'
                    })}
                >
                    <Text style={{
                        color: Colors.PRIMARY,
                        fontFamily: 'outfit-bold'
                    }}>Sign In Here</Text>
                </Pressable>
            </View>

            {/* Show loading spinner overlay while saving */}
            {loading && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                    <ActivityIndicator size="large" color={Colors.PRIMARY} />
                </View>
            )}

        </ScrollView>
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