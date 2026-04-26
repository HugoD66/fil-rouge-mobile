const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    address: string | null;
    role: 'user' | 'technician';
    avatarKey: string | null;
  };
  organization: {
    id: string;
    city: string;
    zipCode: string;
  } | null;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/security/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? 'Identifiants invalides');
  }

  return res.json();
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  zipCode?: string;
  organizationId?: string;
}

export async function registerRequest(payload: RegisterPayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/security/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? 'Erreur lors de l\'inscription');
  }
}

export async function logoutRequest(token: string): Promise<void> {
  await fetch(`${BASE_URL}/security/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}
