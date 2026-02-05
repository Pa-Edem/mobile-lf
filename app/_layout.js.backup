import { RobotoCondensed_400Regular, RobotoCondensed_700Bold, useFonts } from '@expo-google-fonts/roboto-condensed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SupabaseProvider } from '../contexts/SupabaseContext';
import '../lib/i18n';
import './global.css';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    RobotoCondensed_400Regular,
    RobotoCondensed_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'hsl(36, 33%, 97%)' },
          }}
        >
          <Stack.Screen name='index' />
          <Stack.Screen name='(auth)' />
          <Stack.Screen name='(tabs)' />
          <Stack.Screen
            name='modals/trial'
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Try PRO Free',
              headerStyle: { backgroundColor: 'hsl(36, 33%, 97%)' },
            }}
          />
          <Stack.Screen
            name='modals/upgrade'
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Upgrade',
              headerStyle: { backgroundColor: 'hsl(36, 33%, 97%)' },
            }}
          />
        </Stack>
      </SupabaseProvider>
    </QueryClientProvider>
  );
}
