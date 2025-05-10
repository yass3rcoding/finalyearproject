import {
    View,
    Text,
    Platform,
    Image,
    TouchableOpacity,
    FlatList,
    ScrollView,
    StyleSheet,
    Modal,
    TextInput,
    Share,
    Alert
} from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { useLocalSearchParams } from 'expo-router/build/hooks';
import Colors from '../../services/Colors';
import { ArrowLeft, ShareIcon, Heart } from 'lucide-react-native';
import BusinessServices from '../../components/BusinessServices';
import { useRouter } from 'expo-router';
import { collection, addDoc, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/FirebaseConfig';
import { UserDetailContext } from '../../context/UserDetailContext';

export default function BusinessDetails() {
    const { business } = useLocalSearchParams();
    const [businessData, setBusinessData] = useState(JSON.parse(business));
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [reviews, setReviews] = useState([]);
    const [followedBarbers, setFollowedBarbers] = useState([]);
    const { userDetail } = useContext(UserDetailContext);
    const router = useRouter();

    useEffect(() => {
        fetchReviews();
        fetchFollowedBarbers();
    }, []);

    const fetchFollowedBarbers = async () => {
        if (!userDetail?.email) return;
        
        try {
            const followsRef = collection(db, "salon_follows");
            const q = query(followsRef, where("userEmail", "==", userDetail.email));
            const querySnapshot = await getDocs(q);
            const followed = querySnapshot.docs.map(doc => doc.data().barberEmail);
            setFollowedBarbers(followed);
        } catch (error) {
            console.error('Error fetching followed barbers:', error);
        }
    };

    const toggleFollowBarber = async (barberEmail) => {
        if (!userDetail?.email) {
            Alert.alert('Please sign in to follow barbers');
            return;
        }

        try {
            const followsRef = collection(db, "salon_follows");
            const q = query(followsRef, 
                where("userEmail", "==", userDetail.email),
                where("barberEmail", "==", barberEmail)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // Follow the barber
                await addDoc(followsRef, {
                    userEmail: userDetail.email,
                    barberEmail: barberEmail,
                    businessId: businessData.id,
                    followedAt: new Date().toISOString()
                });
                setFollowedBarbers(prev => [...prev, barberEmail]);

                // Create notification for barber/business owner
                await addDoc(collection(db, 'notifications'), {
                    barberId: businessData.id,
                    type: 'follower',
                    message: `${userDetail?.name || 'A user'} started following you!`,
                    timestamp: Date.now(),
                    read: false,
                    followerEmail: userDetail.email
                });
            } else {
                // Unfollow the barber
                const followDoc = querySnapshot.docs[0];
                await deleteDoc(doc(db, "salon_follows", followDoc.id));
                setFollowedBarbers(prev => prev.filter(email => email !== barberEmail));
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    const openImage = (image) => {
        setSelectedImage(image.replace('salon_app/', 'salon_app%2F'));
        setModalVisible(true);
    };

    const closeImage = () => {
        setModalVisible(false);
        setSelectedImage(null);
    };

    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: `Check out this business: ${businessData.name}\n${businessData.address}`,
                url: businessData.banner.replace('salon_app/', 'salon_app%2F'),
                title: businessData.name
            });
        } catch (error) {
            console.error("Error sharing:", error.message);
        }
    };

    const submitReview = async () => {
        if (!reviewText.trim()) return;

        try {
            await addDoc(collection(db, `salon_business/${businessData.id}/reviews`), {
                text: reviewText,
                createdAt: new Date().toISOString(),
            });
            setReviewText('');
            fetchReviews();
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    const fetchReviews = async () => {
        try {
            const bookingRef = collection(db, "salon_booking");
            const q = query(bookingRef, 
                where("businessId", "==", businessData.id),
                where("status", "==", "Completed")
            );
            const querySnapshot = await getDocs(q);
            const fetchedReviews = [];
            let totalRating = 0;
            let reviewCount = 0;
            
            querySnapshot.forEach((doc) => {
                const booking = doc.data();
                if (booking.review) {
                    fetchedReviews.push({
                        id: doc.id,
                        ...booking.review,
                        userName: booking.name,
                        services: booking.services,
                        service: booking.service,
                        workerName: booking.barberName
                    });
                    totalRating += booking.review.rating;
                    reviewCount++;
                }
            });
            
            // Calculate average rating, default to 0 if no reviews
            const averageRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : "0.0";
            
            // Update business data with new average rating
            setBusinessData(prev => ({
                ...prev,
                rating: averageRating
            }));
            
            setReviews(fetchedReviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    return (
        <ScrollView
            style={{
                flex: 1,
                backgroundColor: Colors.WHITE
            }}
            contentContainerStyle={{
                paddingTop: Platform.OS === 'ios' ? 55 : 30,
                padding: 20,
                paddingBottom: 100 // Add extra padding at bottom for better scrolling
            }}
            showsVerticalScrollIndicator={true}
            bounces={true}
        >
            <Image
                source={{ uri: businessData?.banner.replace('salon_app/', 'salon_app%2F') }}
                style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 15,
                }}
                resizeMode="cover"
            />

            <TouchableOpacity
                style={{
                    position: 'absolute',
                    top: Platform.OS === 'ios' ? 55 : 30,
                    left: 20,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: 10,
                    borderRadius: 20,
                    zIndex: 1
                }}
                onPress={() => router.back()}
            >
                <ArrowLeft color={Colors.WHITE} size={24} />
            </TouchableOpacity>

            <View
                style={{
                    marginTop: 15,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                }}
            >
                <View>
                    <Text
                        style={{
                            fontFamily: 'outfit-bold',
                            fontSize: 20,
                        }}
                    >
                        {businessData?.name}
                    </Text>
                    <Text
                        style={{
                            marginTop: 4,
                            fontFamily: 'outfit',
                            fontSize: 16,
                            color: Colors.GARY,
                        }}
                    >
                        {businessData?.address}
                    </Text>
                    <View
                        style={{
                            marginTop: 5,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingRight: 10,
                        }}
                    >
                        <Text style={{ fontFamily: 'outfit', fontSize: 16 }}>
                            ⭐ {businessData?.rating} ({reviews.length} reviews)
                        </Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: followedBarbers.includes(businessData?.email) ? Colors.PRIMARY : Colors.WHITE,
                            padding: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: Colors.PRIMARY
                        }}
                        onPress={() => toggleFollowBarber(businessData?.email)}
                    >
                        <Heart 
                            size={20} 
                            color={followedBarbers.includes(businessData?.email) ? Colors.WHITE : Colors.PRIMARY} 
                        />
                        <Text style={{ 
                            marginLeft: 5,
                            color: followedBarbers.includes(businessData?.email) ? Colors.WHITE : Colors.PRIMARY,
                            fontFamily: 'outfit',
                            fontSize: 14
                        }}>
                            {followedBarbers.includes(businessData?.email) ? 'Following' : 'Follow'}
                        </Text>
                    </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}
                    onPress={handleShare}
                >
                    <ShareIcon color={Colors.PRIMARY} size={20} />
                    <Text style={{
                        fontFamily: 'outfit',
                        fontSize: 16,
                        marginLeft: 5
                    }}>Share</Text>
                </TouchableOpacity>
                </View>
            </View>

            <View style={{ marginTop: 15 }}>
                <Text style={{ fontFamily: 'outfit', fontSize: 20 }}>About</Text>
                <Text
                    style={{
                        fontFamily: 'outfit',
                        fontSize: 14,
                        color: Colors.GARY,
                        marginTop: 2,
                    }}
                >
                    {businessData?.about}
                </Text>
            </View>

            <BusinessServices business={businessData} />

            <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 20, fontFamily: 'outfit' }}>Gallery</Text>
                <FlatList
                    data={businessData?.images}
                    numColumns={3}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={{ flex: 1, margin: 5 }} onPress={() => openImage(item)}>
                            <Image
                                source={{ uri: item.replace('salon_app/', 'salon_app%2F') }}
                                style={{
                                    width: '100%',
                                    height: 80,
                                    borderRadius: 10,
                                    resizeMode: 'cover',
                                }}
                            />
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Reviews Section */}
            <View style={{ marginTop: 25 }}>
                <Text style={{ fontSize: 20, fontFamily: 'outfit' }}>Reviews</Text>
                {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                        <View key={index} style={{
                            backgroundColor: Colors.WHITE,
                            padding: 15,
                            borderRadius: 10,
                            marginTop: 10,
                            borderWidth: 1,
                            borderColor: '#e0e0e0'
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontFamily: 'outfit-bold' }}>{review.userName}</Text>
                                <Text style={{ color: Colors.GARY }}>⭐ {review.rating}/5</Text>
                </View>
                            <View style={{ marginTop: 5 }}>
                                <Text style={{ color: Colors.GARY, fontFamily: 'outfit' }}>
                                    ✂️ Service: {review.services ? review.services.map(s => s.name).join(', ') : review.service}
                                </Text>
                                <Text style={{ color: Colors.GARY, fontFamily: 'outfit' }}>
                                    👤 Worker: {review.workerName}
                                </Text>
                            </View>
                            {review.comment && (
                                <Text style={{ 
                                    color: Colors.GARY,
                                    marginTop: 5,
                                    fontFamily: 'outfit'
                                }}>{review.comment}</Text>
                    )}
                </View>
                    ))
                ) : (
                    <Text style={{ 
                        color: Colors.GARY,
                        marginTop: 10,
                        fontFamily: 'outfit'
                    }}>No reviews yet</Text>
                )}
            </View>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeImage}
            >
                <TouchableOpacity
                    style={styles.modalContainer}
                    activeOpacity={1}
                    onPress={closeImage}
                >
                    <Image
                        source={{ uri: selectedImage }}
                        style={styles.modalImage}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: '100%',
        height: '100%',
    },
});
