import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

const CARD_NUMBER = '4242 4242 4242 4242';
const MASKED = '••••  ••••  ••••  4242';
const EXPIRY = '12/28';
const CARDHOLDER = 'Alex Rivera';

export default function CardScreen() {
  const [showNumber, setShowNumber] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Card</Text>
        </View>

        {/* Card visual */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <CreditCard size={28} color="rgba(255,255,255,0.9)" />
            <Text style={styles.cardType}>Debit Card</Text>
          </View>
          <Text style={styles.cardNumber}>
            {showNumber ? CARD_NUMBER : MASKED}
          </Text>
          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.cardLabel}>Cardholder</Text>
              <Text style={styles.cardValue}>{CARDHOLDER}</Text>
            </View>
            <View style={styles.expiryWrap}>
              <Text style={styles.cardLabel}>Expires</Text>
              <Text style={styles.cardValue}>{EXPIRY}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setShowNumber(!showNumber)}
          activeOpacity={0.7}
        >
          {showNumber ? (
            <EyeOff size={20} color={Colors.primary} />
          ) : (
            <Eye size={20} color={Colors.primary} />
          )}
          <Text style={styles.toggleText}>
            {showNumber ? 'Hide card number' : 'Show card number'}
          </Text>
        </TouchableOpacity>

        {/* Card details list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card details</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Card number</Text>
              <Text style={styles.detailValue}>
                {showNumber ? CARD_NUMBER : MASKED}
              </Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry date</Text>
              <Text style={styles.detailValue}>{EXPIRY}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cardholder name</Text>
              <Text style={styles.detailValue}>{CARDHOLDER}</Text>
            </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
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
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardType: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.9)',
  },
  cardNumber: {
    fontSize: 22,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginVertical: 20,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  expiryWrap: {
    alignItems: 'flex-end',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    paddingVertical: 12,
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
  detailDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
