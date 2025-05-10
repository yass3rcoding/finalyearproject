import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { db } from '../../services/FirebaseConfig';
import { collection, getDocs, query, where, orderBy, updateDoc, doc, arrayUnion, arrayRemove, addDoc } from 'firebase/firestore';
import { UserDetailContext } from '../../context/UserDetailContext';
import { Heart } from 'lucide-react-native';

const PROFILE_PLACEHOLDER = 'https://ui-avatars.com/api/?background=random&name=Barber';

// This screen shows a feed of posts from barbershops the user follows
// Users can like posts, and barbers get notified when their post is liked
export default function Feed() {
  // Get the current logged-in user's details from context
  const { userDetail } = useContext(UserDetailContext);
  // State to show a loading spinner while fetching posts
  const [loading, setLoading] = useState(true);
  // State to store the list of posts in the feed
  const [posts, setPosts] = useState([]);
  // State to track which post is being liked/unliked (for showing spinner)
  const [likeLoading, setLikeLoading] = useState(''); // postId being liked/unliked

  // When the user logs in or changes, fetch the feed posts
  useEffect(() => {
    if (userDetail?.email) {
      fetchFeedPosts();
    }
  }, [userDetail]);

  // This function gets posts from barbershops the user follows and puts them in the feed.
  // It first finds which barbers the user follows, then gets their posts from the database.
  const fetchFeedPosts = async () => {
    setLoading(true);
    try {
      // 1. Get followed barbers by email
      const followsRef = collection(db, 'salon_follows');
      const followsQuery = query(followsRef, where('userEmail', '==', userDetail.email));
      const followsSnap = await getDocs(followsQuery);
      const followedBarberEmails = followsSnap.docs.map(doc => doc.data().barberEmail);
      console.log('Followed barber emails:', followedBarberEmails); // <-- Debug log

      if (followedBarberEmails.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      // 2. Get posts from followed barbers
      const postsRef = collection(db, 'barber_posts');
      // Firestore 'in' queries are limited to 10 items
      const postsQuery = query(postsRef, where('barberId', 'in', followedBarberEmails), orderBy('timestamp', 'desc'));
      const postsSnap = await getDocs(postsQuery);
      const postsList = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Fetched posts:', postsList); // <-- Debug log
      setPosts(postsList);
    } catch (error) {
      setPosts([]);
      console.log('Feed error:', error); // <-- Debug log
    } finally {
      setLoading(false);
    }
  };

  // This function is called when the user taps the heart button to like or unlike a post.
  // It updates the database and also sends a notification to the barber if the post is liked.
  const handleLike = async (postId, likes = []) => {
    if (!userDetail?.email) return;
    setLikeLoading(postId);
    const postRef = doc(db, 'barber_posts', postId);
    const hasLiked = likes.includes(userDetail.email);
    try {
      if (hasLiked) {
        // If already liked, remove the like
        await updateDoc(postRef, { likes: arrayRemove(userDetail.email) });
      } else {
        // If not liked, add the like
        await updateDoc(postRef, { likes: arrayUnion(userDetail.email) });
        // Fetch the post to get barberId and caption
        const postSnap = await getDocs(query(collection(db, 'barber_posts'), where('id', '==', postId)));
        let post = null;
        if (!postSnap.empty) {
          post = postSnap.docs[0].data();
        } else {
          // fallback: try to find in local posts array
          post = posts.find(p => p.id === postId);
        }
        // If the post has a businessId, send a notification to the barber
        if (post && post.businessId) {
          await addDoc(collection(db, 'notifications'), {
            barberId: post.businessId,
            type: 'like',
            message: `${userDetail?.name || 'A user'} liked your post: "${post.caption || ''}"`,
            timestamp: Date.now(),
            read: false,
            postId: postId
          });
        }
      }
      // Optimistically update UI
      setPosts(prevPosts => prevPosts.map(post =>
        post.id === postId
          ? { ...post, likes: hasLiked ? post.likes.filter(e => e !== userDetail.email) : [...(post.likes || []), userDetail.email] }
          : post
      ));
    } catch (error) {
      // Optionally show error
    } finally {
      setLikeLoading('');
    }
  };

  // Show a loading spinner while fetching posts
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // If the user is not logged in, show a message
  if (!userDetail?.email) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#888' }}>Please log in to see your feed.</Text>
      </View>
    );
  }

  // If there are no posts, show a message
  if (posts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#888' }}>No posts from barbers you follow yet.</Text>
      </View>
    );
  }

  // This is the main UI for the Feed screen
  return (
    <FlatList
      style={{ backgroundColor: '#fff' }}
      data={posts}
      keyExtractor={item => item.id}
      renderItem={({ item }) => {
        const likes = item.likes || [];
        const hasLiked = likes.includes(userDetail.email);
        return (
          <View style={styles.postCard}>
            {/* Header: Profile image, barber name, business name */}
            <View style={styles.headerRow}>
              <Image
                source={{ uri: PROFILE_PLACEHOLDER }}
                style={styles.profileImage}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.barberName}>{item.businessName || item.barberName || item.barberId}</Text>
              </View>
            </View>
            {/* Post image */}
            <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
            {/* Like button and count */}
            <View style={styles.likeRow}>
              <TouchableOpacity
                onPress={() => handleLike(item.id, likes)}
                disabled={likeLoading === item.id}
                style={{ marginRight: 8 }}
              >
                <Heart
                  size={26}
                  color={hasLiked ? '#e74c3c' : '#888'}
                  fill={hasLiked ? '#e74c3c' : 'none'}
                />
              </TouchableOpacity>
              <Text style={styles.likeCount}>{likes.length} {likes.length === 1 ? 'like' : 'likes'}</Text>
            </View>
            {/* Caption */}
            <Text style={styles.caption}>{item.caption}</Text>
            {/* Timestamp */}
            <Text style={styles.meta}>{item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : '...'}</Text>
          </View>
        );
      }}
    />
  );
}

// These are the styles for how everything looks on the screen
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  postCard: {
    backgroundColor: '#fff',
    marginVertical: 16,
    marginHorizontal: 8,
    borderRadius: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  barberName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
  },
  businessName: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 260,
    borderRadius: 0,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  likeCount: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
  },
  caption: {
    fontSize: 15,
    color: '#222',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  meta: {
    fontSize: 12,
    color: '#888',
    paddingHorizontal: 12,
    marginTop: 2,
  },
}); 