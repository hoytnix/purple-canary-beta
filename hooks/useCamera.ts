import { useState, useEffect, useCallback, useRef } from 'react';

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);

  // Sync stream to ref
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  const startCamera = useCallback(async () => {
    // If stream exists and is active, we don't need to request again
    const activeStream = streamRef.current;
    if (activeStream && activeStream.active) {
       setCameraActive(true);
       return;
    }

    try {
      // Attempt high resolution first
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 4032 }, 
          height: { ideal: 3024 } 
        } 
      });
      
      setStream(s);
      setCameraActive(true); 
      setCameraError(false);
    } catch (err) { 
      console.error("Camera Hardware Error (High Res):", err);
      // Fallback to basic constraints if high res fails
      try {
           const s = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: 'environment' } 
           });
           setStream(s);
           setCameraActive(true);
           setCameraError(false);
      } catch (fallbackErr) {
           console.error("Camera Hardware Error (Fallback):", fallbackErr);
           setCameraError(true);
      }
    }
  }, []);

  const captureImage = (videoElement: HTMLVideoElement | null): string | null => {
    if (!videoElement) return null;
    
    // Safety check for readyState and dimensions to prevent drawImage errors
    if (videoElement.readyState !== 4 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.warn("Camera not ready for capture");
      return null;
    }
    
    // Capped maximum dimension (1024px) for low memory footprint on mobile devices
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
    
    if (ctx) {
      try {
        ctx.drawImage(videoElement, 0, 0, width, height);
        // Return base64 string without data prefix
        return canvas.toDataURL('image/png').split(',')[1];
      } catch (e) {
        console.error("Capture failed during drawImage", e);
        return null;
      }
    }
    return null;
  };

  const stopCamera = useCallback(() => {
    const activeStream = streamRef.current;
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  }, []);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      const activeStream = streamRef.current;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return { 
    stream,
    cameraActive, 
    cameraError, 
    startCamera,
    stopCamera,
    captureImage
  };
};