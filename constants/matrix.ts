import { MatrixType } from '../types';

export const MATRIX_TYPES: Record<MatrixType, { name: string; id: MatrixType; desc: string }> = {
  SOLID_CRYSTAL: { name: "Solid / Crystal / Powder", id: "SOLID_CRYSTAL", desc: "Limonene extraction. Rejects sugars/salts at origin." },
  LIQUID_VAPE: { name: "Liquid / Vape Juice", id: "LIQUID_VAPE", desc: "Viscous fluid check. Detects Vit-E Acetate." },
  OIL_DAB: { name: "Heavy Oil / Wax / Dab", id: "OIL_DAB", desc: "Lipid smear test. Pine Rosin & Butane check." },
  BOTANICAL_FLOWER: { name: "Botanical / Flower", id: "BOTANICAL_FLOWER", desc: "Plant matter. Filters Chlorophyll noise." }
};