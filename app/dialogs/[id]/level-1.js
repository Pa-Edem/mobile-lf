// app/dialogs/[id]/level-1.js
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import CompletionModal from '../../../components/CompletionModal';
import ReplicaCard from '../../../components/ReplicaCard';
import { useAudioPlayer } from '../../../hooks/useAudioPlayer';
import { supabase } from '../../../lib/supabase';

export default function Level1Training() {
  const { id } = useLocalSearchParams();
  const scrollViewRef = useRef(null);
  const startTimeRef = useRef(null);
  const { t } = useTranslation();

  const { playSequence, stop } = useAudioPlayer();

  const [dialog, setDialog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  // const [replayCount, setReplayCount] = useState(0);

  // Загрузка диалога
  const loadDialog = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('dialogs').select('*').eq('id', id).single();

      if (error) throw error;

      setDialog(data);
      startTimeRef.current = Date.now();
    } catch (error) {
      console.error('Load error:', error);
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDialog();
  }, [loadDialog]);

  // Принудительная остановка всех аудио при монтировании и размонтировании
  useEffect(() => {
    Speech.stop(); // Остановить любое аудио из предыдущего экрана

    return () => {
      Speech.stop();
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Показать первую реплику при загрузке
  useEffect(() => {
    if (dialog && visibleCount === 0) {
      handleNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);

  // Автопрокрутка к последней реплике
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Воспроизведение текущей (последней показанной) реплики
  const handlePlayCurrent = async () => {
    if (!dialog || visibleCount === 0) return;

    // Остановить текущую озвучку
    await stop();

    const currentIndex = visibleCount - 1;
    const text = dialog.content.target[currentIndex];

    // Задержка 0,5 сек перед воспроизведением
    setTimeout(async () => {
      await playSequence([text], dialog.target_language, 1.0);
      // setReplayCount((prev) => prev + 1);
    }, 500);
  };

  // С начала (сброс без модалки)
  const handleRestart = async () => {
    // Сбрасываем состояние
    // setReplayCount(0);
    startTimeRef.current = Date.now();
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

    // Сбрасываем счётчик ДО показа первой реплики
    setVisibleCount(0);

    // Небольшая задержка для применения state
    setTimeout(() => {
      // Явно показываем первую реплику (индекс 0)
      setVisibleCount(1);
      scrollToBottom();

      // Воспроизводим ПЕРВУЮ реплику (индекс 0)
      const firstText = dialog.content.target[0];
      setTimeout(async () => {
        await playSequence([firstText], dialog.target_language, 1.0);
      }, 500);
    }, 100);
  };

  // Следующая реплика
  const handleNext = async () => {
    if (!dialog) return;

    const totalReplicas = dialog.content.target.length;

    // Если это последняя реплика -> показываем модалку
    if (visibleCount >= totalReplicas) {
      setIsCompleted(true);

      // Сохраняем результат
      // const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      // await saveTrainingLog({
      //   dialogId: id,
      //   type: 'level_1',
      //   accuracyScore: 100,
      //   totalReplicas: totalReplicas,
      //   correctReplicas: totalReplicas,
      //   durationSeconds,
      //   metadata: {
      //     completed: true,
      //     replays: replayCount,
      //   },
      // });

      return;
    }

    // Остановить текущую озвучку перед новой
    await stop();

    // Показываем следующую реплику
    setVisibleCount((prev) => prev + 1);
    scrollToBottom();

    // Автовоспроизведение через 0,5 сек
    const currentIndex = visibleCount;
    const text = dialog.content.target[currentIndex];

    setTimeout(async () => {
      await playSequence([text], dialog.target_language, 1.0);
    }, 500);
  };

  // Выход
  const handleExit = async () => {
    await stop();
    router.back();
  };

  // Закрыть модалку -> вернуться к диалогу
  const handleCloseModal = async () => {
    setIsCompleted(false);
    await stop();
    router.back();
  };

  // Повторить уровень
  const handleRepeat = async () => {
    setIsCompleted(false);
    await stop();
    setVisibleCount(0);
    // setReplayCount(0);
    startTimeRef.current = Date.now();
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

    // Показать первую реплику
    setTimeout(() => {
      handleNext();
    }, 300);
  };

  if (isLoading) {
    return (
      <View className='flex-1 bg-bgMain items-center justify-center'>
        <ActivityIndicator size='large' color='hsl(130, 40%, 50%)' />
      </View>
    );
  }

  if (!dialog) {
    return (
      <View className='flex-1 bg-bgMain items-center justify-center'>
        <Text className='text-textText'>Dialog not found</Text>
      </View>
    );
  }

  const totalReplicas = dialog.content.target.length;

  return (
    <View className='flex-1 bg-bgMain'>
      {/* Header */}
      <View className='bg-white border-b border-brdLight px-6 pt-8 pb-2'>
        <Text className='text-lg text-textHead text-center mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('training.level1.title')}
        </Text>
        <Text className='text-sm text-textText text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          {t('training.level1.progress', { current: visibleCount, total: totalReplicas })}
        </Text>
      </View>

      {/* Content - Replicas */}
      <ScrollView
        ref={scrollViewRef}
        className='flex-1 px-6 py-4'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {dialog.content.target.slice(0, visibleCount).map((text, index) => (
          <Animated.View key={index} entering={FadeInDown.delay(100).duration(400)}>
            <ReplicaCard text={text} translation={dialog.content.native[index]} isLeft={index % 2 === 0} />
          </Animated.View>
        ))}
      </ScrollView>

      {/* Footer - Control Buttons  */}
      <View className='bg-white border-t border-brdLight px-6 pt-4 pb-8'>
        <View className='flex-row gap-1'>
          {/* 1. Выход */}
          <Pressable
            onPress={handleExit}
            className='w-16 h-16 rounded-full bg-bgSide items-center justify-center m-auto active:opacity-80'
          >
            <Ionicons name='close' size={36} color='#0a5c18' />
          </Pressable>

          {/* 2. С начала */}
          <Pressable
            onPress={handleRestart}
            disabled={visibleCount === 0}
            className='w-16 h-16 rounded-full bg-bgSide items-center justify-center m-auto active:opacity-80'
          >
            <Ionicons name='repeat' size={36} color='#0a5c18' />
          </Pressable>

          {/* 3. Микрофон (disabled) */}
          {/* <Pressable disabled className='w-14 h-14 rounded-full bg-bgCard items-center justify-center opacity-50'>
            <Ionicons name='mic' size={28} color='#d6cec2' />
          </Pressable> */}

          {/* 4. Повтор текущей */}
          <Pressable
            onPress={handlePlayCurrent}
            disabled={visibleCount === 0}
            className='w-16 h-16 rounded-full bg-bgSide items-center justify-center m-auto active:opacity-80'
          >
            <Ionicons name='refresh' size={36} color='#0a5c18' />
          </Pressable>

          {/* 5. Следующая (зелёный) */}
          <Pressable
            onPress={handleNext}
            className='w-16 h-16 rounded-full bg-success items-center justify-center m-auto active:opacity-80'
          >
            <Ionicons name='arrow-forward' size={36} color='#0a5c18' />
          </Pressable>
        </View>
      </View>

      {/* Completion Modal */}
      <CompletionModal visible={isCompleted} level={1} onClose={handleCloseModal} onRepeat={handleRepeat} />
    </View>
  );
}
