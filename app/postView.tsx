// app/postView.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Share,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { db } from '../firebaseconfig';
import { ref, onValue, off, push, set, update } from 'firebase/database';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Comment {
  id: string;
  text: string;
  date: string;
  likes?: number;
}

interface SizedImage {
  uri: string;
  height: number;
}

export default function PostDetail() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sizedImages, setSizedImages] = useState<SizedImage[]>([]);
  const screenWidth = Dimensions.get('window').width;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<TextInput | null>(null);

  // --- fetch post ---
  useEffect(() => {
    const postRef = ref(db, `posts/${postId}`);
    const listener = onValue(postRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPost(data);

        if (data.imageUrl) {
          const imgs = (data.imageUrl as string).split(',').map((s) => s.trim()).filter(Boolean);
          Promise.all(
            imgs.map(
              (uri: string) =>
                new Promise<SizedImage>((resolve) => {
                  Image.getSize(
                    uri,
                    (w, h) => resolve({ uri, height: (screenWidth - 32) * (h / w) }),
                    () => resolve({ uri, height: 200 })
                  );
                })
            )
          ).then(setSizedImages).catch(() => setSizedImages([]));
        } else {
          setSizedImages([]);
        }
      }
    });
    return () => off(postRef, 'value', listener);
  }, [postId, screenWidth]);

  // --- fetch comments ---
  useEffect(() => {
    const commentsRef = ref(db, `postcom/${postId}`);
    const listener = onValue(commentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const arr = Object.keys(data).map((key) => ({
          id: key,
          text: data[key].text || '',
          date: data[key].date || '',
          likes: data[key].likes || 0,
        }));
        setComments(arr.reverse());
      } else {
        setComments([]);
      }
    });
    return () => off(commentsRef, 'value', listener);
  }, [postId]);

  // --- keyboard listeners ---
  useEffect(() => {
    const onShow = (e: any) => setKeyboardHeight(e?.endCoordinates?.height ?? 0);
    const onHide = () => setKeyboardHeight(0);

    const showSub1 = Keyboard.addListener('keyboardWillShow', onShow);
    const hideSub1 = Keyboard.addListener('keyboardWillHide', onHide);
    const showSub2 = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub2 = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      showSub1.remove();
      hideSub1.remove();
      showSub2.remove();
      hideSub2.remove();
    };
  }, []);

  // --- share post ---
  // --- share post ---
const handleShare = async () => {
  if (!post) return;
  try {
    await Share.share({
      message: `${post.content}\n\n${post.imageUrl ? (post.imageUrl as string).split(',')[0] : ''}`,
    });

    // Increment share count
    const currentShares = post.shares || 0;
    const postRef = ref(db, `posts/${postId}`);
    await update(postRef, { shares: currentShares + 1 });
    
    // Optionally update local state to reflect immediately
    setPost({ ...post, shares: currentShares + 1 });
  } catch (err) {
    console.log('Share error', err);
  }
};

  // --- add comment ---
  const handleAddComment = async () => {
    const text = newComment.trim();
    if (!text) return;

    const commentsRef = ref(db, `postcom/${postId}`);
    const newRef = push(commentsRef);
    await set(newRef, {
      text,
      date: new Date().toISOString(),
      likes: 0,
    });

    setNewComment('');
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  // --- like a comment ---
  const handleLikeComment = async (commentId: string, currentLikes = 0) => {
    const commentRef = ref(db, `postcom/${postId}/${commentId}`);
    await update(commentRef, { likes: (currentLikes || 0) + 1 });
  };

  // --- like post ---
  const handleLikePost = async () => {
    const currentLikes = post?.likes || 0;
    const postRef = ref(db, `posts/${postId}`);
    await update(postRef, { likes: currentLikes + 1 });
  };

  // --- timeAgo function ---
  const timeAgo = (dateString?: string) => {
    if (!dateString || typeof dateString !== 'string') return '';
    let postDate: Date;
    if (dateString.includes('/')) {
      const [d, m, y] = dateString.split('/').map(Number);
      postDate = new Date(y, m - 1, d);
    } else {
      postDate = new Date(dateString);
    }
    if (isNaN(postDate.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - postDate.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days < 1) {
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return `${seconds}s ago`;
    }
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  };

  if (!post) return <Text style={styles.loadingText}>Loading...</Text>;

  const INPUT_CONTAINER_HEIGHT = 64;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: INPUT_CONTAINER_HEIGHT + 20 }}
        >
          <View style={styles.postCard}>
            <View style={styles.headerRow}>
              <Ionicons name="newspaper-outline" size={22} color="#fff" />
              <Text style={styles.postTitle}>{post.title}</Text>
            </View>

            {sizedImages.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img.uri }}
                style={{
                  width: screenWidth - 32,
                  height: img.height,
                  borderRadius: 12,
                  marginBottom: 10,
                  alignSelf: 'center',
                }}
                resizeMode="cover"
              />
            ))}

            <Text style={styles.postContent}>{post.content}</Text>

            {/* === Links (open in app/linkViewer) === */}
            {post.links && typeof post.links === 'object' && (
              <View style={styles.linksRow}>
                {Object.keys(post.links).map((key) => {
                  const link = post.links[key];
                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.linkBtn}
                      onPress={() =>
  router.push({
    pathname: './LinkViewer',
    params: {
      url: encodeURIComponent(link.url),
      name: link.name, // pass the link name
    },
  })
}

                    >
                      <Text style={styles.linkText}>{link.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLikePost}>
                <Ionicons name="heart-outline" size={22} color="#fff" />
                <Text style={styles.actionText}>{post.likes || 0}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setTimeout(() => inputRef.current?.focus(), 100)}
              >
                <Ionicons name="chatbubble-outline" size={22} color="#fff" />
                <Text style={styles.actionText}>{comments.length}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <Feather name="share" size={22} color="#fff" />
                <Text style={styles.actionText}>{post.shares || 0}</Text>
              </TouchableOpacity>

              <Text style={styles.timeText}>{typeof post.date === 'string' ? timeAgo(post.date) : ''}</Text>
            </View>
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.commentsHeader}>Comments</Text>
            {comments.length === 0 ? (
              <Text style={styles.noComments}>No comments yet</Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.commentCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons name="person-circle-outline" size={26} color="#fff" />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={styles.commentText}>{c.text}</Text>
                      <Text style={styles.commentDate}>
                        {typeof c.date === 'string' ? new Date(c.date).toLocaleString() : ''}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleLikeComment(c.id, c.likes)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}
                  >
                    <Ionicons name="heart-outline" size={18} color="#fff" />
                    <Text style={{ color: '#fff', marginLeft: 6 }}>{c.likes || 0}</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* === Input === */}
        <View
          style={[
            styles.inputWrapper,
            { bottom: keyboardHeight, height: INPUT_CONTAINER_HEIGHT },
          ]}
        >
          <TextInput
            ref={inputRef}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
            placeholderTextColor="#ddd"
            style={styles.commentInput}
            returnKeyType="send"
            onSubmitEditing={handleAddComment}
          />
          <TouchableOpacity onPress={handleAddComment} style={styles.sendBtn}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b2d5fff' },
  loadingText: { marginTop: 40, textAlign: 'center', fontSize: 16, color: '#777' },
  postCard: { backgroundColor: '#578fc7ff', padding: 12, borderRadius: 18, margin: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  postTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginLeft: 8, flexShrink: 1 },
  postContent: { fontSize: 15, color: '#fff', lineHeight: 22, marginBottom: 8 },

  linksRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, marginBottom: 10 },
  linkBtn: { backgroundColor: '#2d4d7aff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 6 },
  linkText: { color: '#fff', fontSize: 14 },

  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  actionText: { color: '#fff', fontSize: 14, marginLeft: 6 },
  timeText: { color: '#fff', fontSize: 12, fontStyle: 'italic', marginLeft: 'auto' },

  commentsSection: { paddingHorizontal: 16, marginTop: 10 },
  commentsHeader: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  noComments: { color: '#ddd', fontStyle: 'italic' },

  commentCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' },
  commentText: { color: '#fff', fontSize: 14 },
  commentDate: { fontSize: 11, color: '#ddd' },

  inputWrapper: { position: 'absolute', left: 0, right: 0, backgroundColor: '#2d4d7aff', paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', zIndex: 50, elevation: 20 },
  commentInput: { flex: 1, height: 44, paddingHorizontal: 12, backgroundColor: '#456aa0ff', borderRadius: 24, color: '#fff' },
  sendBtn: { marginLeft: 10 },
});
