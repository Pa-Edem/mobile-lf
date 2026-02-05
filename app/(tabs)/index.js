import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

function UsageLimitsCard({ usage, collapsed, onToggle }) {
  const { t } = useTranslation();

  const getPercentage = (used, total) => (used / total) * 100;

  return (
    <View className={`bg-bgCard rounded-3xl p-4 border border-brdLight ${collapsed ? 'mb-4' : 'mb-6'}`}>
      {/* Header */}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center'>
          <View className='w-8 h-8 bg-greenDefault rounded-lg items-center justify-center mr-3'>
            <Ionicons name='stats-chart' size={18} color='white' />
          </View>
          <Text className='text-sm text-textTitle' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('main.usageLimits')}
          </Text>
        </View>

        <Pressable onPress={onToggle} className='w-10 h-10 bg-greenDefault rounded-full items-center justify-center'>
          <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={20} color='white' />
        </Pressable>
      </View>

      {/* Content */}
      {!collapsed && (
        <View className='mt-4'>
          {/* Generations */}
          <View className='mb-4'>
            <View className='flex-row justify-between mb-2'>
              <Text className='text-xs text-textText' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('main.generations')}
              </Text>
              <Text className='text-xs text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {usage.generations.used}/{usage.generations.total}
              </Text>
            </View>
            <View className='h-2 bg-brdLight rounded-full overflow-hidden'>
              <View
                className='h-full bg-greenDefault rounded-full'
                style={{ width: `${getPercentage(usage.generations.used, usage.generations.total)}%` }}
              />
            </View>
          </View>

          {/* PRO Features */}
          <View className='mb-4'>
            <View className='flex-row justify-between mb-2'>
              <Text className='text-xs text-textText' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('main.proFeatures')}
              </Text>
              <Text className='text-xs text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {usage.proFeatures.used}/{usage.proFeatures.total}
              </Text>
            </View>
            <View className='h-2 bg-brdLight rounded-full overflow-hidden'>
              <View
                className='h-full bg-greenDefault rounded-full'
                style={{ width: `${getPercentage(usage.proFeatures.used, usage.proFeatures.total)}%` }}
              />
            </View>
          </View>

          {/* Saved Dialogs */}
          <View>
            <View className='flex-row justify-between mb-2'>
              <Text className='text-xs text-textText' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('main.savedDialogs')}
              </Text>
              <Text className='text-xs text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {usage.savedDialogs.used}/{usage.savedDialogs.total}
              </Text>
            </View>
            <View className='h-2 bg-brdLight rounded-full overflow-hidden'>
              <View
                className='h-full bg-greenDefault rounded-full'
                style={{ width: `${getPercentage(usage.savedDialogs.used, usage.savedDialogs.total)}%` }}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function DialogCard({ dialog, onPress }) {
  const { t } = useTranslation();

  // Определяем статус тренировок из БД
  const trainingStatus = {
    level2: false, // TODO: проверять из training_logs
    level3: false,
    level4: false,
  };

  return (
    <Pressable onPress={onPress} className='bg-white rounded-2xl p-4 mb-3 border border-brdLight active:bg-bgSide'>
      <View className='flex-row items-center justify-between'>
        <View className='flex-1'>
          <Text className='text-lg text-textHead mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {dialog.topic}
          </Text>
          <Text className='text-sm text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {dialog.replicas_count} {t('main.lines')}
          </Text>
        </View>

        {/* Training Status Icons */}
        <View className='flex-row gap-3'>
          {/* Level 2: Pronunciation */}
          <Ionicons name='mic' size={20} color={trainingStatus.level2 ? 'hsl(130, 40%, 50%)' : 'hsl(36, 20%, 80%)'} />

          {/* Level 3: Translation */}
          <Ionicons
            name='language'
            size={20}
            color={trainingStatus.level3 ? 'hsl(130, 40%, 50%)' : 'hsl(36, 20%, 80%)'}
          />

          {/* Level 4: Listening */}
          <Ionicons name='ear' size={20} color={trainingStatus.level4 ? 'hsl(130, 40%, 50%)' : 'hsl(36, 20%, 80%)'} />
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState({ onCreateDialog }) {
  const { t } = useTranslation();

  return (
    <View className='flex-1 items-center justify-center px-6 py-12'>
      {/* Icon with gradient circle */}
      <View className='items-center justify-center mb-8'>
        <View
          className='w-48 h-48 rounded-full items-center justify-center'
          style={{
            backgroundColor: 'hsla(130, 40%, 50%, 0.1)',
            borderWidth: 2,
            borderColor: 'hsla(130, 40%, 50%, 0.2)',
            borderStyle: 'dashed',
          }}
        >
          <View className='w-32 h-32 bg-greenDefault rounded-2xl items-center justify-center'>
            <Ionicons name='chatbubbles' size={64} color='white' />
          </View>
        </View>
      </View>

      {/* Text */}
      <Text className='text-2xl text-textHead mb-3 text-center' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
        {t('emptyState.title')}
      </Text>

      <Text className='text-base text-textText mb-8 text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
        {t('emptyState.description')}
      </Text>

      {/* Create Button */}
      <Pressable
        onPress={onCreateDialog}
        className='bg-greenDefault px-8 py-4 rounded-full flex-row items-center active:bg-greenDark'
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Ionicons name='chatbubbles' size={20} color='white' />
        <Text className='text-white text-base ml-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('emptyState.button')}
        </Text>
      </Pressable>
    </View>
  );
}

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
        <ScrollView className='flex-1' contentContainerClassName='px-6 pt-6 pb-8' showsVerticalScrollIndicator={false}>
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
