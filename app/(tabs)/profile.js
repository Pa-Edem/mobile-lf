// app/(tabs)/profile.js

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
        setIsLoggingOut(false);
        return;
      }

      // Успешный выход - Context сделает редирект
      console.log('Logout successful');

      // Небольшая задержка для обработки в Context
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 200);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <View className='flex-1 bg-bgMain justify-center items-center'>
      <Text className='text-3xl text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
        {t('tabs.profile')}
      </Text>
      <Text className='text-lg text-textText mt-4' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
        {t('common.comingSoon')}
      </Text>
      {/* Logout Button */}
      <Pressable
        onPress={handleLogout}
        disabled={isLoggingOut}
        className={`border rounded-full py-4 px-8 items-center mt-16 ${
          isLoggingOut ? 'bg-textDis border-textDis' : 'bg-error border-error'
        }`}
      >
        <View className='flex-row items-center'>
          {isLoggingOut ? (
            <ActivityIndicator size='small' color='white' />
          ) : (
            <Ionicons name='log-out' size={20} color='white' />
          )}
          <Text className='text-white ml-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {isLoggingOut ? 'LOGGING OUT...' : 'LOGOUT'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
