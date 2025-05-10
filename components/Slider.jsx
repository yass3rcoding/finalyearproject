import { View, Text, FlatList, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/FirebaseConfig';

// This component shows a horizontal slider of images (like promotions or featured content) on the Home screen.
// It gets the images from the database and displays them in a scrollable row.
export default function Slider() {

    const [sliderList, setSliderList] = useState([]);
    // This function runs when the component loads.
    // It gets all slider images from the database and puts them in the slider list.
    useEffect(() => {
        GetSliders();
    }, [])

    // This function runs when the component loads.
    // It gets all slider images from the database and puts them in the slider list.
    const GetSliders = async () => {
        console.log("HERE...")
        setSliderList([]);
        const querySnapshot = await getDocs(collection(db, "salon_sliders"));
        querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            console.log(doc.id, " => ", doc.data());
            setSliderList(prev => [...prev, doc.data()])
        });

    }

    return (
        <View style={{
            marginTop: 15
        }}>
            <FlatList
                data={sliderList}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <View key={index}>
                        <Image source={{ uri: item?.image }} style={{
                            width: 300,
                            height: 160,
                            objectFit: 'cover',
                            borderRadius: 20,
                            marginRight: 15
                        }} />

                    </View>
                )}
            />
        </View>
    )
}