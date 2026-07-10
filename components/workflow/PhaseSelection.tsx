
import React, { useState, useEffect, useRef } from 'react';
import { useScanner } from '../../contexts/ScannerContext';
import { MATRIX_TYPES, LAB_STANDARDS } from '../../constants/index';

interface PhaseSelectionProps {
  onNext: () => void;
}

const ICONS = {
  SOLID_CRYSTAL: 'hexagon',
  LIQUID_VAPE: 'water_drop',
  OIL_DAB: 'layers',
  BOTANICAL_FLOWER: 'local_florist'
};

const SOP_STEPS = {
  SOLID_CRYSTAL: [
    {
      step: "01",
      title: "Chemical Dissolution",
      icon: "science",
      color: "from-blue-500 to-indigo-500",
      glow: "rgba(59,130,246,0.3)",
      desc: "Crush a tiny, matchhead-sized grain of your Solid/Crystal sample. Place it in the reaction vial and add 1.0ml of Calibrated Limonene Solvent. Agitate for 15 seconds. Hydrophilic fillers (like sugars, salts, and binder chalks) will remain undissolved at the bottom, filtering them out instantly and cleanly. Running materials cost is less than $1 per test!"
    },
    {
      step: "02",
      title: "Anchor Spatially",
      icon: "anchor",
      color: "from-yellow-500 to-amber-500",
      glow: "rgba(245,158,11,0.3)",
      desc: "Use the capillary tube to apply 1 micro-drop of the yellow 0.5% Turmeric anchor standard to the bottom-right corner of your chromatography strip (1.0cm from the bottom edge). This provides a bright yellow-green fluorescent standard that the AI's computer-vision system utilizes to correct for varying lighting environments."
    },
    {
      step: "03",
      title: "Spot the Sample",
      icon: "colorize",
      color: "from-neon-cyan to-blue-400",
      glow: "rgba(0,255,255,0.3)",
      desc: "Dip a clean capillary tube into your dissolved sample solution. Apply 1 tiny micro-drop to the bottom-left corner of the strip (exactly aligned horizontally with the yellow Turmeric anchor, 1.0cm from the bottom edge). Ensure the spot is as concentrated and small as possible for crisp separation."
    },
    {
      step: "04",
      title: "Vertical Capillary Race",
      icon: "vertical_align_top",
      color: "from-ultra-violet to-purple-500",
      glow: "rgba(143,0,255,0.3)",
      desc: "Stand your strip vertically in the elution chamber with exactly 2mm of running Limonene solvent. Do not submerge the spots. Capillary action will draw the solvent up, pulling active molecules in a linear sprint. Let it run for 3 to 5 minutes until the solvent front reaches 1cm from the top, then remove to scan under UV light."
    }
  ],
  LIQUID_VAPE: [
    {
      step: "01",
      title: "Viscosity Verification",
      icon: "water_drop",
      color: "from-cyan-500 to-blue-500",
      glow: "rgba(6,182,212,0.3)",
      desc: "Vape cartridges and e-liquids are highly viscous. Dispense 1 tiny drop of the raw fluid directly onto the chromatography strip's starting line (bottom-left corner, 1.0cm from edge). Let it dry and sink into the paper matrix completely for 2 minutes. This enables molecular testing for less than a dollar per run!"
    },
    {
      step: "02",
      title: "Fluorescent Targeting",
      icon: "filter_center_focus",
      color: "from-amber-500 to-orange-500",
      glow: "rgba(245,158,11,0.3)",
      desc: "Spot 1 drop of the yellow Turmeric calibration standard on the bottom-right margin, horizontally aligned with your liquid sample spot. The AI uses this yellow fluorescent reference to calibrate exposure, contrast, and color-balance before mapping molecular bands."
    },
    {
      step: "03",
      title: "Hydrophobic Development",
      icon: "directions_run",
      color: "from-blue-400 to-indigo-500",
      glow: "rgba(59,130,246,0.3)",
      desc: "Place the strip vertically inside the developer jar with 2mm of Limonene solvent. Capillary force will draw the mobile phase upwards. Lipophilic diluents (like dangerous Vitamin E Acetate) will migrate rapidly, creating a distinct separate zone on the strip, while base carriers move slower."
    },
    {
      step: "04",
      title: "Halo Differentiation",
      icon: "lens",
      color: "from-purple-500 to-pink-500",
      glow: "rgba(168,85,247,0.3)",
      desc: "Look for any high-migrating Yellow-Green Fluorescent halo patterns under dual 365nm/395nm excitation. Pure cartridges leave localized, clean emission bands, while adulterated liquids split into multiple colored rings. Ready the scanner for photographic analysis."
    }
  ],
  OIL_DAB: [
    {
      step: "01",
      title: "Thermal Lipolysis",
      icon: "thermostat",
      color: "from-amber-500 to-red-500",
      glow: "rgba(239,68,68,0.3)",
      desc: "Dabs and wax concentrates are thick solid lipids. Dissolve a matchhead grain of concentrate into 1.0ml of Limonene solvent. Seal the vial and vigorously roll it between your palms for 30 seconds or use a warm water-bath to fully break down and liquefy the active lipid phase. Cost of test materials is under a dollar!"
    },
    {
      step: "02",
      title: "Reference Target",
      icon: "hub",
      color: "from-yellow-400 to-amber-500",
      glow: "rgba(234,179,8,0.3)",
      desc: "Dot 1 micro-drop of the yellow Turmeric standard on the bottom-right of the vertical TLC strip. The AI requires this glowing point to establish Euclidean coordinates and normalize differences in paper texture or room lighting."
    },
    {
      step: "03",
      title: "Capillary Spotting",
      icon: "line_weight",
      color: "from-blue-500 to-indigo-500",
      glow: "rgba(99,102,241,0.3)",
      desc: "Use a clean glass capillary to apply a microscopic speck of your dissolved lipid extract on the starting line (bottom-left, 1.0cm from the base). Keep the spot small to prevent lipid overloading, which can smear chromatography bands."
    },
    {
      step: "04",
      title: "Linear Elution Run",
      icon: "publish",
      color: "from-ultra-violet to-indigo-600",
      glow: "rgba(143,0,255,0.3)",
      desc: "Place the strip in the running chamber with 2mm of developer solvent. Active compounds and adulterants separate vertically based on their unique lipophilic coefficients. Wait 4 minutes for separation to finish. Heavy metal cuts or solid contaminants will stay trapped at the base line as dark voids."
    }
  ],
  BOTANICAL_FLOWER: [
    {
      step: "01",
      title: "30-Second Cold Wash",
      icon: "ac_unit",
      color: "from-green-500 to-emerald-600",
      glow: "rgba(16,185,129,0.3)",
      desc: "Place a small leaf or piece of flower (about the size of a pea) into 1.0ml of Limonene. DO NOT crush or grind. Swirl gently for exactly 30 seconds, then immediately remove the plant matter. This washes off synthetic adulterants, pesticides, or molds without extracting internal plant chlorophyll which could interfere with UV imaging. This field test costs less than $1!"
    },
    {
      step: "02",
      title: "Anchor Calibration",
      icon: "filter_tilt_shift",
      color: "from-yellow-500 to-orange-500",
      glow: "rgba(249,115,22,0.3)",
      desc: "Spot 1 drop of yellow Turmeric standard onto the bottom-right of your strip. Under 365nm excitation, this acts as an absolute spatial and color anchor, allowing the AI to automatically de-tilt and scale your smartphone's camera capture."
    },
    {
      step: "03",
      title: "Extract Spotting",
      icon: "colorize",
      color: "from-emerald-400 to-cyan-500",
      glow: "rgba(52,211,153,0.3)",
      desc: "Dot 1 tiny micro-drop of your washed amber botanical solution to the bottom-left corner of the vertical strip (1.0cm from bottom edge). Ensure the spot is fully dry before running the chromatography chromatogram."
    },
    {
      step: "04",
      title: "Linear Separation",
      icon: "swap_vert",
      color: "from-ultra-violet to-purple-600",
      glow: "rgba(143,0,255,0.3)",
      desc: "Stand your strip in 2mm of Limonene running phase. The solvent front will ascend. Natural cannabinoids run at medium-high bands, whereas heavy metal dust remains at the origin and synthetic sprays or molds separate into distinctive glowing toxic lines under dual-UV."
    }
  ]
};

const TUTORIAL_VIDEOS = [
  {
    id: "2vSAsLg_qG0",
    title: "Khan Academy: Thin Layer Chromatography",
    creator: "Khan Academy",
    desc: "A perfect conceptual breakdown of mobile/stationary phases, adsorption, and separation chemistry.",
    duration: "7:44"
  },
  {
    id: "Ad-x4_9f-Gg",
    title: "MIT OCW: TLC Digital Techniques Manual",
    creator: "MIT OpenCourseWare",
    desc: "Perfect demonstration of spotting plates, chamber saturation, and running development.",
    duration: "11:58"
  },
  {
    id: "A68_9fXU6fM",
    title: "Professor Dave: Thin-Layer Chromatography",
    creator: "Professor Dave Explains",
    desc: "An engaging walkthrough explaining Rf factor calculations and separation mechanisms.",
    duration: "6:14"
  },
  {
    id: "dm7mco_W17Q",
    title: "RSC: Thin-Layer Chromatography (TLC)",
    creator: "Royal Society of Chemistry",
    desc: "High-quality academic explanation of capillary action and polar phase interactions.",
    duration: "4:52"
  },
  {
    id: "q39C9_0p56o",
    title: "Crash Course: Chromatography Separation",
    creator: "Crash Course Chemistry",
    desc: "High-energy context showing the history and chemical mechanism of multi-phase chromatography.",
    duration: "10:11"
  }
];

export const PhaseSelection: React.FC<PhaseSelectionProps> = ({ onNext }) => {
  const { 
    matrixType, setMatrixType, 
    filterSize, setFilterSize,
    customDimensions, setCustomDimensions
  } = useScanner();

  const [showVideo, setShowVideo] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(TUTORIAL_VIDEOS[0]);

  const [widthUnit, setWidthUnit] = useState<'cm' | 'mm' | 'in'>('cm');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'mm' | 'in'>('cm');

  const carouselRef = useRef<HTMLDivElement>(null);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  useEffect(() => {
    if (!showVideo || isCarouselHovered) return;

    const interval = setInterval(() => {
      const el = carouselRef.current;
      if (el) {
        el.scrollLeft += 1;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0;
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [showVideo, isCarouselHovered]);

  const convertToCm = (val: number, unit: 'cm' | 'mm' | 'in'): number => {
    if (unit === 'mm') return val / 10;
    if (unit === 'in') return val * 2.54;
    return val;
  };

  const convertFromCm = (valCm: number, unit: 'cm' | 'mm' | 'in'): number => {
    if (unit === 'mm') return valCm * 10;
    if (unit === 'in') return valCm / 2.54;
    return valCm;
  };

  const displayWidth = Number(convertFromCm(customDimensions.width, widthUnit).toFixed(2));
  const displayHeight = Number(convertFromCm(customDimensions.height, heightUnit).toFixed(2));

  const handleWidthChange = (val: number) => {
    const cmValue = convertToCm(val, widthUnit);
    setCustomDimensions({ ...customDimensions, width: Number(cmValue.toFixed(2)) });
  };

  const handleHeightChange = (val: number) => {
    const cmValue = convertToCm(val, heightUnit);
    setCustomDimensions({ ...customDimensions, height: Number(cmValue.toFixed(2)) });
  };

  const currentSOP = SOP_STEPS[matrixType as keyof typeof SOP_STEPS] || SOP_STEPS.SOLID_CRYSTAL;
  const currentMatrixInfo = MATRIX_TYPES[matrixType as keyof typeof MATRIX_TYPES];

  return (
    <div className="w-full h-full flex flex-col gap-6 animate-slide-in">
      
      {/* Scrollable Stage Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-4 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative">
          
          {/* Left Column: Sticky on md+ */}
          <div className="md:sticky md:top-4 space-y-6 self-start">
            {/* Header Block */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-neon-cyan/10 border border-neon-cyan/25 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse"></span>
                <span className="text-[8px] font-bold text-neon-cyan uppercase tracking-widest">Calibration & Preparation</span>
              </div>
              <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">STANDARD OPERATING PROCEDURE</h2>
              <p className="text-[10px] font-mono text-gray-400">Cinematic forensic guidelines. Running costs are less than a dollar per test.</p>
            </div>

            {/* Matrix Selector (Substance Tabs) - Setup Step #1 */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-neon-cyan uppercase tracking-widest ml-1">01 // Select Substance Type</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(MATRIX_TYPES).map((m) => {
                  const Icon = ICONS[m.id as keyof typeof ICONS] || 'hexagon';
                  const isSelected = matrixType === m.id;
                  
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMatrixType(m.id)}
                      className={`
                        relative p-3 rounded-xl border-2 text-left transition-all duration-300 group overflow-hidden flex flex-col justify-between min-h-[90px]
                        ${isSelected 
                          ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,255,255,0.2)]' 
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }
                      `}
                    >
                      <span className={`material-symbols-rounded text-[20px] ${isSelected ? 'text-neon-cyan' : 'text-gray-400'}`}>{Icon}</span>
                      <div>
                        <div className={`text-[9px] font-black uppercase tracking-tight leading-none mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {m.name.split(' / ')[0]}
                        </div>
                        <div className="text-[7px] font-mono text-gray-500 leading-tight line-clamp-1">
                          {m.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Geometry Configuration */}
            <div className="space-y-2 pt-4 border-t border-white/5">
              <label className="text-[9px] font-black text-neon-cyan uppercase tracking-widest flex items-center gap-2 ml-1">
                 <span className="material-symbols-rounded text-[12px] text-neon-cyan">straighten</span> 02 // Chromatography Strip Geometry
              </label>
              
              <div className="flex flex-col gap-2">
                  <select 
                     value={filterSize} 
                     onChange={(e) => setFilterSize(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 text-[10px] font-mono text-white py-2.5 px-3 rounded-xl focus:outline-none focus:border-neon-cyan/50 appearance-none transition-colors cursor-pointer"
                  >
                     {Object.entries(LAB_STANDARDS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-[#1a052b]">{v.name}</option>
                     ))}
                     <option value="CUSTOM" className="bg-[#1a052b]">Custom Strip Geometry...</option>
                  </select>

                  {filterSize === 'CUSTOM' && (
                     <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                        {/* Width Section */}
                        <div className="space-y-1">
                           <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider block ml-1">Width</label>
                           <div className="flex gap-1 bg-[#1a052b] border border-white/20 rounded-xl p-1 focus-within:border-neon-cyan transition-colors">
                              <input 
                                 type="number"
                                 placeholder={`W (${widthUnit})`}
                                 step="0.1"
                                 value={displayWidth}
                                 onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
                                 className="w-full bg-transparent text-[10px] font-mono text-neon-cyan p-1.5 focus:outline-none min-w-0"
                              />
                              <select
                                 value={widthUnit}
                                 onChange={(e) => setWidthUnit(e.target.value as any)}
                                 className="bg-[#1a052b] border-0 text-[9px] font-mono text-white px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                              >
                                 <option value="cm" className="bg-[#1a052b]">cm</option>
                                 <option value="mm" className="bg-[#1a052b]">mm</option>
                                 <option value="in" className="bg-[#1a052b]">in</option>
                              </select>
                           </div>
                        </div>

                        {/* Height Section */}
                        <div className="space-y-1">
                           <label className="text-[8px] font-mono text-gray-500 uppercase tracking-wider block ml-1">Height</label>
                           <div className="flex gap-1 bg-[#1a052b] border border-white/20 rounded-xl p-1 focus-within:border-neon-cyan transition-colors">
                              <input 
                                 type="number"
                                 placeholder={`H (${heightUnit})`}
                                 step="0.1"
                                 value={displayHeight}
                                 onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)}
                                 className="w-full bg-transparent text-[10px] font-mono text-neon-cyan p-1.5 focus:outline-none min-w-0"
                              />
                              <select
                                  value={heightUnit}
                                  onChange={(e) => setHeightUnit(e.target.value as any)}
                                  className="bg-[#1a052b] border-0 text-[9px] font-mono text-white px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                              >
                                 <option value="cm" className="bg-[#1a052b]">cm</option>
                                 <option value="mm" className="bg-[#1a052b]">mm</option>
                                 <option value="in" className="bg-[#1a052b]">in</option>
                              </select>
                           </div>
                        </div>
                     </div>
                  )}
              </div>
            </div>
          </div>

          {/* Right Column: Scrolls naturally */}
          <div className="space-y-6">
            {/* World's Best YouTube Tutorial Spoiler */}
            <div className="bg-gradient-to-br from-[#1c082e] to-[#120321] border border-ultra-violet/20 rounded-2xl p-4 overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setShowVideo(!showVideo)}
                className="w-full flex items-center justify-between gap-3 text-left group focus:outline-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/25 flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-[18px] text-neon-cyan group-hover:scale-110 transition-transform">play_circle</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-tight italic truncate">
                      🎥 {selectedVideo.title}
                    </h4>
                    <p className="text-[9px] font-mono text-gray-400 truncate">
                      {selectedVideo.desc}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-rounded text-[18px] text-gray-400 group-hover:text-white transition-colors shrink-0">
                  {showVideo ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              
              {showVideo && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                  <div>
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black/40">
                      <iframe 
                        src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}`} 
                        title={selectedVideo.title}
                        className="absolute top-0 left-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                      />
                    </div>
                    <p className="text-[8px] font-mono text-gray-500 mt-2 text-center">
                      Video Credit: {selectedVideo.creator}
                    </p>
                  </div>

                  {/* Carousel of Top 5 Tutorials */}
                  <div className="border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[9px] font-black text-neon-cyan uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-rounded text-[11px]">video_library</span> Top 5 Tutorials Carousel
                      </label>
                      <span className="text-[8px] font-mono text-gray-500">SELECT TO SWITCH IN-PLACE</span>
                    </div>

                    <div 
                      ref={carouselRef}
                      onMouseEnter={() => setIsCarouselHovered(true)}
                      onMouseLeave={() => setIsCarouselHovered(false)}
                      onTouchStart={() => setIsCarouselHovered(true)}
                      onTouchEnd={() => setIsCarouselHovered(false)}
                      className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth snap-x"
                    >
                      {TUTORIAL_VIDEOS.map((v) => {
                        const isCurrent = selectedVideo.id === v.id;
                        return (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVideo(v)}
                            className={`flex-shrink-0 w-[170px] text-left bg-black/40 border rounded-xl p-2 transition-all flex flex-col gap-1.5 snap-start focus:outline-none ${
                              isCurrent
                                ? "border-neon-cyan bg-neon-cyan/5 shadow-[0_0_10px_rgba(0,243,255,0.1)]"
                                : "border-white/5 hover:border-white/10 hover:bg-white/5"
                            }`}
                          >
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black/50 shrink-0">
                              <img
                                src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                                alt={v.title}
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <span className="absolute bottom-1 right-1 bg-black/85 text-[7px] font-mono px-1 py-0.5 rounded text-gray-300">
                                {v.duration}
                              </span>
                              {isCurrent && (
                                <div className="absolute inset-0 bg-neon-cyan/15 flex items-center justify-center">
                                  <span className="material-symbols-rounded text-[20px] text-neon-cyan drop-shadow-[0_0_6px_rgba(0,243,255,0.8)] animate-pulse">play_circle</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-[9px] font-black text-white truncate uppercase tracking-tight">
                                {v.title.includes(":") ? v.title.split(":")[1].trim() : v.title}
                              </p>
                              <p className="text-[7px] font-mono text-neon-cyan/80 uppercase truncate">{v.creator}</p>
                              <p className="text-[7px] text-gray-400 line-clamp-2 leading-normal">
                                {v.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cinematic SOP Timeline Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center ml-1 border-b border-white/10 pb-1">
                <label className="text-[9px] font-black text-ultra-violet uppercase tracking-widest">03 // SOP Implementation Flow ({currentMatrixInfo?.name.split(' / ')[0]})</label>
                <span className="text-[8px] font-mono text-gray-500 uppercase">Hardware &lt;$25 // Run &lt;$1</span>
              </div>
              
              <div className="space-y-4">
                {currentSOP.map((step, idx) => (
                  <div 
                    key={idx} 
                    className="bg-gradient-to-br from-[#1c082e] to-[#120321] border border-white/5 rounded-2xl p-4 relative overflow-hidden transition-all hover:border-white/10 group"
                  >
                    {/* Background glow node */}
                    <div 
                      className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-[40px] opacity-10 transition-opacity group-hover:opacity-20"
                      style={{ backgroundColor: step.glow }}
                    />
                    
                    <div className="flex gap-4 items-start relative z-10">
                      {/* Step Hex Indicator */}
                      <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} p-[1px] shadow-lg`}>
                        <div className="w-full h-full bg-[#1a052b] rounded-xl flex flex-col items-center justify-center font-mono">
                          <span className="text-[8px] text-gray-500 font-bold leading-none">{step.step}</span>
                          <span className="material-symbols-rounded text-[14px] text-white mt-0.5">{step.icon}</span>
                        </div>
                      </div>

                      {/* Step Description */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white uppercase tracking-tight italic flex items-center gap-1.5">
                          {step.title}
                        </h4>
                        <p className="text-[10px] font-mono text-gray-400 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expert Warning Note */}
            <div className="p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-2xl flex gap-3">
              <span className="material-symbols-rounded text-[20px] text-yellow-500 shrink-0">warning</span>
              <p className="text-[9px] font-mono text-yellow-500/80 leading-normal">
                <strong>PREPARATION MANDATE:</strong> Ensure solvent evaporation is done in a well-ventilated space. Keep chromatography strips dry and handled only by the edges to prevent skin oil contamination from altering relative fluorescence values.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Action Button - Sticky Bottom */}
      <div className="shrink-0 pt-2 border-t border-white/5 bg-[#1a052b]">
        <button 
          onClick={onNext}
          className="w-full py-4 bg-neon-cyan text-[#1a052b] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-cyan-300 transition-all shadow-lg shadow-neon-cyan/15 group text-xs"
        >
          Begin Scanner Acquisition <span className="material-symbols-rounded text-[16px] group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>
      </div>
    </div>
  );
};