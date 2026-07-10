
import React, { useEffect, useState, useRef } from 'react';
import { useScanner } from '../../contexts/ScannerContext';

interface PhaseAnalysisProps {
  onComplete: () => void;
  onBack: () => void;
}

export const PhaseAnalysis: React.FC<PhaseAnalysisProps> = ({ onComplete, onBack }) => {
  const { status, isScanning, executeDualScan, detections, errorState, resetScan } = useScanner();
  const [logs, setLogs] = useState<string[]>(["Initializing Neural Engine..."]);
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Trigger analysis on mount only once
  useEffect(() => {
    if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        executeDualScan();
    }
  }, [executeDualScan]);

  // Sync logs with System Status
  useEffect(() => {
    if (status === 'ALPHA_VALIDATING') {
        setLogs(prev => [...prev, "Loading WASM Backend...", "Mounting Tensors..."]);
    } else if (status === 'ALPHA_ANCHORING') {
        setLogs(prev => [...prev, "Executing TinyML Inference...", "Matching Spectral Ledger..."]);
    } else if (status === 'SYSTEM_READY' && !hasCompletedRef.current) {
        if (errorState) {
          // If there is an error, stay on this step to let user retry instead of going to report.
          return;
        }
        hasCompletedRef.current = true;
        
        if (detections.length > 0) {
           setLogs(prev => [...prev, "Inference Complete.", `Signatures Resolved: ${detections.length}`]);
        } else {
           setLogs(prev => [...prev, "Inference Complete.", "No Anomalies Detected."]);
        }
        
        const timer = setTimeout(() => {
          onCompleteRef.current();
        }, 1500);
        return () => clearTimeout(timer);
    }
  }, [status, detections, errorState]);

  const handleRetry = () => {
    resetScan();
    onBack();
  };

  // If there's an error state (e.g. TinyML validation failed), show a beautiful failure state
  if (errorState) {
    return (
      <div className="w-full flex flex-col items-center justify-center animate-fade-in bg-black/40 rounded-2xl border-2 border-red-500/40 p-6 space-y-6 shadow-[0_0_25px_rgba(239,68,68,0.15)]">
        {/* Glowing Warning Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse"></div>
          <span className="material-symbols-rounded text-[72px] text-red-500 animate-pulse relative z-10">
            {errorState.icon || 'warning_amber'}
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-red-500 uppercase tracking-widest">
            Validation Failed
          </h3>
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            TinyML Substrate Guard
          </p>
        </div>

        {/* Error Detail */}
        <div className="w-full max-w-sm bg-red-950/20 border border-red-500/20 rounded-xl p-4 space-y-3">
          <div className="text-[10px] text-red-200 font-mono leading-relaxed">
            {errorState.reason}
          </div>
          
          <div className="border-t border-red-500/10 pt-3 space-y-2">
            <div className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest">
              Standard Operating Procedure (SOP):
            </div>
            <ul className="text-[9px] font-mono text-gray-300 space-y-1.5 list-disc pl-4 leading-tight">
              <li>Place your chromatography paper on a flat, solid, dark, non-reflective surface.</li>
              <li>Ensure the entire rectangular paper strip is fully visible, flatly laid down, and centered.</li>
              <li>Ensure even, sufficient UV or brightfield illumination to resolve clear boundaries.</li>
              <li>Avoid high specular reflections, glares, or busy backgrounds (e.g. cluttered desks, skin, or floors).</li>
            </ul>
          </div>
        </div>

        {/* Go Back and Recapture */}
        <button
          onClick={handleRetry}
          className="px-6 py-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-red-950/20"
        >
          <span className="material-symbols-rounded text-[16px]">arrow_back</span>
          Retract & Capture Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in relative overflow-hidden bg-black/40 rounded-2xl border border-white/10 p-4">
      
      {/* Central Visual */}
      <div className="relative mb-8">
         <div className="absolute inset-0 bg-neon-cyan/20 blur-2xl rounded-full animate-pulse"></div>
         <span className="material-symbols-rounded text-[80px] text-neon-cyan animate-pulse relative z-10">neurology</span>
         <div className="absolute -inset-6 border-2 border-dashed border-neon-cyan/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
         <div className="absolute -inset-12 border border-white/5 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>
      </div>

      {/* Status Text */}
      <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 animate-pulse">
        {isScanning ? "Running Tensor Ops..." : "Finalizing..."}
      </h3>
      
      {/* Terminal Output */}
      <div className="w-full max-w-xs bg-black/80 rounded-xl p-3 border border-white/10 font-mono text-[9px] h-32 overflow-hidden flex flex-col justify-end shadow-inner">
         {logs.slice(-5).map((log, i) => (
           <div key={i} className="text-neon-cyan/80 mb-1 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
             <span className="text-ultra-violet">»</span> {log}
           </div>
         ))}
         {(isScanning) && (
           <div className="text-neon-cyan/80 animate-pulse">
             <span className="text-ultra-violet">»</span> _
           </div>
         )}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-ultra-violet via-neon-cyan to-ultra-violet animate-loading-bar"></div>
    </div>
  );
};
