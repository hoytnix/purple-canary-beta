import React, { useState, useRef, useEffect } from 'react';

interface ImageCropperProps {
  imageSrc: string; // base64
  onConfirm: (croppedImage: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Crop window dimensions (Approx 1:2.25 ratio for TLC strip)
  const CROP_WIDTH = 200;
  const CROP_HEIGHT = 450; 

  // Initialize scale to fit image
  useEffect(() => {
    const img = new Image();
    // imageSrc already includes the data prefix
    img.src = imageSrc;
    img.onload = () => {
        // Fit to height roughly with some padding
        const s = 500 / img.height;
        setScale(Math.max(s, 0.2));
    }
  }, [imageSrc]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const executeCrop = () => {
    const canvas = document.createElement('canvas');
    canvas.width = CROP_WIDTH;
    canvas.height = CROP_HEIGHT;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    
    if (ctx && img) {
        // Fill with dark indigo to handle potential empty areas (though user should fit image)
        ctx.fillStyle = '#1a052b'; 
        ctx.fillRect(0,0, canvas.width, canvas.height);
        
        // Transform origin is center of canvas
        ctx.translate(canvas.width/2, canvas.height/2);
        // Apply user transform
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);
        // Draw image centered at origin
        ctx.drawImage(img, -img.naturalWidth/2, -img.naturalHeight/2);
        
        const b64 = canvas.toDataURL('image/png').split(',')[1];
        onConfirm(b64);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#1a052b] flex flex-col animate-in fade-in duration-200">
       <div className="p-4 bg-black/20 border-b border-white/5 text-center shrink-0">
            <h3 className="text-white font-black uppercase text-sm tracking-widest">Adjust Scan Region</h3>
            <p className="text-[10px] text-gray-400 font-mono">Center the strip to exclude background noise.</p>
       </div>

       <div className="flex-1 relative overflow-hidden flex items-center justify-center touch-none cursor-move bg-black"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
       >
          <img 
            ref={imgRef}
            src={imageSrc}
            className="absolute max-w-none pointer-events-none select-none"
            style={{ 
               transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
            alt="Crop Source"
          />
          
          {/* Overlay mask using huge border trick to create a "hole" */}
          <div 
             className="absolute pointer-events-none z-10 border-2 border-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.3)]"
             style={{ 
                 width: CROP_WIDTH, 
                 height: CROP_HEIGHT,
                 boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)" 
             }}
          >
             {/* Crosshairs / Grid */}
             <div className="absolute top-1/2 left-0 w-full h-px bg-neon-cyan/30"></div>
             <div className="absolute left-1/2 top-0 h-full w-px bg-neon-cyan/30"></div>
          </div>
       </div>

       <div className="p-6 bg-[#10031c] border-t border-white/10 flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-4 px-2">
             <span className="material-symbols-rounded text-gray-400 text-[20px]">zoom_out</span>
             <input 
               type="range" 
               min="0.1" 
               max="3" 
               step="0.01" 
               value={scale} 
               onChange={(e) => setScale(parseFloat(e.target.value))}
               className="flex-1 accent-neon-cyan h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
             />
             <span className="material-symbols-rounded text-white text-[20px]">zoom_in</span>
          </div>
          <div className="flex gap-4">
             <button onClick={onCancel} className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase text-xs hover:bg-white/10 transition-colors">
                Cancel
             </button>
             <button onClick={executeCrop} className="flex-[2] py-4 rounded-xl bg-neon-cyan text-[#1a052b] font-black uppercase text-xs shadow-lg shadow-neon-cyan/20 hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-rounded text-[18px]">crop</span> Confirm Region
             </button>
          </div>
       </div>
    </div>
  );
};