// components/AccuracyResult.js
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

/**
 * Компонент отображения результата проверки произношения
 *
 * @param {string} original - оригинальный текст
 * @param {string} recognized - распознанный текст
 * @param {number} accuracy - точность (0-100)
 */
export default function AccuracyResult({ original, recognized, accuracy }) {
  const { t } = useTranslation();

  /**
   * Подсвечивает различия между оригиналом и распознанным текстом
   */
  const highlightDifferences = () => {
    const origWords = original.toLowerCase().split(' ');
    const recWords = recognized.toLowerCase().split(' ');

    const maxLength = Math.max(origWords.length, recWords.length);

    return Array.from({ length: maxLength }).map((_, i) => {
      const origWord = origWords[i] || '';
      const recWord = recWords[i] || '';
      const isCorrect = origWord === recWord;

      return (
        <Text
          key={i}
          className={`text-base ${isCorrect ? 'text-green-600' : 'text-red-600'}`}
          style={{ fontFamily: 'RobotoCondensed_500Medium' }}
        >
          {recWord || '___'}{' '}
        </Text>
      );
    });
  };

  /**
   * Определяет цвет фона на основе точности
   */
  const getBackgroundColor = () => {
    if (accuracy >= 80) return 'bg-green-100';
    if (accuracy >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  /**
   * Определяет цвет текста на основе точности
   */
  const getTextColor = () => {
    if (accuracy >= 80) return 'text-green-700';
    if (accuracy >= 50) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <View className='bg-white rounded-2xl p-4 border border-brdLight'>
      {/* Оригинал */}
      <Text className='text-sm text-textTitle mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
        {t('training.level2.original')}:
      </Text>
      <Text className='text-base text-textHead mb-4' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
        {original}
      </Text>

      {/* Распознанный текст с подсветкой */}
      <Text className='text-sm text-textTitle mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
        {t('training.level2.youSaid')}:
      </Text>
      <View className='flex-row flex-wrap mb-4'>{highlightDifferences()}</View>

      {/* Accuracy индикатор */}
      <View className={`p-4 rounded-xl ${getBackgroundColor()}`}>
        <Text className={`text-center text-lg ${getTextColor()}`} style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('training.level2.accuracy')}: {accuracy}%
        </Text>
      </View>
    </View>
  );
}
