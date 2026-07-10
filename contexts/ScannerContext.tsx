import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useCamera } from '../hooks/useCamera';
import { useForensicScanner } from '../hooks/useForensicScanner';
import { useGyroscope, GyroData } from '../hooks/useGyroscope';
import { processUrlUpload } from '../services/uploadService';
import { resizeImageBase64 } from '../services/imageResizer';
import { MatrixType, SolventType, FilterStandard, SystemStatus, Detection, ValidationError, ScanInputMode, GeminiAnalysisResult } from '../types';
import { FILTER_STANDARDS } from '../constants/index';

interface ScannerContextType {
  // Configuration
  filterSize: string;
  setFilterSize: (size: string) => void;
  
  // Material State (Locked to Protocol)
  filterMaterial: string; 
  solvent: SolventType;
  
  matrixType: MatrixType;
  setMatrixType: (mat: MatrixType) => void;
  
  // Custom Dimensions for generic strips
  customDimensions: { width: number; height: number };
  setCustomDimensions: (dims: { width: number; height: number }) => void;

  // UI State
  uvMode: '365' | '395' | 'OFF';
  setUvMode: (mode: '365' | '395' | 'OFF') => void;
  scanInputMode: ScanInputMode;
  setScanInputMode: (mode: ScanInputMode) => void;
  
  // Derived State
  currentFilter: FilterStandard;
  isAutoCapture: boolean;

  // Hardware / Camera
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraActive: boolean;
  cameraError: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  stream: MediaStream | null;
  
  // Gyroscope / Leveling
  gyroData: GyroData;
  requestGyroAccess: () => Promise<void>;

  // Scanner State
  status: SystemStatus;
  detections: Detection[];
  geminiAnalysis: GeminiAnalysisResult | null;
  isGeminiLoading: boolean;
  isScanning: boolean;
  errorState: ValidationError | null;
  buffer365: string | null;
  buffer395: string | null;
  combinedBuffer: string | null;

  // Actions
  handleCapture: (band: '365' | '395') => Promise<void>;
  handleFileUpload: (file: File) => Promise<void>;
  handleUrlUpload: (url: string) => Promise<void>;
  
  // Manual State Setters (Exposed for Cropper Workflow)
  captureBand: (band: '365' | '395', imageData: string) => void;
  uploadCombinedImage: (imageData: string) => void;
  
  executeDualScan: () => void;
  executeTestScan: () => void;
  resetScan: () => void;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export const ScannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Config State
  const [filterSize, setFilterSize] = useState('PURPLE_CANARY_KIT');
  
  // LOCKED PROTOCOLS (Analyst V3.5 Recommendation)
  const [filterMaterial] = useState<string>('QUALITATIVE');
  const [solvent] = useState<SolventType>('LIMONENE');
  
  const [matrixType, setMatrixType] = useState<MatrixType>('SOLID_CRYSTAL');
  const [uvMode, setUvMode] = useState<'365' | '395' | 'OFF'>('365');
  const [scanInputMode, setScanInputMode] = useState<ScanInputMode>('CAMERA');

  const [customDimensions, setCustomDimensions] = useState({ width: 2.0, height: 15.7 });

  const videoRef = useRef<HTMLVideoElement>(null);

  // Hardware Hooks
  const { 
    stream,
    cameraActive, 
    cameraError, 
    startCamera,
    stopCamera,
    captureImage
  } = useCamera();

  const gyroData = useGyroscope(2.0); // 2 degree tolerance for Gyro-Lock
  const { requestAccess: requestGyroAccess } = gyroData;
  
  const { 
    status, 
    setStatus,
    detections, 
    geminiAnalysis,
    isGeminiLoading,
    isScanning, 
    errorState, 
    buffer365,
    buffer395,
    combinedBuffer,
    captureBand,
    uploadCombinedImage,
    executeDualScan: runDualScan,
    executeTestScan: runTestScan,
    resetScan: resetScannerState
  } = useForensicScanner();

  useEffect(() => {
    if (cameraActive && status === 'INITIALIZING') {
      setStatus('SYSTEM_READY');
    } else if (cameraError) {
      setStatus('HARDWARE_ERROR');
    }
  }, [cameraActive, cameraError, status, setStatus]);

  let currentFilter: FilterStandard | undefined;
  
  if (filterSize === 'CUSTOM') {
    currentFilter = {
      name: `Custom (${customDimensions.width}x${customDimensions.height}cm)`,
      width_cm: customDimensions.width,
      height_cm: customDimensions.height
    };
  } else {
    currentFilter = FILTER_STANDARDS[filterSize];
  }
  
  if (!currentFilter) {
      currentFilter = FILTER_STANDARDS['PURPLE_CANARY_KIT'];
  }

  const isTargeting = !isScanning && uvMode !== 'OFF' && scanInputMode === 'CAMERA';
  const isAutoCapture = isTargeting && ((uvMode === '365' && !buffer365) || (uvMode === '395' && !buffer395));

  const handleCapture = async (band: '365' | '395') => {
    const base64 = captureImage(videoRef.current); 
    if (base64) {
      captureBand(band, base64);
      if (band === '365' && !buffer395) {
         setUvMode('395');
      } else if (band === '395' && !buffer365) {
         setUvMode('365');
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      if (result) {
        try {
          const resizedBase64 = await resizeImageBase64(result, 1024);
          uploadCombinedImage(resizedBase64);
        } catch (err) {
          console.error("Failed to resize uploaded image, falling back to original:", err);
          const base64 = result.split(',')[1];
          uploadCombinedImage(base64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlUpload = async (url: string) => {
    try {
      const base64 = await processUrlUpload(url);
      const resizedBase64 = await resizeImageBase64(base64, 1024);
      uploadCombinedImage(resizedBase64);
    } catch (e) {
      console.error("URL Upload Error", e);
      throw e; 
    }
  };

  const executeDualScan = () => {
    runDualScan(solvent, filterMaterial as any, matrixType);
  };

  const executeTestScan = () => {
    runTestScan(solvent, filterMaterial as any, matrixType);
  };

  const resetScan = () => {
    resetScannerState();
    setUvMode('365'); 
  };

  const value: ScannerContextType = {
    filterSize, setFilterSize,
    filterMaterial, 
    solvent, 
    matrixType, setMatrixType,
    uvMode, setUvMode,
    scanInputMode, setScanInputMode,
    customDimensions, setCustomDimensions,
    currentFilter,
    isAutoCapture,
    videoRef, cameraActive, cameraError, startCamera, stopCamera, stream,
    gyroData, requestGyroAccess,
    status, detections, geminiAnalysis, isGeminiLoading, isScanning, errorState, buffer365, buffer395, combinedBuffer,
    handleCapture,
    handleFileUpload,
    handleUrlUpload,
    captureBand,        // Exposed
    uploadCombinedImage, // Exposed
    executeDualScan,
    executeTestScan,
    resetScan
  };

  return (
    <ScannerContext.Provider value={value}>
      {children}
    </ScannerContext.Provider>
  );
};

export const useScanner = () => {
  const context = useContext(ScannerContext);
  if (context === undefined) {
    throw new Error('useScanner must be used within a ScannerProvider');
  }
  return context;
};