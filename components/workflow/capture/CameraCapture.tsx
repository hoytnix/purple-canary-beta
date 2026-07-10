
import React, { useState } from 'react';
import { CameraFeed } from '../../CameraFeed';
import { useScanner } from '../../../contexts/ScannerContext';
import { getSmartCrop } from '../../../services/cvService';

export const CameraCapture: React.FC = () => {
  const { 
    uvMode, setUvMode,
    buffer365, buffer395,
    cameraActive,
    videoRef,
    captureBand,
    gyroData 
  } = useScanner();

  const [isDetecting, setIsDetecting] = useState(false);

  // Auto-Crop for Camera Mode (FALLBACK)
  const captureFallbackCrop = () => {
    if (!videoRef.current) return null;
    const v = videoRef.current;
    if (v.videoWidth === 0 || v.videoHeight === 0) return null;

    const TARGET_HEIGHT_RATIO = 0.85; 
    const ASPECT_RATIO = 200 / 450;

    const h = v.videoHeight * TARGET_HEIGHT_RATIO;
    const w = h * ASPECT_RATIO;
    const x = (v.videoWidth - w) / 2;
    const y = (v.videoHeight - h) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    ctx?.drawImage(v, x, y, w, h, 0, 0, w, h);
    return canvas.toDataURL('image/png').split(',')[1];
  };

  const onCaptureClick = async (band: '365' | '395') => {
      if (!videoRef.current) return;
      
      setIsDetecting(true);
      
      try {
          // A: Try Smart ML Crop first
          let croppedBase64 = await getSmartCrop(videoRef.current);
          
          // B: Fallback
          if (!croppedBase64) {
             console.warn("TinyML Crop failed (low confidence), using fixed target zone.");
             croppedBase64 = captureFallbackCrop();
          }

          if (croppedBase64) {
             commitCapture(band, croppedBase64);
          }
      } catch (e) {
          console.error("Capture pipeline failed", e);
          const fallback = captureFallbackCrop();
          if (fallback) commitCapture(band, fallback);
      } finally {
          setIsDetecting(false);
      }
  };

  const commitCapture = (band: '365' | '395', imageData: string) => {
     captureBand(band, imageData);
     if (band === '365' && !buffer395) {
        setUvMode('395');
     } else if (band === '395' && !buffer365) {
        setUvMode('365');
     }
  };

  const isShutterEnabled = cameraActive && !isDetecting;

  return (
    <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
       <CameraFeed />
       
       {/* Controls Overlay */}
       <div className="absolute bottom-4 left-0 right-0 px-6 flex items-end justify-between pointer-events-none">
          
          {/* UV Toggle */}
          <div className="flex flex-col gap-2 pointer-events-auto">
             <button 
               onClick={() => setUvMode('365')}
               className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${uvMode === '365' ? 'border-ultra-violet bg-ultra-violet/20 text-white shadow-[0_0_15px_#8F00FF]' : 'border-gray-600 bg-black/50 text-gray-500'}`}
             >
                <span className="text-[10px] font-black">365</span>
             </button>
             <button 
               onClick={() => setUvMode('395')}
               className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${uvMode === '395' ? 'border-neon-cyan bg-neon-cyan/20 text-white shadow-[0_0_15px_#00FFFF]' : 'border-gray-600 bg-black/50 text-gray-500'}`}
             >
                <span className="text-[10px] font-black">395</span>
             </button>
          </div>

          {/* Shutter Button */}
          <button 
            onClick={() => uvMode !== 'OFF' && onCaptureClick(uvMode)}
            disabled={!isShutterEnabled}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all pointer-events-auto relative
                ${isShutterEnabled 
                   ? (uvMode === '365' ? 'border-ultra-violet bg-white text-ultra-violet hover:scale-105' : 'border-neon-cyan bg-white text-neon-cyan hover:scale-105')
                   : 'border-gray-700 bg-gray-800 text-gray-600 cursor-not-allowed'
                }
            `}
          >
             {isDetecting ? (
                 <span className="material-symbols-rounded text-[32px] animate-spin">autorenew</span>
             ) : (
                 <span className="material-symbols-rounded text-[40px]">
                    {buffer365 && buffer395 ? 'check' : 'camera'}
                 </span>
             )}
             
             {isShutterEnabled && !isDetecting && (
                <div className="absolute -top-2 -right-2 bg-black/80 border border-white/20 rounded px-1.5 py-0.5 flex items-center gap-1 shadow-lg">
                   <span className="text-[7px] font-black text-white">AI</span>
                   <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                </div>
             )}
          </button>

          {/* Thumbnails */}
          <div className="flex flex-col gap-2 pointer-events-auto">
              <div className={`w-12 h-16 rounded-lg border flex items-center justify-center overflow-hidden bg-black/50 ${buffer365 ? 'border-ultra-violet' : 'border-white/10'}`}>
                 {buffer365 ? <img src={`data:image/png;base64,${buffer365}`} className="w-full h-full object-cover" alt="365" /> : <span className="text-[8px] text-gray-600">365nm</span>}
              </div>
              <div className={`w-12 h-16 rounded-lg border flex items-center justify-center overflow-hidden bg-black/50 ${buffer395 ? 'border-neon-cyan' : 'border-white/10'}`}>
                 {buffer395 ? <img src={`data:image/png;base64,${buffer395}`} className="w-full h-full object-cover" alt="395" /> : <span className="text-[8px] text-gray-600">395nm</span>}
              </div>
          </div>
       </div>
    </div>
  );
};
