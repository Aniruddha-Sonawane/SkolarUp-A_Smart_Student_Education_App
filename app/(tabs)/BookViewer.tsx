
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function BookViewer() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const cloudAnim1 = useRef(new Animated.Value(0)).current;
  const cloudAnim2 = useRef(new Animated.Value(0)).current;
  const cloudAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (url) {
      const decodedUrl = decodeURIComponent(url);
      setWebViewUrl(decodedUrl);
      
      
      fadeAnim.setValue(0);
      floatAnim.setValue(0);
      cloudAnim1.setValue(0);
      cloudAnim2.setValue(0);
      cloudAnim3.setValue(0);
    } else {
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim, {
              toValue: 1,
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim, {
              toValue: 0,
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(cloudAnim1, {
              toValue: 1,
              duration: 8000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(cloudAnim1, {
              toValue: 0,
              duration: 8000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(cloudAnim2, {
              toValue: 1,
              duration: 10000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(cloudAnim2, {
              toValue: 0,
              duration: 10000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(cloudAnim3, {
              toValue: 1,
              duration: 12000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(cloudAnim3, {
              toValue: 0,
              duration: 12000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  }, [url]);

  const handleSSLError = (url: string) => {
    
    Linking.openURL(url);
    
    setWebViewUrl(null);
  };

  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const cloudInterpolate1 = cloudAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, width + 0],
  });

  const cloudInterpolate2 = cloudAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [width + 10, -300],
  });

  const cloudInterpolate3 = cloudAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, width + 0],
  });

  return (
    <View style={styles.container}>
      {webViewUrl ? (
        <WebView
          source={{ uri: webViewUrl }}
          style={styles.webview}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            
            
            if (nativeEvent.description?.includes('SSL') || 
                nativeEvent.description?.includes('certificate') ||
                nativeEvent.url?.includes('https')) {
              handleSSLError(webViewUrl);
            }
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            
            
            if (nativeEvent.statusCode === 403 || 
                nativeEvent.statusCode === 500 ||
                nativeEvent.url?.includes('https')) {
              handleSSLError(webViewUrl);
            }
          }}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          {}
          <Animated.View 
            style={[
              styles.moon,
              {
                opacity: fadeAnim,
                transform: [{ translateY: floatInterpolate }]
              }
            ]}
          />
          
          {}
          <Animated.View 
            style={[
              styles.cloud,
              styles.cloud1,
              {
                opacity: fadeAnim,
                transform: [{ translateX: cloudInterpolate1 }]
              }
            ]}
          />
          <Animated.View 
            style={[
              styles.cloud,
              styles.cloud2,
              {
                opacity: fadeAnim,
                transform: [{ translateX: cloudInterpolate2 }]
              }
            ]}
          />
          <Animated.View 
            style={[
              styles.cloud,
              styles.cloud3,
              {
                opacity: fadeAnim,
                transform: [{ translateX: cloudInterpolate3 }]
              }
            ]}
          />
        </View>
      )}
    </View>
  );
}


export const options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: -500,
    backgroundColor: '#2a2d3e',
    marginTop: -50,
    marginBottom: -100,
    marginLeft: -15,
    marginRight: -15,
  },
  webview: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2d3e',
    overflow: 'hidden',
  },
  
  moon: {
    position: 'absolute',
    top: 300,
    right: 100,
    width: 200,
    height: 200,
    borderRadius: 300,
    backgroundColor: '#f5f3ce',
    shadowColor: '#f5f3ce',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 5,
  },
  
  cloud: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 50,
  },
  cloud1: {
    width: 120,
    height: 60,
    top: 250,
    borderRadius: 60,
  },
  cloud2: {
    width: 150,
    height: 70,
    top: 350,
    borderRadius: 70,
  },
  cloud3: {
    width: 100,
    height: 50,
    top: 450,
    borderRadius: 50,
  },
});
