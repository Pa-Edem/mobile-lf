import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function MessagesScreen() {
  const { t } = useTranslation();

  return (
    <View className='flex-1 bg-bgMain justify-center items-center'>
      <Text className='text-3xl text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
        {t('tabs.messages')}
      </Text>
      <Text className='text-lg text-textText mt-4' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
        {t('common.comingSoon')}
      </Text>
    </View>
  );
}
