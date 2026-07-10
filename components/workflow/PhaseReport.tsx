
import React from 'react';
import { ResultsDisplay } from '../ResultsDisplay';
import { useScanner } from '../../contexts/ScannerContext';

interface PhaseReportProps {
  onReset: () => void;
}

export const PhaseReport: React.FC<PhaseReportProps> = ({ onReset }) => {
  const { geminiAnalysis } = useScanner();

  // Determine High-Level Verdict purely from Gemini forensic analysis
  const verdict = geminiAnalysis?.forensicVerdict || 'UNKNOWN';

  let badgeBgClass = 'bg-slate-950/40 border-slate-500 shadow-slate-950/20';
  let textClass = 'text-slate-400';
  let title = 'UNKNOWN';
  let description = 'No active forensic report loaded.';

  if (verdict === 'CLEAN') {
    badgeBgClass = 'bg-green-950/40 border-green-500 shadow-green-950/20';
    textClass = 'text-green-500';
    title = 'CLEAN';
    description = 'The Gemini AI analysis confirms no hazardous substances or critical anomalies detected.';
  } else if (verdict === 'WARNING') {
    badgeBgClass = 'bg-yellow-950/20 border-yellow-500 shadow-yellow-900/10';
    textClass = 'text-yellow-500';
    title = 'WARNING / ADULTERATED';
    description = 'Gemini AI has flagged potential active adulterants or medium-risk compound groups.';
  } else if (verdict === 'CRITICAL') {
    badgeBgClass = 'bg-red-950/40 border-red-500 shadow-red-900/20';
    textClass = 'text-red-500 animate-pulse';
    title = 'CRITICAL RISK';
    description = 'Gemini AI has detected highly hazardous, lethal, or toxic substances on the plate.';
  } else if (verdict === 'INCONCLUSIVE') {
    badgeBgClass = 'bg-slate-900/60 border-slate-500 shadow-slate-900/15';
    textClass = 'text-slate-400';
    title = 'INCONCLUSIVE';
    description = 'The analysis is inconclusive. Substrate or illumination levels did not meet standards.';
  }

  return (
    <div className="w-full flex flex-col gap-4 animate-slide-in pb-4">
      
      {/* Verdict Header */}
      <div className={`
        p-5 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-2 shadow-xl shrink-0
        ${badgeBgClass}
      `}>
         <div className="text-[8px] font-mono uppercase tracking-widest opacity-80">
            Forensic Verdict
         </div>
         <h2 className={`text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-tight
            ${textClass}
         `}>
            {title}
         </h2>
         <p className="text-[10px] font-mono max-w-xs opacity-70">
            {description}
         </p>
      </div>

      {/* Detailed Evidence - Scrollable internally via parent */}
      <ResultsDisplay />

      {/* Action Footer */}
      <div className="flex justify-center pt-4 shrink-0 mt-auto">
        <button 
           onClick={onReset}
           className="px-6 py-3 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:scale-105 transition-all"
        >
           <span className="material-symbols-rounded text-[16px]">refresh</span> New Pipeline
        </button>
      </div>
    </div>
  );
};