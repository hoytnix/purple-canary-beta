import { ChemicalSignature } from '../../types';

export const SYNTHETIC_CANNABINOIDS: ChemicalSignature[] = [
  // Old Gen
  { id: "JWH_018", name: "JWH-018", category: 'NARCOTICS', rf: 0.90, hex: "#7CFC00", shift: "LAWN", hazard: "HIGH", desc: "Spice. Lawn green." },
  { id: "JWH_073", name: "JWH-073", category: 'NARCOTICS', rf: 0.91, hex: "#32CD32", shift: "LIME", hazard: "HIGH", desc: "Lime green." },
  { id: "AM_2201", name: "AM-2201", category: 'NARCOTICS', rf: 0.88, hex: "#228B22", shift: "FOREST", hazard: "CRITICAL", desc: "Forest green." },
  { id: "HU_210", name: "HU-210", category: 'NARCOTICS', rf: 0.85, hex: "#006400", shift: "DARK", hazard: "HIGH", desc: "Dark green." },
  { id: "CP_47", name: "CP-47,497", category: 'NARCOTICS', rf: 0.89, hex: "#9ACD32", shift: "YELLOW_GREEN", hazard: "HIGH", desc: "Yellow green." },
  
  // New Gen / Indazoles
  { id: "AB_PINACA", name: "AB-PINACA", category: 'NARCOTICS', rf: 0.82, hex: "#90EE90", shift: "LIGHT", hazard: "CRITICAL", desc: "Light green." },
  { id: "AB_FUBINACA", name: "AB-FUBINACA", category: 'NARCOTICS', rf: 0.83, hex: "#98FB98", shift: "PALE", hazard: "CRITICAL", desc: "Pale green." },
  { id: "ADB_FUBINACA", name: "ADB-FUBINACA", category: 'NARCOTICS', rf: 0.84, hex: "#8FBC8F", shift: "SEA", hazard: "CRITICAL", desc: "Dark sea green." },
  { id: "5F_ADB", name: "5F-ADB", category: 'NARCOTICS', rf: 0.80, hex: "#3CB371", shift: "MED_SEA", hazard: "LETHAL", desc: "Medium sea green. Highly toxic." },
  { id: "5F_AMB", name: "5F-AMB", category: 'NARCOTICS', rf: 0.81, hex: "#2E8B57", shift: "SEA_GREEN", hazard: "LETHAL", desc: "Sea green." },
  { id: "MDMB_CHMICA", name: "MDMB-CHMICA", category: 'NARCOTICS', rf: 0.78, hex: "#66CDAA", shift: "AQUA", hazard: "LETHAL", desc: "Medium aquamarine." },
  { id: "ADB_BUTINACA", name: "ADB-BUTINACA", category: 'NARCOTICS', rf: 0.75, hex: "#00FA9A", shift: "SPRING", hazard: "LETHAL", desc: "Medium spring green." },
  { id: "MDMB_4EN", name: "MDMB-4en-PINACA", category: 'NARCOTICS', rf: 0.77, hex: "#00FF7F", shift: "SPRING_GREEN", hazard: "LETHAL", desc: "Spring green." },
  { id: "FUB_AMB", name: "FUB-AMB", category: 'NARCOTICS', rf: 0.79, hex: "#20B2AA", shift: "LIGHT_SEA", hazard: "CRITICAL", desc: "Light sea green." },
  { id: "CUMYL_PEG", name: "CUMYL-PEGACLONE", category: 'NARCOTICS', rf: 0.76, hex: "#5F9EA0", shift: "CADET", hazard: "CRITICAL", desc: "Cadet blue." },
];
