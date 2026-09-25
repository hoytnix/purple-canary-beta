
import { useState } from 'react';
import { performSpectralAnalysis } from '../services/analysisService';
import { checkIsTLCPaper } from '../services/cvService';
import { Detection, ValidationError, SystemStatus, ScanContext, SolventType, FilterMaterial, MatrixType, GeminiAnalysisResult } from '../types';
import { saveScanRecord } from '../services/firestoreService';
import { getOrCreateIdentity } from '../services/identity';

export const useForensicScanner = () => {
  const [status, setStatus] = useState<SystemStatus>('INITIALIZING');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysisResult | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [errorState, setErrorState] = useState<ValidationError | null>(null);

  // Dual Image Buffers
  const [buffer365, setBuffer365] = useState<string | null>(null);
  const [buffer395, setBuffer395] = useState<string | null>(null);
  const [combinedBuffer, setCombinedBuffer] = useState<string | null>(null);

  const captureBand = (band: '365' | '395', imageData: string) => {
    if (band === '365') {
      setBuffer365(imageData);
      setStatus(buffer395 ? 'DUAL_BUFFER_LOCKED' : 'BUFFER_365_OK');
    } else {
      setBuffer395(imageData);
      setStatus(buffer365 ? 'DUAL_BUFFER_LOCKED' : 'BUFFER_395_OK');
    }
    // Clear combined buffer if manual capture is used
    setCombinedBuffer(null);
  };

  const uploadCombinedImage = (imageData: string) => {
    setCombinedBuffer(imageData);
    setBuffer365(null);
    setBuffer395(null);
    setStatus('COMBINED_BUFFER_READY');
  };

  const executeDualScan = async (solvent: SolventType, filterMaterial: FilterMaterial, matrix: MatrixType) => {
    if (!combinedBuffer && (!buffer365 || !buffer395)) return;

    setIsScanning(true);
    setIsGeminiLoading(true);
    setGeminiAnalysis(null);
    setErrorState(null);

    try {
      const primaryImg = combinedBuffer || buffer365 || "";

      // Step 1: TinyML Substrate Validation Check
      setStatus('ALPHA_ANCHORING'); // UI Status update
      const isTLCPaperValidated = await checkIsTLCPaper(primaryImg);

      if (!isTLCPaperValidated) {
        // If TinyML cannot validate the substrate, immediately fail and DO NOT proceed to other steps.
        setDetections([]);
        setGeminiAnalysis(null);
        setErrorState({
          type: 'SUBSTRATE_INVALID',
          reason: 'The AI / TinyML model determined that the uploaded photograph does not match the visual signature of a flatly laid down Thin-Layer Chromatography (TLC) plate or chromatography paper. Alignment, centering, or illumination might be incorrect.',
          icon: 'warning'
        });
        setIsScanning(false);
        setIsGeminiLoading(false);
        setStatus('SYSTEM_READY');
        return;
      }

      // Step 2: Deterministic Analysis (CV + Math) - ONLY reached if validated
      const context: ScanContext = { uv365: true, uv395: true, solvent, filterMaterial, matrix };
      
      const results = await performSpectralAnalysis(
        primaryImg, 
        combinedBuffer ? null : buffer395, 
        context
      );
      
      setDetections(results);

      // Step 3: Multimodal Gemini 3.5 Flash Forensic Class Analysis - Skip if no detections
      if (results.length === 0) {
        setGeminiAnalysis({
            isTLCPaper: true,
            confidenceScores: [],
            classesDetected: [],
            visualObservations: "No spectral bands detected.",
            forensicVerdict: 'CLEAN',
            suggestedSOP: "No substances detected.",
            detailedReportMarkdown: "No substances detected in spectral analysis."
        });
        setIsScanning(false);
        setIsGeminiLoading(false);
        setStatus('SYSTEM_READY');
        return;
      }

      try {
        const primaryImg = combinedBuffer || buffer365 || "";
        const secondaryImg = combinedBuffer ? null : buffer395;

        // Strip data:image/...;base64, header prefix if present
        const cleanBase64 = (b64: string) => b64.includes(',') ? b64.split(',')[1] : b64;

        let response;
        try {
          console.log("Querying local Express proxy for Gemini analysis...");
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 35000);

          response = await fetch("/api/gemini-analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              image: cleanBase64(primaryImg),
              image395: secondaryImg ? cleanBase64(secondaryImg) : null,
              detections: results,
              solvent,
              matrix
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Local proxy endpoint returned status: ${response.status}`);
          }
        } catch (localErr) {
          console.warn("Local Express proxy failed. Falling back to Cloudflare edge worker...", localErr);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);

          response = await fetch("https://purple-canary-edge-analysis.michael-hoyt.workers.dev", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              image: cleanBase64(primaryImg),
              image395: secondaryImg ? cleanBase64(secondaryImg) : null,
              detections: results,
              solvent,
              matrix
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error("Cloudflare edge worker returned status: " + response.status);
          }
        }

        const reportData: GeminiAnalysisResult = await response.json();
        setGeminiAnalysis(reportData);
      } catch (geminiErr) {
        console.error("Gemini analysis edge query failed:", geminiErr);
        // Resilient fallback report to ensure high-craftsmanship user experience offline
        setGeminiAnalysis({
          isTLCPaper: true,
          confidenceScores: [
            { 
              category: results.length > 0 ? "Identified Organic Classes" : "Unknown Plant Matrix / Noise", 
              score: results.length > 0 ? 80 : 15, 
              rationale: "Analysis generated locally from mathematical Rf calibration peaks." 
            },
            { 
              category: "Adulterants / Impurities", 
              score: results.some(r => r.hazard !== 'SAFE') ? 60 : 5, 
              rationale: "Determined from spectral analysis." 
            }
          ],
          classesDetected: results.map(r => r.name),
          visualObservations: "Visible spots located around calibrated chromatography bands.",
          forensicVerdict: results.some(r => r.hazard === 'LETHAL') ? 'CRITICAL' : results.length > 0 ? 'WARNING' : 'CLEAN',
          suggestedSOP: "No server response. Proceed to GC-MS validation.",
          detailedReportMarkdown: `### LOCAL SPECTRAL REPORT\n\n*A server-side connection exception occurred. Rendering local chromatographic details.*\n\n- **Verdict**: ${results.length > 0 ? 'WARNING / SUSPICIOUS' : 'CLEAN'}\n- **Local Detections**: ${results.map(r => r.name).join(", ") || "None detected"}\n\n**System Notice**: Please check your server-side API key configuration under Settings > Secrets.`
        });
      }
      
      setIsScanning(false);
      setIsGeminiLoading(false);
      setStatus('SYSTEM_READY'); 
      
      // Save to Firebase Firestore
      const identity = await getOrCreateIdentity();
      const publicKey = identity.publicKey;
      const isLethal = results.some(r => r.hazard === 'LETHAL');
      const isRisky = results.some(r => ['HIGH', 'CRITICAL', 'MEDIUM'].includes(r.hazard));
      const verdict = isLethal ? 'LETHAL' : isRisky ? 'HIGH RISK' : 'CLEAN';
      
      const scanPayload: any = {
        date: new Date().toISOString().split('T')[0],
        location: 'Field Lab Alpha',
        matrix,
        verdict,
        detections: results.map(r => ({
          name: r.name,
          hazard: r.hazard,
          rf: r.rf,
          hex: r.hex
        }))
      };

      if (geminiAnalysis && 'shortDescription' in geminiAnalysis) {
          scanPayload.shortDescription = (geminiAnalysis as any).shortDescription;
      }
      if (geminiAnalysis && 'longDescription' in geminiAnalysis) {
          scanPayload.longDescription = (geminiAnalysis as any).longDescription;
      }

      saveScanRecord(publicKey, scanPayload).catch(e => console.error("Failed to save scan record:", e));
      
    } catch (e) {
      console.error(e);
      setStatus('SYSTEM_READY');
      setIsScanning(false);
      setIsGeminiLoading(false);
    }
  };

  const executeTestScan = async (solvent: SolventType, filterMaterial: FilterMaterial, matrix: MatrixType) => {
    setIsScanning(true); 
    setIsGeminiLoading(true);
    setStatus('ALPHA_ANCHORING'); 
    setErrorState(null);
    setDetections([]);
    setGeminiAnalysis(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockDetections: Detection[] = [{
        id: "TEST_SAMPLE",
        name: "Simulated Test Sample",
        category: "BENIGN",
        rf: 0.5,
        hex: "#00FF00",
        shift: "STATIC",
        hazard: "SAFE",
        desc: "Simulated data for UI check.",
        potency: 99.9
      }];
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDetections(mockDetections); 
      setGeminiAnalysis({
        isTLCPaper: true,
        confidenceScores: [
          { category: "Test Organic Standard", score: 95, rationale: "Aligned exactly with standard calibration marker Rf 0.5." },
          { category: "Banned Adulterants", score: 0, rationale: "No secondary quenching fronts observed." }
        ],
        classesDetected: ["Simulated Test Standard"],
        visualObservations: "Calibrated green fluorescent marker zone visible at Rf ~0.50.",
        forensicVerdict: "CLEAN",
        suggestedSOP: "Standard protocol passed. No secondary purification required.",
        detailedReportMarkdown: `### MOCK TESTING CONFIDENCE REPORT\n\n**Visual Chromatography Details**:\nHighly resolved, singular fluorescent band in the center lane matching standard reference RF 0.50. Extremely clean background with no signs of trailing or secondary organic matrices.`
      });

      setIsScanning(false); 
      setIsGeminiLoading(false);
      setStatus('SYSTEM_READY'); 

      // Save scan record
      const identity = await getOrCreateIdentity();
      const publicKey = identity.publicKey;
      saveScanRecord(publicKey, {
        date: new Date().toISOString().split('T')[0],
        location: 'Simulated Environment',
        matrix,
        verdict: 'CLEAN',
        detections: mockDetections.map(r => ({
          name: r.name,
          hazard: r.hazard,
          rf: r.rf,
          hex: r.hex
        }))
      });
      
    } catch (e) {
      console.error(e);
      setStatus('SYSTEM_READY');
      setIsScanning(false);
      setIsGeminiLoading(false);
      setErrorState({ type: 'TEST_FAIL', reason: 'Simulation Failed', icon: 'person_off' });
    }
  };

  const resetScan = () => {
    setErrorState(null);
    setBuffer365(null);
    setBuffer395(null);
    setCombinedBuffer(null);
    setDetections([]);
    setGeminiAnalysis(null);
    setIsGeminiLoading(false);
    setStatus('SYSTEM_READY');
  };

  return {
    status,
    setStatus,
    detections,
    geminiAnalysis,
    isGeminiLoading,
    isScanning,
    errorState,
    buffer365,
    buffer395,
    combinedBuffer,
    captureBand,
    uploadCombinedImage,
    executeDualScan,
    executeTestScan,
    resetScan
  };
};
