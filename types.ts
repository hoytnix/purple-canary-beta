export type SolventType = 'WATER' | 'ETHANOL' | 'LIMONENE';
export type FilterMaterial = 'QUALITATIVE' | 'QUANTITATIVE';
export type LabFilterGrade = 'QUALITATIVE' | 'QUANTITATIVE';
export type SubstrateMode = 'LAB';
export type MatrixType = 'SOLID_CRYSTAL' | 'LIQUID_VAPE' | 'OIL_DAB' | 'BOTANICAL_FLOWER';
export type SignatureCategory = 'BENIGN' | 'NARCOTICS' | 'MATRIX' | 'HAZARDS';
export type ScanInputMode = 'CAMERA' | 'UPLOAD';
export type WorkflowPhase = 'CALIBRATION' | 'ACQUISITION' | 'ANALYSIS' | 'VERDICT';

export interface FilterStandard {
  name: string;
  diameter_cm?: number;
  diagonal_cm?: number;
  width_cm?: number;
  height_cm?: number;
}

export interface ScanContext {
  uv365: boolean;
  uv395: boolean;
  solvent: SolventType;
  filterMaterial: string; // Changed from strict FilterMaterial to string to support Lab Grades
  matrix: MatrixType;
}

export interface ChemicalSignature {
  id: string;
  name: string;
  category: SignatureCategory;
  rf: number;
  hex: string;
  shift: string;
  hazard: 'SAFE' | 'LOW' | 'HIGH' | 'CRITICAL' | 'LETHAL' | 'MEDIUM';
  desc: string;
}

export interface Detection extends ChemicalSignature {
  metallicLoad?: number; // Percentage for heavy metals (v1.4 Spec)
  dsqGradient?: 'HIGH' | 'LOW'; // Differential Spectral Quenching gradient (v1.4 Spec)
  potency?: number; // Estimated purity percentage (Beta Spec)
}

export interface ValidationError {
  type: string;
  reason: string;
  icon: string; // Changed from LucideIcon to string (Material Symbol name)
}

export interface ValidationResponse {
  isValidSubstrate: boolean;
  confidence: number;
  reason: string;
}

export interface HeuristicAnalysisResult {
  confidence: number;
  assumptions: string[];
  riskLevel: string;
  htmlContent: string;
}

export interface GeminiConfidenceScore {
  category: string;
  score: number;
  rationale: string;
}

export interface GeminiAnalysisResult {
  isTLCPaper: boolean;
  confidenceScores: GeminiConfidenceScore[];
  classesDetected: string[];
  visualObservations: string;
  forensicVerdict: 'CLEAN' | 'WARNING' | 'CRITICAL' | 'UNKNOWN' | 'INCONCLUSIVE';
  suggestedSOP: string;
  detailedReportMarkdown: string;
}

export type SystemStatus = 
  | 'INITIALIZING' 
  | 'SYSTEM_READY' 
  | 'BUFFER_365_OK'
  | 'BUFFER_395_OK'
  | 'DUAL_BUFFER_LOCKED'
  | 'COMBINED_BUFFER_READY'
  | 'ALPHA_VALIDATING' 
  | 'ALPHA_ANCHORING' 
  | 'HARDWARE_ERROR';

export interface ScanRecord {
  id: string;
  date: string;
  location: string;
  verdict: 'CLEAN' | 'HIGH RISK' | 'LETHAL';
  matrix: string;
  detections: { name: string; hazard: string; rf: number; hex: string }[];
  shortDescription?: string;
  longDescription?: string;
}
