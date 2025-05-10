import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../services/FirebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { UserDetailContext } from '../../context/UserDetailContext';
import { Trash2, Heart } from 'lucide-react-native';

// This screen shows all the posts made by the business (barbershop) owner
// The owner can view, and delete posts from here
export default function Posts() {
  // Used to navigate between screens (not used here, but imported for consistency)
  const router = useRouter();
  // Get the current logged-in user's details from context
  const { userDetail } = useContext(UserDetailContext);
  // State to store the list of posts
  const [posts, setPosts] = useState([]);
  // State to show a loading spinner while fetching posts
  const [loading, setLoading] = useState(true);
  // State to track which post is being deleted (for showing spinner)
  const [deletingPostId, setDeletingPostId] = useState(null);

  // This function fetches all posts for the current business from the database
  const fetchBusinessPosts = async () => {
    try {
      const postsRef = collection(db, 'barber_posts');
      // Only get posts where the businessId matches the current user's business
      const q = query(postsRef, where('businessId', '==', userDetail?.businessId));
      const querySnapshot = await getDocs(q);
      // Convert the query results into a list of post objects
      const postsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsList);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  // When the screen loads or the user/business changes, fetch the posts
  useEffect(() => {
    if (userDetail?.businessId) {
      fetchBusinessPosts();
    }
  }, [userDetail]);

  // This function deletes a post from the database and updates the UI
  const handleDeletePost = async (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingPostId(postId); // Show spinner on the button
            try {
              await deleteDoc(doc(db, 'barber_posts', postId));
              setPosts(posts.filter(post => post.id !== postId)); // Remove from UI
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            } finally {
              setDeletingPostId(null); // Hide spinner
            }
          }
        }
      ]
    );
  };

  // If still loading, show a spinner
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // If there are no posts, show a message
  if (posts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Posts</Text>
        <View style={styles.contentContainer}>
          <Text style={styles.message}>No posts found. Create your first post to get started!</Text>
        </View>
      </View>
    );
  }

  // This is the main UI for the Posts screen
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Posts</Text>
      {/* List of all posts for this business */}
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            {/* Show the post image */}
            <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
            <View style={styles.postContent}>
              {/* Show the post caption */}
              <Text style={styles.caption}>{item.caption}</Text>
              <View style={styles.postMeta}>
                {/* Show the number of likes */}
                <View style={styles.likesContainer}>
                  <Heart size={16} color="#e74c3c" fill="#e74c3c" />
                  <Text style={styles.likesCount}>
                    {item.likes?.length || 0} {item.likes?.length === 1 ? 'like' : 'likes'}
                  </Text>
                </View>
                {/* Show the post timestamp */}
                <Text style={styles.timestamp}>
                  {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : '...'}
                </Text>
              </View>
              {/* Button to delete the post */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePost(item.id)}
                disabled={deletingPostId === item.id}
              >
                {deletingPostId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={20} color="#fff" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

// These are the styles for how everything looks on the screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 10,
    color: '#888',
    fontSize: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  postContent: {
    padding: 15,
  },
  caption: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
}); 