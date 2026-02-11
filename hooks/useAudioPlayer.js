// hooks/useAudioPlayer.js
import * as Speech from 'expo-speech';
import { useRef, useState } from 'react';

/**
 * Hook для озвучки текста через Browser TTS (expo-speech)
 *
 * @returns {Object} - { play, stop, isPlaying }
 */
export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentIndexRef = useRef(null);
  const isStopped = useRef(false);

  /**
   * Воспроизвести текст на указанном языке
   *
   * @param {string} text - текст для озвучки
   * @param {string} language - код языка (fi, en, es, de, fr, it, pt, se, no)
   * @param {number} rate - скорость речи (0.5 - 2.0, default: 1.0)
   */
  const play = async (text, language, rate = 1.0) => {
    if (isPlaying) {
      console.log('⚠️ Already playing, stopping previous...');
      await stop();
    }

    isStopped.current = false;
    setIsPlaying(true);

    // Маппинг языковых кодов на locale для expo-speech
    const languageLocales = {
      fi: 'fi-FI',
      en: 'en-US',
      es: 'es-ES',
      de: 'de-DE',
      fr: 'fr-FR',
      it: 'it-IT',
      pt: 'pt-PT',
      se: 'sv-SE', // Swedish
      no: 'nb-NO', // Norwegian Bokmål
    };

    const locale = languageLocales[language] || 'en-US';

    console.log('🔊 Playing:', text.substring(0, 50), '| Language:', locale);

    try {
      await Speech.speak(text, {
        language: locale,
        rate: rate,
        pitch: 1.0,
        onDone: () => {
          if (!isStopped.current) {
            console.log('✅ Speech finished');
            setIsPlaying(false);
          }
        },
        onError: (error) => {
          console.error('❌ Speech error:', error);
          setIsPlaying(false);
        },
      });
    } catch (error) {
      console.error('💥 Play error:', error);
      setIsPlaying(false);
    }
  };

  /**
   * Воспроизвести массив текстов последовательно
   *
   * @param {string[]} texts - массив текстов
   * @param {string} language - код языка
   * @param {number} rate - скорость речи
   * @param {Function} onProgress - callback при смене реплики (index)
   */
  const playSequence = async (texts, language, rate = 1.0, onProgress = null) => {
    if (isPlaying) {
      console.log('⚠️ Already playing, stopping previous...');
      await stop();
    }

    isStopped.current = false;
    setIsPlaying(true);

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

    const locale = languageLocales[language] || 'en-US';

    console.log('🔊 Playing sequence:', texts.length, 'items | Language:', locale);

    for (let i = 0; i < texts.length; i++) {
      if (isStopped.current) {
        console.log('⏹️ Sequence stopped by user');
        break;
      }

      currentIndexRef.current = i;
      if (onProgress) onProgress(i);

      console.log(`🔊 [${i + 1}/${texts.length}]:`, texts[i].substring(0, 50));

      await new Promise((resolve, reject) => {
        Speech.speak(texts[i], {
          language: locale,
          rate: rate,
          pitch: 1.0,
          onDone: resolve,
          onError: (error) => {
            console.error(`❌ Speech error at index ${i}:`, error);
            reject(error);
          },
        });
      });

      // Небольшая пауза между репликами (300ms)
      if (i < texts.length - 1 && !isStopped.current) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    currentIndexRef.current = null;
    setIsPlaying(false);
    console.log('✅ Sequence finished');
  };

  /**
   * Остановить воспроизведение
   */
  const stop = async () => {
    console.log('⏹️ Stopping speech...');
    isStopped.current = true;
    await Speech.stop();
    setIsPlaying(false);
    currentIndexRef.current = null;
  };

  return {
    play,
    playSequence,
    stop,
    isPlaying,
    currentIndex: currentIndexRef.current,
  };
}
