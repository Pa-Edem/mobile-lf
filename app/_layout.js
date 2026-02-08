// app/_layout.js
import { RobotoCondensed_400Regular, RobotoCondensed_700Bold, useFonts } from '@expo-google-fonts/roboto-condensed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SupabaseProvider, useSupabase } from '../contexts/SupabaseContext';
import i18n from '../lib/i18n';
import './global.css';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

const LANGUAGE_KEY = '@lingua_flow:ui_language';

// Компонент-контроллер Splash Screen
function SplashScreenController() {
  const { loading } = useSupabase();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  return null;
}

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
        setAppIsReady(true);
      }
    }

    prepare();
  }, [fontsLoaded]);

  if (!appIsReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <SplashScreenController />
        <RootLayoutNav />
      </SupabaseProvider>
    </QueryClientProvider>
  );
}
