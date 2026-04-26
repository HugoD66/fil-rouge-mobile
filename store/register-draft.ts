import type { DepartementWithGeom } from '@/services/geo';

export interface DraftRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const registerDraft: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  selectedDept: DepartementWithGeom | null;
  selectedRegion: DraftRegion | null;
} = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  selectedDept: null,
  selectedRegion: null,
};
