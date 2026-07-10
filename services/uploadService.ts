export const processUrlUpload = async (url: string): Promise<string> => {
  const tryFetch = async (fetchUrl: string) => {
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    return res.blob();
  };

  let blob: Blob | null = null;

  // Strategy 1: CORS Proxy
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    blob = await tryFetch(proxyUrl);
  } catch (e) {
    console.warn("Primary proxy failed, trying secondary...");
  }

  // Strategy 2: AllOrigins
  if (!blob) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      blob = await tryFetch(proxyUrl);
    } catch (e) {
      console.warn("Secondary proxy failed, trying direct...");
    }
  }

  // Strategy 3: Direct Fetch (CORS friendly sources)
  if (!blob) {
    try {
      blob = await tryFetch(url);
    } catch (e) {
      throw new Error("Failed to load image. CORS blocked or invalid URL.");
    }
  }

  if (!blob || !blob.type.startsWith('image/')) {
    throw new Error("URL is not a valid image");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Return raw base64 without data URI prefix for consistency with camera capture
        const base64 = result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to process image data"));
      }
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(blob as Blob);
  });
};