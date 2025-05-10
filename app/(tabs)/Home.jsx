import { View, Text, Platform, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import Slider from '../../components/Slider'
import HomeHeader from '../../components/HomeHeader'
import BusinessListHome from '../../components/BusinessListHome'
import FollowedBarbersList from '../../components/FollowedBarbersList'
import Colors from '../../services/Colors'
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Notification01Icon } from '@hugeicons/core-free-icons';
import { useRouter } from 'expo-router';

// This is the main Home screen for users (clients)
// It shows a header, a slider, followed barbers, and lists of top-rated and popular barbershops
export default function Home() {
    // This function shows the Home screen for users.
    // It displays a greeting, a slider, followed barbers, and lists of top-rated and popular barbershops.
    // The Notification button lets users see their notifications.
    // Used to navigate between screens
    const router = useRouter();

    // This is the main UI for the Home screen
    return (
        <ScrollView 
            style={{
                flex: 1,
                backgroundColor: Colors.WHITE
            }}
            showsVerticalScrollIndicator={false}
        >
        <View style={{
            paddingTop: Platform.OS == 'ios' ? 55 : 30,
            padding: 20
        }}>
            {/* Button to open the Notification Center */}
            <TouchableOpacity 
                onPress={() => router.push('/NotificationCenter')}
                style={{ alignSelf: 'flex-end', marginBottom: 10 }}
            >
                <HugeiconsIcon icon={Notification01Icon} />
            </TouchableOpacity>
            {/* Header with user greeting and info */}
            <HomeHeader />
            {/* Slider with featured images or promotions */}
            <Slider />
            {/* List of barbershops the user follows */}
            <FollowedBarbersList />
            {/* List of highest rated barbershops */}
            <BusinessListHome premium={true} title="Highest Rated" />
            {/* List of most popular barbershops */}
            <BusinessListHome premium={true} title="Popular" />
        </View>
        </ScrollView>
    )
}