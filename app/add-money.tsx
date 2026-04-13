import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AddMoneyContent } from '../components/AddMoneyContent';
import { useAccountSummary } from '../hooks/useAccountSummary';

export default function AddMoneyScreen() {
  const { refresh: refreshAccountSummary } = useAccountSummary();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AddMoneyContent onBack={handleBack} onAfterAddMoney={refreshAccountSummary} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
