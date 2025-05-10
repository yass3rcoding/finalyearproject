import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import Colors from '../services/Colors'
import { useRouter } from 'expo-router'
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/FirebaseConfig';
// const services = [
//     {
//         name: 'Hair cutting',
//         time: 30,
//         amount: 30
//     },
//     {
//         name: 'Shave',
//         time: 10,
//         amount: 20
//     },
//     {
//         name: 'Spa',
//         time: 60,
//         amount: 120
//     }
// ]
// This component shows a list of all services offered by a business (like haircuts, shaves, etc.).
// Owners can delete services, and users can select services to book.
export default function BusinessServices({ business, owner = false, refreshData }) {
    const router = useRouter();
    const [serviceList, setServiceList] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    useEffect(() => {
        business && GetBusinessServices()
    }, [business, refreshData])

    // This function adds or removes a service from the user's selected services list.
    // If the user taps a service, it will be selected or unselected.
    const toggleService = (service) => {
        setSelectedServices((prev) => {
            const exists = prev.find((s) => s.id === service.id);
            if (exists) {
                return prev.filter((s) => s.id !== service.id);
            } else {
                return [...prev, service];
            }
        });
    };

    // This function goes to the next step in booking, passing the selected services.
    const onNext = () => {
        router.push({
            pathname: '/business-detail/appointment-booking',
            params: {
                business: JSON.stringify(business),
                services: JSON.stringify(selectedServices)
            }
        });
    };

    // This function gets all services for the business from the database and puts them in the list.
    const GetBusinessServices = async () => {
        const q = query(collection(db, "salone_services"), where("businessId", "==", business.id));
        const querySnapshot = await getDocs(q);
        setServiceList([])
        querySnapshot.forEach((doc) => {
            setServiceList(prev => [...prev, { ...doc.data(), id: doc.id }])
        });
    }

    // This function lets the owner delete a service from the business.
    // It removes the service from the database and updates the list.
    const deleteService = async (service) => {
        await deleteDoc(doc(db, "salone_services", service?.id));
        Alert.alert('Service Deleted!');
        GetBusinessServices()
    }

    return (
        <View style={{ marginTop: 15 }}>
            <Text style={{ fontFamily: 'outfit', fontSize: 20 }}>Services</Text>
            <View>
                {serviceList.map((service, index) => (
                    <TouchableOpacity
                        key={index}
                        style={{
                            marginTop: 10,
                            marginBottom: 10,
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: selectedServices.find((s) => s.id === service.id) ? Colors.PRIMARY : Colors.WHITE,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: selectedServices.find((s) => s.id === service.id) ? Colors.PRIMARY : '#e0e0e0',
                            padding: 10
                        }}
                        onPress={() => toggleService(service)}
                    >
                        <View>
                            <Text style={{ fontSize: 18, color: selectedServices.find((s) => s.id === service.id) ? Colors.WHITE : '#000' }}>{service?.name}</Text>
                            <Text style={{ color: Colors.GARY }}>{service?.time} Min</Text>
                            <Text style={{ color: Colors.GARY }}>$ {service?.amount}</Text>
                        </View>
                        {!owner && (
                            <Text style={{ color: selectedServices.find((s) => s.id === service.id) ? Colors.WHITE : Colors.PRIMARY, fontWeight: 'bold' }}>
                                {selectedServices.find((s) => s.id === service.id) ? 'Selected' : 'Select'}
                            </Text>
                        )}
                        {owner && (
                            <TouchableOpacity style={{ borderWidth: 1, padding: 4, paddingHorizontal: 12, borderRadius: 99 }} onPress={() => deleteService(service)}>
                                <Text>Delete</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
            {selectedServices.length > 0 && !owner && (
                <TouchableOpacity
                    style={{
                        marginTop: 20,
                        marginBottom: 20,
                        backgroundColor: Colors.PRIMARY,
                        padding: 15,
                        borderRadius: 10,
                        alignItems: 'center',
                    }}
                    onPress={onNext}
                >
                    <Text style={{ color: Colors.WHITE, fontSize: 18, fontFamily: 'outfit-bold' }}>Next</Text>
                </TouchableOpacity>
            )}
        </View>
    )
}