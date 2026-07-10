import React, { useMemo, useEffect } from 'react';
import { useAutoCapture } from '../hooks/useAutoCapture';
import { useScanner } from '../contexts/ScannerContext';

export const CameraFeed: React.FC = () => {
  const { 
    videoRef, 
    cameraActive, 
    isScanning, 
    status, 
    currentFilter, 
    uvMode, 
    isAutoCapture, 
    handleCapture,
    scanInputMode,
    combinedBuffer,
    buffer365,
    startCamera,
    stopCamera,
    stream,
    gyroData,
    requestGyroAccess
  } = useScanner();

  useEffect(() => {
    if (scanInputMode === 'CAMERA') {
      startCamera();
      requestGyroAccess();
    }
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera, scanInputMode, requestGyroAccess]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn("Autoplay prevented:", e));
    }
  }, [videoRef, stream]);

  const { stability, isLocked } = useAutoCapture({
    videoRef: videoRef,
    isEnabled: isAutoCapture && cameraActive && !isScanning && scanInputMode === 'CAMERA',
    isLevel: gyroData.isLevel,
    onCapture: () => uvMode !== 'OFF' && handleCapture(uvMode),
    cooldown: 3000
  });

  const isUploadMode = scanInputMode === 'UPLOAD';

  const progressState = useMemo(() => {
    switch (status) {
        case 'ALPHA_VALIDATING': 
            return { percent: 35, text: "Validating Substrate Geometry..." };
        case 'ALPHA_ANCHORING': 
            return { percent: 85, text: "Anchoring Spectral Signatures..." };
        default: 
            return { percent: 0, text: "Initializing Sequence..." };
    }
  }, [status]);

  // Calculate bubble position from gyro data
  const maxTilt = 10;
  const bubbleX = Math.max(-maxTilt, Math.min(maxTilt, gyroData.gamma)) * 5; 
  const bubbleY = Math.max(-maxTilt, Math.min(maxTilt, gyroData.beta)) * 5;

  return (
    <div className={`relative w-full h-full group overflow-hidden transition-all duration-300 ${!isUploadMode && cameraActive ? 'border-4 border-ultra-violet/20' : 'border-4 border-transparent'}`}>
      
      {/* Base Layer */}
      {isUploadMode ? (
         combinedBuffer ? (
            <img 
               src={`data:image/png;base64,${combinedBuffer}`} 
               className="w-full h-full object-contain bg-black" 
               alt="Uploaded concatenated scan" 
            />
         ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-4 bg-[#10031c]">
               <span className="material-symbols-rounded text-[64px] opacity-20">image</span>
               <div className="text-xs font-mono uppercase tracking-widest opacity-50">No Image Loaded</div>
            </div>
         )
      ) : (
         <>
             <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className={`w-full h-full object-cover transition-opacity duration-1000 ${cameraActive ? 'opacity-100' : 'opacity-0'}`} 
             />
             
             {!cameraActive && (
               <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80">
                  <button 
                    onClick={() => { startCamera(); requestGyroAccess(); }}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all group"
                  >
                    <div className="p-4 rounded-full bg-neon-cyan/20 group-hover:bg-neon-cyan/30 text-neon-cyan">
                      <span className="material-symbols-rounded text-[32px]">photo_camera</span>
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-white">Initialize Optical Sensor</div>
                  </button>
               </div>
             )}

             {buffer365 && uvMode === '395' && (
                <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen">
                    <img 
                       src={`data:image/png;base64,${buffer365}`} 
                       className="w-full h-full object-cover grayscale" 
                       alt="Ghost Overlay" 
                    />
                </div>
             )}
         </>
      )}
      
      {/* HUD OVERLAY - CAMERA MODE */}
      {!isUploadMode && cameraActive && !isScanning && (
        <div className="absolute inset-0 pointer-events-none">
          
          {/* 1. AUTO-CROP DETECTION ZONE */}
          {/* This box visually represents the area that will be automatically cropped. */}
          {/* Aspect Ratio 200/450 (approx 0.44) matches the strip geometry logic */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="relative h-[85%] aspect-[200/450] transition-all duration-300">
                
                {/* Active Scanning Animation */}
                <div className="absolute inset-0 border-2 border-neon-cyan/50 rounded-lg shadow-[0_0_50px_rgba(0,255,255,0.1)] overflow-hidden">
                    <div className="absolute top-0 w-full h-1 bg-neon-cyan/80 shadow-[0_0_10px_#00FFFF] animate-scan opacity-50"></div>
                    <div className="absolute inset-0 bg-neon-cyan/5"></div>
                </div>

                {/* Corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-neon-cyan rounded-tl-sm"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-neon-cyan rounded-tr-sm"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-neon-cyan rounded-bl-sm"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-neon-cyan rounded-br-sm"></div>

                {/* Mid-points */}
                <div className="absolute top-1/2 left-0 w-2 h-0.5 bg-neon-cyan/50 -translate-x-1/2"></div>
                <div className="absolute top-1/2 right-0 w-2 h-0.5 bg-neon-cyan/50 translate-x-1/2"></div>

                {/* Guide Text */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="bg-black/60 text-neon-cyan text-[8px] font-black uppercase px-2 py-1 rounded border border-neon-cyan/20 backdrop-blur-sm">
                       Target Zone
                    </span>
                </div>
             </div>
          </div>

          {/* 2. Spirit Level Indicator (Top Right) */}
          <div className="absolute top-4 right-4 flex flex-col items-center gap-2 z-30">
             <div className={`w-12 h-12 rounded-full border-2 transition-all duration-300 flex items-center justify-center backdrop-blur-md relative
                ${gyroData.isLevel ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}
             `}>
                <div 
                  className={`absolute w-3 h-3 rounded-full shadow-sm transition-transform duration-100 ease-out
                     ${gyroData.isLevel ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-red-500 shadow-[0_0_5px_#ef4444]'}
                  `}
                  style={{ transform: `translate(${bubbleX}px, ${bubbleY}px)` }}
                />
                <div className="absolute inset-0 border border-white/10 rounded-full"></div>
             </div>
             <span className={`text-[8px] font-mono font-bold uppercase ${gyroData.isLevel ? 'text-green-500' : 'text-red-500'}`}>
                {gyroData.isLevel ? 'LEVEL' : 'TILT'}
             </span>
          </div>

        </div>
      )}

      {/* Auto-Capture Progress */}
      {!isUploadMode && isAutoCapture && !isScanning && cameraActive && (
           <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none">
               <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-neon-cyan/30 flex items-center gap-3">
                  <div className="h-1.5 w-24 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-cyan transition-all duration-100 ease-linear" style={{ width: `${stability}%` }} />
                  </div>
                  <span className="text-[9px] font-mono text-neon-cyan animate-pulse">LOCKING TARGET...</span>
               </div>
           </div>
      )}

      {isScanning && (
        <div className="absolute inset-0 bg-[#1a052b]/95 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-in fade-in duration-300">
          <div className="w-64 space-y-5">
              <div className="flex justify-center mb-6">
                 <div className="relative">
                    <div className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full animate-pulse"></div>
                    <span className="material-symbols-rounded text-[48px] text-neon-cyan animate-pulse relative z-10">memory</span>
                    <div className="absolute -inset-4 border border-dashed border-neon-cyan/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                 </div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-neon-cyan uppercase tracking-widest">
                 <span className="font-bold">System Activity</span>
                 <span className="animate-pulse">{progressState.percent}%</span>
              </div>
              <div className="relative h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-white/10">
                 <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#fff_5px,#fff_10px)]"></div>
                 <div
                    className="h-full bg-gradient-to-r from-ultra-violet via-neon-cyan to-white shadow-[0_0_15px_#00FFFF] transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressState.percent}%` }}
                 >
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white blur-[2px]"></div>
                 </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                 <div className="text-[10px] font-mono text-white font-bold text-center uppercase tracking-widest">
                    {progressState.text}
                 </div>
                 <div className="text-[8px] font-mono text-gray-500 text-center uppercase">
                    Running Alpha Spectral Engine
                 </div>
              </div>
          </div>
          <div className="absolute top-0 w-full h-1 bg-neon-cyan/50 animate-scan pointer-events-none" />
        </div>
      )}
      
      {/* Config Pill */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#1a052b]/80 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md z-10">
        <span className="material-symbols-rounded text-[12px] text-neon-cyan">straighten</span>
        <span className="text-[9px] font-mono text-neon-cyan uppercase">{currentFilter.name.split('(')[0]}</span>
      </div>
    </div>
  );
};