// components/CustomWebView.tsx
import React, { useState, useRef } from 'react';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

interface CustomWebViewProps {
  url: string;
  title: string;
}

export default function CustomWebView({ url, title }: CustomWebViewProps) {
  const router = useRouter();
  const webviewRef = useRef<WebView>(null); // ✅ FIXED

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
    webviewRef.current?.reload(); // optional
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
      {/* Top Nav */}
      <View style={styles.navContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
          <Ionicons name="arrow-back" size={24} color="#2E86DE" />
        </TouchableOpacity>

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        <TouchableOpacity onPress={openInExternalBrowser} style={styles.navButton}>
          <Ionicons name="open-outline" size={24} color="#2E86DE" />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E86DE" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webviewRef}  // ✅ FIXED
        source={{ uri: url }}
        onError={handleLoadError}
        onHttpError={handleLoadError}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        style={styles.webview}
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => webviewRef.current?.goBack()}   // ✅ FIXED
          disabled={!canGoBack}
          style={[styles.navControl, !canGoBack && styles.disabledControl]}
        >
          <Ionicons name="arrow-back" size={20} color={canGoBack ? "#2E86DE" : "#ccc"} />
          <Text style={[styles.navText, !canGoBack && styles.disabledText]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => webviewRef.current?.goForward()} // ✅ FIXED
          disabled={!canGoForward}
          style={[styles.navControl, !canGoForward && styles.disabledControl]}
        >
          <Ionicons name="arrow-forward" size={20} color={canGoForward ? "#2E86DE" : "#ccc"} />
          <Text style={[styles.navText, !canGoForward && styles.disabledText]}>Forward</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => webviewRef.current?.reload()} // ✅ FIXED
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
  /* same styles as yours */
});
