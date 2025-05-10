import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Image, FlatList, Dimensions, ScrollView, Modal } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/FirebaseConfig';
import Colors from '../services/Colors';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_LOCATION = { latitude: 51.5074, longitude: -0.1278 }; // Central London
const { height } = Dimensions.get('window');

// This function works out the distance between two places on the map using their latitude and longitude.
// It's used to sort or filter businesses by how close they are.
function getDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// This screen shows a map with all the barbershops/salons.
// Users can see locations, tap on a shop for details, and use filters to sort or find shops.
export default function MapExplore() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const mapRef = useRef(null);
  const router = useRouter();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Nearest');
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);

  const filterOptions = [
    { key: 'Nearest', label: 'Nearest' },
    { key: 'HighestRated', label: 'Highest Rated' },
    { key: 'MostPopular', label: 'Most Popular' },
    { key: 'Followed', label: 'Followed Barbershops' },
    { key: 'MostFollowed', label: 'Most Followed' },
    { key: 'RecentlyAdded', label: 'Recently Added' },
  ];

  // This function runs automatically when the screen loads.
  // It gets all the businesses from the database and puts them on the map.
  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'salon_business'));
      const list = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.location && data.location.latitude && data.location.longitude) {
          list.push(data);
        }
      });
      // Sort by distance from default location
      list.sort((a, b) =>
        getDistance(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, a.location.latitude, a.location.longitude) -
        getDistance(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, b.location.latitude, b.location.longitude)
      );
      setBusinesses(list);
      setLoading(false);
      if (list.length > 0) {
        setRegion({
          latitude: list[0].location.latitude,
          longitude: list[0].location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    };
    fetchBusinesses();
  }, []);

  // This function runs whenever the list of businesses or the selected filter changes.
  // It sorts or filters the businesses based on what the user picked (like nearest, highest rated, etc).
  useEffect(() => {
    let filtered = [...businesses];
    if (selectedFilter === 'Nearest') {
      filtered.sort((a, b) =>
        getDistance(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, a.location.latitude, a.location.longitude) -
        getDistance(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, b.location.latitude, b.location.longitude)
      );
    } else if (selectedFilter === 'HighestRated') {
      filtered.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
    } else if (selectedFilter === 'RecentlyAdded') {
      filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (selectedFilter === 'MostPopular') {
      // To be implemented: sort by booking count
    } else if (selectedFilter === 'Followed') {
      // To be implemented: filter by followed businesses
    } else if (selectedFilter === 'MostFollowed') {
      // To be implemented: sort by follower count
    }
    setFilteredBusinesses(filtered);
  }, [businesses, selectedFilter]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ position: 'absolute', top: 40, left: 20, zIndex: 10, backgroundColor: '#fff', borderRadius: 20, padding: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
      </TouchableOpacity>
      {/* Map (top half) */}
      <View style={{ width: '100%', height: height * 0.45 }}>
        <MapView
          ref={mapRef}
          style={{ width: '100%', height: '100%' }}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {filteredBusinesses.map((biz, idx) => (
            <Marker
              key={biz.id || idx}
              coordinate={{
                latitude: biz.location.latitude,
                longitude: biz.location.longitude,
              }}
            >
              <Callout onPress={() => router.push({ pathname: '/business-detail', params: { business: JSON.stringify(biz) } })}>
                <View style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 10,
                  alignItems: 'center',
                  minWidth: 200,
                  minHeight: 120,
                  maxWidth: 250,
                  justifyContent: 'center',
                  elevation: 4
                }}>
                  {biz.banner ? (
                    <Image source={{ uri: biz.banner }} style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 6 }} />
                  ) : (
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.GARY, marginBottom: 6 }} />
                  )}
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 2 }}>{biz.name}</Text>
                  <Text style={{ color: Colors.GARY, fontSize: 14 }}>⭐ {biz.rating || '0.0'}</Text>
                  <Text style={{ color: Colors.GARY, fontSize: 12, marginTop: 2, textAlign: 'center' }}>{biz.address}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
        {/* Zoom Controls */}
        <View style={{ position: 'absolute', right: 16, top: 16, flexDirection: 'column', zIndex: 20 }}>
          <TouchableOpacity
            onPress={() => {
              setRegion(r => ({
                ...r,
                latitudeDelta: r.latitudeDelta * 0.5,
                longitudeDelta: r.longitudeDelta * 0.5,
              }));
            }}
            style={{ backgroundColor: '#fff', borderRadius: 20, padding: 8, marginBottom: 8, alignItems: 'center', elevation: 4 }}
          >
            <Ionicons name="add" size={24} color={Colors.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setRegion(r => ({
                ...r,
                latitudeDelta: r.latitudeDelta * 2,
                longitudeDelta: r.longitudeDelta * 2,
              }));
            }}
            style={{ backgroundColor: '#fff', borderRadius: 20, padding: 8, alignItems: 'center', elevation: 4 }}
          >
            <Ionicons name="remove" size={24} color={Colors.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>
      {/* Filter Header Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 10, marginBottom: 5, justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 5 }}>{filterOptions.find(f => f.key === selectedFilter)?.label} Barbershops</Text>
        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          style={{ backgroundColor: Colors.PRIMARY, borderRadius: 16, padding: 8, marginLeft: 10, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="filter" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPressOut={() => setFilterModalVisible(false)}
        >
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, minWidth: 250 }}>
            {filterOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => {
                  setSelectedFilter(option.key);
                  setFilterModalVisible(false);
                }}
              >
                <Ionicons
                  name={selectedFilter === option.key ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedFilter === option.key ? Colors.PRIMARY : '#888'}
                  style={{ marginRight: 10 }}
                />
                <Text style={{ fontSize: 16, color: selectedFilter === option.key ? Colors.PRIMARY : '#222' }}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      {/* List (bottom half) */}
      <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 10 }}>
        <FlatList
          data={filteredBusinesses}
          keyExtractor={(item, idx) => item.id || idx.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}
              onPress={() => router.push({ pathname: '/business-detail', params: { business: JSON.stringify(item) } })}
            >
              {item.banner ? (
                <Image source={{ uri: item.banner }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }} />
              ) : (
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.GARY, marginRight: 12 }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.name}</Text>
                <Text style={{ color: Colors.GARY, fontSize: 14 }}>{item.address}</Text>
                <Text style={{ color: Colors.GARY, fontSize: 13 }}>⭐ {item.rating || '0.0'}</Text>
                <Text style={{ color: Colors.GARY, fontSize: 12 }}>{getDistance(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, item.location.latitude, item.location.longitude).toFixed(2)} km away</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
} 