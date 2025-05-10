import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/FirebaseConfig';
import Colors from '../services/Colors';
import { useRouter } from 'expo-router';

// This component shows a horizontal list of top-rated or popular barbershops on the Home screen.
// Users can scroll through and tap a business to see more details or book.
export default function BusinessListHome({ premium = false, title }) {

    const [businessList, setBusinessList] = useState([]);
    const router = useRouter();

    // This function runs when the component loads.
    // It gets all businesses from the database, sorts them by rating, and puts them in the list.
    useEffect(() => {
        GetBusiness();
    }, [])

    const GetBusiness = async () => {
        try {
            setBusinessList([]);
            const querySnapshot = await getDocs(collection(db, "salon_business"));
            const businesses = [];
            
            // Get all businesses first
            querySnapshot.forEach((doc) => {
                const business = { id: doc.id, ...doc.data() };
                businesses.push(business);
            });
            
            // Sort businesses by rating in descending order using the business.rating field
            const sortedBusinesses = businesses.sort((a, b) => {
                return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
            });
            
            setBusinessList(sortedBusinesses);
        } catch (error) {
            console.error('Error fetching businesses:', error);
        }
    }

    return (
        <View style={{
            marginTop: 15
        }}>
            <Text style={{
                fontSize: 17,
                fontFamily: 'outfit',
                marginBottom: 6
            }}>{title}</Text>
            <FlatList
                data={businessList}
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
                        }}>{item?.address}</Text>
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
        </View>
    )
}