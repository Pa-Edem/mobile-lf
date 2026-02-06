// app/(auth)/forgot-password.js
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

  const handleResetPassword = async () => {
    // Валидация email
    if (!email.trim()) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: t('auth.error'),
        message: t('auth.enterEmail'),
      });
      return;
    }

    // Простая проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: t('auth.error'),
        message: t('auth.invalidEmail'),
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'linguaflow://reset-password', // Deep link для мобильного приложения
      });

      if (error) throw error;

      setSent(true);
    } catch (error) {
      console.error('Reset password error:', error);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: t('auth.error'),
        message: error.message || t('forgotPassword.resetError'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View className='flex-1 bg-bgMain px-6 justify-center items-center'>
        <View className='items-center mb-8'>
          <View className='w-20 h-20 bg-greenLight rounded-full items-center justify-center mb-4'>
            <Ionicons name='checkmark' size={40} color='hsl(130, 40%, 50%)' />
          </View>

          <Text className='text-2xl text-textHead mb-3 text-center' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('forgotPassword.success')}
          </Text>

          <Text
            className='text-base text-textText text-center mb-8'
            style={{ fontFamily: 'RobotoCondensed_400Regular' }}
          >
            {t('forgotPassword.successMessage')}
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          className='w-full py-4 rounded-full items-center bg-greenDefault active:bg-greenDark'
        >
          <Text className='text-white text-lg' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('forgotPassword.backToLogin')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1 bg-bgMain'>
      <ScrollView
        className='flex-1'
        contentContainerClassName='px-6 pt-12 pb-8'
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Pressable onPress={() => router.back()} className='flex-row items-center mb-8'>
          <Ionicons name='arrow-back' size={24} color='hsl(32, 19%, 15%)' />
          <Text className='ml-2 text-textHead' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {t('forgotPassword.backToLogin')}
          </Text>
        </Pressable>

        {/* Logo */}
        <View className='items-center mb-8'>
          <Image source={require('../../assets/images/logo.png')} className='w-20 h-20 mb-3' resizeMode='contain' />
          <Text className='text-2xl text-textHead mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('forgotPassword.title')}
          </Text>
          <Text className='text-base text-textText text-center' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {t('forgotPassword.description')}
          </Text>
        </View>

        {/* Email Input */}
        <View className='mb-6'>
          <Text className='text-sm text-textTitle mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('auth.email')}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor='hsl(29, 10%, 55%)'
            keyboardType='email-address'
            autoCapitalize='none'
            autoCorrect={false}
            className='bg-bgCard border border-brdLight rounded-full px-4 py-4 text-textHead mb-8'
            style={{ fontFamily: 'RobotoCondensed_400Regular' }}
            editable={!loading}
          />
        </View>

        {/* Send Button */}
        <Pressable
          onPress={handleResetPassword}
          disabled={loading}
          className={`w-full py-4 rounded-full items-center ${
            loading ? 'bg-greenLight' : 'bg-greenDefault active:bg-greenDark'
          }`}
        >
          <Text className='text-white text-lg' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {loading ? t('forgotPassword.sending') : t('forgotPassword.sendLink')}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </KeyboardAvoidingView>
  );
}
