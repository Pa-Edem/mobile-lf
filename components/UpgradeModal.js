import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Modal, Pressable, Text, View } from 'react-native';

export default function UpgradeModal({ visible, onClose, onUpgrade }) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      fadeAnim.setValue(0);
    }
  }, [visible, scaleAnim, fadeAnim]);

  return (
    <Modal transparent visible={visible} animationType='none' onRequestClose={onClose}>
      <Pressable
        className='flex-1 justify-center items-center px-6'
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onPress={onClose}
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          }}
          className='bg-white rounded-3xl p-6 w-full max-w-sm'
          onStartShouldSetResponder={() => true}
        >
          {/* Icon */}
          <View className='items-center mb-4'>
            <View className='w-20 h-20 bg-tierPro rounded-full items-center justify-center'>
              <Ionicons name='rocket' size={40} color='white' />
            </View>
          </View>

          {/* Title */}
          <Text className='text-2xl text-textHead mb-2 text-center' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('upgrade.title')}
          </Text>

          {/* Message */}
          <Text
            className='text-base text-textText mb-6 text-center'
            style={{ fontFamily: 'RobotoCondensed_400Regular' }}
          >
            {t('upgrade.message')}
          </Text>

          {/* Features */}
          <View className='mb-6 bg-bgSide rounded-2xl p-4'>
            <View className='flex-row items-center mb-3'>
              <Ionicons name='checkmark-circle' size={20} color='hsl(130, 40%, 50%)' />
              <Text className='ml-3 text-sm text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                {t('upgrade.feature1')}
              </Text>
            </View>
            <View className='flex-row items-center mb-3'>
              <Ionicons name='checkmark-circle' size={20} color='hsl(130, 40%, 50%)' />
              <Text className='ml-3 text-sm text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                {t('upgrade.feature2')}
              </Text>
            </View>
            <View className='flex-row items-center'>
              <Ionicons name='checkmark-circle' size={20} color='hsl(130, 40%, 50%)' />
              <Text className='ml-3 text-sm text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
                {t('upgrade.feature3')}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <Pressable onPress={onUpgrade} className='bg-tierPro rounded-full py-3 items-center mb-3 active:opacity-80'>
            <Text className='text-white text-base' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {t('upgrade.upgradeButton')}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} className='py-3 items-center'>
            <Text className='text-textText text-base' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
              {t('upgrade.later')}
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
