

import React from 'react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] bg-[#1a052b] overflow-y-auto animate-in fade-in duration-300">
      <div className="max-w-3xl mx-auto p-6 md:p-12 pb-24">
        {/* Header */}
        <div className="flex justify-between items-start mb-12 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter">Privacy Policy</h1>
            <p className="text-xs md:text-sm font-mono text-gray-400 mt-2 uppercase tracking-widest">Data Retention & Anonymity Standards</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
            <span className="material-symbols-rounded text-[32px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-10 font-mono text-sm leading-relaxed text-gray-300">
          
          <div className="p-6 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl mb-8 flex gap-4">
             <span className="material-symbols-rounded text-[32px] text-neon-cyan shrink-0">lock</span>
             <div>
                <h3 className="text-lg font-bold text-white uppercase mb-2">Core Philosophy</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                    We believe that forensic analysis should be anonymous. The Purple Canary Alpha pipeline is designed to process sensitive data 
                    locally whenever possible, minimizing the digital footprint of the analyst. You are the sole custodian of your results.
                </p>
             </div>
          </div>

          <section className="space-y-4">
             <h2 className="text-xl font-bold text-white uppercase flex items-center gap-2">
                <span className="material-symbols-rounded text-[20px] text-ultra-violet">dns</span> 1. Data Processing Architecture
             </h2>
             <div className="pl-7 space-y-4">
                <p>
                    <strong>Local Execution Environment:</strong> The core spectral analysis (Euclidean distance matching, Void detection, Geometry Checks) occurs client-side 
                    within your browser's WebAssembly environment. Raw camera feeds are processed in volatile memory and are not automatically uploaded to any server.
                </p>
                <p>
                    <strong>Cloud Inference (Gemini Integration):</strong> When "Heuristic Analysis" is triggered, ephemeral image data is transmitted via 
                    secure TLS 1.3 encryption to our AI inference provider. This data is used solely for the duration of the inference session (approx. 2-5 seconds) 
                    and is not stored for model training by Vida Liquamine Inc.
                </p>
             </div>
          </section>

          <section className="space-y-4">
             <h2 className="text-xl font-bold text-white uppercase flex items-center gap-2">
                <span className="material-symbols-rounded text-[20px] text-ultra-violet">visibility_off</span> 2. Anonymous Public Key Authentication System
             </h2>
             <div className="pl-7 space-y-4">
                <p>
                    We employ a decentralized, zero-knowledge, anonymous public key authentication model. We do not collect, request, or associate real names, personal email addresses, phone numbers, or any Personally Identifiable Information (PII) with your account.
                </p>
                <p>
                    <strong>Cryptographic Pseudonymous Identity:</strong> Upon your first connection, the system automatically generates an anonymous public key address (e.g., <span className="text-neon-cyan bg-neon-cyan/10 px-1 rounded">0x3f5c...7a91</span>) entirely client-side. This randomly-seeded key serves as your sole identifier for logging scans, loading credentials, and maintaining secure, isolated ledger sessions in our cloud database.
                </p>
                <p>
                    <strong>Financial Firewall:</strong> Credit purchases are processed through secure firewalls. Purple Canary receives only an anonymous token validating payment status, with zero exposure to your payment details, establishing a cryptographically solid partition between financial identity and forensic logs.
                </p>
             </div>
          </section>

          <section className="space-y-4">
             <h2 className="text-xl font-bold text-white uppercase flex items-center gap-2">
                <span className="material-symbols-rounded text-[20px] text-ultra-violet">delete</span> 3. Data Retention & Destruction
             </h2>
             <div className="pl-7 space-y-4">
                <p>
                    <strong>Zero-Knowledge Storage:</strong> Scan history stored in the "My Account" section is persisted in your browser's `localStorage` and indexedDB. 
                    We do not maintain a central database of scan results linked to users.
                </p>
                <p>
                    <strong>The Kill Switch:</strong> Clearing your browser cache or clicking "Sign Out" destroys the local encryption keys, rendering the locally stored 
                    scan history permanently inaccessible.
                </p>
             </div>
          </section>

          <section className="space-y-4 pt-8 border-t border-white/5">
             <div className="flex items-center gap-2 text-gray-500 mb-2">
                <span className="material-symbols-rounded text-[16px]">verified_user</span>
                <h2 className="text-lg font-bold uppercase">Compliance & Contact</h2>
             </div>
             <p className="text-xs text-gray-500 pl-6">
                For privacy inquiries, data deletion requests (for any minimal metadata we may hold), or PGP keys, contact:
                <br />
                <span className="text-neon-cyan mt-1 block">privacy@purplecanarylab.com</span>
             </p>
          </section>

        </div>
      </div>
    </div>
  );
};