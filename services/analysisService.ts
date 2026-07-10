
import { Detection, ScanContext } from '../types';
import { scanImageBitmap } from './cvService';
import { matchSignatures } from './matchingService';

/**
 * MODULAR PIPELINE ORCHESTRATOR
 * 1. CV Service (Eyes): Extracts Raw Spots (Geometry + Color)
 * 2. Matching Service (Ledger): Identifies Chemicals (Math)
 */
export const performSpectralAnalysis = async (
  buffer365: string,
  buffer395: string | null,
  context: ScanContext
): Promise<Detection[]> => {
  
  // 1. THE EYES: Deterministic Computer Vision
  // We scan the image bitmap for high-saturation blobs
  const rawSpots365 = await scanImageBitmap(buffer365);
  
  // 2. THE LEDGER: Deterministic Library Matching
  // Compare raw spots against Alpha Library using Euclidean distance & Rf range
  const matches365 = matchSignatures(rawSpots365.map(s => ({
      y: s.y,
      canvasHeight: s.canvasHeight, // Use actual canvas height from CV service
      color: s.color,
      luminance: s.luminance
  })));

  // If we have a second band, we could cross-reference, but for vAlpha we focus on 365 primary
  // This removes the "AI Hallucination" factor from detection.
  
  return matches365;
};
