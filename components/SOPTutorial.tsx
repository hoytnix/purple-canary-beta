

import React, { useState } from 'react';
import { BASIC_STEPS, EXPERT_SECTIONS } from '../sopData';

interface SOPTutorialProps {
  onClose: () => void;
}

export const SOPTutorial: React.FC<SOPTutorialProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'BASIC' | 'EXPERT'>('BASIC');

  return (
    <div className="fixed inset-0 z-50 bg-[#1a052b]/95 backdrop-blur-md overflow-y-auto p-4 md:p-6 animate-in fade-in duration-300">
      <div className="max-w-xl mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex justify-between items-start sticky top-0 bg-[#1a052b]/80 backdrop-blur-xl py-4 z-20 border-b border-ultra-violet/20 -mx-4 px-4 md:mx-0 md:px-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black italic tracking-tighter text-neon-cyan uppercase">
              {mode === 'BASIC' ? 'Purple Canary Protocol' : '999_FUD_DECODER_vβ'}
            </h2>
            <p className="text-[10px] font-mono text-gray-400 uppercase">
              {mode === 'BASIC' ? 'Field Calibration Protocol' : 'Advanced Limonene Matrix Standard'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-rounded text-white text-[24px]">close</span>
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-ultra-violet/10 rounded-xl border border-ultra-violet/30 sticky top-20 z-10 backdrop-blur-md">
          <button 
            onClick={() => setMode('BASIC')}
            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mode === 'BASIC' ? 'bg-neon-cyan text-[#1a052b] shadow-lg shadow-neon-cyan/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <span className="material-symbols-rounded text-[16px]">menu_book</span> Basic
          </button>
          <button 
            onClick={() => setMode('EXPERT')}
            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mode === 'EXPERT' ? 'bg-ultra-violet text-white shadow-lg shadow-ultra-violet/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <span className="material-symbols-rounded text-[16px]">school</span> Expert
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {mode === 'BASIC' ? (
             <div className="space-y-6">
                {BASIC_STEPS.map((s) => (
                  <section key={s.step} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-${s.color}-500/20 flex items-center justify-center font-black text-${s.color}-500`}>{s.step}</div>
                      <h3 className="font-black text-white italic uppercase">{s.title}</h3>
                    </div>
                    <div className={`glass p-4 rounded-3xl border-l-4 border-${s.color}-500 bg-white/5`}>
                      <p className="text-xs font-mono text-gray-300 leading-relaxed">{s.text}</p>
                    </div>
                  </section>
                ))}
             </div>
          ) : (
             <ExpertContentRenderer />
          )}
        </div>

        {/* Footer Action */}
        <button onClick={onClose} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-white uppercase tracking-widest hover:bg-white/10 transition-colors shadow-xl">
          Close Guide
        </button>
      </div>
    </div>
  );
};

const ExpertContentRenderer = () => (
  <div className="space-y-8 font-mono pb-4">
    {/* Intro */}
    <div className="p-4 border border-neon-cyan/20 bg-neon-cyan/5 rounded-2xl">
      <h3 className="text-neon-cyan font-bold uppercase text-xs mb-2">Objective</h3>
      <p className="text-gray-300 text-xs leading-relaxed">
        To achieve <span className="text-white font-bold">999.99999997% precision</span> using the <span className="text-neon-cyan">D-Limonene Exclusion Principle</span>.
      </p>
    </div>

    {EXPERT_SECTIONS.map((section, idx) => (
      <section key={idx} className="space-y-4">
        <div className={`flex items-center gap-2 text-${section.color}-500 border-b border-${section.color}-500/20 pb-2`}>
          <span className="material-symbols-rounded text-[20px]">{section.icon}</span>
          <h3 className="font-black uppercase italic">{section.title}</h3>
        </div>
        <div className="space-y-4 pl-2">
          {section.items.map((item, itemIdx) => (
            <div key={itemIdx} className="space-y-1">
              <h4 className={`text-white font-bold text-xs uppercase flex items-center gap-2 ${item.alert ? 'text-red-500 animate-pulse' : ''}`}>
                {item.icon && <span className={`material-symbols-rounded text-[12px] ${item.subtitle.includes('Botanical') ? 'text-red-500' : 'text-white'}`}>{item.icon}</span>}
                {item.subtitle}
              </h4>
              <p className="text-gray-400 text-[10px] leading-relaxed">
                {item.highlight ? (
                  <>
                    {item.text.split(item.highlight)[0]}
                    <span className="text-red-500 font-black">{item.highlight}</span>
                    {item.text.split(item.highlight)[1]}
                  </>
                ) : (
                  item.text
                )}
              </p>
            </div>
          ))}
        </div>
      </section>
    ))}

    {/* Quote */}
    <div className="pt-4 text-center">
      <p className="text-[10px] text-gray-500 italic">"Trust the Physics. Polar Cuts don't Run."</p>
    </div>
  </div>
);