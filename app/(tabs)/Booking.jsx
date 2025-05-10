import { View, Text, Platform, FlatList, TouchableOpacity } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { UserDetailContext } from '../../context/UserDetailContext';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/FirebaseConfig';
import BookingCard from '../../components/BookingCard';
import Colors from '../../services/Colors';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

// This screen shows all upcoming bookings for the user (or business owner)
// It also lets you view past bookings and sends reminders for upcoming bookings
export default function Booking() {
    // Get the current logged-in user's details from context
    const { userDetail } = useContext(UserDetailContext)
    // State to store the list of upcoming bookings
    const [bookingList, setBookingList] = useState([]);
    // State to trigger a refresh of the bookings list
    const [refreshKey, setRefreshKey] = useState(0);
    // Used to navigate between screens
    const router = useRouter();

    // This function gets all bookings for the user (or business owner) from the database.
    // It checks if the user is a business owner or a customer, then fetches the right bookings.
    // It also gets the business info for each booking and only keeps upcoming bookings.
    const GetBooking = async () => {
        try {
            const bookingRef = collection(db, "salon_booking");
            let q;
            
            if (userDetail?.isBusinessOwner) {
                // For barbers, get all bookings for their business
                q = query(bookingRef, where("businessId", "==", userDetail?.businessId));
            } else {
                // For customers, get their bookings
                q = query(bookingRef, where("email", "==", userDetail?.email));
            }
            
            const querySnapshot = await getDocs(q);
            
            const bookings = [];
            for (const document of querySnapshot.docs) {
                const docData = document.data();
                // Get the business info for each booking
                const docRef = doc(db, "salon_business", docData.businessId);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    bookings.push({
                        id: document.id,
                        ...docData,
                        business: docSnap.data()
                    });
                }
            }
            
            // Filter out completed and cancelled bookings
            const upcomingBookings = bookings.filter(booking => 
                booking.status !== 'Completed' && booking.status !== 'Cancelled'
            );
            
            setBookingList(upcomingBookings);
        } catch (error) {
            console.log("Error fetching bookings:", error);
        }
    }

    // This function refreshes the bookings list by changing a number in the state.
    // When this number changes, the app fetches the bookings again.
    const refreshBookings = () => {
        setRefreshKey(prev => prev + 1);
    };

    // This function runs automatically when the screen loads or when the user or refreshKey changes.
    // It calls GetBooking to fetch the latest bookings.
    useEffect(() => {
        GetBooking();
    }, [refreshKey, userDetail]);

    // This function runs automatically when the bookings list changes.
    // It schedules reminders (notifications) for bookings that are within the next 24 hours.
    useEffect(() => {
        // Schedule notifications for bookings within 24 hours
        const scheduleReminders = async () => {
            if (Platform.OS === 'web') return; // skip on web
            for (const booking of bookingList) {
                if (!booking.business || !booking.date || !booking.time) continue;
                // Parse booking date and time
                const bookingDateTime = new Date(`${booking.date}T${booking.time.replace(/ (AM|PM)/, '')}:00`);
                // Adjust for AM/PM
                let [hour, minute] = booking.time.split(/:| /);
                hour = parseInt(hour);
                minute = parseInt(minute);
                if (booking.time.includes('PM') && hour < 12) hour += 12;
                if (booking.time.includes('AM') && hour === 12) hour = 0;
                bookingDateTime.setHours(hour, minute, 0, 0);
                const now = new Date();
                const diff = bookingDateTime - now;
                if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: 'Booking Reminder',
                            body: `You have a booking at ${booking.business.name} with ${booking.barberName} for ${booking.services ? booking.services.map(s => s.name).join(', ') : booking.service} on ${booking.date} at ${booking.time}.`,
                        },
                        trigger: bookingDateTime,
                    });
                }
            }
        };
        scheduleReminders();
    }, [bookingList]);

    // This is the main UI for the Booking screen
    return (
        <View style={{
            paddingTop: Platform.OS == 'ios' ? 55 : 30,
            padding: 20
        }}>
            {/* Header with title and button to view past bookings */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20
            }}>
                <Text style={{
                    fontFamily: 'outfit',
                    fontSize: 25
                }}>Upcoming Bookings</Text>
                {/* Button to go to past bookings */}
                <TouchableOpacity 
                    onPress={() => router.push('/past-bookings')}
                    style={{
                        backgroundColor: Colors.PRIMARY,
                        padding: 10,
                        borderRadius: 8
                    }}
                >
                    <Text style={{ color: Colors.WHITE }}>View Past Bookings</Text>
                </TouchableOpacity>
            </View>

            {/* List of upcoming bookings */}
            <FlatList
                data={bookingList}
                renderItem={({ item }) => (
                    <BookingCard 
                        booking={item} 
                        onStatusUpdate={refreshBookings}
                    />
                )}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={() => (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: 'gray' }}>
                        No upcoming bookings found
                    </Text>
                )}
            />
        </View>
    )
}

