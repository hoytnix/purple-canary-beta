

import React, { useState } from 'react';
import { ALPHA_LIBRARY, LIBRARY_TABS } from '../constants/index';
import { SignatureCategory } from '../types';

interface SignatureLibraryProps {
  onClose: () => void;
}

export const SignatureLibrary: React.FC<SignatureLibraryProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SignatureCategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 40;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const filteredLibrary = ALPHA_LIBRARY.filter(sig => {
    const matchesTab = activeTab === 'ALL' || sig.category === activeTab;
    const matchesSearch = sig.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sig.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sig.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredLibrary.length / ITEMS_PER_PAGE);
  const paginatedLibrary = filteredLibrary.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md overflow-hidden flex flex-col animate-in fade-in duration-300">
      
      {/* Header Area */}
      <div className="flex flex-col bg-black/80 backdrop-blur-xl z-20 border-b border-white/10">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center p-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black italic tracking-tighter text-green-500 uppercase flex items-center gap-2">
              <span className="material-symbols-rounded text-[24px]">description</span> Signature Library
            </h2>
            <p className="text-[10px] font-mono text-gray-500 uppercase">
              Master Signature Database // {filteredLibrary.length} Entries
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-rounded text-white text-[24px]">close</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-2">
          <div className="relative group">
            <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-gray-500 group-focus-within:text-green-500 transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Search by name, ID or effect..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pb-4 overflow-x-auto">
          <div className="flex gap-2">
            {LIBRARY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              // Dynamic coloring based on tab type
              const activeClass = 
                tab.id === 'NARCOTICS' ? 'bg-blue-600 text-white shadow-blue-500/20' :
                tab.id === 'HAZARDS' ? 'bg-red-600 text-white shadow-red-500/20' :
                tab.id === 'MATRIX' ? 'bg-purple-600 text-white shadow-purple-500/20' :
                tab.id === 'BENIGN' ? 'bg-green-600 text-white shadow-green-500/20' :
                'bg-gray-700 text-white';

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border border-transparent transition-all
                    ${isActive ? `${activeClass} shadow-lg scale-105` : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20 hover:text-gray-300'}
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scrollable List Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-7xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
           {paginatedLibrary.length > 0 ? (
             <>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {paginatedLibrary.map((sig) => (
                   <div 
                     key={sig.id} 
                     className="bg-white/5 p-3 rounded-xl border-t-4 hover:bg-white/10 transition-colors group flex flex-col justify-between h-full" 
                     style={{ borderTopColor: sig.hex }}
                   >
                      <div className="space-y-1.5">
                         <div className="flex justify-between items-start gap-1">
                            <h3 className="font-bold text-white text-[11px] md:text-xs uppercase truncate flex-1" title={sig.name}>
                              {sig.name}
                            </h3>
                            <span className="w-2 h-2 rounded-full ring-1 ring-white/20 shrink-0 mt-1" style={{ backgroundColor: sig.hex, boxShadow: `0 0 8px ${sig.hex}`}}></span>
                         </div>
                         <div className="text-[9px] font-mono text-gray-400 flex flex-wrap gap-x-2 gap-y-0.5">
                            <span>Rf: <span className="text-white">{sig.rf.toFixed(2)}</span></span>
                            <span className="text-gray-600">|</span>
                            <span>Shift: <span className="text-white">{sig.shift}</span></span>
                         </div>
                         <p className="text-[10px] text-gray-400 leading-normal font-mono border-t border-white/5 pt-1.5 mt-1 group-hover:text-gray-300 transition-colors line-clamp-3">
                            {sig.desc}
                         </p>
                      </div>
                      <div className="mt-2.5 pt-1.5 border-t border-white/5 flex items-center justify-between">
                         <span className="text-[7px] font-mono text-gray-500">{sig.id}</span>
                         <div className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${
                            sig.hazard === 'LETHAL' ? 'border-red-500 text-red-500 bg-red-500/10 animate-pulse' :
                            sig.hazard === 'CRITICAL' ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10' :
                            sig.hazard === 'HIGH' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' :
                            'border-green-500 text-green-500 bg-green-500/10'
                         }`}>
                            {sig.hazard} {sig.hazard === 'LETHAL' && <span className="material-symbols-rounded text-[10px]">skull</span>}
                         </div>
                      </div>
                   </div>
                 ))}
               </div>

               {totalPages > 1 && (
                 <div className="flex items-center justify-center gap-2 mt-8 py-4">
                   <button
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1}
                     className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 font-mono text-[10px] uppercase cursor-pointer"
                   >
                     <span className="material-symbols-rounded text-[16px]">chevron_left</span> Prev
                   </button>
                   <span className="text-[10px] font-mono text-gray-400 px-2 uppercase">
                     Page {currentPage} of {totalPages}
                   </span>
                   <button
                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                     disabled={currentPage === totalPages}
                     className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1 font-mono text-[10px] uppercase cursor-pointer"
                   >
                     Next <span className="material-symbols-rounded text-[16px]">chevron_right</span>
                   </button>
                 </div>
               )}
             </>
           ) : (
             <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-4">
               <span className="material-symbols-rounded text-[48px] opacity-50">folder_open</span>
               <p className="font-mono text-xs uppercase tracking-widest">No matching signatures found</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};