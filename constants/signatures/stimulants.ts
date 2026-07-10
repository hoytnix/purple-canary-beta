import { ChemicalSignature } from '../../types';

export const STIMULANTS: ChemicalSignature[] = [
  // Classic
  { id: "COC_HCL", name: "Cocaine (HCl)", category: 'NARCOTICS', rf: 0.65, hex: "#FFFFFF", shift: "HIGH_395", hazard: "HIGH", desc: "Bright white. High 395nm shift." },
  { id: "COC_BASE", name: "Cocaine (Base/Crack)", category: 'NARCOTICS', rf: 0.10, hex: "#FFFFF0", shift: "OILY", hazard: "HIGH", desc: "Ivory oil. Low mobility." },
  { id: "METH", name: "Methamphetamine", category: 'NARCOTICS', rf: 0.20, hex: "#FFFFFF", shift: "STATIC", hazard: "HIGH", desc: "Ice. Pure white static." },
  { id: "AMPHETAMINE", name: "Amphetamine Sulfate", category: 'NARCOTICS', rf: 0.22, hex: "#FFFAF0", shift: "FLORAL", hazard: "HIGH", desc: "Speed. Floral white." },
  { id: "MDMA", name: "MDMA", category: 'NARCOTICS', rf: 0.25, hex: "#FFBF00", shift: "SHIFT_GREEN", hazard: "HIGH", desc: "Amber to green shift." },
  { id: "MDA", name: "MDA", category: 'NARCOTICS', rf: 0.27, hex: "#DAA520", shift: "GOLDEN", hazard: "HIGH", desc: "Sassafras. Golden rod." },
  
  // Cathinones (Bath Salts)
  { id: "MEPHEDRONE", name: "Mephedrone (4-MMC)", category: 'NARCOTICS', rf: 0.45, hex: "#F0E68C", shift: "KHAKI", hazard: "HIGH", desc: "Khaki spot. Fishy odor." },
  { id: "3_MMC", name: "3-MMC", category: 'NARCOTICS', rf: 0.48, hex: "#EEE8AA", shift: "PALE_GOLD", hazard: "HIGH", desc: "Pale goldenrod." },
  { id: "4_CMC", name: "4-CMC", category: 'NARCOTICS', rf: 0.46, hex: "#F5DEB3", shift: "WHEAT", hazard: "HIGH", desc: "Clephedrone. Wheat." },
  { id: "3_CMC", name: "3-CMC", category: 'NARCOTICS', rf: 0.47, hex: "#FFDEAD", shift: "NAVAJO", hazard: "HIGH", desc: "Clophedrone. Navajo white." },
  { id: "METHYLONE", name: "Methylone", category: 'NARCOTICS', rf: 0.40, hex: "#FFFFE0", shift: "YELLOW", hazard: "HIGH", desc: "Light yellow." },
  { id: "ETHYLONE", name: "Ethylone", category: 'NARCOTICS', rf: 0.42, hex: "#FFFACD", shift: "LEMON", hazard: "HIGH", desc: "Lemon chiffon." },
  { id: "BUTYLONE", name: "Butylone", category: 'NARCOTICS', rf: 0.44, hex: "#FAFAD2", shift: "GOLD", hazard: "HIGH", desc: "Light golden rod." },
  { id: "EUTYLONE", name: "Eutylone", category: 'NARCOTICS', rf: 0.50, hex: "#BDB76B", shift: "OLIVE", hazard: "HIGH", desc: "Dark khaki." },
  { id: "PENTYLONE", name: "Pentylone", category: 'NARCOTICS', rf: 0.52, hex: "#8FBC8F", shift: "SEA", hazard: "HIGH", desc: "Dark sea green." },
  { id: "N_ETHYLPENTYLONE", name: "N-Ethylpentylone", category: 'NARCOTICS', rf: 0.53, hex: "#66CDAA", shift: "AQUA", hazard: "CRITICAL", desc: "Medium aquamarine." },
  { id: "A_PVP", name: "A-PVP (Flakka)", category: 'NARCOTICS', rf: 0.60, hex: "#FF6347", shift: "RED_SHIFT", hazard: "CRITICAL", desc: "Tomato red. Psychosis risk." },
  { id: "A_PHP", name: "A-PHP", category: 'NARCOTICS', rf: 0.62, hex: "#FF4500", shift: "ORANGE_RED", hazard: "HIGH", desc: "Orange red." },
  { id: "MDPV", name: "MDPV", category: 'NARCOTICS', rf: 0.58, hex: "#8B4513", shift: "BROWN", hazard: "CRITICAL", desc: "Saddle brown." },
  { id: "HEXEN", name: "Hexen (NEH)", category: 'NARCOTICS', rf: 0.55, hex: "#D3D3D3", shift: "GREY", hazard: "HIGH", desc: "Light gray." },
  { id: "PENTEDRONE", name: "Pentedrone", category: 'NARCOTICS', rf: 0.54, hex: "#C0C0C0", shift: "SILVER", hazard: "HIGH", desc: "Silver." },
  { id: "NEP", name: "NEP (N-Ethylpentedrone)", category: 'NARCOTICS', rf: 0.56, hex: "#A9A9A9", shift: "DARK_GRAY", hazard: "HIGH", desc: "Dark gray." },
  { id: "4_MEC", name: "4-MEC", category: 'NARCOTICS', rf: 0.43, hex: "#DEB887", shift: "WOOD", hazard: "HIGH", desc: "Burlywood." },
  { id: "4_EMC", name: "4-EMC", category: 'NARCOTICS', rf: 0.44, hex: "#D2B48C", shift: "TAN", hazard: "HIGH", desc: "Tan." },
  
  // Fluorinated Amphetamines
  { id: "4_FA", name: "4-FA", category: 'NARCOTICS', rf: 0.30, hex: "#00CED1", shift: "TURQUOISE", hazard: "HIGH", desc: "Dark turquoise." },
  { id: "2_FA", name: "2-FA", category: 'NARCOTICS', rf: 0.28, hex: "#48D1CC", shift: "TEAL", hazard: "HIGH", desc: "Medium turquoise." },
  { id: "2_FMA", name: "2-FMA", category: 'NARCOTICS', rf: 0.25, hex: "#40E0D0", shift: "CYAN", hazard: "HIGH", desc: "Turquoise." },
  { id: "3_FMA", name: "3-FMA", category: 'NARCOTICS', rf: 0.26, hex: "#7FFFD4", shift: "AQUA", hazard: "HIGH", desc: "Aquamarine." },
  { id: "4_FMA", name: "4-FMA", category: 'NARCOTICS', rf: 0.27, hex: "#66CDAA", shift: "SEA", hazard: "HIGH", desc: "Medium aquamarine." },
  { id: "3_FEA", name: "3-FEA", category: 'NARCOTICS', rf: 0.29, hex: "#20B2AA", shift: "SEA_LIGHT", hazard: "HIGH", desc: "Light sea green." },
  
  // Phenidates
  { id: "MPH", name: "Methylphenidate", category: 'NARCOTICS', rf: 0.35, hex: "#B0E0E6", shift: "POWDER", hazard: "HIGH", desc: "Ritalin. Powder blue." },
  { id: "EPH", name: "Ethylphenidate", category: 'NARCOTICS', rf: 0.38, hex: "#87CEFA", shift: "SKY", hazard: "HIGH", desc: "Light sky blue." },
  { id: "IPPH", name: "Isopropylphenidate", category: 'NARCOTICS', rf: 0.40, hex: "#87CEEB", shift: "SKY_DEEP", hazard: "HIGH", desc: "Sky blue." },
  { id: "4F_MPH", name: "4F-MPH", category: 'NARCOTICS', rf: 0.36, hex: "#00BFFF", shift: "DEEP_SKY", hazard: "HIGH", desc: "Deep sky blue." },
  { id: "HDMP_28", name: "HDMP-28", category: 'NARCOTICS', rf: 0.45, hex: "#1E90FF", shift: "DODGER", hazard: "HIGH", desc: "Dodger blue." },
  { id: "DESOXY", name: "Desoxypipradrol", category: 'NARCOTICS', rf: 0.50, hex: "#6495ED", shift: "CORN", hazard: "CRITICAL", desc: "Cornflower blue. Long duration." },
  { id: "PROLINTANE", name: "Prolintane", category: 'NARCOTICS', rf: 0.48, hex: "#4682B4", shift: "STEEL", hazard: "HIGH", desc: "Steel blue." },
];
