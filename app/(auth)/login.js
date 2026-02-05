import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function AuthScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState('signIn'); // 'signIn' or 'signUp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signIn, signUp, isLoading } = useAuth();

  const isSignIn = mode === 'signIn';

  const handleAuth = async () => {
    // Валидация
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!isSignIn && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      if (isSignIn) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Authentication failed');
    }
  };

  const handleGoogleAuth = async () => {
    Alert.alert('Info', 'Google Auth coming soon');
    // TODO: Реализовать Google OAuth
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1 bg-bgMain'>
      <ScrollView
        className='flex-1'
        contentContainerClassName='px-6 pt-12 pb-8'
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <View className='flex-row justify-center items-center mb-8'>
          <Image source={require('../../assets/images/logo.png')} className='w-12 h-12 mr-2' resizeMode='contain' />
          <Text className='text-2xl text-textHead' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            Lingua Flow
          </Text>
        </View>

        {/* Sign In / Sign Up Toggle */}
        <View className='w-full bg-bgCard rounded-full p-1 mb-6 border border-brdLight'>
          <View className='flex-row'>
            <Pressable
              onPress={() => setMode('signIn')}
              className={`flex-1 py-3 rounded-full items-center justify-center ${
                isSignIn ? 'bg-greenDefault' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm ${isSignIn ? 'text-white' : 'text-textText'}`}
                style={{ fontFamily: 'RobotoCondensed_700Bold' }}
              >
                {t('auth.signIn')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('signUp')}
              className={`flex-1 py-3 rounded-full items-center justify-center ${
                !isSignIn ? 'bg-greenDefault' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm ${!isSignIn ? 'text-white' : 'text-textText'}`}
                style={{ fontFamily: 'RobotoCondensed_700Bold' }}
              >
                {t('auth.signUp')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Email Input */}
        <View className='mb-4'>
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
            className='bg-bgCard border border-brdLight rounded-full px-4 py-4 text-textHead'
            style={{ fontFamily: 'RobotoCondensed_400Regular' }}
          />
        </View>

        {/* Password Input */}
        <View className='mb-2'>
          <Text className='text-sm text-textTitle mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('auth.password')}
          </Text>
          <View className='relative'>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor='hsl(29, 10%, 55%)'
              secureTextEntry={!showPassword}
              autoCapitalize='none'
              className='bg-bgCard border border-brdLight rounded-full px-4 py-4 pr-12 text-textHead'
              style={{ fontFamily: 'RobotoCondensed_400Regular' }}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} className='absolute right-4 top-4'>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color='hsl(29, 10%, 55%)' />
            </Pressable>
          </View>
        </View>

        {/* Confirm Password (только для Sign Up) */}
        {!isSignIn && (
          <View className='mb-8'>
            <Text className='text-sm text-textTitle mb-2' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
              {t('auth.confirmPassword')}
            </Text>
            <View className='relative'>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor='hsl(29, 10%, 55%)'
                secureTextEntry={!showConfirmPassword}
                autoCapitalize='none'
                className='bg-bgCard border border-brdLight rounded-full px-4 py-4 pr-12 text-textHead'
                style={{ fontFamily: 'RobotoCondensed_400Regular' }}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-4 top-4'
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color='hsl(29, 10%, 55%)'
                />
              </Pressable>
            </View>
          </View>
        )}

        {/* Forgot Password (только для Sign In) */}
        {isSignIn && (
          <Pressable onPress={handleForgotPassword} className='mb-6 self-end'>
            <Text className='text-sm text-textText' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
              {t('auth.forgotPassword')}
            </Text>
          </Pressable>
        )}

        {/* Auth Button */}
        <Pressable
          onPress={handleAuth}
          disabled={isLoading}
          className={`w-full py-4 rounded-full items-center mb-6 ${
            isLoading ? 'bg-greenLight' : 'bg-greenDefault active:bg-greenDark'
          }`}
        >
          <Text className='text-white text-lg' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {isLoading ? '...' : t(isSignIn ? 'auth.signIn' : 'auth.signUp')}
          </Text>
        </Pressable>

        {/* OR Divider */}
        <View className='flex-row items-center mb-6'>
          <View className='flex-1 h-px bg-divider' />
          <Text className='mx-4 text-textText text-sm' style={{ fontFamily: 'RobotoCondensed_400Regular' }}>
            {t('auth.or')}
          </Text>
          <View className='flex-1 h-px bg-divider' />
        </View>

        {/* Google Button */}
        <Pressable
          onPress={handleGoogleAuth}
          className='w-full py-4 rounded-full items-center bg-white border border-brdLight flex-row justify-center active:bg-bgSide'
        >
          <Image source={require('../../assets/images/google.png')} className='w-5 h-5 mr-2' />
          <Text className='text-textHead text-base' style={{ fontFamily: 'RobotoCondensed_700Bold' }}>
            {t('auth.continueWithGoogle')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
