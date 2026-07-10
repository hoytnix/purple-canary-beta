

import React from 'react';
import { Header } from '../Header';
import { WorkflowPhase } from '../../types';
import { CheckoutWizard } from '../CheckoutWizard';

interface WorkflowLayoutProps {
  currentPhase: WorkflowPhase;
  children: React.ReactNode;
  onOpenMenu: () => void;
  onOpenAccount: () => void;
  onPhaseChange: (phase: WorkflowPhase) => void;
}

const STEPS: { id: WorkflowPhase; label: string; number: string }[] = [
  { id: 'CALIBRATION', label: 'Setup', number: '01' },
  { id: 'ACQUISITION', label: 'Scan', number: '02' },
  { id: 'ANALYSIS', label: 'Analyze', number: '03' },
  { id: 'VERDICT', label: 'Report', number: '04' },
];

export const WorkflowLayout: React.FC<WorkflowLayoutProps> = ({ 
  currentPhase, 
  children,
  onOpenMenu,
  onOpenAccount,
  onPhaseChange
}) => {
  const currentStepIndex = STEPS.findIndex(s => s.id === currentPhase);
  const [userTier, setUserTier] = React.useState<string>(() => localStorage.getItem('pc_user_tier') || 'free');
  const [showKitCheckout, setShowKitCheckout] = React.useState(false);

  React.useEffect(() => {
    const checkTier = () => {
      const tier = localStorage.getItem('pc_user_tier') || 'free';
      if (tier !== userTier) {
        setUserTier(tier);
      }
    };
    const interval = setInterval(checkTier, 1000);
    return () => clearInterval(interval);
  }, [userTier]);

  React.useEffect(() => {
    if (userTier !== 'unlimited') {
      const script = document.createElement('script');
      script.src = 'https://quge5.com/88/tag.min.js';
      script.setAttribute('data-zone', '258183');
      script.setAttribute('async', 'true');
      script.setAttribute('data-cfasync', 'false');
      script.id = 'monetag-ad-script';
      document.head.appendChild(script);

      return () => {
        const existingScript = document.getElementById('monetag-ad-script');
        if (existingScript) {
          existingScript.remove();
        }
      };
    } else {
      const existingScript = document.getElementById('monetag-ad-script');
      if (existingScript) {
        existingScript.remove();
      }
    }
  }, [userTier]);

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center bg-[#1a052b] overflow-hidden">
      
      {/* Fixed Header Section */}
      <div className="shrink-0 w-full z-20 bg-[#1a052b]/95 backdrop-blur-md border-b border-white/5 pb-2">
        <div className={`mx-auto px-4 pt-2 flex flex-col gap-2 transition-all duration-300 ${currentPhase === 'CALIBRATION' ? 'max-w-5xl' : 'max-w-2xl'}`}>
          <Header onOpenMenu={onOpenMenu} onOpenAccount={onOpenAccount} />
          
          {/* Progress Stepper */}
          <div className="flex justify-between items-center px-1">
            {STEPS.map((step, idx) => {
              const isActive = step.id === currentPhase;
              const isCompleted = idx < currentStepIndex;
              const isClickable = isCompleted;
              
              return (
                <button 
                  key={step.id} 
                  onClick={() => isClickable && onPhaseChange(step.id)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center gap-1.5 transition-all outline-none group
                    ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <div className={`
                    w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-mono font-bold text-[10px] md:text-xs border-2 transition-all duration-500
                    ${isActive 
                      ? 'border-neon-cyan text-[#1a052b] bg-neon-cyan shadow-[0_0_10px_#00FFFF]' 
                      : isCompleted 
                        ? 'border-ultra-violet text-white bg-ultra-violet' 
                        : 'border-white/20 text-gray-600 bg-[#1a052b]'
                    }
                  `}>
                    {isCompleted ? <span className="material-symbols-rounded text-[14px]">check</span> : step.number}
                  </div>
                  <span className={`
                    text-[8px] font-black uppercase tracking-widest transition-colors duration-300
                    ${isActive ? 'text-neon-cyan' : isCompleted ? 'text-ultra-violet' : 'text-gray-700'}
                  `}>
                    {step.label}
                  </span>
                </button>
              );
            })}
            
            {/* Connecting Line (Background) */}
            <div className="absolute left-0 right-0 top-[6rem] md:top-[7rem] h-px bg-white/5 -z-10" />
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable & Flex Grow */}
      <div className={`flex-1 w-full flex flex-col overflow-y-auto overflow-x-hidden p-4 relative no-scrollbar pb-0 transition-all duration-300 ${currentPhase === 'CALIBRATION' ? 'max-w-5xl' : 'max-w-2xl'}`}>
        {children}
      </div>

      {/* Monetag Sponsor Ad for Free Tier users */}
      {userTier === 'free' && (
        <div className={`w-full px-4 pb-2 shrink-0 mx-auto transition-all duration-300 ${currentPhase === 'CALIBRATION' ? 'max-w-5xl' : 'max-w-2xl'}`}>
          <div className="p-3 bg-[#130321]/80 border border-ultra-violet/30 rounded-2xl flex items-center justify-between gap-3 shadow-lg shadow-purple-950/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/25 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-neon-cyan text-[18px]">ad_units</span>
              </div>
              <div>
                <div className="text-[7px] font-mono text-neon-cyan/60 uppercase tracking-widest leading-none font-bold">SPONSOR AD // MONETAG</div>
                <div className="text-[9px] text-gray-300 font-mono mt-1 font-bold leading-tight">Need refill kits? Reusable Dual-UV hardware & chromatography strips are less than $1 per run!</div>
              </div>
            </div>
            <button 
              onClick={() => setShowKitCheckout(true)}
              className="px-2.5 py-1.5 bg-ultra-violet text-white font-mono text-[8px] font-black uppercase rounded-lg hover:bg-neon-cyan hover:text-[#1a052b] transition-all shrink-0 cursor-pointer"
            >
              Get Kit
            </button>
          </div>
        </div>
      )}

      {showKitCheckout && (
        <div className="fixed inset-0 z-50 bg-[#1a052b]/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md relative">
            <button 
              onClick={() => setShowKitCheckout(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-full z-20"
            >
              <span className="material-symbols-rounded text-[20px]">close</span>
            </button>
            <CheckoutWizard 
              onComplete={() => {
                setShowKitCheckout(false);
                const tier = localStorage.getItem('pc_user_tier') || 'free';
                setUserTier(tier);
              }} 
            />
          </div>
        </div>
      )}

      <footer className="shrink-0 w-full py-2 bg-[#1a052b] border-t border-white/5 text-[8px] font-mono text-gray-600 uppercase tracking-widest text-center z-10">
        Purple Canary Pipeline vβ // {currentPhase}
      </footer>
    </div>
  );
};