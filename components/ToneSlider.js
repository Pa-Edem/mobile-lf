// components/ToneSlider.js
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function ToneSlider({ value, onValueChange, disabled = false }) {
  const { t } = useTranslation();

  const getToneLabel = (tone) => {
    if (tone <= 3) return t('createDialog.toneCasual');
    if (tone <= 7) return t('createDialog.toneNeutral');
    return t('createDialog.toneFormal');
  };

  return (
    <View>
      {/* Label with value */}
      <Text className='text-sm text-textHead mb-1' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
        {t('createDialog.tone')}: <Text style={{ fontFamily: 'RobotoCondensed_700Bold' }}>{value}</Text> (
        {getToneLabel(value)})
      </Text>

      {/* Slider */}
      <Slider
        value={value}
        onValueChange={onValueChange}
        minimumValue={1}
        maximumValue={10}
        step={1}
        disabled={disabled}
        minimumTrackTintColor='hsl(130, 40%, 50%)'
        maximumTrackTintColor='hsl(36, 20%, 80%)'
        thumbTintColor='hsl(130, 40%, 50%)'
      />

      {/* Range labels */}
      <View className='flex-row justify-between'>
        <Text className='text-xs text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          {t('createDialog.toneCasual')}
        </Text>
        <Text className='text-xs text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          {t('createDialog.toneFormal')}
        </Text>
      </View>
    </View>
  );
}
