

import React, { useState, useEffect } from 'react';
import { getOrCreateIdentity } from '../services/identity';

interface LoginOverlayProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ onSuccess, onClose }) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-fill analyst identity key if persisted
  useEffect(() => {
    const savedEmail = localStorage.getItem('pc_onboarding_email');
    if (savedEmail) {
        setLoginEmail(savedEmail);
    }

    // Auto-fill or generate/persist private access key
    let savedKey = localStorage.getItem('pc_access_key');
    if (!savedKey) {
        // Generate a cryptographic-style 64-character hex private key
        const hexChars = '0123456789abcdef';
        savedKey = '0x';
        for (let i = 0; i < 64; i++) {
            savedKey += hexChars[Math.floor(Math.random() * 16)];
        }
        localStorage.setItem('pc_access_key', savedKey);
    }
    setLoginPassword(savedKey);
  }, []);

  const handleLoginSubmit = () => {
    if (!loginEmail || !loginPassword) return;
    setIsProcessing(true);
    // Persist login public key/identity & access key
    localStorage.setItem('pc_onboarding_email', loginEmail);
    localStorage.setItem('pc_access_key', loginPassword);
    window.dispatchEvent(new Event('storage'));
    // Simulate Auth Check
    setTimeout(() => {
        setIsProcessing(false);
        onSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#1a052b]/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
        >
          <span className="material-symbols-rounded text-[24px]">close</span>
        </button>

        <div className="w-full max-w-sm bg-[#1a052b] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

            <div className="text-center relative z-10">
                <div className="w-16 h-16 bg-neon-cyan/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-neon-cyan/20 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                    <span className="material-symbols-rounded text-[32px] text-neon-cyan">fingerprint</span>
                </div>
                <h2 className="text-xl font-bold text-white">Analyst Access</h2>
                <p className="text-xs text-gray-400 mt-1">Enter credentials to unlock the Purple Canary Alpha.</p>
            </div>

                <div className="space-y-4 mt-8 relative z-10">
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Analyst Public Key</label>
                    <div className="relative group">
                        <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-gray-500 group-focus-within:text-neon-cyan transition-colors">fingerprint</span>
                        <input 
                        type="text" 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="0x..."
                        className="w-full bg-[#1a052b] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all font-mono text-xs"
                        autoFocus
                        />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Access Key</label>
                    <div className="relative group">
                        <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-gray-500 group-focus-within:text-neon-cyan transition-colors">key</span>
                        <input 
                        type="password" 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-[#1a052b] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleLoginSubmit}
                    disabled={!loginEmail || !loginPassword || isProcessing}
                    className="w-full py-4 bg-white text-[#1a052b] font-black uppercase tracking-widest rounded-xl hover:bg-neon-cyan hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 mt-4"
                >
                    {isProcessing ? "Authenticating..." : "Decrypt & Enter"} 
                    {!isProcessing && <span className="material-symbols-rounded text-[16px]">arrow_forward</span>}
                </button>
                
                <div className="text-center">
                    <button className="text-[9px] text-gray-500 hover:text-white transition-colors underline decoration-dotted">
                        Forgot Access Key?
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};