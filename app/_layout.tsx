// app/_layout.tsx
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Main tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Modal renamed to About Me */}
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerTitle: 'About Me', 
            headerTitleAlign: 'left',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 22, color: '#fff' },
            headerBackground: () => (
              <LinearGradient
                colors={['#0f75bc', '#1b9be0', '#4db6e6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              />
            ),
          }}
        />

        {/* 🔗 New Link Viewer screen */}
        {/* 🔗 New Link Viewer screen */}
<Stack.Screen
  name="LinkViewer"
  options={({ route }: { route: { params?: { title?: string } } }) => ({
    headerTitle: route.params?.title || 'Link Viewer', // dynamic title
    headerTitleAlign: 'left',
    headerTitleStyle: { fontWeight: 'bold', fontSize: 22, color: '#fff' },
    headerBackground: () => (
      <LinearGradient
        colors={['#0f75bc', '#1b9be0', '#4db6e6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
    ),
  })}
/>
<Stack.Screen
  name="postView"
  options={({ route }: { route: { params?: { title?: string } } }) => ({
    headerTitle: route.params?.title || 'Post', // dynamic title
    headerTitleAlign: 'left',
    headerTitleStyle: { fontWeight: 'bold', fontSize: 22, color: '#fff' },
    headerBackground: () => (
      <LinearGradient
        colors={['#0f75bc', '#1b9be0', '#4db6e6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
    ),
  })}
/>
      </Stack>
    </ThemeProvider>
  );
}
