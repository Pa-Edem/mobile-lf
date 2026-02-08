// components/ReplicasSlider.js
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function ReplicasSlider({ value, onValueChange, disabled = false }) {
  const { t } = useTranslation();

  return (
    <View>
      {/* Label with value */}
      <Text className='text-sm text-textText mb-2' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
        {t('createDialog.replicas')}: <Text style={{ fontFamily: 'RobotoCondensed_700Bold' }}>{value}</Text>
      </Text>

      {/* Slider */}
      <Slider
        value={value}
        onValueChange={onValueChange}
        minimumValue={6}
        maximumValue={20}
        step={2}
        disabled={disabled}
        minimumTrackTintColor='hsl(130, 40%, 50%)'
        maximumTrackTintColor='hsl(36, 20%, 80%)'
        thumbTintColor='hsl(130, 40%, 50%)'
      />

      {/* Range labels */}
      <View className='flex-row justify-between'>
        <Text className='text-xs text-textDis' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          6
        </Text>
        <Text className='text-xs text-textDis' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
          20
        </Text>
      </View>
    </View>
  );
}
