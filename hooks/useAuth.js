// hooks/useAuth.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import i18n from '../lib/i18n';
import { supabase } from '../lib/supabase';

const TARGET_LANGUAGE_KEY = '@lingua_flow:target_language';

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // Успешный вход - переход на главную
      router.replace('/(tabs)');

      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password) => {
    setLoading(true);
    try {
      // 1. Регистрация в Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      // 2. Получаем сохраненный target language
      const targetLanguage = (await AsyncStorage.getItem(TARGET_LANGUAGE_KEY)) || 'fi';
      const uiLanguage = i18n.language || 'en';

      // 3. Создаем профиль в БД
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: email.trim(),
        ui_language: uiLanguage,
        target_language: targetLanguage,
        subscription_tier: 'free',
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Не бросаем ошибку, т.к. auth уже создан
      }

      // 4. Переход на главную
      router.replace('/(tabs)');

      return authData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    signIn,
    signUp,
    signOut,
    loading,
  };
}
