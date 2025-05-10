import { View, Text, Image } from 'react-native'
import React, { useContext } from 'react'
import { UserDetailContext } from './../context/UserDetailContext'
import { Settings } from 'lucide-react-native'
import Colors from '../services/Colors'
const USER_IMAGE = 'https://cdn-icons-png.flaticon.com/128/3177/3177440.png'

// This component shows a greeting and the user's name at the top of the Home screen.
// It also shows a settings icon (not clickable here, but for future use).
export default function HomeHeader() {
    const { userDetail, setUserDetail } = useContext(UserDetailContext)

    return (
        <View style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <View style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10
            }}>
                <Image source={{ uri: USER_IMAGE }} style={{
                    width: 50,
                    height: 50,
                    borderRadius: 99
                }} />
                <View>
                    <Text>Hello,</Text>
                    <Text style={{
                        fontSize: 22,
                        fontFamily: 'outfit'
                    }}>{userDetail?.name}</Text>
                </View>
            </View>
            <Settings color={Colors.PRIMARY} size={30} />
        </View>
    )
}