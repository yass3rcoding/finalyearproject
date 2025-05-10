import { View, Text, Platform, FlatList, TouchableOpacity } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { UserDetailContext } from '../context/UserDetailContext';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/FirebaseConfig';
import BookingCard from '../components/BookingCard';
import Colors from '../services/Colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PastBookings() {
    const { userDetail } = useContext(UserDetailContext)
    const [bookingList, setBookingList] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const router = useRouter();

    const GetPastBookings = async () => {
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
            
            // Filter only completed and cancelled bookings
            const pastBookings = bookings.filter(booking => 
                booking.status === 'Completed' || booking.status === 'Cancelled'
            );
            
            setBookingList(pastBookings);
        } catch (error) {
            console.log("Error fetching past bookings:", error);
        }
    }

    const refreshBookings = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        GetPastBookings();
    }, [refreshKey, userDetail]);

    return (
        <View style={{
            paddingTop: Platform.OS == 'ios' ? 55 : 30,
            padding: 20
        }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20
            }}>
                <TouchableOpacity 
                    onPress={() => router.back()}
                    style={{
                        marginRight: 15
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <Text style={{
                    fontFamily: 'outfit',
                    fontSize: 25
                }}>Past Bookings</Text>
            </View>

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
                        No past bookings found
                    </Text>
                )}
            />
        </View>
    )
} 