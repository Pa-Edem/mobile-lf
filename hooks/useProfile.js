import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (error) throw error;
      return data;
    },
    // Кэшируем профиль на 5 минут
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Инвалидируем кэш профиля после успешного обновления
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
