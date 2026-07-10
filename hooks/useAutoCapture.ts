
import React, { useState, useEffect, useRef } from 'react';

interface UseAutoCaptureProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isEnabled: boolean;
  isLevel: boolean; // New prop for Gyro-Lock
  onCapture: () => void;
  cooldown?: number; // ms
}

export const useAutoCapture = ({ videoRef, isEnabled, isLevel, onCapture, cooldown = 2000 }: UseAutoCaptureProps) => {
  const [stability, setStability] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const lastCaptureTime = useRef<number>(0);
  const processingRef = useRef<number | null>(null);
  const lastFrameData = useRef<Uint8ClampedArray | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      setStability(0);
      setIsLocked(false);
      if (processingRef.current) {
        cancelAnimationFrame(processingRef.current);
      }
      return;
    }

    const processFrame = () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
        processingRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = 32;
        canvasRef.current.height = 128;
      }

      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      try {
        const roiWidth = 100;
        const roiHeight = 400;
        
        ctx.drawImage(
            video, 
            video.videoWidth / 2 - (roiWidth / 2), 
            video.videoHeight / 2 - (roiHeight / 2), 
            roiWidth, 
            roiHeight, 
            0, 
            0, 
            32, 
            128
        );
        
        const frameData = ctx.getImageData(0, 0, 32, 128).data;

        if (lastFrameData.current) {
          let diff = 0;
          for (let i = 0; i < frameData.length; i += 8) {
            diff += Math.abs(frameData[i] - lastFrameData.current[i]);
            diff += Math.abs(frameData[i + 1] - lastFrameData.current[i + 1]);
            diff += Math.abs(frameData[i + 2] - lastFrameData.current[i + 2]);
          }

          const threshold = 5000;
          
          if (diff < threshold) {
            setStability(prev => {
              const next = Math.min(100, prev + 4); 
              if (next === 100 && prev < 100) {
                const now = Date.now();
                if (now - lastCaptureTime.current > cooldown) {
                  lastCaptureTime.current = now;
                  setIsLocked(true);
                  onCapture();
                  setTimeout(() => {
                    setStability(0);
                    setIsLocked(false);
                  }, 500);
                }
              }
              return next;
            });
          } else {
            setStability(prev => Math.max(0, prev - 10));
            setIsLocked(false);
          }
        }

        lastFrameData.current = frameData;
      } catch (e) {
      }
      
      processingRef.current = requestAnimationFrame(processFrame);
    };

    processingRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (processingRef.current) {
        cancelAnimationFrame(processingRef.current);
      }
    };
  }, [isEnabled, isLevel, videoRef, onCapture, cooldown]);

  return { stability, isLocked };
};
