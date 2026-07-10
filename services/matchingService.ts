
import { 
    ALPHA_LIBRARY,
    ANCHORS_AND_CONTROLS,
    CUTTING_AGENTS,
    OPIOIDS,
    FENTANYLS_AND_ZENE,
    BENZODIAZEPINES,
    STIMULANTS,
    PSYCHEDELICS,
    DISSOCIATIVES,
    SYNTHETIC_CANNABINOIDS,
    MATRIX_CONTAMINANTS,
    CHEMICAL_HAZARDS
} from '../constants/index';
import { Detection } from '../types';
import { calculateDeltaE, rgbToHex } from './colorimetry';

interface MatchCandidate {
    y: number; // Raw pixel Y
    canvasHeight: number;
    color: { r: number; g: number; b: number };
    luminance: number;
}

/**
 * THE LEDGER (Deterministic)
 * Matches geometry and color against the known database.
 * Aggregates findings into broader substance classes with a match confidence rating.
 */
export const matchSignatures = (spots: MatchCandidate[]): Detection[] => {
    const detections: Detection[] = [];

    spots.forEach(spot => {
        // 1. Calculate Rf (0.0 at bottom, 1.0 at top)
        // In Canvas, 0 is top, height is bottom.
        // Forensic Rf: Distance traveled from origin / Distance of solvent front.
        // We approximate origin at 90% height, front at 10% height.
        const originY = spot.canvasHeight * 0.90;
        const frontY = spot.canvasHeight * 0.10;
        const travelSpan = originY - frontY;
        const spotTravel = originY - spot.y;
        
        let rf = spotTravel / travelSpan;
        rf = Math.max(0, Math.min(1, rf)); // Clamp

        const hex = rgbToHex(spot.color.r, spot.color.g, spot.color.b);
        const isVoid = spot.luminance < 20;

        if (isVoid) {
            detections.push({
                id: "UNKNOWN_VOID",
                name: "Toxic Hazards & Quenched Voids",
                category: "HAZARDS",
                rf: rf,
                hex: "#000000",
                shift: "VOID",
                hazard: "LETHAL",
                desc: "Highly toxic chemical contaminants, lethal heavy metal traces, or complete UV quenching zones representing dangerous impurities.",
                potency: 98.0 // High confidence of hazardous void presence
            });
            return;
        }

        // 2. Find closest match in Library
        let bestMatch: any = null;
        let bestScore = Infinity; // Lower is better

        ALPHA_LIBRARY.forEach(sig => {
            // Rf Weight: High importance. Tolerance +/- 0.05
            const rfDiff = Math.abs(sig.rf - rf);
            
            // Color Weight: Euclidean distance
            const colorDist = calculateDeltaE(hex, sig.hex);
            
            // Composite Score (Adjust weights as needed for vAlpha)
            // If Rf is way off (>0.1), score penalizes heavily
            if (rfDiff > 0.1) return;

            const score = (rfDiff * 1000) + colorDist;

            if (score < bestScore) {
                bestScore = score;
                bestMatch = sig;
            }
        });

        if (bestMatch && bestScore < 150) { // Threshold for "Match"
             const confidence = Math.max(50, 100 - (bestScore / 3)); // Calculate match confidence score
             
             // Map to broader Substance Class
             let className = "Unidentified Substance Class";
             let classDesc = "Signature not found in Signature Library.";
             let classCategory = bestMatch.category;
             let classHazard = bestMatch.hazard;

             const matchId = bestMatch.id;
             if (FENTANYLS_AND_ZENE.some(f => f.id === matchId)) {
                 className = "Highly Potent Synthetic Opioids (Fentanyls/Zenes)";
                 classDesc = "Chromatographic bands exhibiting the precise Rf displacement and dual-UV quenching profiles characteristic of synthetic mu-opioid receptor agonists (fentanyls, nitazenes, or related ultra-potent analogs).";
             } else if (OPIOIDS.some(o => o.id === matchId)) {
                 className = "Opiates & Semi-Synthetic Analgesics";
                 classDesc = "Spectral markers consistent with natural poppy-derived alkaloids or semi-synthetic diacetylmorphine derivatives.";
             } else if (BENZODIAZEPINES.some(b => b.id === matchId)) {
                 className = "Benzodiazepines & Designer Sedatives";
                 classDesc = "Chromatographic signals corresponding to positive GABA-A channel modulators and prescription/novel tranquilizers.";
             } else if (STIMULANTS.some(s => s.id === matchId)) {
                 className = "CNS Stimulants & Amphetamines";
                 classDesc = "Spectral responses indicating active psycho-stimulants, phenethylamines, or local anesthetics commonly utilized as cocaine stimulants.";
             } else if (PSYCHEDELICS.some(p => p.id === matchId)) {
                 className = "Psychedelic & Entheogenic Compounds";
                 classDesc = "Visual band signals matching tryptamine psychedelics, lysergamides, or entheogenic compounds.";
             } else if (DISSOCIATIVES.some(d => d.id === matchId)) {
                 className = "Dissociative Anesthetics";
                 classDesc = "Arylcyclohexylamine signatures matching NMDA-receptor antagonists and dissociative anesthetic families.";
             } else if (SYNTHETIC_CANNABINOIDS.some(c => c.id === matchId)) {
                 className = "Synthetic Cannabinoids";
                 classDesc = "Signatures consistent with synthetic cannabinoid receptor agonists.";
             } else if (CUTTING_AGENTS.some(ca => ca.id === matchId)) {
                 className = "Pharmacological Cuts & Adulterants";
                 classDesc = "Common active bulking compounds, anti-inflammatory agents, or pharmaceutical fillers used to dilute substances.";
             } else if (MATRIX_CONTAMINANTS.some(mc => mc.id === matchId)) {
                 className = "Synthesis Impurities & Residues";
                 classDesc = "Chemical residues, organic solvent remainders, or transition state impurities resulting from crude manufacturing.";
             } else if (CHEMICAL_HAZARDS.some(ch => ch.id === matchId)) {
                 className = "Toxic Hazards & Corrosives";
                 classDesc = "Highly toxic chemical contaminants, lethal heavy metal traces, or other corrosive industrial materials.";
             } else if (ANCHORS_AND_CONTROLS.some(ac => ac.id === matchId)) {
                 className = "Calibration Anchors & Reference Controls";
                 classDesc = "Standard reference lines (such as Turmeric fluorophores or known neutral controls) utilized by computer vision algorithms to calibrate perspective and lighting.";
             }

             detections.push({
                id: bestMatch.id,
                name: className,
                category: classCategory,
                rf: rf,
                hex: hex,
                shift: bestMatch.shift,
                hazard: classHazard,
                desc: classDesc,
                potency: confidence
             });
        } else {
            // Unidentified Spot
            detections.push({
                id: "UNKNOWN_ANOMALY",
                name: "Unidentified Spectral Anomaly",
                category: "BENIGN",
                rf: rf,
                hex: hex,
                shift: "STATIC",
                hazard: "MEDIUM",
                desc: "A mobile-phase signal was detected but its Rf/UV profile does not closely match any known class in the reference database.",
                potency: 65.0 // Confidence of presence of an active spot
            });
        }
    });

    return detections.sort((a, b) => b.rf - a.rf);
};
