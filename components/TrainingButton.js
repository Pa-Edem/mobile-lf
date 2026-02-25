// components/TrainingButton.js
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
// import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

const LEVEL_CONFIG = {
  0: { icon: 'list', label: 'viewDialog.level0', color: 'bg-bgSide' },
  1: { icon: 'book', label: 'viewDialog.level1', color: 'bg-bgSide' },
  2: { icon: 'mic', label: 'viewDialog.level2', color: 'bg-bgSide' },
  3: { icon: 'language', label: 'viewDialog.level3', color: 'bg-bgSide' },
  4: { icon: 'headset', label: 'viewDialog.level4', color: 'bg-bgSide' },
};

export default function TrainingButton({ level, dialogId, locked = false }) {
  // const { t } = useTranslation();
  const config = LEVEL_CONFIG[level];

  const handlePress = () => {
    if (locked) {
      // Show upgrade modal
      router.push('/modals/upgrade');
    } else {
      router.push(`/dialogs/${dialogId}/level-${level}`);
    }
  };

  return (
    <View className='flex-1'>
      <View className='flex-col items-center justify-center m-auto'>
        <Pressable
          onPress={handlePress}
          className={`
         p-1 w-14 h-14 rounded-full items-center justify-center m-auto
        ${locked ? 'bg-bgSide' : config.color + ' active:opacity-80'}
      `}
        >
          <View className='flex-row items-center'>
            <Ionicons name={config.icon} size={24} color={locked ? '#d6cec2' : '#0a5c18'} />
          </View>
        </Pressable>
        {/* <Text className='font-roboto text-xs items-center justify-center m-auto'>{t(`${config.label}`)}</Text> */}
      </View>
    </View>
  );
}
