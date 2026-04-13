import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings,
  User,
  Building2,
  Shield,
  Info,
  HelpCircle,
  FileText,
  LogOut,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useAccountSummary } from '../../hooks/useAccountSummary';

const SECTION_LABEL = {
  fontSize: 11,
  fontFamily: 'Inter_600SemiBold',
  color: Colors.textSecondary,
  letterSpacing: 0.8,
  marginBottom: 10,
};

function RowItem({
  icon: Icon,
  label,
  right,
  onPress,
}: {
  icon: React.ElementType;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.rowIconWrap}>
        <Icon size={20} color={Colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
      <ChevronRight size={20} color={Colors.textSecondary} />
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const {
    displayName,
    handle,
    email,
    phoneDisplay,
    ssnMasked,
    profileCompletionPercent,
    loading,
  } = useAccountSummary();

  const handleLogout = async () => {
    await signOut();
    router.replace('/signin');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7}>
            <Settings size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Profile info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <User size={48} color="#A8A29E" />
            </View>
            <View style={styles.verifiedBadge}>
              <Check size={14} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>
          <Text style={styles.profileName}>{loading ? '…' : displayName}</Text>
          <Text style={styles.profileUsername}>{handle}</Text>
          {email ? <Text style={styles.profileDetail}>{email}</Text> : null}
          {phoneDisplay ? <Text style={styles.profileDetail}>{phoneDisplay}</Text> : null}
          {ssnMasked ? <Text style={styles.profileDetail}>SSN {ssnMasked}</Text> : null}
        </View>

        {/* Profile completion */}
        <Pressable style={styles.completionCard}>
          <View style={styles.completionTop}>
            <Text style={styles.completionText}>Profile {profileCompletionPercent}% complete</Text>
            {profileCompletionPercent < 100 ? (
              <Text style={styles.completionLink}>Finish now</Text>
            ) : (
              <Text style={styles.completionDone}>Up to date</Text>
            )}
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${profileCompletionPercent}%` }]} />
          </View>
        </Pressable>

        {/* Account Settings */}
        <Text style={SECTION_LABEL}>ACCOUNT SETTINGS</Text>
        <View style={styles.card}>
          <RowItem icon={User} label="Personal Information" onPress={() => {}} />
          <View style={styles.rowDivider} />
          <RowItem icon={Building2} label="Linked Banks & Cards" onPress={() => router.push('/linked-banks-cards')} />
        </View>

        {/* Security & Privacy */}
        <Text style={[SECTION_LABEL, { marginTop: 24 }]}>SECURITY & PRIVACY</Text>
        <View style={styles.card}>
          <RowItem
            icon={Shield}
            label="Security (FaceID & PIN)"
            right={<Text style={styles.onLabel}>ON</Text>}
            onPress={() => {}}
          />
          <View style={styles.rowDivider} />
          <RowItem icon={Info} label="Privacy & Data" onPress={() => {}} />
        </View>

        {/* Support */}
        <Text style={[SECTION_LABEL, { marginTop: 24 }]}>SUPPORT</Text>
        <View style={styles.card}>
          <RowItem icon={HelpCircle} label="Help Center" onPress={() => {}} />
          <View style={styles.rowDivider} />
          <RowItem icon={FileText} label="Terms of Service" onPress={() => {}} />
        </View>

        {/* Log Out */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <LogOut size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>App Version 4.28.1 (2024)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E7E5E4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  profileDetail: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  completionCard: {
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
  },
  completionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  completionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  completionLink: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  completionDone: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.success,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#BAE6FD',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
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
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
  },
  onLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.success,
    marginRight: 4,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 70,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 28,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.danger,
  },
  version: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
});
