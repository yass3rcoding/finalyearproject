import React, { useState, useContext } from 'react'
import { Image, Text, TouchableOpacity, View, Alert, TextInput, Modal } from 'react-native'
import Colors from '../services/Colors'
import { useRouter } from 'expo-router'
import moment from 'moment';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { UserDetailContext } from '../context/UserDetailContext';

// This component shows a card for each booking (appointment) in the app.
// Users and business owners can see booking details, update status, leave reviews, or cancel/delete bookings.
function BookingCard({ booking, onStatusUpdate }) {
    const router = useRouter();
    const { userDetail } = useContext(UserDetailContext);
    const [status, setStatus] = useState(booking?.status || 'Pending');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    // Add console logging to debug
    console.log('Booking status:', booking?.status);
    console.log('Local status state:', status);
    console.log('Is business owner:', userDetail?.isBusinessOwner);

    // This function marks a booking as completed in the database and updates the status in the app.
    const markAsCompleted = async () => {
        try {
            await updateDoc(doc(db, "salon_booking", booking.id), {
                status: 'Completed'
            });
            setStatus('Completed');
            if (onStatusUpdate) {
                onStatusUpdate();
            }
        } catch (error) {
            console.log("Error updating status:", error);
        }
    };

    // This function lets the user or owner cancel a booking after confirming.
    // It updates the status in the database and sends a notification if needed.
    const cancelBooking = async () => {
        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking?",
            [
                {
                    text: "No",
                    style: "cancel"
                },
                {
                    text: "Yes, Cancel",
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, "salon_booking", booking.id), {
                                status: 'Cancelled',
                                cancelledBy: userDetail?.isBusinessOwner ? 'barber' : 'customer',
                                cancelledAt: new Date().toISOString()
                            });
                            setStatus('Cancelled');
                            if (!userDetail?.isBusinessOwner) {
                                // Create notification for barber/business owner if cancelled by customer
                                await addDoc(collection(db, 'notifications'), {
                                    barberId: booking.businessId,
                                    type: 'cancel',
                                    message: `${userDetail?.name || 'A user'} cancelled their booking for ${booking.services ? booking.services.map(s => s.name).join(', ') : booking.service} on ${booking.date} at ${booking.time}`,
                                    timestamp: Date.now(),
                                    read: false,
                                    bookingId: booking.id
                                });
                            }
                            if (onStatusUpdate) {
                                onStatusUpdate();
                            }
                        } catch (error) {
                            console.log("Error cancelling booking:", error);
                            Alert.alert("Error", "Failed to cancel booking. Please try again.");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    // This function lets the business owner confirm a booking and notifies the user.
    const confirmBooking = async () => {
        try {
            await updateDoc(doc(db, "salon_booking", booking.id), {
                status: 'Confirmed'
            });
            setStatus('Confirmed');
            if (userDetail?.isBusinessOwner) {
                // Create notification for user when barber confirms
                await addDoc(collection(db, 'notifications'), {
                    userId: booking.email,
                    type: 'confirmed',
                    message: `Your booking for ${booking.services ? booking.services.map(s => s.name).join(', ') : booking.service} on ${booking.date} at ${booking.time} has been confirmed!`,
                    timestamp: Date.now(),
                    read: false,
                    bookingId: booking.id
                });
            }
            if (onStatusUpdate) {
                onStatusUpdate();
            }
        } catch (error) {
            console.log("Error confirming booking:", error);
        }
    };

    // This function lets the user leave a review for a completed booking.
    // It updates the booking, recalculates the business's average rating, and sends a notification.
    const submitReview = async () => {
        try {
            await updateDoc(doc(db, "salon_booking", booking.id), {
                review: {
                    rating,
                    comment,
                    date: new Date().toISOString()
                }
            });

            // Get all completed bookings for this business
            const bookingRef = collection(db, "salon_booking");
            const q = query(bookingRef, 
                where("businessId", "==", booking.businessId),
                where("status", "==", "Completed")
            );
            const querySnapshot = await getDocs(q);
            let totalRating = 0;
            let reviewCount = 0;
            
            querySnapshot.forEach((doc) => {
                const bookingData = doc.data();
                if (bookingData.review) {
                    totalRating += bookingData.review.rating;
                    reviewCount++;
                }
            });
            
            // Calculate new average rating
            const averageRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : "0.0";
            
            // Update business with new average rating
            await updateDoc(doc(db, "salon_business", booking.businessId), {
                rating: averageRating
            });

            // Fetch business to get shop name
            const businessSnap = await getDocs(query(collection(db, 'salon_business'), where('id', '==', booking.businessId)));
            let shopName = '';
            if (!businessSnap.empty) {
                shopName = businessSnap.docs[0].data().name;
            }
            // Create notification for barber/business owner
            await addDoc(collection(db, 'notifications'), {
                barberId: booking.businessId,
                type: 'review',
                message: `${booking.name} left a review for ${shopName} (${booking.barberName}, ${booking.services ? booking.services.map(s => s.name).join(', ') : booking.service}): ${rating}/5${comment ? ' - ' + comment : ''}`,
                timestamp: Date.now(),
                read: false,
                bookingId: booking.id
            });

            setShowReviewModal(false);
            setRating(0);
            setComment('');
            if (onStatusUpdate) {
                onStatusUpdate();
            }
        } catch (error) {
            console.log("Error submitting review:", error);
        }
    };

    // This function lets the user or owner delete a booking after confirming.
    const deleteBooking = async () => {
        Alert.alert(
            "Delete Booking",
            "Are you sure you want to delete this booking?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "salon_booking", booking.id));
                            if (onStatusUpdate) {
                                onStatusUpdate();
                            }
                        } catch (error) {
                            console.log("Error deleting booking:", error);
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    // This function shows star icons for the review rating.
    const renderStars = () => {
        return (
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        style={{ marginHorizontal: 5 }}
                    >
                        <Ionicons
                            name={star <= rating ? "star" : "star-outline"}
                            size={30}
                            color={star <= rating ? "#FFD700" : "#000"}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <>
        <View style={{
            padding: 10,
            marginTop: 10,
            backgroundColor: Colors.WHITE,
            borderRadius: 15,
            display: 'flex',
            flexDirection: 'row', 
            gap: 10
        }}>
            <TouchableOpacity 
                style={{
                    flexDirection: 'row',
                    flex: 1,
                    gap: 10
                }}
                onPress={() => router.push({
                    pathname: '/business-detail',
                    params: {
                        business: JSON.stringify(booking?.business)
                    }
                })}
            >
                <Image source={{ uri: booking?.business?.banner }} alt='banner'
                    style={{
                        width: 100,
                        height: 100,
                        borderRadius: 15
                    }}
                />
                <View style={{
                    display: 'flex',
                    gap: 5,
                    flex: 1
                }}>
                    <Text style={{
                        fontFamily: 'outfit-bold',
                        fontSize: 17,
                    }}>{booking?.business.name}</Text>
                    <Text style={{ color: Colors.GARY }}>📍{booking?.business?.address}</Text>
                    <Text style={{ color: Colors.GARY }}>🕒 {booking?.date} at {booking?.time}</Text>
                    <Text style={{ color: Colors.GARY }}>✂️ {booking?.services ? booking.services.map(s => s.name).join(', ') : booking.service}</Text>
                    <Text style={{ color: Colors.GARY }}>👤 {booking?.barberName}</Text>
                    {booking?.review && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: Colors.GARY }}>⭐ {booking.review.rating}/5</Text>
                            {booking.review.comment && (
                                <Text style={{ color: Colors.GARY, marginLeft: 5 }}>- {booking.review.comment}</Text>
                            )}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <View>
                    {status === 'Completed' ? (
                        <Text
                            style={{
                                padding: 3,
                                backgroundColor: Colors.GARY,
                                color: Colors.WHITE,
                                paddingHorizontal: 10,
                                borderRadius: 3,
                            }}
                        >
                            Completed
                        </Text>
                    ) : status === 'Cancelled' ? (
                        <Text
                            style={{
                                padding: 3,
                                backgroundColor: '#dc3545',
                                color: Colors.WHITE,
                                paddingHorizontal: 10,
                                borderRadius: 3,
                            }}
                        >
                            Cancelled
                        </Text>
                    ) : status === 'Confirmed' ? (
                        <Text
                            style={{
                                padding: 3,
                                backgroundColor: Colors.GREEN,
                                color: Colors.WHITE,
                                paddingHorizontal: 10,
                                borderRadius: 3,
                            }}
                        >
                            Confirmed
                        </Text>
                    ) : (
                        <Text
                            style={{
                                padding: 3,
                                backgroundColor: Colors.GREEN,
                                color: Colors.WHITE,
                                paddingHorizontal: 10,
                                borderRadius: 3,
                            }}
                        >
                            {status}
                        </Text>
                    )}
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {status === 'Pending' && userDetail?.isBusinessOwner && (
                        <TouchableOpacity
                            onPress={confirmBooking}
                            style={{
                                backgroundColor: Colors.GREEN,
                                padding: 5,
                                borderRadius: 5,
                            }}
                        >
                            <Text style={{ color: Colors.WHITE }}>Confirm</Text>
                        </TouchableOpacity>
                    )}
                    {status === 'Pending' && (
                        <TouchableOpacity
                            onPress={cancelBooking}
                            style={{
                                backgroundColor: '#dc3545',
                                padding: 5,
                                borderRadius: 5,
                            }}
                        >
                            <Text style={{ color: Colors.WHITE }}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                    {status === 'Confirmed' && userDetail?.isBusinessOwner && (
                        <TouchableOpacity
                            onPress={markAsCompleted}
                            style={{
                                backgroundColor: Colors.PRIMARY,
                                padding: 5,
                                borderRadius: 5,
                            }}
                        >
                            <Text style={{ color: Colors.WHITE }}>Complete</Text>
                        </TouchableOpacity>
                    )}
                    {status === 'Completed' && !booking?.review && !userDetail?.isBusinessOwner && (
                        <TouchableOpacity
                            onPress={() => setShowReviewModal(true)}
                            style={{
                                backgroundColor: Colors.PRIMARY,
                                padding: 5,
                                borderRadius: 5,
                            }}
                        >
                            <Text style={{ color: Colors.WHITE }}>Leave Review</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>

        <Modal
            visible={showReviewModal}
            transparent={true}
            animationType="slide"
        >
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)'
            }}>
                <View style={{
                    backgroundColor: Colors.WHITE,
                    padding: 20,
                    borderRadius: 10,
                    width: '80%'
                }}>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        marginBottom: 10,
                        textAlign: 'center'
                    }}>Rate Your Experience</Text>
                    {renderStars()}
                    <TextInput
                        style={{
                            borderWidth: 1,
                            borderColor: '#ddd',
                            borderRadius: 5,
                            padding: 10,
                            marginTop: 10,
                            height: 100,
                            textAlignVertical: 'top'
                        }}
                        placeholder="Write your review (optional)"
                        multiline
                        value={comment}
                        onChangeText={setComment}
                    />
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 20
                    }}>
                        <TouchableOpacity
                            onPress={() => {
                                setShowReviewModal(false);
                                setRating(0);
                                setComment('');
                            }}
                            style={{
                                padding: 10,
                                backgroundColor: Colors.GARY,
                                borderRadius: 5,
                                width: '45%'
                            }}
                        >
                            <Text style={{ color: Colors.WHITE, textAlign: 'center' }}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={submitReview}
                            style={{
                                padding: 10,
                                backgroundColor: Colors.PRIMARY,
                                borderRadius: 5,
                                width: '45%'
                            }}
                        >
                            <Text style={{ color: Colors.WHITE, textAlign: 'center' }}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
        </>
    );
}

export default BookingCard;