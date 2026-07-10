

export interface StepData {
  step: number;
  color: string;
  title: string;
  text: string;
}

export interface ExpertItem {
  subtitle: string;
  text: string;
  icon?: string; // Material Icon Name
  alert?: boolean;
  highlight?: string;
}

export interface ExpertSection {
  title: string;
  icon: string; // Material Icon Name
  color: string;
  items: ExpertItem[];
}

export const BASIC_STEPS: StepData[] = [
  { 
    step: 1, 
    color: "blue", 
    title: "The Oil Filter", 
    text: "MANDATORY: Dissolve sample in Purple Canary Solution (D-Limonene). This filters out Sugar & Salt (Benign Cuts) which will not move, leaving only the active compounds to run." 
  },
  { 
    step: 2, 
    color: "purple", 
    title: "The Turmeric Anchor", 
    text: "CRITICAL Beta STEP: Apply 1 drop of 0.5% Turmeric/Limonene Solution (The 'Canary' Standard) to the bottom right. Intense Yellow-Green Fluorescence anchors the AI's optical engine." 
  },
  { 
    step: 3, 
    color: "green", 
    title: "The Linear Race", 
    text: "Use a rectangular strip, not a circle. Dip the bottom edge. Chemicals sprint vertically. Gravity and Physics separate the poisons from the cure." 
  },
  { 
    step: 4, 
    color: "orange", 
    title: "The Void Check", 
    text: "Scan with Dual-UV. If you see a Pitch Black Spot (The Void) that eats light, it is Heavy Metal (Lead). LETHAL. Do not consume." 
  }
];

export const EXPERT_SECTIONS: ExpertSection[] = [
  {
    title: "Sec 1: The Geometry Shift",
    icon: 'straighten',
    color: "blue",
    items: [
      {
        subtitle: "Rectangular vs Circular",
        text: "Abandon radial diffusion. Use vertical strips (TLC style). Constant velocity = Constant Rf values. Linear physics reduces false positives.",
        icon: 'balance'
      },
      {
        subtitle: "The Control Lane",
        text: "Always run a known standard (Turmeric/Curcumin) in parallel or on the edge. This provides a 'Ground Truth' for the Spectral Engine to normalize lighting conditions.",
        icon: 'anchor'
      }
    ]
  },
  {
    title: "Sec 2: The Hydrophobic Lab",
    icon: 'science',
    color: "orange",
    items: [
      {
        subtitle: "The Solubility Filter",
        text: "We use D-Limonene exclusively. Sugars, Salts, and Pill Binders are Hydrophilic (water-loving). They stay at the origin line. Narcotics are Lipophilic (oil-loving). They move up.",
        icon: 'hexagon'
      },
      {
        subtitle: "Liquid / Vape",
        text: "Viscosity Check. Place 1 drop directly on filter. Wait 2 mins. Vitamin E Acetate appears as a Yellow/Green Halo.",
        icon: 'water_drop'
      },
      {
        subtitle: "Botanical / Flower",
        text: "Cold Wash (30s). IGNORE RED (Chlorophyll). Hunt for NEON GREEN (Pesticide) or GRAY FUZZ (Mold).",
        icon: 'local_florist'
      }
    ]
  },
  {
    title: "Sec 3: Spectral Interpretation",
    icon: 'document_scanner',
    color: "purple",
    items: [
      {
        subtitle: "Relative Normalization",
        text: "The AI no longer looks for exact Hex codes. It calculates Euclidean Distance relative to the paper's 'White Point'. Lighting conditions matter less."
      },
      {
        subtitle: "The Metallic Void",
        text: "Pitch black areas ($R_f$ 0.00-0.05). Heavy metals (Lead/Arsenic) kill light. LETHAL.",
        alert: true,
        highlight: "LETHAL"
      }
    ]
  }
];