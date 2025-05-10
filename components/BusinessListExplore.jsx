import { View, Text, FlatList, Image, TouchableOpacity, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/FirebaseConfig';
import Colors from '../services/Colors';
import { useRouter } from 'expo-router';

// This component shows a list of all barbershops/businesses for users to explore.
// Users can search for a business by name, and tap on a business to see more details or book.
function BusinessListExplore({ title = '' }) {
    const [businessList, setBusinessList] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filteredList, setFilteredList] = useState([]);
    const router = useRouter();

    useEffect(() => {
        GetBusiness();
    }, []);

    useEffect(() => {
        if (searchText.trim() === '') {
            setFilteredList(businessList);
        } else {
            const filtered = businessList.filter((item) =>
                item?.name?.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredList(filtered);
        }
    }, [searchText, businessList]);

    // This function runs when the component loads.
    // It gets all businesses from the database and puts them in the list.
    const GetBusiness = async () => {
        const querySnapshot = await getDocs(collection(db, "salon_business"));
        const businessData = [];
        querySnapshot.forEach((doc) => {
            businessData.push(doc.data());
        });
        setBusinessList(businessData);
        setFilteredList(businessData);
    }

    return (
        <View style={{ marginTop: 15 }}>
            <TextInput
                placeholder='Search'
                value={searchText}
                onChangeText={setSearchText}
                style={{
                    backgroundColor: Colors.WHITE,
                    padding: 12,
                    borderRadius: 8
                }}
            />

            <FlatList
                data={filteredList}
                keyExtractor={(_, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                style={{ marginTop: 15 }}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        key={index}
                        style={{
                            flex: 1,
                            backgroundColor: Colors.WHITE,
                            padding: 10,
                            marginBottom: 15,
                            borderRadius: 15,
                        }}
                        onPress={() => router.push({
                            pathname: '/business-detail',
                            params: {
                                business: JSON.stringify(item)
                            }
                        })}
                    >
                        <Image source={{ uri: item?.banner }} style={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            borderRadius: 10,
                            marginRight: 15
                        }} />

                        <Text style={{
                            marginTop: 5,
                            fontFamily: 'outfit',
                            fontSize: 18
                        }}>{item?.name}</Text>
                        <Text style={{
                            marginTop: 2,
                            fontFamily: 'outfit',
                            fontSize: 16,
                            color: Colors.GARY
                        }}>{item?.address}</Text>

                        <View style={{
                            marginTop: 3,
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
                                    fontSize: 14,
                                    fontFamily: 'outfit'
                                }}>Book</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

export default BusinessListExplore;
