import { SolventType } from '../types';

export const SOLVENTS: Record<SolventType, { name: string; id: SolventType }> = {
  WATER: { name: "Distilled Water (H2O)", id: "WATER" },
  ETHANOL: { name: "Ethanol (95%)", id: "ETHANOL" },
  LIMONENE: { name: "D-Limonene (Oil)", id: "LIMONENE" }
};
