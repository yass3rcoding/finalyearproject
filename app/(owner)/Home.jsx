import { View, Text, Platform, FlatList, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { collection, doc, getDocs, query, updateDoc, where, addDoc } from 'firebase/firestore';
import { auth, db } from '../../services/FirebaseConfig';
import { UserDetailContext } from '../../context/UserDetailContext';
import { BusinessDetailContext } from '../../context/BusinessDetailContext';
import moment from 'moment';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Clock01FreeIcons, Logout01Icon, Logout03Icon, Notification01Icon } from '@hugeicons/core-free-icons';
import Colors from './../../services/Colors';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';

// This is the main Home screen for business owners (barbershop owners/barbers)
// It shows today's appointments, lets you confirm/cancel/complete them, and navigate to notifications or past bookings
export default function Home() {
    // Get the current logged-in user's details from context (like their email)
    const { userDetail } = useContext(UserDetailContext);
    // Get the current business info from context (like the business id)
    const { business, setBusiness } = useContext(BusinessDetailContext);
    // This will store all the appointments for the selected date
    const [appointment, setAppointment] = useState([]);
    // This keeps track of which date is selected on the calendar
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    // This stores which dates have bookings (for calendar dots)
    const [markedDates, setMarkedDates] = useState({});
    // Used to navigate between screens
    const router = useRouter();

    // When the user logs in, if we don't have business info yet, fetch it from the database
    useEffect(() => {
        userDetail && !business && GetBusiness();
    }, [userDetail]);

    // This function fetches the business info for the logged-in user from the database
    const GetBusiness = async () => {
        const q = query(collection(db, "salon_business"), where("email", "==", userDetail?.email));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            setBusiness(doc.data()); // Save the business info in context
        });
    };

    // When the business info is available, fetch today's appointments
    useEffect(() => {
        business && GetAppointment();
    }, [business]);

    // This function fetches all appointments for the selected date
    // It also marks the calendar with dots for dates that have bookings
    const GetAppointment = async () => {
        setAppointment([]); // Clear previous appointments
        const q = query(
            collection(db, "salon_booking"),
            where("businessId", "==", business?.id)
        );
        const querySnapshot = await getDocs(q);
        const datesWithBookings = {};
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const bookingDate = data.date;
            
            // Mark dates with bookings (for calendar dots)
            if (!datesWithBookings[bookingDate]) {
                datesWithBookings[bookingDate] = {
                    marked: true,
                    dotColor: Colors.PRIMARY,
                    selected: bookingDate === selectedDate
                };
            }

            // Add booking to appointments if it's for the selected date and not completed/cancelled
            if (
                bookingDate === selectedDate &&
                (data.status === 'Pending' || data.status === 'Confirmed')
            ) {
                setAppointment(prev => [...prev, { ...data, id: doc.id }]);
            }
        });

        // Add today's date if it has no bookings (so it still shows as selected)
        if (!datesWithBookings[selectedDate]) {
            datesWithBookings[selectedDate] = {
                selected: true,
                selectedColor: Colors.PRIMARY
            };
        }

        setMarkedDates(datesWithBookings); // Update calendar dots
    };

    // When a day is pressed on the calendar, update the selected date and fetch appointments for that day
    const onDayPress = (day) => {
        setSelectedDate(day.dateString);
        GetAppointment();
    };

    // When the barber marks an appointment as completed
    // This updates the booking status, sends a notification to the user, and refreshes the list
    const onAppointmentConfirm = async (docId) => {
        await updateDoc(doc(db, 'salon_booking', docId), {
            status: 'Completed'
        });
        // Fetch booking to get user email and details
        const bookingSnap = await getDocs(query(collection(db, 'salon_booking'), where('id', '==', docId)));
        if (!bookingSnap.empty) {
            const booking = bookingSnap.docs[0].data();
            // Fetch business to get shop name
            const businessSnap = await getDocs(query(collection(db, 'salon_business'), where('id', '==', booking.businessId)));
            let shopName = '';
            if (!businessSnap.empty) {
                shopName = businessSnap.docs[0].data().name;
            }
            // Add a notification for the user
            await addDoc(collection(db, 'notifications'), {
                userId: booking.email,
                type: 'completed',
                message: `Your booking at ${shopName} with ${booking.barberName} for ${booking.services ? booking.services.map(s => s.name).join(', ') : booking.service} has been marked as completed!`,
                timestamp: Date.now(),
                read: false,
                bookingId: docId
            });
        }
        Alert.alert('Completed!', 'Appointment marked as completed!');
        GetAppointment(); // Refresh the list
    }

    // When the barber confirms a pending appointment
    // This updates the booking status, sends a notification to the user, and refreshes the list
    const onAppointmentBarberConfirm = async (docId) => {
        await updateDoc(doc(db, 'salon_booking', docId), {
            status: 'Confirmed'
        });
        // Fetch booking to get user email and details
        const bookingSnap = await getDocs(query(collection(db, 'salon_booking'), where('id', '==', docId)));
        if (!bookingSnap.empty) {
            const booking = bookingSnap.docs[0].data();
            // Add a notification for the user
            await addDoc(collection(db, 'notifications'), {
                userId: booking.email,
                type: 'confirmed',
                message: `Your booking for ${booking.services ? booking.services.map(s => s.name).join(', ') : booking.service} on ${booking.date} at ${booking.time} has been confirmed!`,
                timestamp: Date.now(),
                read: false,
                bookingId: docId
            });
        }
        Alert.alert('Confirmed!', 'Booking has been confirmed!');
        GetAppointment(); // Refresh the list
    }

    // When the barber cancels an appointment
    // This updates the booking status, sends a notification to the user, and refreshes the list
    const onAppointmentCancel = async (docId) => {
        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking?",
            [
                {
                    text: "No",
                    style: "cancel"
                },
                {
                    text: "Yes, Cancel",
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'salon_booking', docId), {
                                status: 'Cancelled',
                                cancelledBy: 'barber',
                                cancelledAt: new Date().toISOString()
                            });
                            // Fetch booking to get user email and details
                            const bookingSnap = await getDocs(query(collection(db, 'salon_booking'), where('id', '==', docId)));
                            if (!bookingSnap.empty) {
                                const booking = bookingSnap.docs[0].data();
                                // Fetch business to get shop name
                                const businessSnap = await getDocs(query(collection(db, 'salon_business'), where('id', '==', booking.businessId)));
                                let shopName = '';
                                if (!businessSnap.empty) {
                                    shopName = businessSnap.docs[0].data().name;
                                }
                                // Add a notification for the user
                                await addDoc(collection(db, 'notifications'), {
                                    userId: booking.email,
                                    type: 'cancelled',
                                    message: `Your booking at ${shopName} with ${booking.barberName} for ${booking.services ? booking.services.map(s => s.name).join(', ') : booking.service} has been cancelled by the barber shop.`,
                                    timestamp: Date.now(),
                                    read: false,
                                    bookingId: docId
                                });
                            }
                            Alert.alert('Cancelled!', 'Booking has been cancelled.');
                            GetAppointment(); // Refresh the list
                        } catch (error) {
                            console.log("Error cancelling booking:", error);
                            Alert.alert("Error", "Failed to cancel booking. Please try again.");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    }

    // This is the main UI for the Home screen
    return (
        <View style={styles.container}>
            {/* Header with title and action buttons */}
            <View style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Text style={styles.heading}>Appointment</Text>
                <View style={{ flexDirection: 'row', gap: 15 }}>
                    {/* Button to go to Notification Center */}
                    <TouchableOpacity 
                        onPress={() => router.push('/OwnerScreens/NotificationCenter')}
                        style={{ marginRight: 5 }}
                    >
                        <HugeiconsIcon icon={Notification01Icon} />
                    </TouchableOpacity>
                    {/* Button to go to Past Bookings */}
                    <TouchableOpacity 
                        onPress={() => router.push('/past-bookings')}
                        style={styles.pastBookingsButton}
                    >
                        <Text style={styles.pastBookingsText}>Past Bookings</Text>
                    </TouchableOpacity>
                    {/* Button to log out */}
                    <TouchableOpacity onPress={async () => {
                        await signOut(auth)
                        router.replace('/')
                    }}>
                        <HugeiconsIcon icon={Logout03Icon} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Calendar to select a date and see bookings for that day */}
            <Calendar
                onDayPress={onDayPress}
                markedDates={markedDates}
                theme={{
                    todayTextColor: Colors.PRIMARY,
                    selectedDayBackgroundColor: Colors.PRIMARY,
                    dotColor: Colors.PRIMARY,
                    arrowColor: Colors.PRIMARY,
                }}
                style={styles.calendar}
            />

            {/* Shows which date's bookings are being displayed */}
            <Text style={styles.dateHeading}>
                Bookings for {moment(selectedDate).format('MMMM D, YYYY')}
            </Text>

            {/* List of appointments for the selected date */}
            <FlatList
                data={appointment}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
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
                                {/* Service booked (single service for this view) */}
                                <Text style={styles.service}>Service: {item?.service}</Text>
                                {/* Name of the barber */}
                                <Text style={styles.barber}>Barber: {item?.barberName}</Text>
                                {/* Status of the booking (Pending, Confirmed, Completed, Cancelled) */}
                                <Text style={[
                                    styles.status,
                                    item?.status === 'Completed' && { backgroundColor: Colors.GARY },
                                    item?.status === 'Cancelled' && { backgroundColor: '#dc3545' },
                                    item?.status === 'Confirmed' && { backgroundColor: Colors.GREEN }
                                ]}>{item?.status}</Text>
                            </View>
                            <View>
                                {/* Time of the booking */}
                                <View style={styles.timeRow}>
                                    <HugeiconsIcon icon={Clock01FreeIcons} />
                                    <Text style={styles.timeText}>{item?.time}</Text>
                                </View>
                                {/* If the booking is pending, show Confirm and Cancel buttons */}
                                {item?.status === 'Pending' && (
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity 
                                            style={[styles.button, { backgroundColor: Colors.GREEN }]} 
                                            onPress={() => onAppointmentBarberConfirm(item?.id)}
                                        >
                                            <Text style={styles.buttonText}>Confirm</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.button, { backgroundColor: '#dc3545' }]} 
                                            onPress={() => onAppointmentCancel(item?.id)}
                                        >
                                            <Text style={styles.buttonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {/* If the booking is confirmed, show Complete and Cancel buttons */}
                                {item?.status === 'Confirmed' && (
                                    <View style={styles.buttonContainer}>
                                        <TouchableOpacity 
                                            style={styles.button} 
                                            onPress={() => onAppointmentConfirm(item?.id)}
                                        >
                                            <Text style={styles.buttonText}>Complete</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.button, { backgroundColor: '#dc3545' }]} 
                                            onPress={() => onAppointmentCancel(item?.id)}
                                        >
                                            <Text style={styles.buttonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                )}
            />

            {/* If there are no bookings for the selected date, show a message */}
            {appointment?.length == 0 &&
                <Text style={styles.noBookingsText}>
                    No Bookings for {moment(selectedDate).format('MMMM D, YYYY')}
                </Text>
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
    calendar: {
        marginVertical: 20,
        borderRadius: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    dateHeading: {
        fontSize: 18,
        fontFamily: 'outfit-bold',
        marginBottom: 15,
        color: Colors.GARY,
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
    button: {
        padding: 10,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 10,
        marginTop: 5,
        minWidth: 80,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    buttonText: {
        color: Colors.WHITE,
        textAlign: 'center'
    },
    pastBookingsButton: {
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    pastBookingsText: {
        color: Colors.WHITE,
        fontFamily: 'outfit',
        fontSize: 14,
    },
    noBookingsText: {
        padding: 20,
        backgroundColor: Colors.WHITE,
        borderRadius: 15,
        marginTop: 10,
        textAlign: 'center',
        fontFamily: 'outfit',
        color: Colors.GARY,
    },
});
