import { RobotoCondensed_400Regular, RobotoCondensed_700Bold, useFonts } from '@expo-google-fonts/roboto-condensed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SupabaseProvider } from '../contexts/SupabaseContext';
import i18n from '../lib/i18n';
import './global.css';

const queryClient = new QueryClient();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const LANGUAGE_KEY = '@lingua_flow:ui_language';

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    RobotoCondensed_400Regular,
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

        // Ждем загрузки шрифтов
        if (fontsLoaded) {
          setAppIsReady(true);
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
        setAppIsReady(true); // Продолжаем даже если ошибка
      }
    }

    prepare();
  }, [fontsLoaded]);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <Stack>
          <Stack.Screen name='index' options={{ headerShown: false }} />
          <Stack.Screen name='language-selection' options={{ headerShown: false }} />
          <Stack.Screen name='(auth)' options={{ headerShown: false }} />
          <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
          <Stack.Screen
            name='modals/trial'
            options={{
              presentation: 'modal',
              title: 'Try PRO Free',
            }}
          />
          <Stack.Screen
            name='modals/upgrade'
            options={{
              presentation: 'modal',
              title: 'Upgrade',
            }}
          />
        </Stack>
      </SupabaseProvider>
    </QueryClientProvider>
  );
}
