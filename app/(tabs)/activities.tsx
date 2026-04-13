import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Filter,
  Search,
  Wallet,
  Coffee,
  ShoppingBag,
  Car,
  Film,
  User,
  Smartphone,
  Clock,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';

type FilterType = 'All' | 'Income' | 'Spending' | 'Pending';

const FILTERS: FilterType[] = ['All', 'Income', 'Spending', 'Pending'];

const TRANSACTIONS = [
  {
    id: '1',
    title: 'Starbucks Coffee',
    subtitle: '2:45 PM • Food & Drink',
    amount: '-$12.50',
    isIncome: false,
    pending: false,
    icon: Coffee,
    iconName: 'Coffee',
    iconBg: '#22C55E',
    dateGroup: 'TODAY',
  },
  {
    id: '2',
    title: 'Salary Deposit',
    subtitle: '10:15 AM • Tech Corp Inc.',
    amount: '+$4,250.00',
    isIncome: true,
    pending: false,
    icon: Wallet,
    iconName: 'Wallet',
    iconBg: Colors.primary,
    dateGroup: 'TODAY',
  },
  {
    id: '3',
    title: 'Amazon.com',
    subtitle: '9:30 AM • Shopping',
    amount: '-$84.20',
    isIncome: false,
    pending: true,
    icon: ShoppingBag,
    iconName: 'ShoppingBag',
    iconBg: '#18181B',
    dateGroup: 'YESTERDAY',
  },
  {
    id: '4',
    title: 'Uber Trip',
    subtitle: '6:22 PM • Transportation',
    amount: '-$24.50',
    isIncome: false,
    pending: false,
    icon: Car,
    iconName: 'Car',
    iconBg: '#18181B',
    dateGroup: 'YESTERDAY',
  },
  {
    id: '5',
    title: 'Netflix Subscription',
    subtitle: '8:00 AM • Entertainment',
    amount: '-$15.99',
    isIncome: false,
    pending: false,
    icon: Film,
    iconName: 'Film',
    iconBg: '#E50914',
    dateGroup: 'YESTERDAY',
  },
  {
    id: '6',
    title: 'Transfer from Alex M.',
    subtitle: '4:10 PM • Transfer',
    amount: '+$45.00',
    isIncome: true,
    pending: false,
    icon: User,
    iconName: 'User',
    iconBg: '#0EA5E9',
    dateGroup: 'OCT 12, 2023',
  },
  {
    id: '7',
    title: 'Apple Services',
    subtitle: '11:00 AM • Subscriptions',
    amount: '-$2.99',
    isIncome: false,
    pending: false,
    icon: Smartphone,
    iconName: 'Smartphone',
    iconBg: '#71717A',
    dateGroup: 'OCT 12, 2023',
  },
];

export default function ActivitiesScreen() {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const dateGroups = Array.from(new Set(TRANSACTIONS.map((t) => t.dateGroup)));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
          <Filter size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter pills */}
      <View style={styles.pills}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.pill, selectedFilter === filter && styles.pillActive]}
            onPress={() => setSelectedFilter(filter)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pillText,
                selectedFilter === filter && styles.pillTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction list by date */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {dateGroups.map((dateLabel) => (
          <View key={dateLabel} style={styles.dateSection}>
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            {TRANSACTIONS.filter((t) => t.dateGroup === dateLabel).map((tx) => {
              const Icon = tx.icon;
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.txRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/transaction-detail',
                      params: {
                        id: tx.id,
                        title: tx.title,
                        subtitle: tx.subtitle,
                        amount: tx.amount,
                        iconName: tx.iconName,
                        iconBg: tx.iconBg,
                        isIncome: tx.isIncome ? 'true' : 'false',
                      },
                    })
                  }
                >
                  <View
                    style={[
                      styles.txIconWrap,
                      { backgroundColor: tx.iconBg },
                      tx.iconBg === '#18181B' && styles.txIconSquare,
                    ]}
                  >
                    <Icon size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.txContent}>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txSubtitle}>{tx.subtitle}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        tx.isIncome ? styles.txAmountIncome : styles.txAmountExpense,
                      ]}
                    >
                      {tx.amount}
                    </Text>
                    {tx.pending && (
                      <View style={styles.pendingWrap}>
                        <Clock size={12} color={Colors.textSecondary} />
                        <Text style={styles.pendingText}>Pending</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0,
  },
  pills: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 20,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: Colors.inputBackground,
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  txIconSquare: {
    borderRadius: 10,
  },
  txContent: {
    flex: 1,
  },
  txTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  txSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  pendingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  txAmount: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  txAmountIncome: {
    color: Colors.primary,
  },
  txAmountExpense: {
    color: Colors.text,
  },
});
