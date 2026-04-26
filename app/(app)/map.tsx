import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { registerDraft, DraftRegion } from '@/store/register-draft';
import { DepartementWithGeom, fetchPersonDepartement } from '@/services/geo';
import { updatePerson, fetchOwnerByZipCode, PersonItem } from '@/services/person';
import { fetchInterventionsByReporter, InterventionWithGeom, InterventionStatus } from '@/services/intervention';
import * as ImagePicker from 'expo-image-picker';

const FRANCE_REGION: DraftRegion = {
  latitude: 46.5,
  longitude: 2.5,
  latitudeDelta: 12,
  longitudeDelta: 14,
};

function getDeptPolygons(dept: DepartementWithGeom) {
  const { type, coordinates } = dept.coordinate.geom;
  if (type === 'Polygon') {
    return [(coordinates as number[][][])[0].map(([lng, lat]) => ({ latitude: lat, longitude: lng }))];
  }
  return (coordinates as number[][][][]).map(poly =>
    poly[0].map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
  );
}

const STATUS_COLORS: Record<InterventionStatus, string> = {
  PENDING:     '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  COMPLETED:   '#15803d',
  CANCELLED:   '#dc2626',
  PLANNED:     '#8b5cf6',
};

function getInterventionCoord(item: InterventionWithGeom): { latitude: number; longitude: number } | null {
  if (!item.coordinate?.geom) return null;
  const geom = item.coordinate.geom as { type: string; coordinates: number[] };
  if (geom.type !== 'Point' || !geom.coordinates) return null;
  return { longitude: geom.coordinates[0], latitude: geom.coordinates[1] };
}

function regionFromPolygons(polygons: { latitude: number; longitude: number }[][]): DraftRegion {
  const all = polygons.flat();
  const lats = all.map(p => p.latitude);
  const lngs = all.map(p => p.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.05),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.05),
  };
}

export default function MapScreen() {
  const { user, token, logout, updateUser } = useAuth();
  const router = useRouter();

  const fromRegistration = registerDraft.selectedDept !== null;

  const [activeDept, setActiveDept] = useState<DepartementWithGeom | null>(registerDraft.selectedDept);
  const [mapRegion, setMapRegion] = useState<DraftRegion>(registerDraft.selectedRegion ?? FRANCE_REGION);
  const [fetching, setFetching] = useState(!fromRegistration);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [crownOpen, setCrownOpen] = useState(false);
  const [crownOwners, setCrownOwners] = useState<PersonItem[]>([]);
  const [crownTotal, setCrownTotal] = useState(0);
  const [crownLoading, setCrownLoading] = useState(false);
  const [signalementsOpen, setSignalementsOpen] = useState(false);
  const [signalements, setSignalements] = useState<InterventionWithGeom[]>([]);
  const [signalementsLoading, setSignalementsLoading] = useState(false);
  const sheetY = useSharedValue(600);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));
  const [snack, setSnack] = useState<{ message: string; success: boolean } | null>(null);
  const snackY = useSharedValue(80);
  const snackStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: snackY.value }],
    opacity: snackY.value < 80 ? 1 : 0,
  }));

  const gearRotation = useSharedValue(0);
  const btn1Progress = useSharedValue(0);
  const btn2Progress = useSharedValue(0);
  const btn3Progress = useSharedValue(0);

  const gearStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${gearRotation.value}deg` }],
  }));
  const btn1Style = useAnimatedStyle(() => ({
    opacity: btn1Progress.value,
    transform: [{ translateY: (1 - btn1Progress.value) * -16 }],
  }));
  const btn2Style = useAnimatedStyle(() => ({
    opacity: btn2Progress.value,
    transform: [{ translateY: (1 - btn2Progress.value) * -16 }],
  }));
  const btn3Style = useAnimatedStyle(() => ({
    opacity: btn3Progress.value,
    transform: [{ translateY: (1 - btn3Progress.value) * -16 }],
  }));

  function toggleSettings() {
    const next = !settingsOpen;
    gearRotation.value = withTiming(next ? 90 : 0, { duration: 250 });
    if (next) {
      btn1Progress.value = 0;
      btn2Progress.value = 0;
      btn3Progress.value = 0;
      setSettingsOpen(true);
      btn1Progress.value = withTiming(1, { duration: 200 });
      btn2Progress.value = withDelay(70, withTiming(1, { duration: 200 }));
      btn3Progress.value = withDelay(140, withTiming(1, { duration: 200 }));
    } else {
      btn1Progress.value = withTiming(0, { duration: 150 });
      btn2Progress.value = withTiming(0, { duration: 150 });
      btn3Progress.value = withTiming(0, { duration: 150 });
      setTimeout(() => setSettingsOpen(false), 150);
    }
  }

  useEffect(() => {
    if (fromRegistration || !user || !token) {
      setFetching(false);
      return;
    }
    fetchPersonDepartement(user.id, token)
      .then(dept => {
        if (!dept) return;
        setActiveDept(dept);
        setMapRegion(regionFromPolygons(getDeptPolygons(dept)));
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const isOperator = user?.role === 'technician';

  function showSnack(message: string, success: boolean) {
    setSnack({ message, success });
    snackY.value = 80;
    snackY.value = withTiming(0, { duration: 300 }, () => {
      snackY.value = withDelay(2500, withTiming(80, { duration: 300 }, () => {
        runOnJS(setSnack)(null);
      }));
    });
  }

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setFormError('Permission d\'accès à la galerie refusée.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function openSignalements() {
    setSignalements([]);
    setSignalementsOpen(true);
    sheetY.value = 600;
    sheetY.value = withTiming(0, { duration: 350 });
    if (!user || !token) return;
    setSignalementsLoading(true);
    try {
      const data = await fetchInterventionsByReporter(user.id, token);
      setSignalements(data);
    } catch {
      setSignalements([]);
    } finally {
      setSignalementsLoading(false);
    }
  }

  function closeSignalements() {
    sheetY.value = withTiming(600, { duration: 300 }, () => {
      runOnJS(setSignalementsOpen)(false);
    });
  }

  async function openCrown() {
    setSettingsOpen(false);
    gearRotation.value = withTiming(0, { duration: 250 });
    setCrownOwners([]);
    setCrownTotal(0);
    setCrownOpen(true);
    if (!activeDept?.zipCode || !token) return;
    setCrownLoading(true);
    try {
      const result = await fetchOwnerByZipCode(activeDept.zipCode, token);
      setCrownOwners(result.items);
      setCrownTotal(result.total);
    } catch {
      setCrownOwners([]);
    } finally {
      setCrownLoading(false);
    }
  }

  function openProfile() {
    setFormFirstName(user?.firstName ?? '');
    setFormLastName(user?.lastName ?? '');
    setFormEmail(user?.email ?? '');
    setFormAddress(user?.address ?? '');
    setAvatarUri(null);
    setFormError('');
    setProfileOpen(true);
    setSettingsOpen(false);
    gearRotation.value = withTiming(0, { duration: 250 });
  }

  async function handleSaveProfile() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formFirstName.trim().length < 2) {
      setFormError('Le prénom doit contenir au moins 2 caractères.');
      return;
    }
    if (formLastName.trim().length < 2) {
      setFormError('Le nom doit contenir au moins 2 caractères.');
      return;
    }
    if (!emailRegex.test(formEmail.trim())) {
      setFormError('Adresse e-mail invalide.');
      return;
    }
    if (formAddress.trim().length > 0 && formAddress.trim().length < 2) {
      setFormError('L\'adresse doit contenir au moins 2 caractères.');
      return;
    }
    setFormError('');
    setFormSaving(true);
    try {
      const payload: Record<string, string> = {
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        email: formEmail.trim(),
      };
      if (formAddress.trim().length > 0) payload.address = formAddress.trim();
      await updatePerson(user!.id, token!, payload);
      updateUser({
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        email: formEmail.trim(),
        ...(formAddress.trim().length > 0 ? { address: formAddress.trim() } : {}),
      });
      setProfileOpen(false);
      showSnack('Profil mis à jour avec succès', true);
    } catch (e: any) {
      setFormError(e?.message ?? 'Une erreur est survenue.');
      setProfileOpen(false);
      showSnack(e?.message ?? 'Erreur lors de la mise à jour', false);
    } finally {
      setFormSaving(false);
    }
  }

  async function handleLogout() {
    registerDraft.selectedDept = null;
    registerDraft.selectedRegion = null;
    await logout();
    router.replace('/login');
  }

  if (fetching) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={mapRegion}>
        {activeDept && getDeptPolygons(activeDept).map((coords, i) => (
          <Polygon
            key={i}
            coordinates={coords}
            strokeColor="#15803d"
            fillColor="rgba(21,128,61,0.15)"
            strokeWidth={1.5}
          />
        ))}
        {signalements.map(item => {
          const coord = getInterventionCoord(item);
          if (!coord) return null;
          return (
            <Marker
              key={item.id}
              coordinate={coord}
              pinColor={STATUS_COLORS[item.status]}
              title={item.name}
            />
          );
        })}
      </MapView>

      {/* Top bar — logo + user badge */}
      <View style={styles.topBar}>
        <Image
          source={require('@/assets/images/logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.topBarSpacer} />

        {/* Settings trigger */}
        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          onPress={toggleSettings}>
          <Animated.View style={gearStyle}>
            <Ionicons name="settings-outline" size={22} color="#64748b" />
          </Animated.View>
        </Pressable>
      </View>

      {/* Settings panel — s'ouvre verticalement sous le bouton */}
      {settingsOpen && (
        <View style={styles.settingsPanel}>
          <Animated.View style={btn1Style}>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#64748b" />
            </Pressable>
          </Animated.View>
          <Animated.View style={btn2Style}>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              onPress={openProfile}>
              <Ionicons name="person-outline" size={20} color="#64748b" />
            </Pressable>
          </Animated.View>
          <Animated.View style={btn3Style}>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              onPress={openCrown}>
              <MaterialCommunityIcons name="crown" size={20} color="#64748b" />
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* Modal profil — formulaire d'update */}
      <Modal
        visible={profileOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalOverlayInner} onPress={() => setProfileOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Pressable onPress={pickAvatar} style={styles.avatarBtn}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                    ) : (
                      <Ionicons name="person-circle" size={72} color="#15803d" />
                    )}
                    <View style={styles.avatarEditBadge}>
                      <Ionicons name="camera" size={12} color="#fff" />
                    </View>
                  </Pressable>
                  <Text style={styles.modalTitle}>Mon profil</Text>
                  <View style={[styles.rolePill, isOperator && styles.rolePillOperator]}>
                    <Text style={[styles.rolePillText, isOperator && styles.rolePillTextOperator]}>
                      {isOperator ? 'Opérateur' : 'Utilisateur'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Prénom</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formFirstName}
                      onChangeText={setFormFirstName}
                      autoCapitalize="words"
                      placeholder="Jean"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Nom</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formLastName}
                      onChangeText={setFormLastName}
                      autoCapitalize="words"
                      placeholder="Dupont"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>E-mail</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formEmail}
                    onChangeText={setFormEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="vous@exemple.fr"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Adresse <Text style={styles.formLabelOptional}>(optionnel)</Text></Text>
                  <TextInput
                    style={styles.formInput}
                    value={formAddress}
                    onChangeText={setFormAddress}
                    autoCapitalize="words"
                    placeholder="25 rue Chartron"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {formError !== '' && <Text style={styles.formError}>{formError}</Text>}

                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [styles.modalCancelBtn, pressed && styles.modalCancelBtnPressed]}
                    onPress={() => setProfileOpen(false)}>
                    <Text style={styles.modalCancelBtnText}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.modalSaveBtn, pressed && styles.modalSaveBtnPressed, formSaving && { opacity: 0.6 }]}
                    onPress={handleSaveProfile}
                    disabled={formSaving}>
                    {formSaving
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.modalSaveBtnText}>Enregistrer</Text>}
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal couronne — propriétaire du département */}
      <Modal
        visible={crownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCrownOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCrownOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="crown" size={40} color="#f59e0b" />
              <Text style={styles.modalTitle}>Propriétaire du département</Text>
              {activeDept && (
                <Text style={styles.crownDeptLabel}>{activeDept.zipCode} — {activeDept.name}</Text>
              )}
            </View>

            <View style={styles.modalDivider} />

            {crownLoading ? (
              <ActivityIndicator size="large" color="#15803d" style={{ marginVertical: 24 }} />
            ) : crownOwners.length === 0 ? (
              <Text style={styles.crownEmpty}>Aucun propriétaire trouvé pour ce département.</Text>
            ) : (
              <>
                <Text style={styles.crownCount}>{crownTotal} propriétaire{crownTotal > 1 ? 's' : ''}</Text>
                {crownOwners.map(owner => (
                  <View key={owner.id} style={styles.crownOwnerRow}>
                    <Ionicons name="person-circle" size={36} color="#15803d" />
                    <View style={styles.crownOwnerInfo}>
                      <Text style={styles.crownOwnerName}>{owner.firstName} {owner.lastName}</Text>
                      <Text style={styles.crownOwnerEmail}>{owner.email}</Text>
                      {owner.address && (
                        <Text style={styles.crownOwnerAddress}>{owner.address}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </>
            )}

            <Pressable
              style={({ pressed }) => [styles.modalCancelBtn, { marginTop: 16 }, pressed && styles.modalCancelBtnPressed]}
              onPress={() => setCrownOpen(false)}>
              <Text style={styles.modalCancelBtnText}>Fermer</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bottom sheet — Mes signalements */}
      {signalementsOpen && (
        <Pressable style={styles.sheetOverlay} onPress={closeSignalements}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <Pressable onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Mes signalements</Text>
              <View style={styles.sheetDivider} />

              {signalementsLoading ? (
                <ActivityIndicator size="large" color="#15803d" style={{ marginVertical: 32 }} />
              ) : signalements.length === 0 ? (
                <Text style={styles.sheetEmpty}>Aucun signalement pour l'instant.</Text>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
                  {signalements.map(item => (
                    <View key={item.id} style={styles.sheetItem}>
                      <Ionicons name="alert-circle-outline" size={18} color="#15803d" />
                      <Text style={styles.sheetItemText} numberOfLines={2}>{item.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      )}

      {/* Snackbar */}
      {snack && (
        <Animated.View style={[styles.snack, snack.success ? styles.snackSuccess : styles.snackError, snackStyle]}>
          <Ionicons name={snack.success ? 'checkmark-circle' : 'alert-circle'} size={18} color="#fff" />
          <Text style={styles.snackText}>{snack.message}</Text>
        </Animated.View>
      )}

      {/* Bottom side buttons — actions selon le rôle */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.sideBtn, styles.sideBtnSecondary, pressed && styles.sideBtnSecondaryPressed]}
          onPress={openSignalements}>
          <Ionicons name="list-outline" size={20} color="#15803d" />
          <Text style={styles.sideBtnSecondaryText}>
            {isOperator ? 'Interventions' : 'Mes signalements'}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.sideBtn, styles.sideBtnPrimary, pressed && styles.sideBtnPrimaryPressed]}
          onPress={() => {}}>
          <Ionicons
            name={isOperator ? 'checkmark-circle-outline' : 'add-circle-outline'}
            size={20}
            color="#fff"
          />
          <Text style={styles.sideBtnPrimaryText}>
            {isOperator ? 'Mes missions' : 'Signaler'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  container: { flex: 1 },
  map: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 58,
    height: 58,
  },
  topBarSpacer: {
    flex: 1,
  },
  rolePill: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rolePillOperator: {
    backgroundColor: '#eff6ff',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
  },
  rolePillTextOperator: {
    color: '#2563eb',
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  iconBtnPressed: { backgroundColor: '#f1f5f9' },
  settingsPanel: {
    position: 'absolute',
    top: 56 + 58 + 4,
    right: 16,
    alignItems: 'center',
    gap: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  sideBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  sideBtnSecondary: { backgroundColor: '#fff' },
  sideBtnSecondaryPressed: { backgroundColor: '#f1f5f9' },
  sideBtnPrimary: { backgroundColor: '#15803d' },
  sideBtnPrimaryPressed: { backgroundColor: '#166534' },
  sideBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },
  sideBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlayInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '88%',
    maxWidth: 380,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  avatarBtn: {
    position: 'relative',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  formLabelOptional: {
    fontWeight: '400',
    color: '#94a3b8',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  formError: {
    fontSize: 12,
    color: '#d14949',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalCancelBtnPressed: { backgroundColor: '#e2e8f0' },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalSaveBtnPressed: { backgroundColor: '#166534' },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '60%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  sheetEmpty: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginVertical: 32,
  },
  sheetScroll: {
    maxHeight: 300,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  crownDeptLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  crownEmpty: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginVertical: 20,
  },
  crownCount: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 12,
  },
  crownOwnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  crownOwnerInfo: {
    flex: 1,
  },
  crownOwnerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  crownOwnerEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 1,
  },
  crownOwnerAddress: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  snack: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  snackSuccess: { backgroundColor: '#15803d' },
  snackError: { backgroundColor: '#dc2626' },
  snackText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});
