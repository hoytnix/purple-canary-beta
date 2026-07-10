
import { useState, useEffect, useCallback } from 'react';

export interface GyroData {
  beta: number;  // Front/Back tilt (-180 to 180)
  gamma: number; // Left/Right tilt (-90 to 90)
  isLevel: boolean;
  permissionGranted: boolean;
}

export const useGyroscope = (tolerance: number = 2.5) => {
  const [data, setData] = useState<GyroData>({
    beta: 0,
    gamma: 0,
    isLevel: false,
    permissionGranted: false
  });

  const requestAccess = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setData(d => ({ ...d, permissionGranted: true }));
        }
      } catch (e) {
        console.error("Gyroscope permission denied", e);
      }
    } else {
      // Non-iOS 13+ devices typically don't need explicit permission prompt logic here, 
      // but browser support varies.
      setData(d => ({ ...d, permissionGranted: true }));
    }
  }, []);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const beta = event.beta || 0;
      const gamma = event.gamma || 0;

      // Check if phone is flat (parallel to ground). 
      // Ideal flat: beta ~ 0, gamma ~ 0.
      const isLevel = Math.abs(beta) < tolerance && Math.abs(gamma) < tolerance;

      setData(prev => ({
        ...prev,
        beta,
        gamma,
        isLevel,
        // Assume granted if we are receiving data
        permissionGranted: true
      }));
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [tolerance]);

  return { ...data, requestAccess };
};
