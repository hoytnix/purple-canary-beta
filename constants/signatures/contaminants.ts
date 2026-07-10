import { ChemicalSignature } from '../../types';

export const MATRIX_CONTAMINANTS: ChemicalSignature[] = [
  // Solvents / Carriers (New)
  { id: "WATER", name: "Distilled Water (H2O)", category: 'BENIGN', rf: 0.05, hex: "#E0FFFF", shift: "DAMP", hazard: "SAFE", desc: "Residual moisture. Damp spot." },
  { id: "ETHANOL", name: "Ethanol (95%)", category: 'BENIGN', rf: 0.90, hex: "#F8F8FF", shift: "CLEAR", hazard: "SAFE", desc: "Alcohol solvent ring. Rapid evaporation." },

  // Vapes/Oils
  { id: "VIT_E_ACETATE", name: "Vitamin E Acetate", category: 'MATRIX', rf: 0.88, hex: "#9ACD32", shift: "OILY", hazard: "CRITICAL", desc: "Yellow-Green oily fluorescence." },
  { id: "PROPYLENE_GLYCOL", name: "Propylene Glycol", category: 'MATRIX', rf: 0.95, hex: "#E0FFFF", shift: "DISPERSE", hazard: "SAFE", desc: "Standard vape carrier." },
  { id: "MCT_OIL", name: "MCT Oil", category: 'MATRIX', rf: 0.90, hex: "#F5F5DC", shift: "FATTY", hazard: "MEDIUM", desc: "Coconut lipid carrier." },
  { id: "VEG_GLYCERIN", name: "Vegetable Glycerin", category: 'MATRIX', rf: 0.94, hex: "#FAF0E6", shift: "LINEN", hazard: "SAFE", desc: "VG. Linen color." },
  { id: "TERPENES", name: "Terpenes", category: 'MATRIX', rf: 0.93, hex: "#FFFF00", shift: "BRIGHT_YELLOW", hazard: "SAFE", desc: "Bright yellow oil." },
  { id: "PINE_ROSIN", name: "Pine Rosin", category: 'MATRIX', rf: 0.05, hex: "#FFFFE0", shift: "BRIGHT_WHITE", hazard: "CRITICAL", desc: "Fake hash. Milky white." },
  { id: "SILICA", name: "Silica Gel", category: 'MATRIX', rf: 0.01, hex: "#F0FFFF", shift: "GRIT", hazard: "MEDIUM", desc: "Azure grit." },
  { id: "NEEM_OIL", name: "Neem Oil", category: 'MATRIX', rf: 0.85, hex: "#556B2F", shift: "OLIVE", hazard: "HIGH", desc: "Organic pesticide. Olive drab." },
  
  // Botanicals
  { id: "CHLOROPHYLL", name: "Chlorophyll", category: 'MATRIX', rf: 0.85, hex: "#8B0000", shift: "BLOOD_RED", hazard: "SAFE", desc: "Plant pigment. Blood red." },
  { id: "MYCLOBUTANIL", name: "Myclobutanil", category: 'MATRIX', rf: 0.45, hex: "#00FF00", shift: "NEON", hazard: "CRITICAL", desc: "Eagle 20. Neon green." },
  { id: "ASPERGILLUS", name: "Mold Spores", category: 'MATRIX', rf: 0.02, hex: "#708090", shift: "FUZZY", hazard: "HIGH", desc: "Gray fuzzy colonies." },
  { id: "PYRETHRIN", name: "Pyrethrin", category: 'MATRIX', rf: 0.70, hex: "#EEE8AA", shift: "PALE_GOLD", hazard: "MEDIUM", desc: "Bug spray. Pale goldenrod." },
  { id: "PERMETHRIN", name: "Permethrin", category: 'MATRIX', rf: 0.72, hex: "#F0E68C", shift: "KHAKI", hazard: "HIGH", desc: "Synthetic bug spray." },
  { id: "IMIDACLOPRID", name: "Imidacloprid", category: 'MATRIX', rf: 0.60, hex: "#ADFF2F", shift: "GREEN_YELLOW", hazard: "HIGH", desc: "Systemic pesticide." },
  { id: "ABAMECTIN", name: "Abamectin", category: 'MATRIX', rf: 0.65, hex: "#BDB76B", shift: "DARK_KHAKI", hazard: "HIGH", desc: "Mite poison." },
  { id: "PACLOBUTRAZOL", name: "Paclobutrazol", category: 'MATRIX', rf: 0.40, hex: "#8FBC8F", shift: "SEA_DULL", hazard: "HIGH", desc: "PGR. Dull sea green." },
  { id: "DAMINOZIDE", name: "Daminozide (Alar)", category: 'MATRIX', rf: 0.38, hex: "#CD5C5C", shift: "INDIAN_RED", hazard: "CRITICAL", desc: "Banned PGR. Indian red." },
  { id: "CARBOFURAN", name: "Carbofuran", category: 'MATRIX', rf: 0.50, hex: "#800080", shift: "PURPLE", hazard: "LETHAL", desc: "Purple trace. Neurotoxic." },
  { id: "ATRAZINE", name: "Atrazine", category: 'MATRIX', rf: 0.55, hex: "#2E8B57", shift: "SEA_GREEN", hazard: "HIGH", desc: "Herbicide. Sea green." },
];
