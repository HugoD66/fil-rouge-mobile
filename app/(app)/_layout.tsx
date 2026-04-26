import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/auth';

export default function AppLayout() {
  const { token } = useAuth();
  if (!token) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
