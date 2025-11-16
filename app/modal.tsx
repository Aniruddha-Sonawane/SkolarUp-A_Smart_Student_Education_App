// app/modal.tsx
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
  Dimensions,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { db } from '../firebaseconfig';
import { ref, onValue, off, push } from 'firebase/database';
import FontAwesome from '@expo/vector-icons/FontAwesome'; // <-- Icon import

const { height } = Dimensions.get('window');

interface InstaData {
  username: string;
  url: string;
  iconUrl: string;
}

interface ExtraLink {
  title: string;
  url: string;
  iconUrl: string;
}

export default function AboutModal() {
  const [instaData, setInstaData] = useState<InstaData | null>(null);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState<string>(
    'https://www.aknee.com/privacy-policy'
  );
  const [contactUrl, setContactUrl] = useState<string>(''); 
  const [extraLinks, setExtraLinks] = useState<ExtraLink[]>([]);
  const [devImageUrl, setDevImageUrl] = useState<string | null>(null);

  // --- Report Modal State ---
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  useEffect(() => {
    const instaRef = ref(db, 'about/instagram');
    const privacyRef = ref(db, 'about/privacyPolicy');
    const contactRef = ref(db, 'about/contactLink'); 
    const extraRef = ref(db, 'about/extraLinks');
    const devImageRef = ref(db, 'about/developerImage');

    const handleInsta = (snap: any) => { const data = snap.val(); if (data) setInstaData(data); };
    const handlePrivacy = (snap: any) => { const data = snap.val(); if (data) setPrivacyPolicyUrl(data); };
    const handleContact = (snap: any) => { const data = snap.val(); if (data) setContactUrl(data); };
    const handleExtra = (snap: any) => { const data = snap.val(); if (data) setExtraLinks(Object.entries(data).map(([id, val]: any) => val)); };
    const handleDevImage = (snap: any) => { const url = snap.val(); if (url) setDevImageUrl(url); };

    onValue(instaRef, handleInsta);
    onValue(privacyRef, handlePrivacy);
    onValue(contactRef, handleContact);
    onValue(extraRef, handleExtra);
    onValue(devImageRef, handleDevImage);

    return () => {
      off(instaRef, 'value', handleInsta);
      off(privacyRef, 'value', handlePrivacy);
      off(contactRef, 'value', handleContact);
      off(extraRef, 'value', handleExtra);
      off(devImageRef, 'value', handleDevImage);
    };
  }, []);

  const openLink = (url: string) => {
    if (url) Linking.openURL(url);
    else Alert.alert('Error', 'Link is not available.');
  };

  const submitReport = () => {
    if (!reportName.trim() || !reportMessage.trim()) {
      Alert.alert('Error', 'Please enter your name and message.');
      return;
    }

    const reportsRef = ref(db, 'userReports');
    push(reportsRef, {
      name: reportName,
      message: reportMessage,
      timestamp: new Date().toISOString(),
    })
      .then(() => {
        setReportSubmitted(true);
        setReportName('');
        setReportMessage('');
        setTimeout(() => setReportModalVisible(false), 2000);
      })
      .catch(() => Alert.alert('Error', 'Failed to submit. Please try again.'));
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
      </View>
      <View style={styles.separator} />

      {devImageUrl && <Image source={{ uri: devImageUrl }} style={styles.developerImage} />}
      <Text style={styles.developerText}>Developer & Founder</Text>
      <Text style={styles.developerName}>Aniruddha Sonawane</Text>

      {instaData && (
        <TouchableOpacity style={styles.instagramRow} onPress={() => openLink(instaData.url)}>
          <Image source={{ uri: instaData.iconUrl }} style={styles.instagramIcon} />
          <Text style={styles.instagramHandle}>{instaData.username}</Text>
        </TouchableOpacity>
      )}

      {extraLinks.map((link, idx) => (
        <TouchableOpacity key={idx} style={styles.extraLinkRow} onPress={() => openLink(link.url)}>
          {link.iconUrl && <Image source={{ uri: link.iconUrl }} style={styles.extraLinkIcon} />}
          <Text style={styles.extraLinkText}>{link.title}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.separator} />

      {/* --- Report Bug Button with Bug Icon --- */}
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => { setReportModalVisible(true); setReportSubmitted(false); }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <FontAwesome name="bug" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.reportButtonText}>Report   </Text>
        </View>
      </TouchableOpacity>

      {/* --- Contact Button with Telegram Icon --- */}
      {contactUrl ? (
        <TouchableOpacity style={styles.contactButton} onPress={() => openLink(contactUrl)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesome name="telegram" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.contactButtonText}>Contact</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Privacy Policy Small Button */}
      <TouchableOpacity style={styles.smallPrivacyButton} onPress={() => openLink(privacyPolicyUrl)}>
        <Text style={styles.smallPrivacyText}>Privacy Policy</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        © {new Date().getFullYear()} SkolarUp{'\n'}
        Founder & Developer Aniruddha Sonawane{'\n'}
        All rights reserved.
      </Text>

      <StatusBar style="dark" />

      <Modal visible={reportModalVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <Text style={modalStyles.title}>Report an Issue</Text>
            {!reportSubmitted ? (
              <>
                <TextInput
                  style={modalStyles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  value={reportName}
                  onChangeText={setReportName}
                />
                <TextInput
                  style={[modalStyles.input, { height: 80 }]}
                  placeholder="Describe your issue"
                  placeholderTextColor="#999"
                  multiline
                  value={reportMessage}
                  onChangeText={setReportMessage}
                />
                <TouchableOpacity style={modalStyles.submitButton} onPress={submitReport}>
                  <Text style={modalStyles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modalStyles.cancelButton} onPress={() => setReportModalVisible(false)}>
                  <Text style={modalStyles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={modalStyles.successText}>Your message has been submitted. Our team will handle it shortly.</Text>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FFF', alignItems: 'center', padding: 20 },
  logoContainer: { height: height / 3.5, justifyContent: 'center', alignItems: 'center', marginBottom: -70, marginTop: -20 },
  logo: { width: height / 4, height: height / 4, resizeMode: 'contain', backgroundColor: 'transparent', marginTop: 0, marginBottom: 40 },
  developerImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, borderWidth: 2, borderColor: '#2E86DE', resizeMode: 'cover' },
  developerText: { fontSize: 16, color: '#555', marginTop: 10, marginBottom: 5, textAlign: 'center' },
  developerName: { fontSize: 20, fontWeight: '600', color: '#000', marginBottom: -30, textAlign: 'center' },
  instagramRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  instagramIcon: { width: 24, height: 24, marginRight: 8, resizeMode: 'contain' },
  instagramHandle: { fontSize: 16, color: '#2E86DE', textDecorationLine: 'underline' },
  extraLinkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F1F1', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, marginVertical: 4 },
  extraLinkIcon: { width: 24, height: 24, marginRight: 10, resizeMode: 'contain' },
  extraLinkText: { fontSize: 15, color: '#333' },
  separator: { width: '60%', height: 1, backgroundColor: '#E0E0E0', marginVertical: 20 },

  reportButton: { backgroundColor: '#000', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25, marginBottom: 15 },
  reportButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },

  contactButton: { backgroundColor: '#000', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 25, marginBottom: 15 },
  contactButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },

  smallPrivacyButton: { backgroundColor: '#E0E0E0', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20, marginBottom: 30 },
  smallPrivacyText: { color: '#000', fontSize: 14, fontWeight: '600', textAlign: 'center' },

  footerText: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 30 },
});

// --- Modal Styles ---
const modalStyles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  container: { width:'85%', backgroundColor:'#fff', borderRadius:15, padding:20, alignItems:'center' },
  title: { fontSize:18, fontWeight:'bold', marginBottom:15 },
  input: { width:'100%', borderWidth:1, borderColor:'#ccc', borderRadius:10, padding:10, marginVertical:8, color:'#000' },
  submitButton: { backgroundColor:'#2E86DE', paddingVertical:12, paddingHorizontal:20, borderRadius:10, marginTop:10, width:'100%' },
  submitButtonText: { color:'#fff', fontWeight:'bold', fontSize:16, textAlign:'center' },
  cancelButton: { paddingVertical:10, paddingHorizontal:20, marginTop:10 },
  cancelButtonText: { color:'#2E86DE', fontWeight:'bold', fontSize:16, textAlign:'center' },
  successText: { fontSize:16, color:'#27AE60', fontWeight:'bold', textAlign:'center', marginVertical:20 },
});
