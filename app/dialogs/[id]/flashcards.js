// app/dialogs/[id]/flashcards.js

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { supabase } from '../../../lib/supabase';

export default function FlashcardsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();

  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  // Анимация для свайпа
  const translateX = useSharedValue(0);

  // Анимация для флипа
  const rotateY = useSharedValue(0);

  const loadDialog = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('dialogs').select('*').eq('id', id).single();
      if (error) throw error;
      setDialog(data);
    } catch (error) {
      console.error('Error loading dialog:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Загрузка настройки озвучки
  const loadAutoPlaySetting = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem('@flashcards_autoplay');
      if (value !== null) {
        setAutoPlayEnabled(value === 'true');
      }
    } catch (error) {
      console.error('Error loading autoplay setting:', error);
    }
  }, []);

  // Сохранение настройки
  const toggleAutoPlay = async () => {
    const newValue = !autoPlayEnabled;
    setAutoPlayEnabled(newValue);
    try {
      await AsyncStorage.setItem('@flashcards_autoplay', newValue.toString());
    } catch (error) {
      console.error('Error saving autoplay setting:', error);
    }
  };

  // Озвучка фразы
  const speakCollocation = useCallback(
    (text, lang) => {
      if (!autoPlayEnabled) return;

      // Останавливаем предыдущее воспроизведение
      Speech.stop();

      // Задержка 500ms
      setTimeout(() => {
        Speech.speak(text, {
          language: lang,
          rate: 0.85,
          pitch: 1.0,
        });
      }, 300);
    },
    [autoPlayEnabled],
  );

  useFocusEffect(
    useCallback(() => {
      loadDialog();
      loadAutoPlaySetting();
    }, [loadDialog, loadAutoPlaySetting]),
  );

  const vocabulary = useMemo(() => dialog?.content?.vocabulary || [], [dialog]);
  const totalCards = vocabulary.length;
  const currentCard = vocabulary[currentIndex];

  // Переход к следующей карточке
  const goToNext = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      rotateY.value = 0;
    }
  }, [currentIndex, totalCards, rotateY]);

  // Озвучка при монтировании и смене карточки
  useEffect(() => {
    if (currentCard && !isFlipped) {
      speakCollocation(currentCard.collocation, dialog?.target_language || 'fi');
    }
  }, [currentCard, isFlipped, dialog, speakCollocation]);

  // Переход к предыдущей карточке
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      rotateY.value = 0;
    }
  }, [currentIndex, rotateY]);

  // Флип карточки
  const flipCard = () => {
    if (isFlipped) {
      rotateY.value = withSpring(0);
    } else {
      rotateY.value = withSpring(180);
    }
    setIsFlipped(!isFlipped);
  };

  // Жест свайпа
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      //   translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const SWIPE_THRESHOLD = 100;

      // Swipe влево → Next
      if (event.translationX < -SWIPE_THRESHOLD && currentIndex < totalCards - 1) {
        translateX.value = withTiming(-500, { duration: 200 }, () => {
          runOnJS(goToNext)();
          translateX.value = 0;
        });
      }
      // Swipe вправо → Previous
      else if (event.translationX > SWIPE_THRESHOLD && currentIndex > 0) {
        translateX.value = withTiming(500, { duration: 200 }, () => {
          runOnJS(goToPrevious)();
          translateX.value = 0;
        });
      }
      // Вернуть на место
      else {
        translateX.value = withSpring(0);
        // translateY.value = withSpring(0);
      }
    });

  // Жест тапа для флипа
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(flipCard)();
  });

  // Объединяем жесты
  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  // Анимация свайпа
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: interpolate(Math.abs(translateX.value), [0, 300], [1, 0.3]),
  }));

  // Стили для передней и задней стороны
  const frontAnimatedStyle = useAnimatedStyle(() => ({
    backfaceVisibility: 'hidden',
    transform: [{ perspective: 1000 }, { rotateY: `${rotateY.value}deg` }],
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    backfaceVisibility: 'hidden',
    transform: [{ perspective: 1000 }, { rotateY: `${rotateY.value - 180}deg` }],
  }));

  if (loading) {
    return (
      <View className='flex-1 bg-bgMain justify-center items-center'>
        <ActivityIndicator size='large' color='hsl(130, 40%, 50%)' />
      </View>
    );
  }

  if (!currentCard) {
    return (
      <View className='flex-1 bg-bgMain justify-center items-center'>
        <Text className='text-base text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          {t('vocabulary.noCards')}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className='flex-1 bg-bgMain'>
        {/* Header */}
        <View className='bg-white border-b border-brdLight px-4 pt-8 pb-2'>
          <View className='flex-row items-center justify-between'>
            <Pressable onPress={() => router.back()} className='w-12 h-12 items-center justify-center'>
              <Ionicons name='close' size={28} color='hsl(29, 10%, 20%)' />
            </Pressable>

            <View className='flex-1 items-center'>
              <Text className='text-lg text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {currentIndex + 1} / {totalCards}
              </Text>
            </View>

            {/* Sound toggle */}
            <Pressable onPress={toggleAutoPlay} className='w-12 h-12 items-center justify-center'>
              <Ionicons
                name={autoPlayEnabled ? 'volume-high' : 'volume-mute'}
                size={28}
                color={autoPlayEnabled ? '#0a5c18' : 'hsl(0, 0%, 60%)'}
              />
            </Pressable>
          </View>
        </View>

        {/* Flashcard */}
        <View className='flex-1 justify-center items-center px-6'>
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[cardAnimatedStyle]} className='w-full h-96 relative'>
              {/* Front Side */}
              <Animated.View
                style={[frontAnimatedStyle]}
                className='absolute w-full h-full bg-chatRight border-2 border-brdLight rounded-3xl p-8 justify-center items-center'
              >
                <Text className='text-3xl text-textHead text-center' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                  {currentCard.collocation}
                </Text>
                <Text className='text-sm text-textText mt-8' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                  {t('vocabulary.tapToFlip')}
                </Text>
              </Animated.View>

              {/* Back Side */}
              <Animated.View
                style={[backAnimatedStyle]}
                className='absolute w-full h-full border-2 border-greenLight bg-flipCard rounded-3xl p-8 justify-center items-center'
              >
                <Text
                  className='text-2xl text-textSuccess text-center'
                  style={{ fontFamily: 'RobotoCondensed_700Bold' }}
                >
                  {currentCard.collocation}
                </Text>
                <Text
                  className='text-2xl text-textSuccess text-center my-16'
                  style={{ fontFamily: 'RobotoCondensed_500Medium' }}
                >
                  {currentCard.translation}
                </Text>
                {currentCard.example && (
                  <Text
                    className='text-base text-textSuccess/90 text-center italic'
                    style={{ fontFamily: 'RobotoCondensed_400Regular_Italic' }}
                  >
                    &ldquo;{currentCard.example}&rdquo;
                  </Text>
                )}
              </Animated.View>
            </Animated.View>
          </GestureDetector>

          {/* Hint */}
          <Text className='text-sm text-textText mt-8 text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {t('vocabulary.swipeHint')}
          </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
