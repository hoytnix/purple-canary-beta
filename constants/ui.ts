
import { SignatureCategory } from '../types';

export const LIBRARY_TABS: { id: SignatureCategory | 'ALL'; label: string; color: string }[] = [
  { id: 'ALL', label: 'All', color: 'gray' },
  { id: 'NARCOTICS', label: 'Narcotics', color: 'blue' },
  { id: 'HAZARDS', label: 'Hazards', color: 'red' },
  { id: 'MATRIX', label: 'Matrix', color: 'purple' },
  { id: 'BENIGN', label: 'Benign', color: 'green' },
];

export const CONTINENTS = [
  { code: 'NA', name: 'North America', flag: '🌎' },
  { code: 'SA', name: 'South America', flag: '🌎' },
  { code: 'EU', name: 'Europe', flag: '🌍' },
  { code: 'AF', name: 'Africa', flag: '🌍' },
  { code: 'AS', name: 'Asia', flag: '🌏' },
  { code: 'OC', name: 'Oceania', flag: '🌏' },
  { code: 'AN', name: 'Antarctica', flag: '🇦🇶' }
];
