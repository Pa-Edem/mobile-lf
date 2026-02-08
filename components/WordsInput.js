// components/WordsInput.js
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';

export default function WordsInput({ words, onWordsChange, disabled = false }) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !words.includes(trimmed)) {
      onWordsChange([...words, trimmed]);
      setInputValue('');
    }
  };

  const handleRemove = (word) => {
    onWordsChange(words.filter((w) => w !== word));
  };

  return (
    <View>
      {/* Input + Add Button */}
      <View className='flex-row gap-2 mb-3'>
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleAdd}
          placeholder={t('createDialog.wordsPlaceholder')}
          editable={!disabled}
          className={`flex-1 px-4 py-3 rounded-lg border ${
            disabled ? 'bg-bgCard border-brdLight text-textDis' : 'bg-white border-brdLight text-textHead'
          }`}
          style={{ fontFamily: 'RobotoCondensed_400Regular' }}
        />
        <Pressable
          onPress={handleAdd}
          disabled={disabled || !inputValue.trim()}
          className={`w-12 h-12 rounded-lg items-center justify-center ${
            disabled || !inputValue.trim() ? 'bg-textDis' : 'bg-greenDefault active:bg-greenDark'
          }`}
        >
          <Ionicons name='add' size={24} color='white' />
        </Pressable>
      </View>

      {/* Word Pills */}
      {words.length > 0 && (
        <View className='flex-row flex-wrap gap-2'>
          {words.map((word, index) => (
            <View key={index} className='bg-greenLight px-3 py-2 rounded-full flex-row items-center gap-2'>
              <Text className='text-greenDefault text-sm' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {word}
              </Text>
              <Pressable onPress={() => handleRemove(word)} disabled={disabled}>
                <Ionicons name='close-circle' size={18} color='hsl(130, 40%, 50%)' />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
