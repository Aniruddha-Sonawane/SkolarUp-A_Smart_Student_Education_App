// components/CustomWebView.tsx
import React, { useState } from 'react';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

interface CustomWebViewProps {
  url: string;
  title: string;
}

export default function CustomWebView({ url, title }: CustomWebViewProps) {
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);

  const handleLoadError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setHasError(true);
    setErrorMessage(nativeEvent.description || 'Unknown error occurred');
    setIsLoading(false);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    setIsLoading(navState.loading);
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
  };

  const openInExternalBrowser = () => {
    Linking.openURL(currentUrl);
  };

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={50} color="#FF9500" style={styles.errorIcon} />
        <Text style={styles.errorTitle}>Unable to load page</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.externalButton} onPress={openInExternalBrowser}>
          <Ionicons name="open-outline" size={20} color="white" />
          <Text style={styles.externalText}>Open in Browser</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#2E86DE" />
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Navigation Controls */}
      <View style={styles.navContainer}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.navButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2E86DE" />
        </TouchableOpacity>
        
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        
        <TouchableOpacity 
          onPress={openInExternalBrowser}
          style={styles.navButton}
        >
          <Ionicons name="open-outline" size={24} color="#2E86DE" />
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86DE" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* WebView with mixed content allowed and JavaScript enabled */}
      <WebView
        source={{ uri: url }}
        onError={handleLoadError}
        onHttpError={handleLoadError}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always" // Allow both HTTP and HTTPS content
        originWhitelist={['*']} // Allow all origins
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        renderError={(errorDomain, errorCode, errorDesc) => (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={50} color="#FF9500" style={styles.errorIcon} />
            <Text style={styles.errorTitle}>Unable to load page</Text>
            <Text style={styles.errorMessage}>{errorDesc}</Text>
            
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.externalButton} onPress={openInExternalBrowser}>
              <Ionicons name="open-outline" size={20} color="white" />
              <Text style={styles.externalText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        )}
        style={styles.webview}
      />

      {/* Bottom Navigation Controls */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          onPress={() => this.webviewRef.goBack()} 
          disabled={!canGoBack}
          style={[styles.navControl, !canGoBack && styles.disabledControl]}
        >
          <Ionicons name="arrow-back" size={20} color={canGoBack ? "#2E86DE" : "#ccc"} />
          <Text style={[styles.navText, !canGoBack && styles.disabledText]}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => this.webviewRef.goForward()} 
          disabled={!canGoForward}
          style={[styles.navControl, !canGoForward && styles.disabledControl]}
        >
          <Ionicons name="arrow-forward" size={20} color={canGoForward ? "#2E86DE" : "#ccc"} />
          <Text style={[styles.navText, !canGoForward && styles.disabledText]}>Forward</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => this.webviewRef.reload()} 
          style={styles.navControl}
        >
          <Ionicons name="refresh" size={20} color="#2E86DE" />
          <Text style={styles.navText}>Reload</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  navButton: {
    padding: 5,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorIcon: {
    marginBottom: 15,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#2E86DE',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    width: '80%',
    justifyContent: 'center',
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  externalButton: {
    flexDirection: 'row',
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    width: '80%',
    justifyContent: 'center',
  },
  externalText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  backButton: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E86DE',
  },
  backText: {
    color: '#2E86DE',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  navControl: {
    alignItems: 'center',
    padding: 10,
  },
  disabledControl: {
    opacity: 0.5,
  },
  navText: {
    fontSize: 12,
    color: '#2E86DE',
    marginTop: 5,
  },
  disabledText: {
    color: '#ccc',
  },
});