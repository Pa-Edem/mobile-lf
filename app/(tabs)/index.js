// app/(tabs)/index.js
// Главный экран
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
import {
  canGenerateDialog,
  getAvailableGenerations,
  getAvailableProFeatures,
  getEffectivePlan,
  getPlanLimits,
} from '../../lib/planUtils';
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

  const [usageData, setUsageData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [planLimits, setPlanLimits] = useState(null);

  const [loading, setLoading] = useState(true);
  const [canGenerate, setCanGenerate] = useState(true);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeModalShown, setUpgradeModalShown] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      // Загружаем диалоги с training_logs
      const { data: dialogsData, error: dialogsError } = await supabase
        .from('dialogs')
        .select(`*, training_logs (type, metadata)`)
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

      // Если записи нет (новый пользователь или старый без usage_counters)
      if (!usageData) {
        console.log('⚠️ No usage_counters record found, creating...');
        usageData = {
          user_id: user.id,
          daily_generations_used: 0,
          daily_pro_features_used: 0,
          total_dialogs_count: 0,
          carry_over_generations: 0,
          carry_over_pro_features: 0,
        };
      }

      // Получаем профиль
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      // Определяем эффективный план и его лимиты
      const plan = getEffectivePlan(profileData);
      const planLimits = getPlanLimits(plan);

      // Рассчитываем доступные ресурсы
      // const availableGens = getAvailableGenerations(usageData, profileData);
      // const availablePro = getAvailableProFeatures(usageData, profileData);

      // Проверяем возможность генерации
      const canGen = canGenerateDialog(usageData, profileData);
      setCanGenerate(canGen);

      // Если не может генерировать и модалка ещё не показывалась - сбросим флаг
      if (canGen) {
        setUpgradeModalShown(false);
      }

      // Логируем для отладки
      // console.log('=== MAIN SCREEN =======');
      // console.log('Plan:', plan);
      // console.log('Available generations:', availableGens);
      // console.log('Available PRO features:', availablePro);
      // console.log('Can generate:', canGen);
      // console.log('=======================');

      // Обрабатываем статусы тренировок
      const processedDialogs = (dialogsData || []).map((dialog) => {
        const trainingStatus = {
          level2: false,
          level3: false,
          level4: false,
        };

        // Проверяем каждую запись training_logs
        if (dialog.training_logs && dialog.training_logs.length > 0) {
          dialog.training_logs.forEach((log) => {
            if (log.type === 'level_2' && log.metadata?.isCompleted === true) {
              trainingStatus.level2 = true;
            }
            if (log.type === 'level_3' && log.metadata?.isCompleted === true) {
              trainingStatus.level3 = true;
            }
            if (log.type === 'level_4' && log.metadata?.isCompleted === true) {
              trainingStatus.level4 = true;
            }
          });
        }

        return {
          ...dialog,
          trainingStatus,
        };
      });

      setDialogs(processedDialogs);
      // ========== СОХРАНЯЕМ ДЛЯ UsageLimitsCard ==========
      setUsageData(usageData);
      setProfileData(profileData);
      setPlanLimits(planLimits);
      // console.log('=== SAVED STATE ===');
      // console.log('usageData saved:', usageData ? 'YES' : 'NO');
      // console.log('profileData saved:', profileData ? 'YES' : 'NO');
      // console.log('planLimits saved:', planLimits);
      // console.log('===================');
      // ===================================================
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
          {/* ========== ДОБАВЬ ЭТО ========== */}
          {/* {console.log('=== RENDER CHECK ===')}
          {console.log('usageData:', usageData ? 'EXISTS' : 'NULL')}
          {console.log('profileData:', profileData ? 'EXISTS' : 'NULL')}
          {console.log('planLimits:', planLimits ? 'EXISTS' : 'NULL')}
          {console.log('====================')} */}
          {/* ================================ */}
          {/* Usage Limits */}
          {usageData && profileData && planLimits && (
            <UsageLimitsCard
              usage={usageData}
              profile={profileData}
              limits={planLimits}
              availableGenerations={getAvailableGenerations(usageData, profileData)}
              availableProFeatures={getAvailableProFeatures(usageData, profileData)}
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
