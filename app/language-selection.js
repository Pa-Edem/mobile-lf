import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

const TARGET_LANGUAGE_KEY = '@lingua_flow:target_language';

const LANGUAGES = [
  { code: 'fi', flag: '🇫🇮' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'de', flag: '🇩🇪' },
  { code: 'fr', flag: '🇫🇷' },
  { code: 'it', flag: '🇮🇹' },
  { code: 'pt', flag: '🇵🇹' },
  { code: 'se', flag: '🇸🇪' },
  { code: 'no', flag: '🇳🇴' },
];

export default function LanguageSelectionScreen() {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  // Загружаем сохраненный язык при монтировании
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(TARGET_LANGUAGE_KEY);
      if (saved) {
        setSelectedLanguage(saved);
      }
    } catch (error) {
      console.error('Error loading target language:', error);
    }
  };

  const handleContinue = async () => {
    if (!selectedLanguage) return;

    try {
      // Сохраняем выбранный язык
      await AsyncStorage.setItem(TARGET_LANGUAGE_KEY, selectedLanguage);

      // Переходим к авторизации
      router.push('/(auth)/login');
    } catch (error) {
      console.error('Error saving target language:', error);
    }
  };

  return (
    <View className='flex-1 bg-bgMain'>
      <ScrollView className='flex-1' contentContainerClassName='px-6 pt-12 pb-8' showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View className='items-center mb-8'>
          <Image source={require('../assets/images/logo.png')} className='w-20 h-20 mb-3' resizeMode='contain' />
          <Text className='text-2xl text-textHead mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('languageSelection.title')}
          </Text>
          <Text className='text-base text-textText text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {t('languageSelection.subtitle')}
          </Text>
        </View>

        {/* Language Grid */}
        <View className='gap-3 mb-8'>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => setSelectedLanguage(lang.code)}
              className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                selectedLanguage === lang.code ? 'bg-greenLight border-greenDefault' : 'bg-bgCard border-brdLight'
              }`}
            >
              <View className='flex-row items-center'>
                <Text className='text-3xl mr-3'>{lang.flag}</Text>
                <Text
                  className={`text-lg ${selectedLanguage === lang.code ? 'text-textHead' : 'text-textText'}`}
                  style={{ fontFamily: 'RobotoCondensed_700Bold' }}
                >
                  {t(`languageSelection.languages.${lang.code}`)}
                </Text>
              </View>

              {selectedLanguage === lang.code && (
                <View className='w-6 h-6 bg-greenDefault rounded-full items-center justify-center'>
                  <Ionicons name='checkmark' size={16} color='white' />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Continue Button */}
        <Pressable
          onPress={handleContinue}
          disabled={!selectedLanguage}
          className={`w-full py-4 rounded-full items-center ${
            selectedLanguage ? 'bg-greenDefault active:bg-greenDark' : 'bg-brdLight'
          }`}
        >
          <Text
            className={`text-lg ${selectedLanguage ? 'text-white' : 'text-divider'}`}
            style={{ fontFamily: 'RobotoCondensed_700Bold' }}
          >
            {t('languageSelection.continue')} →
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
