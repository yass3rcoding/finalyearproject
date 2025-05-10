import { View, Text, Platform, FlatList, Image, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useContext, useEffect, useState, useCallback } from 'react'
import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/FirebaseConfig';
import { UserDetailContext } from '../../context/UserDetailContext';
import { BusinessDetailContext } from '../../context/BusinessDetailContext';
import moment from 'moment';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Clock01FreeIcons } from '@hugeicons/core-free-icons';
import Colors from './../../services/Colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// This screen shows all the past bookings (appointments that are completed or cancelled) for the business owner.
// It fetches the data from the database and displays it in a list.
export default function PastBookings() {
    // Get the current logged-in user's details from context (like their email)
    const { userDetail } = useContext(UserDetailContext);
    // Get the current business info from context (like the business id)
    const { business } = useContext(BusinessDetailContext);
    // This will store all the past appointments we fetch from the database
    const [appointment, setAppointment] = useState([]);
    // This keeps track of whether we are still loading data
    const [loading, setLoading] = useState(true);
    // This is used to navigate between screens
    const router = useRouter();

    // This function fetches all past appointments for the business from the database
    // It only fetches bookings that are either 'Completed' or 'Cancelled'
    const GetPastAppointments = async () => {
        // If we don't have a business id yet, show loading
        if (!business?.id) {
            setLoading(true);
            return;
        }
        setLoading(true); // Start loading
        setAppointment([]) // Clear any previous data
        try {
            // Create a query to get all bookings for this business
            const q = query(
                collection(db, "salon_booking"),
                where("businessId", "==", business.id)
            );
            // Run the query and get the results
            const querySnapshot = await getDocs(q);
            // Go through each booking
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Only add bookings that are completed or cancelled
                if (data.status === 'Completed' || data.status === 'Cancelled') {
                    // Add this booking to our list
                    setAppointment(prev => [...prev, { ...data, id: doc.id }]);
                }
            });
        } catch (error) {
            // If something goes wrong, print an error
            console.log('Error fetching past bookings:', error);
        }
        setLoading(false); // Done loading
    };

    // This runs once when the screen first loads, just for debugging
    useEffect(() => {
        console.log('PastBookings mounted. Business context:', business);
    }, []);

    // This runs whenever the business info changes (like after login)
    // It will fetch the past appointments again
    useEffect(() => {
        if (business?.id) {
            GetPastAppointments();
        }
    }, [business]);

    // This runs every time you come back to this screen (like switching tabs)
    // It makes sure the data is always up to date
    useFocusEffect(
        useCallback(() => {
            if (business?.id) {
                console.log('Tab focused. Refetching past bookings. Business:', business);
                GetPastAppointments();
            }
        }, [business])
    );

    // If we don't have business info yet, show a loading spinner and message
    if (!business?.id) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={{ marginTop: 10 }}>Waiting for business context...</Text>
            </View>
        );
    }
    // If we are still loading the bookings, show a loading spinner and message
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={{ marginTop: 10 }}>Loading past bookings...</Text>
            </View>
        );
    }

    // This is the main part of the screen that shows the list of past bookings
    return (
        <View style={styles.container}>
            {/* This is the header with a back button and the title */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20
            }}>
                {/* Back button to go to the previous screen */}
                <TouchableOpacity 
                    onPress={() => router.back()}
                    style={{
                        marginRight: 15
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                {/* Title of the screen */}
                <Text style={styles.heading}>Past Bookings</Text>
            </View>

            {/* This shows the list of all past bookings using FlatList */}
            <FlatList
                data={appointment} // The data to show
                keyExtractor={(_, index) => index.toString()} // Unique key for each item
                renderItem={({ item }) => (
                    // This is how each booking card looks
                    <View style={styles.card}>
                        {/* Avatar image for the booking (static image) */}
                        <Image
                            source={{ uri: 'https://t3.ftcdn.net/jpg/06/99/46/60/360_F_699466075_DaPTBNlNQTOwwjkOiFEoOvzDV0ByXR9E.jpg' }}
                            style={styles.avatar}
                        />
                        {/* The main content of the card */}
                        <View style={styles.cardContent}>
                            <View style={styles.textInfo}>
                                {/* Name of the customer */}
                                <Text style={styles.name}>{item?.name}</Text>
                                {/* Services booked (can be multiple or single) */}
                                <Text style={styles.service}>Service: {item?.services ? item.services.map(s => s.name).join(', ') : item?.service}</Text>
                                {/* Name of the barber */}
                                <Text style={styles.barber}>Barber: {item?.barberName}</Text>
                                {/* Status of the booking (Completed or Cancelled) */}
                                <Text style={[
                                    styles.status,
                                    item?.status === 'Completed' && { backgroundColor: Colors.GARY },
                                    item?.status === 'Cancelled' && { backgroundColor: '#dc3545' }
                                ]}>{item?.status}</Text>
                            </View>
                            <View>
                                {/* Time of the booking */}
                                <View style={styles.timeRow}>
                                    <HugeiconsIcon icon={Clock01FreeIcons} />
                                    <Text style={styles.timeText}>{item?.time}</Text>
                                </View>
                                {/* If there is a review, show the rating and comment */}
                                {item?.review && (
                                    <View style={styles.reviewContainer}>
                                        <Text style={styles.reviewText}>⭐ {item.review.rating}/5</Text>
                                        {item.review.comment && (
                                            <Text style={styles.reviewComment}>{item.review.comment}</Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                )}
            />

            {/* If there are no past bookings, show a message */}
            {appointment?.length == 0 &&
                <Text style={{
                    padding: 20,
                    backgroundColor: Colors.WHITE,
                    borderRadius: 15,
                    marginTop: 10
                }}>No Past Bookings Found</Text>
            }
        </View>
    );
}

// These are the styles for how everything looks on the screen
const styles = StyleSheet.create({
    container: {
        paddingTop: Platform.OS === 'ios' ? 55 : 30,
        padding: 20,
    },
    heading: {
        fontFamily: 'outfit-bold',
        fontSize: 25,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 15,
        backgroundColor: 'white',
        marginTop: 10,
        borderRadius: 15,
        width: '100%',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 99,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        flex: 1,
    },
    textInfo: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'outfit',
    },
    service: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.GARY,
        fontFamily: 'outfit',
        marginTop: 2,
    },
    barber: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.GARY,
        fontFamily: 'outfit',
        marginTop: 2,
    },
    status: {
        backgroundColor: Colors.PRIMARY,
        color: Colors.WHITE,
        paddingVertical: 2,
        paddingHorizontal: 7,
        borderRadius: 8,
        width: 90,
        marginTop: 6,
        textAlign: 'center',
        fontFamily: 'outfit',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontFamily: 'outfit',
        marginLeft: 4,
    },
    reviewContainer: {
        marginTop: 5,
        backgroundColor: '#f8f9fa',
        padding: 8,
        borderRadius: 8,
    },
    reviewText: {
        fontFamily: 'outfit',
        color: Colors.GARY,
    },
    reviewComment: {
        fontFamily: 'outfit',
        color: Colors.GARY,
        fontSize: 12,
        marginTop: 4,
    },
}); 