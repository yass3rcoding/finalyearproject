import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState, useContext } from 'react'
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/FirebaseConfig';
import Colors from '../services/Colors';
import { useRouter } from 'expo-router';
import { UserDetailContext } from '../context/UserDetailContext';

// This component shows a horizontal list of barbershops or barbers the user follows.
// It updates in real-time and lets users tap to see more details or book.
export default function FollowedBarbersList() {
    const [followedBarbers, setFollowedBarbers] = useState([]);
    const { userDetail } = useContext(UserDetailContext);
    const router = useRouter();

    // This function runs when the component loads and whenever the user changes.
    // It listens for changes in the user's followed barbers and updates the list in real-time.
    // For each followed barber, it gets the business details from the database.
    useEffect(() => {
        if (userDetail?.email) {
            // Set up real-time listener for follows
            const followsRef = collection(db, "salon_follows");
            const q = query(followsRef, where("userEmail", "==", userDetail.email));
            
            const unsubscribe = onSnapshot(q, async (snapshot) => {
                const barbers = [];
                for (const doc of snapshot.docs) {
                    const follow = doc.data();
                    // Get business details for each followed barber
                    const businessRef = collection(db, "salon_business");
                    const businessQuery = query(businessRef, where("id", "==", follow.businessId));
                    const businessSnapshot = await getDocs(businessQuery);
                    
                    if (!businessSnapshot.empty) {
                        const business = businessSnapshot.docs[0].data();
                        // Use the rating field from the business document
                        const updatedBusiness = {
                            ...business,
                            barberName: follow.barberName,
                            rating: business.rating || "0.0"
                        };
                        barbers.push(updatedBusiness);
                    }
                }
                setFollowedBarbers(barbers);
            });

            // Cleanup listener on unmount
            return () => unsubscribe();
        }
    }, [userDetail]);

    // Only return null if user is not logged in
    if (!userDetail?.email) {
        return null;
    }

    return (
        <View style={{
            marginTop: 15
        }}>
            <Text style={{
                fontSize: 17,
                fontFamily: 'outfit',
                marginBottom: 6
            }}>Followed Barbers</Text>
            {followedBarbers.length > 0 ? (
                <FlatList
                    data={followedBarbers}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            onPress={() => router.push({
                                pathname: '/business-detail',
                                params: {
                                    business: JSON.stringify(item)
                                }
                            })}
                            key={index} style={{
                                flex: 1,
                                backgroundColor: Colors.WHITE,
                                padding: 10,
                                marginRight: 15,
                                borderRadius: 15,
                                width: 220
                            }}>
                            <Image source={{ uri: item?.banner }} style={{
                                width: 200,
                                height: 120,
                                objectFit: 'cover',
                                borderRadius: 10,
                                marginRight: 15
                            }} />

                            <Text style={{
                                marginTop: 5,
                                fontFamily: 'outfit',
                                fontSize: 16
                            }}>{item?.name}</Text>
                            <Text style={{
                                marginTop: 2,
                                fontFamily: 'outfit',
                                fontSize: 14,
                                color: Colors.GARY
                            }}>{item?.barberName}</Text>
                            <View style={{
                                marginTop: 3,
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingRight: 10
                            }}>
                                <Text>⭐ {item?.rating}</Text>
                                <TouchableOpacity style={{
                                    padding: 1,
                                    borderRadius: 99,
                                    borderWidth: 1,
                                    paddingBottom: 2,
                                    paddingHorizontal: 7
                                }}>
                                    <Text style={{
                                        fontSize: 12,
                                        fontFamily: 'outfit'
                                    }}>Book</Text>
                                </TouchableOpacity>
                            </View>

                        </TouchableOpacity>
                    )}
                />
            ) : (
                <View style={{
                    backgroundColor: Colors.WHITE,
                    padding: 15,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#e0e0e0'
                }}>
                    <Text style={{
                        fontFamily: 'outfit',
                        color: Colors.GARY,
                        textAlign: 'center'
                    }}>
                        You haven't followed any barbers yet. Visit a business page to follow your favorite barbers!
                    </Text>
                </View>
            )}
        </View>
    )
} 