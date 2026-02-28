// app/(auth)/_layout.js

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'hsl(36, 33%, 97%)' },
      }}
    >
      <Stack.Screen name='login' />
    </Stack>
  );
}
