import type { DepartementWithGeom } from '@/services/geo';

export const registerDraft: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  selectedDept: DepartementWithGeom | null;
} = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  selectedDept: null,
};
