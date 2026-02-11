// hooks/useAudioPlayer.js
import * as Speech from 'expo-speech';
import { useRef, useState } from 'react';

/**
 * Hook для озвучки текста через Browser TTS (expo-speech)
 * Поддерживает Play/Pause/Resume
 */
export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentIndexRef = useRef(0);
  const textsRef = useRef([]);
  const languageRef = useRef('en-US');
  const rateRef = useRef(1.0);
  const shouldStopRef = useRef(false);
  const shouldPauseRef = useRef(false);
  const isPausedRef = useRef(false);

  /**
   * Маппинг языковых кодов на locale
   */
  const getLocale = (language) => {
    const languageLocales = {
      fi: 'fi-FI',
      en: 'en-US',
      es: 'es-ES',
      de: 'de-DE',
      fr: 'fr-FR',
      it: 'it-IT',
      pt: 'pt-PT',
      se: 'sv-SE',
      no: 'nb-NO',
    };
    return languageLocales[language] || 'en-US';
  };

  /**
   * Воспроизвести одну реплику
   */
  const playSingleText = async (text, locale, rate) => {
    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        language: locale,
        rate: rate,
        pitch: 1.0,
        onDone: resolve,
        onError: (error) => {
          console.error('Speech error:', error);
          resolve(); // Продолжаем даже при ошибке
        },
      });
    });
  };

  /**
   * Воспроизвести последовательность
   */
  const playSequence = async (texts, language, rate = 1.0, onProgress = null) => {
    // Сохраняем параметры
    textsRef.current = texts;
    languageRef.current = getLocale(language);
    rateRef.current = rate;

    let startIndex = 0;

    if (isPausedRef.current) {
      // Resume - продолжаем с сохранённой позиции
      console.log('▶️ Resuming from index:', currentIndexRef.current);
      startIndex = currentIndexRef.current;
      isPausedRef.current = false;
      setIsPaused(false);
      setIsPlaying(true);
      shouldPauseRef.current = false;
    } else {
      // Play - начинаем с начала
      console.log('🔊 Starting new sequence:', texts.length, 'items');
      currentIndexRef.current = 0;
      startIndex = 0;
      setIsPlaying(true);
      setIsPaused(false);
      shouldPauseRef.current = false;
    }

    shouldStopRef.current = false;

    for (let i = startIndex; i < textsRef.current.length; i++) {
      // Проверка на Stop
      if (shouldStopRef.current) {
        console.log('⏹️ Sequence stopped');
        setIsPlaying(false);
        setIsPaused(false);
        currentIndexRef.current = 0;
        return;
      }

      // Проверка на Pause ДО воспроизведения
      if (shouldPauseRef.current) {
        console.log('⏸️ Sequence paused at index:', i);
        currentIndexRef.current = i; // Сохраняем ТЕКУЩУЮ позицию
        setIsPlaying(false);
        setIsPaused(true);
        return;
      }

      currentIndexRef.current = i;
      if (onProgress) onProgress(i);

      console.log(`🔊 [${i + 1}/${textsRef.current.length}]:`, textsRef.current[i].substring(0, 50));

      await playSingleText(textsRef.current[i], languageRef.current, rateRef.current);

      // Пауза между репликами
      if (i < textsRef.current.length - 1 && !shouldStopRef.current && !shouldPauseRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // Завершение
    console.log('✅ Sequence finished');
    setIsPlaying(false);
    setIsPaused(false);
    isPausedRef.current = false;
    currentIndexRef.current = 0;
  };

  /**
   * Pause
   */
  const pause = async () => {
    console.log('⏸️ Pausing...');
    shouldPauseRef.current = true;
    isPausedRef.current = true;
    setIsPlaying(false);
    setIsPaused(true);
    await Speech.stop();
  };

  /**
   * Stop (полный сброс)
   */
  const stop = async () => {
    console.log('⏹️ Stopping...');
    shouldStopRef.current = true;
    shouldPauseRef.current = false;
    isPausedRef.current = false;
    await Speech.stop();
    setIsPlaying(false);
    setIsPaused(false);
    currentIndexRef.current = 0;
  };

  return {
    playSequence,
    pause,
    stop,
    isPlaying,
    isPaused,
    currentIndex: currentIndexRef.current,
  };
}
