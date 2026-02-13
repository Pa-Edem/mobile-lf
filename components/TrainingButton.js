// components/TrainingButton.js
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

const LEVEL_CONFIG = {
  1: { icon: 'book', label: 'Level 1', color: 'bg-info' },
  2: { icon: 'mic', label: 'Level 2', color: 'bg-info' },
  3: { icon: 'language', label: 'Level 3', color: 'bg-info' },
  4: { icon: 'headset', label: 'Level 4', color: 'bg-info' },
};

export default function TrainingButton({ level, dialogId, locked = false }) {
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
    <Pressable
      onPress={handlePress}
      className={`
         p-4 w-16 h-16 rounded-full items-center justify-center m-auto
        ${locked ? 'bg-bgCard' : config.color + ' active:opacity-80'}
      `}
    >
      <View className='flex-row items-center'>
        <Ionicons name={config.icon} size={24} color={locked ? '#c2b3a3' : 'white'} />
        {/* <Text
          className={`ml-2 font-bold ${locked ? 'text-gray-400' : 'text-white'}`}
          style={{ fontFamily: 'RobotoCondensed_700Bold' }}
        >
          {config.label}
        </Text> */}
        {/* {locked && <Ionicons name='lock-closed' size={16} color='#9CA3AF' className='ml-1' />} */}
      </View>
    </Pressable>
  );
}
