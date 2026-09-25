'use client';

import React, { useEffect, useState } from 'react';
import { getOrCreateIdentity, signPayload } from '../services/identity';

interface AuthStatusWidgetProps {
  className?: string;
}

export function AuthStatusWidget({ className = '' }: AuthStatusWidgetProps) {
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [synced, setSynced] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initIdentity() {
      // 1. Get existing or auto-generate new keypair
      const identity = await getOrCreateIdentity();
      if (!isMounted) return;
      setPublicKey(identity.publicKey);
      setPrivateKey(identity.privateKey);

      // 2. Automatically sync / upsert identity to TursoDB
      try {
        const timestamp = Date.now().toString();
        const signature = await signPayload(`auth:${identity.publicKey}:${timestamp}`, identity.privateKey);

        const res = await fetch('/api/auth/sync-identity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicKey: identity.publicKey,
            signature,
            timestamp,
          }),
        });

        if (res.ok && isMounted) {
          setSynced(true);
        }
      } catch (err) {
        console.error('Failed to sync identity to server', err);
      }
    }

    initIdentity();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyPublicKey = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className={`p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs font-mono space-y-3 backdrop-blur-md ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
          <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Asymmetric Keypair Identity</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className={`h-2 w-2 rounded-full ${synced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className={synced ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
            {synced ? 'Authenticated & Synced' : 'Syncing identity...'}
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-400 block font-semibold text-[11px]">Public Key (Identity)</label>
          <button
            onClick={handleCopyPublicKey}
            className="text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
            title="Copy Public Key"
          >
            {copiedKey ? (
              <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            <span>{copiedKey ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <input
          type="text"
          readOnly
          value={publicKey}
          placeholder="Generating public key..."
          className="w-full bg-slate-950 text-slate-300 p-2.5 rounded-lg border border-slate-700/80 select-all font-mono text-[11px] truncate focus:outline-none focus:border-cyan-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-400 block font-semibold text-[11px]">Private Key (Stored Locally)</label>
          <button
            onClick={() => setShowPrivateKey(prev => !prev)}
            className="text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            {showPrivateKey ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
            <span>{showPrivateKey ? 'Hide' : 'Reveal'}</span>
          </button>
        </div>
        <div className="relative">
          <input
            type={showPrivateKey ? 'text' : 'password'}
            readOnly
            value={privateKey}
            placeholder="Generating private key..."
            className="w-full bg-slate-950 text-slate-500 p-2.5 rounded-lg border border-slate-700/80 font-mono text-[11px] truncate focus:outline-none"
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-1 italic">
          Private keys never leave your device or touch the network.
        </p>
      </div>
    </div>
  );
}
