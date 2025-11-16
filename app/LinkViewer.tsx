// app/LinkViewer.tsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';

export default function BookViewer() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [webViewUrl, setWebViewUrl] = useState<string | null>(
    url ? decodeURIComponent(url) : null
  );

  const handleSSLError = (url: string) => {
    // Open in browser without alert
    Linking.openURL(url);
    // Reset the webview URL to show placeholder again
    setWebViewUrl(null);
  };

  if (!webViewUrl) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          {url ? 'Redirecting to browser...' : 'Select a Book from Home Page to Access'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: webViewUrl }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#2E86DE" />
          </View>
        )}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          
          // Check if the error is related to SSL
          if (nativeEvent.description?.includes('SSL') || 
              nativeEvent.description?.includes('certificate') ||
              nativeEvent.url?.includes('https')) {
            handleSSLError(webViewUrl);
          }
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          
          // Some SSL errors might come as HTTP errors
          if (nativeEvent.statusCode === 403 || 
              nativeEvent.statusCode === 500 ||
              nativeEvent.url?.includes('https')) {
            handleSSLError(webViewUrl);
          }
        }}
      />
    </View>
  );
}

// Remove top header
export const options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#555',
    fontWeight: '500',
  },
});