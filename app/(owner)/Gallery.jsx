// GalleryScreen.js
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, Image, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ToastAndroid } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'expo-router';

import { collection, addDoc, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Plus, Trash, Upload } from 'lucide-react-native';
import Colors from '../../services/Colors';
import { BusinessDetailContext } from '../../context/BusinessDetailContext';
import { db, storage } from '../../services/FirebaseConfig';
import { UserDetailContext } from '../../context/UserDetailContext';

// This is a placeholder, not used in the code
const businessId = "your_business_id";

// This screen lets the business owner upload, view, and delete images in their business gallery
export default function Gallery() {
    // State to store the list of images for the gallery
    const [images, setImages] = useState([]);
    // State to show a loading spinner when uploading or fetching
    const [uploading, setUploading] = useState(false);
    // Get the current business info from context
    const { business, setBusiness } = useContext(BusinessDetailContext);
    // Get the current logged-in user's details from context
    const { userDetail } = useContext(UserDetailContext);
    // Used to navigate between screens (not used here, but imported)
    const router = useRouter();

    // This function lets the user pick an image from their phone to upload to the gallery.
    // It opens the phone's image picker, and if the user selects an image, it uploads it.
    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });

            // If the user picked an image, upload it
            if (!result.canceled) {
                await uploadImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error("Image picker error:", error);
            ToastAndroid.show('Failed to pick image', ToastAndroid.SHORT);
        }
    };

    // This function uploads the selected image to the app's online storage (Firebase Storage).
    // After uploading, it saves the image link to the business's gallery in the database.
    const uploadImage = async (uri) => {
        // If business info is not loaded, show an error
        if (!business?.id) {
            ToastAndroid.show('Business information not loaded. Please try again.', ToastAndroid.LONG);
            return;
        }

        try {
            setUploading(true); // Show loading spinner
            const fileName = Date.now().toString() + ".jpg";
            const resp = await fetch(uri);
            const blob = await resp.blob();

            // Upload the image to Firebase Storage
            const imageRef = ref(storage, 'salon_app/' + fileName);
            await uploadBytes(imageRef, blob);
            // Get the download URL for the uploaded image
            const downloadUrl = await getDownloadURL(imageRef);
            // Add the image URL to the business gallery in Firestore
            await updateBusinessGallery(downloadUrl);
            
            ToastAndroid.show('Image uploaded successfully', ToastAndroid.SHORT);
        } catch (error) {
            console.error("Upload Error:", error);
            ToastAndroid.show('Failed to upload image', ToastAndroid.SHORT);
        } finally {
            setUploading(false); // Hide loading spinner
        }
    };

    // This function adds the new image's web link to the business's list of images in the database.
    // It does not remove any old images, just adds the new one.
    const updateBusinessGallery = async (url) => {
        const docRef = doc(db, "salon_business", business?.id);
        // Add the new image URL to the images array (doesn't overwrite existing images)
        await updateDoc(docRef, {
            images: arrayUnion(url)
        });
        fetchImages(); // Refresh the gallery
        console.log('upladed...')
    }

    // This function gets the latest business info (including images) from the database.
    // It updates the app with the newest images for the business.
    const fetchImages = async () => {
        setUploading(true)
        try {
            // Query the business document for the current user
            const q = query(collection(db, 'salon_business'), where('email', '==', userDetail?.email));
            const querySnapshot = await getDocs(q);
            let businessData = [];
            querySnapshot.forEach((doc) => {
                setBusiness(doc.data());
                businessData = doc.data();
                console.log(doc.data())
            });
            await setBusiness(businessData);
            setUploading(false);
        } catch (error) {
            setUploading(false);
            console.error("Fetch Error:", error);
        }
    };

    // This function runs automatically when the screen opens.
    // It loads the business's images so they show up in the gallery.
    useEffect(() => {
        fetchImages();
    }, []);

    // This function removes an image from the business's gallery.
    // It deletes the image link from the database (but not from storage).
    const deleteImage = async (url) => {
        setUploading(true)
        // Remove the image URL from the images array
        const imageList = business?.images.filter(item => item != url);
        const docRef = doc(db, "salon_business", business?.id);
        await updateDoc(docRef, {
            images: imageList
        });
        fetchImages(); // Refresh the gallery
        setUploading(false)
    }

    // This is the main UI for the Gallery screen
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gallery</Text>
            {uploading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.loadingText}>Uploading...</Text>
                </View>
            ) : (
                <>
                    {/* Button to pick and upload a new image */}
                    <TouchableOpacity 
                        onPress={pickImage} 
                        style={styles.uploadButton}
                        disabled={uploading}
                    >
                        <Text style={styles.uploadButtonText}>+</Text>
                    </TouchableOpacity>

                    <Text style={styles.heading}>Uploaded Images</Text>
                    {/* List of uploaded images in a grid */}
                    <FlatList
                        data={business?.images || []}
                        numColumns={2}
                        refreshing={uploading}
                        onRefresh={fetchImages}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => (
                            <View style={styles.imageContainer}>
                                {/* Show the image */}
                                <Image 
                                    source={{ uri: item }} 
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                                {/* Button to delete the image */}
                                <TouchableOpacity 
                                    onPress={() => deleteImage(item)}
                                    style={styles.deleteButton}
                                >
                                    <Trash color={'red'} />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                </>
            )}
        </View>
    );
}

// These are the styles for how everything looks on the screen
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 20,
        backgroundColor: '#fff'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666'
    },
    heading: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginVertical: 10 
    },
    imageContainer: {
        flex: 1,
        margin: 10,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative'
    },
    image: {
        width: '100%',
        height: 170,
        borderRadius: 10
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20
    },
    uploadButton: {
        padding: 20,
        borderWidth: 0.3,
        borderRadius: 15,
        marginTop: 15,
        borderStyle: 'dashed',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center'
    },
    uploadButtonText: {
        fontSize: 25,
        textAlign: 'center'
    },
    deleteButton: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 5,
        borderRadius: 5
    }
});
