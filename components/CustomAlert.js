// components/CustomAlert.js
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';

export default function CustomAlert({ visible, type = 'success', title, message, onClose }) {
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

  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: 'hsl(130, 45%, 50%)' };
      case 'error':
        return { name: 'close-circle', color: 'hsl(5, 80%, 70%)' };
      case 'warning':
        return { name: 'warning', color: 'hsl(45, 100%, 75%)' };
      case 'info':
        return { name: 'information-circle', color: 'hsl(210, 70%, 50%)' };
      default:
        return { name: 'checkmark-circle', color: 'hsl(130, 45%, 50%)' };
    }
  };

  const icon = getIcon();

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
            <Ionicons name={icon.name} size={64} color={icon.color} />
          </View>

          {/* Title */}
          <Text className='text-xl text-textHead mb-2 text-center' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {title}
          </Text>

          {/* Message */}
          <Text
            className='text-base text-textText mb-6 text-center'
            style={{ fontFamily: 'RobotoCondensed_400Regular' }}
          >
            {message}
          </Text>

          {/* OK Button */}
          <Pressable onPress={onClose} className='bg-greenDefault rounded-full py-3 items-center active:bg-greenDark'>
            <Text className='text-white text-base' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              OK
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
