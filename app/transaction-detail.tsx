import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/Colors';
import { getActivityById } from '../constants/recentActivities';
import {
  ShoppingBag,
  Briefcase,
  Film,
  Utensils,
  Coffee,
  Wallet,
  Car,
  User,
  Smartphone,
} from 'lucide-react-native';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  ShoppingBag,
  Briefcase,
  Film,
  Utensils,
  Coffee,
  Wallet,
  Car,
  User,
  Smartphone,
};

type DetailParams = {
  id?: string;
  title?: string;
  subtitle?: string;
  amount?: string;
  iconName?: string;
  iconBg?: string;
  isIncome?: string;
};

function parseParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default function TransactionDetailScreen() {
  const params = useLocalSearchParams<DetailParams>();
  const id = parseParam(params.id);
  const titleParam = parseParam(params.title);
  const subtitleParam = parseParam(params.subtitle);
  const amountParam = parseParam(params.amount);
  const iconNameParam = parseParam(params.iconName);
  const iconBgParam = parseParam(params.iconBg);
  const isIncomeParam = parseParam(params.isIncome);

  const activityFromParams =
    titleParam && amountParam
      ? {
          id: id ?? '',
          title: titleParam,
          subtitle: subtitleParam ?? '',
          amount: amountParam,
          amountColor: isIncomeParam === 'true' ? Colors.success : Colors.text,
          iconName: (iconNameParam ?? 'ShoppingBag') as keyof typeof ICON_MAP,
          iconBg: iconBgParam ?? Colors.primary,
        }
      : null;

  const activityFromId = id ? getActivityById(id) : undefined;
  const activity = activityFromParams ?? activityFromId;

  if (!activity) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.notFound}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const Icon = ICON_MAP[activity.iconName] ?? ShoppingBag;
  const isIncome = activity.amount.startsWith('+');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconLarge, { backgroundColor: activity.iconBg }]}>
          <Icon size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={[styles.amount, { color: activity.amountColor }]}>
          {activity.amount}
        </Text>
        <Text style={styles.subtitle}>{activity.subtitle}</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{activity.title}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & time</Text>
            <Text style={styles.detailValue}>{activity.subtitle}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={[styles.detailValue, { color: activity.amountColor }]}>
              {activity.amount}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>
              {isIncome ? 'Income' : 'Expense'}
            </Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>#{activity.id.padStart(6, '0')}</Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingBottom: 32,
  },
  iconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  amount: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  detailRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFound: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
});
