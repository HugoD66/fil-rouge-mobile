import React, { createContext, useContext, useState } from 'react';
import { fetchDepartements, DepartementWithGeom } from '@/services/geo';

interface GeoContextValue {
  departements: DepartementWithGeom[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
}

const GeoContext = createContext<GeoContextValue | null>(null);

export function GeoProvider({ children }: { children: React.ReactNode }) {
  const [departements, setDepartements] = useState<DepartementWithGeom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDepartements();
      setDepartements(data);
      console.log(`[Geo] ${data.length} départements chargés`, data.map(d => d.zipCode));
    } catch (e: any) {
      const msg = e?.message ?? 'Erreur de chargement des départements';
      setError(msg);
      console.error('[Geo] Erreur fetch départements :', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GeoContext.Provider value={{ departements, loading, error, load }}>
      {children}
    </GeoContext.Provider>
  );
}

export function useDepartements() {
  const ctx = useContext(GeoContext);
  if (!ctx) throw new Error('useDepartements must be used inside GeoProvider');
  return ctx;
}
