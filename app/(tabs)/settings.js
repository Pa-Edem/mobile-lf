import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, Switch, Text, View } from 'react-native';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState('light');
  const [useBrowserVoices, setUseBrowserVoices] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const appLanguage = i18n.language;
  const targetLanguage = 'fi'; // TODO Убрали setState (пока хардкод)

  const handleDone = () => {
    // TODO: Save settings
    console.log('Settings saved');
  };

  const handleTest = () => {
    // TODO: Test voice
    console.log('Testing voice...');
  };

  return (
    <View className='flex-1 bg-bgMain'>
      {/* Header */}
      <View className='bg-white border-b border-brdLight px-6 pt-12 pb-4'>
        <View className='flex-row items-center'>
          <Image source={require('../../assets/images/logo.png')} className='w-8 h-8 mr-3' resizeMode='contain' />
          <Text className='text-xl text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('settings.title')}
          </Text>
        </View>
      </View>

      <ScrollView className='flex-1' contentContainerClassName='px-6 pt-6 pb-24' showsVerticalScrollIndicator={false}>
        {/* APPEARANCE */}
        <Text className='text-xs text-textText mb-4 text-center' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('settings.appearance')}
        </Text>

        {/* Theme Toggle */}
        <View className='flex-row items-center justify-between mb-8'>
          <Text className='text-base text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {t('settings.theme')}
          </Text>

          <View className='flex-row bg-bgCard rounded-full p-1 border border-brdLight'>
            <Pressable
              onPress={() => setTheme('light')}
              className={`px-6 py-2 rounded-full ${theme === 'light' ? 'bg-white' : 'bg-transparent'}`}
              style={
                theme === 'light'
                  ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                    }
                  : {}
              }
            >
              <Ionicons name='sunny' size={20} color={theme === 'light' ? 'hsl(32, 19%, 15%)' : 'hsl(29, 10%, 55%)'} />
            </Pressable>

            <Pressable
              onPress={() => setTheme('dark')}
              className={`px-6 py-2 rounded-full ${theme === 'dark' ? 'bg-white' : 'bg-transparent'}`}
              style={
                theme === 'dark'
                  ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                    }
                  : {}
              }
            >
              <Ionicons name='moon' size={20} color={theme === 'dark' ? 'hsl(32, 19%, 15%)' : 'hsl(29, 10%, 55%)'} />
            </Pressable>
          </View>
        </View>

        {/* LANGUAGE */}
        <Text className='text-xs text-textText mb-4 text-center' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('settings.language')}
        </Text>

        {/* Application Language */}
        <View className='mb-4'>
          <Text className='text-sm text-textHead mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('settings.appLanguage')}
          </Text>
          <Pressable className='bg-bgCard border border-brdLight rounded-2xl px-4 py-4 flex-row items-center justify-between'>
            <Text className='text-base text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
              {appLanguage === 'en' ? 'English' : 'Русский'}
            </Text>
            <Ionicons name='chevron-down' size={20} color='hsl(29, 10%, 55%)' />
          </Pressable>
        </View>

        {/* Language to Learn */}
        <View className='mb-8'>
          <Text className='text-sm text-textHead mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('settings.targetLanguage')}
          </Text>
          <Pressable className='bg-bgCard border border-brdLight rounded-2xl px-4 py-4 flex-row items-center justify-between'>
            <Text className='text-base text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
              {targetLanguage === 'fi' ? 'Suomi' : targetLanguage.toUpperCase()}
            </Text>
            <Ionicons name='chevron-down' size={20} color='hsl(29, 10%, 55%)' />
          </Pressable>
        </View>

        {/* VOICE SETTINGS */}
        <View className='flex-row items-center justify-center mb-4'>
          <Text className='text-xs text-textText text-center' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('settings.voiceSettings')}
          </Text>
          <Text className='ml-1 text-base'>👑</Text>
        </View>

        {/* Use Browser Voices Toggle */}
        <View className='flex-row items-center justify-between mb-4'>
          <Text className='text-base text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {t('settings.useBrowserVoices')}
          </Text>
          <Switch
            value={useBrowserVoices}
            onValueChange={setUseBrowserVoices}
            trackColor={{ false: 'hsl(36, 20%, 80%)', true: 'hsl(130, 40%, 50%)' }}
            thumbColor='white'
          />
        </View>

        {/* Voice Selector */}
        <View className='mb-4'>
          <Text className='text-sm text-textHead mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('settings.voice')}
          </Text>
          <Pressable
            disabled={useBrowserVoices}
            className={`border border-brdLight rounded-2xl px-4 py-4 flex-row items-center justify-between ${
              useBrowserVoices ? 'bg-bgSide' : 'bg-bgCard'
            }`}
          >
            <View className='flex-row items-center'>
              <Text
                className={`text-base ${useBrowserVoices ? 'text-textDis' : 'text-textHead'}`}
                style={{ fontFamily: 'RobotoCondensed_400Regular' }}
              >
                Aino
              </Text>
              <Text className='ml-1 text-base'>👑</Text>
            </View>
            <Ionicons
              name='chevron-down'
              size={20}
              color={useBrowserVoices ? 'hsl(36, 20%, 80%)' : 'hsl(29, 10%, 55%)'}
            />
          </Pressable>
        </View>

        {/* Speech Rate */}
        <View className='mb-4'>
          <View className='flex-row items-center justify-between mb-2'>
            <Text className='text-sm text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {t('settings.speechRate')}
            </Text>
            <Text className='text-sm text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              x{speechRate.toFixed(2)}
            </Text>
          </View>
          <Slider
            value={speechRate}
            onValueChange={setSpeechRate}
            minimumValue={0.5}
            maximumValue={2.0}
            step={0.05}
            minimumTrackTintColor='hsl(130, 40%, 50%)'
            maximumTrackTintColor='hsl(36, 20%, 80%)'
            thumbTintColor='hsl(130, 40%, 50%)'
          />
        </View>

        {/* Pre-listening + Test Button */}
        <View className='flex-row items-center justify-between mb-8'>
          <Text className='text-base text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {t('settings.preListening')}
          </Text>

          <Pressable
            onPress={handleTest}
            className='bg-white border-2 border-greenDefault rounded-full px-6 py-2 flex-row items-center'
          >
            <Ionicons name='play' size={16} color='hsl(130, 40%, 50%)' />
            <Text className='text-greenDefault ml-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {t('settings.test')}
            </Text>
          </Pressable>
        </View>

        {/* Done Button */}
        <Pressable onPress={handleDone} className='bg-bgCard border border-brdLight rounded-2xl py-4 items-center'>
          <View className='flex-row items-center'>
            <Ionicons name='checkmark' size={20} color='hsl(32, 19%, 15%)' />
            <Text className='text-textHead ml-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {t('settings.done')}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
