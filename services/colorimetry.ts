
// Spectral Math Engine (Beta Modular Spec)
// Handles RGB->Lab conversion, Delta-E calculation, and Void Detection

interface RGB { r: number; g: number; b: number; }
interface Lab { l: number; a: number; b: number; }

/**
 * Converts Hex string to RGB object
 */
export const hexToRgb = (hex: string): RGB => {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
};

/**
 * Converts RGB numbers to Hex string
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).toUpperCase();
};

/**
 * Converts RGB to CIE Lab color space for perceptual distance calculation
 */
export const rgbToLab = (rgb: RGB): Lab => {
  let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  
  // Inverse sRGB Companding
  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // XYZ Transformation
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

  // XYZ to Lab
  x /= 95.047; y /= 100.000; z /= 108.883;
  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + (16/116);
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + (16/116);
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + (16/116);

  return {
    l: (116 * y) - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
};

/**
 * Calculates Euclidean Distance (Delta E 76) between two colors
 * Used for reducing false positives by establishing a tolerance sphere.
 */
export const calculateDeltaE = (hex1: string, hex2: string): number => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);

  return Math.sqrt(
    Math.pow(lab2.l - lab1.l, 2) +
    Math.pow(lab2.a - lab1.a, 2) +
    Math.pow(lab2.b - lab1.b, 2)
  );
};

/**
 * Detects "The Void" (Heavy Metals)
 * Checks if a color is critically dark (absorbing UV).
 * Threshold: Luminance < 5%
 */
export const isVoid = (hex: string): boolean => {
  const { r, g, b } = hexToRgb(hex);
  // Perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance < 12; // Approx 5% of 255
};

/**
 * Calibrate Observed Color against Background (White Point)
 * Subtracts the background shift to normalize the reading (Beta Spec).
 */
export const normalizeColor = (observedHex: string, backgroundHex: string): string => {
  const obs = hexToRgb(observedHex);
  const bg = hexToRgb(backgroundHex);
  
  // Simple subtraction normalization (clamped)
  // Ideally this would be done in Lab space, but RGB diff is a decent heuristic for Beta
  const norm = {
    r: Math.min(255, Math.max(0, obs.r - (bg.r - 255))), // shift relative to pure white
    g: Math.min(255, Math.max(0, obs.g - (bg.g - 255))),
    b: Math.min(255, Math.max(0, obs.b - (bg.b - 255)))
  };

  return rgbToHex(norm.r, norm.g, norm.b);
};
