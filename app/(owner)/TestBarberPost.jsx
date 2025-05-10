import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadBarberPostImage, createBarberPost } from '../../services/BarberPosts';
import { UserDetailContext } from '../../context/UserDetailContext';

// This screen lets a barber (or business owner) create a new post with an image and caption
// The post is uploaded to the database and can be shown in the business's feed
export default function TestBarberPost() {
  // State for the selected image (local URI)
  const [image, setImage] = useState(null);
  // State for the caption text
  const [caption, setCaption] = useState('');
  // State to show a loading spinner while uploading
  const [loading, setLoading] = useState(false);
  // Get the current logged-in user's details from context
  const { userDetail } = useContext(UserDetailContext);

  // Get the barber's unique ID and business ID from context
  // These are needed to associate the post with the correct business and barber
  const barberId = userDetail?.email || '';
  const businessId = userDetail?.businessId || '';
  const barberName = userDetail?.name || barberId;
  const businessName = userDetail?.businessName || '';

  // Debug log to see what user details are available
  console.log('userDetail:', userDetail, 'barberId:', barberId, 'businessId:', businessId);

  // This function lets the user pick an image from their device
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // This function uploads the post (image + caption) to the database
  const handleUpload = async () => {
    // Make sure both an image and caption are provided
    if (!image || !caption) {
      Alert.alert('Please select an image and enter a caption.');
      return;
    }
    // Make sure the barber and business IDs are available
    if (!barberId || !businessId) {
      Alert.alert('Missing barber or business ID.');
      return;
    }
    setLoading(true);
    try {
      // Upload the image to storage and get its URL
      const imageUrl = await uploadBarberPostImage(image, barberId);
      // Create the post in the database
      await createBarberPost({
        barberId,
        businessId,
        imageUrl,
        caption,
        barberName,
        businessName,
      });
      Alert.alert('Success', 'Post uploaded successfully!');
      setImage(null);
      setCaption('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // This is the main UI for the TestBarberPost screen
  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa', padding: 0 }}>
      <View style={{
        backgroundColor: '#fff',
        margin: 18,
        marginTop: 40,
        borderRadius: 18,
        padding: 22,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
      }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 18, color: '#222', textAlign: 'center', letterSpacing: 0.5 }}>
          Create a New Post
        </Text>
        {/* Show the selected image, if any, with a nice preview */}
        {image && (
          <Image source={{ uri: image }} style={{ width: '100%', height: 220, borderRadius: 12, marginBottom: 18, borderWidth: 1, borderColor: '#eee' }} />
        )}
        {/* Button to pick or change the image */}
        <TouchableOpacity
          style={{
            backgroundColor: '#007bff',
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 18,
            shadowColor: '#007bff',
            shadowOpacity: 0.12,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={pickImage}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, letterSpacing: 0.2 }}>{image ? 'Change Image' : 'Pick Image'}</Text>
        </TouchableOpacity>
        {/* Input for the caption */}
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#e0e0e0',
            borderRadius: 8,
            padding: 14,
            marginBottom: 18,
            fontSize: 16,
            backgroundColor: '#fafbfc',
            color: '#222',
          }}
          placeholder="Write a caption for your post..."
          placeholderTextColor="#aaa"
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={3}
        />
        {/* Button to upload the post */}
        <TouchableOpacity
          style={{
            backgroundColor: '#28a745',
            paddingVertical: 15,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 2,
            shadowColor: '#28a745',
            shadowOpacity: 0.10,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 0.2 }}>Upload Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
} 