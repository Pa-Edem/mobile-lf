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
      return 'bg-green-100 border-2 border-green-600';
    }
    if (state === 'wrong') {
      return 'bg-red-100 border-2 border-red-600';
    }
    return 'bg-secondary border-2 border-brdDark';
  };

  const getTextStyles = () => {
    if (state === 'correct') {
      return 'text-green-800';
    }
    if (state === 'wrong') {
      return 'text-red-800';
    }
    return 'text-textHead';
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`py-6 px-4 rounded-2xl mb-3 ${getButtonStyles()} ${disabled ? 'opacity-50' : 'active:opacity-80'}`}
    >
      <Text className={`text-base text-center ${getTextStyles()}`} style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
        {text}
      </Text>
    </Pressable>
  );
}
