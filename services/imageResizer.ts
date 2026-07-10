/**
 * Utility to resize a base64 image (PNG/JPEG) to a maximum dimension
 * to prevent Out-Of-Memory (OOM) browser crashes on mobile devices.
 */
export const resizeImageBase64 = (
  base64Src: string,
  maxDimension: number = 1024
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // Support either pure base64 or complete data-URI
    if (base64Src.startsWith('data:')) {
      img.src = base64Src;
    } else {
      // Determine prefix based on first characters (standard base64 signature)
      const prefix = base64Src.startsWith('/9j/') 
        ? 'data:image/jpeg;base64,' 
        : 'data:image/png;base64,';
      img.src = `${prefix}${base64Src}`;
    }

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Only downscale if the image exceeds the threshold
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      } else {
        // Already small, return the cleaned raw base64
        const cleanBase64 = base64Src.includes(',') ? base64Src.split(',')[1] : base64Src;
        resolve(cleanBase64);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Return as PNG base64 for consistency across the application
      const dataUrl = canvas.toDataURL('image/png');
      const cleanBase64 = dataUrl.split(',')[1];
      resolve(cleanBase64);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for resizing"));
    };
  });
};
