import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

export default function UsageLimitsCard({ usage, collapsed, onToggle }) {
  const { t } = useTranslation();

  const getPercentage = (used, total) => (used / total) * 100;

  return (
    <View className={`bg-bgCard rounded-3xl p-4 border border-brdLight ${collapsed ? 'mb-4' : 'mb-6'}`}>
      {/* Header */}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center'>
          <View className='w-8 h-8 bg-greenDefault rounded-lg items-center justify-center mr-3'>
            <Ionicons name='stats-chart' size={18} color='white' />
          </View>
          <Text className='text-sm text-textTitle' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('main.usageLimits')}
          </Text>
        </View>

        <Pressable onPress={onToggle} className='w-10 h-10 bg-greenDefault rounded-full items-center justify-center'>
          <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={20} color='white' />
        </Pressable>
      </View>

      {/* Content */}
      {!collapsed && (
        <View className='mt-4'>
          {/* Generations */}
          <View className='mb-4'>
            <View className='flex-row justify-between mb-2'>
              <Text className='text-xs text-textText' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('main.generations')}
              </Text>
              <Text className='text-xs text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {usage.generations.used}/{usage.generations.total}
              </Text>
            </View>
            <View className='h-2 bg-brdLight rounded-full overflow-hidden'>
              <View
                className='h-full bg-greenDefault rounded-full'
                style={{ width: `${getPercentage(usage.generations.used, usage.generations.total)}%` }}
              />
            </View>
          </View>

          {/* PRO Features */}
          <View className='mb-4'>
            <View className='flex-row justify-between mb-2'>
              <Text className='text-xs text-textText' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('main.proFeatures')}
              </Text>
              <Text className='text-xs text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {usage.proFeatures.used}/{usage.proFeatures.total}
              </Text>
            </View>
            <View className='h-2 bg-brdLight rounded-full overflow-hidden'>
              <View
                className='h-full bg-greenDefault rounded-full'
                style={{ width: `${getPercentage(usage.proFeatures.used, usage.proFeatures.total)}%` }}
              />
            </View>
          </View>

          {/* Saved Dialogs */}
          <View>
            <View className='flex-row justify-between mb-2'>
              <Text className='text-xs text-textText' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('main.savedDialogs')}
              </Text>
              <Text className='text-xs text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {usage.savedDialogs.used}/{usage.savedDialogs.total}
              </Text>
            </View>
            <View className='h-2 bg-brdLight rounded-full overflow-hidden'>
              <View
                className='h-full bg-greenDefault rounded-full'
                style={{ width: `${getPercentage(usage.savedDialogs.used, usage.savedDialogs.total)}%` }}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
