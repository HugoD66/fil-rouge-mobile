import MapView from 'react-native-maps';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const WAYPOINTS = [
  { latitude: 43.71, longitude: 7.26 },   // Nice (départ)
  { latitude: 43.30, longitude: 5.37 },   // Marseille
  { latitude: 43.61, longitude: 3.88 },   // Montpellier
  { latitude: 45.19, longitude: 5.72 },   // Grenoble
  { latitude: 45.75, longitude: 4.83 },   // Lyon
  { latitude: 43.60, longitude: 1.44 },   // Toulouse
  { latitude: 44.84, longitude: -0.58 },  // Bordeaux
  { latitude: 47.22, longitude: -1.55 },  // Nantes
  { latitude: 48.86, longitude: 2.35 },   // Paris
  { latitude: 48.58, longitude: 7.75 },   // Strasbourg
];

const DELTA = 0.8;
const STEP_INTERVAL = 10000;
const FLY_DURATION = 8000;

export function MapBackground() {
  const mapRef = useRef<MapView>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % WAYPOINTS.length);
    }, STEP_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    mapRef.current?.animateToRegion(
      {
        ...WAYPOINTS[index],
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      },
      FLY_DURATION,
    );
  }, [index]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType="standard"
        initialRegion={{
          ...WAYPOINTS[0],
          latitudeDelta: DELTA,
          longitudeDelta: DELTA,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        toolbarEnabled={false}
      />
      <View style={styles.overlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
  },
});
