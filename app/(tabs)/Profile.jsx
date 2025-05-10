import { View, Text, FlatList, TouchableOpacity, Image, Platform } from 'react-native'
import React, { useContext } from 'react'
import { UserDetailContext } from '../../context/UserDetailContext';
import { BookmarkMinusIcon, LogInIcon, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '../../services/Colors';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/FirebaseConfig';

// This screen shows the user's profile information and navigation options
// Users can view their bookings, explore, or log out
export default function Profile() {
    // List of options to show in the profile (bookings, explore, logout)
    const options = [
        {
            name: 'My Booking',
            icon: BookmarkMinusIcon,
            path: '/(tabs)/Booking'
        },
        {
            name: 'Explore',
            icon: Search,
            path: '/(tabs)/Explore'
        },
        {
            name: 'Logout',
            icon: LogInIcon,
            path: 'logout'
        }
    ]
    // Get the current logged-in user's details from context
    const { userDetail, setUserDetail } = useContext(UserDetailContext);
    // Used to navigate between screens
    const router = useRouter();

    // This function is called when the user taps one of the options (like My Booking, Explore, or Logout).
    // If the user chooses Logout, it signs them out and sends them to the landing page.
    // If they choose another option, it takes them to that screen.
    const onOptionClick = async (option) => {
        if (option.path == 'logout') {
            // If the user chooses to log out
            await signOut(auth).then(() => {
                // Sign-out successful.
                setUserDetail(null)
                router.push('/landing');
                return;
            }).catch((error) => {
                // An error happened.
            });
        } else {
            // Navigate to the selected screen
            router.push(option.path)
        }
    }
    // This is the main UI for the Profile screen
    return (
        <View style={{
            height: '100%',
            backgroundColor: Colors.WHITE,
            paddingTop: Platform.OS == 'ios' ? 55 : 30,
            padding: 20
        }}>
            <Text style={{
                fontFamily: 'outfit-bold',
                fontSize: 30
            }}>Profile</Text>

            {/* User's profile picture and info */}
            <View style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: 20
            }}>
                <Image source={{ uri: userDetail?.picture ?? 'https://media.istockphoto.com/id/1337144146/vector/default-avatar-profile-icon-vector.jpg?s=612x612&w=0&k=20&c=BIbFwuv7FxTWvh5S3vB6bkT0Qv8Vn8N5Ffseq84ClGI=' }}
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 99
                    }}
                />
                <Text style={{
                    fontFamily: 'outfit-bold',
                    fontSize: 25,
                    marginTop: 20
                }}>{userDetail?.name}</Text>
                <Text style={{
                    fontFamily: 'outfit',
                    fontSize: 17,
                    color: Colors.GRAY
                }}>{userDetail?.email}</Text>
            </View>

            {/* List of profile options (bookings, explore, logout) */}
            <FlatList
                data={options}
                style={{
                    marginTop: 25
                }}
                renderItem={({ item, index }) => (
                    <TouchableOpacity onPress={() => onOptionClick(item)}
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 15,
                            padding: 20,
                        }}>
                        <item.icon size={30} style={{
                            color: Colors.PRIMARY,
                        }} />
                        <Text style={{
                            fontFamily: 'outfit',
                            fontSize: 20
                        }}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    )
}