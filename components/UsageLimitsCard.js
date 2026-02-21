// components/UsageLimitsCard.js
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

/**
 * Карточка с лимитами использования
 *
 * @param {Object} usage - данные из usage_counters
 * @param {Object} profile - профиль пользователя
 * @param {Object} limits - лимиты плана (из getPlanLimits)
 * @param {number} availableGenerations - доступно генераций сегодня
 * @param {number} availableProFeatures - доступно PRO функций сегодня
 * @param {boolean} collapsed - свёрнута ли карточка
 * @param {function} onToggle - обработчик сворачивания/разворачивания
 */
export default function UsageLimitsCard({
  usage,
  profile,
  limits,
  availableGenerations,
  availableProFeatures,
  collapsed,
  onToggle,
}) {
  const { t } = useTranslation();

  const getPercentage = (used, total) => {
    if (total === 0) return 0;
    return Math.min(100, (used / total) * 100);
  };

  // Данные для генераций
  const generationsUsed = usage?.daily_generations_used || 0;
  const generationsTotal = limits?.generations || 0;
  const generationsCarryOver = usage?.carry_over_generations || 0;

  // Данные для PRO функций
  const proFeaturesUsed = usage?.daily_pro_features_used || 0;
  const proFeaturesTotal = limits?.proFeatures || 0;
  const proFeaturesCarryOver = usage?.carry_over_pro_features || 0;

  // Данные для сохранённых диалогов
  const savedDialogsUsed = usage?.total_dialogs_count || 0;
  const savedDialogsTotal = limits?.dialogs || 0;

  return (
    <View className={`bg-white rounded-3xl p-4 border border-brdLight ${collapsed ? 'mb-4' : 'mb-6'}`}>
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
            <View className='flex-row justify-between mb-1'>
              <Text className='text-xs text-textTitle' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('main.generations')}
              </Text>
              <View className='flex-row items-center gap-1'>
                <Text className='text-xs text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                  {generationsUsed}/{generationsTotal}
                </Text>
                {generationsCarryOver > 0 && (
                  <Text className='text-xs text-greenDefault' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
                    (+{generationsCarryOver})
                  </Text>
                )}
              </View>
            </View>
            <View className='h-2 bg-brdLight rounded-full overflow-hidden'>
              <View
                className='h-full bg-greenDefault rounded-full'
                style={{ width: `${getPercentage(generationsUsed, generationsTotal)}%` }}
              />
            </View>
            {/* Доступно сегодня */}
            <Text className='text-xs text-textText mt-1' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
              {t('main.availableToday')}: {availableGenerations}
            </Text>
          </View>

          {/* PRO Features */}
          <View className='mb-4'>
            <View className='flex-row justify-between mb-1'>
              <Text className='text-xs text-textTitle' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('main.proFeatures')}
              </Text>
              <View className='flex-row items-center gap-1'>
                <Text className='text-xs text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                  {proFeaturesUsed}/{proFeaturesTotal}
                </Text>
                {proFeaturesCarryOver > 0 && (
                  <Text className='text-xs text-greenDefault' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
                    (+{proFeaturesCarryOver})
                  </Text>
                )}
              </View>
            </View>
            <View className='h-2 bg-brdLight rounded-full overflow-hidden'>
              <View
                className='h-full bg-greenDefault rounded-full'
                style={{ width: `${getPercentage(proFeaturesUsed, proFeaturesTotal)}%` }}
              />
            </View>
            {/* Доступно сегодня */}
            {limits?.plan !== 'premium' && (
              <Text className='text-xs text-textText mt-1' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                {t('main.availableToday')}: {availableProFeatures}
              </Text>
            )}
            {limits?.plan === 'premium' && (
              <Text className='text-xs text-greenDefault mt-1' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
                {t('main.unlimited')}
              </Text>
            )}
          </View>

          {/* Saved Dialogs */}
          <View>
            <View className='flex-row justify-between mb-1'>
              <Text className='text-xs text-textTitle' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('main.savedDialogs')}
              </Text>
              <Text className='text-xs text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {savedDialogsUsed}/{savedDialogsTotal}
              </Text>
            </View>
            <View className='h-2 bg-brdLight rounded-full overflow-hidden'>
              <View
                className='h-full bg-greenDefault rounded-full'
                style={{ width: `${getPercentage(savedDialogsUsed, savedDialogsTotal)}%` }}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
