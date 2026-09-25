import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, image395, detections, solvent, matrix } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Missing required primary image data (365nm).' },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();

    const promptText = `
You are the lead analytical chemist and computer vision specialist for the Purple Canary Forensic Analysis Suite (vAlpha). 

CRITICAL FIRST STEP - VALIDITY CHECK:
Before performing any chemical analysis, you must inspect the input image(s) to verify if they actually contain thin-layer chromatography (TLC) plate strips or paper chromatography strips (typically rectangular white/silica sheets, or filter paper circles, under UV or brightfield illumination, showing vertical lanes/channels or development lines).
- If the image does NOT contain a TLC plate or paper (for example, if it shows a sidewalk, floor, furniture, generic background, face, or unrelated objects), you MUST conclude that this is an invalid non-TLC input and set:
  * "isTLCPaper": false
  * "forensicVerdict": "INCONCLUSIVE"
  * "classesDetected": ["INVALID_INPUT"]
  * "confidenceScores": [] (an empty array)
  * "visualObservations": "The captured image does not appear to contain a valid thin-layer chromatography (TLC) plate or paper strip. Refusing analysis."
  * "suggestedSOP": "Please place your TLC plate on a flat, dark, non-reflective surface and capture a clear, well-aligned photo under UV light."
  * "detailedReportMarkdown": "# INCONCLUSIVE TEST REPORT\n\n### CRITICAL VALIDATION FAILURE\n\nThe image analysis system determined that the uploaded photograph does not match the visual signature of a Thin-Layer Chromatography (TLC) plate or chromatography paper. \n\n**Possible Causes**:\n- Camera captured an unrelated background (e.g. floor, sidewalk, hand, workspace clutter).\n- Lighting is insufficient to resolve the boundary of the plate.\n- High specular reflections obscured the substrate.\n\n**Action Required**:\nPlease align the paper strip inside the camera guide rails and ensure it is properly illuminated before running the scan again."

If the image is validated as a TLC plate/paper, then proceed with full chemical analysis:
- "isTLCPaper": true
- Follow the other instructions below.

The user's setup context:
- Solvent: ${solvent || 'Limonene (Organic)'}
- Matrix Type: ${matrix || 'Solid Crystal'}

Our deterministic local CV model analyzed the plate and detected the following spots:
${JSON.stringify(detections || [], null, 2)}

INSTRUCTIONS FOR VALID TLC IMAGES:
1. Visually identify the active chromatography bands on both the 365nm (left) and 395nm/developed (right, if present) strips.
2. Provide confidence scores (0-100%) for compound classes that match the observed bands, Rf positions, and color behavior:
   - "Indoles / Tryptamines / Alkaloids": Harmala alkaloids (Harmine, Harmaline, Tetrahydroharmine) exhibit brilliant blue-cyan fluorescence (Rf ~0.35 - 0.65). Other tryptamines can also fluoresce.
   - "Cannabinoids": Typically require chemical development, but some can show fluorescent or quenching bands.
   - "Phenethylamines / Adulterants": Various synthetic phenethylamines or cutting agents.
   - "Heavy Metals": Look for dark quenching bands or necrosis bands.
   - "Unknown / Matrix Noise": Low confidence background/solvent fronts.
3. Formulate an overall Forensic Verdict based on the risk:
   - "CLEAN" if no dangerous/banned compounds are indicated and bands align with expected benign botanical markers.
   - "WARNING" if unconfirmed/atypical fluorescent bands, heavy matrix noise, or potential benign adulterants are present.
   - "CRITICAL" if high risk contaminants, dangerous phenethylamines, or lethal markers are strongly suggested.
   - "UNKNOWN" if visual data is highly ambiguous or poorly resolved.
4. Author a Suggested SOP (Standard Operating Procedure) recommending concrete next-steps (e.g., recrystallization, secondary mobile phase, GC-MS verification).
5. Generate a beautiful, highly detailed, professional forensic markdown report (\`detailedReportMarkdown\`) complete with sections for 'EXECUTIVE SUMMARY', 'CHROMATOGRAPHIC PROFILE', 'CHEMICAL CLASS ANALYSIS', and 'LABORATORY RECOMMENDATIONS'.

Generate a short description (a few words) for this scan result, and a long description (<420 characters).

Return your output strictly matching the provided JSON schema. Ensure confidence scores are realistic (no 100% unless matching extremely clean, known controls).
`;

    const parts: any[] = [];
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: image,
      },
    });

    if (image395) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: image395,
        },
      });
    }

    parts.push({ text: promptText });

    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];
    let response;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      let delay = 1000;
      const attemptsPerModel = 2;
      let success = false;

      for (let i = 0; i < attemptsPerModel; i++) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isTLCPaper: {
                    type: Type.BOOLEAN,
                    description: 'Whether the image is verified to be a real TLC plate or paper chromatography strip',
                  },
                  confidenceScores: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        category: { type: Type.STRING, description: 'Category of compound class' },
                        score: { type: Type.NUMBER, description: 'Confidence score percentage (0-100)' },
                        rationale: { type: Type.STRING, description: 'Scientific reasoning linking Rf and colors' },
                      },
                      required: ['category', 'score', 'rationale'],
                    },
                  },
                  classesDetected: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  visualObservations: { type: Type.STRING, description: 'Visually apparent bands, colors, and fluorophores' },
                  forensicVerdict: { type: Type.STRING, description: 'CLEAN, WARNING, CRITICAL, INCONCLUSIVE, or UNKNOWN' },
                  suggestedSOP: { type: Type.STRING, description: 'Recommended SOP action' },
                  detailedReportMarkdown: { type: Type.STRING, description: 'Detailed forensic markdown report' },
                  shortDescription: { type: Type.STRING, description: 'A few words describing the scan result, suitable for a card title.' },
                  longDescription: { type: Type.STRING, description: 'A detailed description of the scan result, less than 420 characters.' },
                },
                required: [
                  'isTLCPaper',
                  'confidenceScores',
                  'classesDetected',
                  'visualObservations',
                  'forensicVerdict',
                  'suggestedSOP',
                  'detailedReportMarkdown',
                  'shortDescription',
                  'longDescription',
                ],
              },
            },
          });
          success = true;
          break;
        } catch (err: any) {
          lastError = err;
          const errorMsg = err?.message || '';
          const status = err?.status || err?.statusCode || 0;
          const isTransient =
            status === 503 ||
            status === 429 ||
            errorMsg.includes('503') ||
            errorMsg.includes('429') ||
            errorMsg.includes('high demand') ||
            errorMsg.includes('UNAVAILABLE');

          if (isTransient && i < attemptsPerModel - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          } else {
            break;
          }
        }
      }
      if (success && response) {
        break;
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to get response from Gemini.');
    }

    const reportText = response.text;
    if (!reportText) {
      return NextResponse.json({ error: 'Gemini returned empty analysis response.' }, { status: 500 });
    }

    const reportJson = JSON.parse(reportText);
    return NextResponse.json(reportJson);
  } catch (error: any) {
    console.error('Gemini analysis error:', error);
    return NextResponse.json(
      { error: error?.message || 'An internal error occurred during Gemini analysis.' },
      { status: 500 }
    );
  }
}
