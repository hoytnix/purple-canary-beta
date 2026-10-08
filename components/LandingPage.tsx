import React, { useState, useEffect } from 'react';
import { CheckoutWizard } from './CheckoutWizard';
import { LoginOverlay } from './LoginOverlay';
import { PrivacyPolicy } from './PrivacyPolicy';
import { CONTINENTS } from '../constants/index';
import { subscribeAllLatestScanRecords } from '../services/scanService';

const getContinentForLocation = (location: string) => {
  const locUpper = (location || '').toUpperCase();
  if (locUpper.includes('EUROPE') || locUpper.includes('EU') || locUpper.includes('PARIS') || locUpper.includes('BERLIN') || locUpper.includes('LONDON')) {
    return { code: 'EU', flag: '🌍' };
  }
  if (locUpper.includes('ASIA') || locUpper.includes('TOKYO') || locUpper.includes('SEOUL') || locUpper.includes('APAC')) {
    return { code: 'AS', flag: '🌏' };
  }
  if (locUpper.includes('OCEANIA') || locUpper.includes('SYDNEY') || locUpper.includes('AUS')) {
    return { code: 'OC', flag: '🌏' };
  }
  if (locUpper.includes('AFRICA') || locUpper.includes('NRO')) {
    return { code: 'AF', flag: '🌍' };
  }
  if (locUpper.includes('SOUTH AMERICA') || locUpper.includes('BRAZIL') || locUpper.includes('LATAM')) {
    return { code: 'SA', flag: '🌎' };
  }
  // Default to North America
  return { code: 'NA', flag: '🌎' };
};

const formatRelativeTime = (createdAtStr: string): string => {
  if (!createdAtStr) return '1m';
  const created = new Date(createdAtStr);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMins < 60) {
    return `${diffMins}m`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
};

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [tickerOffset, setTickerOffset] = useState(0);
  const [activity, setActivity] = useState<any[]>([]);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [uniquePublicKeys, setUniquePublicKeys] = useState<number>(0);

  // Animation loop for the ticker
  useEffect(() => {
    const interval = setInterval(() => {
        // Move 1.5px per frame (approx 90px/sec at 60fps) for smooth card scrolling (3x speed)
        // Reset at 3000px to ensure seamless loop with the repeated data array
        setTickerOffset(prev => (prev + 1.5) % 3000);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // Listen to live scan updates across the network
  useEffect(() => {
    const unsubscribe = subscribeAllLatestScanRecords((data) => {
      const { items, totalScans: scansCount, uniquePublicKeys: keysCount } = data;
      setTotalScans(scansCount);
      setUniquePublicKeys(keysCount);

      if (items && items.length > 0) {
        const mapped = items.map((rec) => {
          const continent = getContinentForLocation(rec.location);
          
          let displayType = 'UNKNOWN';
          if (rec.detections && rec.detections.length > 0) {
            displayType = rec.detections.map((d: any) => d.name).join(' + ').toUpperCase();
          } else if (rec.matrix) {
            displayType = rec.matrix.replace('_', ' ').toUpperCase();
          }

          const timeStr = formatRelativeTime(rec.createdAt);

          return {
            type: displayType,
            shortDescription: rec.shortDescription || displayType,
            longDescription: rec.longDescription || 'No detailed analysis available.',
            flag: continent.flag,
            region: continent.code,
            status: rec.verdict || 'CLEAN',
            time: timeStr
          };
        });
        setActivity(mapped);
      } else {
        setActivity([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const scrollToProtocols = () => {
    document.getElementById('protocols')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 bg-[#1a052b] z-50 font-sans overflow-y-auto no-scrollbar scroll-smooth">
      
      {/* --- OVERLAYS --- */}
      {showLogin && <LoginOverlay onSuccess={onEnter} onClose={() => setShowLogin(false)} />}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      
      {/* --- BACKGROUND AMBIENCE --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] bg-ultra-violet/20 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-neon-cyan/10 rounded-full blur-[100px]"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      </div>

      {/* --- NAV HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4 md:p-6 flex justify-between items-center backdrop-blur-sm bg-[#1a052b]/50 border-b border-white/5">
        <div className="flex items-center gap-3">
             <div className="relative group">
                <div className="absolute inset-0 bg-neon-cyan/20 blur-sm rounded-lg group-hover:bg-neon-cyan/30 transition-all duration-500"></div>
                <img 
                  src="https://i.ibb.co/C3Jc6MKH/Gemini-Generated-Image-p4r67dp4r67dp4r6-removebg-preview.png" 
                  alt="Logo" 
                  className="relative w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gray-800 border border-white/20 p-1 shadow-xl transition-transform"
                />
             </div>
            <div className="flex flex-col">
                <span className="text-sm font-black text-white uppercase tracking-tighter leading-none">Purple Canary</span>
                <span className="text-[8px] font-mono text-gray-400 tracking-widest">FORENSIC SUITE vβ</span>
            </div>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="https://book.purplecanarylab.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/60 text-xs font-mono text-purple-300 hover:text-white transition shadow-sm group"
            title="Read 'What Was In That Joint Bro!?' Free E-Reader"
          >
            <span className="material-symbols-rounded text-[16px] text-neon-cyan group-hover:scale-110 transition-transform">menu_book</span>
            <span className="hidden sm:inline font-semibold">Free E-Book</span>
            <span className="material-symbols-rounded text-[12px] opacity-70">open_in_new</span>
          </a>
        </div>
      </header>

      {/* --- SECTION 1: HERO --- */}
      <section className="relative z-10 min-h-screen flex flex-col md:flex-row items-center justify-center p-6 pt-24 md:pt-12 max-w-7xl mx-auto gap-12">
        
        {/* Hero Copy */}
        <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-neon-cyan/10 border border-neon-cyan/20 px-3 py-1 rounded-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
                <span className="text-[10px] font-bold text-neon-cyan uppercase tracking-widest">Find Out Instantly</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black italic text-white leading-[0.9] tracking-tighter drop-shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                WHAT WAS IN <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-ultra-violet">THAT JOINT?</span>
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl font-medium max-w-lg mx-auto md:mx-0 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                Instant chromatographic analysis for identifying adulterants, cuts, and poisons.
            </p>

            <div className="flex flex-col md:flex-row items-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                    <span className="material-symbols-rounded text-[16px] text-green-500">verified_user</span> 
                    <span>Verified Accuracy</span>
                </div>
                <div className="w-1 h-1 bg-gray-700 rounded-full hidden md:block"></div>
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                    <span className="material-symbols-rounded text-[16px] text-yellow-500">bolt</span> 
                    <span>Instant Results</span>
                </div>
            </div>

            {/* Hardware Kit Preview Image */}
            <div className="pt-2 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-400">
                <div className="relative group max-w-sm md:max-w-md mx-auto md:mx-0 rounded-2xl overflow-hidden border border-white/10 bg-[#1a052b]/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <a href="https://i.ibb.co/JwGDZHMQ/download.png" target="_blank" rel="noopener noreferrer" className="block focus:outline-none">
                        <img 
                            src="https://i.ibb.co/JwGDZHMQ/download.png" 
                            alt="Forensic Hardware Kit" 
                            className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                            referrerPolicy="no-referrer"
                        />
                    </a>
                </div>
            </div>
        </div>

        {/* Hero Checkout Instance #1 */}
        <div className="flex-1 w-full max-w-md animate-in fade-in slide-in-from-right-16 duration-1000 delay-500">
            <CheckoutWizard onComplete={onEnter} className="border-neon-cyan/30 shadow-[0_0_50px_rgba(143,0,255,0.15)]" />
        </div>

        {/* Scroll Hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
            <span className="material-symbols-rounded text-[24px] text-white">expand_more</span>
        </div>
      </section>

      {/* --- SECTION 2: THE PROBLEM --- */}
      <section className="relative z-10 py-24 bg-black/40 backdrop-blur-md border-y border-white/5">
         <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            
            {/* Visual: Old Way vs New Way */}
            <div className="relative h-[400px] rounded-3xl overflow-hidden border border-white/10 group">
                {/* Background Image Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black"></div>
                
                {/* Split Effect */}
                <div className="absolute inset-0 flex">
                    <div className="w-1/2 h-full bg-red-900/20 flex flex-col items-center justify-center border-r border-white/10 p-4 text-center grayscale group-hover:grayscale-0 transition-all duration-500">
                        <span className="material-symbols-rounded text-[64px] text-red-500 mb-4 opacity-50">science</span>
                        <h3 className="text-xl font-black text-red-500 uppercase">Fentanyl Strips</h3>
                        <p className="text-xs text-red-300 mt-2 font-mono">Inexpensive (0.167¢).<br/>Near Instant (&lt;1 Minute).<br/>Only tests for Fentanyl.</p>
                    </div>
                    <div className="w-1/2 h-full bg-neon-cyan/10 flex flex-col items-center justify-center p-4 text-center">
                        <span className="material-symbols-rounded text-[64px] text-neon-cyan mb-4 animate-pulse">bolt</span>
                        <h3 className="text-xl font-black text-neon-cyan uppercase">Purple Canary</h3>
                        <p className="text-xs text-cyan-300 mt-2 font-mono">Virtually Free (0.167¢).<br/>3-Clicks Away (Seconds).<br/>Over 285+ Substances. Crystal Clear Results.</p>
                    </div>
                </div>
            </div>

            {/* Copy */}
            <div className="space-y-6">
                <h2 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter">
                    You Need an Answer <span className="text-red-500 decoration-line-through decoration-4"> Not Eventually</span>.<br/>
                    <span className="text-neon-cyan">Right Now!</span>
                </h2>
                <p className="text-gray-400 leading-relaxed">
                    Traditional lab tests are accurate but slow. Reagent kits are fast but subjective—was that reaction dark purple or black?
                    <br/><br/>
                    Purple Canary bridges the gap using <strong className="text-white">Computer Vision Chromatography</strong>. We digitize the physics of separation to give you a definitive answer before the night begins.
                </p>
            </div>
         </div>
      </section>

      {/* --- SECTION 3: THE SOLUTION (METHOD) --- */}
      <section className="relative z-10 py-24">
         <div className="max-w-4xl mx-auto px-6 text-center space-y-16">
            
            <div className="space-y-4">
                <h2 className="text-sm font-bold text-ultra-violet uppercase tracking-widest">The Mechanism</h2>
                <h3 className="text-4xl md:text-6xl font-black italic text-white uppercase tracking-tighter">Chromatography for the Masses</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { icon: 'water_drop', title: "1. SPOT", desc: "Dissolve a tiny sample in our calibrated solvent and apply to the strip." },
                    { icon: 'document_scanner', title: "2. SNAP", desc: "Use the app and the Dual-Core UV light to capture the spectral fingerprint." },
                    { icon: 'neurology', title: "3. KNOW", desc: "Our AI analyzes the migration patterns to identify cuts instantly." }
                ].map((step, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all hover:-translate-y-2 duration-300 group">
                        <div className="w-16 h-16 bg-[#1a052b] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:border-neon-cyan/50 transition-colors shadow-xl">
                            <span className="material-symbols-rounded text-[32px] text-white group-hover:text-neon-cyan transition-colors">{step.icon}</span>
                        </div>
                        <h4 className="text-2xl font-black text-white italic uppercase mb-2">{step.title}</h4>
                        <p className="text-sm text-gray-400 leading-relaxed font-mono">{step.desc}</p>
                    </div>
                ))}
            </div>

         </div>
      </section>

      {/* --- SECTION 4: THE HARDWARE (KIT) --- */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-[#10031c] to-[#1a052b] border-t border-white/5 overflow-hidden">
         {/* Decorative Grid */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-5"></div>

         <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-16 items-center relative z-10">
            
            {/* Visual: The Kit (Updated with Image) */}
            <div className="flex-1 relative group perspective-1000 text-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-neon-cyan/20 to-ultra-violet/20 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
                
                <a href="https://i.ibb.co/JwGDZHMQ/download.png" target="_blank" rel="noopener noreferrer" className="block focus:outline-none">
                  <img 
                    src="https://i.ibb.co/JwGDZHMQ/download.png" 
                    alt="Purple Canary Kit vβ" 
                    className="relative w-full max-w-md mx-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform transition-transform duration-700 group-hover:scale-[1.02] group-hover:rotate-1 rounded-2xl cursor-pointer"
                  />
                </a>
                <div className="mt-4">
                  <a 
                    href="https://i.ibb.co/JwGDZHMQ/download.png" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-mono text-neon-cyan/80 hover:text-neon-cyan underline transition-colors"
                  >
                    Click/Tap Image To View Full Size
                  </a>
                </div>
            </div>

            {/* Copy & Details (Modularized) */}
            <div className="flex-1 space-y-8">
                 <div>
                     <h2 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter mb-4">
                        The Hardware <br/>
                        <span className="text-ultra-violet">Is The Key.</span>
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Software is only half the battle. Our custom chromatography strips and dual-band UV light reveal the invisible spectrum that phone cameras miss.
                    </p>
                 </div>
                
                 {/* Specs Card */}
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Kit Configuration</h3>
                    <ul className="space-y-3 font-mono text-sm text-gray-300">
                        <li className="flex items-center gap-3"><span className="material-symbols-rounded text-[18px] text-neon-cyan">check_circle</span> 100x Quantitative TLC Strips</li>
                        <li className="flex items-center gap-3"><span className="material-symbols-rounded text-[18px] text-neon-cyan">check_circle</span> 100ml D-Limonene Solvent</li>
                        <li className="flex items-center gap-3"><span className="material-symbols-rounded text-[18px] text-neon-cyan">check_circle</span> 30ml Reagent (≈600 Tests)</li>
                        <li className="flex items-center gap-3"><span className="material-symbols-rounded text-[18px] text-neon-cyan">check_circle</span> Dual-Core UV Light (365/395nm)</li>
                        <li className="flex items-center gap-3"><span className="material-symbols-rounded text-[18px] text-neon-cyan">check_circle</span> Vacuum Micro-Boiler</li>
                    </ul>
                 </div>

                 {/* Metrics / CTA */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-neon-cyan/10 to-transparent border border-neon-cyan/20 p-4 rounded-2xl flex flex-col justify-center gap-1 group">
                        <div className="text-[10px] font-mono text-cyan-200 uppercase tracking-widest">Hardware Cost</div>
                        <div className="text-3xl font-black text-white group-hover:text-neon-cyan transition-colors">$25.00</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-center gap-1">
                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Per Test</div>
                        <div className="text-3xl font-black text-white">0.167¢</div>
                    </div>
                 </div>
            </div>

         </div>
      </section>

      {/* --- SECTION 4.5: THE OFFICIAL E-BOOK --- */}
      <section id="ebook" className="relative z-10 py-24 bg-gradient-to-b from-[#1a052b] via-[#120320] to-[#10031c] border-t border-white/10 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-ultra-violet/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-neon-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-16">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3.5 py-1 rounded-full animate-in fade-in">
              <span className="material-symbols-rounded text-neon-cyan text-[16px] animate-pulse">menu_book</span>
              <span className="text-[11px] font-mono font-bold text-neon-cyan uppercase tracking-widest">Official Companion Handbook • Free E-Book</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic text-white uppercase tracking-tighter leading-[0.95]">
              WHAT WAS IN <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-purple-300 to-ultra-violet">THAT JOINT BRO!?</span>
            </h2>
            
            <p className="text-gray-300 text-base md:text-lg font-medium leading-relaxed">
              An Introduction To The Purple Canary Protocol <span className="text-gray-400 font-mono text-sm block sm:inline mt-1 sm:mt-0 sm:ml-2">— by Michael Scott Hoyt</span>
            </p>
            <p className="text-gray-400 text-xs md:text-sm font-mono max-w-2xl mx-auto">
              The unredacted open-source guide to decentralized chemical harm reduction, paper chromatography, and street drug checking. 100% free, copyleft, and built for everyone.
            </p>
          </div>

          {/* Grid: Book Showcase & Content Features */}
          <div className="grid lg:grid-cols-12 gap-10 items-stretch">
            
            {/* Left: 3D Book Cover Card (lg:col-span-5) */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-white/10 via-[#1e0836]/80 to-black/90 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.6)] group hover:border-neon-cyan/40 transition-all duration-500">
              
              <div>
                {/* Book Badge & License */}
                <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 uppercase tracking-widest pb-4 border-b border-white/10 mb-6">
                  <span className="text-neon-cyan font-bold flex items-center gap-1">
                    <span className="material-symbols-rounded text-[14px]">lock_open</span>
                    KOPIMI 🄯 2026
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50">OPEN ACCESS</span>
                </div>

                {/* Simulated Book Cover Object */}
                <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px] aspect-[1/1.42] rounded-2xl bg-gradient-to-br from-[#1e0836] via-[#10031c] to-[#05010a] p-6 border-2 border-purple-500/40 shadow-[0_20px_50px_rgba(143,0,255,0.35)] flex flex-col justify-between overflow-hidden group-hover:scale-[1.02] group-hover:border-neon-cyan/50 transition-all duration-500">
                  {/* Subtle Spine Accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-purple-900/80 to-transparent border-r border-white/10"></div>
                  <div className="absolute -right-16 -top-16 w-36 h-36 bg-neon-cyan/20 rounded-full blur-2xl"></div>

                  {/* Cover Header */}
                  <div className="pl-3 relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <img 
                        src="https://i.ibb.co/C3Jc6MKH/Gemini-Generated-Image-p4r67dp4r67dp4r6-removebg-preview.png" 
                        alt="Logo" 
                        className="w-7 h-7 rounded bg-gray-900/80 border border-white/20 p-0.5"
                      />
                      <span className="text-[9px] font-mono text-purple-300 uppercase tracking-wider font-bold">Purple Canary Protocol</span>
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Field Manual v1.0</div>
                  </div>

                  {/* Cover Main Title */}
                  <div className="pl-3 relative z-10 my-auto py-2">
                    <h3 className="text-2xl sm:text-3xl font-black italic text-white uppercase tracking-tight leading-[0.95] drop-shadow-lg">
                      WHAT WAS IN <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-ultra-violet">THAT JOINT BRO!?</span>
                    </h3>
                    <div className="h-0.5 w-12 bg-neon-cyan my-2"></div>
                    <p className="text-[11px] font-mono text-gray-300">An Introduction To The Purple Canary Protocol</p>
                  </div>

                  {/* Cover Footer */}
                  <div className="pl-3 relative z-10 pt-3 border-t border-white/10 flex justify-between items-end">
                    <div>
                      <div className="text-[9px] font-mono text-gray-400 uppercase">Author</div>
                      <div className="text-xs font-bold text-white tracking-wide">Michael Scott Hoyt</div>
                    </div>
                    <div className="text-[9px] font-mono text-canary-400 bg-canary-400/10 px-2 py-0.5 rounded border border-canary-400/30">
                      OCTOBER 2026
                    </div>
                  </div>
                </div>

                {/* Author Quote */}
                <div className="mt-6 p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs italic text-purple-200/90 leading-relaxed font-mono">
                  &ldquo;Forensic parity is not a privilege reserved for state crime labs; it is an epistemic right of the person deciding what enters their own body.&rdquo;
                  <span className="block not-italic text-[10px] text-gray-400 mt-1 font-sans font-semibold">— Michael Scott Hoyt</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                <a 
                  href="https://book.purplecanarylab.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-neon-cyan via-purple-300 to-ultra-violet text-black font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl shadow-[0_0_25px_rgba(0,255,255,0.4)] hover:shadow-[0_0_35px_rgba(0,255,255,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <span className="material-symbols-rounded text-[20px]">auto_stories</span>
                  <span>Read Free in E-Reader</span>
                  <span className="material-symbols-rounded text-[18px]">open_in_new</span>
                </a>

                {/* Direct File Download Formats */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mr-1">Download:</span>
                  <a 
                    href="https://book.purplecanarylab.com/WHAT_WAS_IN_THAT_JOINT_BRO.pdf" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-[10px] font-mono font-bold transition flex items-center gap-1"
                    title="Download PDF Version"
                  >
                    <span className="material-symbols-rounded text-[12px]">download</span> PDF
                  </a>
                  <a 
                    href="https://book.purplecanarylab.com/WHAT_WAS_IN_THAT_JOINT_BRO.epub" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-[10px] font-mono font-bold transition flex items-center gap-1"
                    title="Download EPUB Version"
                  >
                    <span className="material-symbols-rounded text-[12px]">download</span> EPUB
                  </a>
                  <a 
                    href="https://book.purplecanarylab.com/WHAT_WAS_IN_THAT_JOINT_BRO.compiled.md" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/60 text-[10px] font-mono font-bold transition flex items-center gap-1"
                    title="Download Markdown Version"
                  >
                    <span className="material-symbols-rounded text-[12px]">download</span> MD
                  </a>
                </div>
              </div>

            </div>

            {/* Right: 4 Chapters/Highlights Breakdown (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              
              <div className="grid sm:grid-cols-2 gap-4">
                
                {/* Feature 1 */}
                <div className="bg-white/5 border border-white/10 hover:border-neon-cyan/40 p-5 rounded-2xl transition-all duration-300 hover:bg-white/[0.07] group">
                  <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-3 text-neon-cyan group-hover:scale-110 transition-transform">
                    <span className="material-symbols-rounded text-[22px]">science</span>
                  </div>
                  <div className="text-[10px] font-mono text-neon-cyan uppercase tracking-wider mb-1">Part 1 • For Everyone</div>
                  <h4 className="text-base font-black text-white uppercase italic tracking-tight mb-1.5">Kitchen-Table Forensics</h4>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                    Demystifying chromatography. Learn how to separate adulterants using a travel thermos, Whatman paper strips, and a 365nm UV keychain light.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-white/5 border border-white/10 hover:border-ultra-violet/40 p-5 rounded-2xl transition-all duration-300 hover:bg-white/[0.07] group">
                  <div className="w-10 h-10 rounded-xl bg-ultra-violet/10 border border-ultra-violet/20 flex items-center justify-center mb-3 text-ultra-violet group-hover:scale-110 transition-transform">
                    <span className="material-symbols-rounded text-[22px]">warning</span>
                  </div>
                  <div className="text-[10px] font-mono text-purple-300 uppercase tracking-wider mb-1">Threat Analysis</div>
                  <h4 className="text-base font-black text-white uppercase italic tracking-tight mb-1.5">The Adulterant Era</h4>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                    Unmasking synthetic cannabinoids (SCRAs), fentanyl cross-contamination, xylazine (&ldquo;tranq&rdquo;), and hazardous bulking oils before consumption.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-white/5 border border-white/10 hover:border-green-400/40 p-5 rounded-2xl transition-all duration-300 hover:bg-white/[0.07] group">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-3 text-green-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-rounded text-[22px]">checklist</span>
                  </div>
                  <div className="text-[10px] font-mono text-green-400 uppercase tracking-wider mb-1">The Full SOP</div>
                  <h4 className="text-base font-black text-white uppercase italic tracking-tight mb-1.5">Open Chemical Blueprint</h4>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                    The complete recipe: 95.5% D-limonene and 0.5% curcumin dye solvent formulation. Zero proprietary lock-in and zero corporate secrets.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="bg-white/5 border border-white/10 hover:border-yellow-400/40 p-5 rounded-2xl transition-all duration-300 hover:bg-white/[0.07] group">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-3 text-yellow-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-rounded text-[22px]">diversity_3</span>
                  </div>
                  <div className="text-[10px] font-mono text-yellow-400 uppercase tracking-wider mb-1">Part 2 • For Agencies</div>
                  <h4 className="text-base font-black text-white uppercase italic tracking-tight mb-1.5">Harm Reduction Blueprint</h4>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                    Tactical deployment guide for outreach vans, syringe services, and mutual-aid crews. Training guides and the math behind 0.167¢ tests.
                  </p>
                </div>

              </div>

              {/* Live Reader Features Banner */}
              <div className="bg-gradient-to-r from-purple-950/40 via-deep-indigo/60 to-black/80 border border-purple-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shrink-0">
                    <span className="material-symbols-rounded text-[24px]">devices</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-white uppercase tracking-tight">Interactive E-Reader Features</h5>
                    <p className="text-[11px] font-mono text-gray-400">
                      Full-text search, keyboard navigation (T, Cmd+K, Arrow Keys), KaTeX equations, and live reading progress.
                    </p>
                  </div>
                </div>
                <a 
                  href="https://book.purplecanarylab.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition border border-white/20 hover:border-neon-cyan"
                >
                  <span>Launch Reader</span>
                  <span className="material-symbols-rounded text-[14px]">arrow_forward</span>
                </a>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* --- SECTION 5: SOCIAL PROOF / AUTHORITY --- */}
      <section className="relative z-10 py-16 border-y border-white/5 bg-black/60 overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-4">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Network Activity</h3>
               
               {/* Columns for # of public keys and # of Activities */}
               <div className="flex gap-8 border-t border-white/5 pt-4">
                  <div>
                     <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-1"># Active Keys</div>
                     <div className="text-xl font-black text-neon-cyan font-mono flex items-center gap-1.5">
                        <span className="material-symbols-rounded text-[14px]">key</span>
                        {uniquePublicKeys || 3}
                     </div>
                  </div>
                  <div className="border-l border-white/10 pl-8">
                     <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-1"># Global Activities</div>
                     <div className="text-xl font-black text-white font-mono flex items-center gap-1.5">
                        <span className="material-symbols-rounded text-[14px]">monitoring</span>
                        {totalScans || 12}
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 self-start md:self-end">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-mono text-green-500">SYSTEM ONLINE</span>
            </div>
         </div>

         {/* Rolling Cards */}
         <div className="w-full relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10"></div>
            
            <div className="flex gap-4 overflow-hidden py-4">
               <div 
                  className="flex gap-4 transition-transform duration-75 ease-linear will-change-transform" 
                  style={{ transform: `translateX(-${tickerOffset}px)` }}
               >
                  {/* Repeated items for seamless loop */}
                  {activity.map((det, i) => {
                      const continentObj = CONTINENTS.find(c => c.code === det.region);
                      const regionName = continentObj ? continentObj.name : det.region;

                      return (
                        <div key={i} className="flex-shrink-0 w-64 bg-[#1a052b]/80 border border-white/10 rounded-xl p-4 backdrop-blur-md hover:border-neon-cyan/30 transition-colors group relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
                                   <span className="material-symbols-rounded text-[16px] text-neon-cyan opacity-70">neurology</span>
                                </div>
                                <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-wider ${
                                    det.status === 'CLEAN' ? 'bg-green-500/20 text-green-400' :
                                    det.status === 'LETHAL' ? 'bg-red-500/20 text-red-400 animate-pulse' : 
                                    'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                    {det.status}
                                </span>
                            </div>
                            
                            <div className="relative z-10">
                                <h4 className="text-sm font-black text-white uppercase tracking-tight truncate" title={det.shortDescription}>{det.shortDescription}</h4>
                                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2" title={det.longDescription}>{det.longDescription}</p>
                                <div className="flex items-center gap-3 mt-2 border-t border-white/5 pt-2">
                                   <div className="flex items-center gap-1.5" title="Origin Region">
                                      <span className="text-xl">{det.flag}</span>
                                      <span className="text-[10px] font-mono font-bold text-gray-500">{regionName}</span>
                                   </div>
                                   <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-600 ml-auto">
                                      <span className="material-symbols-rounded text-[12px]">schedule</span> {det.time}
                                   </div>
                                </div>
                            </div>
                        </div>
                      );
                  })}
               </div>
            </div>
         </div>

         {/* Badges */}
         <div className="flex flex-wrap justify-center gap-8 mt-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             {["Harm Reduction Coalition", "GTC Approved", "Computer Vision Chromatography", "Encrypted Data"].map((badge, i) => (
                 <div key={i} className="flex items-center gap-2 border border-white/20 px-4 py-2 rounded-full">
                     <span className="material-symbols-rounded text-[16px] text-white">verified_user</span>
                     <span className="text-[10px] font-mono text-gray-300 uppercase">{badge}</span>
                 </div>
             ))}
         </div>
      </section>

      {/* --- SECTION 6: SECOND CHECKOUT INSTANCE --- */}
      <section className="relative z-10 py-24">
         <div className="max-w-xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">
                Ready to find the <br/>
                <span className="text-neon-cyan">Truth?</span>
            </h2>
            <p className="text-gray-400">Join analysts making the night safer.</p>
            
            {/* Instance #2 */}
            <CheckoutWizard onComplete={onEnter} className="bg-[#10031c] border-neon-cyan/20" />
         </div>
      </section>

      {/* --- SECTION 7: FORENSIC PROTOCOLS STORY --- */}
      <section id="protocols" className="relative z-10 py-24 border-t border-white/5 bg-[#1a052b]">
        <div className="max-w-5xl mx-auto px-6 space-y-24">
            
            {/* Header */}
            <div className="text-center space-y-4">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Standard Operating Procedures</h2>
                <h3 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter">
                   The <span className="text-neon-cyan">Beta</span> Protocol
                </h3>
            </div>

            {/* Story Beat 1: Chain of Custody */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-neon-cyan border-b border-neon-cyan/20 pb-2 w-fit">
                        <span className="material-symbols-rounded text-[32px]">balance</span>
                        <h4 className="text-xl font-black uppercase">1. Chain of Custody</h4>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        The Purple Canary Beta pipeline utilizes a localized cryptographic ledger to ensure that scan data is immutable once captured. 
                        Digital evidence cards generated by the system include a timestamped hash of the raw spectral data to prevent tampering.
                    </p>
                    <ul className="space-y-3 text-xs font-mono text-gray-500">
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-rounded text-white text-[16px] mt-0.5">lock</span>
                            <span><strong className="text-white">Raw Buffer Locking:</strong> Original 365nm/395nm buffers are read-only immediately upon capture.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="material-symbols-rounded text-white text-[16px] mt-0.5">fingerprint</span>
                            <span><strong className="text-white">Session Isolation:</strong> Ephemeral IDs prevent retroactive user linking.</span>
                        </li>
                    </ul>
                </div>
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:border-neon-cyan/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><span className="material-symbols-rounded text-[100px] text-neon-cyan">qr_code_2</span></div>
                    <div className="relative z-10">
                        <div className="text-xs font-mono text-neon-cyan mb-2">IMMUTABLE LEDGER</div>
                        <div className="h-2 w-full bg-gray-800 rounded-full mb-4 overflow-hidden">
                            <div className="h-full bg-neon-cyan w-3/4 animate-pulse"></div>
                        </div>
                        <div className="font-mono text-[10px] text-gray-500 space-y-1">
                            <div>HASH: 7f8a9d...2b1c</div>
                            <div>TS: 2026-05-21T04:20:00Z</div>
                            <div>SIG: VERIFIED (ALPHA)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Story Beat 2: Spectral Analysis */}
            <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
                 <div className="md:order-2 space-y-6">
                    <div className="flex items-center gap-3 text-ultra-violet border-b border-ultra-violet/20 pb-2 w-fit">
                        <span className="material-symbols-rounded text-[32px]">ecg_heart</span>
                        <h4 className="text-xl font-black uppercase">2. Spectral Analysis</h4>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                       Our proprietary "Void Detection" algorithm relies on the physical properties of heavy metals and specific cutting agents.
                       We measure the absorption rate difference between 365nm and 395nm using Differential Spectral Quenching (DSQ).
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <h5 className="text-xs font-bold text-white uppercase mb-1">DSQ Shift</h5>
                            <p className="text-[10px] text-gray-500">Detects "Quench Shift" in Fentanyl precursors.</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <h5 className="text-xs font-bold text-white uppercase mb-1">Euclidean Color</h5>
                            <p className="text-[10px] text-gray-500">Normalizes lighting via LAB color space distance.</p>
                        </div>
                    </div>
                </div>
                <div className="md:order-1 bg-white/5 rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:border-ultra-violet/30 transition-colors">
                     <div className="absolute inset-0 bg-gradient-to-br from-ultra-violet/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="relative flex items-center justify-center h-48">
                         {/* Visual representation of spectral shift */}
                         <div className="w-24 h-24 rounded-full bg-gray-900 border-2 border-dashed border-gray-600 flex items-center justify-center relative">
                             <div className="absolute w-full h-full rounded-full border-t-2 border-ultra-violet animate-spin"></div>
                             <div className="w-16 h-16 bg-white/10 rounded-full backdrop-blur-md"></div>
                         </div>
                         <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[9px] font-mono text-gray-500">
                             <span>365nm</span>
                             <span className="text-white">ΔE: 2.45</span>
                             <span>395nm</span>
                         </div>
                     </div>
                </div>
            </div>

             {/* Story Beat 3: Limitations */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 text-red-500 border-b border-red-500/20 pb-2 w-fit">
                        <span className="material-symbols-rounded text-[32px]">shield</span>
                        <h4 className="text-xl font-black uppercase">3. Limitations & Liability</h4>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        <strong className="text-white">PRESUMPTIVE USE ONLY.</strong> This tool provides probabilistic analysis based on computer vision. 
                        It is NOT a replacement for Gas Chromatography-Mass Spectrometry (GC-MS).
                    </p>
                    <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-xl flex gap-4">
                        <span className="material-symbols-rounded text-red-500 text-[24px] shrink-0">warning</span>
                        <p className="text-xs text-red-400 leading-relaxed font-mono">
                           WARNING: A "Clean" result indicates the absence of known spectral signatures in our active library. 
                           It does not guarantee the substance is pure.
                        </p>
                    </div>
                </div>
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:border-red-500/30 transition-colors flex items-center justify-center">
                     <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 text-red-500 mb-2">
                             <span className="material-symbols-rounded text-[40px]">gavel</span>
                        </div>
                        <h5 className="text-white font-black uppercase tracking-widest">Legal Disclaimer</h5>
                        <p className="text-[10px] text-gray-500 max-w-xs mx-auto">
                            Purple Canary Labs accepts no liability for actions taken based on Beta analysis results.
                        </p>
                     </div>
                </div>
            </div>

        </div>
      </section>

      {/* --- SECTION 8: FINAL CTA --- */}
      <section className="relative z-10 py-24 bg-[#10031c] border-t border-white/5">
        <div className="max-w-xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">
                Secure Your <br/>
                <span className="text-neon-cyan">Access Key</span>
            </h2>
            <p className="text-gray-400">Join the distributed forensic network.</p>
            <CheckoutWizard onComplete={onEnter} className="border-neon-cyan/20" />
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 py-12 bg-black border-t border-white/10 text-center">
         <div className="flex flex-col items-center justify-center gap-3 mb-6 opacity-50 hover:opacity-100 transition-opacity duration-300">
            <img 
               src="https://i.ibb.co/C3Jc6MKH/Gemini-Generated-Image-p4r67dp4r67dp4r6-removebg-preview.png" 
               alt="Logo" 
               className="w-[150px] h-[150px] rounded-2xl bg-gray-800 border border-white/20 p-2 shadow-xl mb-2"
            />
            <span className="text-lg font-black text-white italic uppercase tracking-tighter">Purple Canary</span>
         </div>
         
         <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-500 font-mono uppercase tracking-widest mb-8">
            <a 
               href="https://book.purplecanarylab.com/" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="hover:text-neon-cyan transition-colors flex items-center gap-1.5 text-purple-300 hover:underline"
            >
               <span className="material-symbols-rounded text-[14px]">menu_book</span>
               <span>Free E-Book: What Was In That Joint Bro!?</span>
               <span className="material-symbols-rounded text-[12px] opacity-70">open_in_new</span>
            </a>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <button onClick={() => setShowPrivacy(true)} className="hover:text-neon-cyan transition-colors">Privacy Policy</button>
         </div>

         <p className="text-[10px] text-gray-700 font-mono">
            © 2026 PURPLE CANARY LABS <br/>
            For educational and harm reduction purposes only. Not for legal use.
         </p>
      </footer>

    </div>
  );
};
