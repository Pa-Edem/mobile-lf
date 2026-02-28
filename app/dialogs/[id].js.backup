// app/dialogs/[id].js
// Screen for viewing a single dialog with replicas, audio playback, and actions (analyze/export/delete)

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import ReplicaCard from '../../components/ReplicaCard';
import TrainingButton from '../../components/TrainingButton';
import UpgradeModal from '../../components/UpgradeModal';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { canUseProFeatures, getEffectivePlan } from '../../lib/planUtils';
import { supabase } from '../../lib/supabase';

export default function ViewDialogScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { playSequence, pause, stop, isPlaying, isPaused } = useAudioPlayer();

  const [dialog, setDialog] = useState(null);
  const [profile, setProfile] = useState(null);
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showLevel3UpgradeModal, setShowLevel3UpgradeModal] = useState(false);
  const [level3ModalShown, setLevel3ModalShown] = useState(false);

  // Load dialog data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch dialog
      const { data: dialogData, error: dialogError } = await supabase.from('dialogs').select('*').eq('id', id).single();

      if (dialogError) throw dialogError;

      // Fetch profile for plan check
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, is_trial_active, manual_pro, manual_premium')
        .single();

      if (profileError) throw profileError;

      // Fetch usage counters for PRO features check
      const { data: usageData, error: usageError } = await supabase.from('usage_counters').select('*').single();

      if (usageError && usageError.code !== 'PGRST116') {
        console.error('Usage error:', usageError);
      }

      setDialog(dialogData);
      setProfile(profileData);
      setUsage(usageData);
    } catch (error) {
      console.error('Load error:', error);
      Alert.alert(t('common.error'), 'Could not load dialog');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Останавливаем аудио при размонтировании компонента
  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectivePlan = getEffectivePlan(profile);
  const isPaid = effectivePlan === 'pro' || effectivePlan === 'premium';
  const isPremium = effectivePlan === 'premium';
  const hasProFeatures = canUseProFeatures(usage, profile);

  // TODO Phase 4: Premium Audio
  // Сейчас все планы используют Browser TTS
  // В будущем: PRO/PREMIUM → ElevenLabs TTS с выбором голоса
  // FREE → Browser TTS (текущая реализация)

  // Play all dialog (Play/Pause/Resume)
  const handlePlayAll = async () => {
    if (!dialog) return;

    console.log('🔘 Button pressed | isPlaying:', isPlaying, '| isPaused:', isPaused);

    if (isPlaying) {
      // Pause
      console.log('User pressed Pause');
      await pause();
    } else if (isPaused) {
      // Resume
      console.log('User pressed Resume');
      await playSequence(dialog.content.target, dialog.target_language, 1.0);
    } else {
      // Play from start
      console.log('User pressed Play');
      await playSequence(dialog.content.target, dialog.target_language, 1.0);
    }
  };

  // Menu actions
  const handleAnalyze = () => {
    setShowMenu(false);
    if (!isPaid) {
      router.push('/modals/upgrade');
    } else {
      Alert.alert('Coming soon', 'Dialog analysis will be implemented later');
    }
  };

  const handleExport = () => {
    setShowMenu(false);
    if (!isPremium) {
      router.push('/modals/upgrade');
    } else {
      Alert.alert('Coming soon', 'Export feature will be implemented later');
    }
  };

  // Обработка клика на Level 3
  const handleLevel3Click = () => {
    if (!hasProFeatures) {
      // Если модалка УЖЕ показывалась - ничего не делаем
      if (level3ModalShown) {
        return;
      }

      // Показываем модалку первый раз
      setShowLevel3UpgradeModal(true);
      return;
    }

    // Есть доступ - открываем Level 3
    router.push(`/dialogs/${id}/level-3`);
  };

  // Закрыть Upgrade modal для Level 3
  const handleLevel3UpgradeClose = () => {
    setShowLevel3UpgradeModal(false);
    setLevel3ModalShown(true); // Помечаем что модалка показана
  };

  // Переход на страницу pricing
  const handleLevel3Upgrade = () => {
    setShowLevel3UpgradeModal(false);
    router.push('/pricing');
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(t('viewDialog.deleteTitle'), t('viewDialog.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('dialogs').delete().eq('id', id);

            if (error) throw error;

            Alert.alert(t('viewDialog.deleted'));
            router.back();
          } catch (error) {
            console.error('Delete error:', error);
            Alert.alert(t('common.error'), 'Could not delete dialog');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className='flex-1 bg-bgMain items-center justify-center'>
        <ActivityIndicator size='large' color='hsl(142, 71%, 45%)' />
      </View>
    );
  }

  if (!dialog) {
    return (
      <View className='flex-1 bg-bgMain items-center justify-center'>
        <Text className='text-textBody'>Dialog not found</Text>
      </View>
    );
  }

  // const { topic, level, replicas_count, content } = dialog;
  const { topic, level, content } = dialog;
  const replicas_count = content.target.length;

  return (
    <View className='flex-1 bg-bgMain'>
      {/* Header */}
      <View className='bg-white border-b border-brdLight px-6 pt-8 pb-2'>
        <View className='flex-row items-center justify-between'>
          <Pressable onPress={() => router.back()} className='w-12 h-12 items-center justify-center mr-2'>
            <Ionicons name='arrow-back' size={24} color='hsl(29, 10%, 20%)' />
          </Pressable>

          <View className='flex-1 items-center'>
            <Text className='text-lg text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {topic}
            </Text>
            <Text className='text-sm text-textBody' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
              {level} • {replicas_count} {t('viewDialog.replicas')}
            </Text>
          </View>

          <Pressable onPress={() => setShowMenu(true)} className='ml-4'>
            <Ionicons name='ellipsis-vertical' size={24} color='hsl(29, 10%, 20%)' />
          </Pressable>
        </View>
      </View>

      {/* Content - Replicas */}
      <ScrollView className='flex-1 px-6 py-4' showsVerticalScrollIndicator={false}>
        {content.target.map((text, index) => (
          <ReplicaCard key={index} text={text} translation={content.native[index]} isLeft={index % 2 === 0} />
        ))}

        {/* End Message */}
        <Text className='text-xs text-textText text-center mt-12' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('viewDialog.endOfReplicas')}
        </Text>

        {/* Bottom spacing for floating button */}
        <View className='h-20' />
      </ScrollView>

      {/* Floating Play All Button */}
      <Pressable
        onPress={handlePlayAll}
        className={`absolute bottom-36 right-8 w-14 h-14 rounded-full items-center justify-center shadow-lg ${
          isPlaying
            ? 'bg-greenDefault active:bg-greenDark'
            : isPaused
              ? 'bg-orange-500 active:bg-orange-600'
              : 'bg-greenDefault active:bg-greenDark'
        }`}
        style={{
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
      >
        <Ionicons name={isPlaying ? 'pause' : isPaused ? 'play' : 'volume-high'} size={28} color='white' />
      </Pressable>

      {/* Footer - Training Levels (1x4) */}
      <View className='bg-white border-t border-brdLight px-6 pt-4 pb-10'>
        <View className='flex-row gap-1'>
          <TrainingButton level={0} dialogId={id} locked={false} />
          <TrainingButton level={1} dialogId={id} locked={false} />
          <TrainingButton level={2} dialogId={id} locked={!hasProFeatures} />
          <TrainingButton
            level={3}
            dialogId={id}
            locked={!hasProFeatures && level3ModalShown}
            onPress={handleLevel3Click}
          />
          <TrainingButton level={4} dialogId={id} locked={false} />
        </View>
      </View>

      {/* Menu Modal (Bottom Sheet) */}
      {showMenu && (
        <Pressable onPress={() => setShowMenu(false)} className='absolute inset-0 bg-black/50'>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className='absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-6 py-6'
          >
            {/* Analyze */}
            <Pressable onPress={handleAnalyze} className='flex-row items-center py-4 border-b border-brdLight'>
              <Ionicons name='analytics-outline' size={24} color='hsl(142, 71%, 45%)' />
              <Text className='ml-4 text-base text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                {t('viewDialog.analyze')}
              </Text>
              {!isPaid && (
                <View className='ml-auto'>
                  <Ionicons name='lock-closed' size={20} color='hsl(29, 10%, 60%)' />
                </View>
              )}
            </Pressable>

            {/* Export */}
            <Pressable onPress={handleExport} className='flex-row items-center py-4 border-b border-brdLight'>
              <Ionicons name='download-outline' size={24} color='hsl(142, 71%, 45%)' />
              <Text className='ml-4 text-base text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                {t('viewDialog.export')}
              </Text>
              {!isPremium && (
                <View className='ml-auto'>
                  <Ionicons name='lock-closed' size={20} color='hsl(29, 10%, 60%)' />
                </View>
              )}
            </Pressable>

            {/* Delete */}
            <Pressable onPress={handleDelete} className='flex-row items-center py-4'>
              <Ionicons name='trash-outline' size={24} color='hsl(0, 84%, 60%)' />
              <Text
                className='ml-4 text-base'
                style={{ fontFamily: 'RobotoCondensed_400Regular', color: 'hsl(0, 84%, 60%)' }}
              >
                {t('viewDialog.delete')}
              </Text>
            </Pressable>

            {/* Cancel */}
            <Pressable
              onPress={() => setShowMenu(false)}
              className='mt-4 mb-12 py-3 bg-bgCard rounded-full items-center'
            >
              <Text className='text-textTitle' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('common.cancel')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}

      {/* Upgrade Modal для Level 3 */}
      <UpgradeModal
        visible={showLevel3UpgradeModal}
        onClose={handleLevel3UpgradeClose}
        onUpgrade={handleLevel3Upgrade}
      />
    </View>
  );
}
