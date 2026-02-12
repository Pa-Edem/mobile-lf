// components/CompletionModal.js
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';

/**
 * Модальное окно завершения тренировки
 *
 * @param {Object} props
 * @param {boolean} props.visible - Видимость модалки
 * @param {number} props.level - Уровень тренировки (1-4)
 * @param {number} props.accuracy - Точность 0-100 (опционально, для уровней 2-4)
 * @param {Function} props.onClose - Вернуться к диалогу
 * @param {Function} props.onRepeat - Повторить уровень
 */
export default function CompletionModal({ visible, level, accuracy = null, onClose, onRepeat }) {
  const { t } = useTranslation();

  // Определяем текст в зависимости от уровня
  const getTitle = () => {
    if (level === 1) return t('training.level1.completion.title');
    if (accuracy >= 80) return t('training.completion.excellent'); // Для level 2-4
    if (accuracy >= 50) return t('training.completion.good');
    return t('training.completion.completed');
  };

  const getMessage = () => {
    if (level === 1) {
      return t('training.level1.completion.message');
    }
    return t('training.completion.accuracy', { accuracy });
  };

  const getEmoji = () => {
    if (level === 1) return '🎉';
    if (accuracy >= 80) return '🎉';
    if (accuracy >= 50) return '👍';
    return '💪';
  };

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View className='flex-1 bg-black/50 justify-center items-center px-6'>
        <View className='bg-bgMain rounded-2xl p-6 w-full max-w-sm'>
          {/* Эмодзи */}
          <Text className='text-5xl text-center mb-4'>{getEmoji()}</Text>

          {/* Заголовок */}
          <Text className='text-2xl text-textHead text-center mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {getTitle()}
          </Text>

          {/* Сообщение */}
          <Text
            className='text-base text-textText text-center mb-6'
            style={{ fontFamily: 'RobotoCondensed_400Regular' }}
          >
            {getMessage()}
          </Text>

          {/* Кнопка: Вернуться к диалогу */}
          <Pressable onPress={onClose} className='bg-greenDefault py-4 rounded-full mb-3 active:opacity-80'>
            <Text className='text-white text-center text-base' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
              {t('training.level1.completion.backToDialog')}
            </Text>
          </Pressable>

          {/* Кнопка: Повторить уровень */}
          <Pressable onPress={onRepeat} className='bg-bgCard py-4 rounded-full active:opacity-80'>
            <Text className='text-textHead text-center text-base' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
              {t('training.level1.completion.repeatLevel')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
