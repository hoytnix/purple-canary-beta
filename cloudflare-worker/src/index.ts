export interface Env {
  GEMINI_API_KEY?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 1. Handle CORS Preflight Options request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: CORS_HEADERS,
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Only POST method is supported." }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      });
    }

    try {
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "GEMINI_API_KEY is not bound. Please configure it in your Wrangler secrets." }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...CORS_HEADERS,
            },
          }
        );
      }

      // 2. Parse payload
      const payload: any = await request.json();
      const { image, image395, detections, solvent, matrix } = payload;

      if (!image) {
        return new Response(JSON.stringify({ error: "Missing required primary image (365nm)." }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        });
      }

      // 3. Assemble Gemini REST API content parts
      const cleanBase64 = (b64: string) => (b64.includes(",") ? b64.split(",")[1] : b64);

      const parts: any[] = [];

      // Primary 365nm image
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: cleanBase64(image),
        },
      });

      // Optional secondary 395nm image
      if (image395) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: cleanBase64(image395),
          },
        });
      }

      // Text prompt mapping the physical TLC plate data
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
- Solvent: ${solvent || "Limonene (Organic)"}
- Matrix Type: ${matrix || "Solid Crystal"}

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

Return your output strictly matching the provided JSON schema. Ensure confidence scores are realistic (no 100% unless matching extremely clean, known controls).
`;

      parts.push({ text: promptText });

      // 4. Fire the HTTP request directly to Gemini API with robust retries
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      let attempts = 3;
      let delay = 1000;
      let geminiResponse: Response | null = null;

      for (let i = 0; i < attempts; i++) {
        try {
          geminiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: parts,
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    isTLCPaper: { type: "BOOLEAN" },
                    confidenceScores: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          category: { type: "STRING" },
                          score: { type: "NUMBER" },
                          rationale: { type: "STRING" },
                        },
                        required: ["category", "score", "rationale"],
                      },
                    },
                    classesDetected: {
                      type: "ARRAY",
                      items: { type: "STRING" },
                    },
                    visualObservations: { type: "STRING" },
                    forensicVerdict: { type: "STRING" },
                    suggestedSOP: { type: "STRING" },
                    detailedReportMarkdown: { type: "STRING" },
                  },
                  required: [
                    "isTLCPaper",
                    "confidenceScores",
                    "classesDetected",
                    "visualObservations",
                    "forensicVerdict",
                    "suggestedSOP",
                    "detailedReportMarkdown",
                  ],
                },
              },
            }),
          });

          // Check if retry is needed for transient status codes (503 Service Unavailable, 429 Too Many Requests)
          if ((geminiResponse.status === 503 || geminiResponse.status === 429) && i < attempts - 1) {
            console.warn(`Edge Worker: Transient Gemini API error status ${geminiResponse.status}. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
          break; // Success or non-transient status code
        } catch (fetchErr: any) {
          if (i < attempts - 1) {
            console.warn(`Edge Worker: Fetch failed. Retrying in ${delay}ms...`, fetchErr);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
          throw fetchErr;
        }
      }

      if (!geminiResponse) {
        return new Response(JSON.stringify({ error: "Failed to query Gemini API after multiple attempts." }), {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        });
      }

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        return new Response(
          JSON.stringify({ error: `Gemini API responded with status ${geminiResponse.status}`, details: errorText }),
          {
            status: 502,
            headers: {
              "Content-Type": "application/json",
              ...CORS_HEADERS,
            },
          }
        );
      }

      const rawResult: any = await geminiResponse.json();
      const contentText = rawResult?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!contentText) {
        return new Response(JSON.stringify({ error: "Empty reply or unexpected structure from Gemini API." }), {
          status: 502,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        });
      }

      // Parse text into JSON
      const parsedData = JSON.parse(contentText);

      return new Response(JSON.stringify(parsedData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Internal processing error", message: err?.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      });
    }
  },
};
