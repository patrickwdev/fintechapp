import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useSignup } from '../../context/SignupContext';
import { sendVerificationEmail } from '../../lib/verificationEmail';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { email, clear } = useSignup();

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const id = setInterval(() => setCooldownSeconds((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldownSeconds]);

  const handleResend = async () => {
    if (!email || resending || cooldownSeconds > 0) return;
    setResending(true);
    const { error, statusCode } = await sendVerificationEmail(email);
    setResending(false);
    if (error) {
      const isRateLimit = statusCode === 429;
      if (isRateLimit) {
        setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        Alert.alert(
          'Please wait',
          "You've requested too many emails. Please wait a minute before trying again."
        );
      } else {
        Alert.alert('Could not resend', error.message || 'Please try again later.');
      }
    } else {
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      Alert.alert('Check your inbox', 'A new verification link has been sent to your email.');
    }
  };

  const handleVerified = () => {
    clear();
    router.replace('/signin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconWrap}>
          <Mail size={48} color={Colors.primary} />
        </View>

        <Text style={styles.title}>We need to verify your email first</Text>
        <Text style={styles.subtitle}>
          We’ve sent a verification link to
        </Text>
        <Text style={styles.email}>{email || 'your email'}</Text>
        <Text style={styles.subtitle}>
          Click the link in that email to verify your account. You can then sign in and use the app.
        </Text>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResend}
            disabled={resending || cooldownSeconds > 0}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.resendText,
                (resending || cooldownSeconds > 0) && styles.resendTextDisabled,
              ]}
            >
              {resending
                ? 'Sending…'
                : cooldownSeconds > 0
                  ? `Resend again in ${cooldownSeconds}s`
                  : 'Resend verification email'}
            </Text>
          </TouchableOpacity>

          <PrimaryButton
            title="I've verified my email"
            onPress={handleVerified}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 24,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    marginTop: 32,
    gap: 16,
  },
  resendBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
  },
  resendTextDisabled: {
    color: Colors.textSecondary,
  },
});
