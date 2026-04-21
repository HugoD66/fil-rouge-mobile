import MapboxGL from '@rnmapbox/maps';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const WAYPOINTS: [number, number][] = [
  [7.26, 43.71],   // Nice (départ)
  [5.37, 43.30],   // Marseille
  [3.88, 43.61],   // Montpellier
  [5.72, 45.19],   // Grenoble
  [4.83, 45.75],   // Lyon
  [1.44, 43.60],   // Toulouse
  [-0.58, 44.84],  // Bordeaux
  [-1.55, 47.22],  // Nantes
  [2.35, 48.86],   // Paris
  [7.75, 48.58],   // Strasbourg
];

const ZOOM = 9.5;
const FLY_DURATION = 9000;
const STEP_INTERVAL = 12000;

export function MapBackground() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % WAYPOINTS.length);
    }, STEP_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL="mapbox://styles/mapbox/light-v11"
        scrollEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        zoomEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}>
        <MapboxGL.Camera
          centerCoordinate={WAYPOINTS[index]}
          zoomLevel={ZOOM}
          animationMode="flyTo"
          animationDuration={FLY_DURATION}
        />
      </MapboxGL.MapView>
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
