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
      const targetLanguage = (await AsyncStorage.getItem(TARGET_LANGUAGE_KEY)) || 'fi';
      const uiLanguage = i18n.language || 'en';

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            ui_language: uiLanguage,
            target_language: targetLanguage,
          },
        },
      });

      if (error) throw error;

      router.replace('/(tabs)');

      return data;
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
