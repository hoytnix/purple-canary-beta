
import { runSpectralInference, detectStripBoundingBox } from './mlService';

export interface RawSpot {
  y: number;
  height: number;
  color: { r: number; g: number; b: number };
  luminance: number;
  saturation: number;
  canvasHeight: number;
}

/**
 * THE EYES (TinyML Powered)
 * Orchestrates the TensorFlow.js inference on the image bitmap.
 */
export const scanImageBitmap = async (base64: string): Promise<RawSpot[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `data:image/png;base64,${base64}`;
    
    img.onload = async () => {
      try {
        // Prepare canvas for Tensor ingestion
        const canvas = document.createElement('canvas');
        // We downscale slightly for inference speed if image is huge, but keep aspect ratio
        // For standard analysis, 500px height is sufficient resolution
        const scale = 500 / img.height;
        const w = Math.floor(img.width * scale); 
        const h = 500; 
        
        canvas.width = w;
        canvas.height = h;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas context failure");

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, w, h);
        
        // Extract ImageData for TF.js
        const imageData = ctx.getImageData(0, 0, w, h);
        
        // RUN TINYML INFERENCE
        const tensorBlobs = await runSpectralInference(imageData);
        
        resolve(tensorBlobs);
      } catch (e) {
        console.error("Tensor inference failed", e);
        reject(e);
      }
    };
    
    img.onerror = () => reject("Image load failed");
  });
};

/**
 * Uses TinyML to detect the TLC strip and auto-crop the video feed.
 */
export const getSmartCrop = async (videoElement: HTMLVideoElement): Promise<string | null> => {
    if (videoElement.readyState !== 4 || videoElement.videoWidth === 0) return null;

    const MAX_DIM = 1024;
    let width = videoElement.videoWidth;
    let height = videoElement.videoHeight;

    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      } else {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(videoElement, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    return processCrop(canvas, imageData);
};

/**
 * Uses TinyML to detect the TLC strip and auto-crop a base64 static image.
 */
export const smartCropBase64 = async (base64: string): Promise<string | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = `data:image/png;base64,${base64}`;
        img.onload = async () => {
             const MAX_DIM = 1024;
             let width = img.width;
             let height = img.height;

             if (width > MAX_DIM || height > MAX_DIM) {
               if (width > height) {
                 height = Math.round((height * MAX_DIM) / width);
                 width = MAX_DIM;
               } else {
                 width = Math.round((width * MAX_DIM) / height);
                 height = MAX_DIM;
               }
             }

             const canvas = document.createElement('canvas');
             canvas.width = width;
             canvas.height = height;
             const ctx = canvas.getContext('2d');
             if(!ctx) { resolve(null); return; }
             
             ctx.drawImage(img, 0, 0, width, height);
             const imageData = ctx.getImageData(0, 0, width, height);
             
             try {
                 const result = await processCrop(canvas, imageData);
                 resolve(result);
             } catch(e) {
                 resolve(null);
              }
         };
         img.onerror = () => resolve(null);
     });
 };

// Internal Helper to DRY up crop logic
const processCrop = async (sourceCanvas: HTMLCanvasElement, imageData: ImageData): Promise<string | null> => {
    try {
        const bbox = await detectStripBoundingBox(imageData);
        if (!bbox) return null;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = bbox.width;
        cropCanvas.height = bbox.height;
        const cropCtx = cropCanvas.getContext('2d');
        if (!cropCtx) return null;

        cropCtx.drawImage(
            sourceCanvas, 
            bbox.x, bbox.y, bbox.width, bbox.height, 
            0, 0, bbox.width, bbox.height
        );

        return cropCanvas.toDataURL('image/png').split(',')[1];
    } catch (e) {
        console.error("Smart Crop Detection Failed", e);
        return null;
    }
};

/**
 * Validates if the image actually contains a flat TLC paper strip.
 * Returns true if a valid strip bounding box is detected by TinyML.
 */
export const checkIsTLCPaper = async (base64: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
        img.onload = async () => {
            try {
                const canvas = document.createElement('canvas');
                const scale = 500 / img.height;
                const w = Math.floor(img.width * scale);
                const h = 500;
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(false); return; }
                ctx.drawImage(img, 0, 0, w, h);
                const imageData = ctx.getImageData(0, 0, w, h);
                const bbox = await detectStripBoundingBox(imageData);
                resolve(bbox !== null);
            } catch (e) {
                console.error("Error in checkIsTLCPaper check:", e);
                resolve(false);
            }
        };
        img.onerror = () => resolve(false);
    });
};
