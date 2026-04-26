import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useDepartements } from '@/context/geo';
import { DepartementWithGeom } from '@/services/geo';

const FRANCE_REGION = {
  latitude: 46.5,
  longitude: 2.5,
  latitudeDelta: 12,
  longitudeDelta: 14,
};

function getPolygons(dept: DepartementWithGeom) {
  const { type, coordinates } = dept.coordinate.geom;
  if (type === 'Polygon') {
    return [(coordinates as number[][][])[0].map(([lng, lat]) => ({ latitude: lat, longitude: lng }))];
  }
  return (coordinates as number[][][][]).map(poly =>
    poly[0].map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
  );
}

export default function MapScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { departements, loading, load } = useDepartements();

  useEffect(() => {
    if (departements.length === 0) load();
  }, []);

  const isOperator = user?.role === 'technician';

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={FRANCE_REGION}>
        {departements.map(dept =>
          getPolygons(dept).map((coords, i) => (
            <Polygon
              key={`${dept.id}-${i}`}
              coordinates={coords}
              strokeColor="#15803d"
              fillColor="rgba(21,128,61,0.15)"
              strokeWidth={1.5}
            />
          ))
        )}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#15803d" />
        </View>
      )}

      {/* Top bar — user info + logout */}
      <View style={styles.topBar}>
        <View style={styles.userBadge}>
          <Ionicons name="person-circle" size={20} color="#15803d" />
          <Text style={styles.userName} numberOfLines={1}>
            {user?.firstName} {user?.lastName}
          </Text>
          <View style={[styles.rolePill, isOperator && styles.rolePillOperator]}>
            <Text style={[styles.rolePillText, isOperator && styles.rolePillTextOperator]}>
              {isOperator ? 'Opérateur' : 'Utilisateur'}
            </Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#64748b" />
        </Pressable>
      </View>

      {/* Bottom side buttons — actions selon le rôle */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [styles.sideBtn, styles.sideBtnSecondary, pressed && styles.sideBtnSecondaryPressed]}
          onPress={() => {}}>
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
  container: { flex: 1 },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  userName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
});
