
import React, { useState } from 'react';
import { generateEvidenceCard, downloadEvidence, generatePDFReport } from '../services/exportService';
import { useScanner } from '../contexts/ScannerContext';

export const ResultsDisplay: React.FC = () => {
  const { 
    detections, 
    buffer365, 
    buffer395,
    combinedBuffer,
    geminiAnalysis,
    isGeminiLoading
  } = useScanner();

  const [isExporting, setIsExporting] = useState(false);

  // Return null ONLY if we are not loading or displaying Gemini
  if (!isGeminiLoading && !geminiAnalysis) return null;

  // Enable download if we have Dual Bands (buffer365 & buffer395) OR a Single Source Upload (combinedBuffer)
  const hasEvidence = (!!buffer365 && !!buffer395) || !!combinedBuffer;

  const handleDownloadEvidence = async () => {
    if (!hasEvidence) return;
    
    setIsExporting(true);
    try {
      const primary = buffer365 || combinedBuffer;
      const secondary = buffer395 || null;

      const evidenceImage = await generateEvidenceCard(primary, secondary, detections, geminiAnalysis);
      const filename = `PURPLE_CANARY_EVIDENCE_${Date.now()}.png`;
      downloadEvidence(evidenceImage, filename);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!hasEvidence) return;
    
    setIsExporting(true);
    try {
      const primary = buffer365 || combinedBuffer;
      const secondary = buffer395 || null;

      await generatePDFReport(primary, secondary, detections, geminiAnalysis);
    } catch (error) {
      console.error("Report generation failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to render markdown beautifully and cleanly
  const renderMarkdown = (md: string) => {
    if (!md) return null;
    return md.split('\n').map((line, idx) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('### ')) {
        return <h4 key={idx} className="text-xs font-black text-neon-cyan mt-3 mb-1 uppercase tracking-wider">{trimmedLine.replace('### ', '')}</h4>;
      }
      if (trimmedLine.startsWith('## ')) {
        return <h3 key={idx} className="text-sm font-black text-white mt-4 mb-2 uppercase tracking-wide border-b border-white/5 pb-1">{trimmedLine.replace('## ', '')}</h3>;
      }
      if (trimmedLine.startsWith('# ')) {
        return <h2 key={idx} className="text-base font-black text-white mt-5 mb-3 uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-ultra-violet">{trimmedLine.replace('# ', '')}</h2>;
      }
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 text-[10px] text-gray-300 font-mono my-1 pl-2">
            <span className="text-neon-cyan text-xs select-none">•</span>
            <span>{trimmedLine.substring(2)}</span>
          </div>
        );
      }
      if (trimmedLine === '') return <div key={idx} className="h-2" />;
      return <p key={idx} className="text-[10px] text-gray-400 font-mono leading-relaxed mb-2">{trimmedLine}</p>;
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 2. SECURE GEMINI AI LOADER */}
      {isGeminiLoading && (
        <div className="bg-[#120422]/60 border border-ultra-violet/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 animate-pulse">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-ultra-violet/10 border-t-neon-cyan animate-spin" />
            <span className="material-symbols-rounded absolute text-neon-cyan text-[20px] animate-pulse">psychology</span>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold text-white uppercase tracking-widest">Querying Secure AI Core...</div>
            <div className="text-[9px] font-mono text-gray-400">Gemini 3.5 Flash is analyzing your chromatography plate images</div>
          </div>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neon-cyan to-ultra-violet w-2/3 animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      )}

      {/* 3. GEMINI SPECTRUM AI FORENSIC REPORT PANEL */}
      {geminiAnalysis && (
        <div className="bg-gradient-to-b from-[#16022c]/80 to-[#0e001f]/95 border-2 border-ultra-violet/30 rounded-3xl p-5 space-y-4 shadow-[0_0_20px_rgba(151,71,255,0.15)] animate-in fade-in zoom-in-95 duration-500">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-ultra-violet/10 p-1.5 rounded-lg border border-ultra-violet/20 flex items-center justify-center">
                <span className="material-symbols-rounded text-[18px] text-neon-cyan animate-pulse">psychology</span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-white uppercase tracking-widest">Gemini 3.5 Flash</div>
                <div className="text-[8px] font-mono text-neon-cyan uppercase">Multimodal Forensic AI Core</div>
              </div>
            </div>
            
            {/* Verdict Badge */}
            <div className={`px-2.5 py-1 rounded-full border text-[9px] font-mono font-black uppercase tracking-widest shadow-sm
              ${geminiAnalysis.forensicVerdict === 'CLEAN' 
                ? 'bg-green-950/40 border-green-500 text-green-400 shadow-green-500/10'
                : geminiAnalysis.forensicVerdict === 'WARNING'
                  ? 'bg-yellow-950/40 border-yellow-500 text-yellow-400 shadow-yellow-500/10'
                  : geminiAnalysis.forensicVerdict === 'INCONCLUSIVE'
                    ? 'bg-slate-900/60 border-slate-500 text-slate-400 shadow-slate-500/15'
                    : 'bg-red-950/40 border-red-500 text-red-400 shadow-red-500/10'
              }
            `}>
              AI Verdict: {geminiAnalysis.forensicVerdict}
            </div>
          </div>

          {/* Validity Warning Banner */}
          {geminiAnalysis.isTLCPaper === false && (
            <div className="bg-red-950/20 border-2 border-red-500/40 rounded-2xl p-4 flex gap-3 items-start">
              <span className="material-symbols-rounded text-red-400 text-[24px]">warning_amber</span>
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-widest">Invalid Substrate Detected</h4>
                <p className="text-[10px] text-gray-300 font-mono leading-relaxed">
                  The AI model determined that the uploaded image does not appear to contain a valid Thin-Layer Chromatography (TLC) plate or paper strip. This test is marked as inconclusive.
                </p>
              </div>
            </div>
          )}

          {/* Classes Detected Chips */}
          {geminiAnalysis.classesDetected && geminiAnalysis.classesDetected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {geminiAnalysis.classesDetected.map((cls, idx) => (
                <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[8px] font-mono text-gray-300 font-bold uppercase tracking-wider">
                  {cls}
                </span>
              ))}
            </div>
          )}

          {/* Confidence Scorecard */}
          <div className="space-y-3 bg-black/30 p-3.5 rounded-2xl border border-white/5">
            <div className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-rounded text-[12px] text-neon-cyan">bar_chart</span>
              Chemical Class Confidence Scores
            </div>
            
            <div className="space-y-2.5">
              {geminiAnalysis.confidenceScores.map((scoreCard, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-white font-bold">{scoreCard.category}</span>
                    <span className="text-neon-cyan font-black">{scoreCard.score.toFixed(0)}%</span>
                  </div>
                  {/* Glowing progress bar */}
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-ultra-violet"
                      style={{ width: `${scoreCard.score}%` }}
                    />
                  </div>
                  <div className="text-[8px] text-gray-500 italic leading-tight pl-1 font-mono">
                    {scoreCard.rationale}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Observations Block */}
          {geminiAnalysis.visualObservations && (
            <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 space-y-1">
              <div className="text-[8px] font-mono text-neon-cyan uppercase tracking-widest font-black">Visual Plate Characterization</div>
              <p className="text-[10px] text-gray-300 italic font-mono leading-relaxed">
                "{geminiAnalysis.visualObservations}"
              </p>
            </div>
          )}

          {/* Actionable SOP */}
          {geminiAnalysis.suggestedSOP && (
            <div className="bg-[#ffaa00]/5 border border-[#ffaa00]/15 p-3 rounded-xl space-y-1">
              <div className="text-[8px] font-mono text-[#ffaa00] uppercase tracking-widest font-black flex items-center gap-1">
                <span className="material-symbols-rounded text-[12px]">clinical_notes</span>
                Actionable SOP Recommendation
              </div>
              <p className="text-[10px] text-[#ffaa00]/90 font-mono leading-relaxed">
                {geminiAnalysis.suggestedSOP}
              </p>
            </div>
          )}

          {/* Detailed Forensic Report Markdown */}
          {geminiAnalysis.detailedReportMarkdown && (
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 max-h-72 overflow-y-auto custom-scrollbar space-y-1 scroll-smooth">
              <div className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-black mb-2 border-b border-white/10 pb-1.5 flex items-center gap-1.5 sticky top-0 bg-[#0c001b] z-10">
                <span className="material-symbols-rounded text-[12px] text-neon-cyan">assignment</span>
                Comprehensive Narrative Laboratory Log
              </div>
              <div className="space-y-1 select-text selection:bg-neon-cyan/30">
                {renderMarkdown(geminiAnalysis.detailedReportMarkdown)}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Evidence Export Actions */}
      {hasEvidence && (
        <div className="flex gap-3">
            <button 
              onClick={handleDownloadEvidence}
              disabled={isExporting}
              className="flex-1 py-4 bg-ultra-violet/10 border border-ultra-violet/30 rounded-2xl flex items-center justify-center gap-2 text-ultra-violet font-black uppercase tracking-widest hover:bg-ultra-violet/20 hover:border-ultra-violet/50 transition-all active:scale-[0.98] group text-[10px]"
            >
              {isExporting ? (
                 <span className="material-symbols-rounded text-[16px] animate-spin">progress_activity</span> 
              ) : (
                 <span className="material-symbols-rounded text-[16px] group-hover:-translate-y-1 transition-transform">download</span>
              )}
              Evidence Card
            </button>
            <button 
              onClick={handleDownloadReport}
              disabled={isExporting}
              className="flex-1 py-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-2xl flex items-center justify-center gap-2 text-neon-cyan font-black uppercase tracking-widest hover:bg-neon-cyan/20 hover:border-neon-cyan/50 transition-all active:scale-[0.98] group text-[10px]"
            >
              {isExporting ? (
                 <span className="material-symbols-rounded text-[16px] animate-spin">progress_activity</span>
              ) : (
                 <span className="material-symbols-rounded text-[16px] group-hover:-translate-y-1 transition-transform">description</span>
              )}
              Full Report
            </button>
        </div>
      )}
      
      <div className="text-center pb-2">
        <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">DIGITAL POISON METER Beta</span>
      </div>
    </div>
  );
};
