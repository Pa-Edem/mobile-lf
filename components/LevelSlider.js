// components/LevelSlider.js
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

const LEVELS = ['A1', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2', 'C1.1', 'C1.2', 'C2'];

export default function LevelSlider({ value, onValueChange, disabled = false }) {
  const { t } = useTranslation();

  // Конвертируем level в индекс и обратно
  const levelToIndex = (level) => LEVELS.indexOf(level);
  const indexToLevel = (index) => LEVELS[Math.round(index)];

  const currentIndex = levelToIndex(value);

  const handleChange = (index) => {
    onValueChange(indexToLevel(index));
  };

  return (
    <View>
      {/* Label with value */}
      <Text className='text-sm text-textHead mb-1' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
        {t('createDialog.level')}: <Text style={{ fontFamily: 'RobotoCondensed_700Bold' }}>{value}</Text>
      </Text>

      {/* Slider */}
      <Slider
        value={currentIndex}
        onValueChange={handleChange}
        minimumValue={0}
        maximumValue={LEVELS.length - 1}
        step={1}
        disabled={disabled}
        minimumTrackTintColor='hsl(130, 40%, 50%)'
        maximumTrackTintColor='hsl(36, 20%, 80%)'
        thumbTintColor='hsl(130, 40%, 50%)'
      />

      {/* Range labels */}
      <View className='flex-row justify-between'>
        <Text className='text-xs text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          A1
        </Text>
        <Text className='text-xs text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          C2
        </Text>
      </View>
    </View>
  );
}
