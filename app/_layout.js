// app/_layout.js
import {
  RobotoCondensed_400Regular,
  RobotoCondensed_400Regular_Italic,
  RobotoCondensed_500Medium,
  RobotoCondensed_700Bold,
  useFonts,
} from '@expo-google-fonts/roboto-condensed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
// import { StatusBar } from 'expo-status-bar';
import SplashScreenComponent from '../components/SplashScreen';
import { SupabaseProvider, useSupabase } from '../contexts/SupabaseContext';
import i18n from '../lib/i18n';
import './global.css';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

const LANGUAGE_KEY = '@lingua_flow:ui_language';

// Навигатор с защитой маршрутов
function RootLayoutNav() {
  const { session } = useSupabase();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Защищённые маршруты - доступны ТОЛЬКО авторизованным */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name='(tabs)' />
        <Stack.Screen name='dialogs/[id]' options={{ presentation: 'card' }} />
        <Stack.Screen name='modals/trial' options={{ presentation: 'modal', title: 'Try PRO Free' }} />
        <Stack.Screen name='modals/upgrade' options={{ presentation: 'modal', title: 'Upgrade' }} />
      </Stack.Protected>

      {/* Публичные маршруты - доступны ТОЛЬКО неавторизованным */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name='index' />
        <Stack.Screen name='language-selection' />
        <Stack.Screen name='(auth)' />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // Режим "sticky immersive"
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    RobotoCondensed_400Regular,
    RobotoCondensed_400Regular_Italic,
    RobotoCondensed_500Medium,
    RobotoCondensed_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Загружаем сохраненный язык
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (storedLanguage && storedLanguage !== i18n.language) {
          await i18n.changeLanguage(storedLanguage);
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        // Помечаем что инициализация завершена
        setAppIsReady(true);
      }
    }

    // Запускаем только ОДИН раз при монтировании
    if (!appIsReady) {
      prepare();
    }
  }, [appIsReady]);

  // Отдельно ждём шрифты
  useEffect(() => {
    if (fontsLoaded && appIsReady) {
      // Всё готово - можно скрыть Splash Screen
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appIsReady]);

  // Показываем кастомный Splash Screen пока не готово
  if (!appIsReady || !fontsLoaded) {
    return <SplashScreenComponent />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <RootLayoutNav />
      </SupabaseProvider>
    </QueryClientProvider>
  );
}
