// components/AnswerButton.js
import { Pressable, Text } from 'react-native';

/**
 * Кнопка варианта ответа для Level 4
 * @param {string} text - Текст варианта ответа
 * @param {function} onPress - Обработчик нажатия
 * @param {string} state - Состояние: 'default' | 'correct' | 'wrong'
 * @param {boolean} disabled - Заблокирована ли кнопка
 */
export default function AnswerButton({ text, onPress, state = 'default', disabled = false }) {
  // Определяем стили в зависимости от состояния
  const getButtonStyles = () => {
    if (state === 'correct') {
      return 'bg-success border-2 border-textSuccess';
    }
    if (state === 'wrong') {
      return 'bg-error border-2 border-textError';
    }
    return 'bg-bgSide border-2 border-brdLight';
  };

  const getTextStyles = () => {
    if (state === 'correct') {
      return 'text-textSuccess';
    }
    if (state === 'wrong') {
      return 'text-textError';
    }
    return 'text-textHead';
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center justify-center min-h-24 py-4 px-4 rounded-2xl mb-3 ${getButtonStyles()}`}
    >
      <Text className={`text-base text-center ${getTextStyles()}`} style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
        {text}
      </Text>
    </Pressable>
  );
}
