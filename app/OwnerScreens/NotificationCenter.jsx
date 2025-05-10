import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/FirebaseConfig';
import { BusinessDetailContext } from '../../context/BusinessDetailContext';
import { UserDetailContext } from '../../context/UserDetailContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from './../../services/Colors';
import { useFocusEffect } from '@react-navigation/native';

console.log('Owner NotificationCenter component file loaded');

export default function NotificationCenter() {
    const businessContext = useContext(BusinessDetailContext);
    const { userDetail } = useContext(UserDetailContext);
    const [localBusiness, setLocalBusiness] = useState(null);
    const [fetchingBusiness, setFetchingBusiness] = useState(false);
    const business = businessContext?.business || localBusiness;
    const setBusiness = businessContext?.setBusiness;
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchNotifications = async () => {
        setLoading(true);
        let notifs = [];
        if (business?.id) {
            console.log('Fetching notifications with barberId:', business.id);
            const q = query(
                collection(db, 'notifications'),
                where('barberId', '==', business.id)
            );
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                notifs.push({ id: doc.id, ...doc.data() });
            });
        }
        if (notifs.length === 0 && business?.email) {
            console.log('Fallback: Fetching notifications with userId:', business.email);
            const q2 = query(
                collection(db, 'notifications'),
                where('userId', '==', business.email)
            );
            const querySnapshot2 = await getDocs(q2);
            querySnapshot2.forEach((doc) => {
                notifs.push({ id: doc.id, ...doc.data() });
            });
        }
        notifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setNotifications(notifs);
        setLoading(false);
    };

    useEffect(() => {
        console.log('NotificationCenter mounted. Business context:', business);
    }, []);

    useEffect(() => {
        if (business?.id || business?.email) {
            fetchNotifications();
        }
    }, [business]);

    useFocusEffect(
        useCallback(() => {
            if (business?.id || business?.email) {
                console.log('Tab focused. Refetching notifications. Business:', business);
                fetchNotifications();
            }
        }, [business])
    );

    useEffect(() => {
        if (!business && userDetail?.email && !fetchingBusiness) {
            setFetchingBusiness(true);
            (async () => {
                try {
                    const q = query(collection(db, 'salon_business'), where('email', '==', userDetail.email));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const businessData = querySnapshot.docs[0].data();
                        setLocalBusiness(businessData);
                        if (setBusiness) setBusiness(businessData);
                    }
                } catch (error) {
                    console.error('Error fetching business in NotificationCenter:', error);
                } finally {
                    setFetchingBusiness(false);
                }
            })();
        }
    }, [business, userDetail, setBusiness, fetchingBusiness]);

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

    if (!business) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={{ marginTop: 10 }}>Loading business context...</Text>
            </View>
        );
    }
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={{ marginTop: 10 }}>Loading notifications...</Text>
            </View>
        );
    }

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