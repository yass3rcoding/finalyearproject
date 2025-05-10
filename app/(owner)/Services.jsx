import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, addDoc, query, doc, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../services/FirebaseConfig';
import Colors from '../../services/Colors';
import { BusinessDetailContext } from '../../context/BusinessDetailContext';
import BusinessServices from '../../components/BusinessServices';
import { useRouter } from 'expo-router';

// This screen lets the business owner add new services (like haircuts, shaves, etc.)
// It also shows a list of all services for the business
export default function Services() {
    // Get the current business info from context
    const { business } = useContext(BusinessDetailContext);
    // State to store the list of services (not used directly here, but could be for future features)
    const [serviceList, setServiceList] = useState([]);
    // State for the new service name input
    const [serviceName, setServiceName] = useState('');
    // State for the new service price input
    const [price, setPrice] = useState('');
    // State for the new service duration input
    const [duration, setDuration] = useState('');
    // State to trigger a refresh of the service list after adding a new service
    const [refreshData, setRefreshData] = useState();
    // Used to navigate between screens (not used here, but imported for consistency)
    const router = useRouter();
    console.log("business", business)

    // This function is called when the owner presses the Add Service button.
    // It checks that all fields are filled in, then saves the new service to the database.
    // After saving, it clears the input fields and refreshes the list of services.
    const handleAddService = async () => {
        // Make sure all fields are filled in
        if (!serviceName || !price || !duration) {
            Alert.alert('Please fill all fields');
            return;
        }

        try {
            // Create a unique ID for the new service
            const docId = Date.now().toString();
            console.log(" business?.id", business?.id)

            // Save the new service to Firestore
            await setDoc(doc(db, "salone_services", docId), {
                name: serviceName,
                amount: Number(price),
                time: duration, // e.g. "30 mins"
                businessId: business?.id,
                createdAt: new Date(),
                id: docId
            });

            Alert.alert('Service added successfully!');
            setServiceName('');
            setPrice('');
            setDuration('');

            setRefreshData(Date.now()) // Trigger refresh of the service list
        } catch (error) {
            console.error('Error adding service:', error);
            Alert.alert('Error', 'Something went wrong while adding the service.');
        }
    };

    // This is the main UI for the Services screen
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Services</Text>

            {/* Input for the service name */}
            <TextInput
                style={styles.input}
                placeholder="Service Name"
                value={serviceName}
                onChangeText={setServiceName}
            />

            {/* Input for the service price */}
            <TextInput
                style={styles.input}
                placeholder="Price (in ₹)"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
            />

            {/* Input for the service duration */}
            <TextInput
                style={styles.input}
                placeholder="Duration (e.g. 30 mins)"
                value={duration}
                onChangeText={setDuration}
            />

            {/* Button to add the new service */}
            <View style={styles.button}>
                <Button title="Add Service" onPress={handleAddService} color={Colors.PRIMARY} />
            </View>

            {/* List of all services for this business (uses a separate component) */}
            <BusinessServices business={business} owner={true} refreshData={refreshData} />
        </View>
    );
}

// These are the styles for how everything looks on the screen
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,            // Add border
        borderColor: '#ccc',       // Light grey border color
        borderRadius: 8,           // Rounded corners
        padding: 12,               // Inner padding
        marginBottom: 15,          // Space between inputs
        fontSize: 16,
    },
    button: {
        marginTop: 20,
    },

});