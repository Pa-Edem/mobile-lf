import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

export default function DialogCard({ dialog, onPress }) {
  const { t } = useTranslation();

  // Определяем статус тренировок из БД
  const trainingStatus = {
    level2: false, // TODO: проверять из training_logs
    level3: false,
    level4: false,
  };

  return (
    <Pressable onPress={onPress} className='bg-white rounded-2xl p-4 mb-3 border border-brdLight active:bg-bgSide'>
      <View className='flex-row items-center justify-between'>
        <View className='flex-1'>
          <Text className='text-lg text-textHead mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {dialog.topic}
          </Text>
          <Text className='text-sm text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {dialog.replicas_count} {t('main.lines')}
          </Text>
        </View>

        {/* Training Status Icons */}
        <View className='flex-row gap-3'>
          {/* Level 2: Pronunciation */}
          <Ionicons name='mic' size={20} color={trainingStatus.level2 ? 'hsl(130, 40%, 50%)' : 'hsl(36, 20%, 80%)'} />

          {/* Level 3: Translation */}
          <Ionicons
            name='language'
            size={20}
            color={trainingStatus.level3 ? 'hsl(130, 40%, 50%)' : 'hsl(36, 20%, 80%)'}
          />

          {/* Level 4: Listening */}
          <Ionicons name='ear' size={20} color={trainingStatus.level4 ? 'hsl(130, 40%, 50%)' : 'hsl(36, 20%, 80%)'} />
        </View>
      </View>
    </Pressable>
  );
}
