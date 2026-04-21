import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { MapBackground } from '@/components/map-background';

export default function AuthLayout() {
  return (
    <View style={styles.container}>
      <MapBackground />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
