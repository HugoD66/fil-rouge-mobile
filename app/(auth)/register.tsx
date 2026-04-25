import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDepartements } from '@/context/geo';
import { DepartementWithGeom } from '@/services/geo';
import { registerDraft as draft } from '@/store/register-draft';

export default function RegisterScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { departements, load: loadDepartements } = useDepartements();

  const [step, setStep] = useState<1 | 2>(1);
  const [showStep1, setShowStep1] = useState(true);

  const [firstName, setFirstNameState] = useState(draft.firstName);
  const [lastName, setLastNameState] = useState(draft.lastName);
  const [email, setEmailState] = useState(draft.email);
  const [password, setPasswordState] = useState(draft.password);
  const [selected, setSelected] = useState<DepartementWithGeom | null>(draft.selectedDept);
  const [showPassword, setShowPassword] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function setFirstName(v: string) { draft.firstName = v; setFirstNameState(v); }
  function setLastName(v: string) { draft.lastName = v; setLastNameState(v); }
  function setEmail(v: string) { draft.email = v; setEmailState(v); }
  function setPassword(v: string) { draft.password = v; setPasswordState(v); }

  const step1Opacity = useSharedValue(1);
  const step2Opacity = useSharedValue(0);
  const step2TranslateY = useSharedValue(40);
  const wrapPaddingTop = useSharedValue(height * 0.25);

  const step1Style = useAnimatedStyle(() => ({
    opacity: step1Opacity.value,
  }));

  const step2Style = useAnimatedStyle(() => ({
    opacity: step2Opacity.value,
    transform: [{ translateY: step2TranslateY.value }],
  }));

  const wrapStyle = useAnimatedStyle(() => ({
    paddingTop: wrapPaddingTop.value,
  }));

  function handleNext() {
    setError('');
    setStep(2);
    if (departements.length === 0) loadDepartements();

    step1Opacity.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setShowStep1)(false);
    });

    step2Opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    step2TranslateY.value = withDelay(200, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
    wrapPaddingTop.value = withTiming(60, { duration: 450, easing: Easing.out(Easing.cubic) });
  }

  function handleBack() {
    setError('');
    setStep(1);

    step2Opacity.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
    step2TranslateY.value = withTiming(40, { duration: 250, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) {
        step1Opacity.value = 0;
        runOnJS(setShowStep1)(true);
        step1Opacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
      }
    });
    wrapPaddingTop.value = withTiming(height * 0.25, { duration: 400, easing: Easing.out(Easing.cubic) });
  }

  async function handleRegister() {
    if (!selected) {
      setError('Veuillez sélectionner un département.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await registerRequest({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      router.replace('/login');
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={step === 2}>

        <Animated.View style={[styles.scrollWrap, wrapStyle]}>
        {showStep1 && (
          <Animated.View style={[{ width: '100%' }, step1Style]}>
            <View style={styles.card}>

              <Image source={require('@/assets/images/logo-transparent.png')} style={styles.logo} resizeMode="contain" />

              <Text style={styles.heading}>Créer un compte</Text>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Prénom</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Jean"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="words"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Nom</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Dupont"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="words"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

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
                    autoComplete="new-password"
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={handleNext}
                    returnKeyType="next"
                  />
                  <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>

              {error !== '' && <Text style={styles.error}>{error}</Text>}

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={handleNext}>
                <Text style={styles.buttonText}>Continuer →</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Étape 2 — select */}
        <Animated.View style={[styles.step2, step2Style]} pointerEvents={step === 1 ? 'none' : 'auto'}>
          <View style={styles.selectRow}>
            <Pressable
              style={({ pressed }) => [styles.iconButton, styles.iconButtonSecondary, pressed && styles.iconButtonSecondaryPressed]}
              onPress={handleBack}>
              <Ionicons name="chevron-back" size={22} color="#15803d" />
            </Pressable>

            <View style={styles.selectWrap}>
              <Pressable
                style={styles.selectTrigger}
                onPress={() => setSelectOpen((o) => !o)}>
                <Text style={selected ? styles.selectValue : styles.selectPlaceholder} numberOfLines={1}>
                  {selected ? `${selected.zipCode} — ${selected.name}` : 'Sélectionner un département'}
                </Text>
                <Text style={styles.selectChevron}>{selectOpen ? '▲' : '▼'}</Text>
              </Pressable>
            </View>

            <Modal
              visible={selectOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setSelectOpen(false)}>
              <Pressable style={styles.modalOverlay} onPress={() => setSelectOpen(false)}>
                <View style={styles.modalSheet}>
                  <Text style={styles.modalTitle}>Choisir un département</Text>
                  <FlatList
                    data={departements}
                    keyExtractor={(d) => d.id}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item: dept }) => (
                      <Pressable
                        style={({ pressed }) => [
                          styles.selectOption,
                          selected?.id === dept.id && styles.selectOptionActive,
                          pressed && styles.selectOptionPressed,
                        ]}
                        onPress={() => {
                          draft.selectedDept = dept;
                          setSelected(dept);
                          setSelectOpen(false);
                          router.push(`/departement/${dept.id}`);
                        }}>
                        <Text style={[styles.selectOptionText, selected?.id === dept.id && styles.selectOptionTextActive]}>
                          {dept.zipCode} — {dept.name}
                        </Text>
                      </Pressable>
                    )}
                  />
                </View>
              </Pressable>
            </Modal>

            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="checkmark" size={22} color="#fff" />}
            </Pressable>
          </View>

          {error !== '' && <Text style={[styles.error, { marginTop: 8 }]}>{error}</Text>}
        </Animated.View>

        </Animated.View>
      </ScrollView>

      <Link href="/login" asChild>
        <Pressable style={styles.footer}>
          <Text style={styles.footerText}>
            Déjà inscrit ?{' '}
            <Text style={styles.footerLink}>Se connecter</Text>
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
  },
  scroll: {
    flexGrow: 1,
  },
  scrollWrap: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
    width: '100%',
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
  row: {
    flexDirection: 'row',
    gap: 12,
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
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
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
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonOutlinePressed: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  buttonOutlineText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Étape 2
  step2: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    marginTop: 12,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectWrap: {
    flex: 1,
    position: 'relative',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: '#166534',
  },
  iconButtonSecondary: {
    backgroundColor: '#fff',
  },
  iconButtonSecondaryPressed: {
    backgroundColor: '#f1f5f9',
  },
  selectTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  selectValue: {
    fontSize: 16,
    color: '#0f172a',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#94a3b8',
  },
  selectChevron: {
    fontSize: 11,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  selectOptionActive: {
    backgroundColor: '#f0fdf4',
  },
  selectOptionPressed: {
    backgroundColor: '#f8fafc',
  },
  selectOptionText: {
    fontSize: 15,
    color: '#0f172a',
  },
  selectOptionTextActive: {
    color: '#15803d',
    fontWeight: '600',
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
