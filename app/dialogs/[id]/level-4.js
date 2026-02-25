// app/dialogs/[id]/level-4.js
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import AnswerButton from '../../../components/AnswerButton';
import CompletionModal from '../../../components/CompletionModal';
import { useAudioPlayer } from '../../../hooks/useAudioPlayer';
import { useTrainingLogger } from '../../../hooks/useTrainingLogger';
import { supabase } from '../../../lib/supabase';

export default function Level4Training() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { playSequence, stop, isPlaying } = useAudioPlayer();
  const { saveTrainingLog } = useTrainingLogger();

  // State для диалога
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(true);

  // State для тренировки
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [attempts, setAttempts] = useState({});
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);

  const startTimeRef = useRef(null);

  // Загружаем диалог
  useEffect(() => {
    async function fetchDialog() {
      try {
        const { data, error } = await supabase.from('dialogs').select('*').eq('id', id).single();

        if (error) throw error;
        setDialog(data);
      } catch (error) {
        console.error('Error fetching dialog:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDialog();
  }, [id]);

  // Инициализируем startTime
  useEffect(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
  }, []);

  // Перемешиваем варианты при загрузке новой реплики
  useEffect(() => {
    if (!dialog || currentIndex >= dialog.content.target.length) return;

    const currentText = dialog.content.target[currentIndex];
    const correctTranslation = dialog.content.native[currentIndex];
    const options = [...dialog.content.options[currentIndex]];

    // Перемешиваем массив
    const shuffled = options.sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);

    // Находим индекс правильного ответа ПОСЛЕ перемешивания
    const correctIdx = shuffled.findIndex((opt) => opt === correctTranslation);
    setCorrectAnswerIndex(correctIdx);

    // Сбрасываем выбор
    setSelectedAnswer(null);
    setIsDisabled(false);

    // Воспроизводим аудио через 0.5 сек
    const timer = setTimeout(async () => {
      await playSequence([currentText], dialog.target_language, 1.0);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, dialog]);

  // Cleanup audio при размонтировании
  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Показываем loading
  if (loading) {
    return (
      <View className='flex-1 bg-bgMain items-center justify-center'>
        <Text className='text-textBody'>Loading...</Text>
      </View>
    );
  }

  // Проверка наличия диалога
  if (!dialog) {
    return (
      <View className='flex-1 bg-bgMain items-center justify-center'>
        <Text className='text-textBody'>Dialog not found</Text>
      </View>
    );
  }

  const totalReplicas = dialog.content.target.length;
  // const currentText = dialog.content.target[currentIndex];

  // Обработка выбора ответа
  const handleAnswerSelect = async (index) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(index);
    setIsDisabled(true);

    // Увеличиваем счётчик попыток
    setAttempts((prev) => ({
      ...prev,
      [currentIndex]: (prev[currentIndex] || 0) + 1,
    }));

    if (index === correctAnswerIndex) {
      // ✅ Правильный ответ
      console.log('✅ Correct answer');

      setTimeout(() => {
        handleNext();
      }, 1500);
    } else {
      // ❌ Неправильный ответ
      console.log('❌ Wrong answer');

      if (!wrongAnswers.includes(currentIndex)) {
        setWrongAnswers((prev) => [...prev, currentIndex]);
      }

      setTimeout(() => {
        setIsDisabled(false);
        setSelectedAnswer(null);
      }, 800);
    }
  };

  // Переход к следующей реплике
  const handleNext = async () => {
    await stop();

    if (currentIndex < totalReplicas - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleCompletion();
    }
  };

  // Завершение тренировки
  const handleCompletion = async () => {
    await stop();

    // Подсчитываем общее количество попыток
    let totalAttempts = 0;
    for (let i = 0; i < totalReplicas; i++) {
      // Если нет записи в attempts - значит была 1 попытка (правильный ответ с первого раза)
      totalAttempts += attempts[i] || 1;
    }

    // Accuracy: процент правильных ответов с первой попытки
    // Идеал = totalReplicas (все с 1 попытки)
    // Реальность = totalAttempts
    const accuracy = Math.round((totalReplicas / totalAttempts) * 100);

    console.log(`📊 Attempts by replica:`, attempts);
    console.log(`📊 Total attempts: ${totalAttempts}`);
    console.log(`📊 Accuracy: ${totalReplicas}/${totalAttempts} = ${accuracy}%`);

    // Логика завершения уровня (для metadata.isCompleted)
    const maxErrors = Math.floor(totalReplicas / 10);
    const hasMultipleAttempts = Object.values(attempts).some((count) => count >= 2);
    const isCompleted = wrongAnswers.length <= maxErrors && !hasMultipleAttempts;

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const correctCount = totalReplicas - wrongAnswers.length;

    await saveTrainingLog({
      dialogId: id,
      type: 'level_4',
      accuracyScore: accuracy,
      totalReplicas: totalReplicas,
      correctReplicas: correctCount,
      durationSeconds: duration,
      metadata: {
        errors: wrongAnswers,
        attempts: attempts,
        totalAttempts: totalAttempts,
        isCompleted: isCompleted,
      },
    });

    // Сохраняем accuracy для модалки
    setFinalAccuracy(accuracy);
    setShowCompletion(true);
  };

  // Повтор текущей реплики
  const handlePlayCurrent = async () => {
    await stop();
    const currentText = dialog.content.target[currentIndex];
    await playSequence([currentText], dialog.target_language, 1.0);
  };

  // Рестарт
  const handleRestart = async () => {
    await stop();
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setWrongAnswers([]);
    setAttempts({});
    startTimeRef.current = Date.now();
  };

  // Выход
  const handleExit = () => {
    Alert.alert(t('common.confirm'), t('common.exitWithoutSaving'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.exit'),
        style: 'destructive',
        onPress: () => {
          stop();
          router.back();
        },
      },
    ]);
  };

  // Определяем состояние кнопки
  const getButtonState = (index) => {
    if (selectedAnswer === null) return 'default';
    // Если это выбранная кнопка
    if (index === selectedAnswer) {
      // Проверяем правильная ли она
      return index === correctAnswerIndex ? 'correct' : 'wrong';
    }
    return 'default';
  };

  return (
    <View className='flex-1 bg-bgMain'>
      {/* Header */}
      <View className='bg-white border-b border-brdLight px-6 pt-8 pb-2'>
        <Text className='text-lg text-textHead text-center mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('training.level4.title')}
        </Text>
        <Text className='text-sm text-textText text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          {t('training.level4.progress', { current: currentIndex + 1, total: totalReplicas })}
        </Text>
      </View>

      {/* Content */}
      <ScrollView className='flex-1 px-6 py-8'>
        {shuffledOptions.map((option, index) => (
          <AnswerButton
            key={index}
            text={option}
            onPress={() => handleAnswerSelect(index)}
            state={getButtonState(index)}
            disabled={isDisabled}
          />
        ))}
      </ScrollView>

      {/* Footer */}
      <View className='bg-white border-t border-brdLight px-6 pt-4 pb-10'>
        <View className='flex-row gap-3'>
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
            className='w-16 h-16 rounded-full bg-bgSide items-center justify-center m-auto active:opacity-80'
          >
            <Ionicons name='repeat' size={36} color='#0a5c18' />
          </Pressable>

          {/* 4. Повтор текущей */}
          <Pressable
            onPress={handlePlayCurrent}
            disabled={isPlaying}
            className={`w-16 h-16 rounded-full bg-bgSide items-center justify-center m-auto ${
              isPlaying ? 'opacity-50' : 'active:opacity-80'
            }`}
          >
            <Ionicons name='refresh' size={36} color='#0a5c18' />
          </Pressable>
        </View>
      </View>

      {/* Completion Modal */}
      <CompletionModal
        visible={showCompletion}
        level={4}
        accuracy={finalAccuracy}
        totalReplicas={totalReplicas}
        onClose={() => {
          setShowCompletion(false);
          router.back();
        }}
        onRepeat={() => {
          setShowCompletion(false);
          handleRestart();
        }}
      />
    </View>
  );
}
