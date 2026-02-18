// app/dialogs/[id]/level-2.js
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import AccuracyResult from '../../../components/AccuracyResult';
import CompletionModal from '../../../components/CompletionModal';
import RecordButton from '../../../components/RecordButton';
import { useAudioPlayer } from '../../../hooks/useAudioPlayer';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { useProfile } from '../../../hooks/useProfile';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { useTrainingLogger } from '../../../hooks/useTrainingLogger';
import { canUseProFeatures } from '../../../lib/planUtils';
import { supabase } from '../../../lib/supabase';

export default function Level2Training() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();

  // Hooks
  const { data: profile } = useProfile();
  const { playSequence, stop } = useAudioPlayer();
  const { startRecording, stopRecording, deleteRecording, deleteAllRecordings, isRecording } = useAudioRecorder();
  const { recognizeSpeech, calculateAccuracy, isProcessing } = useSpeechRecognition();
  const { saveTrainingLog } = useTrainingLogger();

  // State
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [replicaResults, setReplicaResults] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [proFeaturesUsedInSession, setProFeaturesUsedInSession] = useState(0);
  const [usageData, setUsageData] = useState(null);

  const startTimeRef = useRef(Date.now());
  const currentRecordingUri = useRef(null);

  // Загрузка диалога и usage
  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Загружаем диалог
      const { data: dialogData, error: dialogError } = await supabase.from('dialogs').select('*').eq('id', id).single();

      if (dialogError) throw dialogError;

      setDialog(dialogData);

      // Загружаем usage counters
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: usage } = await supabase.from('usage_counters').select('*').eq('user_id', user.id).single();

        setUsageData(usage);

        // Проверяем доступ к PRO функциям
        if (!canUseProFeatures(usage, profile)) {
          Alert.alert(t('training.level2.errors.proLimitReached'), t('common.upgradeToUnlock'), [
            { text: t('common.cancel'), onPress: () => router.back() },
            { text: t('common.upgrade'), onPress: () => router.push('/pricing') },
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(t('common.error'), error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, profile, t]);

  // Immersive mode для Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('inset-swipe');
    }

    return () => {
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('visible');
      }
    };
  }, []);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up Level 2...');
      stop();
      deleteAllRecordings();
    };
  }, [stop, deleteAllRecordings]);

  if (loading || !dialog) {
    return (
      <View className='flex-1 bg-bgMain items-center justify-center'>
        <ActivityIndicator size='large' color='hsl(130, 40%, 50%)' />
      </View>
    );
  }

  const totalReplicas = dialog.content.target.length;
  const currentText = dialog.content.target[currentIndex];
  const currentNative = dialog.content.native[currentIndex];
  const currentAttempts = replicaResults[currentIndex]?.attempts || 0;
  const completedCount = Object.values(replicaResults).filter((r) => r.bestAccuracy >= 70).length;

  // Обработка записи
  const handleRecord = async () => {
    // Проверяем лимит PRO функций перед каждой попыткой
    if (!canUseProFeatures(usageData, profile)) {
      Alert.alert(t('training.level2.errors.proLimitReached'), t('common.upgradeToUnlock'), [
        { text: t('common.ok') },
        { text: t('common.upgrade'), onPress: () => router.push('/pricing') },
      ]);
      return;
    }

    if (isRecording) {
      // Останавливаем запись
      try {
        const result = await stopRecording();
        if (result?.uri) {
          currentRecordingUri.current = result.uri;
          await processRecording(result.uri);
        }
      } catch (error) {
        console.error('Stop recording error:', error);
        Alert.alert(t('common.error'), t('training.level2.errors.recordingFailed'));
      }
    } else {
      // Начинаем запись
      try {
        await startRecording();
      } catch (error) {
        console.error('Start recording error:', error);

        if (error.message.includes('permission')) {
          Alert.alert(t('common.error'), t('training.level2.errors.micPermission'));
        } else {
          Alert.alert(t('common.error'), t('training.level2.errors.recordingFailed'));
        }
      }
    }
  };

  // Обработка распознавания
  const processRecording = async (uri) => {
    try {
      console.log('🎧 Processing recording:', uri);

      // Распознаём речь
      const recognizedText = await recognizeSpeech(uri, dialog.target_language);
      console.log('Recognized:', recognizedText);

      // Сравниваем с оригиналом
      const accuracy = calculateAccuracy(currentText, recognizedText);
      console.log('Accuracy:', accuracy);

      // Обновляем результаты
      handleAttemptResult(accuracy, recognizedText);

      // Показываем результат
      setCurrentResult({
        original: currentText,
        recognized: recognizedText,
        accuracy,
      });
      setShowResult(true);

      // Удаляем файл записи
      await deleteRecording(uri);
      currentRecordingUri.current = null;
    } catch (error) {
      console.error('Processing error:', error);

      // Удаляем файл даже при ошибке
      if (uri) {
        await deleteRecording(uri);
      }

      // Показываем понятную ошибку
      if (error.message.includes('rate limit')) {
        Alert.alert(t('common.error'), t('training.level2.errors.rateLimitExceeded'));
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        Alert.alert(t('common.error'), t('training.level2.errors.networkError'));
      } else {
        Alert.alert(t('common.error'), t('training.level2.errors.recognitionFailed'));
      }
    }
  };

  // Обработка результата попытки
  const handleAttemptResult = (accuracy, recognizedText) => {
    const newAttemptNumber = currentAttempts + 1;

    // Обновляем результаты реплики
    setReplicaResults((prev) => ({
      ...prev,
      [currentIndex]: {
        bestAccuracy: Math.max(prev[currentIndex]?.bestAccuracy || 0, accuracy),
        attempts: newAttemptNumber,
        lastRecognized: recognizedText,
        allRecognized: [...(prev[currentIndex]?.allRecognized || []), recognizedText],
      },
    }));

    // Логика использования PRO-функций
    let newProUsed = proFeaturesUsedInSession;

    // Правило 1: >3 попытки на реплику
    if (newAttemptNumber === 4 && currentAttempts === 3) {
      newProUsed++;
      console.log('✅ PRO used: >3 attempts on replica', currentIndex);
      incrementProFeatureUsage();
    }

    // Правило 2: Пройдено >=50% реплик
    if (accuracy >= 70) {
      const halfReplicas = Math.floor(totalReplicas / 2);
      const newCompletedCount = completedCount + 1;

      if (newCompletedCount >= halfReplicas && proFeaturesUsedInSession === 0) {
        newProUsed++;
        console.log('✅ PRO used: 50% threshold reached');
        incrementProFeatureUsage();
      }
    }

    setProFeaturesUsedInSession(newProUsed);
  };

  // Инкремент счётчика PRO функций в БД
  const incrementProFeatureUsage = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.rpc('increment_pro_feature_usage', {
        p_user_id: user.id,
      });

      if (error) throw error;

      console.log('✅ PRO feature usage incremented');

      // Обновляем локальный usage
      const { data: updatedUsage } = await supabase.from('usage_counters').select('*').eq('user_id', user.id).single();

      if (updatedUsage) {
        setUsageData(updatedUsage);
      }
    } catch (error) {
      console.error('Failed to increment PRO usage:', error);
    }
  };

  // Прослушать реплику
  const handlePlayAudio = async () => {
    await stop();
    await playSequence([currentText], dialog.target_language, 1.0);
  };

  // Следующая реплика
  const handleNext = async () => {
    await stop();
    setShowResult(false);
    setCurrentResult(null);

    if (currentIndex < totalReplicas - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Последняя реплика - завершение
      await handleCompletion();
    }
  };

  // Попробовать ещё раз
  const handleTryAgain = () => {
    setShowResult(false);
    setCurrentResult(null);
  };

  // Завершение тренировки
  const handleCompletion = async () => {
    await stop();
    await deleteAllRecordings();

    const results = Object.values(replicaResults);
    const totalAccuracy = results.reduce((sum, r) => sum + r.bestAccuracy, 0);
    const avgAccuracy = Math.round(totalAccuracy / results.length);
    const minAccuracy = Math.min(...results.map((r) => r.bestAccuracy));

    const isCompleted = avgAccuracy >= 70 && minAccuracy >= 50;

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const correctCount = results.filter((r) => r.bestAccuracy >= 70).length;

    await saveTrainingLog({
      dialogId: id,
      type: 'level_2',
      accuracyScore: avgAccuracy,
      totalReplicas: totalReplicas,
      correctReplicas: correctCount,
      durationSeconds: duration,
      metadata: {
        results: Object.entries(replicaResults).map(([index, result]) => ({
          replica_index: parseInt(index),
          original_text: dialog.content.target[index],
          recognized_texts: result.allRecognized,
          best_accuracy: result.bestAccuracy,
          attempts: result.attempts,
        })),
        avg_accuracy: avgAccuracy,
        min_accuracy: minAccuracy,
        isCompleted: isCompleted,
        proFeaturesUsed: proFeaturesUsedInSession,
      },
    });

    setFinalAccuracy(avgAccuracy);
    setShowCompletion(true);
  };

  // Выход
  const handleExit = () => {
    Alert.alert(t('common.confirm'), t('common.exitWithoutSaving'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.exit'),
        style: 'destructive',
        onPress: async () => {
          await stop();
          await deleteAllRecordings();
          router.back();
        },
      },
    ]);
  };

  // Повторить уровень
  const handleRepeat = async () => {
    setShowCompletion(false);
    setCurrentIndex(0);
    setReplicaResults({});
    setShowResult(false);
    setCurrentResult(null);
    setProFeaturesUsedInSession(0);
    startTimeRef.current = Date.now();
  };

  // Закрыть модалку
  const handleCloseModal = async () => {
    setShowCompletion(false);
    router.back();
  };

  return (
    <View className='flex-1 bg-bgMain'>
      {/* Header */}
      <View className='bg-white border-b border-brdLight px-6 pt-12 pb-4'>
        <Text className='text-lg text-textHead text-center mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('training.level2.title')}
        </Text>
        <Text className='text-sm text-textText text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          {t('training.level2.progress', { current: currentIndex + 1, total: totalReplicas })}
        </Text>
      </View>

      {/* Content */}
      <ScrollView className='flex-1 px-6 pt-6' showsVerticalScrollIndicator={false}>
        {/* Реплика */}
        <View className='bg-white rounded-2xl p-6 mb-6 border border-brdLight'>
          <Text className='text-2xl text-textHead text-center mb-4' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {currentText}
          </Text>
          <Text className='text-base text-textText text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {currentNative}
          </Text>
        </View>

        {/* Результат (если есть) */}
        {showResult && currentResult && (
          <View className='mb-6'>
            <AccuracyResult
              original={currentResult.original}
              recognized={currentResult.recognized}
              accuracy={currentResult.accuracy}
            />
          </View>
        )}

        {/* Кнопка записи */}
        <View className='items-center mb-6'>
          <RecordButton
            isRecording={isRecording}
            isProcessing={isProcessing}
            onPress={handleRecord}
            disabled={isProcessing || showResult}
          />
          <Text className='text-sm text-textText mt-4 text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {isRecording
              ? t('training.level2.recording')
              : isProcessing
                ? t('training.level2.processing')
                : t('training.level2.tapToRecord')}
          </Text>
        </View>

        {/* Кнопки действий (если показан результат) */}
        {showResult && (
          <View className='flex-row gap-3 mb-6'>
            <Pressable onPress={handleTryAgain} className='flex-1 bg-yellow-500 rounded-xl py-4 active:bg-yellow-600'>
              <Text className='text-white text-center text-base' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('training.level2.tryAgain')}
              </Text>
            </Pressable>

            <Pressable onPress={handleNext} className='flex-1 bg-greenDefault rounded-xl py-4 active:bg-greenDark'>
              <Text className='text-white text-center text-base' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {currentIndex < totalReplicas - 1 ? t('training.level2.nextReplica') : t('common.finish')}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View className='bg-white border-t border-brdLight px-6 py-4'>
        <View className='flex-row justify-between gap-3'>
          {/* Выход */}
          <Pressable
            onPress={handleExit}
            className='w-14 h-14 bg-yellow-500 rounded-full items-center justify-center active:bg-yellow-600'
          >
            <Ionicons name='close' size={28} color='white' />
          </Pressable>

          {/* Прослушать */}
          <Pressable
            onPress={handlePlayAudio}
            disabled={isRecording || isProcessing}
            className={`flex-1 rounded-xl py-4 items-center justify-center ${
              isRecording || isProcessing ? 'bg-gray-300' : 'bg-black active:bg-gray-800'
            }`}
          >
            <Ionicons name='volume-high' size={24} color='white' />
          </Pressable>
        </View>
      </View>

      {/* Completion Modal */}
      <CompletionModal
        visible={showCompletion}
        level={2}
        accuracy={finalAccuracy}
        onClose={handleCloseModal}
        onRepeat={handleRepeat}
      />
    </View>
  );
}
