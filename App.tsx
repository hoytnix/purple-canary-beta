'use client';

import React, { useState, useEffect } from 'react';
import { SOPTutorial } from './components/SOPTutorial';
import { SignatureLibrary } from './components/SignatureLibrary';
import { MenuModal } from './components/MenuModal';
import { MyAccount } from './components/MyAccount';
import { LandingPage } from './components/LandingPage';
import { ScannerProvider, useScanner } from './contexts/ScannerContext';
import { WorkflowPhase } from './types';
import { WorkflowLayout } from './components/workflow/WorkflowLayout';
import { PhaseSelection } from './components/workflow/PhaseSelection';
import { PhaseCapture } from './components/workflow/PhaseCapture';
import { PhaseAnalysis } from './components/workflow/PhaseAnalysis';
import { PhaseReport } from './components/workflow/PhaseReport';
import { getOrCreateIdentity } from './services/identity';
import { seedScansIfEmpty } from './services/firestoreService';

type ViewState = 'LANDING' | 'WORKFLOW';

interface WorkflowEngineProps {
  initialView?: ViewState;
}

export const WorkflowEngine: React.FC<WorkflowEngineProps> = ({ initialView = 'LANDING' }) => {
  const [view, setView] = useState<ViewState>(initialView);
  const [phase, setPhase] = useState<WorkflowPhase>('CALIBRATION');
  const [showSOP, setShowSOP] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const { resetScan } = useScanner();

  useEffect(() => {
    getOrCreateIdentity();
    seedScansIfEmpty().catch(err => console.error('Seeding error:', err));

    // Handle payment return parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const sessionId = urlParams.get('session_id');

      if (paymentStatus === 'success' && sessionId) {
        // Authenticate & activate unlimited tier
        fetch(`/api/checkout/verify-session?session_id=${encodeURIComponent(sessionId)}`)
          .then(res => res.json())
          .then(data => {
            if (data.userId) {
              localStorage.setItem('pc_onboarding_email', data.userId);
            }
            if (data.tier) {
              localStorage.setItem('pc_user_tier', data.tier);
            }
            window.dispatchEvent(new Event('storage'));
            // Remove search params cleanly without reload
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          })
          .catch(err => {
            console.error('Session verification error:', err);
            // Fallback: unlock unlimited tier directly
            localStorage.setItem('pc_user_tier', 'unlimited');
            window.dispatchEvent(new Event('storage'));
          });

        setView('WORKFLOW');
      }
    }
  }, []);

  const handleReset = () => {
    resetScan();
    setPhase('CALIBRATION');
  };

  const handleEnterWorkflow = () => {
    setView('WORKFLOW');
    // Ensure we start fresh
    handleReset();
  };

  const handleReturnHome = () => {
    setView('LANDING');
    // Optionally reset state when returning home, or keep it alive. 
    // For privacy/security aesthetic, we reset.
    handleReset();
  };

  if (view === 'LANDING') {
    return <LandingPage onEnter={handleEnterWorkflow} />;
  }

  return (
    <>
      {showSOP && <SOPTutorial onClose={() => setShowSOP(false)} />}
      {showLibrary && <SignatureLibrary onClose={() => setShowLibrary(false)} />}
      {showAccount && <MyAccount onClose={() => setShowAccount(false)} />}
      {showMenu && (
        <MenuModal 
          onClose={() => setShowMenu(false)} 
          onOpenSOP={() => setShowSOP(true)} 
          onOpenLibrary={() => setShowLibrary(true)} 
          onOpenHome={handleReturnHome}
        />
      )}
      
      <WorkflowLayout 
        currentPhase={phase}
        onOpenMenu={() => setShowMenu(true)}
        onOpenAccount={() => setShowAccount(true)}
        onPhaseChange={setPhase}
      >
        {phase === 'CALIBRATION' && (
          <PhaseSelection onNext={() => setPhase('ACQUISITION')} />
        )}
        
        {phase === 'ACQUISITION' && (
          <PhaseCapture onNext={() => setPhase('ANALYSIS')} />
        )}

        {phase === 'ANALYSIS' && (
          <PhaseAnalysis 
            onComplete={() => setPhase('VERDICT')} 
            onBack={() => setPhase('ACQUISITION')}
          />
        )}

        {phase === 'VERDICT' && (
          <PhaseReport onReset={handleReset} />
        )}
      </WorkflowLayout>
    </>
  );
};

export default function App({ initialView = 'LANDING' }: { initialView?: ViewState }) {
  return (
    <ScannerProvider>
      <WorkflowEngine initialView={initialView} />
    </ScannerProvider>
  );
}