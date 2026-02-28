// app/dialogs/[id]/level-3.js

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, PermissionsAndroid, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import CompletionModal from '../../../components/CompletionModal';
import ReplicaCard from '../../../components/ReplicaCard';
import { useTrainingLogger } from '../../../hooks/useTrainingLogger';
import { evaluateTranslation } from '../../../lib/evaluateSpeech';
import { supabase } from '../../../lib/supabase';

// Запрос разрешений на микрофон
const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Microphone Permission',
        message: 'Lingua Flow needs access to your microphone for speech recognition.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      });

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Microphone permission granted');
        return true;
      } else {
        console.log('❌ Microphone permission denied');
        return false;
      }
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  }
  return true;
};

/**
 * Определение уровня оценки с цветом и эмодзи
 */
function getEvaluation(level) {
  if (level === 'PERFECT') return { level: 'PERFECT', emoji: '✅', color: '#4caf50', accuracy: 100 };
  if (level === 'GOOD') return { level: 'GOOD', emoji: '⚡', color: '#8bc34a', accuracy: 75 };
  if (level === 'CLOSE') return { level: 'CLOSE', emoji: '⚠️', color: '#ff9800', accuracy: 50 };
  return { level: 'WRONG', emoji: '❌', color: '#f44336', accuracy: 0 };
}

/**
 * Форматирует распознанный текст:
 * - Делает первую букву заглавной
 * - Добавляет знаки препинания из оригинала
 */
function formatUserPhrase(userText, originalText) {
  if (!userText) return userText;

  let formatted = userText.trim();

  // 1. Первая буква заглавная
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  // 2. Добавляем знаки препинания из оригинала
  const punctuation = originalText.match(/[.,!?;:]+$/);
  if (punctuation) {
    // Убираем существующие знаки в конце (если есть)
    formatted = formatted.replace(/[.,!?;:]+$/, '');
    // Добавляем знаки из оригинала
    formatted += punctuation[0];
  }

  return formatted;
}

export default function Level3Training() {
  const { id } = useLocalSearchParams();
  const scrollViewRef = useRef(null);
  const startTimeRef = useRef(null);
  const autoNextTimerRef = useRef(null);
  const { t } = useTranslation();
  const { saveTrainingLog } = useTrainingLogger();

  const [dialog, setDialog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [aiFeedback, setAiFeedback] = useState('');
  const [results, setResults] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [userPhrases, setUserPhrases] = useState([]); // Фразы пользователя с оценками

  // Загрузка диалога
  const loadDialog = useCallback(async () => {
    try {
      setIsLoading(true);

      await supabase.auth.getUser();

      // Загружаем диалог
      const { data: dialogData, error: dialogError } = await supabase.from('dialogs').select('*').eq('id', id).single();

      if (dialogError) throw dialogError;
      setDialog(dialogData);

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

  // Остановка при размонтировании
  useEffect(() => {
    Speech.stop();

    return () => {
      Speech.stop();
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
    };
  }, []);

  // Показать первую реплику
  useEffect(() => {
    if (dialog && visibleCount === 0) {
      handleNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);

  // Обработка результатов распознавания
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript || '';
    setRecognizedText(transcript);

    if (event.isFinal && dialog) {
      handleSpeechResult(transcript);
    }
  });

  // Автопрокрутка
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Обработка результата речи - вызов AI
  const handleSpeechResult = async (transcript) => {
    const currentIndex = visibleCount - 1;
    const nativeText = dialog.content.native[currentIndex];
    const targetText = dialog.content.target[currentIndex];

    setIsEvaluating(true);

    try {
      // Вызываем AI для оценки
      const result = await evaluateTranslation({
        nativeText,
        targetText,
        userText: transcript,
        level: dialog.level || 'A1',
        dialogTopic: dialog.topic || 'general',
        tone: dialog.tone || 5,
        learningLanguage: dialog.target_language || 'fi',
        uiLanguage: dialog.ui_language || 'ru',
      });

      const evaluation = getEvaluation(result.level);

      setCurrentEvaluation(evaluation);
      setAiFeedback(result.feedback);
      setShowResult(true);
      setIsRecording(false);
      setIsEvaluating(false);

      // Сохраняем результат
      setResults((prev) => {
        const newResults = [...prev];
        newResults[currentIndex] = evaluation.accuracy;
        return newResults;
      });

      // Форматируем фразу пользователя (заглавная + знаки из оригинала)
      const formattedUserText = formatUserPhrase(transcript, targetText);

      // Сохраняем фразу пользователя с оценкой
      setUserPhrases((prev) => {
        const newPhrases = [...prev];
        newPhrases[currentIndex] = {
          text: formattedUserText,
          level: result.level,
        };
        return newPhrases;
      });

      // Автопереход при PERFECT
      if (result.level === 'PERFECT') {
        autoNextTimerRef.current = setTimeout(() => {
          handleNext();
        }, 5000);
      }
    } catch (error) {
      console.error('AI evaluation error:', error);
      setIsEvaluating(false);
      setShowResult(true);
      setCurrentEvaluation(getEvaluation('WRONG'));
      setAiFeedback(t('training.level3.evaluationError'));
    }

    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };

  // Начать запись
  const startRecording = async () => {
    if (!dialog || showResult || isEvaluating) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.log('❌ No microphone permission');
      return;
    }

    try {
      setIsRecording(true);
      setRecognizedText('');

      await ExpoSpeechRecognitionModule.start({
        lang: dialog.target_language || 'fi-FI',
        interimResults: true,
        maxAlternatives: 1,
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  // Остановить запись
  const stopRecording = () => {
    try {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };

  // Повторить
  const handleRetry = () => {
    setShowResult(false);
    setRecognizedText('');
    setCurrentEvaluation(null);
    setAiFeedback('');
  };

  // С начала
  const handleRestart = () => {
    Speech.stop();
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }

    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }

    setResults([]);
    setShowResult(false);
    setRecognizedText('');
    setCurrentEvaluation(null);
    setAiFeedback('');
    setUserPhrases([]); // Очистить фразы пользователя
    startTimeRef.current = Date.now();
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

    setVisibleCount(0);

    setTimeout(() => {
      setVisibleCount(1);
      scrollToBottom();
    }, 100);
  };

  // Следующая реплика
  const handleNext = async () => {
    if (!dialog) return;

    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }

    const totalReplicas = dialog.content.target.length;

    if (visibleCount >= totalReplicas) {
      setIsCompleted(true);

      // Получаем профиль для проверки плана
      // const {
      //   data: { user },
      // } = await supabase.auth.getUser();
      // const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      // const plan = getEffectivePlan(profile);

      // Подсчитываем сколько реплик пройдено (где есть результат)
      const completedReplicas = results.filter((r) => r > 0).length;

      // PRO функция считается использованной если пройдено >50% реплик
      const shouldCountUsage = completedReplicas > totalReplicas / 2;

      if (shouldCountUsage) {
        // Инкрементируем счётчик PRO функций
        try {
          const { error: incrementError } = await supabase.rpc('increment_pro_features_used');
          if (incrementError) {
            console.error('Error incrementing PRO features:', incrementError);
          }
        } catch (error) {
          console.error('Error incrementing PRO features:', error);
        }
      }

      // Сохраняем статистику только для PRO/Premium планов
      // if (plan !== 'free') {
      const avgAccuracy = results.reduce((a, b) => a + b, 0) / results.length;
      const isCompleted = avgAccuracy >= 50;
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const correctCount = results.filter((acc) => acc >= 75).length;

      // Сохраняем лог тренировки
      await saveTrainingLog({
        dialogId: id,
        type: 'level_3',
        accuracyScore: Math.round(avgAccuracy),
        totalReplicas: totalReplicas,
        correctReplicas: correctCount,
        durationSeconds: duration,
        metadata: {
          isCompleted,
          accuracy: Math.round(avgAccuracy),
          results,
        },
      });
      // }

      return;
    }

    Speech.stop();
    setShowResult(false);
    setRecognizedText('');
    setCurrentEvaluation(null);
    setAiFeedback('');

    setVisibleCount((prev) => prev + 1);
    scrollToBottom();
  };

  // Выход
  const handleExit = () => {
    Speech.stop();
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
    router.back();
  };

  // Закрыть модалку
  const handleCloseModal = () => {
    setIsCompleted(false);
    Speech.stop();
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
    router.back();
  };

  // Повторить уровень
  const handleRepeat = () => {
    setIsCompleted(false);
    Speech.stop();
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }

    setVisibleCount(0);
    setResults([]);
    setShowResult(false);
    setRecognizedText('');
    setCurrentEvaluation(null);
    setAiFeedback('');
    setUserPhrases([]); // Очистить фразы пользователя
    startTimeRef.current = Date.now();
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

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
          {t('training.level3.title')}
        </Text>
        <Text className='text-sm text-textText text-center mt-1' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
          {t('training.level3.progress', { current: visibleCount, total: totalReplicas })}
        </Text>
      </View>

      {/* Content - Replicas (русский перевод + фразы пользователя) */}
      <ScrollView
        ref={scrollViewRef}
        className='flex-1 px-6 py-4'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {dialog.content.native.slice(0, visibleCount).map((text, index) => {
          const userPhrase = userPhrases[index]; // Фраза пользователя

          return (
            <Animated.View key={index} entering={FadeInDown.delay(100).duration(400)}>
              {/* Если есть фраза пользователя - показываем её */}
              {userPhrase ? (
                <ReplicaCard
                  text={userPhrase.text}
                  translation={text}
                  isLeft={index % 2 === 0}
                  textColor={getEvaluation(userPhrase.level).color}
                />
              ) : (
                /* Если пользователь ещё не ответил - показываем только перевод */
                <ReplicaCard text={text} translation='' isLeft={index % 2 === 0} isItalic={true} />
              )}
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Карточка результата */}
      {showResult && currentEvaluation && (
        <View className='absolute bottom-32 left-6 right-6'>
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View
              className='bg-white border-2 rounded-3xl p-4 shadow-lg'
              style={{ borderColor: currentEvaluation.color }}
            >
              <Text className='text-sm text-textText mb-2' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
                {t('training.level3.youSaid')}:
              </Text>
              <Text className='text-base text-textHead mb-3' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                &ldquo;{recognizedText}&rdquo;
              </Text>

              <Text className='text-sm text-textText mb-2' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
                {t('training.level3.aiFeedback')}:
              </Text>
              <Text className='text-base text-textHead mb-4' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                {aiFeedback}
              </Text>

              <View className='flex-row items-center justify-center py-3'>
                <Text className='text-3xl mr-2'>{currentEvaluation.emoji}</Text>
                <Text
                  className='text-2xl'
                  style={{ fontFamily: 'RobotoCondensed_700Bold', color: currentEvaluation.color }}
                >
                  {currentEvaluation.accuracy}% {currentEvaluation.level}
                </Text>
              </View>

              {currentEvaluation.level !== 'PERFECT' && (
                <Text
                  className='text-xs text-textText text-center mt-2'
                  style={{ fontFamily: 'RobotoCondensed_400Regular' }}
                >
                  {t('training.level3.useButtons')}
                </Text>
              )}
            </View>
          </Animated.View>
        </View>
      )}

      {/* Микрофон */}
      {!showResult && visibleCount > 0 && !isEvaluating && (
        <View className='absolute bottom-32 self-center'>
          <Pressable
            onPress={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full items-center justify-center shadow-lg ${
              isRecording ? 'bg-red-500' : 'bg-red-600'
            }`}
          >
            <Ionicons name={isRecording ? 'mic' : 'mic-off'} size={40} color='white' />
          </Pressable>
          {isRecording && (
            <Text
              className='text-xs text-textText text-center mt-2'
              style={{ fontFamily: 'RobotoCondensed_500Medium' }}
            >
              {t('training.level3.recording')}
            </Text>
          )}
        </View>
      )}

      {/* Индикатор оценки AI */}
      {isEvaluating && (
        <View className='absolute bottom-32 self-center'>
          <View className='bg-white rounded-full p-6 shadow-lg'>
            <ActivityIndicator size='large' color='hsl(130, 40%, 50%)' />
            <Text
              className='text-xs text-textText text-center mt-2'
              style={{ fontFamily: 'RobotoCondensed_500Medium' }}
            >
              {t('training.level3.evaluating')}
            </Text>
          </View>
        </View>
      )}

      {/* Footer - Control Buttons */}
      <View className='bg-white border-t border-brdLight px-6 pt-4 pb-10'>
        <View className='flex-row gap-1'>
          <Pressable
            onPress={handleExit}
            className='w-16 h-16 rounded-full bg-bgSide items-center justify-center m-auto active:opacity-80'
          >
            <Ionicons name='close' size={36} color='#0a5c18' />
          </Pressable>

          <Pressable
            onPress={handleRestart}
            disabled={visibleCount === 0}
            className='w-16 h-16 rounded-full bg-bgSide items-center justify-center m-auto active:opacity-80'
          >
            <Ionicons name='repeat' size={36} color='#0a5c18' />
          </Pressable>

          <Pressable
            onPress={handleRetry}
            disabled={visibleCount === 0 || isRecording || isEvaluating}
            className='w-16 h-16 rounded-full bg-bgSide items-center justify-center m-auto active:opacity-80'
          >
            <Ionicons name='refresh' size={36} color='#0a5c18' />
          </Pressable>

          <Pressable
            onPress={handleNext}
            disabled={(!showResult && visibleCount > 0) || isEvaluating}
            className={`w-16 h-16 rounded-full items-center justify-center m-auto active:opacity-80 ${
              showResult || visibleCount === 0 ? 'bg-success' : 'bg-bgCard opacity-50'
            }`}
          >
            <Ionicons name='arrow-forward' size={36} color='#0a5c18' />
          </Pressable>
        </View>
      </View>

      {/* Completion Modal */}
      <CompletionModal visible={isCompleted} level={3} onClose={handleCloseModal} onRepeat={handleRepeat} />
    </View>
  );
}
