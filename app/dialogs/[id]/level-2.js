// app/dialogs/[id]/level-2.js
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
  return true; // iOS handled by Info.plist
};

/**
 * Нормализация текста для сравнения
 * Убирает знаки препинания, лишние пробелы, приводит к нижнему регистру
 */
function normalizeText(text) {
  return text
    .toLowerCase() // Нижний регистр
    .replace(/[.,!?;:"""'''`—–-]/g, '') // Убрать знаки препинания
    .replace(/\s+/g, ' ') // Множественные пробелы → один
    .trim(); // Убрать пробелы по краям
}

/**
 * Вычисление расстояния Левенштейна
 */
function levenshteinDistance(str1, str2) {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) track[0][i] = i;
  for (let j = 0; j <= str2.length; j++) track[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(track[j][i - 1] + 1, track[j - 1][i] + 1, track[j - 1][i - 1] + indicator);
    }
  }

  return track[str2.length][str1.length];
}

/**
 * Вычисление процента схожести
 */
function calculateSimilarity(original, spoken) {
  // Нормализуем оба текста для сравнения
  const normalizedOriginal = normalizeText(original);
  const normalizedSpoken = normalizeText(spoken);

  const distance = levenshteinDistance(normalizedOriginal, normalizedSpoken);
  const maxLength = Math.max(normalizedOriginal.length, normalizedSpoken.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  return Math.round(similarity);
}

/**
 * Определение уровня оценки
 */
function getEvaluation(accuracy) {
  if (accuracy >= 95) return { level: 'PERFECT', emoji: '✅', color: '#4caf50' };
  if (accuracy >= 85) return { level: 'GOOD', emoji: '⚡', color: '#8bc34a' };
  if (accuracy >= 70) return { level: 'CLOSE', emoji: '⚠️', color: '#ff9800' };
  return { level: 'WRONG', emoji: '❌', color: '#f44336' };
}

/**
 * Создаёт визуальный diff распознанного текста
 * Берёт слова из spoken, но добавляет заглавные буквы и знаки из original
 * Подсвечивает только те слова, которые отличаются
 */
function createVisualDiff(original, spoken) {
  const origWords = original.split(/\s+/); // Оригинальные слова
  const spokenWords = spoken.split(/\s+/); // Распознанные слова

  const segments = [];
  const maxLength = Math.max(origWords.length, spokenWords.length);

  for (let i = 0; i < maxLength; i++) {
    const origWord = origWords[i] || '';
    const spokenWord = spokenWords[i] || '';

    // Нормализуем для сравнения
    const normOrig = normalizeText(origWord);
    const normSpoken = normalizeText(spokenWord);

    const isError = normOrig !== normSpoken;

    if (isError && spokenWord) {
      // ОШИБКА - показываем то что сказал пользователь (с заглавной из оригинала)
      const capitalizedSpoken = capitalizeAsOriginal(spokenWord, origWord);
      segments.push({ text: capitalizedSpoken, isError: true });
    } else if (spokenWord) {
      // ПРАВИЛЬНО - показываем оригинал (с правильным регистром)
      segments.push({ text: origWord || spokenWord, isError: false });
    } else if (origWord && !spokenWord) {
      // Пользователь пропустил слово - показываем пропуск
      segments.push({ text: '[?]', isError: true });
    }

    // Добавляем пробел между словами
    if (i < maxLength - 1) {
      segments.push({ text: ' ', isError: false });
    }
  }

  return segments;
}

/**
 * Применяет регистр и знаки препинания из оригинала к распознанному слову
 */
function capitalizeAsOriginal(spoken, original) {
  if (!original) return spoken;

  let result = spoken;

  // Если оригинал начинается с заглавной - делаем заглавную
  if (original[0] === original[0].toUpperCase()) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  // Переносим знаки препинания из оригинала
  const punctuation = original.match(/[.,!?;:"""'''`—–-]+$/);
  if (punctuation) {
    result += punctuation[0];
  }

  return result;
}

export default function Level2Training() {
  const { id } = useLocalSearchParams();
  const scrollViewRef = useRef(null);
  const startTimeRef = useRef(null);
  const autoNextTimerRef = useRef(null);
  const { t } = useTranslation();

  const [dialog, setDialog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const [results, setResults] = useState([]); // История результатов по каждой реплике

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

  // Остановка аудио при монтировании/размонтировании
  useEffect(() => {
    Speech.stop();

    return () => {
      Speech.stop();
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      // Очищаем таймер автоперехода
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
    };
  }, []);

  // Показать первую реплику при загрузке
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

  // Обработка результата речи
  const handleSpeechResult = (transcript) => {
    const currentIndex = visibleCount - 1;
    const originalText = dialog.content.target[currentIndex];
    const acc = calculateSimilarity(originalText, transcript);

    setCurrentAccuracy(acc);
    setShowResult(true);
    setIsRecording(false);

    // Сохраняем результат
    setResults((prev) => {
      const newResults = [...prev];
      newResults[currentIndex] = acc;
      return newResults;
    });

    // Автопереход при PERFECT (>= 95%)
    if (acc >= 95) {
      autoNextTimerRef.current = setTimeout(() => {
        handleNext();
      }, 5000);
    }

    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };

  // Начать запись
  const startRecording = async () => {
    if (!dialog || showResult) return;

    // Запрашиваем разрешения
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

  // Повторить текущую реплику (улучшить результат)
  const handleRetry = () => {
    setShowResult(false);
    setRecognizedText('');
    setCurrentAccuracy(0);
  };

  // С начала
  const handleRestart = () => {
    Speech.stop();
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }

    // Добавить очистку таймера:
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }

    setResults([]);
    setShowResult(false);
    setRecognizedText('');
    setCurrentAccuracy(0);
    startTimeRef.current = Date.now();
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

    setVisibleCount(0);

    setTimeout(() => {
      setVisibleCount(1);
      scrollToBottom();

      const firstText = dialog.content.target[0];
      setTimeout(() => {
        Speech.speak(firstText, {
          language: dialog.target_language || 'fi-FI',
          rate: 0.85,
          pitch: 1.0,
        });
      }, 500);
    }, 100);
  };

  // Следующая реплика
  const handleNext = async () => {
    if (!dialog) return;

    // Отменяем автопереход если был
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }

    const totalReplicas = dialog.content.target.length;

    // Если это последняя реплика -> модалка
    if (visibleCount >= totalReplicas) {
      setIsCompleted(true);

      // Сохраняем результат
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const avgAccuracy = results.reduce((a, b) => a + b, 0) / results.length;

        await supabase.from('training_logs').insert({
          user_id: user.id,
          dialog_id: id,
          type: 'level_2',
          metadata: {
            isCompleted: avgAccuracy >= 70,
            accuracy: Math.round(avgAccuracy),
            results,
          },
        });
      } catch (error) {
        console.error('Error saving results:', error);
      }

      return;
    }

    Speech.stop();
    setShowResult(false);
    setRecognizedText('');
    setCurrentAccuracy(0);

    setVisibleCount((prev) => prev + 1);
    scrollToBottom();

    const currentIndex = visibleCount;
    const text = dialog.content.target[currentIndex];

    setTimeout(() => {
      Speech.speak(text, {
        language: dialog.target_language || 'fi-FI',
        rate: 0.85,
        pitch: 1.0,
      });
    }, 500);
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
  const handleCloseModal = async () => {
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
    setCurrentAccuracy(0);
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
  const evaluation = getEvaluation(currentAccuracy);

  return (
    <View className='flex-1 bg-bgMain'>
      {/* Header */}
      <View className='bg-white border-b border-brdLight px-6 pt-8 pb-2'>
        <Text className='text-lg text-textHead text-center mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('training.level2.title')}
        </Text>
        <Text className='text-sm text-textText text-center mt-1' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
          {t('training.level2.progress', { current: visibleCount, total: totalReplicas })}
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

      {/* Карточка результата */}
      {showResult && (
        <View className='absolute bottom-32 left-6 right-6'>
          <Animated.View entering={FadeInDown.delay(100).duration(400)} className='mt-4'>
            <View className='bg-white border-2 rounded-3xl p-4' style={{ borderColor: evaluation.color }}>
              {/* ================= */}
              <Text className='text-sm text-textText mb-2' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
                {t('training.level2.youSaid')}:
              </Text>
              <Text className='text-base mb-3'>
                <Text className='text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                  &ldquo;
                </Text>
                {createVisualDiff(dialog.content.target[visibleCount - 1], recognizedText).map((segment, idx) => (
                  <Text
                    key={idx}
                    style={{
                      fontFamily: 'RobotoCondensed_400Regular',
                      color: segment.isError ? '#f44336' : 'hsl(29, 10%, 20%)',
                      fontWeight: segment.isError ? '700' : '400',
                    }}
                  >
                    {segment.text}
                  </Text>
                ))}
                <Text className='text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                  &rdquo;
                </Text>
              </Text>
              {/* ================== */}
              <Text className='text-sm text-textText mb-2' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
                {t('training.level2.correct')}:
              </Text>
              <Text className='text-base text-textHead mb-4' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                &ldquo;{dialog.content.target[visibleCount - 1]}&rdquo;
              </Text>

              <View className='flex-row items-center justify-center py-3 rounded-2xl'>
                <Text className='text-3xl mr-2'>{evaluation.emoji}</Text>
                <Text className='text-2xl' style={{ fontFamily: 'RobotoCondensed_700Bold', color: evaluation.color }}>
                  {currentAccuracy}% {evaluation.level}
                </Text>
              </View>

              {currentAccuracy < 95 && (
                <Text
                  className='text-xs text-textText text-center mt-3'
                  style={{ fontFamily: 'RobotoCondensed_400Regular' }}
                >
                  {t('training.level2.useButtons')}
                </Text>
              )}
            </View>
          </Animated.View>
        </View>
      )}

      {/* Микрофон (когда нет результата) */}
      {!showResult && visibleCount > 0 && (
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
              {t('training.level2.recording')}
            </Text>
          )}
        </View>
      )}

      {/* Footer - Control Buttons */}
      <View className='bg-white border-t border-brdLight px-6 pt-4 pb-10'>
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

          {/* 3. Повтор текущей (озвучка) */}
          <Pressable
            onPress={handleRetry}
            disabled={visibleCount === 0 || isRecording}
            className='w-16 h-16 rounded-full bg-bgSide items-center justify-center m-auto active:opacity-80'
          >
            <Ionicons name='refresh' size={36} color='#0a5c18' />
          </Pressable>

          {/* 4. Следующая (зелёный) - активна только если showResult И accuracy < 95 */}
          <Pressable
            onPress={handleNext}
            disabled={!showResult && visibleCount > 0}
            className={`w-16 h-16 rounded-full items-center justify-center m-auto active:opacity-80 ${
              showResult || visibleCount === 0 ? 'bg-success' : 'bg-bgCard opacity-50'
            }`}
          >
            <Ionicons name='arrow-forward' size={36} color='#0a5c18' />
          </Pressable>
        </View>
      </View>

      {/* Completion Modal */}
      <CompletionModal visible={isCompleted} level={2} onClose={handleCloseModal} onRepeat={handleRepeat} />
    </View>
  );
}
