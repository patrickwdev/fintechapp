import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, ActivityIndicator } from 'react-native';
import { ChevronLeft, Search, User } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { Keypad } from './Keypad';
import { PrimaryButton } from './PrimaryButton';
import { useTransferRecipientSearch, type TransferRecipientRow } from '../hooks/useTransferRecipientSearch';

const CONTACTS = [
  { id: 1, name: 'Alex', image: 'https://images.dualite.app/b8d708c9-5b19-4825-bc60-c59526b1531b/screen-52aa5dd4-934f-4255-b278-cff176ec68e3.webp' },
  { id: 2, name: 'Sarah', image: 'https://images.dualite.app/b8d708c9-5b19-4825-bc60-c59526b1531b/screen-e2cbf470-9020-4245-8148-cf3cf0737219.webp' },
  { id: 3, name: 'James', image: 'https://images.dualite.app/b8d708c9-5b19-4825-bc60-c59526b1531b/screen-d01026f0-b7d6-40c2-9877-daad6a4ec3d9.webp' },
  { id: 4, name: 'Elena', image: 'https://images.dualite.app/b8d708c9-5b19-4825-bc60-c59526b1531b/screen-d01026f0-b7d6-40c2-9877-daad6a4ec3d9.webp' },
];

type TransferContentProps = {
  onBack: () => void;
  compact?: boolean;
};

function recipientLabel(row: TransferRecipientRow) {
  const name = row.display_name?.trim();
  if (name) return name;
  if (row.email_local) return `@${row.email_local}`;
  return 'Member';
}

function recipientSubtitle(row: TransferRecipientRow) {
  if (row.email_local) return `@${row.email_local}`;
  return 'App user';
}

export function TransferContent({ onBack, compact }: TransferContentProps) {
  const [amount, setAmount] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [selectedAppUser, setSelectedAppUser] = useState<TransferRecipientRow | null>(null);
  const { results, loading, error, canSearch } = useTransferRecipientSearch(searchQuery);

  const pickMockContact = (id: number) => {
    setSelectedAppUser(null);
    setSelectedContact(selectedContact === id ? null : id);
  };

  const pickAppUser = (row: TransferRecipientRow) => {
    setSelectedContact(null);
    setSelectedAppUser((prev) => (prev?.id === row.id ? null : row));
  };

  const handleKeyPress = (value: string) => {
    if (value === '.') {
      if (amount.includes('.')) return;
      setAmount(prev => prev + value);
    } else {
      if (amount === '0') {
        setAmount(value);
      } else {
        if (amount.includes('.')) {
          const [, decimal] = amount.split('.');
          if (decimal && decimal.length >= 2) return;
        }
        setAmount(prev => prev + value);
      }
    }
  };

  const handleDelete = () => {
    if (amount.length === 1) {
      setAmount('0');
    } else {
      setAmount(prev => prev.slice(0, -1));
    }
  };

  const formatAmount = (val: string) => {
    if (val === '' || val === '0') return '0.00';
    if (!val.includes('.')) return val + '.00';
    const [int, dec] = val.split('.');
    return `${int}.${(dec || '').padEnd(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={compact ? 20 : 24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Transfer Money</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.amountContainer, compact && styles.amountContainerCompact]}>
          <Text style={[styles.amountLabel, compact && styles.amountLabelCompact]}>AMOUNT TO SEND</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.amountDollar, compact && styles.amountDollarCompact]}>$</Text>
            <Text style={[styles.amountValue, compact && styles.amountValueCompact]}>{formatAmount(amount)}</Text>
          </View>
        </View>

        <View style={[styles.searchContainer, compact && styles.searchContainerCompact]}>
          <Search size={compact ? 18 : 20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, compact && styles.searchInputCompact]}
            placeholder="Name, @username, or Email"
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              setSelectedAppUser(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {!canSearch ? (
          <Text style={[styles.searchHint, compact && styles.searchHintCompact]}>
            Sign in to search for people on the app.
          </Text>
        ) : searchQuery.trim().length > 0 && searchQuery.trim().length < 2 ? (
          <Text style={[styles.searchHint, compact && styles.searchHintCompact]}>
            Type at least 2 characters to search by name or @handle.
          </Text>
        ) : null}

        {error ? <Text style={styles.searchError}>{error}</Text> : null}

        {canSearch && searchQuery.trim().length >= 2 ? (
          <View style={[styles.searchResultsWrap, compact && styles.searchResultsWrapCompact]}>
            {loading ? (
              <View style={styles.searchLoading}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : results.length === 0 ? (
              <Text style={[styles.searchEmpty, compact && styles.searchEmptyCompact]}>No users match your search.</Text>
            ) : (
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                style={styles.searchResultsScroll}
                showsVerticalScrollIndicator={false}
              >
                {results.map((row) => {
                  const selected = selectedAppUser?.id === row.id;
                  return (
                    <TouchableOpacity
                      key={row.id}
                      style={[styles.searchResultRow, selected && styles.searchResultRowSelected]}
                      onPress={() => pickAppUser(row)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.searchResultAvatar}>
                        <User size={compact ? 18 : 20} color={Colors.primary} />
                      </View>
                      <View style={styles.searchResultText}>
                        <Text style={[styles.searchResultName, compact && styles.searchResultNameCompact]} numberOfLines={1}>
                          {recipientLabel(row)}
                        </Text>
                        <Text style={[styles.searchResultMeta, compact && styles.searchResultMetaCompact]} numberOfLines={1}>
                          {recipientSubtitle(row)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        ) : null}

        <View style={[styles.contactsSection, compact && styles.contactsSectionCompact]}>
          <View style={[styles.sectionHeader, compact && styles.sectionHeaderCompact]}>
            <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Frequent Contacts</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.seeAll, compact && styles.seeAllCompact]}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.contactsList, compact && styles.contactsListCompact]}>
            {CONTACTS.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.contactItem}
                onPress={() => setSelectedContact(selectedContact === contact.id ? null : contact.id)}
              >
                <View style={[styles.avatarContainer, selectedContact === contact.id && styles.selectedAvatar, compact && styles.avatarContainerCompact]}>
                  <Image source={{ uri: contact.image }} style={[styles.avatar, compact && styles.avatarCompact]} />
                </View>
                <Text style={[styles.contactName, compact && styles.contactNameCompact]}>{contact.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.keypadSection, compact && styles.keypadSectionCompact]}>
          <Keypad onPress={handleKeyPress} onDelete={handleDelete} compact={compact} />
        </View>
      </ScrollView>

      <View style={[styles.footer, compact && styles.footerCompact]}>
        <PrimaryButton title="Continue" onPress={() => {}} showArrow style={compact ? { paddingVertical: 12 } : undefined} />
      </View>
    </View>
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
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  amountContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 28,
  },
  amountLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountDollar: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
    marginRight: 2,
  },
  amountValue: {
    fontSize: 56,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  searchContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.text,
  },
  searchHint: {
    marginHorizontal: 24,
    marginTop: -12,
    marginBottom: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  searchHintCompact: {
    marginHorizontal: 20,
    marginTop: -8,
    marginBottom: 8,
    fontSize: 12,
  },
  searchError: {
    marginHorizontal: 24,
    marginBottom: 8,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.danger,
  },
  searchResultsWrap: {
    marginHorizontal: 24,
    marginBottom: 16,
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  searchResultsWrapCompact: {
    marginHorizontal: 20,
    marginBottom: 12,
    maxHeight: 160,
    borderRadius: 10,
  },
  searchResultsScroll: {
    maxHeight: 200,
  },
  searchLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchEmpty: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  searchEmptyCompact: {
    paddingVertical: 12,
    fontSize: 13,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  searchResultRowSelected: {
    backgroundColor: '#E0F2FE',
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchResultText: {
    flex: 1,
    minWidth: 0,
  },
  searchResultName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  searchResultNameCompact: {
    fontSize: 14,
  },
  searchResultMeta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchResultMetaCompact: {
    fontSize: 12,
  },
  contactsSection: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  contactsList: {
    paddingHorizontal: 24,
    gap: 24,
  },
  contactItem: {
    alignItems: 'center',
    gap: 8,
  },
  avatarContainer: {
    padding: 2,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  selectedAvatar: {
    borderColor: Colors.primary,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E4E4E7',
  },
  contactName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  keypadSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingBottom: 20,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  // Compact (panel) styles
  headerCompact: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  headerTitleCompact: {
    fontSize: 16,
  },
  scrollContentCompact: {
    paddingBottom: 12,
  },
  amountContainerCompact: {
    marginTop: 12,
    marginBottom: 14,
  },
  amountLabelCompact: {
    marginBottom: 4,
    fontSize: 11,
  },
  amountDollarCompact: {
    fontSize: 28,
    marginRight: 2,
  },
  amountValueCompact: {
    fontSize: 40,
  },
  searchContainerCompact: {
    height: 44,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  searchInputCompact: {
    fontSize: 14,
  },
  contactsSectionCompact: {
    marginBottom: 0,
  },
  sectionHeaderCompact: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitleCompact: {
    fontSize: 14,
  },
  seeAllCompact: {
    fontSize: 13,
  },
  contactsListCompact: {
    paddingHorizontal: 20,
    gap: 16,
  },
  avatarContainerCompact: {
    borderRadius: 28,
  },
  avatarCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  contactNameCompact: {
    fontSize: 12,
  },
  keypadSectionCompact: {
    paddingTop: 12,
    paddingBottom: 12,
    marginTop: 4,
  },
  footerCompact: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 10,
  },
});
