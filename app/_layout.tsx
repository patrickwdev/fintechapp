import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { PlaidAccountsProvider } from '../context/PlaidAccountsContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <View />;
  }

  return (
    <AuthProvider>
      <PlaidAccountsProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="transfer" />
        <Stack.Screen name="add-money" />
        <Stack.Screen name="request-money" />
        <Stack.Screen name="transaction-detail" />
        <Stack.Screen name="linked-banks-cards" />
        <Stack.Screen name="search" />
      </Stack>
      <StatusBar style="dark" />
      </PlaidAccountsProvider>
    </AuthProvider>
  );
}
