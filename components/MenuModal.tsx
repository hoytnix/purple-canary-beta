

import React from 'react';

interface MenuModalProps {
  onClose: () => void;
  onOpenSOP: () => void;
  onOpenLibrary: () => void;
  onOpenHome: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({ onClose, onOpenSOP, onOpenLibrary, onOpenHome }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#1a052b]/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
      
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
      >
        <span className="material-symbols-rounded text-[32px]">close</span>
      </button>

      <div className="w-full max-w-sm px-6 space-y-4">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">System Access</h2>
            <div className="h-1 w-20 bg-neon-cyan mx-auto mt-2 rounded-full shadow-[0_0_10px_#00FFFF]"></div>
        </div>

        {/* Home Base (Landing) */}
        <button 
          onClick={() => { onClose(); onOpenHome(); }}
          className="w-full p-4 bg-gradient-to-r from-deep-indigo to-[#2e1065] border border-white/10 rounded-2xl flex items-center gap-4 group hover:border-gray-400/50 transition-all active:scale-[0.98]"
        >
          <div className="p-3 bg-gray-500/10 rounded-xl text-gray-400 group-hover:bg-gray-400 group-hover:text-deep-indigo transition-colors">
            <span className="material-symbols-rounded text-[24px]">home</span>
          </div>
          <div className="text-left">
            <div className="text-sm font-black text-white uppercase tracking-widest">Home Base</div>
            <div className="text-[10px] font-mono text-gray-400 group-hover:text-gray-300">Return to Landing</div>
          </div>
        </button>

        {/* Lab (Home) */}
        <button 
          onClick={onClose}
          className="w-full p-4 bg-gradient-to-r from-deep-indigo to-[#2e1065] border border-white/10 rounded-2xl flex items-center gap-4 group hover:border-neon-cyan/50 transition-all active:scale-[0.98]"
        >
          <div className="p-3 bg-neon-cyan/10 rounded-xl text-neon-cyan group-hover:bg-neon-cyan group-hover:text-deep-indigo transition-colors">
            <span className="material-symbols-rounded text-[24px]">science</span>
          </div>
          <div className="text-left">
            <div className="text-sm font-black text-white uppercase tracking-widest">The Lab</div>
            <div className="text-[10px] font-mono text-gray-400 group-hover:text-gray-300">Active Workflow</div>
          </div>
        </button>

        {/* Library */}
        <button 
          onClick={() => { onClose(); onOpenLibrary(); }}
          className="w-full p-4 bg-gradient-to-r from-deep-indigo to-[#2e1065] border border-white/10 rounded-2xl flex items-center gap-4 group hover:border-ultra-violet/50 transition-all active:scale-[0.98]"
        >
          <div className="p-3 bg-ultra-violet/10 rounded-xl text-ultra-violet group-hover:bg-ultra-violet group-hover:text-deep-indigo transition-colors">
            <span className="material-symbols-rounded text-[24px]">library_books</span>
          </div>
          <div className="text-left">
            <div className="text-sm font-black text-white uppercase tracking-widest">Reference Ledger</div>
            <div className="text-[10px] font-mono text-gray-400 group-hover:text-gray-300">Spectral Signatures</div>
          </div>
        </button>

      </div>
      
      <div className="absolute bottom-8 text-[9px] font-mono text-gray-600 uppercase tracking-widest">
        Purple Canary vβ
      </div>
    </div>
  );
};