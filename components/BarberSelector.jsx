import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Colors from '../services/Colors';

// This component lets users pick a barber for their appointment.
// It shows only barbers who are available on the selected day and time.
const BarberSelector = ({ workers = [], selectedBarber, onSelectBarber, selectedDate, selectedTime }) => {
  // This function finds which barbers are available for the selected date and time.
  // It checks each worker's schedule and filters out those who aren't working then.
  const getAvailableBarbers = () => {
    if (!selectedDate || !selectedTime) return workers;

    // Convert selected time to 24-hour format for comparison
    const timeStr = selectedTime;
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    // Get day of week from selected date
    const dayOfWeek = new Date(selectedDate).getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDay = days[dayOfWeek];

    // Filter workers who are available on the selected day and time
    return workers.filter(worker => {
      const daySchedule = worker.availability.find(a => 
        a.day === selectedDay && a.isWorking
      );
      
      if (!daySchedule) return false;

      // Convert schedule times to 24-hour format
      const convertTimeToHours = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        const [h] = time.split(':');
        let hour = parseInt(h);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return hour;
      };

      const startHour = convertTimeToHours(daySchedule.startTime);
      const endHour = convertTimeToHours(daySchedule.endTime);

      return hour >= startHour && hour < endHour;
    });
  };

  const availableBarbers = getAvailableBarbers();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Barber:</Text>
      {availableBarbers.length === 0 ? (
        <Text style={styles.noBarberText}>
          No barbers available at selected time.
          Please choose a different time.
        </Text>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.barberList}
        >
          {availableBarbers.map((worker) => (
            <TouchableOpacity
              key={worker.id}
              style={[
                styles.barberCard,
                selectedBarber?.id === worker.id && styles.selectedBarberCard
              ]}
              onPress={() => onSelectBarber(worker)}
            >
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {worker.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[
                styles.barberName,
                selectedBarber?.id === worker.id && styles.selectedBarberName
              ]}>
                {worker.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: 'outfit',
    marginBottom: 10,
  },
  barberList: {
    flexGrow: 0,
  },
  barberCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 15,
    marginRight: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 100,
  },
  selectedBarberCard: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  barberName: {
    fontSize: 16,
    fontFamily: 'outfit',
    color: Colors.GRAY,
    textAlign: 'center',
  },
  selectedBarberName: {
    color: Colors.WHITE,
  },
  noBarberText: {
    color: Colors.GRAY,
    fontSize: 14,
    fontFamily: 'outfit',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
  },
});

export default BarberSelector; 