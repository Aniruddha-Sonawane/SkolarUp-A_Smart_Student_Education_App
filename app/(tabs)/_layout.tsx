import React, { useRef } from 'react';
import { View, Image, Text, Pressable, StyleSheet } from 'react-native';
import { Link, Tabs } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/components/useColorScheme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SearchBarContext = React.createContext<{
  setShowSearchBarCallback: (_cb: (() => void) | null) => void;
}>({
  setShowSearchBarCallback: () => {},
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const showSearchBarCallback = useRef<(() => void) | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goToPostsSearch = () => {
    router.push('/Posts');
    setTimeout(() => {
      showSearchBarCallback.current?.();
    }, 100);
  };

  return (
    <SearchBarContext.Provider
      value={{
        setShowSearchBarCallback: (cb) => {
          showSearchBarCallback.current = cb;
        },
      }}
    >
      <View style={styles.appBackground} />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#d0e7ff',
          tabBarStyle: [
            styles.tabBar,
            { 
              height: 65 + (insets.bottom > 0 ? insets.bottom - 20 : 0),
              paddingBottom: insets.bottom > 0 ? insets.bottom - 4 : 0
            }
          ],
          tabBarBackground: () => (
            <LinearGradient
              colors={['#0f75bc', '#1b9be0', '#4db6e6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBackground}
            />
          ),
          headerShown: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
            headerTitle: () => (
              <View style={styles.headerTitleContainer}>
                <Image
                  source={require('../../assets/logo_dark.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>SKOLOR UP</Text>
                  <Text style={styles.subtitle}>BY ANIRUDDHA SONAWANE</Text>
                </View>
              </View>
            ),
            headerBackground: () => (
              <LinearGradient
                colors={['#0f75bc', '#1b9be0', '#4db6e6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              />
            ),
            headerRight: () => (
              <View style={styles.headerRightContainer}>
                <Animatable.View animation="fadeInDown" duration={500} iterationCount={1}>
                  <Pressable
                    onPress={goToPostsSearch}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <FontAwesome name="search" size={22} color="#fff" style={styles.headerIcon} />
                  </Pressable>
                </Animatable.View>
                <Link href="/modal" asChild>
                  <Pressable>
                    {({ pressed }) => (
                      <FontAwesome
                        name="info-circle"
                        size={22}
                        color="#fff"
                        style={[styles.headerIcon, { opacity: pressed ? 0.6 : 1 }]}
                      />
                    )}
                  </Pressable>
                </Link>
              </View>
            ),
          }}
        />

        {}
        <Tabs.Screen
          name="Posts"
          options={{
            title: 'Explore',
            headerTitleStyle: styles.headerTitle,
            headerBackground: () => (
              <LinearGradient
                colors={['#0f75bc', '#1b9be0', '#4db6e6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              />
            ),
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="explore" size={24} color={color} />
            ),
            headerRight: () => (
              <Animatable.View animation="fadeInDown" duration={500} iterationCount={1}>
                <Pressable
                  onPress={goToPostsSearch}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <FontAwesome name="search" size={22} color="#fff" style={styles.headerIcon} />
                </Pressable>
              </Animatable.View>
            ),
          }}
        />

        {}
        <Tabs.Screen
          name="two"
          options={{
            title: 'ChatBot',
            headerTitleStyle: styles.headerTitle,
            headerBackground: () => (
              <LinearGradient
                colors={['#0f75bc', '#1b9be0', '#4db6e6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              />
            ),
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="robot-excited" size={24} color={color} />
            ),
          }}
        />

        {}
        <Tabs.Screen
          name="BookViewer"
          options={{
            title: 'Book Viewer',
            headerTitleStyle: styles.headerTitle,
            headerBackground: () => (
              <LinearGradient
                colors={['#0f75bc', '#1b9be0', '#4db6e6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              />
            ),
            tabBarIcon: ({ color }) => <FontAwesome5 name="book" size={22} color={color} />,
          }}
        />

        {}
        <Tabs.Screen
          name="posts/[postId]"
          options={{
            title: 'Active Post',
            tabBarButton: () => null,
            headerTitleStyle: styles.headerTitle,
            headerBackground: () => (
              <LinearGradient
                colors={['#0f75bc', '#1b9be0', '#4db6e6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              />
            ),
          }}
        />
      </Tabs>
    </SearchBarContext.Provider>
  );
}

const styles = StyleSheet.create({
  appBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f75bc', 
  },
  tabBar: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'transparent', 
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradientBackground: {
    flex: 1,
    borderTopLeftRadius: 14, 
    borderTopRightRadius: 14,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -10,
  },
  logo: {
    width: 70,
    height: 70,
  },
  titleContainer: {
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 9,
    color: '#fff',
    marginTop: -4,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginHorizontal: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#fff',
  },
});
