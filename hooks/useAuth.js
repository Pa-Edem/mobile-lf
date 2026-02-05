import { router } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: undefined, // Отключаем email verification для тестирования
        },
      });

      if (error) throw error;

      // После регистрации сразу входим
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
