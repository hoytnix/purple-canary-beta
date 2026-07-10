
import React from 'react';
import { ScanInputMode } from '../../../types';
import { useScanner } from '../../../contexts/ScannerContext';

export const CaptureModeSelector: React.FC = () => {
  const { scanInputMode, setScanInputMode, resetScan } = useScanner();

  const handleModeChange = (mode: ScanInputMode) => {
    setScanInputMode(mode);
    resetScan();
  };

  return (
    <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 shrink-0 mb-3">
       <button 
         onClick={() => handleModeChange('CAMERA')}
         className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${scanInputMode === 'CAMERA' ? 'bg-neon-cyan text-[#1a052b]' : 'text-gray-500 hover:text-white'}`}
       >
          <span className="material-symbols-rounded text-[16px]">photo_camera</span> Camera
       </button>
       <button 
         onClick={() => handleModeChange('UPLOAD')}
         className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${scanInputMode === 'UPLOAD' ? 'bg-ultra-violet text-white' : 'text-gray-500 hover:text-white'}`}
       >
          <span className="material-symbols-rounded text-[16px]">upload_file</span> Upload
       </button>
    </div>
  );
};
