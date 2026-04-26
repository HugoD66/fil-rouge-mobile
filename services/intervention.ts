const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type InterventionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PLANNED';

export interface InterventionPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface InterventionWithGeom {
  id: string;
  name: string;
  description?: string | null;
  status: InterventionStatus;
  zipcode: string;
  coordinate: { geom: object } | null;
  technician: InterventionPerson | null;
  reporter: InterventionPerson;
  photoKeys?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchInterventionsByReporter(
  reporterId: string,
  token: string,
): Promise<InterventionWithGeom[]> {
  const res = await fetch(`${BASE_URL}/intervention/reporter/${reporterId}/with-geom`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Erreur lors du chargement des signalements (${res.status})`);
  return res.json();
}
