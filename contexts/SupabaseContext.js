// contexts/SupabaseContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SupabaseContext = createContext({});

export function SupabaseProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateSession = async (currentSession) => {
      if (!currentSession) return false;

      try {
        // Проверяем профиль с небольшим retry
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          attempts++;

          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', currentSession.user.id)
            .maybeSingle();

          if (profile) return true;

          // Ждём перед следующей попыткой
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        // Профиль не найден даже после retry
        console.warn('Profile not found, logging out');
        await supabase.auth.signOut();
        return false;
      } catch (err) {
        console.error('Validation error:', err);
        return false;
      }
    };

    // Инициализация при запуске
    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (initialSession) {
          const isValid = await validateSession(initialSession);
          setSession(isValid ? initialSession : null);
        } else {
          setSession(null);
        }
      } finally {
        setLoading(false);
      }
    };

    // Запускаем инициализацию
    initializeAuth();

    // Подписываемся на изменения auth состояния
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (currentSession) {
        const isValid = await validateSession(currentSession);
        setSession(isValid ? currentSession : null);
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <SupabaseContext.Provider value={{ session, loading }}>{children}</SupabaseContext.Provider>;
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
