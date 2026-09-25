'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('@/App'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-[#1a052b] text-neon-cyan font-mono text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
        <span>INITIALIZING FORENSIC MATRIX...</span>
      </div>
    </div>
  ),
});

export default function Page() {
  return <App />;
}
