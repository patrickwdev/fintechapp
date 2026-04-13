import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Shield } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { CustomInput } from '../../components/CustomInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useSignup } from '../../context/SignupContext';

function formatSsn(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export default function SignupSsnScreen() {
  const { ssn, setSsn } = useSignup();

  const digitsOnly = ssn.replace(/\D/g, '');
  const canContinue = digitsOnly.length === 9;

  const handleChange = useCallback(
    (text: string) => {
      setSsn(formatSsn(text));
    },
    [setSsn]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add your SSN</Text>
        <Text style={styles.subtitle}>
          We use this to verify your identity. Your information is encrypted and secure.
        </Text>

        <View style={styles.form}>
          <CustomInput
            label="Social Security Number"
            placeholder="123-45-6789"
            value={ssn}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={11}
            icon={<Shield size={20} color={Colors.textSecondary} />}
          />
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="Continue"
            onPress={() => canContinue && router.push('/signup/phone')}
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
