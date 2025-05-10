import { Tabs } from 'expo-router'
import { Calendar, Home, Search, User, User2, FlaskConical, Newspaper } from 'lucide-react-native'
import React from 'react'

// This component sets up the bottom tab navigation for the main user app
// Each tab is a different screen (Home, Explore, Feed, Booking, Profile, TestBarberPost)
function TabLayout() {
    return (
        <Tabs screenOptions={{
            headerShown: false // Hide the header at the top of each tab
        }}>
            {/* Home tab with a house icon */}
            <Tabs.Screen name='Home'
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
                }}
            />
            {/* Explore tab with a search icon */}
            <Tabs.Screen name='Explore'
                options={{
                    tabBarIcon: ({ color, size }) => <Search color={color} size={size} />
                }} />
            {/* Feed tab with a newspaper icon */}
            <Tabs.Screen name='Feed'
                options={{
                    tabBarLabel: 'Feed',
                    tabBarIcon: ({ color, size }) => <Newspaper color={color} size={size} />
                }} />
            {/* Booking tab with a calendar icon */}
            <Tabs.Screen name='Booking'
                options={{
                    tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />
                }} />
            {/* Profile tab with a user icon */}
            <Tabs.Screen name='Profile'
                options={{
                    tabBarIcon: ({ color, size }) => <User2 color={color} size={size} />
                }} />
            {/* TestBarberPost tab with a flask icon (for testing post creation) */}
            <Tabs.Screen name='TestBarberPost'
                options={{
                    tabBarLabel: 'Test Post',
                    tabBarIcon: ({ color, size }) => <FlaskConical color={color} size={size} />
                }} />
        </Tabs>
    )
}

export default TabLayout