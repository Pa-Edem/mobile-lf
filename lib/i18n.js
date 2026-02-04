import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
};

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: 'en', // Язык по умолчанию
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
