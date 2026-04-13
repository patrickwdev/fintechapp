import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Building2, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { usePlaidAccounts } from '../context/PlaidAccountsContext';

const SECTION_LABEL = {
  fontSize: 11,
  fontFamily: 'Inter_600SemiBold',
  color: Colors.textSecondary,
  letterSpacing: 0.8,
  marginBottom: 10,
};

export default function LinkedBanksCardsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { accounts, loading, error, startLink, linkStarting } = usePlaidAccounts();
  const [isLinkPanelVisible, setIsLinkPanelVisible] = useState(false);

  const bankAccounts = accounts.filter((a) => a.type === 'depository');

  const handleLinkBankAccount = () => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Sign in to link a bank with Plaid sandbox.');
      return;
    }
    setIsLinkPanelVisible(false);
    void startLink();
  };

  const handleLinkCard = () => {
    setIsLinkPanelVisible(false);
    Alert.alert('Coming soon', 'Card linking is not enabled yet. Please link a bank account for now.');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, right: 12, left: 12 }}
        >
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} pointerEvents="none">
          Linked Banks & Cards
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={SECTION_LABEL}>BANK ACCOUNTS (PLAID SANDBOX)</Text>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
        <View style={styles.card}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : bankAccounts.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No accounts linked yet. Tap below to open Plaid Link.</Text>
            </View>
          ) : (
            bankAccounts.map((bank, index) => (
              <React.Fragment key={bank.id}>
                {index > 0 && <View style={styles.rowDivider} />}
                <View style={styles.row}>
                  <View style={styles.rowIconWrap}>
                    <Building2 size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowTitle}>
                      {bank.name} {bank.mask ? `•••• ${bank.mask}` : ''}
                    </Text>
                    <Text style={styles.rowSubtitle}>
                      {[bank.subtype, bank.type].filter(Boolean).join(' · ') || 'Account'}
                    </Text>
                  </View>
                </View>
              </React.Fragment>
            ))
          )}
        </View>

        <Text style={[SECTION_LABEL, { marginTop: 24 }]}>DEBIT CARDS</Text>
        <View style={styles.card}>
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>Card linking is not enabled. Use bank accounts via Plaid above.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsLinkPanelVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Link bank or card</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isLinkPanelVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLinkPanelVisible(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setIsLinkPanelVisible(false)}>
          <Pressable style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.sheetTitle}>Choose link type</Text>
            <TouchableOpacity
              style={[styles.sheetOptionButton, linkStarting && styles.sheetOptionButtonDisabled]}
              onPress={handleLinkBankAccount}
              activeOpacity={0.8}
              disabled={linkStarting}
            >
              {linkStarting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : null}
              <Text style={styles.sheetOptionButtonText}>
                {linkStarting ? 'Opening Plaid…' : 'Link bank account'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetSecondaryButton} onPress={handleLinkCard} activeOpacity={0.8}>
              <Text style={styles.sheetSecondaryButtonText}>Link card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetCancelButton}
              onPress={() => setIsLinkPanelVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  headerSpacer: { width: 40 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 70,
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#B91C1C',
    marginBottom: 8,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 6,
  },
  sheetOptionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sheetOptionButtonDisabled: {
    opacity: 0.85,
  },
  sheetOptionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  sheetSecondaryButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSecondaryButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  sheetCancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
