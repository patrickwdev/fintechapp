import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Smartphone } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { CustomInput } from '../../components/CustomInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useSignup } from '../../context/SignupContext';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits.replace(/(\d{1,3})/, '($1');
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d{1,3})/, '($1) $2');
  return digits.replace(/(\d{3})(\d{3})(\d{1,4})/, '($1) $2-$3');
}

export default function SignupPhoneScreen() {
  const { phone, setPhone } = useSignup();

  const digitsOnly = phone.replace(/\D/g, '');
  const canContinue = digitsOnly.length === 10;

  const handleChange = useCallback(
    (text: string) => {
      setPhone(formatPhone(text));
    },
    [setPhone]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Enter your phone number</Text>
        <Text style={styles.subtitle}>
          We’ll use this to verify your device and keep your account secure.
        </Text>

        <View style={styles.form}>
          <CustomInput
            label="Phone number"
            placeholder="(555) 123-4567"
            value={phone}
            onChangeText={handleChange}
            keyboardType="phone-pad"
            maxLength={14}
            icon={<Smartphone size={20} color={Colors.textSecondary} />}
          />
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="Continue"
            onPress={() => canContinue && router.push('/signup/email')}
            style={!canContinue ? styles.buttonDisabled : undefined}
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  footer: {
    gap: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
