import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import ru from '../locales/ru.json';

const LANGUAGE_KEY = '@lingua_flow:ui_language';

// Функция для получения сохраненного языка
const getStoredLanguage = async () => {
  try {
    const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    return storedLang || 'en';
  } catch (error) {
    console.error('Error loading language:', error);
    return 'en';
  }
};

// Функция для сохранения языка
export const saveLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Сначала инициализируем i18n синхронно с дефолтным языком
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: 'en', // Дефолтный язык
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Затем асинхронно загружаем сохраненный язык
getStoredLanguage().then((storedLanguage) => {
  if (storedLanguage && storedLanguage !== i18n.language) {
    // eslint-disable-next-line import/no-named-as-default-member
    i18n.changeLanguage(storedLanguage);
  }
});

export default i18n;
