import { Stack } from 'expo-router';
import { SignupProvider } from '../../context/SignupContext';

export default function SignupLayout() {
  return (
    <SignupProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="ssn" />
        <Stack.Screen name="phone" />
        <Stack.Screen name="email" />
        <Stack.Screen name="password" />
        <Stack.Screen name="verify-email" />
      </Stack>
    </SignupProvider>
  );
}
