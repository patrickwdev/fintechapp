import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, ChevronDown, CreditCard, Building2 } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { Keypad } from './Keypad';
import { PrimaryButton } from './PrimaryButton';
import { usePlaidAccounts } from '../context/PlaidAccountsContext';
import { useAuth } from '../context/AuthContext';
import * as plaidApi from '../lib/plaidApi';
import { addMoneyFromBankDwolla, attachPlaidFundingSourceDwolla } from '../lib/dwollaSupabase';

type LinkedAccountRow = {
  id: string;
  name: string;
  mask: string;
  icon: typeof Building2 | typeof CreditCard;
};

type AddMoneyContentProps = {
  onBack: () => void;
  compact?: boolean;
  /** 'withdraw' reuses this flow for cash-out UI copy */
  variant?: 'add' | 'withdraw';
  /** Called after a Dwolla transfer is created (wallet updates on webhook). */
  onAfterAddMoney?: () => void | Promise<void>;
};

function maskDisplay(mask: string | null) {
  if (mask && mask.replace(/\s/g, '').length > 0) return mask.replace(/\s/g, '');
  return '0000';
}

export function AddMoneyContent({ onBack, compact, variant = 'add', onAfterAddMoney }: AddMoneyContentProps) {
  const isWithdraw = variant === 'withdraw';
  const { session } = useAuth();
  const { accounts, withdraw } = usePlaidAccounts();
  const [amount, setAmount] = useState('0');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [addingMoney, setAddingMoney] = useState(false);

  const selectableAccounts = useMemo(() => {
    if (isWithdraw) {
      return accounts.filter((a) => a.type === 'depository');
    }
    return accounts;
  }, [accounts, isWithdraw]);

  const rows: LinkedAccountRow[] = useMemo(
    () =>
      selectableAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        mask: maskDisplay(a.mask),
        icon: a.type === 'credit' ? CreditCard : Building2,
      })),
    [selectableAccounts]
  );

  useEffect(() => {
    if (!rows.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !rows.some((r) => r.id === selectedId)) {
      setSelectedId(rows[0].id);
    }
  }, [rows, selectedId]);

  const selectedAccount = rows.find((r) => r.id === selectedId) ?? null;

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

  const handleContinue = async () => {
    if (isWithdraw) {
      if (!selectedAccount) {
        Alert.alert(
          'No bank account',
          'Link a checking or savings account under Profile → Linked Banks & Cards using Plaid sandbox.'
        );
        return;
      }
      const amt = parseFloat(amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        Alert.alert('Invalid amount', 'Enter an amount greater than zero.');
        return;
      }
      setWithdrawing(true);
      try {
        const r = await withdraw(selectedAccount.id, amount);
        Alert.alert('Withdraw (sandbox)', `${r.message ?? 'Sandbox simulation — no real money moved.'}\n\nReference: ${r.reference}`);
        onBack();
      } catch (e) {
        Alert.alert('Withdraw failed', e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setWithdrawing(false);
      }
      return;
    }

    if (!selectedAccount) {
      Alert.alert(
        'No bank account',
        'Link a bank under Profile → Linked Banks & Cards (Plaid sandbox). Re-link after updating the Plaid server so Auth + Transactions are enabled for Dwolla.'
      );
      return;
    }
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert('Invalid amount', 'Enter an amount greater than zero.');
      return;
    }
    const userId = session?.user?.id;
    const accessToken = session?.access_token;
    if (!userId || !accessToken) {
      Alert.alert('Session', 'Sign in again to add money.');
      return;
    }
    const amountStr = amt.toFixed(2);
    setAddingMoney(true);
    try {
      const processorToken = await plaidApi.createDwollaProcessorToken(userId, selectedAccount.id);
      const { error: attachErr } = await attachPlaidFundingSourceDwolla(processorToken, accessToken);
      if (attachErr) {
        Alert.alert('Link bank to Dwolla', attachErr.message);
        return;
      }
      const { data: transferData, error: addErr } = await addMoneyFromBankDwolla(amountStr, accessToken);
      if (addErr) {
        Alert.alert('Add money failed', addErr.message);
        return;
      }
      await onAfterAddMoney?.();
      const credited = transferData?.walletCredited === true;
      const creditProblem = transferData?.creditError;
      Alert.alert(
        credited ? 'Balance updated' : creditProblem ? 'Transfer created' : 'Transfer started',
        [
          transferData?.message,
          `Amount: $${amountStr}`,
          credited
            ? 'Your home screen total should reflect the new balance after refresh.'
            : creditProblem
              ? `Wallet not updated automatically: ${creditProblem}`
              : 'If the balance looks unchanged, pull to refresh the home screen.',
        ]
          .filter(Boolean)
          .join('\n\n')
      );
      onBack();
    } catch (e) {
      Alert.alert('Add money failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setAddingMoney(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={compact ? 20 : 24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>
          {isWithdraw ? 'Withdraw' : 'Add Money'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.amountContainer, compact && styles.amountContainerCompact]}>
          <Text style={[styles.amountLabel, compact && styles.amountLabelCompact]}>
            {isWithdraw ? 'AMOUNT TO WITHDRAW' : 'AMOUNT TO ADD'}
          </Text>
          <Text style={[styles.amount, compact && styles.amountCompact]}>${amount}</Text>
        </View>

        <View style={[styles.section, compact && styles.sectionCompact]}>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>
            {isWithdraw ? 'To' : 'From'}
          </Text>
          <View style={styles.dropdownWrapper}>
            <Pressable
              style={[styles.dropdownTrigger, compact && styles.dropdownTriggerCompact]}
              onPress={() => (rows.length ? setPopupVisible(true) : undefined)}
            >
              <View style={[styles.dropdownIconBg, compact && styles.dropdownIconBgCompact]}>
                {selectedAccount ? (
                  React.createElement(selectedAccount.icon, { size: compact ? 18 : 20, color: Colors.text })
                ) : (
                  <Building2 size={compact ? 18 : 20} color={Colors.textSecondary} />
                )}
              </View>
              <View style={styles.dropdownLabelWrap}>
                <Text style={[styles.dropdownLabel, compact && styles.dropdownLabelCompact]} numberOfLines={1}>
                  {selectedAccount ? selectedAccount.name : isWithdraw ? 'No bank linked' : 'No account linked'}
                </Text>
                <Text style={[styles.dropdownMask, compact && styles.dropdownMaskCompact]}>
                  {selectedAccount ? `•••• ${selectedAccount.mask}` : 'Use Linked Banks to connect Plaid'}
                </Text>
              </View>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <Modal
            visible={popupVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setPopupVisible(false)}
          >
            <View style={styles.popupBackdrop}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setPopupVisible(false)} />
              <Pressable style={styles.popupCard} onPress={() => {}}>
                <View style={styles.popupHeader}>
                  <Text style={styles.popupTitle}>{isWithdraw ? 'Select destination' : 'Select source'}</Text>
                  <TouchableOpacity onPress={() => setPopupVisible(false)} hitSlop={12}>
                    <Text style={styles.popupClose}>Cancel</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.popupList} showsVerticalScrollIndicator={false}>
                  {rows.map((account, index) => {
                    const Icon = account.icon;
                    const isSelected = selectedAccount?.id === account.id;
                    const isLast = index === rows.length - 1;
                    return (
                      <TouchableOpacity
                        key={account.id}
                        style={[
                          styles.popupItem,
                        isSelected && styles.popupItemSelected,
                          isLast && styles.popupItemLast,
                        ]}
                        onPress={() => {
                          setSelectedId(account.id);
                          setPopupVisible(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.popupItemIconBg, isSelected && styles.popupItemIconBgSelected]}>
                          <Icon size={20} color={isSelected ? '#FFFFFF' : Colors.textSecondary} />
                        </View>
                        <View style={styles.popupItemText}>
                          <Text style={styles.popupItemLabel} numberOfLines={1}>
                            {account.name}
                          </Text>
                          <Text style={styles.popupItemMask}>****{account.mask}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </Pressable>
            </View>
          </Modal>
        </View>
      </ScrollView>

      <View style={[styles.keypadContainer, compact && styles.keypadContainerCompact]}>
        <Keypad onPress={handleKeyPress} onDelete={handleDelete} compact={compact} />
        <View style={[styles.footer, compact && styles.footerCompact]}>
          {withdrawing || addingMoney ? (
            <View style={{ paddingVertical: compact ? 12 : 16, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <PrimaryButton
              title={isWithdraw ? 'Withdraw funds' : 'Add to balance'}
              onPress={() => void handleContinue()}
              showArrow
              style={compact ? { paddingVertical: 12 } : undefined}
            />
          )}
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountContainerCompact: {
    marginBottom: 12,
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
  section: {
    marginBottom: 20,
  },
  sectionCompact: {
    marginBottom: 10,
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
  dropdownWrapper: {
    position: 'relative',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  dropdownTriggerCompact: {
    padding: 12,
    borderRadius: 12,
  },
  dropdownIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dropdownIconBgCompact: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  dropdownLabelWrap: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  dropdownLabelCompact: {
    fontSize: 14,
  },
  dropdownMask: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dropdownMaskCompact: {
    fontSize: 12,
  },
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popupCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '70%',
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  popupTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  popupClose: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  popupList: {
    maxHeight: 280,
  },
  popupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  popupItemLast: {
    borderBottomWidth: 0,
  },
  popupItemSelected: {
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  popupItemIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  popupItemIconBgSelected: {
    backgroundColor: Colors.primary,
  },
  popupItemText: {
    flex: 1,
  },
  popupItemLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  popupItemMask: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
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
