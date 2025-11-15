// app/(tabs)/index.tsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  Keyboard,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { db } from '../../firebaseconfig';
import { ref, onValue, off } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Animatable from 'react-native-animatable';
import { SearchBarContext } from './_layout';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerProps {
  width?: number;
  height?: number;
  style?: any;
}

interface Notice { 
  id: string; 
  message: string; 
  bgColor?: string; 
  emojiColor?: string; 
}

interface Book { id: string; name: string; coverUrl?: string; pdfUrl: string; }
interface QP { id: string; name: string; pdfUrl: string; }
interface SubjectQP { subjectName: string; qps: QP[]; addLink?: string; }
interface AppLink {
  id: string;
  name: string;
  url?: string;        // for external links
  route?: string;      // for internal pages
  type?: "page" | "url";
  color?: string;
}
const ShimmerPlaceholder: React.FC<ShimmerProps> = ({ width, height, style }) => {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-1000, 1000],
  });

  return (
    <View style={[{ backgroundColor: '#e0e0e0', overflow: 'hidden', width, height }, style]}>
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['#e0e0e0', '#f5f5f5', '#e0e0e0']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};
import { Animated, Easing } from 'react-native';

export default function IndexScreen() {
  const router = useRouter();
  const { setShowSearchBarCallback } = useContext(SearchBarContext);
  const inputRef = useRef<TextInput>(null);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [mode, setMode] = useState<"books" | "qp" | "extra" | null>(null);
const [extraData, setExtraData] = useState<{ [sem: string]: SubjectQP[] }>({});
const [extraLoading, setExtraLoading] = useState(true);

  const [booksBySem, setBooksBySem] = useState<{[sem:string]: Book[]}>({});
  const [qpData, setQpData] = useState<{[sem:string]: SubjectQP[]}>({});
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [forceUpdateModal, setForceUpdateModal] = useState(false);
  const [apkUrl, setApkUrl] = useState<string | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [qpLoading, setQpLoading] = useState(true);
  const [booksTimeout, setBooksTimeout] = useState(false);
  const [qpTimeout, setQpTimeout] = useState(false);

  const [popupData, setPopupData] = useState<{
    heading: string;
    paragraph: string;
    imageUrl: string;
    linkText: string;
    linkUrl: string;
    flag: number;
  } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [welcomeBox, setWelcomeBox] = useState<any>(null);

  const [appLinks, setAppLinks] = useState<AppLink[]>([]);

  /** ------------------- FETCH DATA ------------------- **/
  useEffect(() => {
    const welcomeRef = ref(db, 'welcomeBox');
    const listener = onValue(welcomeRef, (snapshot) => setWelcomeBox(snapshot.val()));
    return () => off(welcomeRef, 'value', listener);
  }, []);

  useEffect(() => {
    const forceRef = ref(db, 'forceUpdate');
    const listener = onValue(forceRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.status === 0 && data?.apkUrl) {
        setApkUrl(data.apkUrl);
        setForceUpdateModal(true);
      }
    });
    return () => off(forceRef, 'value', listener);
  }, []);

  useEffect(() => {
    const popupRef = ref(db, 'popup');
    const listener = onValue(popupRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.flag === 1) { setPopupData(data); setShowPopup(true); }
    });
    return () => off(popupRef, 'value', listener);
  }, []);

  useEffect(() => {
    const showSearchBar = () => {
      setShowSearch(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };
    setShowSearchBarCallback(showSearchBar);
    return () => setShowSearchBarCallback(null);
  }, []);

  const handleBlur = () => { setShowSearch(false); setSearch(''); Keyboard.dismiss(); }

  useEffect(() => {
    const noticesRef = ref(db, 'notices');
    const listener = onValue(noticesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const DEFAULT_BG = "#eaf4ff";
        const DEFAULT_EMOJI = "#2E86DE";
        const mapped = Object.keys(data).map(k => ({
          id: k,
          message: data[k].message,
          bgColor: !data[k].bgColor || data[k].bgColor === "0" ? DEFAULT_BG : data[k].bgColor,
          emojiColor: !data[k].emojiColor || data[k].emojiColor === "0" ? DEFAULT_EMOJI : data[k].emojiColor,
        }));
        setNotices(mapped);
      }
    });
    return () => off(noticesRef, 'value', listener);
  }, []);

  useEffect(() => {
    const coursesRef = ref(db, 'courses');
    const listener = onValue(coursesRef, (snapshot) => { const data = snapshot.val(); if(data) setCourses(Object.keys(data)); });
    return () => off(coursesRef, 'value', listener);
  }, []);

  /** ------------------- FETCH BOOKS SEM-WISE ------------------- **/
  useEffect(() => {
  if (!selectedCourse || mode !== "books") return;
  setBooksLoading(true); // start loading
  const courseBooksRef = ref(db, `courses/${selectedCourse}/books`);
  const listener = onValue(courseBooksRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const semData: {[sem:string]: Book[]} = {};
      Object.keys(data).forEach(sem => {
        const booksArr = Object.keys(data[sem]).map(key => ({
          id: key,
          name: data[sem][key].name || 'Unknown',
          coverUrl: data[sem][key].coverUrl,
          pdfUrl: data[sem][key].pdfUrl
        }));
        semData[sem] = booksArr;
      });
      setBooksBySem(semData);
    } else {
      setBooksBySem({});
    }
    setBooksLoading(false); // done loading
  });
  return () => off(courseBooksRef, 'value', listener);
}, [selectedCourse, mode]);

  useEffect(() => {
    const coursesRef = ref(db, 'courses');
    const listener = onValue(coursesRef, (snapshot) => {
      const data = snapshot.val();
      if(data){
        const booksArr: Book[] = [];
        Object.keys(data).forEach(course => {
          const courseBooks = data[course].books;
          if(courseBooks){
            Object.keys(courseBooks).forEach(sem => {
              Object.keys(courseBooks[sem]).forEach(key => {
                const b = courseBooks[sem][key];
                booksArr.push({
                  id: `${course}_${sem}_${key}`,
                  name: b.name || 'Unknown',
                  coverUrl: b.coverUrl,
                  pdfUrl: b.pdfUrl
                });
              });
            });
          }
        });

        for (let i = booksArr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [booksArr[i], booksArr[j]] = [booksArr[j], booksArr[i]];
        }

        setAllBooks(booksArr);
      }
    });
    return () => off(coursesRef, 'value', listener);
  }, []);

  /** ------------------- FETCH QP SEM-WISE ------------------- **/
  useEffect(() => {
  if (!selectedCourse || mode !== "qp") return;
  setQpLoading(true); // start loading
  const qpRef = ref(db, `previousYearQP/${selectedCourse}`);
  const listener = onValue(qpRef, (snapshot) => {
    const data = snapshot.val();
    if(data){
      const semData: {[sem:string]: SubjectQP[]} = {};
      Object.keys(data).forEach(sem => {
        const subjects = Object.keys(data[sem]);
        const semSubjects: SubjectQP[] = subjects.map(subject => {
          const qps = data[sem][subject] ? Object.keys(data[sem][subject]).map(k => ({
            id: k, name: data[sem][subject][k].name, pdfUrl: data[sem][subject][k].pdfUrl
          })) : [];
          const addLink = qps.length === 0 ? data[sem][subject]?.addLink : undefined;
          return { subjectName: subject, qps, addLink };
        });
        semData[sem] = semSubjects;
      });
      setQpData(semData);
    } else {
      setQpData({});
    }
    setQpLoading(false); // done loading
  });
  return () => off(qpRef, 'value', listener);
}, [selectedCourse, mode]);
// ------------------- FETCH EXTRA MATERIAL -------------------
useEffect(() => {
  if (!selectedCourse || mode !== "extra") return;
  setExtraLoading(true);
  const extraRef = ref(db, `extraMaterial/${selectedCourse}`);
  const listener = onValue(extraRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const semData: { [sem: string]: SubjectQP[] } = {};
      Object.keys(data).forEach((sem) => {
        const subjects = Object.keys(data[sem]);
        const semSubjects: SubjectQP[] = subjects.map((subject) => {
          const qps = data[sem][subject]
            ? Object.keys(data[sem][subject]).map((k) => ({
                id: k,
                name: data[sem][subject][k].name,
                pdfUrl: data[sem][subject][k].pdfUrl,
              }))
            : [];
          const addLink =
            qps.length === 0 ? data[sem][subject]?.addLink : undefined;
          return { subjectName: subject, qps, addLink };
        });
        semData[sem] = semSubjects;
      });
      setExtraData(semData);
    } else {
      setExtraData({});
    }
    setExtraLoading(false);
  });
  return () => off(extraRef, "value", listener);
}, [selectedCourse, mode]);

  /** ------------------- FETCH APP LINKS ------------------- **/
  useEffect(() => {
    const linksRef = ref(db, 'appLinks');
    const listener = onValue(linksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const linksArr: AppLink[] = Object.keys(data).map(key => ({
          id: key,
          name: data[key].name,
          url: data[key].url,
          color: !data[key].color || data[key].color === "0" 
            ? "#2E86DE"
            : data[key].color
        }));
        setAppLinks(linksArr);
      }
    });
    return () => off(linksRef, 'value', listener);
  }, []);

  /** ------------------- CLICK HANDLERS ------------------- **/
  const handleBookClick = (book: Book) => router.push({ pathname: '/(tabs)/BookViewer', params: { url: book.pdfUrl } });
  const handleQpClick = (qp: QP) => router.push({ pathname: '/(tabs)/BookViewer', params: { url: qp.pdfUrl } });
  const handleLinkClick = (link: AppLink) => {
    router.push({
      pathname: './LinkViewer',
      params: { url: link.url, title: link.name }
    });
  };

  const filteredNotices = notices.filter(n => n.message.toLowerCase().includes(search.toLowerCase()));

  const getShortForm = (name?: string) => {
    if (!name) return ''; 
    const words = name.trim().split(' ');
    if(words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return words.map(w => w[0].toUpperCase()).join('');
  }

  /** ------------------- RENDER ------------------- **/
  const numColumns = 2;
  const screenWidth = Dimensions.get('window').width;
  const buttonWidth = (screenWidth - 50) / numColumns; 

  return (
    <View style={{ flex: 1 }}>
      {/* FORCE UPDATE MODAL */}
      <Modal visible={forceUpdateModal} transparent animationType="fade" hardwareAccelerated>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Image source={require('../../assets/logo_dark.png')} style={styles.logo} />
            <Text style={styles.title}>Update Required</Text>
            <Text style={styles.text}>Please update the app to continue using it.</Text>
            <TouchableOpacity style={styles.updateButton} onPress={() => apkUrl && Linking.openURL(apkUrl)}>
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* POPUP */}
      {showPopup && popupData && (
        <Modal transparent animationType="fade" visible={showPopup}>
          <View style={popupStyles.overlay}>
            <Animatable.View animation="fadeInUp" duration={400} style={popupStyles.popupContainer}>
              <TouchableOpacity style={popupStyles.closeButton} onPress={() => setShowPopup(false)}>
                <Ionicons name="close-circle" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={popupStyles.heading}>{popupData.heading}</Text>
              <Image source={{ uri: popupData.imageUrl }} style={popupStyles.image} />
              <Text style={popupStyles.paragraph}>{popupData.paragraph}</Text>
              <TouchableOpacity onPress={() => Linking.openURL(popupData.linkUrl)}>
                <Animatable.Text animation="pulse" iterationCount="infinite" style={popupStyles.linkText}>
                  {popupData.linkText}
                </Animatable.Text>
              </TouchableOpacity>
            </Animatable.View>
          </View>
        </Modal>
      )}

      {/* SEARCH BAR */}
      {showSearch && (
        <Animatable.View animation="fadeInDown" duration={200} style={styles.searchContainer}>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
            onBlur={handleBlur}
          />
        </Animatable.View>
      )}

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 5 }}>
        {/* WELCOME BOX */}
        {welcomeBox?.flag !== undefined && welcomeBox?.show === 1 && (
          <View style={styles.welcomeBox}>
            {welcomeBox.imageUrl && <Image source={{ uri: welcomeBox.imageUrl }} style={styles.welcomeImage} />}
            {welcomeBox.header && <Text style={styles.welcomeHeader}>{welcomeBox.header}</Text>}
            {welcomeBox.text1 && <Text style={styles.welcomeText}>{welcomeBox.text1}</Text>}
            {welcomeBox.text2 && <Text style={styles.welcomeText}>{welcomeBox.text2}</Text>}
          </View>
        )}

        {/* Notices */}
        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>📢 Notices</Text>
        {filteredNotices.length === 0
  ? (
    // ✅ Shimmer Loader for Notices
    <View style={{ marginVertical: 10 }}>
      {[...Array(2)].map((_, i) => (
        <ShimmerPlaceholder 
          key={i} 
          width={330} 
          height={50} 
          style={{ marginVertical: 5, borderRadius: 10 }} 
        />
      ))}
    </View>
  )
  : filteredNotices.map(n => (
      <Animatable.View key={n.id} animation="fadeInUp" duration={500} style={[styles.noticeCard, { backgroundColor: n.bgColor }]}>
        <Ionicons name="notifications" size={20} color={n.emojiColor} />
        <Text style={styles.noticeText}>{n.message}</Text>
      </Animatable.View>
    ))
}


        {/* App Links */}
        {appLinks.length === 0
  ? (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', marginBottom: 10 }}>
      {[...Array(4)].map((_, i) => (
        <ShimmerPlaceholder
          key={i}
          width={buttonWidth} // match button width
          height={40}        // approximate button height
          style={{ marginVertical: 5, borderRadius: 10 }}
        />
      ))}
    </View>
  )
  : (
    <FlatList
      data={appLinks}
      keyExtractor={item => item.id}
      numColumns={2}
      scrollEnabled={false}
      columnWrapperStyle={{ justifyContent: 'space-evenly', marginBottom: -10 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[linkButtonStyles.button, { width: buttonWidth, marginTop:15, backgroundColor: item.color || '#2E86DE' }]}
          onPress={() => handleLinkClick(item)}
        >
          <Text style={linkButtonStyles.buttonText}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  )
}


        {/* Courses */}
        <Text style={styles.sectionTitle}>📚 Courses</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {courses.length === 0
  ? (
    // ✅ Shimmer Loader for Courses
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
      {[...Array(5)].map((_, i) => (
        <ShimmerPlaceholder 
          key={i} 
          width={55} 
          height={40} 
          style={{ marginRight: 10, borderRadius: 8 }} 
        />
      ))}
    </ScrollView>
  )
  : courses.map(c => (
      <TouchableOpacity
        key={c}
        style={[styles.courseButton, selectedCourse === c && styles.activeButton]}
        onPress={() => { 
          setSelectedCourse(c); setMode(null); setBooksBySem({}); setQpData({});
        }}
      >
        <Text style={[styles.buttonText, selectedCourse === c && styles.activeButtonText]}>{c.toUpperCase()}</Text>
      </TouchableOpacity>
    ))
}

        </ScrollView>

        {/* Mode Selection */}
        {selectedCourse && !mode && (
          <View>
            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Choose</Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.courseButton} onPress={() => setMode("books")}><Text style={styles.buttonText}>Books</Text></TouchableOpacity>
              <TouchableOpacity style={styles.courseButton} onPress={() => setMode("qp")}><Text style={styles.buttonText}>Previous Year QP</Text></TouchableOpacity>
              <TouchableOpacity style={styles.courseButton} onPress={() => setMode("extra")}>
  <Text style={styles.buttonText}>Extra Material</Text>
</TouchableOpacity>

            </View>
          </View>
        )}

        {/* Books */}
        {mode === "books" && (
  booksLoading
    ? (
      // ✅ Shimmer while loading
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
        {[...Array(4)].map((_, i) => (
          <ShimmerPlaceholder 
            key={i} 
            width={120} 
            height={160} 
            style={{ marginRight: 10, borderRadius: 8 }} 
          />
        ))}
      </ScrollView>
    )
    : Object.keys(booksBySem).length === 0
      ? <Text style={{ fontStyle:'italic', color:'#777', marginVertical:10 }}>Currently unavailable. Please contact the developer to add books via the ℹ️ button on the top-right corner.</Text>
      : Object.keys(booksBySem).map(sem => (
          <View key={sem} style={{ marginVertical: 10 }}>
            <Text style={styles.sectionTitle}>{sem.toUpperCase()}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {booksBySem[sem].map(book => (
                <TouchableOpacity key={book.id} style={styles.bookCard} onPress={() => handleBookClick(book)}>
                  {book.coverUrl 
                    ? <Image source={{ uri: book.coverUrl }} style={styles.bookCover} />
                    : <View style={[styles.bookCover, styles.blankCover]}>
                        <Text style={styles.blankText}>{getShortForm(book.name)}</Text>
                      </View>
                  }
                  <Text style={styles.bookTitle}>{book.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))
)}

        {/* Extra Material */}
{mode === "extra" && (
  extraLoading ? (
    <ScrollView style={{ marginVertical: 10 }}>
      {[...Array(4)].map((_, i) => (
        <ShimmerPlaceholder
          key={i}
          width={330}
          height={40}
          style={{ marginVertical: 5, borderRadius: 6 }}
        />
      ))}
    </ScrollView>
  ) : Object.keys(extraData).length === 0 ? (
    <Text style={{ fontStyle: 'italic', color: '#777', marginVertical: 10 }}>
      Currently unavailable. Please contact the developer to add Extra Material via the ℹ️ button on the top-right corner.
    </Text>
  ) : (
    Object.keys(extraData).map(sem => (
      <View key={sem} style={{ marginVertical: 10 }}>
        <Text style={styles.sectionTitle}>{sem.toUpperCase()}</Text>
        {extraData[sem].map(subject => (
          <View key={subject.subjectName} style={{ marginVertical: 5, paddingLeft: 10 }}>
            <Text style={{ fontSize:16, fontWeight:'bold', marginBottom: 5 }}>{subject.subjectName}</Text>
            {subject.qps.length > 0 
              ? subject.qps.map(qp => (
                  <TouchableOpacity key={qp.id} style={styles.qpCard} onPress={() => handleQpClick(qp)}>
                    <Ionicons name="document-text" size={20} color="#2E86DE" style={{ marginRight:10 }} />
                    <Text style={styles.qpText}>{qp.name}</Text>
                  </TouchableOpacity>
                ))
              : subject.addLink
                ? <TouchableOpacity style={styles.addLinkButton} onPress={() => subject.addLink && Linking.openURL(subject.addLink)}>
                    <Text style={styles.addLinkText}>Add/View Extra</Text>
                  </TouchableOpacity>
                : <Text style={{ fontStyle:'italic', color:'#777', marginLeft: 10 }}>Currently not available. Please contact the developer to add Extra Material.</Text>
            }
          </View>
        ))}
      </View>
    ))
  )
)}

        {/* QPs */}
        {mode === "qp" && (
           qpLoading
            ? (
                  // ✅ Shimmer while loading
               <ScrollView style={{ marginVertical: 10 }}>
                 {[...Array(4)].map((_, i) => (
                  <ShimmerPlaceholder 
                  key={i} 
                  width={330} 
                  height={40} 
                style={{ marginVertical: 5, borderRadius: 6 }} 
            />
        ))}
      </ScrollView>
    )
    : Object.keys(qpData).length === 0
      ? <Text style={{ fontStyle:'italic', color:'#777', marginVertical:10 }}>Currently unavailable. Please contact the developer to add QPS via the ℹ️ button on the top-right corner.</Text>
      : Object.keys(qpData).map(sem => (
          <View key={sem} style={{ marginVertical: 10 }}>
            <Text style={styles.sectionTitle}>{sem.toUpperCase()}</Text>
            {qpData[sem].map(subject => (
              <View key={subject.subjectName} style={{ marginVertical: 5, paddingLeft: 10 }}>
                <Text style={{ fontSize:16, fontWeight:'bold', marginBottom: 5 }}>{subject.subjectName}</Text>
                {subject.qps.length > 0 
                  ? subject.qps.map(qp => (
                      <TouchableOpacity key={qp.id} style={styles.qpCard} onPress={() => handleQpClick(qp)}>
                        <Ionicons name="document-text" size={20} color="#2E86DE" style={{ marginRight:10 }} />
                        <Text style={styles.qpText}>{qp.name}</Text>
                      </TouchableOpacity>
                    ))
                  : subject.addLink
                    ? <TouchableOpacity style={styles.addLinkButton} onPress={() => subject.addLink && Linking.openURL(subject.addLink)}>
                        <Text style={styles.addLinkText}>Add/View QP</Text>
                      </TouchableOpacity>
                    : <Text style={{ fontStyle:'italic', color:'#777', marginLeft: 10 }}>Currently not available. Please contact the developer to add QPs.</Text>
                }
              </View>
            ))}
          </View>
        ))
        
        
)}


        {allBooks.length > 0
  ? (
    <View style={{ marginVertical: 20 }}>
      <Text style={[styles.sectionTitle, { marginTop: -15, marginBottom:15 }]}>🎲 Explore Random Books</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {allBooks.map(book => (
          <TouchableOpacity key={book.id} style={styles.bookCard} onPress={() => handleBookClick(book)}>
            {book.coverUrl
              ? <Image source={{ uri: book.coverUrl }} style={styles.bookCover} />
              : <View style={[styles.bookCover, styles.blankCover]}>
                  <Text style={styles.blankText}>{getShortForm(book.name)}</Text>
                </View>
            }
            <Text style={styles.bookTitle}>{book.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
  : (
    // ✅ Shimmer Loader for Explore Random Books
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 20 }}>
      {[...Array(4)].map((_, i) => (
        <ShimmerPlaceholder 
          key={i} 
          width={120}       // same as book cover width
          height={160}      // same as book cover height
          style={{ marginRight: 10, borderRadius: 8 }} 
        />
      ))}
    </ScrollView>
  )
}


      </ScrollView>
    </View>
  );
  
}

// --- STYLES ---
// Keep all previous styles unchanged
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#fff'},
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  noticeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eaf4ff', padding: 12, borderRadius: 10, marginVertical: 5 },
  noticeText: { marginLeft: 10, fontSize: 15, color: '#333', flex: 1 },
  noNotice: { fontSize: 14, color: '#777', marginVertical: 5 },
  horizontalScroll: { marginVertical: 10 },
  courseButton: { backgroundColor: '#eee', padding: 10, borderRadius: 8, marginRight: 10 },
  activeButton: { backgroundColor: '#2E86DE' },
  buttonText: { color: '#333', fontWeight: 'bold' },
  activeButtonText: { color: '#fff' },
  welcomeBox: { backgroundColor: '#2E86DE', borderRadius: 15, padding: 15, marginVertical: 5 },
  welcomeImage: { width: 500, height: 200, alignSelf: 'center', marginBottom: 10, borderRadius: 10 },
  welcomeHeader: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  welcomeText: { color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 22 },
  bookCard: { width: 120, marginRight: 10 },
  bookCover: { width: 120, height: 160, borderRadius: 8 },
  blankCover: { backgroundColor:'#ccc', justifyContent:'center', alignItems:'center' },
  blankText: { color:'#555', fontWeight:'bold', fontSize:16 },
  bookTitle: { marginTop:5, fontSize:14 },
  qpCard: { flexDirection:'row', alignItems:'center', padding:8, marginVertical:2, backgroundColor:'#eaf4ff', borderRadius:6 },
  qpText: { fontSize:15 },
  addLinkButton: { backgroundColor:'#2E86DE', padding:6, borderRadius:6, marginVertical:2, alignSelf:'flex-start' },
  addLinkText: { color:'#fff', fontWeight:'bold' },
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center' },
  modal: { backgroundColor:'#fff', padding:20, borderRadius:15, width:'80%', alignItems:'center' },
  logo: { width:80, height:80, marginBottom:15 },
  title: { fontSize:20, fontWeight:'bold', marginBottom:10 },
  text: { fontSize:16, textAlign:'center', marginBottom:15 },
  updateButton: { backgroundColor:'#2E86DE', padding:10, borderRadius:10 },
  updateButtonText: { color:'#fff', fontWeight:'bold', fontSize:16 },
  searchContainer: { position:'absolute', top: Platform.OS === 'ios'?50:20, left:15, right:15, backgroundColor:'#fff', borderRadius:10, zIndex:10, shadowColor:'#000', shadowOpacity:0.2, shadowRadius:5, elevation:5 },
  searchInput: { height:40, paddingHorizontal:10, fontSize:16 }
});

const linkButtonStyles = StyleSheet.create({
  button: { backgroundColor:'#2E86DE', paddingVertical:12, paddingHorizontal:10, borderRadius:10, marginBottom:10, justifyContent:'center', alignItems:'center' },
  buttonText: { color:'#fff', fontWeight:'bold', fontSize:14, textAlign:'center' }
});

const popupStyles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center' },
  popupContainer: { width:'85%', backgroundColor:'#fff', borderRadius:15, padding:15, alignItems:'center' },
  closeButton: { position:'absolute', top:10, right:10, zIndex:10 },
  heading: { fontSize:18, fontWeight:'bold', marginVertical:10 },
  image: { width:200, height:120, borderRadius:10, marginBottom:10 },
  paragraph: { fontSize:15, textAlign:'center', marginBottom:10 },
  linkText: { fontSize:15, color:'#2E86DE', fontWeight:'bold' }
});
