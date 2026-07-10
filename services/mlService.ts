
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';

// Backend State
let isBackendReady = false;

/**
 * Initialize the TensorFlow.js backend. We prioritize native WebGL and CPU backends
 * to avoid downloading heavy WASM binaries from CDNs on mobile/flaky networks,
 * and we wrap tf.ready() inside try-catch to guarantee clean fallbacks.
 */
export const initTFBackend = async () => {
  if (isBackendReady) return;
  
  // Try WebGL first (native, fast, GPU-accelerated, zero network requests)
  try {
    await tf.setBackend('webgl');
    await tf.ready();
    isBackendReady = true;
    console.log("TinyML Backend: WebGL Initialized");
    return;
  } catch (e) {
    console.warn("TinyML WebGL backend failed to initialize, trying CPU...", e);
  }

  // Try CPU second (native, highly compatible, zero network requests)
  try {
    await tf.setBackend('cpu');
    await tf.ready();
    isBackendReady = true;
    console.log("TinyML Backend: CPU Initialized");
    return;
  } catch (e) {
    console.error("TinyML CPU backend failed to initialize, trying WASM as last resort...", e);
  }

  // Try WASM as a last resort
  try {
    await tf.setBackend('wasm');
    await tf.ready();
    isBackendReady = true;
    console.log("TinyML Backend: WASM Initialized");
  } catch (e) {
    console.error("All TensorFlow.js backends failed to initialize", e);
    // Force backend ready flag to prevent infinite waiting/loops
    isBackendReady = true;
  }
};

export interface TensorBlob {
    y: number;
    height: number;
    color: { r: number; g: number; b: number };
    luminance: number;
    saturation: number;
    canvasHeight: number;
}

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Runs a 1D Tensor Signal Analysis on the provided image data.
 * Replaces traditional CV loops with vectorized operations.
 */
export const runSpectralInference = async (imageData: ImageData): Promise<TensorBlob[]> => {
  await initTFBackend();

  // Use tf.tidy to automatically clean up intermediate tensors and prevent memory leaks
  return tf.tidy(() => {
    // 1. Ingest Image as Tensor [Height, Width, Depth]
    const pixels = tf.browser.fromPixels(imageData);
    const h = pixels.shape[0];
    const w = pixels.shape[1];

    // 2. Define Region of Interest (ROI) - Center or Dynamic Column Strip
    // If the image is wide or square (likely containing off-center or side-by-side strips),
    // we dynamically detect the column containing the highest vertical variance (active chromatography bands).
    const roiWidth = Math.max(Math.floor(w * 0.15), 15); 
    let xStart = Math.floor((w - roiWidth) / 2);

    const numCols = 40;
    const smallPixels = tf.image.resizeBilinear(pixels, [h, numCols]); // Downsample width for rapid vector math
    const colR = smallPixels.slice([0, 0, 0], [h, numCols, 1]).squeeze([2]);
    const colG = smallPixels.slice([0, 0, 1], [h, numCols, 1]).squeeze([2]);
    const colB = smallPixels.slice([0, 0, 2], [h, numCols, 1]).squeeze([2]);
    const colLuma = colR.mul(0.299).add(colG.mul(0.587)).add(colB.mul(0.114)); // [h, numCols]

    const colMean = colLuma.mean(0); // [numCols]
    const colVariance = colLuma.sub(colMean).square().mean(0); // [numCols]

    // If it's a wide image (aspect ratio > 0.6), we assume there might be dual side-by-side strips (e.g. 365 vs 395).
    // The left strip is usually the primary 365nm channel we want to match against the reference library.
    // Thus, we slice the left 55% of columns to search for the primary active strip.
    let searchCols = colVariance;
    if (w / h > 0.6) {
      const searchLimit = Math.floor(numCols * 0.55);
      searchCols = colVariance.slice([0], [searchLimit]);
    }

    const bestColIndex = searchCols.argMax().dataSync()[0];
    const xCenter = Math.floor(((bestColIndex + 0.5) / numCols) * w);
    xStart = Math.max(0, Math.min(xCenter - Math.floor(roiWidth / 2), w - roiWidth));
    
    // Crop: [y, x, depth] -> [h, roiWidth, 3]
    const centerStrip = pixels.slice([0, xStart, 0], [h, roiWidth, 3]);

    // 3. Dimensionality Reduction (Collapse Width) -> 1D Signal
    // Calculate mean across the width axis (axis 1) to reduce noise
    const signal = centerStrip.mean(1); // Shape: [h, 3]

    // 4. Feature Extraction: Saturation & Luminance Vectors
    const rgb = signal.split(3, 1);
    const r = rgb[0].squeeze();
    const g = rgb[1].squeeze();
    const b = rgb[2].squeeze();

    // Calculate Luminance (Perceived brightness standard weights)
    // L = 0.299*R + 0.587*G + 0.114*B
    const luma = r.mul(0.299).add(g.mul(0.587)).add(b.mul(0.114));

    // Calculate Saturation (Simple Approx: (Max - Min) / Max)
    const maxVal = signal.max(1);
    const minVal = signal.min(1);
    const delta = maxVal.sub(minVal);
    // Add epsilon to avoid div by zero
    const saturation = delta.div(maxVal.add(tf.scalar(1e-5))).mul(255); 

    // 5. Signal Processing / Thresholding
    // We search for "Zones of Interest": High Saturation OR Very Low Luminance (Void)
    const SAT_THRESH = 35; 
    const VOID_THRESH = 18;

    const isHighSat = saturation.greater(SAT_THRESH);
    const isVoid = luma.less(VOID_THRESH);
    const isInterest = isHighSat.logicalOr(isVoid);

    // 6. Cluster Extraction (Blob detection on 1D signal)
    // We sync the mask to CPU to perform the final clustering logic
    const interestData = isInterest.dataSync(); // Int8Array (0 or 1)
    const lumaData = luma.dataSync();
    const signalData = signal.arraySync() as number[][];

    const blobs: TensorBlob[] = [];
    let currentBlob: { yStart: number, pixels: any[] } | null = null;

    for (let y = 0; y < h; y++) {
       if (interestData[y]) {
           if (!currentBlob) {
               currentBlob = { yStart: y, pixels: [] };
           }
           currentBlob.pixels.push({
               r: signalData[y][0],
               g: signalData[y][1],
               b: signalData[y][2],
               l: lumaData[y]
           });
       } else {
           if (currentBlob) {
               // End of blob, process stats
               // Filter small noise (min height 4px)
               if (currentBlob.pixels.length > 4) { 
                   const count = currentBlob.pixels.length;
                   const avgR = currentBlob.pixels.reduce((a, p) => a + p.r, 0) / count;
                   const avgG = currentBlob.pixels.reduce((a, p) => a + p.g, 0) / count;
                   const avgB = currentBlob.pixels.reduce((a, p) => a + p.b, 0) / count;
                   const avgL = currentBlob.pixels.reduce((a, p) => a + p.l, 0) / count;
                   
                   const centerY = currentBlob.yStart + (count / 2);

                   blobs.push({
                       y: centerY,
                       height: count,
                       color: { r: avgR, g: avgG, b: avgB },
                       luminance: avgL,
                       canvasHeight: h,
                       saturation: 0 // Placeholder, handled implicitly
                   });
               }
               currentBlob = null;
           }
       }
    }

    return blobs;
  });
};

/**
 * Uses computer vision heuristics (TensorFlow.js) to detect the bounding box
 * of a vertical chromatography strip within the frame.
 */
export const detectStripBoundingBox = async (imageData: ImageData): Promise<BoundingBox | null> => {
  await initTFBackend();

  return tf.tidy(() => {
    const pixels = tf.browser.fromPixels(imageData);
    
    // 1. Convert to Grayscale & Reduce Resolution for Speed
    // We essentially create a "thumbnail" tensor for detection
    const small = tf.image.resizeBilinear(pixels, [256, 192]); // Resize to [256, 192, 3]
    const gray = small.mean(2); // [h, w]
    
    // 2. Adaptive Thresholding for High Contrast (UV Strip in Dark Room)
    const maxVal = gray.max();
    const threshold = maxVal.mul(0.35); // Keep pixels > 35% of max brightness
    const binary = gray.greater(threshold).cast('float32'); // [h, w]

    // 3. Projection Analysis
    const projX = binary.sum(0); // Sum cols
    const projY = binary.sum(1); // Sum rows

    const xData = projX.dataSync();
    const yData = projY.dataSync();
    const h = 256;
    const w = 192;

    // 4. Find X Bounds (Width)
    let minX = -1, maxX = -1;
    // Strip must be at least 5% of width to be valid
    const minW = w * 0.05; 
    
    for(let i=0; i<w; i++) {
        if(xData[i] > (h * 0.1)) { // Column must have at least 10% active pixels
            if (minX === -1) minX = i;
            maxX = i;
        }
    }

    // 5. Find Y Bounds (Height)
    let minY = -1, maxY = -1;
    for(let i=0; i<h; i++) {
        if(yData[i] > (w * 0.05)) { // Row must have at least 5% active width
            if (minY === -1) minY = i;
            maxY = i;
        }
    }

    if (minX === -1 || maxX === -1 || minY === -1 || maxY === -1) {
        return null;
    }

    // 6. Scale coordinates back to original image size
    const scaleX = imageData.width / w;
    const scaleY = imageData.height / h;

    // Apply scaling + Padding
    const finalX = Math.floor(minX * scaleX);
    const finalY = Math.floor(minY * scaleY);
    const finalW = Math.floor((maxX - minX) * scaleX);
    const finalH = Math.floor((maxY - minY) * scaleY);

    // Aspect Ratio Check: A TLC strip must be tall and thin
    if (finalH < finalW * 3.0) { 
        return null;
    }

    // Add safe padding (10%)
    const padX = Math.floor(finalW * 0.1);
    const padY = Math.floor(finalH * 0.05);

    return {
        x: Math.max(0, finalX - padX),
        y: Math.max(0, finalY - padY),
        width: Math.min(imageData.width - (finalX - padX), finalW + (padX * 2)),
        height: Math.min(imageData.height - (finalY - padY), finalH + (padY * 2))
    };
  });
};
