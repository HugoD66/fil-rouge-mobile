import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useDepartements } from '@/context/geo';
import { DepartementWithGeom } from '@/services/geo';
import { registerRequest } from '@/services/auth';
import { registerDraft } from '@/store/register-draft';

function getPolygons(dept: DepartementWithGeom) {
  const { type, coordinates } = dept.coordinate.geom;
  if (type === 'Polygon') {
    return [(coordinates as number[][][])[0].map(([lng, lat]) => ({ latitude: lat, longitude: lng }))];
  }
  return (coordinates as number[][][][]).map(poly =>
    poly[0].map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
  );
}

function boundingRegion(polygons: { latitude: number; longitude: number }[][]) {
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

export default function DepartementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { departements, loading } = useDepartements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const dept = departements.find(d => d.id === id);
  const polygons = useMemo(() => (dept ? getPolygons(dept) : []), [dept]);
  const region = useMemo(() => (polygons.length > 0 ? boundingRegion(polygons) : null), [polygons]);

  async function handleValidate() {
    setError('');
    setSubmitting(true);
    try {
      await registerRequest({
        firstName: registerDraft.firstName.trim(),
        lastName: registerDraft.lastName.trim(),
        email: registerDraft.email.trim(),
        password: registerDraft.password,
      });
      registerDraft.selectedDept = null;
      router.replace('/login');
    } catch (e: any) {
      setError(e?.message ?? 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  if (!dept || !region) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Département introuvable</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={region}>
        {polygons.map((coords, i) => (
          <Polygon
            key={i}
            coordinates={coords}
            strokeColor="#15803d"
            fillColor="rgba(21,128,61,0.2)"
            strokeWidth={2}
          />
        ))}
      </MapView>

      {/* Footer — validate */}
      <View style={styles.footer}>
        {error !== '' && <Text style={styles.errorMsg}>{error}</Text>}
        <View style={styles.footerRow}>
          <Pressable
            style={({ pressed }) => [styles.circleBtn, styles.circleBtnSecondary, pressed && styles.circleBtnSecondaryPressed]}
            onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#15803d" />
          </Pressable>
          <View style={styles.footerLabel}>
            <Text style={styles.footerDept} numberOfLines={1}>{dept.zipCode} — {dept.name}</Text>
            <Text style={styles.footerHint}>Confirmer ce département</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.circleBtn, styles.circleBtnPrimary, pressed && styles.circleBtnPrimaryPressed, submitting && styles.circleBtnDisabled]}
            onPress={handleValidate}
            disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="checkmark" size={22} color="#fff" />}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 15, color: '#0f172a', marginBottom: 12 },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  circleBtnPressed: { backgroundColor: '#f1f5f9' },
  circleBtnSecondary: { backgroundColor: '#fff' },
  circleBtnSecondaryPressed: { backgroundColor: '#f1f5f9' },
  circleBtnPrimary: { backgroundColor: '#15803d' },
  circleBtnPrimaryPressed: { backgroundColor: '#166534' },
  circleBtnDisabled: { opacity: 0.5 },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  footerLabel: {
    flex: 1,
  },
  footerDept: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  footerHint: { fontSize: 12, color: '#64748b', marginTop: 1 },
  errorMsg: {
    fontSize: 13,
    color: '#d14949',
    marginBottom: 8,
    textAlign: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 2,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#15803d',
    borderRadius: 8,
  },
  backBtnText: { color: '#fff', fontWeight: '600' },
});
