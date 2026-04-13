import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { ChevronLeft, Search, User } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { Keypad } from './Keypad';
import { PrimaryButton } from './PrimaryButton';
import { useTransferRecipientSearch, type TransferRecipientRow } from '../hooks/useTransferRecipientSearch';

type RequestContentProps = {
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

export function RequestContent({ onBack, compact }: RequestContentProps) {
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppUser, setSelectedAppUser] = useState<TransferRecipientRow | null>(null);
  const { results, loading, error, canSearch } = useTransferRecipientSearch(searchQuery);

  const pickAppUser = (row: TransferRecipientRow) => {
    setSelectedAppUser((prev) => (prev?.id === row.id ? null : row));
  };

  const handleKeyPress = (value: string) => {
    if (value === '.') {
      if (amount.includes('.')) return;
      setAmount((prev) => prev + value);
    } else {
      if (amount === '0') {
        setAmount(value);
      } else {
        if (amount.includes('.')) {
          const [, decimal] = amount.split('.');
          if (decimal && decimal.length >= 2) return;
        }
        setAmount((prev) => prev + value);
      }
    }
  };

  const handleDelete = () => {
    if (amount.length === 1) {
      setAmount('0');
    } else {
      setAmount((prev) => prev.slice(0, -1));
    }
  };

  const handleSendRequest = () => {
    onBack();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={compact ? 20 : 24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>Request Money</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.amountContainer, compact && styles.amountContainerCompact]}>
          <Text style={[styles.amountLabel, compact && styles.amountLabelCompact]}>AMOUNT TO REQUEST</Text>
          <Text style={[styles.amount, compact && styles.amountCompact]}>${amount}</Text>
        </View>

        <View style={[styles.searchSection, compact && styles.searchSectionCompact]}>
          <Text style={[styles.searchSectionTitle, compact && styles.searchSectionTitleCompact]}>Request from</Text>
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

        <View style={[styles.section, compact && styles.sectionCompact]}>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>Note (optional)</Text>
          <TextInput
            style={[styles.noteInput, compact && styles.noteInputCompact]}
            placeholder="What's this for?"
            placeholderTextColor={Colors.textSecondary}
            value={note}
            onChangeText={setNote}
          />
        </View>
      </ScrollView>

      <View style={[styles.keypadContainer, compact && styles.keypadContainerCompact]}>
        <Keypad onPress={handleKeyPress} onDelete={handleDelete} compact={compact} />
        <View style={[styles.footer, compact && styles.footerCompact]}>
          <PrimaryButton
            title="Send request"
            onPress={handleSendRequest}
            showArrow
            style={compact ? { paddingVertical: 12 } : undefined}
          />
        </View>
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
  headerCompact: {
    paddingVertical: 8,
    paddingHorizontal: 20,
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
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  headerTitleCompact: {
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  scrollContentCompact: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountContainerCompact: {
    marginBottom: 14,
  },
  amountLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountLabelCompact: {
    marginBottom: 4,
    fontSize: 11,
  },
  amount: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  amountCompact: {
    fontSize: 36,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchSectionCompact: {
    marginBottom: 14,
  },
  searchSectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  searchSectionTitleCompact: {
    fontSize: 13,
    marginBottom: 10,
  },
  searchContainer: {
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
  },
  searchContainerCompact: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
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
  searchInputCompact: {
    fontSize: 14,
  },
  searchHint: {
    marginBottom: 12,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  searchHintCompact: {
    marginBottom: 8,
    fontSize: 12,
  },
  searchError: {
    marginBottom: 8,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.danger,
  },
  searchResultsWrap: {
    marginBottom: 20,
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  searchResultsWrapCompact: {
    marginBottom: 14,
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
  section: {
    marginBottom: 20,
  },
  sectionCompact: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  sectionTitleCompact: {
    fontSize: 13,
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: '#F4F4F5',
    borderRadius: 16,
    padding: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.text,
  },
  noteInputCompact: {
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
  },
  keypadContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
  },
  keypadContainerCompact: {
    paddingTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  footerCompact: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
});
