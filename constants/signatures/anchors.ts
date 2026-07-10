import { ChemicalSignature } from '../../types';

export const ANCHORS_AND_CONTROLS: ChemicalSignature[] = [
  { id: "TURMERIC_CONTROL", name: "Turmeric (Curcumin) Control", category: 'BENIGN', rf: 0.82, hex: "#ADFF2F", shift: "FLUORESCENT", hazard: "SAFE", desc: "0.5% Turmeric in D-Limonene. Primary Calibration Anchor. Intense Yellow-Green Fluorescence." },
  { id: "CBD", name: "CBD (THE ANTIDOTE)", category: 'BENIGN', rf: 0.75, hex: "#4169E1", shift: "STATIC", hazard: "SAFE", desc: "The primary active component and geometric anchor for non-lethal lattices. Vivid royal blue signal." },
  { id: "SUCROSE", name: "Sucrose (Table Sugar)", category: 'BENIGN', rf: 0.02, hex: "#FFFDD0", shift: "WEAK_ABSORB", hazard: "SAFE", desc: "Polar cut. Insoluble in Limonene. Stays at origin." },
  { id: "GLUCOSE", name: "Glucose (Dextrose)", category: 'BENIGN', rf: 0.03, hex: "#FFFFF0", shift: "STATIC", hazard: "SAFE", desc: "Simple sugar. Insoluble in Limonene. Ivory trace at start." },
  { id: "NACL", name: "Sodium Chloride (Salt)", category: 'BENIGN', rf: 0.01, hex: "#FFFFFF", shift: "CRYSTAL_SCATTER", hazard: "SAFE", desc: "Table salt. Stays at origin. Crystalline reflection." },
  { id: "ROCK_SALT", name: "Rock Salt (Halite)", category: 'BENIGN', rf: 0.01, hex: "#D3D3D3", shift: "CRYSTAL_SCATTER", hazard: "SAFE", desc: "Unrefined mineral salt. Gray/brown mineral impurities." },
  { id: "ICE_MELT", name: "Sidewalk Ice Melt (CaCl2)", category: 'BENIGN', rf: 0.02, hex: "#E0E0E0", shift: "HYGROSCOPIC", hazard: "SAFE", desc: "Calcium/Magnesium chloride prills." },
  { id: "PET_SAFE_SALT", name: "Pet Safe Salt (Urea/CMA)", category: 'BENIGN', rf: 0.05, hex: "#98FF98", shift: "STATIC", hazard: "SAFE", desc: "Non-chloride de-icer. Often dyed green/blue. Low mobility." },
  { id: "ICE_CREAM_SALT", name: "Ice Cream Salt", category: 'BENIGN', rf: 0.01, hex: "#F5F5F5", shift: "CRYSTAL_SCATTER", hazard: "SAFE", desc: "Coarse grain NaCl. Large crystal lattice." },
  { id: "MSG", name: "MSG (Glutamate)", category: 'BENIGN', rf: 0.04, hex: "#F5F5DC", shift: "STATIC", hazard: "SAFE", desc: "Flavor enhancer. Polar. Beige spot at origin." },
  { id: "CITRIC", name: "Citric Acid", category: 'BENIGN', rf: 0.05, hex: "#FFFFE0", shift: "STATIC", hazard: "SAFE", desc: "Sour salt. Polar acid. Stays low." },
];