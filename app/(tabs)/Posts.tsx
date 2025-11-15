
import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Share,
  Dimensions,
  Animated,
} from 'react-native';
import { db } from '../../firebaseconfig';
import { ref, onValue, off, set, get } from 'firebase/database';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { SearchBarContext } from './_layout';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { useRouter } from 'expo-router';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  date?: string;
  imageUrl?: string;
  pdfUrl?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  type: string;
  path: string;
}

type ContentType = 'post' | 'book' | 'qp' | 'material';

export default function PostsScreen() {
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [books, setBooks] = useState<ContentItem[]>([]);
  const [qps, setQps] = useState<ContentItem[]>([]);
  const [materials, setMaterials] = useState<ContentItem[]>([]);
  const [commentCounts, setCommentCounts] = useState<{ [itemId: string]: number }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageHeights, setImageHeights] = useState<{ [uri: string]: number }>({});
  const [selectedCategory, setSelectedCategory] = useState<ContentType>('post');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const inputRef = useRef<TextInput>(null);
  const { setShowSearchBarCallback } = useContext(SearchBarContext);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;

  
  useEffect(() => {
    
    const postsRef = ref(db, 'posts');
    const postsListener = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr: ContentItem[] = Object.keys(data).map((key) => ({
          id: key,
          title: data[key].title,
          content: data[key].content,
          date: data[key].date,
          imageUrl: data[key].imageUrl,
          likes: data[key].likes || 0,
          shares: data[key].shares || 0,
          type: 'post',
          path: `posts/${key}`
        }));
        setPosts(arr.reverse());
      } else {
        setPosts([]);
      }
    });

    
    const fetchBooks = () => {
      const coursesRef = ref(db, 'courses');
      onValue(coursesRef, (coursesSnapshot) => {
        const coursesData = coursesSnapshot.val();
        if (!coursesData) {
          setBooks([]);
          return;
        }

        const allBooks: ContentItem[] = [];
        const coursePromises: Promise<void>[] = [];

        Object.keys(coursesData).forEach((courseKey) => {
          const booksRef = ref(db, `courses/${courseKey}/books`);
          const promise = new Promise<void>((resolve) => {
            onValue(booksRef, (booksSnapshot) => {
              const booksData = booksSnapshot.val();
              if (booksData) {
                Object.keys(booksData).forEach((semesterKey) => {
                  const semesterRef = ref(db, `courses/${courseKey}/books/${semesterKey}`);
                  onValue(semesterRef, (semesterSnapshot) => {
                    const semesterData = semesterSnapshot.val();
                    if (semesterData) {
                      Object.keys(semesterData).forEach((bookKey) => {
                        const book = semesterData[bookKey];
                        if (book && book.name) {
                          allBooks.push({
                            id: `${courseKey}-${semesterKey}-${bookKey}`,
                            title: book.name,
                            content: book.description || '',
                            date: book.date || '',
                            imageUrl: book.coverUrl,
                            pdfUrl: book.pdfUrl,
                            likes: book.likes || 0,
                            shares: book.shares || 0,
                            type: 'book',
                            path: `courses/${courseKey}/books/${semesterKey}/${bookKey}`
                          });
                        }
                      });
                    }
                    resolve();
                  });
                });
              } else {
                resolve();
              }
            });
          });
          coursePromises.push(promise);
        });

        Promise.all(coursePromises).then(() => {
          setBooks(allBooks.reverse());
        });
      });
    };

    
    const fetchQPs = () => {
      const coursesRef = ref(db, 'previousYearQP');
      onValue(coursesRef, (coursesSnapshot) => {
        const coursesData = coursesSnapshot.val();
        if (!coursesData) {
          setQps([]);
          return;
        }

        const allQPs: ContentItem[] = [];
        const coursePromises: Promise<void>[] = [];

        Object.keys(coursesData).forEach((courseKey) => {
          const semsRef = ref(db, `previousYearQP/${courseKey}`);
          const promise = new Promise<void>((resolve) => {
            onValue(semsRef, (semsSnapshot) => {
              const semsData = semsSnapshot.val();
              if (semsData) {
                Object.keys(semsData).forEach((semesterKey) => {
                  const subjectsRef = ref(db, `previousYearQP/${courseKey}/${semesterKey}`);
                  onValue(subjectsRef, (subjectsSnapshot) => {
                    const subjectsData = subjectsSnapshot.val();
                    if (subjectsData) {
                      Object.keys(subjectsData).forEach((subjectKey) => {
                        const datesRef = ref(db, `previousYearQP/${courseKey}/${semesterKey}/${subjectKey}`);
                        onValue(datesRef, (datesSnapshot) => {
                          const datesData = datesSnapshot.val();
                          if (datesData) {
                            Object.keys(datesData).forEach((dateKey) => {
                              const qp = datesData[dateKey];
                              if (qp && qp.name) {
                                allQPs.push({
                                  id: `${courseKey}-${semesterKey}-${subjectKey}-${dateKey}`,
                                  title: qp.name,
                                  content: qp.description || '',
                                  date: dateKey,
                                  imageUrl: qp.previewUrl,
                                  pdfUrl: qp.pdfUrl,
                                  likes: qp.likes || 0,
                                  shares: qp.shares || 0,
                                  type: 'qp',
                                  path: `previousYearQP/${courseKey}/${semesterKey}/${subjectKey}/${dateKey}`
                                });
                              }
                            });
                          }
                          resolve();
                        });
                      });
                    } else {
                      resolve();
                    }
                  });
                });
              } else {
                resolve();
              }
            });
          });
          coursePromises.push(promise);
        });

        Promise.all(coursePromises).then(() => {
          setQps(allQPs.reverse());
        });
      });
    };

    
    const fetchMaterials = () => {
      const coursesRef = ref(db, 'extraMaterial');
      onValue(coursesRef, (coursesSnapshot) => {
        const coursesData = coursesSnapshot.val();
        if (!coursesData) {
          setMaterials([]);
          return;
        }

        const allMaterials: ContentItem[] = [];
        const coursePromises: Promise<void>[] = [];

        Object.keys(coursesData).forEach((courseKey) => {
          const semsRef = ref(db, `extraMaterial/${courseKey}`);
          const promise = new Promise<void>((resolve) => {
            onValue(semsRef, (semsSnapshot) => {
              const semsData = semsSnapshot.val();
              if (semsData) {
                Object.keys(semsData).forEach((semesterKey) => {
                  const subjectsRef = ref(db, `extraMaterial/${courseKey}/${semesterKey}`);
                  onValue(subjectsRef, (subjectsSnapshot) => {
                    const subjectsData = subjectsSnapshot.val();
                    if (subjectsData) {
                      Object.keys(subjectsData).forEach((subjectKey) => {
                        const materialsRef = ref(db, `extraMaterial/${courseKey}/${semesterKey}/${subjectKey}`);
                        onValue(materialsRef, (materialsSnapshot) => {
                          const materialsData = materialsSnapshot.val();
                          if (materialsData) {
                            Object.keys(materialsData).forEach((materialKey) => {
                              const material = materialsData[materialKey];
                              if (material && material.name) {
                                allMaterials.push({
                                  id: `${courseKey}-${semesterKey}-${subjectKey}-${materialKey}`,
                                  title: material.name,
                                  content: material.description || '',
                                  date: material.date || '',
                                  imageUrl: material.previewUrl,
                                  pdfUrl: material.pdfUrl,
                                  likes: material.likes || 0,
                                  shares: material.shares || 0,
                                  type: 'material',
                                  path: `extraMaterial/${courseKey}/${semesterKey}/${subjectKey}/${materialKey}`
                                });
                              }
                            });
                          }
                          resolve();
                        });
                      });
                    } else {
                      resolve();
                    }
                  });
                });
              } else {
                resolve();
              }
            });
          });
          coursePromises.push(promise);
        });

        Promise.all(coursePromises).then(() => {
          setMaterials(allMaterials.reverse());
          setLoading(false);
        });
      });
    };

    fetchBooks();
    fetchQPs();
    fetchMaterials();

    return () => {
      off(postsRef, 'value', postsListener);
    };
  }, []);

  
  useEffect(() => {
    const allItems = [...posts, ...books, ...qps, ...materials];
    allItems.forEach((item) => {
      const commentsRef = ref(db, `postcom/${item.id}`);
      onValue(commentsRef, (snapshot) => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        setCommentCounts((prev) => ({ ...prev, [item.id]: count }));
      });
    });
  }, [posts, books, qps, materials]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  
  useEffect(() => {
    const showSearchBar = () => {
      setShowSearch(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
      });
    };
    setShowSearchBarCallback(showSearchBar);
    return () => setShowSearchBarCallback(null);
  }, []);

  const handleBlur = () => {
    setShowSearch(false);
    setSearch('');
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  
  const getContentByCategory = () => {
    switch (selectedCategory) {
      case 'post': return posts;
      case 'book': return books;
      case 'qp': return qps;
      case 'material': return materials;
      default: return posts;
    }
  };

  
  const filteredContent = getContentByCategory().filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase())
  );

  
  const timeAgo = (dateString?: string) => {
    if (!dateString) return '';

    try {
      
      let postDate: Date;
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/').map(Number);
        postDate = new Date(year, month - 1, day);
      } else {
        postDate = new Date(dateString);
      }

      const now = new Date();
      const diffMs = now.getTime() - postDate.getTime();
      const seconds = diffMs / 1000;
      const minutes = seconds / 60;
      const hours = minutes / 60;
      const days = hours / 24;

      if (days < 1) return `${Math.floor(hours)} hours ago`;
      if (days < 7) return `${Math.floor(days)} days ago`;
      if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
      if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
      return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`;
    } catch (e) {
      return '';
    }
  };

  const handleLike = async (type: string, path: string, currentLikes: number) => {
    const likesRef = ref(db, `${path}/likes`);
    try {
      await set(likesRef, currentLikes + 1);
    } catch (error) {
      console.log(error);
    }
  };

  const handleShare = async (item: ContentItem) => {
    try {
      await Share.share({
        message: `${item.title}\n\n${item.content}\n\n${item.pdfUrl || item.imageUrl || ''}`,
      });
      const shareRef = ref(db, `${item.path}/shares`);
      const snapshot = await get(shareRef);
      const currentShares = snapshot.val() || 0;
      await set(shareRef, currentShares + 1);
    } catch (error) {
      console.log(error);
    }
  };

  const getIconName = (type: string) => {
    switch(type) {
      case 'book': return 'book-outline';
      case 'qp': return 'document-text-outline';
      case 'material': return 'folder-outline';
      default: return 'newspaper-outline';
    }
  };

  const navigateToItem = (item: ContentItem) => {
  if (item.type === 'post') {
    router.push({ pathname: '/postView', params: { postId: item.id } } as any);
  } else if (item.pdfUrl) {
    
    router.push({ 
      pathname: '/(tabs)/BookViewer', 
      params: { 
        url: item.pdfUrl,
        title: item.title
      } 
    } as any);
  }
  
};

  const CategoryButton = ({ type, label }: { type: ContentType, label: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === type && styles.categoryButtonActive
      ]}
      onPress={() => setSelectedCategory(type)}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === type && styles.categoryButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60] 
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#0b2d5fff' }}>
  {}
  <View style={styles.categoryContainer}>
    <CategoryButton type="post" label="Posts" />
    <CategoryButton type="book" label="Books" />
    <CategoryButton type="qp" label="Question Papers" />
    <CategoryButton type="material" label="Extra Material" />
  </View>

  {}
  {showSearch && (
    <Animatable.View 
      animation="fadeInDown" 
      duration={200} 
      style={styles.searchContainer}
    >
      <TextInput
        ref={inputRef}
        style={styles.searchInput}
        placeholder={`Search ${selectedCategory}s...`}
        value={search}
        onChangeText={setSearch}
        onBlur={handleBlur}
      />
    </Animatable.View>
  )}

  <Animated.ScrollView
    style={[styles.container, { transform: [{ translateY }] }]}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
  >
        {loading ? (
          [...Array(4)].map((_, i) => (
            <View key={i} style={{ marginBottom: 18 }}>
              <ShimmerPlaceholder
                width={screenWidth - 15}
                height={30}
                style={{ marginBottom: 6, borderRadius: 6 }}
                shimmerColors={['#2e5483ff', '#2a4764ff', '#365b8aff']}
              />
              <ShimmerPlaceholder
                width={screenWidth - 15}
                height={20}
                style={{ marginBottom: 10, borderRadius: 6 }}
                shimmerColors={['#325886ff', '#2a4764ff', '#4c8cd9']}
              />
              <ShimmerPlaceholder
                width={screenWidth - 15}
                height={200}
                style={{ marginBottom: 12, borderRadius: 12 }}
                shimmerColors={['#325a8bff', '#2a4764ff', '#345f92ff']}
              />
            </View>
          ))
        ) : filteredContent.length === 0 ? (
          <Text style={styles.noPosts}>
            {search ? `No ${selectedCategory}s found for "${search}"` : `No ${selectedCategory}s found`}
          </Text>
        ) : (
          filteredContent.map((item) => (
            <View key={`${item.type}-${item.id}`} style={styles.postCard}>
              <View style={styles.headerRow}>
                <Ionicons name={getIconName(item.type)} size={22} color="#fff" />
                <Text style={styles.postTitle}>{item.title}</Text>
              </View>

              {}
              {item.imageUrl &&
                (item.imageUrl as string)
                  .split(',')
                  .map((img, idx) => {
                    const imgHeight = imageHeights[img] || 200;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => navigateToItem(item)}
                      >
                        <Image
                          source={{ uri: img }}
                          style={{
                            width: screenWidth - 32,
                            height: imgHeight,
                            borderRadius: 12,
                            marginBottom: 12,
                          }}
                          resizeMode="cover"
                          onLoad={() => {
                            Image.getSize(img, (width, height) => {
                              const ratio = width / height;
                              setImageHeights((prev) => ({ ...prev, [img]: (screenWidth - 32) / ratio }));
                            });
                          }}
                        />
                      </TouchableOpacity>
                    );
                  })}

              {}
              <TouchableOpacity
                onPress={() => navigateToItem(item)}
              >
                <Text style={styles.postContent}>
                  {item.content.length > 100 ? item.content.slice(0, 100) + '... Read more' : item.content}
                </Text>
              </TouchableOpacity>

              {}
<View style={styles.actionRow}>
  {}
  <TouchableOpacity
    style={styles.actionBtn}
    onPress={() => handleLike(item.type, item.path, item.likes || 0)}
  >
    <Ionicons name="heart-outline" size={22} color="#fff" />
    <Text style={styles.actionText}>{item.likes || 0}</Text>
  </TouchableOpacity>

  {}
  {item.type === 'post' && (
    <>
      {}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigateToItem(item)}
      >
        <Ionicons name="chatbubble-outline" size={22} color="#fff" />
        <Text style={styles.actionText}>{commentCounts[item.id] || 0}</Text>
      </TouchableOpacity>

      {}
      <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
        <Feather name="share" size={22} color="#fff" />
        <Text style={styles.actionText}>{item.shares || 0}</Text>
      </TouchableOpacity>
    </>
  )}

  {}
  {item.type !== 'qp' && (
    <Text style={styles.timeText}>{timeAgo(item.date)}</Text>
  )}
</View>
            </View>
          ))
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
  flex: 1, 
  padding: 8, 
  backgroundColor: '#0b2d5fff', 
},
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#0b2d5fff',
    borderBottomWidth: 1,
    borderBottomColor: '#1e4075',
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1e4075',
  },
  categoryButtonActive: {
    backgroundColor: '#578fc7ff',
  },
  categoryButtonText: {
    color: '#a0a0a0',
    fontSize: 12,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    position: 'absolute',
    top: 60, 
    left: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: '#3c5488ff',
    borderRadius: 12,
    elevation: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: { 
    fontSize: 15, 
    color: '#cfcfcfff', 
    padding: 8 
  },
  noPosts: { 
    textAlign: 'center', 
    marginTop: 40, 
    color: '#777', 
    fontSize: 16 
  },
  postCard: {
    backgroundColor: '#578fc7ff',
    padding: 10,
    borderRadius: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  postTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#fff', 
    marginLeft: 8, 
    flexShrink: 1 
  },
  postContent: { 
    fontSize: 15, 
    color: '#fff', 
    lineHeight: 22, 
    marginBottom: 8 
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 'auto',
  },
});
