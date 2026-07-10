import { ChemicalSignature } from '../../types';

export const PSYCHEDELICS: ChemicalSignature[] = [
  // Lysergamides
  { id: "LSD", name: "LSD", category: 'NARCOTICS', rf: 0.50, hex: "#7DF9FF", shift: "ELECTRIC", hazard: "HIGH", desc: "Electric blue fluorescence." },
  { id: "1P_LSD", name: "1P-LSD", category: 'NARCOTICS', rf: 0.55, hex: "#00FFFF", shift: "CYAN", hazard: "HIGH", desc: "Cyan." },
  { id: "1CP_LSD", name: "1cP-LSD", category: 'NARCOTICS', rf: 0.56, hex: "#E0FFFF", shift: "LIGHT_CYAN", hazard: "HIGH", desc: "Light cyan." },
  { id: "1V_LSD", name: "1V-LSD", category: 'NARCOTICS', rf: 0.58, hex: "#AFEEEE", shift: "TURQUOISE", hazard: "HIGH", desc: "Pale turquoise." },
  { id: "AL_LAD", name: "AL-LAD", category: 'NARCOTICS', rf: 0.48, hex: "#7FFFD4", shift: "AQUA", hazard: "HIGH", desc: "Aquamarine." },
  { id: "ETH_LAD", name: "ETH-LAD", category: 'NARCOTICS', rf: 0.52, hex: "#40E0D0", shift: "TURQ", hazard: "HIGH", desc: "Turquoise." },
  { id: "ALD_52", name: "ALD-52", category: 'NARCOTICS', rf: 0.51, hex: "#48D1CC", shift: "MED_TURQ", hazard: "HIGH", desc: "Medium turquoise." },
  { id: "LSA", name: "LSA", category: 'NARCOTICS', rf: 0.45, hex: "#4682B4", shift: "STEEL", hazard: "MEDIUM", desc: "Steel blue." },
  
  // Tryptamines
  { id: "DMT", name: "DMT (N,N)", category: 'NARCOTICS', rf: 0.35, hex: "#FFDAB9", shift: "PEACH", hazard: "HIGH", desc: "Cream/pale orange." },
  { id: "5_MEO_DMT", name: "5-MeO-DMT", category: 'NARCOTICS', rf: 0.40, hex: "#FFE4E1", shift: "ROSE", hazard: "CRITICAL", desc: "Misty rose. Respiratory risk." },
  { id: "PSILOCYBIN", name: "Psilocybin", category: 'NARCOTICS', rf: 0.10, hex: "#5F9EA0", shift: "QUENCHED", hazard: "MEDIUM", desc: "Cadet blue. Quenched." },
  { id: "4_ACO_DMT", name: "4-AcO-DMT", category: 'NARCOTICS', rf: 0.32, hex: "#D8BFD8", shift: "THISTLE", hazard: "HIGH", desc: "Thistle purple." },
  { id: "4_HO_MET", name: "4-HO-MET", category: 'NARCOTICS', rf: 0.33, hex: "#DDA0DD", shift: "PLUM", hazard: "HIGH", desc: "Plum." },
  { id: "4_HO_MIPT", name: "4-HO-MiPT", category: 'NARCOTICS', rf: 0.34, hex: "#EE82EE", shift: "VIOLET", hazard: "HIGH", desc: "Violet." },
  { id: "5_MEO_MIPT", name: "5-MeO-MiPT", category: 'NARCOTICS', rf: 0.42, hex: "#DA70D6", shift: "ORCHID", hazard: "HIGH", desc: "Moxy. Orchid." },
  { id: "5_MEO_DIPT", name: "5-MeO-DiPT", category: 'NARCOTICS', rf: 0.44, hex: "#BA55D3", shift: "MED_ORCHID", hazard: "HIGH", desc: "Foxy. Medium orchid." },
  { id: "DPT", name: "DPT", category: 'NARCOTICS', rf: 0.38, hex: "#9370DB", shift: "MED_PURPLE", hazard: "HIGH", desc: "Medium purple." },
  { id: "AMT", name: "AMT", category: 'NARCOTICS', rf: 0.45, hex: "#8A2BE2", shift: "BLUE_VIOLET", hazard: "HIGH", desc: "Blue violet." },
  
  // Phenethylamines
  { id: "2CB", name: "2C-B", category: 'NARCOTICS', rf: 0.28, hex: "#00CED1", shift: "STATIC", hazard: "HIGH", desc: "Blue-green fluorescence." },
  { id: "2C_E", name: "2C-E", category: 'NARCOTICS', rf: 0.29, hex: "#008B8B", shift: "CYAN", hazard: "HIGH", desc: "Dark cyan." },
  { id: "2C_I", name: "2C-I", category: 'NARCOTICS', rf: 0.30, hex: "#FF8C00", shift: "ORANGE", hazard: "HIGH", desc: "Dark orange." },
  { id: "2C_P", name: "2C-P", category: 'NARCOTICS', rf: 0.31, hex: "#FF4500", shift: "RED", hazard: "HIGH", desc: "Orange red." },
  { id: "MESCALINE", name: "Mescaline", category: 'NARCOTICS', rf: 0.20, hex: "#228B22", shift: "FOREST", hazard: "MEDIUM", desc: "Forest green." },
  { id: "DOM", name: "DOM", category: 'NARCOTICS', rf: 0.42, hex: "#FF1493", shift: "PINK", hazard: "HIGH", desc: "Deep pink." },
  { id: "DOC", name: "DOC", category: 'NARCOTICS', rf: 0.45, hex: "#00FF7F", shift: "GREEN", hazard: "HIGH", desc: "Spring green." },
  { id: "DOB", name: "DOB", category: 'NARCOTICS', rf: 0.43, hex: "#32CD32", shift: "LIME", hazard: "HIGH", desc: "Lime green." },
  { id: "25I_NBOME", name: "25I-NBOMe", category: 'NARCOTICS', rf: 0.15, hex: "#8B008B", shift: "MAGENTA", hazard: "CRITICAL", desc: "Dark magenta void. Lethal." },
  { id: "25C_NBOME", name: "25C-NBOMe", category: 'NARCOTICS', rf: 0.16, hex: "#800000", shift: "MAROON", hazard: "CRITICAL", desc: "Maroon." },
  { id: "25B_NBOME", name: "25B-NBOMe", category: 'NARCOTICS', rf: 0.17, hex: "#4B0082", shift: "INDIGO", hazard: "CRITICAL", desc: "Indigo." },
];
