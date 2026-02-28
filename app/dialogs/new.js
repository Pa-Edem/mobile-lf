// app/dialogs/new.js

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import LevelSlider from '../../components/LevelSlider';
import ReplicasSlider from '../../components/ReplicasSlider';
import ToneSlider from '../../components/ToneSlider';
import WordsInput from '../../components/WordsInput';
import { supabase } from '../../lib/supabase';

export default function CreateDialogScreen() {
  const { t } = useTranslation();

  // Form state
  const [topic, setTopic] = useState('');
  const [words, setWords] = useState([]);
  const [level, setLevel] = useState('A2.1');
  const [tone, setTone] = useState(5);
  const [replicas, setReplicas] = useState(8);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);

  // const handleGenerate = async () => {
  //   if (!topic.trim()) {
  //     Alert.alert(t('common.error'), t('createDialog.topicRequired'));
  //     return;
  //   }

  //   setIsGenerating(true);

  //   try {
  //     const {
  //       data: { session },
  //       error: sessionError,
  //     } = await supabase.auth.getSession();

  //     console.log('Invoking generate-dialog with token:', session?.access_token?.substring(0, 20));

  //     if (sessionError || !session) {
  //       throw new Error('Not authenticated');
  //     }

  //     const { data: profileData, error: profileError } = await supabase
  //       .from('profiles')
  //       .select('target_language, ui_language')
  //       .single();

  //     if (profileError) throw new Error('Could not fetch profile');

  //     const targetLanguage = profileData?.target_language || 'fi';
  //     const uiLanguage = profileData?.ui_language || 'en';

  //     const { data, error: functionError } = await supabase.functions.invoke('generate-dialog', {
  //       headers: {
  //         Authorization: `Bearer ${session.access_token}`,
  //       },
  //       body: {
  //         topic: topic.trim(),
  //         words: words.length > 0 ? words : null,
  //         level,
  //         tone,
  //         replicas,
  //         targetLanguage,
  //         uiLanguage,
  //       },
  //     });

  //     if (functionError) {
  //       console.error('❌ Edge Function error:', functionError);
  //       throw new Error(functionError.message || 'Generation failed');
  //     }

  //     if (!data?.success) {
  //       throw new Error(data?.error || 'Generation failed');
  //     }

  //     console.log('✅ Dialog generated:', data.data);
  //     router.replace(`/dialogs/${data.data.dialogId}`);
  //   } catch (error) {
  //     console.error('Generation error:', error);
  //     Alert.alert(t('createDialog.error.title'), error.message || t('createDialog.error.message'));
  //   } finally {
  //     setIsGenerating(false);
  //   }
  // };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert(t('common.error'), t('createDialog.topicRequired'));
      return;
    }

    setIsGenerating(true);

    try {
      console.log('🚀 Starting generation...');

      // 1. Получаем сессию
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('Not authenticated');
      }

      console.log('✅ Token ready');

      // 2. Получаем профиль
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('target_language, ui_language')
        .single();

      if (profileError) throw new Error('Could not fetch profile');

      const targetLanguage = profileData?.target_language || 'fi';
      const uiLanguage = profileData?.ui_language || 'en';

      // 3. ПЕРЕДАЁМ ТОКЕН В BODY! (обходной путь)
      const payload = {
        token: session.access_token, // ← ТОКЕН В BODY!
        topic: topic.trim(),
        words: words.length > 0 ? words : null,
        level,
        tone,
        replicas,
        targetLanguage,
        uiLanguage,
      };

      console.log('📡 Calling function...');

      const { data: fnData, error: fnError } = await supabase.functions.invoke('generate-dialog', {
        body: JSON.stringify(payload),
      });

      if (fnError) {
        console.error('❌ Error:', fnError);
        throw new Error(fnError.message || 'Function failed');
      }

      if (!fnData?.success) {
        throw new Error(fnData?.error || 'Generation failed');
      }

      console.log('✅ Success:', fnData.data.dialogId);
      router.replace(`/dialogs/${fnData.data.dialogId}`);
    } catch (error) {
      console.error('💥 Error:', error);
      Alert.alert(t('createDialog.error.title'), error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className='flex-1 bg-bgMain'
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View className='bg-white border-b border-brdLight px-6 pt-12 pb-4'>
        <View className='flex-row items-center'>
          <Pressable onPress={() => router.back()} className='mr-4'>
            <Ionicons name='arrow-back' size={24} color='hsl(29, 10%, 20%)' />
          </Pressable>
          <Text className='text-xl text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('createDialog.title')}
          </Text>
        </View>
      </View>

      {/* Form */}
      <ScrollView className='flex-1' contentContainerClassName='px-6 py-6' showsVerticalScrollIndicator={false}>
        {/* Topic */}
        <View className='mb-6'>
          <Text className='text-sm text-textHead mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('createDialog.topic')} *
          </Text>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder={t('createDialog.topicPlaceholder')}
            className='px-4 py-3 rounded-full border border-brdLight bg-white text-textHead'
            style={{ fontFamily: 'RobotoCondensed_400Regular' }}
          />
        </View>

        {/* Words */}
        <View className='mb-6'>
          <Text className='text-sm text-textHead mb-1' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {t('createDialog.words')}
          </Text>
          <WordsInput words={words} onWordsChange={setWords} disabled={isGenerating} />
        </View>

        {/* Level */}
        <View className='mb-6'>
          <LevelSlider value={level} onValueChange={setLevel} disabled={isGenerating} />
        </View>

        {/* Tone */}
        <View className='mb-6'>
          <ToneSlider value={tone} onValueChange={setTone} disabled={isGenerating} />
        </View>

        {/* Replicas */}
        <View className='mb-6'>
          <ReplicasSlider value={replicas} onValueChange={setReplicas} disabled={isGenerating} />
        </View>

        {/* Generate Button */}
        <Pressable
          onPress={handleGenerate}
          disabled={isGenerating}
          className={`py-4 rounded-full items-center ${
            isGenerating ? 'bg-textDis' : 'bg-greenDefault active:bg-greenDark'
          }`}
        >
          {isGenerating ? (
            <View className='flex-row items-center'>
              <ActivityIndicator size='small' color='white' />
              <Text className='text-white ml-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('createDialog.generating')}
              </Text>
            </View>
          ) : (
            <Text className='text-white text-lg' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {t('createDialog.generateButton')} ✨
            </Text>
          )}
        </Pressable>

        {/* Bottom spacing */}
        <View className='h-8' />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
