import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/FirebaseConfig';
import { UserDetailContext } from '../context/UserDetailContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../services/Colors';

export default function NotificationCenter() {
    const { userDetail } = useContext(UserDetailContext);
    const [notifications, setNotifications] = useState([]);
    const router = useRouter();

    const fetchNotifications = async () => {
        if (!userDetail?.email) return;
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userDetail.email)
        );
        const querySnapshot = await getDocs(q);
        const notifs = [];
        querySnapshot.forEach((doc) => {
            notifs.push({ id: doc.id, ...doc.data() });
        });
        // Sort by timestamp descending
        notifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setNotifications(notifs);
    };

    useEffect(() => {
        fetchNotifications();
    }, [userDetail]);

    const deleteNotification = async (notifId) => {
        await deleteDoc(doc(db, 'notifications', notifId));
        fetchNotifications();
    };

    const clearAllNotifications = async () => {
        Alert.alert(
            'Clear All Notifications',
            'Are you sure you want to delete all notifications?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        for (const notif of notifications) {
                            await deleteDoc(doc(db, 'notifications', notif.id));
                        }
                        fetchNotifications();
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.heading}>Notifications</Text>
                <TouchableOpacity onPress={clearAllNotifications}>
                    <Ionicons name="trash" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
            </View>
            <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.notifCard}>
                        <Text style={styles.notifText}>{item.message}</Text>
                        <TouchableOpacity onPress={() => deleteNotification(item.id)}>
                            <Ionicons name="close-circle" size={22} color={Colors.GARY} />
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No notifications</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        paddingTop: Platform.OS === 'ios' ? 55 : 30,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    heading: {
        fontFamily: 'outfit-bold',
        fontSize: 25,
        flex: 1,
        textAlign: 'center',
    },
    notifCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    notifText: {
        fontFamily: 'outfit',
        fontSize: 16,
        flex: 1,
        marginRight: 10,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.GARY,
        marginTop: 40,
        fontFamily: 'outfit',
    },
}); 