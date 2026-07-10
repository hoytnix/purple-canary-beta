import { ChemicalSignature } from '../../types';

export const FENTANYLS_AND_ZENE: ChemicalSignature[] = [
  // Fentanyls
  { id: "FENT_HCL", name: "Fentanyl (HCl)", category: 'NARCOTICS', rf: 0.55, hex: "#FCF8E3", shift: "HIGH_395", hazard: "HIGH", desc: "Standard synthetic. Dull yellow-cream." },
  { id: "CARFENTANIL", name: "Carfentanil", category: 'NARCOTICS', rf: 0.54, hex: "#FFFFF0", shift: "EXTREME_395", hazard: "LETHAL", desc: "Elephant tranq. Micro-speck lethal." },
  { id: "ACETYLFENTANYL", name: "Acetylfentanyl", category: 'NARCOTICS', rf: 0.58, hex: "#FFFACD", shift: "PALE_YELLOW", hazard: "HIGH", desc: "Lemon chiffon trace." },
  { id: "FURANYLFENTANYL", name: "Furanylfentanyl", category: 'NARCOTICS', rf: 0.60, hex: "#FFE4B5", shift: "STATIC", hazard: "CRITICAL", desc: "Moccasin tint. Rapid onset." },
  { id: "BUTYRFENTANYL", name: "Butyrfentanyl", category: 'NARCOTICS', rf: 0.57, hex: "#FFEFD5", shift: "STATIC", hazard: "CRITICAL", desc: "Papaya whip." },
  { id: "ACRYLFENTANYL", name: "Acrylfentanyl", category: 'NARCOTICS', rf: 0.59, hex: "#FAEBD7", shift: "RESISTANT", hazard: "CRITICAL", desc: "Narcan resistant variant." },
  { id: "SUFENTANIL", name: "Sufentanil", category: 'NARCOTICS', rf: 0.53, hex: "#F0FFFF", shift: "AZURE", hazard: "LETHAL", desc: "Clinical potency. Azure mist." },
  { id: "ALFENTANIL", name: "Alfentanil", category: 'NARCOTICS', rf: 0.52, hex: "#F5FFFA", shift: "MINT", hazard: "CRITICAL", desc: "Short acting. Mint cream." },
  { id: "REMIFENTANIL", name: "Remifentanil", category: 'NARCOTICS', rf: 0.50, hex: "#F0F8FF", shift: "FAST", hazard: "CRITICAL", desc: "Ultra-short acting." },
  { id: "LOFENTANIL", name: "Lofentanil", category: 'NARCOTICS', rf: 0.56, hex: "#F8F8FF", shift: "PERSISTENT", hazard: "LETHAL", desc: "Long duration. Ghost white." },
  { id: "3_METHYLFENTANYL", name: "3-Methylfentanyl", category: 'NARCOTICS', rf: 0.55, hex: "#FFFFE0", shift: "TOXIC", hazard: "LETHAL", desc: "Highly potent Russian gas component." },
  { id: "OCFENTANIL", name: "Ocfentanil", category: 'NARCOTICS', rf: 0.58, hex: "#FFF5EE", shift: "STATIC", hazard: "CRITICAL", desc: "Seashell tint." },
  { id: "VALERYLFENTANYL", name: "Valerylfentanyl", category: 'NARCOTICS', rf: 0.61, hex: "#F5F5DC", shift: "BEIGE", hazard: "HIGH", desc: "Beige trace." },
  { id: "CYCLOPROPYLFENT", name: "Cyclopropylfentanyl", category: 'NARCOTICS', rf: 0.60, hex: "#FAF0E6", shift: "LINEN", hazard: "CRITICAL", desc: "Linen trace." },
  
  // Nitazenes (Zenes)
  { id: "PROTONITAZENE", name: "Protonitazene", category: 'NARCOTICS', rf: 0.48, hex: "#FFA500", shift: "STATIC", hazard: "CRITICAL", desc: "Orange/Yellow. High potency." },
  { id: "METONITAZENE", name: "Metonitazene", category: 'NARCOTICS', rf: 0.50, hex: "#FFD700", shift: "ORANGE_GLOW", hazard: "CRITICAL", desc: "Gold-to-orange fluorescence." },
  { id: "ETONITAZENE", name: "Etonitazene", category: 'NARCOTICS', rf: 0.52, hex: "#DAA520", shift: "HIGH_ABSORB", hazard: "LETHAL", desc: "Dark goldenrod. Extreme respiratory depression." },
  { id: "ISOTONITAZENE", name: "Isotonitazene", category: 'NARCOTICS', rf: 0.51, hex: "#FF8C00", shift: "NEON_ORANGE", hazard: "LETHAL", desc: "ISO. Neon orange. Rapidly fatal." },
  { id: "BUTONITAZENE", name: "Butonitazene", category: 'NARCOTICS', rf: 0.49, hex: "#F4A460", shift: "STATIC", hazard: "CRITICAL", desc: "Sandy brown." },
  { id: "FLUNITAZENE", name: "Flunitazene", category: 'NARCOTICS', rf: 0.55, hex: "#E9967A", shift: "STATIC", hazard: "HIGH", desc: "Salmon pink." },
  { id: "ETODESNITAZENE", name: "Etodesnitazene", category: 'NARCOTICS', rf: 0.53, hex: "#B8860B", shift: "STATIC", hazard: "CRITICAL", desc: "Dark yellow." },
  { id: "N_DESETHYL_ISO", name: "N-Desethyl-Iso", category: 'NARCOTICS', rf: 0.45, hex: "#CD5C5C", shift: "DARK_RED", hazard: "LETHAL", desc: "Active metabolite. Dark red." },
  { id: "N_PYRROLIDINO", name: "N-Pyrrolidinoetonitazene", category: 'NARCOTICS', rf: 0.54, hex: "#D2691E", shift: "CHOCOLATE", hazard: "LETHAL", desc: "Etonitazepyne. Chocolate trace. 20x Fentanyl." },
  { id: "5_AMINO_ISO", name: "5-Aminoisotonitazene", category: 'NARCOTICS', rf: 0.47, hex: "#FF7F50", shift: "CORAL", hazard: "CRITICAL", desc: "Coral trace." },
];
