import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';

const MAX_WORKERS = 5;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_TIMES = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
];

// This component lets business owners add, view, and manage their staff (workers/barbers).
// Owners can add up to 5 workers, set their names, and choose which days and times they work.
const WorkerList = ({ workers = [], onUpdateWorkers }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: '',
    availability: DAYS.map(day => ({
      day,
      isWorking: false,
      startTime: '9:00 AM',
      endTime: '5:00 PM'
    }))
  });

  // This function adds a new worker to the list with their name and availability.
  // It checks that the name is filled in, then updates the list and resets the form.
  const handleAddWorker = () => {
    if (!newWorker.name.trim()) {
      Alert.alert('Required Field', 'Please enter worker name');
      return;
    }

    const updatedWorkers = [...workers, { ...newWorker, id: Date.now().toString() }];
    onUpdateWorkers(updatedWorkers);
    setNewWorker({
      name: '',
      availability: DAYS.map(day => ({
        day,
        isWorking: false,
        startTime: '9:00 AM',
        endTime: '5:00 PM'
      }))
    });
    setShowAddForm(false);
  };

  // This function removes a worker from the list after confirming with the user.
  const handleRemoveWorker = (workerId) => {
    Alert.alert(
      'Remove Worker',
      'Are you sure you want to remove this worker?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedWorkers = workers.filter(w => w.id !== workerId);
            onUpdateWorkers(updatedWorkers);
          }
        }
      ]
    );
  };

  // This function toggles whether a worker is working on a specific day.
  const toggleWorkDay = (dayIndex) => {
    const updatedAvailability = [...newWorker.availability];
    updatedAvailability[dayIndex] = {
      ...updatedAvailability[dayIndex],
      isWorking: !updatedAvailability[dayIndex].isWorking
    };
    setNewWorker({ ...newWorker, availability: updatedAvailability });
  };

  // This function updates the start or end time for a worker's shift on a specific day.
  const updateWorkerTime = (dayIndex, isStart, time) => {
    const updatedAvailability = [...newWorker.availability];
    updatedAvailability[dayIndex] = {
      ...updatedAvailability[dayIndex],
      [isStart ? 'startTime' : 'endTime']: time
    };
    setNewWorker({ ...newWorker, availability: updatedAvailability });
  };

  // This function shows the days and times a worker is available to work.
  const renderAvailability = (workerAvailability) => {
    return (
      <View style={styles.availabilityContainer}>
        {workerAvailability.map((schedule, index) => (
          schedule.isWorking && (
            <View key={schedule.day} style={styles.scheduleRow}>
              <Text style={styles.dayText}>{schedule.day}</Text>
              <Text style={styles.timeText}>
                {schedule.startTime} - {schedule.endTime}
              </Text>
            </View>
          )
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Management</Text>
      <Text style={styles.subtitle}>Add up to 5 workers to your business</Text>

      <ScrollView style={styles.workerList}>
        {workers.map(worker => (
          <View key={worker.id} style={styles.workerCard}>
            <View style={styles.workerHeader}>
              <Text style={styles.workerName}>{worker.name}</Text>
              <TouchableOpacity 
                onPress={() => handleRemoveWorker(worker.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            {renderAvailability(worker.availability)}
          </View>
        ))}
        {showAddForm && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Worker Name *"
              value={newWorker.name}
              onChangeText={(text) => setNewWorker({ ...newWorker, name: text })}
            />

            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.availabilityForm}>
              {DAYS.map((day, index) => (
                <View key={day} style={styles.dayRow}>
                  <TouchableOpacity 
                    style={[
                      styles.dayToggle,
                      newWorker.availability[index].isWorking && styles.dayToggleActive
                    ]}
                    onPress={() => toggleWorkDay(index)}
                  >
                    <Text style={[
                      styles.dayToggleText,
                      newWorker.availability[index].isWorking && styles.dayToggleTextActive
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                  {newWorker.availability[index].isWorking && (
                    <View style={styles.timeSelectors}>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.timeList}
                      >
                        {DEFAULT_TIMES.map((time) => (
                          <TouchableOpacity
                            key={`start-${time}`}
                            style={[
                              styles.timeButton,
                              newWorker.availability[index].startTime === time && styles.timeButtonActive
                            ]}
                            onPress={() => updateWorkerTime(index, true, time)}
                          >
                            <Text style={[
                              styles.timeButtonText,
                              newWorker.availability[index].startTime === time && styles.timeButtonTextActive
                            ]}>
                              {time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={styles.timeText}>to</Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.timeList}
                      >
                        {DEFAULT_TIMES.map((time) => (
                          <TouchableOpacity
                            key={`end-${time}`}
                            style={[
                              styles.timeButton,
                              newWorker.availability[index].endTime === time && styles.timeButtonActive
                            ]}
                            onPress={() => updateWorkerTime(index, false, time)}
                          >
                            <Text style={[
                              styles.timeButtonText,
                              newWorker.availability[index].endTime === time && styles.timeButtonTextActive
                            ]}>
                              {time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              ))}
            </View>
            <View style={styles.formButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowAddForm(false);
                  setNewWorker({
                    name: '',
                    availability: DAYS.map(day => ({
                      day,
                      isWorking: false,
                      startTime: '9:00 AM',
                      endTime: '5:00 PM'
                    }))
                  });
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleAddWorker}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {!showAddForm && workers.length < MAX_WORKERS && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addButtonText}>+ Add Worker</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
    borderRadius: 0,
    marginVertical: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
  },
  workerList: {
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  workerCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    color: '#dc3545',
    fontSize: 18,
    fontWeight: 'bold',
  },
  availabilityContainer: {
    marginTop: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dayText: {
    fontSize: 14,
    color: '#495057',
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 8,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    marginTop: 8,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  availabilityForm: {
    marginBottom: 20,
  },
  dayRow: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  dayToggle: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dayToggleActive: {
    backgroundColor: '#007bff',
  },
  dayToggleText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  dayToggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  timeSelectors: {
    marginLeft: 16,
    marginTop: 12,
    flexDirection: 'column',
  },
  timeList: {
    flexGrow: 0,
    marginBottom: 12,
    height: 45,
  },
  timeButton: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  timeButtonActive: {
    backgroundColor: '#28a745',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  timeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkerList; 