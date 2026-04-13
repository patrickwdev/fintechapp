import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';

const SPLASH_DURATION_MS = 1500;

export default function IndexScreen() {
  const { isLoggedIn, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;

    if (isLoggedIn) {
      router.replace('/(tabs)');
      return;
    }

    const t = setTimeout(() => {
      router.replace('/signin');
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [isHydrated, isLoggedIn]);

  if (!isHydrated) {
    return null;
  }

  if (isLoggedIn) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brandName}>
        <Text style={styles.brandFin}>FIN</Text>
        <Text style={styles.brandTech}>TECH</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  brandFin: {
    color: Colors.text,
  },
  brandTech: {
    color: Colors.primary,
  },
});
