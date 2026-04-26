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
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Impossible de charger les départements (${res.status})`);
  return res.json();
}

export async function fetchPersonDepartement(personId: string, token: string): Promise<DepartementWithGeom | null> {
  const res = await fetch(`${BASE_URL}/departement/${personId}/with-geom`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Impossible de charger le département (${res.status})`);
  return res.json();
}
