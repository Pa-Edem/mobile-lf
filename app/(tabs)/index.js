import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

// TODO Временные моковые данные (замените на реальные данные из БД)
const MOCK_USAGE = {
  generations: { used: 13, total: 20 },
  proFeatures: { used: 4, total: 10 },
  savedDialogs: { used: 17, total: 20 },
};

// TODO Временные моковые данные (замените на реальные данные из БД)
const MOCK_DIALOGS = [
  {
    id: '1',
    title: 'Ordering Coffee',
    lines: 12,
    level: 'A1',
    trainingStatus: {
      level2: true, // Pronunciation completed
      level3: false, // Translation not completed
      level4: true, // Listening completed
    },
  },
  {
    id: '2',
    title: 'Meeting a Friend',
    lines: 8,
    level: 'A1',
    trainingStatus: {
      level2: false,
      level3: false,
      level4: false,
    },
  },
  {
    id: '3',
    title: 'Booking a Hotel',
    lines: 15,
    level: 'A2',
    trainingStatus: {
      level2: true,
      level3: true,
      level4: false,
    },
  },
];

// Группируем диалоги по уровням (A2.1 + A2.2 = A2)
function groupDialogsByLevel(dialogs) {
  const grouped = {};

  dialogs.forEach((dialog) => {
    // Извлекаем базовый уровень (A1, A2, B1, etc.)
    const baseLevel = dialog.level.match(/^[ABC][12]/)?.[0] || dialog.level;

    if (!grouped[baseLevel]) {
      grouped[baseLevel] = [];
    }
    grouped[baseLevel].push(dialog);
  });

  return grouped;
}

function UsageLimitsCard({ usage, collapsed, onToggle }) {
  const { t } = useTranslation();

  const getPercentage = (used, total) => (used / total) * 100;

  return (
    <View className={`bg-bgSide rounded-3xl p-4 border border-brdLight ${collapsed ? 'mb-4' : 'mb-6'}`}>
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

        <Pressable onPress={onToggle} className='w-10 h-10 bg-bgMain rounded-full items-center justify-center'>
          <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={20} color='hsl(130, 40%, 50%)' />
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

function DialogCard({ dialog, onPress }) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} className='bg-white rounded-2xl p-4 mb-3 border border-brdLight active:bg-bgSide'>
      <View className='flex-row items-center justify-between'>
        <View className='flex-1'>
          <Text className='text-lg text-textHead mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {dialog.title}
          </Text>
          <Text className='text-sm text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {dialog.lines} {t('main.lines')}
          </Text>
        </View>

        {/* Training Status Icons */}
        <View className='flex-row gap-3'>
          {/* Level 2: Pronunciation */}
          <Ionicons
            name='mic'
            size={20}
            color={dialog.trainingStatus.level2 ? 'hsl(130, 40%, 50%)' : 'hsl(36, 20%, 80%)'}
          />

          {/* Level 3: Translation */}
          <Ionicons
            name='language'
            size={20}
            color={dialog.trainingStatus.level3 ? 'hsl(130, 40%, 50%)' : 'hsl(36, 20%, 80%)'}
          />

          {/* Level 4: Listening */}
          <Ionicons
            name='ear'
            size={20}
            color={dialog.trainingStatus.level4 ? 'hsl(130, 40%, 50%)' : 'hsl(36, 20%, 80%)'}
          />
        </View>
      </View>
    </Pressable>
  );
}

export default function MainScreen() {
  const { t } = useTranslation();
  const [limitsCollapsed, setLimitsCollapsed] = useState(false);

  const groupedDialogs = groupDialogsByLevel(MOCK_DIALOGS);
  const levels = Object.keys(groupedDialogs).sort();

  const handleCreateDialog = () => {
    // TODO: Navigate to create dialog screen
    Alert.alert('Info', 'Create Dialog - Coming in Phase 2');
  };

  const handleDialogPress = (dialogId) => {
    // TODO: Navigate to view dialog screen
    Alert.alert('Info', `Opening dialog ${dialogId} - Coming in Phase 2`);
  };

  return (
    <View className='flex-1 bg-bgMain'>
      {/* Header */}
      <View className='bg-white border-b border-brdLight px-6 pt-12 pb-4'>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center'>
            <Image source={require('../../assets/images/logo.png')} className='w-8 h-8 mr-3' resizeMode='contain' />
            <Text className='text-xl text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {t('main.title')}
            </Text>
          </View>

          <Pressable
            onPress={handleCreateDialog}
            className='w-12 h-12 bg-greenDefault rounded-full items-center justify-center'
          >
            <Ionicons name='add' size={28} color='white' />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView className='flex-1' contentContainerClassName='px-6 pt-6 pb-8' showsVerticalScrollIndicator={false}>
        {/* Usage Limits */}
        <UsageLimitsCard
          usage={MOCK_USAGE}
          collapsed={limitsCollapsed}
          onToggle={() => setLimitsCollapsed(!limitsCollapsed)}
        />

        {/* Dialogs by Level */}
        {levels.map((level) => (
          <View key={level} className='mb-6'>
            {/* Level Header */}
            <Text className='text-xs text-textText mb-3' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {level}
            </Text>

            {/* Dialogs */}
            {groupedDialogs[level].map((dialog) => (
              <DialogCard key={dialog.id} dialog={dialog} onPress={() => handleDialogPress(dialog.id)} />
            ))}
          </View>
        ))}

        {/* End Message */}
        <Text className='text-xs text-textDis text-center mt-4' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('main.endOfDialogs')}
        </Text>
      </ScrollView>
    </View>
  );
}
