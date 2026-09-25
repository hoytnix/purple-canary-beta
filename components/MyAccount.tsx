

import React, { useState, useEffect } from 'react';
import { ScanRecord } from '../types';
import { subscribeScanRecords, getUserProfile, UserProfile } from '../services/scanService';
import { getOrCreateIdentity, getStoredPublicKey, syncIdentityToServer } from '../services/identity';
import { CheckoutWizard } from './CheckoutWizard';
import { AuthStatusWidget } from './AuthStatusWidget';

interface MyAccountProps {
  onClose: () => void;
}

export const MyAccount: React.FC<MyAccountProps> = ({ onClose }) => {
  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [page, setPage] = useState(1);
  const [cloudScans, setCloudScans] = useState<ScanRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [publicKey, setPublicKey] = useState<string>(() => getStoredPublicKey() || '');

  useEffect(() => {
    getOrCreateIdentity().then((identity) => {
      setPublicKey(identity.publicKey);
      syncIdentityToServer(identity).catch((err) => console.error('Identity sync error:', err));
    });
  }, []);

  useEffect(() => {
    if (!publicKey) return;

    // 1. Subscribe to Scan Records in real-time
    const unsubscribe = subscribeScanRecords(publicKey, (records) => {
      setCloudScans(records);
    });

    // 2. Load User Profile from backend
    const loadProfile = async () => {
      const p = await getUserProfile(publicKey);
      if (p) {
        setProfile(p);
        // Sync local storage so other components see it
        localStorage.setItem('pc_user_tier', p.tier);
        if (p.shippingName) localStorage.setItem('pc_shipping_name', p.shippingName);
        if (p.shippingAddress) localStorage.setItem('pc_shipping_address', p.shippingAddress);
        if (p.shippingCity) localStorage.setItem('pc_shipping_city', p.shippingCity);
        if (p.shippingZip) localStorage.setItem('pc_shipping_zip', p.shippingZip);
      } else {
        // Initialize local profile state only (do NOT prematurely insert row into DB)
        const initProfile: UserProfile = {
          publicKey: publicKey,
          username: 'Shaggy',
          tier: localStorage.getItem('pc_user_tier') || 'free',
          access: 'Alpha',
          shippingName: localStorage.getItem('pc_shipping_name') || '',
          shippingAddress: localStorage.getItem('pc_shipping_address') || '',
          shippingCity: localStorage.getItem('pc_shipping_city') || '',
          shippingZip: localStorage.getItem('pc_shipping_zip') || ''
        };
        setProfile(initProfile);
      }
    };

    loadProfile();

    return () => {
      unsubscribe();
    };
  }, [publicKey]);

  // Use real cloud scans for a working, authentic ledger instead of static demo content
  const allScans = cloudScans;

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(allScans.length / ITEMS_PER_PAGE);
  
  // Statistics Calculation
  const totalScans = allScans.length;
  const totalHazards = allScans.reduce((acc, scan) => {
    return acc + scan.detections.filter(d => d.hazard !== 'SAFE').length;
  }, 0);
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleSelectScan = (scan: ScanRecord) => {
    setSelectedScan(scan);
    setView('DETAIL');
  };

  const handleBack = () => {
    setSelectedScan(null);
    setView('LIST');
  };

  const currentItems = allScans.slice(
    (page - 1) * ITEMS_PER_PAGE, 
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#1a052b]/95 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="max-w-xl mx-auto min-h-screen flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#1a052b]/90 backdrop-blur-xl p-4 flex justify-between items-center border-b border-white/10 z-20">
            <div className="flex items-center gap-3">
              {view === 'DETAIL' && (
                <button onClick={handleBack} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <span className="material-symbols-rounded text-[20px]">chevron_left</span>
                </button>
              )}
              <h2 className="text-xl font-black italic tracking-tighter text-white uppercase flex items-center gap-2">
                <span className="text-neon-cyan">My</span> Account
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <span className="material-symbols-rounded text-[24px] text-white">close</span>
            </button>
        </div>

        {view === 'LIST' ? (
          <div className="p-6 space-y-8 pb-24">
              {/* Profile Card */}
              <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-3xl p-6 flex items-center gap-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-neon-cyan to-ultra-violet shadow-[0_0_20px_rgba(143,0,255,0.3)]">
                          <img 
                              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVVheRYbzWpl4CzGTj-3hlSNrOmO8T9Pv6rdx9NAi6kQ&s=10" 
                              alt="Profile" 
                              className="w-full h-full rounded-full object-cover border-2 border-[#1a052b] bg-white/10"
                          />
                      </div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-[#1a052b] rounded-full z-10"></div>
                  </div>
                  <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Shaggy</h3>
                      <div className="text-[9px] font-mono text-gray-400 mt-0.5 truncate max-w-[200px]" title={publicKey}>
                          Key: <span className="text-neon-cyan">{publicKey}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-1.5">
                          <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-neon-cyan uppercase tracking-wider bg-neon-cyan/10 px-2 py-1 rounded w-fit">
                              <span className="material-symbols-rounded text-[11px]">shield</span> Access: Alpha
                          </div>
                          
                          {/* Dynamic License badge */}
                          {localStorage.getItem('pc_user_tier') === 'unlimited' ? (
                              <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-green-400 uppercase tracking-wider bg-green-500/10 px-2 py-1 rounded border border-green-500/20 w-fit">
                                  <span className="material-symbols-rounded text-[11px]">workspace_premium</span> Pro Unlimited
                              </div>
                          ) : (
                              <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider bg-white/5 px-2 py-1 rounded border border-white/10 w-fit">
                                      <span className="material-symbols-rounded text-[11px]">ad_units</span> Free Ad-Supported
                                  </div>
                                   <button 
                                      onClick={() => setShowUpgrade(true)}
                                      className="text-[8px] font-black uppercase text-white hover:text-neon-cyan tracking-wider bg-ultra-violet/30 hover:bg-ultra-violet/60 border border-ultra-violet/40 px-2 py-1 rounded transition-all cursor-pointer w-fit"
                                  >
                                      Upgrade to Unlimited ($1)
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Asymmetric Authentication & Keypair Status */}
              <AuthStatusWidget />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#10031c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-20"><span className="material-symbols-rounded text-[32px] text-neon-cyan">ecg_heart</span></div>
                      <div className="text-gray-500 text-[9px] uppercase font-bold mb-1 tracking-widest">Total Scans</div>
                      <div className="text-3xl font-mono text-white tracking-tighter">{totalScans.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#10031c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-20"><span className="material-symbols-rounded text-[32px] text-red-500">shield</span></div>
                      <div className="text-gray-500 text-[9px] uppercase font-bold mb-1 tracking-widest">Hazards Found</div>
                      <div className="text-3xl font-mono text-red-500 tracking-tighter">{totalHazards.toLocaleString()}</div>
                  </div>
              </div>

              {/* History List */}
              <div className="space-y-4">
                 <div className="flex justify-between items-end border-b border-white/10 pb-2">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Scan History Log</h4>
                    <span className="text-[9px] font-mono text-gray-600">Page {page} / {totalPages}</span>
                 </div>

                 <div className="space-y-3">
                    {currentItems.length > 0 ? currentItems.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => handleSelectScan(item)}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-4 flex items-center justify-between group transition-all"
                      >
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl transition-colors ${
                                item.verdict === 'LETHAL' ? 'bg-red-500/10 text-red-500' :
                                item.verdict === 'HIGH RISK' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-green-500/10 text-green-500'
                            }`}>
                               {item.verdict === 'LETHAL' ? <span className="material-symbols-rounded text-[20px]">skull</span> : 
                                item.verdict === 'HIGH RISK' ? <span className="material-symbols-rounded text-[20px]">warning</span> :
                                <span className="material-symbols-rounded text-[20px]">check_circle</span>}
                            </div>
                            <div className="text-left">
                               <div className="text-xs font-bold text-white font-mono">{item.id}</div>
                               <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
                                  <span className="material-symbols-rounded text-[12px]">calendar_today</span> {item.date}
                               </div>
                            </div>
                         </div>
                         <div className="flex flex-col items-end gap-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                item.verdict === 'LETHAL' ? 'border-red-500/30 text-red-500' :
                                item.verdict === 'HIGH RISK' ? 'border-yellow-500/30 text-yellow-500' :
                                'border-green-500/30 text-green-500'
                            }`}>
                               {item.verdict}
                            </span>
                            <span className="material-symbols-rounded text-[16px] text-gray-600 group-hover:text-white transition-colors">chevron_right</span>
                         </div>
                      </button>
                    )) : (
                       <div className="text-center py-10 px-4 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                          <span className="material-symbols-rounded text-ultra-violet text-3xl mb-2 block">database</span>
                          <p className="text-xs text-white font-bold">No Scans Logged Yet</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-1 max-w-[280px] mx-auto leading-relaxed">
                             Initiate a chemical scan in the scanner tab to save immutable telemetry on the blockchain/cloud ledger.
                          </p>
                       </div>
                    )}
                 </div>

                 {/* Pagination Controls */}
                 <div className="flex justify-between items-center pt-2">
                    <button 
                       onClick={() => handlePageChange(page - 1)}
                       disabled={page === 1}
                       className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                       <span className="material-symbols-rounded text-[20px]">chevron_left</span>
                    </button>
                    
                    <div className="flex gap-1">
                       {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                          // Simple pagination logic for visualization
                          let p = i + 1;
                          if (page > 3 && totalPages > 5) p = page - 2 + i;
                          if (p > totalPages) p = i + 1; // Fallback reset
                          
                          return (
                             <div key={i} className={`w-2 h-2 rounded-full ${p === page ? 'bg-neon-cyan' : 'bg-gray-700'}`} />
                          );
                       })}
                    </div>

                    <button 
                       onClick={() => handlePageChange(page + 1)}
                       disabled={page === totalPages}
                       className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                       <span className="material-symbols-rounded text-[20px]">chevron_right</span>
                    </button>
                 </div>
              </div>

               {/* Logout (Small) */}
                <button 
                   onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                   }}
                   className="w-full py-4 border border-red-500/20 text-red-500 font-black uppercase tracking-widest rounded-2xl hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 text-xs shadow-lg shadow-red-900/10"
                >
                   <span className="material-symbols-rounded text-[16px]">logout</span> Rotate Identity / Sign Out
                </button>
          </div>
        ) : (
          <div className="p-6 pb-24 space-y-6 animate-in slide-in-from-right-8 duration-300">
             {/* Detail View */}
             {selectedScan && (
               <>
                 <div className="space-y-4">
                    {/* Header Card */}
                    <div className="bg-[#10031c] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                       <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] rounded-full opacity-50 ${
                          selectedScan.verdict === 'LETHAL' ? 'bg-red-500' : 
                          selectedScan.verdict === 'HIGH RISK' ? 'bg-yellow-500' : 'bg-green-500'
                       }`} />
                       
                       <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <h1 className="text-2xl font-black text-white font-mono tracking-tighter">{selectedScan.id}</h1>
                                <div className="text-[10px] font-mono text-gray-400 flex items-center gap-2 mt-1">
                                   <span className="material-symbols-rounded text-[12px]">calendar_today</span> {selectedScan.date}
                                   <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                   <span className="material-symbols-rounded text-[12px]">location_on</span> {selectedScan.location}
                                </div>
                             </div>
                             <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                                selectedScan.verdict === 'LETHAL' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                selectedScan.verdict === 'HIGH RISK' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                                'bg-green-500/10 border-green-500/30 text-green-500'
                             }`}>
                                {selectedScan.verdict === 'LETHAL' ? <span className="material-symbols-rounded text-[16px]">skull</span> : <span className="material-symbols-rounded text-[16px]">shield</span>}
                                <span className="text-[10px] font-black uppercase tracking-widest">{selectedScan.verdict}</span>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <div className="text-[9px] font-mono text-gray-500 uppercase">Matrix</div>
                                <div className="text-sm font-bold text-white mt-1">{selectedScan.matrix.replace('_', ' ')}</div>
                             </div>
                             <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <div className="text-[9px] font-mono text-gray-500 uppercase">Method</div>
                                <div className="text-sm font-bold text-white mt-1">ALPHA SPECTRAL</div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Spectral Evidence */}
                    <div>
                       <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="material-symbols-rounded text-[16px] text-neon-cyan">ecg_heart</span> Spectral Detections
                       </h3>
                       <div className="space-y-3">
                          {selectedScan.detections.map((det, idx) => (
                             <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: det.hex, boxShadow: `0 0 10px ${det.hex}` }} />
                                   <div>
                                      <div className="text-sm font-bold text-white uppercase">{det.name}</div>
                                      <div className="text-[10px] font-mono text-gray-500">Rf: {det.rf.toFixed(2)}</div>
                                   </div>
                                </div>
                                <div className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${
                                   det.hazard === 'LETHAL' ? 'text-red-500 bg-red-500/10' :
                                   det.hazard === 'CRITICAL' ? 'text-cyan-500 bg-cyan-500/10' :
                                   det.hazard === 'HIGH' ? 'text-yellow-500 bg-yellow-500/10' :
                                   'text-green-500 bg-green-500/10'
                                }`}>
                                   {det.hazard}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    {/* Placeholder for Images */}
                    <div>
                       <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="material-symbols-rounded text-[16px] text-ultra-violet">description</span> Source Capture
                       </h3>
                       <div className="w-full h-48 bg-black rounded-xl border border-white/10 flex flex-col items-center justify-center text-gray-600 gap-2">
                           <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                              <span className="material-symbols-rounded text-[24px] opacity-50">shield</span>
                           </div>
                           <span className="text-[10px] font-mono uppercase">Encrypted Evidence Locker</span>
                       </div>
                    </div>

                 </div>
                 
                 <div className="text-center text-[9px] font-mono text-gray-600 pt-8 uppercase">
                    Record ID: {selectedScan.id} // Immutable
                 </div>
               </>
             )}
          </div>
        )}

      </div>

      {showUpgrade && (
        <div className="fixed inset-0 z-50 bg-[#1a052b]/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md relative">
            <button 
              onClick={() => setShowUpgrade(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-full z-20"
            >
              <span className="material-symbols-rounded text-[20px]">close</span>
            </button>
            <CheckoutWizard 
              onComplete={async () => {
                setShowUpgrade(false);
                // Reload profile data to sync UI
                const p = await getUserProfile(publicKey);
                if (p) {
                  setProfile(p);
                  localStorage.setItem('pc_user_tier', p.tier);
                }
                window.dispatchEvent(new Event('storage'));
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};