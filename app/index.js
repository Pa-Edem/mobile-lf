// app/index.js

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';
import { useSupabase } from '../contexts/SupabaseContext';
import { saveLanguage } from '../lib/i18n';

export default function Welcome() {
  const { t, i18n } = useTranslation();
  const { session, loading } = useSupabase();
  const [showSplash, setShowSplash] = useState(true);

  const changeLanguage = async (lang) => {
    await i18n.changeLanguage(lang);
    await saveLanguage(lang);
  };

  const currentLang = i18n.language;

  // Управляем только визуальным состоянием Splash Screen
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Пока идет инициализация или анимация splash — не показываем контент
  if (loading || showSplash) return null;
  if (session) return null;

  return (
    <View className='flex-1 bg-bgMain px-6 justify-center items-center'>
      {/* Logo */}
      <Image source={require('../assets/images/logo.png')} className='w-24 h-24 mb-4' resizeMode='contain' />

      {/* App Name */}
      <Text className='text-3xl text-textHead mb-8' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
        Lingua Flow
      </Text>

      {/* Title */}
      <Text className='text-xl text-textHead mb-4 text-center' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
        {t('welcome.title')}
      </Text>

      {/* Description */}
      <View className='mb-8'>
        <Text className='text-base text-textText mb-3 text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          {t('welcome.description.paragraph1')}
        </Text>
        <Text className='text-base text-textText mb-3 text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          {t('welcome.description.paragraph2')}
        </Text>
      </View>

      {/* Переключатель языка остается здесь */}
      <View className='w-full bg-bgCard rounded-full p-1 mb-6 border border-brdLight'>
        <View className='flex-row'>
          {['en', 'ru'].map((lang) => (
            <Pressable
              key={lang}
              onPress={() => changeLanguage(lang)}
              className={`flex-1 py-3 rounded-full items-center justify-center ${
                currentLang === lang ? 'bg-bgMain' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm ${currentLang === lang ? 'text-textHead' : 'text-textText'}`}
                style={{ fontFamily: 'RobotoCondensed_700Bold' }}
              >
                {t(`welcome.language.${lang}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Start Button */}
      <Pressable
        onPress={() => router.push('/language-selection')}
        className='bg-greenDefault w-full py-4 rounded-full items-center active:bg-greenDark'
      >
        <Text className='text-white text-lg' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('welcome.button')} →
        </Text>
      </Pressable>
    </View>
  );
}
