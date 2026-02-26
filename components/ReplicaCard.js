// components/ReplicaCard.js
import { Text, View } from 'react-native';

export default function ReplicaCard({ text, translation, isLeft, textColor, isItalic = false }) {
  return (
    <View className={`mb-2 ${isLeft ? 'items-start' : 'items-end'}`}>
      <View
        className={`
          max-w-[85%] rounded-3xl p-4 border border-brdLight
          ${isLeft ? 'bg-chatLeft rounded-bl-none' : 'bg-chatRight rounded-br-none'}
        `}
      >
        {/* Основной текст */}
        <Text
          className='text-base mb-1'
          style={{
            fontFamily: isItalic ? 'RobotoCondensed_400Regular_Italic' : 'RobotoCondensed_500Medium',
            color: textColor || 'hsl(29, 10%, 20%)',
          }}
        >
          {text}
        </Text>

        {/* Перевод */}
        {translation && (
          <Text className='text-base text-textTitle' style={{ fontFamily: 'RobotoCondensed_400Regular_Italic' }}>
            {translation}
          </Text>
        )}
      </View>
    </View>
  );
}
