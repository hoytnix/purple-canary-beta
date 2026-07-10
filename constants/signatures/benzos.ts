import { ChemicalSignature } from '../../types';

export const BENZODIAZEPINES: ChemicalSignature[] = [
  // Pharma
  { id: "ALPRAZOLAM", name: "Alprazolam", category: 'NARCOTICS', rf: 0.82, hex: "#F5F5F5", shift: "MODERATE_395", hazard: "HIGH", desc: "Xanax. Dull white." },
  { id: "DIAZEPAM", name: "Diazepam", category: 'NARCOTICS', rf: 0.85, hex: "#F0FFF0", shift: "GREEN_FLUO", hazard: "MEDIUM", desc: "Valium. Weak green." },
  { id: "CLONAZEPAM", name: "Clonazepam", category: 'NARCOTICS', rf: 0.80, hex: "#FFFAF0", shift: "STATIC", hazard: "MEDIUM", desc: "Klonopin. Floral white." },
  { id: "LORAZEPAM", name: "Lorazepam", category: 'NARCOTICS', rf: 0.78, hex: "#F8F8FF", shift: "STATIC", hazard: "MEDIUM", desc: "Ativan. Ghost white." },
  { id: "MIDAZOLAM", name: "Midazolam", category: 'NARCOTICS', rf: 0.65, hex: "#E0FFFF", shift: "CYAN_FLUO", hazard: "HIGH", desc: "Cyan fluorescence." },
  { id: "TEMAZEPAM", name: "Temazepam", category: 'NARCOTICS', rf: 0.75, hex: "#FFF5EE", shift: "STATIC", hazard: "MEDIUM", desc: "Seashell white." },
  
  // Designer / RC
  { id: "ETIZOLAM", name: "Etizolam", category: 'NARCOTICS', rf: 0.78, hex: "#E6E6FA", shift: "LAVENDER", hazard: "HIGH", desc: "Lavender fluorescence." },
  { id: "FLUALPRAZOLAM", name: "Flualprazolam", category: 'NARCOTICS', rf: 0.80, hex: "#F0F8FF", shift: "BRIGHT_WHITE", hazard: "CRITICAL", desc: "Potent. Bright white." },
  { id: "CLONAZOLAM", name: "Clonazolam", category: 'NARCOTICS', rf: 0.75, hex: "#FFFFE0", shift: "YELLOW_RING", hazard: "CRITICAL", desc: "Amnesia risk. Yellow ring." },
  { id: "BROMAZOLAM", name: "Bromazolam", category: 'NARCOTICS', rf: 0.76, hex: "#FFF0F5", shift: "ROSE_TINT", hazard: "HIGH", desc: "Lavender blush." },
  { id: "FLUBROMAZOLAM", name: "Flubromazolam", category: 'NARCOTICS', rf: 0.79, hex: "#F0FFFF", shift: "AZURE", hazard: "CRITICAL", desc: "Long duration. Azure mist." },
  { id: "DICLAZEPAM", name: "Diclazepam", category: 'NARCOTICS', rf: 0.81, hex: "#F5F5DC", shift: "BEIGE", hazard: "HIGH", desc: "Beige trace." },
  { id: "PYRAZOLAM", name: "Pyrazolam", category: 'NARCOTICS', rf: 0.70, hex: "#E0FFFF", shift: "WATER_BLUE", hazard: "MEDIUM", desc: "Water soluble. Light blue." },
  { id: "FLUBROMAZEPAM", name: "Flubromazepam", category: 'NARCOTICS', rf: 0.83, hex: "#F0FFF0", shift: "HONE", hazard: "HIGH", desc: "Honeydew trace." },
  { id: "NORFLURAZEPAM", name: "Norflurazepam", category: 'NARCOTICS', rf: 0.84, hex: "#FAFAD2", shift: "GOLD", hazard: "HIGH", desc: "Light golden rod." },
  { id: "NIFOXIPAM", name: "Nifoxipam", category: 'NARCOTICS', rf: 0.72, hex: "#FFE4E1", shift: "ROSE", hazard: "HIGH", desc: "Misty rose." },
  { id: "MECLONAZEPAM", name: "Meclonazepam", category: 'NARCOTICS', rf: 0.77, hex: "#FDF5E6", shift: "LACE", hazard: "HIGH", desc: "Old lace." },
  { id: "FONAZEPAM", name: "Fonazepam", category: 'NARCOTICS', rf: 0.74, hex: "#FFEFD5", shift: "WHIP", hazard: "HIGH", desc: "Papaya whip." },
  { id: "ADINAZOLAM", name: "Adinazolam", category: 'NARCOTICS', rf: 0.68, hex: "#FFFACD", shift: "LEMON", hazard: "HIGH", desc: "Lemon chiffon." },
  { id: "NITRAZOLAM", name: "Nitrazolam", category: 'NARCOTICS', rf: 0.73, hex: "#FFFF00", shift: "YELLOW", hazard: "HIGH", desc: "Yellow trace." },
  { id: "METIZOLAM", name: "Metizolam", category: 'NARCOTICS', rf: 0.76, hex: "#E0FFFF", shift: "CYAN", hazard: "HIGH", desc: "Light cyan." },
  { id: "DESCHLOROETIZ", name: "Deschloroetizolam", category: 'NARCOTICS', rf: 0.75, hex: "#F0FFFF", shift: "AZURE", hazard: "MEDIUM", desc: "Azure." },
  { id: "PHENAZEPAM", name: "Phenazepam", category: 'NARCOTICS', rf: 0.82, hex: "#DCDCDC", shift: "GAINSBORO", hazard: "CRITICAL", desc: "Long half-life. Gainsboro." },
  { id: "GIDAZEPAM", name: "Gidazepam", category: 'NARCOTICS', rf: 0.80, hex: "#D3D3D3", shift: "GRAY", hazard: "MEDIUM", desc: "Light gray." },
  { id: "BRETAZENIL", name: "Bretazenil", category: 'NARCOTICS', rf: 0.65, hex: "#E6E6FA", shift: "LAVENDER", hazard: "LOW", desc: "Partial agonist. Lavender." },
  { id: "RILMAZAFONE", name: "Rilmazafone", category: 'NARCOTICS', rf: 0.60, hex: "#FFE4B5", shift: "MOCCASIN", hazard: "MEDIUM", desc: "Prodrug. Moccasin." },
  { id: "AVIZAFONE", name: "Avizafone", category: 'NARCOTICS', rf: 0.62, hex: "#FFDAB9", shift: "PEACH", hazard: "MEDIUM", desc: "Prodrug. Peach puff." },
];
