// components/RecordButton.js
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View } from 'react-native';

/**
 * Кнопка записи с 3 состояниями
 *
 * @param {boolean} isRecording - идёт ли запись
 * @param {boolean} isProcessing - идёт ли обработка
 * @param {function} onPress - обработчик нажатия
 * @param {boolean} disabled - заблокирована ли кнопка
 */
export default function RecordButton({ isRecording, isProcessing, onPress, disabled = false }) {
  // Состояние 1: Готов к записи
  if (!isRecording && !isProcessing) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`w-20 h-20 rounded-full items-center justify-center ${
          disabled ? 'bg-gray-300' : 'bg-red-500 active:bg-red-600'
        }`}
      >
        <Ionicons name='mic' size={36} color='white' />
      </Pressable>
    );
  }

  // Состояние 2: Идёт запись (пульсация)
  if (isRecording) {
    return (
      <Pressable
        onPress={onPress}
        className='w-20 h-20 rounded-full items-center justify-center bg-red-600'
        style={{
          shadowColor: '#ef4444',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <View className='w-8 h-8 bg-white rounded' />
      </Pressable>
    );
  }

  // Состояние 3: Обработка (loader)
  if (isProcessing) {
    return (
      <View className='w-20 h-20 rounded-full items-center justify-center bg-gray-300'>
        <ActivityIndicator size='large' color='hsl(130, 40%, 50%)' />
      </View>
    );
  }

  return null;
}
