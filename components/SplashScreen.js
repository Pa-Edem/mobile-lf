import { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Запускаем анимацию при монтировании
    Animated.parallel([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Scale up
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <View className='flex-1 bg-bgMain justify-center items-center'>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className='items-center'
      >
        {/* Логотип */}
        <Image source={require('../assets/images/logo.png')} className='w-32 h-32 mb-6' resizeMode='contain' />

        {/* Название */}
        <Text className='text-4xl font-robotoBold text-textHead mb-2'>Lingua Flow</Text>
      </Animated.View>
    </View>
  );
}
