// app/(tabs)/index.js
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import DialogCard from '../../components/DialogCard';
import EmptyState from '../../components/EmptyState';
import UsageLimitsCard from '../../components/UsageLimitsCard';
import { supabase } from '../../lib/supabase';

// Группируем диалоги по уровням (A2.1 + A2.2 = A2)
function groupDialogsByLevel(dialogs) {
  const grouped = {};

  dialogs.forEach((dialog) => {
    // Извлекаем базовый уровень (A1, A2, B1, etc.)
    const baseLevel = dialog.level.match(/^[ABC][12]/)?.[0] || dialog.level;

    if (!grouped[baseLevel]) {
      grouped[baseLevel] = [];
    }
    grouped[baseLevel].push(dialog);
  });

  return grouped;
}

export default function MainScreen() {
  const { t } = useTranslation();
  const [limitsCollapsed, setLimitsCollapsed] = useState(false);
  const [dialogs, setDialogs] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Получаем текущего пользователя
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }

      // Загружаем диалоги
      const { data: dialogsData, error: dialogsError } = await supabase
        .from('dialogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dialogsError) throw dialogsError;

      // Загружаем usage counters
      const { data: usageData, error: usageError } = await supabase
        .from('usage_counters')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (usageError && usageError.code !== 'PGRST116') {
        // PGRST116 = no rows, это ок для нового пользователя
        throw usageError;
      }

      // Получаем профиль для определения лимитов
      const { data: profileData } = await supabase
        .from('profiles')
        .select('subscription_tier, is_trial_active')
        .eq('id', user.id)
        .single();

      // Определяем лимиты по плану
      const plan = profileData?.is_trial_active ? 'pro' : profileData?.subscription_tier || 'free';

      const limits = {
        free: { generations: 4, proFeatures: 8, dialogs: 4 },
        pro: { generations: 10, proFeatures: 20, dialogs: 10 },
        premium: { generations: 20, proFeatures: 999, dialogs: 50 },
      };

      const planLimits = limits[plan];

      setUsage({
        generations: {
          used: usageData?.daily_generations_used || 0,
          total: planLimits.generations,
        },
        proFeatures: {
          used: usageData?.daily_pro_features_used || 0,
          total: planLimits.proFeatures,
        },
        savedDialogs: {
          used: usageData?.total_dialogs_count || 0,
          total: planLimits.dialogs,
        },
      });

      setDialogs(dialogsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDialog = () => {
    // TODO: Navigate to create dialog screen
    Alert.alert('Info', 'Create Dialog - Coming in Phase 2');
  };

  const handleDialogPress = (dialogId) => {
    // TODO: Navigate to view dialog screen
    Alert.alert('Info', `Opening dialog ${dialogId} - Coming in Phase 2`);
  };

  if (loading) {
    return (
      <View className='flex-1 bg-bgMain justify-center items-center'>
        <ActivityIndicator size='large' color='hsl(130, 40%, 50%)' />
      </View>
    );
  }

  const groupedDialogs = groupDialogsByLevel(dialogs);
  const levels = Object.keys(groupedDialogs).sort();
  const hasDialogs = dialogs.length > 0;

  return (
    <View className='flex-1 bg-bgMain'>
      {/* Header */}
      <View className='bg-white border-b border-brdLight px-6 pt-12 pb-4'>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center'>
            <Image source={require('../../assets/images/logo.png')} className='w-8 h-8 mr-3' resizeMode='contain' />
            <Text className='text-xl text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {t('main.title')}
            </Text>
          </View>

          <Pressable
            onPress={handleCreateDialog}
            className='w-12 h-12 bg-greenDefault rounded-full items-center justify-center'
          >
            <Ionicons name='add' size={28} color='white' />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {!hasDialogs ? (
        // Empty State
        <EmptyState onCreateDialog={handleCreateDialog} />
      ) : (
        // Dialogs List
        <ScrollView
          className='flex-1'
          contentContainerClassName='px-6 pt-6 pb-8'
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadData}
              colors={['hsl(130, 40%, 50%)']}
              tintColor='hsl(130, 40%, 50%)'
            />
          }
        >
          {/* Usage Limits */}
          {usage && (
            <UsageLimitsCard
              usage={usage}
              collapsed={limitsCollapsed}
              onToggle={() => setLimitsCollapsed(!limitsCollapsed)}
            />
          )}

          {/* Dialogs by Level */}
          {levels.map((level) => (
            <View key={level} className='mb-6'>
              {/* Level Header */}
              <Text className='text-xs text-textText mb-3' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {level}
              </Text>

              {/* Dialogs */}
              {groupedDialogs[level].map((dialog) => (
                <DialogCard key={dialog.id} dialog={dialog} onPress={() => handleDialogPress(dialog.id)} />
              ))}
            </View>
          ))}

          {/* End Message */}
          <Text className='text-xs text-textDis text-center mt-4' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('main.endOfDialogs')}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}
