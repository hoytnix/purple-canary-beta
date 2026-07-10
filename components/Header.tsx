
import React from 'react';

interface HeaderProps {
  onOpenMenu: () => void;
  onOpenAccount: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu, onOpenAccount }) => {
  return (
    <header className="w-full flex items-center justify-between gap-4 py-1">
        {/* Left Action - Account PFP */}
        <button 
          onClick={onOpenAccount}
          className="relative group focus:outline-none"
          title="My Account"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full p-[1px] bg-gradient-to-tr from-neon-cyan to-ultra-violet group-active:scale-95 transition-transform shadow-[0_0_10px_rgba(143,0,255,0.2)] hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]">
            <img 
               src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVVheRYbzWpl4CzGTj-3hlSNrOmO8T9Pv6rdx9NAi6kQ&s=10" 
               alt="Profile" 
               className="w-full h-full rounded-full object-cover border border-[#1a052b]"
            />
          </div>
          {/* Status Indicator */}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1a052b] rounded-full z-10"></div>
        </button>

        {/* Center Logo Block */}
        <div className="flex flex-col items-center flex-1">
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
                <h1 className="text-sm md:text-lg font-black tracking-tighter text-white italic uppercase shadow-black drop-shadow-md leading-none">
                  Purple Canary
                </h1>
                <span className="text-[8px] font-mono text-ultra-violet tracking-widest font-bold italic leading-none">
                  "What was in that joint!?"
                </span>
             </div>
          </div>
        </div>

        {/* Right Action - Hamburger Menu */}
        <button 
          onClick={onOpenMenu}
          className="p-2 bg-ultra-violet/10 border border-ultra-violet/30 rounded-lg hover:bg-ultra-violet/20 transition-all active:scale-90 group"
          title="Menu"
        >
          <span className="material-symbols-rounded text-[20px] text-ultra-violet group-hover:text-white transition-colors">menu</span>
        </button>
    </header>
  );
};