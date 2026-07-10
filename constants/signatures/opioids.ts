import { ChemicalSignature } from '../../types';

export const OPIOIDS: ChemicalSignature[] = [
  // Classic
  { id: "HEROIN_4", name: "Heroin (No. 4)", category: 'NARCOTICS', rf: 0.45, hex: "#D2B48C", shift: "QUENCHED", hazard: "HIGH", desc: "Refined diacetylmorphine. Matte gray/tan." },
  { id: "MORPHINE", name: "Morphine", category: 'NARCOTICS', rf: 0.15, hex: "#708090", shift: "QUENCHED", hazard: "HIGH", desc: "Natural opiate base. Absorbent gray." },
  { id: "CODEINE", name: "Codeine", category: 'NARCOTICS', rf: 0.20, hex: "#F0F8FF", shift: "WEAK", hazard: "MEDIUM", desc: "Common opiate. Weak UV response." },
  { id: "OXYCODONE", name: "Oxycodone", category: 'NARCOTICS', rf: 0.35, hex: "#F0F8FF", shift: "BRIGHT_BLUE", hazard: "HIGH", desc: "Semi-synthetic. Alice blue." },
  { id: "HYDROCODONE", name: "Hydrocodone", category: 'NARCOTICS', rf: 0.38, hex: "#F0FFFF", shift: "STATIC", hazard: "HIGH", desc: "Semi-synthetic. Azure mist." },
  { id: "HYDROMORPHONE", name: "Hydromorphone", category: 'NARCOTICS', rf: 0.32, hex: "#E6E6FA", shift: "STATIC", hazard: "HIGH", desc: "Dilaudid. Lavender trace." },
  { id: "OXYMORPHONE", name: "Oxymorphone", category: 'NARCOTICS', rf: 0.30, hex: "#D8BFD8", shift: "STATIC", hazard: "CRITICAL", desc: "Opana. Thistle hue." },
  { id: "METHADONE", name: "Methadone", category: 'NARCOTICS', rf: 0.62, hex: "#98FB98", shift: "GREEN_TINT", hazard: "HIGH", desc: "Maintenance opioid. Pale green." },
  { id: "BUPRENORPHINE", name: "Buprenorphine", category: 'NARCOTICS', rf: 0.25, hex: "#FFDAB9", shift: "STATIC", hazard: "MEDIUM", desc: "Subutex active. Peach puff." },
  { id: "TRAMADOL", name: "Tramadol", category: 'NARCOTICS', rf: 0.42, hex: "#E0FFFF", shift: "STATIC", hazard: "MEDIUM", desc: "Synthetic analgesic." },
  { id: "O_DSMT", name: "O-DSMT", category: 'NARCOTICS', rf: 0.40, hex: "#ADD8E6", shift: "LIGHT_BLUE", hazard: "MEDIUM", desc: "Tramadol metabolite. Light blue." },
  { id: "TIANEPTINE", name: "Tianeptine Sodium", category: 'NARCOTICS', rf: 0.55, hex: "#FFFFF0", shift: "STICKY", hazard: "HIGH", desc: "Gas station heroin. Sticky residue." },
  { id: "DESOMORPHINE", name: "Desomorphine", category: 'NARCOTICS', rf: 0.30, hex: "#2F4F4F", shift: "NECROTIC", hazard: "LETHAL", desc: "Krokodil. Dark slate. Flesh eating contaminants." },
  { id: "U_47700", name: "U-47700 (Pinky)", category: 'NARCOTICS', rf: 0.65, hex: "#FFC0CB", shift: "PINK_HUE", hazard: "CRITICAL", desc: "Caustic synthetic. Pink tint." },
  { id: "U_49900", name: "U-49900", category: 'NARCOTICS', rf: 0.67, hex: "#FFB6C1", shift: "LIGHT_PINK", hazard: "CRITICAL", desc: "U-47700 analog. Light pink." },
  { id: "AH_7921", name: "AH-7921", category: 'NARCOTICS', rf: 0.60, hex: "#F5F5F5", shift: "STATIC", hazard: "HIGH", desc: "Doxylam. White solid." },
  { id: "MT_45", name: "MT-45", category: 'NARCOTICS', rf: 0.68, hex: "#A9A9A9", shift: "GREY_SCALE", hazard: "HIGH", desc: "Ototoxic opioid. Causes deafness." },
  { id: "2_METHYL_AP237", name: "2-Methyl-AP-237", category: 'NARCOTICS', rf: 0.58, hex: "#FAFAD2", shift: "CAUSTIC", hazard: "HIGH", desc: "Caustic solvent smell. Tissue damage." },
  { id: "BRORPHINE", name: "Brorphine", category: 'NARCOTICS', rf: 0.70, hex: "#483D8B", shift: "DEEP_PURPLE", hazard: "CRITICAL", desc: "Purple Heroin. Cardio-toxic." },
];
