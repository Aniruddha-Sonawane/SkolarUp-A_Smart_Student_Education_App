
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
  
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  
  initialRouteName: '(tabs)',
};


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  
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
        {}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {}
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

        {}
        {}
<Stack.Screen
  name="LinkViewer"
  options={({ route }: { route: { params?: { title?: string } } }) => ({
    headerTitle: route.params?.title || 'Link Viewer', 
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
    headerTitle: route.params?.title || 'Post', 
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
