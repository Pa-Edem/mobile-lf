// app/dialogs/[id]/level-0.js

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import ExportModal from '../../../components/ExportModal';
import UpgradeModal from '../../../components/UpgradeModal';
import { exportToAnkiCSV, exportToPDF } from '../../../lib/exportUtils';
import { getEffectivePlan } from '../../../lib/planUtils';
import { supabase } from '../../../lib/supabase';

export default function VocabularyScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();

  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [profile, setProfile] = useState(null);

  const loadDialog = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase.from('dialogs').select('*').eq('id', id).single();

      if (error) throw error;
      setDialog(data);

      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading dialog:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadDialog();
    }, [loadDialog]),
  );

  const handleStartFlashcards = () => {
    router.push(`/dialogs/${id}/flashcards`);
  };

  const handleExport = () => {
    const plan = getEffectivePlan(profile);
    if (plan === 'free') {
      setUpgradeModalVisible(true);
      return;
    }
    setExportModalVisible(true);
  };

  const handleExportAnki = async () => {
    setExportModalVisible(false);

    const vocabulary = dialog?.content?.vocabulary || [];

    const result = await exportToAnkiCSV(
      vocabulary,
      dialog?.topic || 'vocabulary',
      dialog?.target_language || 'fi',
      dialog?.ui_language || 'ru',
    );

    if (result.success) {
      console.log('✅ Exported to Anki CSV');
    } else {
      console.error('❌ Export failed:', result.error);
      // TODO: Показать Toast с ошибкой
    }
  };

  const handleExportPDF = async () => {
    setExportModalVisible(false);

    const vocabulary = dialog?.content?.vocabulary || [];

    const result = await exportToPDF(vocabulary, dialog?.topic || 'vocabulary', dialog?.level || 'A1');

    if (result.success) {
      console.log('✅ Exported to PDF');
    } else {
      console.error('❌ Export failed:', result.error);
      // TODO: Показать Toast с ошибкой
    }
  };

  if (loading) {
    return (
      <View className='flex-1 bg-bgMain justify-center items-center'>
        <ActivityIndicator size='large' color='hsl(130, 40%, 50%)' />
      </View>
    );
  }

  const vocabulary = dialog?.content?.vocabulary || [];
  const vocabularyCount = vocabulary.length;

  return (
    <View className='flex-1 bg-bgMain'>
      {/* Header */}
      <View className='bg-white border-b border-brdLight px-4 pt-8 pb-2'>
        <View className='flex-row items-center justify-between'>
          <Pressable onPress={() => router.back()} className='w-12 h-12 items-center justify-center'>
            <Ionicons name='arrow-back' size={24} color='hsl(29, 10%, 20%)' />
          </Pressable>

          <View className='flex-1 items-center'>
            <Text className='text-lg text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {t('vocabulary.title')}
            </Text>
            <Text className='text-sm text-textBody' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
              {dialog?.topic}
            </Text>
          </View>
          <View className='w-12 h-12' />
        </View>
      </View>

      {/* Content */}
      <ScrollView className='flex-1' contentContainerClassName='px-6 py-6'>
        {/* Start Flashcards Button */}
        <Pressable
          onPress={handleStartFlashcards}
          className='bg-greenDefault active:bg-greenDark rounded-full p-2 mb-4 flex-row items-center justify-between'
        >
          <View className='flex-row items-center'>
            <View className='w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3'>
              <Ionicons name='albums-outline' size={20} color='white' />
            </View>
            <View>
              <Text className='text-base text-white' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('vocabulary.startFlashcards')}
              </Text>
              {/* <Text className='text-sm text-white/80' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                {vocabularyCount} {t('vocabulary.collocations')}
              </Text> */}
            </View>
          </View>
          <Ionicons name='chevron-forward' size={24} color='white' />
        </Pressable>

        {/* Vocabulary List */}
        <Text className='text-sm text-textTitle mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
          {t('vocabulary.allWords')} ({vocabularyCount})
        </Text>

        {vocabulary.map((item, index) => (
          <View key={index} className='bg-white border border-brdLight rounded-2xl px-4 py-2 mb-1'>
            <Text className='text-base text-textHead mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {item.collocation}
            </Text>
            <Text className='text-sm text-textText text-right' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
              {item.translation}
            </Text>
            {/* {item.example && (
              <Text
                className='text-xs text-textText italic'
                style={{ fontFamily: 'RobotoCondensed_400Regular_Italic' }}
              >
                &ldquo;{item.example}&rdquo;
              </Text>
            )} */}
          </View>
        ))}

        {/* Export Button (PRO) */}
        <Pressable
          onPress={handleExport}
          className='bg-bgCard border border-brd rounded-full p-2 my-10 flex-row items-center justify-between'
        >
          <View className='flex-row items-center'>
            <View className='w-10 h-10 bg-bgMain rounded-full items-center justify-center mr-3'>
              <Ionicons name='download-outline' size={20} color='hsl(130, 40%, 50%)' />
            </View>
            <View className='flex-row items-center'>
              <Text className='text-base text-textHead mr-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('vocabulary.export')}
              </Text>
              <Text className='text-sm text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                Anki CSV, PDF 🔒
              </Text>
            </View>
          </View>
          <Ionicons name='chevron-forward' size={24} color='hsl(0, 0%, 60%)' />
        </Pressable>
      </ScrollView>

      {/* Export Modal */}
      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        onExportAnki={handleExportAnki}
        onExportPDF={handleExportPDF}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        onUpgrade={() => {
          setUpgradeModalVisible(false);
          router.push('/pricing');
        }}
      />
    </View>
  );
}
