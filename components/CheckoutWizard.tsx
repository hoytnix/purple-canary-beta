
import React, { useState, useEffect } from 'react';
import { CONTINENTS } from '../constants/index';
import { saveUserProfile, UserProfile } from '../services/firestoreService';
import { getOrCreateIdentity, generatePublicKey } from '../services/identity';

interface CheckoutWizardProps {
  onComplete: () => void;
  className?: string;
}

const PLANS = [
  { 
    id: 'free', 
    price: 0.00, 
    label: "Free Ad Version", 
    desc: "Supported by monetag.com",
    features: ["Full forensic scanner access", "Ad-supported experience", "Chemical tests cost 0.167¢/run"]
  },
  { 
    id: 'unlimited', 
    price: 1.00, 
    label: "Unlimited Pro License", 
    desc: "One-time payment // No ads", 
    features: ["100% Ad-Free interface", "Priority cloud-matrix queue", "Chemical tests cost 0.167¢/run"]
  },
];

export const CheckoutWizard: React.FC<CheckoutWizardProps> = ({ onComplete, className = "" }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'unlimited'>('unlimited');
  const [addHardwareKit, setAddHardwareKit] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const [shippingName, setShippingName] = useState(() => localStorage.getItem('pc_shipping_name') || '');
  const [shippingAddress, setShippingAddress] = useState(() => localStorage.getItem('pc_shipping_address') || '');
  const [shippingCity, setShippingCity] = useState(() => localStorage.getItem('pc_shipping_city') || '');
  const [shippingZip, setShippingZip] = useState(() => localStorage.getItem('pc_shipping_zip') || '');

  const handleShippingChange = (field: 'name' | 'address' | 'city' | 'zip', val: string) => {
    if (field === 'name') {
      setShippingName(val);
      localStorage.setItem('pc_shipping_name', val);
    } else if (field === 'address') {
      setShippingAddress(val);
      localStorage.setItem('pc_shipping_address', val);
    } else if (field === 'city') {
      setShippingCity(val);
      localStorage.setItem('pc_shipping_city', val);
    } else if (field === 'zip') {
      setShippingZip(val);
      localStorage.setItem('pc_shipping_zip', val);
    }
  };

  // Step 1: Persistence for Email & Country
  useEffect(() => {
    const savedEmail = getOrCreateIdentity();
    setEmail(savedEmail);
    const savedCountry = localStorage.getItem('pc_onboarding_country') || 'US';
    setCountry(savedCountry);
    localStorage.setItem('pc_onboarding_country', savedCountry);
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    localStorage.setItem('pc_onboarding_email', val);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCountry(val);
    localStorage.setItem('pc_onboarding_country', val);
  }

  const handleRotateIdentity = () => {
    const newIdentity = generatePublicKey();
    setEmail(newIdentity);
    localStorage.setItem('pc_onboarding_email', newIdentity);
    // Clear user cache-specific settings except country
    localStorage.removeItem('pc_user_tier');
    localStorage.removeItem('pc_shipping_name');
    localStorage.removeItem('pc_shipping_address');
    localStorage.removeItem('pc_shipping_city');
    localStorage.removeItem('pc_shipping_zip');
    // Reload window or dispatch event to refresh state globally
    window.dispatchEvent(new Event('storage'));
  };

  const calculateTotal = () => {
    const planPrice = selectedPlan === 'unlimited' ? 1.00 : 0.00;
    const kitPrice = addHardwareKit ? 25.00 : 0.00;
    return planPrice + kitPrice;
  };

  const handleProceedStep2 = () => {
    const total = calculateTotal();
    if (total === 0) {
      // Free version, no kit: complete immediately
      setIsProcessing(true);
      localStorage.setItem('pc_user_tier', 'free');
      
      const userProfile: UserProfile = {
        publicKey: email,
        username: 'Shaggy',
        tier: 'free',
        access: 'Alpha'
      };
      
      saveUserProfile(userProfile).catch(console.error);

      setTimeout(() => {
        setIsProcessing(false);
        onComplete();
      }, 1200);
    } else {
      setStep(3);
    }
  };

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    setStripeError(null);
    try {
      localStorage.setItem('pc_user_tier', selectedPlan);
      
      const userProfile: UserProfile = {
        publicKey: email,
        username: 'Shaggy',
        tier: selectedPlan,
        access: 'Alpha',
        shippingName: addHardwareKit ? shippingName : '',
        shippingAddress: addHardwareKit ? shippingAddress : '',
        shippingCity: addHardwareKit ? shippingCity : '',
        shippingZip: addHardwareKit ? shippingZip : ''
      };
      
      await saveUserProfile(userProfile);

      const total = calculateTotal();
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: email,
          priceId: 'price_XXXXX', // Stripe Price ID
          amount: total,
          productName: addHardwareKit
            ? `Purple Canary Pro License + Hardware Kit ($${total.toFixed(2)})`
            : `Purple Canary Pro License ($${total.toFixed(2)})`,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Checkout failed', err);
      setStripeError(err?.message || 'Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isShippingValid = !addHardwareKit || (shippingName.trim() && shippingAddress.trim() && shippingCity.trim() && shippingZip.trim());

  return (
    <div className={`bg-[#1a052b]/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-500 group hover:border-neon-cyan/20 ${className}`}>
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <div 
            className="h-full bg-gradient-to-r from-neon-cyan to-ultra-violet transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
            ></div>
        </div>

        {/* Back Button */}
        {step > 1 && (
            <button 
            onClick={() => setStep(step - 1)}
            className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-full z-10"
            >
            <span className="material-symbols-rounded text-[20px]">chevron_left</span>
            </button>
        )}

        {/* --- STEP 1 (EMAIL & LOCATION) --- */}
        {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 pt-4">
                <div className="text-center pt-2">
                <h2 className="text-lg font-bold text-white">Unlock the Oracle.</h2>
                <p className="text-xs text-gray-400">Secure your forensic dashboard.</p>
                </div>

                <div className="space-y-4">
                    {/* Identity Public Key Input */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Identity Public Key</label>
                        <div className="relative group">
                            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-gray-500 group-focus-within:text-neon-cyan transition-colors">fingerprint</span>
                            <input 
                            type="text" 
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="0x..."
                            className="w-full bg-[#1a052b]/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all font-mono text-xs"
                            />
                        </div>
                    </div>

                    {/* Region Selector */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Operating Region</label>
                        <div className="relative group">
                            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-gray-500 group-focus-within:text-neon-cyan transition-colors">public</span>
                            <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-gray-500 pointer-events-none">expand_more</span>
                            
                            <select 
                                value={country}
                                onChange={handleCountryChange}
                                className="w-full bg-[#1a052b]/50 border border-white/10 rounded-xl py-4 pl-12 pr-10 text-white appearance-none focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all cursor-pointer font-sans"
                            >
                                <option value="" disabled className="text-gray-500">Select Continent</option>
                                {CONTINENTS.map((c) => (
                                    <option key={c.code} value={c.code} className="bg-[#1a052b] text-white py-2">
                                        {c.flag} &nbsp; {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button 
                        onClick={() => email && country && setStep(2)}
                        disabled={!email || !country}
                        className="w-full py-4 bg-white text-[#1a052b] font-black uppercase tracking-widest rounded-xl hover:bg-neon-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                    >
                        Continue <span className="material-symbols-rounded text-[16px]">arrow_forward</span>
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                        <div className="relative flex justify-center"><span className="bg-[#1a052b] px-2 text-[9px] text-gray-600 uppercase">Or</span></div>
                    </div>

                    <button 
                        onClick={handleRotateIdentity}
                        className="w-full py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-red-400 font-bold text-xs transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-rounded text-[16px]">autorenew</span>
                        Rotate Identity (Generate New Key)
                    </button>
                </div>
            </div>
        )}

        {/* --- STEP 2 (LICENSES) --- */}
        {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 pt-4">
                <div className="text-center pt-2">
                <h2 className="text-lg font-bold text-white">Choose your License.</h2>
                <p className="text-xs text-gray-400">Unlock the forensic analysis suite.</p>
                </div>

                <div className="flex flex-col gap-3">
                {PLANS.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    return (
                        <button
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id as 'free' | 'unlimited')}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01] flex justify-between items-center
                                ${isSelected
                                ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,255,255,0.15)]' 
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                }
                            `}
                        >
                            {plan.id === 'unlimited' && (
                                <div className="absolute -top-2.5 -right-2 bg-gradient-to-r from-neon-cyan to-blue-500 text-[#1a052b] text-[8px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full shadow-lg border border-[#1a052b]/50 animate-pulse">
                                    ONE-TIME ONLY
                                </div>
                            )}
                            <div className="flex-1 pr-4">
                                <div className="text-xs font-black text-white">{plan.label}</div>
                                <div className="text-[9px] font-mono text-gray-400 uppercase leading-none mt-1">{plan.desc}</div>
                                <div className="mt-2 space-y-1">
                                    {plan.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 text-[9px] font-mono text-gray-300">
                                            <span className="material-symbols-rounded text-neon-cyan text-[10px]">done</span>
                                            {feat}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="text-xl font-black text-neon-cyan shrink-0">
                                {plan.price === 0 ? "FREE" : `$${plan.price.toFixed(2)}`}
                            </div>
                        </button>
                    );
                })}
                </div>

                {/* Optional Hardware Kit Option */}
                <div className="pt-2 space-y-3">
                    <div className="w-3/4 mx-auto rounded-lg overflow-hidden border border-white/10 bg-[#1a052b]/50">
                        <img 
                            src="https://i.ibb.co/JwGDZHMQ/download.png" 
                            alt="Forensic Hardware Kit" 
                            className="w-full h-auto object-contain mx-auto"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    <button 
                        onClick={() => setAddHardwareKit(!addHardwareKit)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3
                            ${addHardwareKit 
                            ? 'border-ultra-violet bg-ultra-violet/10' 
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                            }
                        `}
                    >
                        <div className="shrink-0 flex items-center">
                            <span className={`material-symbols-rounded text-[20px] ${addHardwareKit ? 'text-ultra-violet' : 'text-gray-500'}`}>
                                {addHardwareKit ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-white uppercase">Add Reusable Forensic Hardware Kit</span>
                                <span className="text-xs font-black text-neon-cyan shrink-0">$25.00</span>
                            </div>
                            <p className="text-[9px] font-mono text-gray-400 mt-1 leading-relaxed">
                                Includes 100x chromatography strips, 100ml solvent, and dual-core UV light. Performing tests on the hardware costs <strong className="text-white">0.167¢</strong> per run!
                            </p>
                        </div>
                    </button>
                </div>

                <button 
                onClick={handleProceedStep2}
                disabled={isProcessing}
                className="w-full py-4 bg-white text-[#1a052b] font-black uppercase tracking-widest rounded-xl hover:bg-neon-cyan transition-all shadow-lg mt-2 flex items-center justify-center gap-2"
                >
                {isProcessing ? "Unlocking Suite..." : calculateTotal() === 0 ? "Unlock Suite (Free)" : "Proceed to Checkout"}
                <span className="material-symbols-rounded text-[16px]">arrow_forward</span>
                </button>
            </div>
        )}

        {/* --- STEP 3 (CHECKOUT & SHIPPING) --- */}
        {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 pt-4">
                <div className="text-center pt-2">
                <h2 className="text-lg font-bold text-white">Order Summary.</h2>
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <span className="material-symbols-rounded text-[12px]">receipt_long</span> Confirm your order details
                </p>
                </div>

                <div className="bg-[#1a052b]/50 rounded-xl p-4 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span>{selectedPlan === 'unlimited' ? 'Unlimited Pro License' : 'Free Ad Version'}</span>
                    <span>{selectedPlan === 'unlimited' ? '$1.00' : '$0.00'}</span>
                </div>
                {addHardwareKit && (
                    <div className="flex justify-between items-center text-xs text-green-400">
                        <span className="flex items-center gap-1"><span className="material-symbols-rounded text-[12px]">redeem</span> Forensic Hardware Kit</span>
                        <span>$25.00</span>
                    </div>
                )}
                {/* Location Tax Line */}
                <div className="flex justify-between items-center text-xs text-gray-500">
                     <span>Tax (Region: {country})</span>
                     <span>$0.00</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between items-center font-black text-neon-cyan">
                    <span>Total Due</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                </div>
                </div>

                <div className="space-y-3">
                {/* Shipping Details form - shown only when Add Hardware Kit is checked */}
                {addHardwareKit && (
                    <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl animate-in fade-in">
                        <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                            <span className="material-symbols-rounded text-[14px] text-neon-cyan">local_shipping</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white">Shipping Address (Kit Delivery)</span>
                        </div>
                        
                        <div className="space-y-2">
                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="text-[8px] font-mono text-gray-500 uppercase">Recipient Name</label>
                                <input 
                                    type="text" 
                                    value={shippingName} 
                                    onChange={(e) => handleShippingChange('name', e.target.value)} 
                                    placeholder="Jane Doe" 
                                    className="w-full bg-[#1a052b]/50 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan"
                                />
                            </div>

                            {/* Street Address */}
                            <div className="space-y-1">
                                <label className="text-[8px] font-mono text-gray-500 uppercase">Street Address</label>
                                <input 
                                    type="text" 
                                    value={shippingAddress} 
                                    onChange={(e) => handleShippingChange('address', e.target.value)} 
                                    placeholder="123 Forensic Ave, Apt 4B" 
                                    className="w-full bg-[#1a052b]/50 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan"
                                />
                            </div>

                            {/* City, State & Zip in a grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-mono text-gray-500 uppercase">City & State</label>
                                    <input 
                                        type="text" 
                                        value={shippingCity} 
                                        onChange={(e) => handleShippingChange('city', e.target.value)} 
                                        placeholder="Boston, MA" 
                                        className="w-full bg-[#1a052b]/50 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-mono text-gray-500 uppercase">ZIP / Postal Code</label>
                                    <input 
                                        type="text" 
                                        value={shippingZip} 
                                        onChange={(e) => handleShippingChange('zip', e.target.value)} 
                                        placeholder="02115" 
                                        className="w-full bg-[#1a052b]/50 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </div>

                <button 
                onClick={() => isShippingValid && setStep(4)}
                disabled={!isShippingValid}
                className="w-full py-4 bg-gradient-to-r from-neon-cyan to-blue-500 text-[#1a052b] font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                {addHardwareKit && !isShippingValid ? "Enter Shipping Info" : "Proceed to Payment"}
                <span className="material-symbols-rounded text-[16px]">arrow_forward</span>
                </button>
            </div>
        )}

        {/* --- STEP 4 (STRIPE CHECKOUT) --- */}
        {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 pt-4">
                <div className="text-center pt-2">
                <h2 className="text-lg font-bold text-white">Stripe Secure Checkout</h2>
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <span className="material-symbols-rounded text-[12px]">lock</span> Encrypted 256-bit payment gateway
                </p>
                </div>

                <div className="bg-[#1a052b]/50 rounded-xl p-4 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center font-black text-neon-cyan">
                        <span>Total Due</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                </div>

                <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-4 animate-in fade-in">
                    <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                        <span className="material-symbols-rounded text-[14px] text-neon-cyan">credit_card</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Payment Method</span>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-relaxed font-mono">
                      Pay securely with Credit / Debit Card, Apple Pay, or Google Pay via Stripe. Your license will activate immediately upon checkout completion.
                    </p>
                    
                    {addHardwareKit && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-[9px] text-emerald-200 font-mono leading-tight flex items-start gap-2">
                        <span className="material-symbols-rounded text-emerald-400 text-sm shrink-0">local_shipping</span>
                        <div>
                          <strong>SHIPPING DESTINATION:</strong> {shippingName}, {shippingAddress}, {shippingCity} {shippingZip}
                        </div>
                      </div>
                    )}

                    {stripeError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-[9px] text-red-200 font-mono leading-tight flex items-start gap-2">
                        <span className="material-symbols-rounded text-red-400 text-sm shrink-0">error</span>
                        <div>{stripeError}</div>
                      </div>
                    )}
                </div>

                <button 
                  onClick={handleStripeCheckout}
                  disabled={isProcessing}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  <span className="material-symbols-rounded text-[18px]">credit_card</span>
                  {isProcessing ? 'Redirecting to Stripe...' : 'Pay with Card or Apple/Google Pay'}
                </button>
            </div>
        )}
    </div>
  );
};
