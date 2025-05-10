import { db } from './FirebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './FirebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Upload image to Firebase Storage and return the download URL
export const uploadBarberPostImage = async (imageUri, barberId) => {
  try {
    // Create a unique path for the image
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const imageRef = ref(storage, `barber_posts/${barberId}_${Date.now()}`);
    await uploadBytes(imageRef, blob);
    const url = await getDownloadURL(imageRef);
    return url;
  } catch (error) {
    throw error;
  }
};

// Create a new post in Firestore
export const createBarberPost = async ({ barberId, businessId, imageUrl, caption, barberName, businessName }) => {
  try {
    const postData = {
      barberId,
      businessId,
      barberName,
      businessName,
      imageUrl,
      caption,
      timestamp: serverTimestamp(),
      likes: [],
    };
    await addDoc(collection(db, 'barber_posts'), postData);
    return true;
  } catch (error) {
    throw error;
  }
}; 