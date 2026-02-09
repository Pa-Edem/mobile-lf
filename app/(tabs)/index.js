// app/(tabs)/index.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import DialogCard from '../../components/DialogCard';
import EmptyState from '../../components/EmptyState';
import UpgradeModal from '../../components/UpgradeModal';
import UsageLimitsCard from '../../components/UsageLimitsCard';
import { canGenerateDialog, getEffectivePlan, getPlanLimits } from '../../lib/planUtils';
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
  const [canGenerate, setCanGenerate] = useState(true);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeModalShown, setUpgradeModalShown] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Получаем текущего пользователя
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
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
        throw usageError;
      }

      // Получаем профиль
      const { data: profileData } = await supabase
        .from('profiles')
        .select('subscription_tier, is_trial_active, manual_pro, manual_premium')
        .eq('id', user.id)
        .single();

      // Определяем эффективный план и его лимиты
      const plan = getEffectivePlan(profileData);
      const planLimits = getPlanLimits(plan);

      // Проверяем возможность генерации
      const canGen = canGenerateDialog(usageData, profileData);
      setCanGenerate(canGen);

      // Если не может генерировать и модалка ещё не показывалась - сбросим флаг
      if (canGen) {
        setUpgradeModalShown(false);
      }

      // DEBUG: Логируем для отладки
      console.log('=== LOAD DATA DEBUG ===');
      console.log('canGenerate:', canGen);
      console.log('daily_generations_used:', usageData?.daily_generations_used);
      console.log('plan:', plan);
      console.log('planLimits:', planLimits);
      console.log('=======================');

      // Устанавливаем лимиты для UI
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
    } finally {
      setLoading(false);
    }
  }, []);

  // Автоматически загружаем данные при возврате на экран
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleCreateDialog = () => {
    // Если не может генерировать
    if (!canGenerate) {
      // Если модалка УЖЕ показывалась - ничего не делаем
      if (upgradeModalShown) {
        return;
      }

      // Показываем модалку первый раз
      setUpgradeModalVisible(true);
      return;
    }

    // Может генерировать - открываем форму
    router.push('/dialogs/new');
  };

  const handleUpgradeModalClose = () => {
    setUpgradeModalVisible(false);
    setUpgradeModalShown(true); // Помечаем что модалка показана
  };

  const handleUpgrade = () => {
    setUpgradeModalVisible(false);
    router.push('/pricing'); // TODO: создать в Phase 4 страницу с преимуществами Pro и Premium
  };

  const handleDialogPress = (dialogId) => {
    router.push(`/dialogs/${dialogId}`);
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

          {/* Create Button - меняет цвет в зависимости от canGenerate */}
          <Pressable
            onPress={handleCreateDialog}
            disabled={!canGenerate && upgradeModalShown}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              !canGenerate && upgradeModalShown ? 'bg-textDis' : 'bg-greenDefault active:bg-greenDark'
            }`}
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
            <View key={level} className='mb-1'>
              {/* Level Header */}
              <Text className='text-xs text-textTitle mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {level}
              </Text>

              {/* Dialogs */}
              {groupedDialogs[level].map((dialog) => (
                <DialogCard key={dialog.id} dialog={dialog} onPress={() => handleDialogPress(dialog.id)} />
              ))}
            </View>
          ))}

          {/* End Message */}
          <Text className='text-xs text-textText text-center mt-4' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('main.endOfDialogs')}
          </Text>
        </ScrollView>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal visible={upgradeModalVisible} onClose={handleUpgradeModalClose} onUpgrade={handleUpgrade} />
    </View>
  );
}
