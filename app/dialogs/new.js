// app/dialogs/new.js
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
import UsageLimitsCard from '../../components/UsageLimitsCard';
import WordsInput from '../../components/WordsInput';
import { canGenerateDialog, getEffectivePlan, getPlanLimits } from '../../lib/planUtils';
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
  const [usage, setUsage] = useState(null);
  const [limitsCollapsed, setLimitsCollapsed] = useState(false);

  // Load usage on mount
  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Загружаем usage counters
      const { data: usageData } = await supabase.from('usage_counters').select('*').eq('user_id', user.id).single();

      // Загружаем профиль для определения плана
      const { data: profileData } = await supabase
        .from('profiles')
        .select('subscription_tier, is_trial_active, manual_pro, manual_premium')
        .eq('id', user.id)
        .single();

      const plan = getEffectivePlan(profileData);
      const planLimits = getPlanLimits(plan);

      setUsage({
        generations: {
          used: usageData?.daily_generations_used || 0,
          total: planLimits.generations,
        },
        proFeatures: {
          used: usageData?.daily_pro_features_used || 0,
          total: planLimits.proFeatures,
        },
        savedDialogs: {
          used: usageData?.total_dialogs_count || 0,
          total: planLimits.dialogs,
        },
      });
    } catch (error) {
      console.error('Error loading usage:', error);
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (!topic.trim()) {
      Alert.alert(t('common.error'), t('createDialog.topicRequired'));
      return;
    }

    try {
      setIsGenerating(true);

      // Получаем текущего пользователя
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(t('common.error'), 'Not authenticated');
        return;
      }

      // Проверяем лимиты
      const { data: usageData } = await supabase.from('usage_counters').select('*').eq('user_id', user.id).single();

      const { data: profileData } = await supabase
        .from('profiles')
        .select('subscription_tier, is_trial_active, manual_pro, manual_premium, target_language')
        .eq('id', user.id)
        .single();

      const canGenerate = canGenerateDialog(usageData, profileData);

      if (!canGenerate) {
        Alert.alert(t('common.error'), t('createDialog.quotaExceeded'));
        router.push('/modals/upgrade');
        return;
      }

      // TODO: Здесь будет вызов Edge Function generate-dialog
      // Пока просто создаём mock диалог в БД для тестирования UI

      const mockDialog = {
        user_id: user.id,
        topic: topic.trim(),
        level: level,
        target_language: profileData.target_language || 'fi',
        tone: tone,
        replicas_count: replicas,
        required_words: words.length > 0 ? words : null,
        content: {
          target: Array(replicas).fill('Sample text'),
          native: Array(replicas).fill('Translation'),
          options: Array(replicas).fill(['Option 1', 'Option 2', 'Option 3']),
        },
        is_completed: false,
        completion_percentage: 0,
      };

      const { data: newDialog, error } = await supabase.from('dialogs').insert(mockDialog).select().single();

      if (error) throw error;

      // Обновляем счётчик (временно вручную, потом будет через Edge Function)
      await supabase.rpc('increment', {
        row_id: user.id,
        column_name: 'daily_generations_used',
      });

      // Success!
      Alert.alert(t('common.success'), t('createDialog.success'));
      router.replace(`/dialogs/${newDialog.id}`);
    } catch (error) {
      console.error('Generate dialog error:', error);
      Alert.alert(t('common.error'), t('createDialog.error'));
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
        {/* Usage Limits */}
        {usage && (
          <UsageLimitsCard
            usage={usage}
            collapsed={limitsCollapsed}
            onToggle={() => setLimitsCollapsed(!limitsCollapsed)}
          />
        )}

        {/* Topic */}
        <View className='mb-6'>
          <Text className='text-sm text-textText mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('createDialog.topic')} *
          </Text>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder={t('createDialog.topicPlaceholder')}
            className='px-4 py-3 rounded-lg border border-brdLight bg-white text-textHead'
            style={{ fontFamily: 'RobotoCondensed_400Regular' }}
          />
        </View>

        {/* Words */}
        <View className='mb-6'>
          <Text className='text-sm text-textText mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
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
