
import React, { useState } from 'react';
import { useScanner } from '../../contexts/ScannerContext';
import { ImageCropper } from '../ImageCropper';
import { CaptureModeSelector } from './capture/CaptureModeSelector';
import { CameraCapture } from './capture/CameraCapture';
import { UploadCapture } from './capture/UploadCapture';

interface PhaseCaptureProps {
  onNext: () => void;
}

export const PhaseCapture: React.FC<PhaseCaptureProps> = ({ onNext }) => {
  const { 
    scanInputMode,
    buffer365, buffer395, combinedBuffer, 
    uploadCombinedImage, captureBand
  } = useScanner();

  // State for Manual Cropping (Fallback for Uploads)
  const [manualCropTarget, setManualCropTarget] = useState<{b64: string, band: '365' | '395'} | null>(null);

  const isComplete = (scanInputMode === 'CAMERA' && !!buffer365 && !!buffer395) || 
                     (scanInputMode === 'UPLOAD' && !!buffer365 && !!buffer395);

  const handleManualCropConfirm = (croppedBase64: string) => {
     if (manualCropTarget) {
         captureBand(manualCropTarget.band, croppedBase64.includes(',') ? croppedBase64.split(',')[1] : croppedBase64);
         setManualCropTarget(null);
     }
  };

  return (
    <div className="w-full h-full flex flex-col gap-0 animate-slide-in relative">
      
      {/* Manual Cropper Overlay (Triggered by Upload Fallback) */}
      {manualCropTarget && (
         <ImageCropper 
            imageSrc={manualCropTarget.b64}
            onConfirm={handleManualCropConfirm}
            onCancel={() => setManualCropTarget(null)}
         />
      )}

      {/* 1. Mode Selector Module */}
      <CaptureModeSelector />

      {/* 2. Active Capture Module */}
      {scanInputMode === 'CAMERA' ? (
         <CameraCapture />
      ) : (
         <UploadCapture 
            onManualCropRequest={(b64, band) => setManualCropTarget({ b64: `data:image/png;base64,${b64}`, band })}
            onAutoCropComplete={uploadCombinedImage}
         />
      )}

      {/* 3. Footer Action */}
      <div className="shrink-0 pt-3">
         <button 
           onClick={onNext}
           disabled={!isComplete}
           className="w-full py-4 bg-neon-cyan text-[#1a052b] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-cyan-300 transition-all shadow-lg shadow-neon-cyan/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group text-xs"
         >
           Analyze Spectra <span className="material-symbols-rounded text-[16px] group-hover:translate-x-1 transition-transform">neurology</span>
         </button>
      </div>

    </div>
  );
};
