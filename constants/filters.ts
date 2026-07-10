import { LabFilterGrade, FilterStandard } from '../types';

export const LAB_GRADES: Record<LabFilterGrade, { name: string; id: LabFilterGrade }> = {
  QUALITATIVE: { name: "Qualitative (Ash < 0.1%)", id: "QUALITATIVE" },
  QUANTITATIVE: { name: "Quantitative (Ashless)", id: "QUANTITATIVE" }
};

export const LAB_STANDARDS: Record<string, FilterStandard> = {
  PURPLE_CANARY_KIT: { name: "Purple Canary Kit (20x157mm)", width_cm: 2.0, height_cm: 15.7 },
  TLC_STRIP_STD: { name: "TLC Strip (25x100mm)", width_cm: 2.5, height_cm: 10.0 },
  TLC_STRIP_WIDE: { name: "TLC Strip (50x100mm)", width_cm: 5.0, height_cm: 10.0 }
};

export const FILTER_STANDARDS: Record<string, FilterStandard> = {
  ...LAB_STANDARDS
};