import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Image source={require('@/assets/images/logo-transparent.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.heading}>Connexion</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Adresse e-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="vous@exemple.fr"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputWithIcon}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
            <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
            </Pressable>
          </View>
        </View>

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Se connecter</Text>}
        </Pressable>

      </View>

      <Link href="/register" asChild>
        <Pressable style={styles.footer}>
          <Text style={styles.footerText}>
            Pas encore inscrit ?{' '}
            <Text style={styles.footerLink}>Créer un compte</Text>
          </Text>
        </Pressable>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  error: {
    fontSize: 12,
    color: '#d14949',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    backgroundColor: '#166534',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: '10%',
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#64748b',
  },
  footerLink: {
    color: '#15803d',
    fontWeight: '600',
  },
});
