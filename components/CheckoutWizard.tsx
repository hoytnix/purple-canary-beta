'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CONTINENTS } from '../constants/index';
import { getUserProfile, UserProfile } from '../services/scanService';
import { getOrCreateIdentity, rotateIdentity, syncIdentityToServer, validateKeyPair } from '../services/identity';

interface CheckoutWizardProps {
  onComplete: () => void;
  className?: string;
  paymentStatus?: string;
}

const isProLicenseStatus = (status?: string | null): boolean => {
  if (!status) return false;
  const s = status.toLowerCase().trim();
  return (
    s === 'unlimited' ||
    s === 'pro' ||
    s === 'pro license' ||
    s === 'pro licese' ||
    s === 'pro_license' ||
    s === 'pro-license' ||
    s === 'paid' ||
    s === 'active' ||
    s.includes('pro')
  );
};

const PLANS = [
  { 
    id: 'free', 
    label: "Free Ad Version", 
    desc: "Supported by monetag.com",
    features: ["Full forensic scanner access", "Ad-supported experience", "Chemical tests cost 0.167¢/run"]
  },
  { 
    id: 'unlimited', 
    label: "Unlimited Pro License", 
    desc: "Donate any amount // No ads", 
    features: ["100% Ad-Free interface", "Priority cloud-matrix queue", "Chemical tests cost 0.167¢/run"]
  },
];

export const CheckoutWizard: React.FC<CheckoutWizardProps> = ({ 
  onComplete, 
  className = "",
  paymentStatus: paymentStatusProp
}) => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isKeypairValid, setIsKeypairValid] = useState(false);
  const [isServerAuthenticated, setIsServerAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [dbTier, setDbTier] = useState<string>('free');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [country, setCountry] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'unlimited'>('unlimited');
  const [donationAmount, setDonationAmount] = useState<number>(5.00);
  const [customDonationInput, setCustomDonationInput] = useState<string>('5.00');
  const [addHardwareKit, setAddHardwareKit] = useState(true);
  const [kitQuantity, setKitQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const [shippingName, setShippingName] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('pc_shipping_name') : '') || '');
  const [shippingAddress, setShippingAddress] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('pc_shipping_address') : '') || '');
  const [shippingCity, setShippingCity] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('pc_shipping_city') : '') || '');
  const [shippingZip, setShippingZip] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('pc_shipping_zip') : '') || '');

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

  // Cryptographically validate keypair client-side AND verify with server against salted hash in db
  useEffect(() => {
    let active = true;
    if (publicKey && privateKey) {
      validateKeyPair(publicKey, privateKey)
        .then(async (valid) => {
          if (!active) return;
          setIsKeypairValid(valid);
          if (valid) {
            const authRes = await syncIdentityToServer({ publicKey, privateKey });
            if (!active) return;
            if (authRes.success && authRes.user) {
              setIsServerAuthenticated(true);
              setAuthError(null);
              if (authRes.user.tier) {
                setDbTier(authRes.user.tier);
              }
            } else {
              setIsServerAuthenticated(false);
              setAuthError(authRes.error || 'Authentication rejected: Invalid private key.');
            }
          } else {
            setIsServerAuthenticated(false);
            setAuthError('Keypair mismatch: Private key does not correspond to public key.');
          }
        })
        .catch(() => {
          if (active) {
            setIsKeypairValid(false);
            setIsServerAuthenticated(false);
          }
        });
    } else {
      setIsKeypairValid(false);
      setIsServerAuthenticated(false);
      setAuthError(null);
    }
    return () => {
      active = false;
    };
  }, [publicKey, privateKey]);

  // Step 1: Persistence for Identity Key & Country (local state only, no DB insert)
  useEffect(() => {
    const syncFromStorage = () => {
      getOrCreateIdentity().then((identity) => {
        setPublicKey(identity.publicKey);
        setPrivateKey(identity.privateKey);
      });
    };

    syncFromStorage();
    const savedCountry = localStorage.getItem('pc_onboarding_country') || 'US';
    setCountry(savedCountry);
    localStorage.setItem('pc_onboarding_country', savedCountry);

    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  const handlePublicKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPublicKey(val);
    localStorage.setItem('pc_public_key', val);
  };

  const handlePrivateKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPrivateKey(val);
    localStorage.setItem('pc_private_key', val);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCountry(val);
    localStorage.setItem('pc_onboarding_country', val);
  };

  const handleRotateIdentity = async () => {
    const newIdentity = await rotateIdentity();
    setPublicKey(newIdentity.publicKey);
    setPrivateKey(newIdentity.privateKey);
    setDbTier('free');
    setIsServerAuthenticated(false);
    localStorage.removeItem('pc_shipping_name');
    localStorage.removeItem('pc_shipping_address');
    localStorage.removeItem('pc_shipping_city');
    localStorage.removeItem('pc_shipping_zip');
    window.dispatchEvent(new Event('storage'));
  };

  const getPlanPrice = (): number => {
    if (selectedPlan === 'free') return 0;
    const parsed = parseFloat(customDonationInput);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    return donationAmount > 0 ? donationAmount : 1.00;
  };

  const calculateTotal = () => {
    const planPrice = getPlanPrice();
    const kitPrice = addHardwareKit ? 25.00 * kitQuantity : 0.00;
    return planPrice + kitPrice;
  };

  // Check tier from db users row or props
  const effectiveTier = paymentStatusProp || dbTier;
  const isPaymentStatusPro = isProLicenseStatus(effectiveTier);
  const isUnlimitedUser = effectiveTier.toLowerCase().trim() === 'unlimited' || selectedPlan === 'unlimited' || isPaymentStatusPro;

  const canBypassToScan = Boolean(
    publicKey &&
    publicKey.trim().length > 0 &&
    isKeypairValid &&
    isServerAuthenticated &&
    isPaymentStatusPro &&
    !addHardwareKit
  );

  const handleProceedFromDonation = async (bypassAmount?: number) => {
    setIsProcessing(true);
    setStripeError(null);
    try {
      const activeDonation = typeof bypassAmount === 'number' ? bypassAmount : getPlanPrice();
      // 1. Verify keypair matches mathematically
      const keyMatch = isKeypairValid || (await validateKeyPair(publicKey, privateKey));
      if (!keyMatch) {
        setIsProcessing(false);
        setStripeError('Keypair mismatch: Private key does not correspond to public key.');
        return;
      }

      // 2. Authenticate against database salted private key hash
      const authResult = await syncIdentityToServer({ publicKey, privateKey });
      if (!authResult.success || !authResult.user) {
        setIsProcessing(false);
        setStripeError(authResult.error || 'Authentication rejected: Private key does not match database record.');
        return;
      }

      // 3. Obtain verified tier directly from users row in database
      const currentTier = authResult.user.tier || dbTier;
      setDbTier(currentTier);
      const isPro = isProLicenseStatus(paymentStatusProp || currentTier);

      // If public key exists, private key matches, tier in DB is Pro License, and kit is unchecked:
      if (publicKey.trim().length > 0 && isPro && !addHardwareKit && activeDonation === 0) {
        if (!authResult.exists) {
          await syncIdentityToServer(
            { publicKey, privateKey },
            { registerIfMissing: true, tier: currentTier }
          ).catch(console.error);
        }
        setIsProcessing(false);
        if (typeof window !== 'undefined') {
          if (window.location.pathname === '/scan') {
            onComplete();
          } else {
            try {
              router.push('/scan');
            } catch {
              window.location.href = '/scan';
            }
          }
        }
        return;
      }

      const total = activeDonation + (addHardwareKit ? 25.00 * kitQuantity : 0.00);
      if (total === 0) {
        // Free version / skipped donation, no kit: Proceed to Scan (last step)
        await syncIdentityToServer(
          { publicKey, privateKey },
          {
            registerIfMissing: true,
            username: authResult.user.username || 'Shaggy',
            tier: currentTier || 'free',
            access: 'Alpha',
          }
        ).catch(console.error);

        setTimeout(() => {
          setIsProcessing(false);
          onComplete();
        }, 800);
      } else {
        setIsProcessing(false);
        setStep(4);
      }
    } catch (err: any) {
      console.error('Error proceeding from donation:', err);
      setStripeError(err?.message || 'Authentication error.');
      setIsProcessing(false);
    }
  };

  const handleSkipDonation = () => {
    setDonationAmount(0);
    setCustomDonationInput('0.00');
    handleProceedFromDonation(0);
  };

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    setStripeError(null);
    try {
      localStorage.setItem('pc_user_tier', selectedPlan);
      const activePrivKey = privateKey || (typeof window !== 'undefined' ? localStorage.getItem('pc_private_key') : '') || '';
      if (publicKey && activePrivKey) {
        localStorage.setItem('pc_public_key', publicKey);
        localStorage.setItem('pc_private_key', activePrivKey);
      }

      const planPrice = getPlanPrice();
      const total = calculateTotal();
      const kitTotal = addHardwareKit ? 25.00 * kitQuantity : 0.00;
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: publicKey,
          privateKey: activePrivKey,
          priceId: 'price_XXXXX', // Stripe Price ID
          amount: total,
          productName: addHardwareKit
            ? `Purple Canary Pro License (Donation $${planPrice.toFixed(2)}) + Hardware Kit x${kitQuantity} ($${kitTotal.toFixed(2)})`
            : `Purple Canary Pro License (Donation $${planPrice.toFixed(2)})`,
          metadata: {
            username: 'Shaggy',
            donationAmount: planPrice.toFixed(2),
            kitQuantity: addHardwareKit ? kitQuantity.toString() : '0',
            shippingName: addHardwareKit ? shippingName : '',
            shippingAddress: addHardwareKit ? shippingAddress : '',
            shippingCity: addHardwareKit ? shippingCity : '',
            shippingZip: addHardwareKit ? shippingZip : '',
          },
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
        
        {/* Progress Bar (Total 5 Steps) */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <div 
            className="h-full bg-gradient-to-r from-neon-cyan to-ultra-violet transition-all duration-500"
            style={{ width: `${(step / 5) * 100}%` }}
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

        {/* --- STEP 1 (IDENTITY & LOCATION) --- */}
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
                            value={publicKey}
                            onChange={handlePublicKeyChange}
                            placeholder="0x..."
                            className="w-full bg-[#1a052b]/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all font-mono text-xs"
                            />
                        </div>
                    </div>

                    {/* Identity Private Key Input */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between ml-2 pr-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">Identity Private Key</label>
                            <button
                                type="button"
                                onClick={() => setShowPrivateKey(!showPrivateKey)}
                                className="text-[10px] text-gray-500 hover:text-neon-cyan flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-rounded text-[14px]">
                                    {showPrivateKey ? 'visibility_off' : 'visibility'}
                                </span>
                                <span>{showPrivateKey ? 'Hide' : 'Reveal'}</span>
                            </button>
                        </div>
                        <div className="relative group">
                            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-gray-500 group-focus-within:text-neon-cyan transition-colors">vpn_key</span>
                            <input 
                            type={showPrivateKey ? "text" : "password"} 
                            value={privateKey}
                            onChange={handlePrivateKeyChange}
                            placeholder="Stored locally on device..."
                            className="w-full bg-[#1a052b]/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all font-mono text-xs"
                            />
                        </div>
                        <p className="text-[9px] text-gray-500 ml-2 italic">
                            Private keys never leave your device or touch the network.
                        </p>
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

                    {authError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-[10px] text-red-300 font-mono flex items-start gap-2 animate-in fade-in">
                        <span className="material-symbols-rounded text-red-400 text-sm shrink-0">gpp_bad</span>
                        <div>{authError}</div>
                      </div>
                    )}

                    <button 
                        onClick={() => publicKey && country && !authError && setStep(2)}
                        disabled={!publicKey || !country || Boolean(authError)}
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

        {/* --- STEP 2 (NEW - HARDWARE KIT SELECTION) --- */}
        {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-8 pt-4">
                <div className="text-center pt-2">
                    <h2 className="text-lg font-bold text-white">Forensic Hardware Kit.</h2>
                    <p className="text-xs text-gray-400">Add physical testing gear or continue with software only.</p>
                </div>

                <div className="space-y-3">
                    <button 
                        type="button"
                        onClick={() => setAddHardwareKit(!addHardwareKit)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3
                            ${addHardwareKit 
                            ? 'border-ultra-violet bg-ultra-violet/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]' 
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                            }
                        `}
                    >
                        <div className="shrink-0 flex items-center">
                            <span className={`material-symbols-rounded text-[22px] ${addHardwareKit ? 'text-ultra-violet' : 'text-gray-500'}`}>
                                {addHardwareKit ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-white uppercase">Reusable Forensic Hardware Kit</span>
                                <span className="text-xs font-black text-neon-cyan shrink-0">$25.00</span>
                            </div>
                            <p className="text-[9px] font-mono text-gray-400 mt-1 leading-relaxed">
                                Includes 100x chromatography strips, 100ml solvent, and dual-core UV light. Performing tests on the hardware costs <strong className="text-white">0.167¢</strong> per run!
                            </p>
                        </div>
                    </button>

                    {/* Quantity Selector if kit is selected */}
                    {addHardwareKit && (
                        <div className="bg-[#1a052b]/60 border border-ultra-violet/30 rounded-xl p-3.5 flex items-center justify-between animate-in fade-in">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-sm text-neon-cyan">pin</span>
                                Kit Quantity
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setKitQuantity(Math.max(1, kitQuantity - 1))}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white hover:border-neon-cyan transition-colors"
                                >
                                    -
                                </button>
                                <span className="text-xs font-mono font-bold text-white px-2">{kitQuantity}</span>
                                <button
                                    type="button"
                                    onClick={() => setKitQuantity(kitQuantity + 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white hover:border-neon-cyan transition-colors"
                                >
                                    +
                                </button>
                                <span className="text-xs font-mono text-neon-cyan font-bold ml-2">
                                    ${(25.00 * kitQuantity).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    <button 
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-1/3 py-4 bg-white/5 border border-white/10 text-gray-300 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-1"
                    >
                        <span className="material-symbols-rounded text-[16px]">arrow_back</span> Back
                    </button>
                    <button 
                        type="button"
                        onClick={() => setStep(3)}
                        className="w-2/3 py-4 bg-white text-[#1a052b] font-black uppercase tracking-widest rounded-xl hover:bg-neon-cyan transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        Continue <span className="material-symbols-rounded text-[16px]">arrow_forward</span>
                    </button>
                </div>
            </div>
        )}

        {/* --- STEP 3 (FORMERLY STEP 2 - CONTRIBUTION & LICENSES) --- */}
        {step === 3 && (
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
                                    DONATION TIER
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
                            <div className="shrink-0 text-right">
                                {plan.id === 'free' ? (
                                    <span className="text-xl font-black text-neon-cyan">FREE</span>
                                ) : isSelected ? (
                                    <div>
                                        <div className="text-xl font-black text-neon-cyan">${getPlanPrice().toFixed(2)}</div>
                                        <div className="text-[8px] font-mono text-neon-cyan/70 uppercase">Donation</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-sm font-black text-neon-cyan uppercase">Donate</div>
                                        <div className="text-[8px] font-mono text-gray-400 uppercase">Any Amount</div>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
                </div>

                {/* Donation Amount Selector for Unlimited Pro */}
                {selectedPlan === 'unlimited' && (
                  <div className="bg-[#1a052b]/60 border border-neon-cyan/30 rounded-xl p-3.5 space-y-2.5 animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-1.5">
                        <span className="material-symbols-rounded text-sm">volunteer_activism</span>
                        Donation Amount
                      </span>
                      <span className="text-[9px] font-mono text-gray-400">Pay what you want (Min $0.50)</span>
                    </div>

                    {/* Quick Presets */}
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 5, 10, 25].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setDonationAmount(preset);
                            setCustomDonationInput(preset.toString());
                          }}
                          className={`py-2 px-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                            getPlanPrice() === preset && customDonationInput === preset.toString()
                              ? 'bg-neon-cyan text-[#1a052b] border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          ${preset}
                        </button>
                      ))}
                    </div>

                    {/* Custom Donation Input */}
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-gray-400">$</span>
                      <input
                        type="number"
                        min="0.50"
                        step="any"
                        placeholder="Enter custom donation amount"
                        value={customDonationInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomDonationInput(val);
                          const parsed = parseFloat(val);
                          if (!isNaN(parsed) && parsed > 0) {
                            setDonationAmount(parsed);
                          }
                        }}
                        className="w-full bg-[#10031c] border border-white/10 rounded-lg py-2.5 pl-8 pr-14 text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500 uppercase">USD</span>
                    </div>
                    {getPlanPrice() < 0.50 && (
                      <div className="text-[10px] text-red-400 font-mono">
                        Minimum donation is $0.50 USD to process transaction.
                      </div>
                    )}
                    <p className="text-[9px] font-mono text-gray-400 leading-tight">
                      Donate any amount to support open-source harm-reduction screening and unlock 100% ad-free unlimited scans.
                    </p>
                  </div>
                )}

                {(stripeError || authError) && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-[10px] text-red-300 font-mono flex items-start gap-2 animate-in fade-in">
                    <span className="material-symbols-rounded text-red-400 text-sm shrink-0">gpp_bad</span>
                    <div>{stripeError || authError}</div>
                  </div>
                )}

                <div className="space-y-2 mt-2">
                  <button 
                  onClick={() => handleProceedFromDonation()}
                  disabled={isProcessing || Boolean(authError) || (selectedPlan === 'unlimited' && getPlanPrice() < 0.50)}
                  className="w-full py-4 bg-white text-[#1a052b] font-black uppercase tracking-widest rounded-xl hover:bg-neon-cyan transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                  {isProcessing 
                    ? "Unlocking Suite..." 
                    : canBypassToScan 
                      ? "Proceed to Scan" 
                      : calculateTotal() === 0 
                        ? "Unlock Suite (Free)" 
                        : "Proceed to Checkout"}
                  <span className="material-symbols-rounded text-[16px]">arrow_forward</span>
                  </button>

                  {/* Skip Donation button - visible conditionally for unlimited users */}
                  {isUnlimitedUser && (
                    <button
                      type="button"
                      onClick={handleSkipDonation}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white font-mono text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-rounded text-sm">skip_next</span>
                      Skip Donation ($0.00)
                    </button>
                  )}
                </div>
            </div>
        )}

        {/* --- STEP 4 (CHECKOUT & SHIPPING) --- */}
        {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 pt-4">
                <div className="text-center pt-2">
                <h2 className="text-lg font-bold text-white">Order Summary.</h2>
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <span className="material-symbols-rounded text-[12px]">receipt_long</span> Confirm your order details
                </p>
                </div>

                <div className="bg-[#1a052b]/50 rounded-xl p-4 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span>{selectedPlan === 'unlimited' ? 'Unlimited Pro License (Donation)' : 'Free Ad Version'}</span>
                    <span>{selectedPlan === 'unlimited' ? `$${getPlanPrice().toFixed(2)}` : '$0.00'}</span>
                </div>
                {addHardwareKit && (
                    <div className="flex justify-between items-center text-xs text-green-400">
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-rounded text-[12px]">redeem</span> 
                            Forensic Hardware Kit {kitQuantity > 1 ? `(x${kitQuantity})` : ''}
                        </span>
                        <span>${(25.00 * kitQuantity).toFixed(2)}</span>
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
                onClick={() => isShippingValid && setStep(5)}
                disabled={!isShippingValid}
                className="w-full py-4 bg-gradient-to-r from-neon-cyan to-blue-500 text-[#1a052b] font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                {addHardwareKit && !isShippingValid ? "Enter Shipping Info" : "Proceed to Payment"}
                <span className="material-symbols-rounded text-[16px]">arrow_forward</span>
                </button>
            </div>
        )}

        {/* --- STEP 5 (STRIPE CHECKOUT) --- */}
        {step === 5 && (
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
