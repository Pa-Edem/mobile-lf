// components/ExportModal.js
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';

/**
 * Модалка выбора формата экспорта
 *
 * @param {boolean} visible - видимость модалки
 * @param {function} onClose - закрыть модалку
 * @param {function} onExportAnki - экспорт в Anki CSV
 * @param {function} onExportPDF - экспорт в PDF
 */
export default function ExportModal({ visible, onClose, onExportAnki, onExportPDF }) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <Pressable className='flex-1 bg-black/50 justify-center items-center px-6' onPress={onClose}>
        <Pressable className='bg-white rounded-3xl p-6 w-full max-w-md' onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View className='flex-row items-center justify-between mb-6'>
            <Text className='text-xl text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {t('export.title')}
            </Text>
            <Pressable onPress={onClose} className='w-10 h-10 items-center justify-center'>
              <Ionicons name='close' size={24} color='hsl(0, 0%, 40%)' />
            </Pressable>
          </View>

          {/* Anki CSV Option */}
          <Pressable
            onPress={onExportAnki}
            className='bg-bgMain border border-brd rounded-2xl p-4 mb-3 flex-row items-center active:opacity-70'
          >
            <View className='w-12 h-12 bg-white rounded-full items-center justify-center mr-4'>
              <Ionicons name='document-text' size={24} color='hsl(130, 40%, 50%)' />
            </View>
            <View className='flex-1'>
              <Text className='text-base text-textHead mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('export.ankiCSV')}
              </Text>
              <Text className='text-sm text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                {t('export.ankiDescription')}
              </Text>
            </View>
            <Ionicons name='chevron-forward' size={20} color='hsl(0, 0%, 60%)' />
          </Pressable>

          {/* PDF Option */}
          <Pressable
            onPress={onExportPDF}
            className='bg-bgMain border border-brd rounded-2xl p-4 mb-4 flex-row items-center active:opacity-70'
          >
            <View className='w-12 h-12 bg-white rounded-full items-center justify-center mr-4'>
              <Ionicons name='document' size={24} color='hsl(130, 40%, 50%)' />
            </View>
            <View className='flex-1'>
              <Text className='text-base text-textHead mb-1' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
                {t('export.pdf')}
              </Text>
              <Text className='text-sm text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                {t('export.pdfDescription')}
              </Text>
            </View>
            <Ionicons name='chevron-forward' size={20} color='hsl(0, 0%, 60%)' />
          </Pressable>

          {/* Cancel Button */}
          <Pressable
            onPress={onClose}
            className='bg-bgSide border border-brdLight rounded-full p-4 mt-4 items-center active:opacity-70'
          >
            <Text className='text-base text-textTitle' style={{ fontFamily: 'RobotoCondensed_500Medium' }}>
              {t('common.cancel')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
