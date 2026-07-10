
import React, { useRef, useState } from 'react';
import { useScanner } from '../../../contexts/ScannerContext';
import { smartCropBase64 } from '../../../services/cvService';

interface UploadCaptureProps {
  onManualCropRequest: (base64: string, band: '365' | '395') => void;
  onAutoCropComplete: (base64: string) => void;
}

export const UploadCapture: React.FC<UploadCaptureProps> = ({ onManualCropRequest, onAutoCropComplete }) => {
  const { buffer365, buffer395, captureBand, resetScan } = useScanner();
  const fileInput365Ref = useRef<HTMLInputElement>(null);
  const fileInput395Ref = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  
  const processImage = async (base64: string, band: '365' | '395') => {
      setLoading(true);
      try {
          // Attempt AI Crop
          const cropped = await smartCropBase64(base64);
          
          if (cropped) {
              // Success - Auto-commit the cropped version
              captureBand(band, cropped);
          } else {
              // Fail - Send original to manual cropper
              onManualCropRequest(base64, band);
          }
      } catch (e) {
          console.error("Auto-crop failed", e);
          onManualCropRequest(base64, band); // Fallback
      } finally {
          setLoading(false);
      }
  };

  const onFileSelect = (file: File, band: '365' | '395') => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
            processImage(result.split(',')[1], band);
        }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner flex flex-col p-6">
        
        {/* Reset Button */}
        {(buffer365 || buffer395) && (
            <button onClick={resetScan} className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors z-10">
                <span className="material-symbols-rounded text-[20px]">delete</span>
            </button>
        )}
        
        <div className="flex flex-col gap-6 h-full items-center justify-center">
            
            {loading ? (
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <span className="material-symbols-rounded text-[48px] text-neon-cyan animate-spin">autorenew</span>
                    <p className="text-xs font-mono text-neon-cyan uppercase tracking-widest">AI Scanning...</p>
                </div>
            ) : (
                <>
                    {/* Band 365 */}
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest text-center">UV 365nm</p>
                        {buffer365 ? (
                             <div className="w-full aspect-[3/4] rounded-xl border border-neon-cyan/50 overflow-hidden bg-black flex items-center justify-center">
                                 <img src={`data:image/png;base64,${buffer365}`} className="w-full h-full object-contain" alt="365nm" />
                             </div>
                        ) : (
                            <div 
                                onClick={() => fileInput365Ref.current?.click()}
                                className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-4 hover:border-neon-cyan hover:bg-white/5 transition-all cursor-pointer group"
                            >
                                <span className="material-symbols-rounded text-[40px] text-gray-400 group-hover:text-neon-cyan">add_photo_alternate</span>
                                <input 
                                    ref={fileInput365Ref}
                                    type="file" 
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0], '365')}
                                />
                            </div>
                        )}
                    </div>

                    {/* Band 395 */}
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                        <p className="text-xs font-mono text-gray-400 uppercase tracking-widest text-center">UV 395nm</p>
                        {buffer395 ? (
                             <div className="w-full aspect-[3/4] rounded-xl border border-neon-cyan/50 overflow-hidden bg-black flex items-center justify-center">
                                 <img src={`data:image/png;base64,${buffer395}`} className="w-full h-full object-contain" alt="395nm" />
                             </div>
                        ) : (
                            <div 
                                onClick={() => fileInput395Ref.current?.click()}
                                className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-4 hover:border-neon-cyan hover:bg-white/5 transition-all cursor-pointer group"
                            >
                                <span className="material-symbols-rounded text-[40px] text-gray-400 group-hover:text-neon-cyan">add_photo_alternate</span>
                                <input 
                                    ref={fileInput395Ref}
                                    type="file" 
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0], '395')}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    </div>
  );
};

