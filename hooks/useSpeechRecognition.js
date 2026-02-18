// hooks/useSpeechRecognition.js
import { File } from 'expo-file-system';
import { useState } from 'react';

/**
 * Хук для распознавания речи через Groq Whisper API
 */
export function useSpeechRecognition() {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Распознаёт речь из аудио файла
   *
   * @param {string} audioUri - URI аудио файла
   * @param {string} language - код языка (fi, en, es, etc.)
   * @returns {Promise<string>} распознанный текст
   */
  const recognizeSpeech = async (audioUri, language) => {
    setIsProcessing(true);
    try {
      console.log('🎧 Starting speech recognition...');
      console.log('Audio URI:', audioUri);
      console.log('Language:', language);

      // ========== НОВЫЙ API: File ==========
      // Создаём File объект из URI
      const file = new File(audioUri);

      // Читаем как ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Конвертируем в Blob
      const blob = new Blob([arrayBuffer], { type: 'audio/m4a' });
      // ====================================

      // Создаём FormData
      const formData = new FormData();
      formData.append('file', blob, 'audio.m4a');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', language);
      formData.append('response_format', 'json');

      // Отправляем на Groq
      const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

      if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not found in environment variables');
      }

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'STT request failed');
      }

      const data = await response.json();
      console.log('✅ Speech recognized:', data.text);

      return data.text;
    } catch (error) {
      console.error('❌ Speech recognition failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Вычисляет точность произношения (Levenshtein distance)
   *
   * @param {string} original - оригинальный текст
   * @param {string} recognized - распознанный текст
   * @returns {number} точность от 0 до 100
   */
  const calculateAccuracy = (original, recognized) => {
    if (!original || !recognized) return 0;

    const origLower = original.toLowerCase().trim();
    const recLower = recognized.toLowerCase().trim();

    const distance = levenshteinDistance(origLower, recLower);
    const maxLength = Math.max(origLower.length, recLower.length);

    if (maxLength === 0) return 100;

    const accuracy = 100 - (distance / maxLength) * 100;
    return Math.max(0, Math.min(100, Math.round(accuracy)));
  };

  return {
    recognizeSpeech,
    calculateAccuracy,
    isProcessing,
  };
}

/**
 * Вычисляет расстояние Левенштейна между двумя строками
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
      }
    }
  }

  return dp[m][n];
}
