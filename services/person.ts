const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface UpdatePersonPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  address?: string;
}

export interface PersonItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string | null;
  role: 'user' | 'technician';
  avatarKey: string | null;
}

export interface PersonSearchResult {
  items: PersonItem[];
  total: number;
  emptyCode?: 'NO_PERSON_MATCH' | null;
}

export async function fetchOwnerByZipCode(
  zipCode: string,
  token: string,
): Promise<PersonSearchResult> {
  const res = await fetch(`${BASE_URL}/person/owner-by-zip-code?zipCode=${encodeURIComponent(zipCode)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Erreur lors de la recherche du propriétaire (${res.status})`);
  return res.json();
}

export async function updatePerson(
  personId: string,
  token: string,
  payload: UpdatePersonPayload,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/person/${personId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? 'Erreur lors de la mise à jour');
  }
}
