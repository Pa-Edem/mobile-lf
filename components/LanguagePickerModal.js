// components/LanguagePickerModal.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Modal, Pressable, ScrollView, Text, View } from 'react-native';

const APP_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

const TARGET_LANGUAGES = [
  { code: 'fi', name: 'Finnish (Suomi)', flag: '🇫🇮' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸' },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪' },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷' },
  { code: 'it', name: 'Italian (Italiano)', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese (Português)', flag: '🇵🇹' },
  { code: 'se', name: 'Swedish (Svenska)', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian (Norsk)', flag: '🇳🇴' },
];

export default function LanguagePickerModal({
  visible,
  type = 'app', // 'app' или 'target'
  currentLanguage,
  onSelect,
  onClose,
}) {
  const { t } = useTranslation();

  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
    }
  }, [visible, slideAnim, fadeAnim]);

  const languages = type === 'app' ? APP_LANGUAGES : TARGET_LANGUAGES;
  const title = type === 'app' ? t('settings.selectAppLanguage') : t('settings.selectTargetLanguage');

  return (
    <Modal transparent visible={visible} animationType='none' onRequestClose={onClose}>
      <Pressable className='flex-1 justify-end' style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={onClose}>
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          }}
          className='bg-white rounded-t-3xl pt-6 pb-8'
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View className='flex-row items-center justify-between px-6 mb-4'>
            <Text className='text-xl text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {title}
            </Text>
            <Pressable onPress={onClose} className='p-2'>
              <Ionicons name='close' size={24} color='hsl(29, 10%, 55%)' />
            </Pressable>
          </View>

          {/* Language List */}
          <ScrollView className='max-h-96' showsVerticalScrollIndicator={false}>
            {languages.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => {
                  onSelect(lang.code);
                  onClose();
                }}
                className={`flex-row items-center justify-between px-6 py-4 ${
                  currentLanguage === lang.code ? 'bg-bgCard' : 'bg-white'
                } active:bg-bgSide`}
              >
                <View className='flex-row items-center'>
                  <Text className='text-2xl mr-3'>{lang.flag}</Text>
                  <Text
                    className={`text-base ${currentLanguage === lang.code ? 'text-textHead' : 'text-textText'}`}
                    style={{
                      fontFamily:
                        currentLanguage === lang.code ? 'RobotoCondensed_700Bold' : 'RobotoCondensed_400Regular',
                    }}
                  >
                    {lang.name}
                  </Text>
                </View>

                {currentLanguage === lang.code && (
                  <Ionicons name='checkmark-circle' size={24} color='hsl(130, 40%, 50%)' />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
