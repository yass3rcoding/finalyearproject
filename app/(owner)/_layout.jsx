import { Tabs } from 'expo-router'
import { Home, Briefcase, Drama, Images, NotepadText, FlaskConical } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { BusinessDetailContext } from './../../context/BusinessDetailContext'
import { UserDetailContext } from '../../context/UserDetailContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../services/FirebaseConfig'
import { ActivityIndicator, View } from 'react-native'

export default function BusinessOwnerLayout() {
    const [business, setBusiness] = useState(null);
    const { userDetail } = React.useContext(UserDetailContext);

    useEffect(() => {
        const fetchBusinessData = async () => {
            if (userDetail?.email) {
                try {
                    const q = query(collection(db, 'salon_business'), where('email', '==', userDetail.email));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const businessData = querySnapshot.docs[0].data();
                        setBusiness(businessData);
                        console.log('BusinessOwnerLayout: business context set:', businessData);
                    } else {
                        console.log('BusinessOwnerLayout: No business found for email', userDetail.email);
                    }
                } catch (error) {
                    console.error("Error fetching business data:", error);
                }
            } else {
                console.log('BusinessOwnerLayout: No userDetail.email');
            }
        };

        fetchBusinessData();
    }, [userDetail]);

    return (
        <BusinessDetailContext.Provider value={{ business, setBusiness }}>
            {business ? (
                <Tabs screenOptions={{
                    headerShown: false,
                    animation: 'none',
                    freezeOnBlur: true,
                    lazy: true
                }}>
                    <Tabs.Screen name='Home'
                        options={{
                            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                        }}
                    />
                    <Tabs.Screen name='Posts'
                        options={{
                            tabBarIcon: ({ color, size }) => <NotepadText color={color} size={size} />
                        }}
                    />
                    <Tabs.Screen name='Services'
                        options={{
                            tabBarIcon: ({ color, size }) => <Drama color={color} size={size} />
                        }}
                    />
                    <Tabs.Screen name='BusinessInfo'
                        options={{
                            tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size} />
                        }}
                    />
                    <Tabs.Screen name='Gallery'
                        options={{
                            tabBarIcon: ({ color, size }) => <Images color={color} size={size} />
                        }}
                    />
                    <Tabs.Screen name='TestBarberPost'
                        options={{
                            tabBarLabel: 'Create Post',
                            tabBarIcon: ({ color, size }) => <FlaskConical color={color} size={size} />
                        }}
                    />
                </Tabs>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                    <ActivityIndicator size="large" color="#000" />
                </View>
            )}
        </BusinessDetailContext.Provider>
    )
}