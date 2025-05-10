import { View, Text, Platform } from 'react-native'
import React from 'react'
import BusinessListExplore from '../../components/BusinessListExplore'
import { useRouter } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { MapPin } from 'lucide-react-native'

// This screen lets users explore a list of barbershops/businesses
// It also has a button to open the map view
export default function Explore() {
    // This function shows the Explore screen, where users can see a list of all barbershops/businesses.
    // It also has a button to open the map view so users can see businesses on a map.
    // The actual list is shown using the BusinessListExplore component below.
    // The map button uses the router to go to the MapExplore screen.
    // Used to navigate between screens
    const router = useRouter()
    return (
        <View style={{
            paddingTop: Platform.OS == 'ios' ? 55 : 30, // Add space for status bar (iOS/Android)
            padding: 20
        }}>
            {/* Header with title and map button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontFamily: 'outfit', fontSize: 25 }}>Explore</Text>
                {/* Button to open the map view */}
                <TouchableOpacity onPress={() => router.push('/MapExplore')} style={{ padding: 8 }}>
                    <MapPin color="#007bff" size={28} />
                </TouchableOpacity>
            </View>
            {/* List of all businesses to explore (uses a separate component) */}
            <BusinessListExplore />
        </View>
    )
}