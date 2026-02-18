// hooks/useAudioRecorder.js
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useRef, useState } from 'react';

/**
 * Хук для записи аудио с микрофона
 * Автоматически управляет разрешениями и очисткой файлов
 */
export function useAudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingsRef = useRef([]);

  /**
   * Начинает запись аудио
   */
  const startRecording = async () => {
    try {
      console.log('🎤 Requesting microphone permission...');
      const { granted } = await Audio.requestPermissionsAsync();

      if (!granted) {
        throw new Error('Microphone permission denied');
      }

      console.log('🎤 Starting recording...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      setRecording(newRecording);
      setIsRecording(true);
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      throw error;
    }
  };

  /**
   * Останавливает запись и возвращает URI файла
   */
  const stopRecording = async () => {
    if (!recording) {
      console.warn('⚠️ No active recording to stop');
      return null;
    }

    try {
      console.log('⏹️ Stopping recording...');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      console.log('✅ Recording stopped:', uri);

      // Сохраняем URI для последующей очистки
      recordingsRef.current.push(uri);

      setRecording(null);

      return { uri };
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      throw error;
    }
  };

  /**
   * Удаляет конкретный файл записи
   */
  const deleteRecording = async (uri) => {
    if (!uri) return;

    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        console.log('🗑️ Deleted recording:', uri);
      }

      // Удаляем из списка
      recordingsRef.current = recordingsRef.current.filter((u) => u !== uri);
    } catch (error) {
      console.error('❌ Failed to delete recording:', error);
    }
  };

  /**
   * Удаляет ВСЕ записи текущей сессии
   */
  const deleteAllRecordings = async () => {
    const count = recordingsRef.current.length;
    if (count === 0) {
      console.log('ℹ️ No recordings to delete');
      return;
    }

    console.log(`🗑️ Deleting ${count} recording(s)...`);

    const deletePromises = recordingsRef.current.map((uri) =>
      FileSystem.deleteAsync(uri, { idempotent: true }).catch((err) => {
        console.error('❌ Failed to delete:', uri, err);
      }),
    );

    await Promise.all(deletePromises);
    recordingsRef.current = [];
    console.log('✅ All recordings deleted');
  };

  return {
    startRecording,
    stopRecording,
    deleteRecording,
    deleteAllRecordings,
    isRecording,
  };
}
