// components/ReplicaCard.js
import { Text, View } from 'react-native';

export default function ReplicaCard({ text, translation, isLeft, onPlay }) {
  return (
    <View className={`mb-2 ${isLeft ? 'items-start' : 'items-end'}`}>
      <View
        className={`
          max-w-[85%] rounded-3xl p-4 border border-brdLight
          ${isLeft ? 'bg-chatLeft rounded-bl-none' : 'bg-chatRight rounded-br-none'}
        `}
      >
        {/* Основной текст */}
        <Text className='text-base text-textHead mb-1' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
          {text}
        </Text>

        {/* Перевод */}
        <Text className='text-base text-textTitle' style={{ fontFamily: 'RobotoCondensed_400Regular_Italic' }}>
          {translation}
        </Text>

        {/* Play button для реплики */}
        {/* {onPlay && (
          <Pressable onPress={onPlay} className='absolute top-2 right-2 p-1'>
            <Ionicons name='volume-medium' size={18} color='hsl(142, 71%, 35%)' />
          </Pressable>
        )} */}
      </View>
    </View>
  );
}
