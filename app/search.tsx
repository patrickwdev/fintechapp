import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Briefcase,
  ChevronLeft,
  Film,
  Search,
  ShoppingBag,
  Utensils,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { RECENT_ACTIVITIES, type RecentActivityItem } from '../constants/recentActivities';

const ICON_MAP = { ShoppingBag, Briefcase, Film, Utensils };

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function matchesQuery(item: RecentActivityItem, q: string) {
  if (!q) return true;
  const n = normalize(q);
  return (
    normalize(item.title).includes(n) ||
    normalize(item.subtitle).includes(n) ||
    normalize(item.amount).includes(n)
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return RECENT_ACTIVITIES;
    return RECENT_ACTIVITIES.filter((item) => matchesQuery(item, q));
  }, [query]);

  const handleBack = () => {
    Keyboard.dismiss();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.searchField}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Search transactions"
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            autoFocus
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{query.trim() ? 'RESULTS' : 'RECENT ACTIVITY'}</Text>
        {results.length === 0 ? (
          <Text style={styles.emptyText}>No transactions match “{query.trim()}”.</Text>
        ) : (
          <View style={styles.list}>
            {results.map((item) => {
              const Icon = ICON_MAP[item.iconName];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.activityItem}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({ pathname: '/transaction-detail', params: { id: item.id } })
                  }
                >
                  <View style={[styles.activityIconBg, { backgroundColor: item.iconBg }]}>
                    <Icon size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
                  </View>
                  <Text style={[styles.activityAmount, { color: item.amountColor }]}>
                    {item.amount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    padding: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  activityIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  activitySubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
