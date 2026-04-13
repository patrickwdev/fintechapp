import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Search,
  Send,
  Receipt,
  Plus,
  ArrowDownToLine,
  ShoppingBag,
  Briefcase,
  Film,
  Utensils,
  TrendingUp,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { RECENT_ACTIVITIES } from '../../constants/recentActivities';
import { useAccountSummary } from '../../hooks/useAccountSummary';
import { TransferContent } from '../../components/TransferContent';
import { RequestContent } from '../../components/RequestContent';
import { AddMoneyContent } from '../../components/AddMoneyContent';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.95;

const TREND = '+2.5% this month';

const ICON_MAP = { ShoppingBag, Briefcase, Film, Utensils };

export default function OverviewScreen() {
  const { displayName, balanceFormatted, loading: accountLoading, refresh: refreshAccountSummary } =
    useAccountSummary();
  const [sendPanelVisible, setSendPanelVisible] = useState(false);
  const [requestPanelVisible, setRequestPanelVisible] = useState(false);
  const [addMoneyPanelVisible, setAddMoneyPanelVisible] = useState(false);
  const [withdrawPanelVisible, setWithdrawPanelVisible] = useState(false);
  const sendSlideAnim = useRef(new Animated.Value(1)).current;
  const sendBackdropOpacity = useRef(new Animated.Value(0)).current;
  const requestSlideAnim = useRef(new Animated.Value(1)).current;
  const requestBackdropOpacity = useRef(new Animated.Value(0)).current;
  const addMoneySlideAnim = useRef(new Animated.Value(1)).current;
  const addMoneyBackdropOpacity = useRef(new Animated.Value(0)).current;
  const withdrawSlideAnim = useRef(new Animated.Value(1)).current;
  const withdrawBackdropOpacity = useRef(new Animated.Value(0)).current;

  const openSendPanel = () => setSendPanelVisible(true);
  const closeSendPanel = () => {
    Animated.parallel([
      Animated.timing(sendBackdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sendSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setSendPanelVisible(false));
  };

  const openRequestPanel = () => setRequestPanelVisible(true);
  const closeRequestPanel = () => {
    Animated.parallel([
      Animated.timing(requestBackdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(requestSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setRequestPanelVisible(false));
  };

  const openAddMoneyPanel = () => setAddMoneyPanelVisible(true);
  const closeAddMoneyPanel = () => {
    Animated.parallel([
      Animated.timing(addMoneyBackdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(addMoneySlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setAddMoneyPanelVisible(false));
  };

  const openWithdrawPanel = () => setWithdrawPanelVisible(true);
  const closeWithdrawPanel = () => {
    Animated.parallel([
      Animated.timing(withdrawBackdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(withdrawSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setWithdrawPanelVisible(false));
  };

  useEffect(() => {
    if (sendPanelVisible) {
      sendBackdropOpacity.setValue(0);
      sendSlideAnim.setValue(1);
      Animated.parallel([
        Animated.timing(sendBackdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(sendSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [sendPanelVisible]);

  useEffect(() => {
    if (requestPanelVisible) {
      requestBackdropOpacity.setValue(0);
      requestSlideAnim.setValue(1);
      Animated.parallel([
        Animated.timing(requestBackdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(requestSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [requestPanelVisible]);

  useEffect(() => {
    if (addMoneyPanelVisible) {
      addMoneyBackdropOpacity.setValue(0);
      addMoneySlideAnim.setValue(1);
      Animated.parallel([
        Animated.timing(addMoneyBackdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(addMoneySlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [addMoneyPanelVisible]);

  useEffect(() => {
    if (withdrawPanelVisible) {
      withdrawBackdropOpacity.setValue(0);
      withdrawSlideAnim.setValue(1);
      Animated.parallel([
        Animated.timing(withdrawBackdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(withdrawSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [withdrawPanelVisible]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <User size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.welcome}>WELCOME BACK</Text>
              <Text style={styles.userName}>{accountLoading ? '…' : displayName}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/search')}
          >
            <Search size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Total Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
          <Text style={styles.balanceAmount}>
            <Text style={styles.currency}>$</Text>
            {accountLoading ? '—' : balanceFormatted}
          </Text>
          <View style={styles.trendBadge}>
            <TrendingUp size={14} color="#FFFFFF" />
            <Text style={styles.trendText}>{TREND}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={openSendPanel}
          >
            <View style={styles.actionIcon}>
              <Send size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionLabel}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={openRequestPanel}
          >
            <View style={styles.actionIcon}>
              <Receipt size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionLabel}>Request</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={openAddMoneyPanel}
          >
            <View style={styles.actionIcon}>
              <Plus size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1}>
              Add Money
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={openWithdrawPanel}
          >
            <View style={styles.actionIcon}>
              <ArrowDownToLine size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionLabel} numberOfLines={1}>
              Withdraw
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Pressable onPress={() => {}} hitSlop={12}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <View style={styles.activityList}>
            {RECENT_ACTIVITIES.map((item) => {
              const Icon = ICON_MAP[item.iconName];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.activityItem}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/transaction-detail', params: { id: item.id } })}
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
        </View>
      </ScrollView>

      <Modal
        visible={sendPanelVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeSendPanel}
      >
        <View style={styles.panelWrapper}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: sendBackdropOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) },
            ]}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSendPanel} />
          <Animated.View
            style={[
              styles.slidePanel,
              {
                height: PANEL_HEIGHT,
                transform: [{ translateY: sendSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, PANEL_HEIGHT] }) }],
              },
            ]}
          >
            <SafeAreaView style={styles.slidePanelSafe} edges={['top']}>
              <TransferContent onBack={closeSendPanel} compact />
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={requestPanelVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeRequestPanel}
      >
        <View style={styles.panelWrapper}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: requestBackdropOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) },
            ]}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={closeRequestPanel} />
          <Animated.View
            style={[
              styles.slidePanel,
              {
                height: PANEL_HEIGHT,
                transform: [{ translateY: requestSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, PANEL_HEIGHT] }) }],
              },
            ]}
          >
            <SafeAreaView style={styles.slidePanelSafe} edges={['top']}>
              <RequestContent onBack={closeRequestPanel} compact />
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={addMoneyPanelVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeAddMoneyPanel}
      >
        <View style={styles.panelWrapper}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: addMoneyBackdropOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) },
            ]}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAddMoneyPanel} />
          <Animated.View
            style={[
              styles.slidePanel,
              {
                height: PANEL_HEIGHT,
                transform: [{ translateY: addMoneySlideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, PANEL_HEIGHT] }) }],
              },
            ]}
          >
            <SafeAreaView style={styles.slidePanelSafe} edges={['top']}>
              <AddMoneyContent onBack={closeAddMoneyPanel} compact onAfterAddMoney={refreshAccountSummary} />
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={withdrawPanelVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeWithdrawPanel}
      >
        <View style={styles.panelWrapper}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: withdrawBackdropOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) },
            ]}
          />
          <Pressable style={StyleSheet.absoluteFill} onPress={closeWithdrawPanel} />
          <Animated.View
            style={[
              styles.slidePanel,
              {
                height: PANEL_HEIGHT,
                transform: [{ translateY: withdrawSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, PANEL_HEIGHT] }) }],
              },
            ]}
          >
            <SafeAreaView style={styles.slidePanelSafe} edges={['top']}>
              <AddMoneyContent onBack={closeWithdrawPanel} compact variant="withdraw" />
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
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
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  balanceAmount: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  currency: {
    fontSize: 24,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingHorizontal: 0,
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    gap: 8,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  activityList: {
    gap: 12,
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
  panelWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  slidePanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  slidePanelSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
