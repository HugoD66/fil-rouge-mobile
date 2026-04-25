const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface DepartementGeom {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export interface DepartementWithGeom {
  id: string;
  zipCode: string;
  name: string;
  coordinate: {
    geom: DepartementGeom;
  };
}

export async function fetchDepartements(): Promise<DepartementWithGeom[]> {
  const url = `${BASE_URL}/departement/with-geom`;
  console.log('[Geo] fetch →', url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Impossible de charger les départements (${res.status})`);
  }
  return res.json();
}
