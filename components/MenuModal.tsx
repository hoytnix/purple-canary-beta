

import React, { useState, useEffect } from 'react';

interface MenuModalProps {
  onClose: () => void;
  onOpenSOP: () => void;
  onOpenLibrary: () => void;
  onOpenHome: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({ onClose, onOpenSOP, onOpenLibrary, onOpenHome }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('pc_user_tier') === 'admin');
    }
  }, []);
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

        {/* Admin Console (Elevated Clearance) */}
        {isAdmin && (
          <button 
            onClick={() => { onClose(); window.location.href = '/admin'; }}
            className="w-full p-4 bg-gradient-to-r from-ultra-violet/30 to-neon-cyan/20 border border-neon-cyan/40 rounded-2xl flex items-center gap-4 group hover:border-neon-cyan transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(0,255,255,0.15)]"
          >
            <div className="p-3 bg-neon-cyan/20 rounded-xl text-neon-cyan group-hover:bg-neon-cyan group-hover:text-black transition-colors">
              <span className="material-symbols-rounded text-[24px]">admin_panel_settings</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <span>Root Console</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] bg-neon-cyan text-black font-bold font-mono">ADMIN</span>
              </div>
              <div className="text-[10px] font-mono text-neon-cyan/80 group-hover:text-neon-cyan">TursoDB & Telemetry</div>
            </div>
          </button>
        )}

      </div>
      
      <div className="absolute bottom-8 text-[9px] font-mono text-gray-600 uppercase tracking-widest">
        Purple Canary vβ
      </div>
    </div>
  );
};