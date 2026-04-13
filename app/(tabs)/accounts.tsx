import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, PiggyBank } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

const MAIN_ACCOUNT_BALANCE = '12,450.00';
const SAVINGS_ACCOUNT_BALANCE = '5,200.00';

export default function AccountsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Accounts</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Wallet size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.cardLabel}>Main account</Text>
          </View>
          <Text style={styles.balance}>
            <Text style={styles.currency}>$</Text>
            {MAIN_ACCOUNT_BALANCE}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, styles.iconWrapSavings]}>
              <PiggyBank size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.cardLabel}>Savings account</Text>
          </View>
          <Text style={styles.balance}>
            <Text style={styles.currency}>$</Text>
            {SAVINGS_ACCOUNT_BALANCE}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F5',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconWrapSavings: {
    backgroundColor: Colors.success,
  },
  cardLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  balance: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  currency: {
    fontSize: 22,
  },
});
