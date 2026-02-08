import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Text, View } from 'react-native';

export default function EmptyState({ onCreateDialog }) {
  const { t } = useTranslation();

  return (
    <View className='flex-1 items-center justify-center px-6 py-12'>
      {/* Icon with gradient circle */}
      <View className='items-center justify-center mb-8'>
        <View className='items-center justify-center'>
          <Image source={require('../assets/images/logo.png')} className='w-32 h-32' resizeMode='contain' />
        </View>
      </View>

      {/* Text */}
      <Text className='text-2xl text-textHead mb-3 text-center' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
        {t('emptyState.title')}
      </Text>

      <Text className='text-base text-textText mb-8 text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
        {t('emptyState.description')}
      </Text>

      {/* Create Button */}
      <Pressable
        onPress={onCreateDialog}
        className='bg-greenDefault px-8 py-4 rounded-full flex-row items-center active:bg-greenDark'
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Ionicons name='chatbubbles' size={20} color='white' />
        <Text className='text-white text-base ml-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('emptyState.button')}
        </Text>
      </Pressable>
    </View>
  );
}
