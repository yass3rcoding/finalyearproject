import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, ToastAndroid, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db, storage } from '../../services/FirebaseConfig';
import { UserDetailContext } from '../../context/UserDetailContext';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { BusinessDetailContext } from '../../context/BusinessDetailContext';
import WorkerList from '../../components/WorkerList';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';

// This screen lets the business owner view and update their business details (name, address, image, etc.)
// It also allows them to pick a location on a map and manage their list of workers
export default function BusinessInfo() {
    // State for the business image (banner)
    const [image, setImage] = useState(null);
    // State for the business name
    const [businessName, setBusinessName] = useState('');
    // State for the business address
    const [address, setAddress] = useState('');
    // State for the business description/about
    const [description, setDescription] = useState('');
    // State for the business phone number
    const [phone, setPhone] = useState('');
    // State to show a loading spinner when saving
    const [loading, setLoading] = useState(false);
    // State for the list of workers (barbers) at this business
    const [workers, setWorkers] = useState([]);
    // Get the current logged-in user's details from context
    const { userDetail, setUserDetail } = useContext(UserDetailContext);
    // Get the current business info from context
    const { business, setBusiness } = useContext(BusinessDetailContext);
    // Used to navigate between screens
    const router = useRouter();
    // State for the business location (latitude/longitude)
    const [location, setLocation] = useState({ latitude: 51.5074, longitude: -0.1278 }); // Default: London

    // When the screen loads, this function gets the business info from the database.
    // It fills in all the details (name, address, image, etc.) so the owner can see and edit them.
    useEffect(() => {
        if (userDetail) GetBusiness();
        // eslint-disable-next-line
    }, []); // Only run once on mount

    // This function fetches the business info for the logged-in user from the database.
    // It updates the app with all the business details so the owner can view or change them.
    const GetBusiness = async () => {
        const q = query(collection(db, 'salon_business'), where('email', '==', userDetail?.email));
        const querySnapshot = await getDocs(q);
        let businessData = [];
        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            setBusiness(docData); // Save in context
            setUserDetail && setUserDetail(prev => ({
                ...prev,
                businessId: docData.id,
                businessName: docData.name,
            }));
            businessData = docData;
        }
        setBusinessName(businessData?.name)
        setAddress(businessData?.address)
        setDescription(businessData?.about)
        setPhone(businessData?.contact)
        setImage(businessData?.banner)
        setWorkers(businessData?.workers || [])
        if (businessData?.location) {
            setLocation(businessData.location);
        }
    }

    // This function lets the owner pick a new image for their business from their phone.
    // If they pick one, it updates the image shown on the screen.
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    // This function is called when the list of workers (barbers) is changed.
    // It updates the list of workers for the business.
    const handleUpdateWorkers = (updatedWorkers) => {
        setWorkers(updatedWorkers);
    };

    // This function is called when the owner presses the Save button.
    // It uploads the new image (if changed) and saves all the business details to the database.
    const onAddNewBusiness = async () => {
        setLoading(true);
        const fileName = Date.now().toString() + ".jpg";
        const resp = await fetch(image);
        const blob = await resp.blob();

        const imageRef = ref(storage, 'salon_app/' + fileName);
        if (business?.banner != image) {
            uploadBytes(imageRef, blob).then((snapshot) => {
                console.log("File Uploaded...")
            }).then(resp => {
                getDownloadURL(imageRef).then(async (downloadUrl) => {
                    console.log(downloadUrl);
                    saveBusinessDetail(downloadUrl)
                })
            })
        }
        else {
            saveBusinessDetail(image)
        }
        setLoading(false);
    }

    // This function saves all the business details to the database.
    // It creates or updates the business info so it stays up to date.
    const saveBusinessDetail = async (imageUrl) => {
        const businessId = business?.id ?? Date.now().toString();
        const data = {
            name: businessName,
            address: address,
            contact: phone,
            about: description,
            email: userDetail?.email,
            banner: imageUrl,
            premium: true,
            rating: business?.rating || "0.0",
            id: businessId,
            workers: workers,
            location: location
        }
        await setDoc(doc(db, 'salon_business', businessId), data, { merge: true })
        setLoading(false);
        setBusiness(data);
        ToastAndroid.show('Business details updated successfully', ToastAndroid.LONG);
    }

    // This is the main UI for the Business Info screen
    return (
        <>
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Business Details</Text>

            {/* Button to pick or show the business image */}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.image} />
                ) : (
                    <Text style={styles.imagePlaceholder}>Upload Business Image</Text>
                )}
            </TouchableOpacity>

            {/* Input for business name */}
            <TextInput
                placeholder="Business Name"
                style={styles.input}
                value={businessName}
                onChangeText={setBusinessName}
            />

            {/* Input for business address */}
            <TextInput
                placeholder="Business Address"
                style={styles.input}
                value={address}
                onChangeText={setAddress}
            />

            {/* Input for business description/about */}
            <TextInput
                placeholder="Description"
                style={[styles.input, styles.multiline]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
            />

            {/* Input for business phone number */}
            <TextInput
                placeholder="Phone Number"
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
            />

            {/* Map Picker for Location */}
            <Text style={{ marginTop: 10, marginBottom: 5 }}>Shop Location:</Text>
            <MapView
                style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 10 }}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                region={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                onPress={e => setLocation(e.nativeEvent.coordinate)}
            >
                <Marker coordinate={location} />
            </MapView>

            {/* Section to manage the list of workers (barbers) */}
            <View style={styles.section}>
                <WorkerList 
                    workers={workers}
                    onUpdateWorkers={handleUpdateWorkers}
                />
            </View>

            {/* Button to save all business details */}
            <TouchableOpacity 
                style={styles.submitButton} 
                onPress={onAddNewBusiness}
                disabled={loading}
            >
                {loading && <ActivityIndicator color="#fff" style={styles.loader} />}
                <Text style={styles.submitText}>Save Business Details</Text>
            </TouchableOpacity>
        </ScrollView>
        </>
    );
}

// These are the styles for how everything looks on the screen
const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 20,
    },
    imagePicker: {
        height: 180,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    imagePlaceholder: {
        color: '#666',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
    },
    multiline: {
        textAlignVertical: 'top',
        height: 100
    },
    section: {
        marginVertical: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    submitButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 8,
    },
    loader: {
        marginRight: 8,
    },
});