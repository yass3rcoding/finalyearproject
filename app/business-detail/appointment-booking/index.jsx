import { View, Text, Platform, TouchableOpacity, Alert, ScrollView } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Colors from '../../../services/Colors';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import RNDateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../../../services/FirebaseConfig';
import { doc, setDoc, addDoc, collection as fbCollection } from 'firebase/firestore';
import { UserDetailContext } from '../../../context/UserDetailContext';
// import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import BarberSelector from '../../../components/BarberSelector';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function AppointmentBooking() {

    const params = useLocalSearchParams();
    const [business, setBusiness] = useState(JSON.parse(params?.business));
    const [selected, setSelected] = useState('');
    const [formattedTime, setFormattedTime] = useState();
    const { userDetail, setUserDetail } = useContext(UserDetailContext)
    const [date, setDate] = useState();
    const [time, setTime] = useState(new Date());
    const router = useRouter();
    const pickerRef = useRef();
    const [timeSlot, setTimeSlot] = useState([]);
    const [selectedBarber, setSelectedBarber] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState(params?.services ? JSON.parse(params.services) : []);

    useEffect(() => {
        generateTimeSlots();
        // Fetch workers from business data
        if (business?.workers) {
            setWorkers(business.workers);
        }
        fetchServices();
    }, []);

    useEffect(() => {
        if (selectedBarber && date) {
            filterAvailableTimeSlots();
        } else {
            setAvailableTimeSlots(timeSlot);
        }
    }, [selectedBarber, date, timeSlot]);

    function open() {
        pickerRef.current.focus();
    }

    function close() {
        pickerRef.current.blur();
    }

    // This function is called when the user presses the button to book an appointment.
    // It checks that all details are filled in, then saves the booking to the database and notifies the business.
    const CreateBooking = async () => {
        if (!date || !formattedTime) {
            Alert.alert('Please enter all details')
            return;
        }
        if (!selectedServices.length) {
            Alert.alert('Please select at least one service');
            return;
        }
        const docId = Date.now().toString()
        try {
            const bookingData = {
                name: userDetail?.name || '',
                email: userDetail?.email || '',
                businessId: business?.id,
                status: 'Pending',
                services: selectedServices,
                date: date,
                time: formattedTime,
                id: docId,
                barberName: selectedBarber?.name || 'Not specified'
            };
            await setDoc(doc(db, "salon_booking", docId), bookingData);
            // Create notification for barber/business owner
            await addDoc(fbCollection(db, 'notifications'), {
                barberId: business?.id,
                type: 'booking',
                message: `New booking from ${userDetail?.name || 'a user'} for ${selectedServices.map(s => s.name).join(', ')} on ${date} at ${formattedTime}`,
                timestamp: Date.now(),
                read: false,
                bookingId: docId
            });
            Alert.alert('Success!', 'Appointment Booked successfully', [
                {
                    text: 'Ok',
                    onPress: () => router.replace('/(tabs)/Booking')
                }
            ])
        } catch (e) {
            console.log("Error:", e)
        }
    }

    // This function creates a list of possible time slots for appointments (like 9:00 AM, 9:15 AM, etc).
    // It runs when the screen loads so the user can pick a time.
    const generateTimeSlots = () => {
        const slots = [];
        let start = new Date();
        start.setHours(9, 0, 0, 0); // 9:00 AM

        const end = new Date();
        end.setHours(17, 0, 0, 0); // 5:00 PM

        while (start <= end) {
            const hours = start.getHours();
            const minutes = start.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHour = ((hours + 11) % 12 + 1);
            const formattedMinutes = minutes.toString().padStart(2, '0');

            slots.push(`${formattedHour}:${formattedMinutes} ${ampm}`);
            start.setMinutes(start.getMinutes() + 15);
        }

        setTimeSlot(slots)
    };

    // This function checks which time slots are actually available for the selected barber and date.
    // It removes times that are already booked or outside the barber's working hours.
    const filterAvailableTimeSlots = async () => {
        if (!selectedBarber || !date) return;

        const dayOfWeek = new Date(date).getDay();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const selectedDay = days[dayOfWeek];

        const barberSchedule = selectedBarber.availability.find(a => 
            a.day === selectedDay && a.isWorking
        );

        if (!barberSchedule) {
            setAvailableTimeSlots([]);
            return;
        }

        // Get existing bookings for the selected date and barber
        const bookingsRef = collection(db, "salon_booking");
        const q = query(bookingsRef, 
            where("date", "==", date),
            where("barberName", "==", selectedBarber.name),
            where("status", "in", ["Pending", "Confirmed"])
        );
        const querySnapshot = await getDocs(q);
        const existingBookings = querySnapshot.docs.map(doc => doc.data());

        const convertTimeToHours = (timeStr) => {
            const [time, period] = timeStr.split(' ');
            const [h] = time.split(':');
            let hour = parseInt(h);
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
            return hour;
        };

        const startHour = convertTimeToHours(barberSchedule.startTime);
        const endHour = convertTimeToHours(barberSchedule.endTime);

        const availableSlots = timeSlot.filter(slot => {
            // Check if slot is within barber's working hours
            const [time, period] = slot.split(' ');
            const [h] = time.split(':');
            let hour = parseInt(h);
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
            
            if (hour < startHour || hour >= endHour) {
                return false;
            }

            // Check if slot conflicts with existing bookings
            const slotTime = new Date(date);
            const [slotHours, slotMinutes] = time.split(':');
            slotTime.setHours(parseInt(slotHours) + (period === 'PM' ? 12 : 0), parseInt(slotMinutes));

            // Calculate total duration for all selected services
            const totalServiceDuration = selectedServices.reduce((sum, s) => sum + (parseInt(s.time) || 0), 0) || 30;
            const slotEnd = new Date(slotTime.getTime() + totalServiceDuration * 60000);

            return !existingBookings.some(booking => {
                const bookingTime = new Date(date);
                const [bookingHours, bookingMinutes] = booking.time.split(':');
                const bookingPeriod = booking.time.split(' ')[1];
                bookingTime.setHours(
                    parseInt(bookingHours) + (bookingPeriod === 'PM' ? 12 : 0),
                    parseInt(bookingMinutes)
                );

                // Calculate duration for the existing booking (sum if array, fallback to single)
                const bookingDuration = Array.isArray(booking.services)
                    ? booking.services.reduce((sum, s) => sum + (parseInt(s.time) || 0), 0)
                    : (parseInt(booking.time) || 30);
                const bookingEnd = new Date(bookingTime.getTime() + bookingDuration * 60000);

                return (
                    (slotTime >= bookingTime && slotTime < bookingEnd) ||
                    (slotEnd > bookingTime && slotEnd <= bookingEnd) ||
                    (slotTime <= bookingTime && slotEnd >= bookingEnd)
                );
            });
        });

        setAvailableTimeSlots(availableSlots);
        // Reset selected time if it's no longer available
        if (formattedTime && !availableSlots.includes(formattedTime)) {
            setFormattedTime(null);
        }
    };

    // This function gets all the services (like haircut, shave, etc.) offered by the business from the database.
    // It runs when the screen loads so the user can pick which services they want.
    const fetchServices = async () => {
        if (!business?.id) return;
        const q = query(collection(db, "salone_services"), where("businessId", "==", business.id));
        const querySnapshot = await getDocs(q);
        const fetchedServices = [];
        querySnapshot.forEach((doc) => {
            fetchedServices.push({ ...doc.data(), id: doc.id });
        });
        setServices(fetchedServices);
    };

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

    // This function is a placeholder for what happens when the user wants to continue to the next step.
    // You can add more booking steps here if needed.
    const handleContinue = () => {
        // Proceed with the rest of the booking flow
        // You may want to show the date/time/barber selection after this
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: Platform.OS == 'ios' ? 55 : 30, padding: 20 }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20
            }}>
                <TouchableOpacity 
                    onPress={() => router.back()}
                    style={{
                        marginRight: 15
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
            <Text style={{
                fontFamily: 'outfit',
                fontSize: 25
            }}>Booking</Text>
            </View>

            <View style={{
                marginTop: 15
            }}>
                <Text style={{
                    fontFamily: 'outfit',
                    fontSize: 18
                }}>{selectedServices.length > 0 ? selectedServices[0].name : 'No service selected'}</Text>
                <Text style={{
                    fontFamily: 'outfit',
                    fontSize: 18,
                    color: Colors.GARY
                }}>at {business?.name}</Text>

            </View>

            <View style={{
                marginTop: 5
            }}>
                <Text style={{
                    marginVertical: 5,
                    fontFamily: 'outfit',
                    fontSize: 18
                }}>Select Date:</Text>
                <Calendar
                    onDayPress={day => {
                        setDate(day.dateString);
                    }}
                    style={{
                        borderRadius: 10
                    }}
                    markedDates={{
                        [date]: { selected: true, disableTouchEvent: true, selectedDotColor: 'black' }
                    }}
                />

                <BarberSelector
                    workers={workers}
                    selectedBarber={selectedBarber}
                    onSelectBarber={setSelectedBarber}
                    selectedDate={date}
                    selectedTime={formattedTime}
                />

                <Text style={{
                    marginTop: 10,
                    fontSize: 18,
                    fontFamily: 'outfit',
                    marginBottom: 7
                }}>Select Time</Text>
                {availableTimeSlots.length === 0 ? (
                    <Text style={{
                        color: Colors.GARY,
                        fontSize: 14,
                        fontFamily: 'outfit',
                        textAlign: 'center',
                        backgroundColor: '#f8f9fa',
                        padding: 15,
                    borderRadius: 10,
                    }}>
                        {!selectedBarber ? 'Please select a barber first' : 
                         !date ? 'Please select a date first' :
                         'No available time slots for selected barber on this date'}
                    </Text>
                ) : (
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={{
                            marginBottom: 15
                        }}
                    >
                        {availableTimeSlots.map((slot, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setFormattedTime(slot)}
                                style={{
                                    padding: 10,
                                    marginRight: 10,
                                    backgroundColor: formattedTime === slot ? Colors.PRIMARY : Colors.WHITE,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: formattedTime === slot ? Colors.PRIMARY : '#e0e0e0',
                                }}
                            >
                                <Text style={{
                                    color: formattedTime === slot ? Colors.WHITE : '#000000',
                                    fontFamily: 'outfit',
                                    fontSize: 16
                                }}>
                                    {slot}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            <Text style={{ fontFamily: 'outfit', fontSize: 20, marginBottom: 10 }}>Select Services</Text>
            <View style={{ marginBottom: 20 }}>
                {services.map((service) => (
                    <TouchableOpacity
                        key={service.id}
                        onPress={() => toggleService(service)}
                        style={{
                            padding: 15,
                            marginBottom: 10,
                            backgroundColor: selectedServices.find((s) => s.id === service.id) ? Colors.PRIMARY : Colors.WHITE,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: selectedServices.find((s) => s.id === service.id) ? Colors.PRIMARY : '#e0e0e0',
                        }}
                    >
                        <Text style={{
                            color: selectedServices.find((s) => s.id === service.id) ? Colors.WHITE : '#000',
                            fontFamily: 'outfit',
                            fontSize: 18
                        }}>{service.name} - ${service.amount} ({service.time} min)</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {selectedServices.length > 0 && (
                <TouchableOpacity
                    style={{
                        marginTop: 20,
                        marginBottom: 20,
                        backgroundColor: Colors.PRIMARY,
                        padding: 15,
                        borderRadius: 10,
                        alignItems: 'center',
                    }}
                    onPress={CreateBooking}
                >
                    <Text style={{ color: Colors.WHITE, fontSize: 18, fontFamily: 'outfit-bold' }}>Continue</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    )
}