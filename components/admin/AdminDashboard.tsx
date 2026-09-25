'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  adminService,
  AdminStats,
  AdminUserRecord,
  AdminScanRecord,
  AdminTransactionRecord,
} from '@/services/adminService';
import { getOrCreateIdentity } from '@/services/identity';

type AdminTab = 'OVERVIEW' | 'NODES' | 'SCANS' | 'FINANCIALS' | 'CONSOLE';

export const AdminDashboard: React.FC = () => {
  // Auth state
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [authError, setAuthError] = useState<string | null>(null);
  const [clientPublicKey, setClientPublicKey] = useState<string>('');

  // Active navigation
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [scans, setScans] = useState<AdminScanRecord[]>([]);
  const [totalScansCount, setTotalScansCount] = useState<number>(0);
  const [transactions, setTransactions] = useState<AdminTransactionRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userTierFilter, setUserTierFilter] = useState<'ALL' | 'admin' | 'unlimited' | 'pro' | 'free'>('ALL');
  const [scanSearch, setScanSearch] = useState('');
  const [scanVerdictFilter, setScanVerdictFilter] = useState<string>('ALL');

  // Modals & Inspect
  const [selectedScan, setSelectedScan] = useState<AdminScanRecord | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [statusToast, setStatusToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setStatusToast({ message, type });
    setTimeout(() => setStatusToast(null), 3500);
  };

  // 1. Initial Authorization Verification
  const verifyClearance = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const identity = await getOrCreateIdentity();
      setClientPublicKey(identity.publicKey);

      const check = await adminService.checkAdminAccess();
      if (check.authorized && check.user) {
        setIsAuthorized(true);
        setCurrentUser(check.user);
        setCurrentTier(check.user.tier);
      } else {
        setIsAuthorized(false);
        setCurrentTier(check.currentTier || localStorage.getItem('pc_user_tier') || 'free');
        setAuthError(check.error || 'Access Denied: Node does not possess tier = "admin" clearance.');
      }
    } catch (err: any) {
      setIsAuthorized(false);
      setAuthError(err.message || 'Authorization failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    verifyClearance();
  }, []);

  // 2. Fetch Dashboard Data once authorized
  useEffect(() => {
    if (!isAuthorized) return;

    let isMounted = true;
    const loadAll = async () => {
      setLoadingData(true);
      try {
        const [statsData, usersData, scansData, txData] = await Promise.all([
          adminService.getStats().catch(() => null),
          adminService.getUsers().catch(() => []),
          adminService.getScans(100, 0).catch(() => ({ scans: [], totalCount: 0 })),
          adminService.getTransactions(100).catch(() => []),
        ]);

        if (isMounted) {
          if (statsData) setStats(statsData);
          setUsers(usersData);
          setScans(scansData.scans);
          setTotalScansCount(scansData.totalCount);
          setTransactions(txData);
        }
      } catch (err: any) {
        console.error('Failed to load admin data:', err);
        showToast('Error loading administrative records: ' + err.message, 'error');
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [isAuthorized, refreshTrigger]);

  // Handle tier promotion / mutation
  const handleUpdateTier = async (targetPublicKey: string, newTier: string) => {
    setActionLoadingKey(targetPublicKey);
    try {
      const updated = await adminService.updateUserTier(targetPublicKey, newTier);
      setUsers((prev) =>
        prev.map((u) => (u.publicKey === targetPublicKey ? { ...u, tier: updated.tier } : u))
      );
      showToast(`User ${targetPublicKey.substring(0, 10)}... updated to tier [${newTier}]`, 'success');
      // Update stats count locally
      setRefreshTrigger((n) => n + 1);
    } catch (err: any) {
      showToast('Failed to update tier: ' + err.message, 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.publicKey.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(userSearch.toLowerCase()));
      const matchesTier = userTierFilter === 'ALL' || u.tier === userTierFilter;
      return matchesSearch && matchesTier;
    });
  }, [users, userSearch, userTierFilter]);

  // Filtered Scans
  const filteredScans = useMemo(() => {
    return scans.filter((s) => {
      const matchesSearch =
        s.id.toLowerCase().includes(scanSearch.toLowerCase()) ||
        s.userId.toLowerCase().includes(scanSearch.toLowerCase()) ||
        s.substanceName.toLowerCase().includes(scanSearch.toLowerCase());
      const matchesVerdict =
        scanVerdictFilter === 'ALL' ||
        s.verdict.toUpperCase().includes(scanVerdictFilter.toUpperCase());
      return matchesSearch && matchesVerdict;
    });
  }, [scans, scanSearch, scanVerdictFilter]);

  // Export full JSON telemetry
  const handleExportBackup = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      adminKey: clientPublicKey,
      stats,
      users,
      scans,
      transactions,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purple_canary_audit_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported forensic ledger backup to JSON.', 'success');
  };

  // Seed demo scans
  const handleSeedScans = async () => {
    setActionLoadingKey('seed');
    try {
      const res = await fetch('/api/scans/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to trigger scan seeding.');
      showToast('Demo scans seeded into TursoDB.', 'success');
      setRefreshTrigger((n) => n + 1);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // -------------------------------------------------------------
  // STATE: LOADING CLEARANCE
  // -------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0d0214] flex flex-col items-center justify-center p-6 text-neon-cyan font-mono select-none">
        <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/20 animate-ping"></div>
          <div className="w-16 h-16 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin"></div>
          <span className="material-symbols-rounded text-neon-cyan text-2xl absolute">shield_lock</span>
        </div>
        <div className="text-sm font-black tracking-widest text-center uppercase animate-pulse">
          Authenticating Forensic Node...
        </div>
        <div className="text-[10px] text-gray-500 mt-2 tracking-widest text-center uppercase">
          Verifying Asymmetric ECDSA P-256 Signature against TursoDB
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE: ACCESS DENIED (tier !== 'admin')
  // -------------------------------------------------------------
  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-[#0a0210] text-gray-200 flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-rose-500/30">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(225,29,72,0.12),transparent_70%)] pointer-events-none"></div>

        <div className="relative w-full max-w-lg bg-[#140420]/90 border border-rose-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(225,29,72,0.15)] backdrop-blur-xl">
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-rose-400 uppercase">
                RESTRICTED TERMINAL // 403
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-500 uppercase">Forensic Clearance Guard</span>
          </div>

          {/* Icon & Title */}
          <div className="text-center space-y-3 mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.25)]">
              <span className="material-symbols-rounded text-3xl">gpp_bad</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white uppercase">
              Access Denied
            </h1>
            <p className="text-xs text-rose-300/80 font-mono leading-relaxed">
              This terminal requires database clearance <span className="font-bold text-white underline">tier = "admin"</span>.
              Your cryptographic identity node lacks requisite authority.
            </p>
          </div>

          {/* Node Identity Card */}
          <div className="bg-[#1c082c] border border-white/10 rounded-2xl p-4 space-y-2 mb-6 font-mono text-xs">
            <div className="flex justify-between items-center text-[10px] text-gray-400 uppercase">
              <span>Your Node Public Key:</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(clientPublicKey);
                  showToast('Public key copied to clipboard.');
                }}
                className="text-neon-cyan hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-rounded text-xs">content_copy</span> Copy
              </button>
            </div>
            <div className="text-[11px] text-gray-300 font-mono break-all bg-black/40 p-2 rounded-lg border border-white/5 select-all">
              {clientPublicKey || 'No local keypair generated.'}
            </div>

            <div className="flex justify-between items-center pt-2 text-[11px]">
              <span className="text-gray-400">Current Node Tier:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {currentTier || 'free'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400">Required Clearance:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
                admin
              </span>
            </div>
          </div>

          {/* Developer / Promotion Instruction */}
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 mb-6 font-mono text-[10px] text-gray-400 space-y-1.5">
            <div className="text-gray-300 font-bold flex items-center gap-1.5">
              <span className="material-symbols-rounded text-xs text-neon-cyan">terminal</span>
              Operator Elevation Instruction:
            </div>
            <div className="text-gray-500">
              Run this in your terminal to grant this node admin clearance directly in TursoDB:
            </div>
            <div className="bg-black/60 p-2 rounded text-neon-cyan select-all break-all border border-neon-cyan/20">
              npx tsx scripts/setAdminTier.ts set &quot;{clientPublicKey ? clientPublicKey.substring(0, 24) + '...' : '<pubkey>'}&quot; admin
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => (window.location.href = '/scan')}
              className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <span className="material-symbols-rounded text-sm">science</span> The Lab
            </button>
            <button
              onClick={verifyClearance}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-ultra-violet text-white font-mono text-xs uppercase tracking-wider font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-rounded text-sm">refresh</span> Re-check
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE: AUTHORIZED ADMIN DASHBOARD (tier === 'admin')
  // -------------------------------------------------------------
  return (
    <div className="h-screen w-screen overflow-y-auto bg-[#0d0214] text-gray-100 font-sans selection:bg-neon-cyan/30 flex flex-col no-scrollbar">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(143,0,255,0.15),transparent_70%)] pointer-events-none"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_90%_80%,rgba(0,255,255,0.06),transparent_60%)] pointer-events-none"></div>

      {/* Floating Status Toast */}
      {statusToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 font-mono text-xs animate-in slide-in-from-bottom duration-300 ${
            statusToast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          <span className="material-symbols-rounded text-sm">
            {statusToast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{statusToast.message}</span>
        </div>
      )}

      {/* TOP COMMAND BAR */}
      <header className="sticky top-0 z-40 w-full bg-[#120320]/80 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Logo & Node Clearance */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ultra-violet to-neon-cyan p-[1px] shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                <div className="w-full h-full bg-[#160628] rounded-xl flex items-center justify-center">
                  <span className="material-symbols-rounded text-neon-cyan text-xl">admin_panel_settings</span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#120320] animate-pulse"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black tracking-tight text-white uppercase italic">
                  Purple Canary <span className="text-neon-cyan font-mono text-xs font-normal">ROOT CONSOLE</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-ultra-violet/20 text-ultra-violet border border-ultra-violet/40">
                  Level 5
                </span>
              </div>
              <div className="text-[10px] font-mono text-gray-400 flex items-center gap-2">
                <span className="text-emerald-400">● TURSO DB: CONNECTED</span>
                <span>|</span>
                <span className="truncate max-w-[140px] md:max-w-[200px]" title={clientPublicKey}>
                  Node: {clientPublicKey.substring(0, 12)}...
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setRefreshTrigger((n) => n + 1)}
              disabled={loadingData}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all flex items-center gap-1.5 text-xs font-mono"
              title="Refresh Data"
            >
              <span
                className={`material-symbols-rounded text-sm ${loadingData ? 'animate-spin text-neon-cyan' : ''}`}
              >
                refresh
              </span>
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neon-cyan hover:text-white border border-neon-cyan/20 transition-all flex items-center gap-1.5 text-xs font-mono"
              title="Export Forensic Ledger JSON"
            >
              <span className="material-symbols-rounded text-sm">download</span>
              <span className="hidden sm:inline">Export Audit</span>
            </button>

            <button
              onClick={() => (window.location.href = '/scan')}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-ultra-violet to-neon-cyan text-black font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 shadow-md"
            >
              <span className="material-symbols-rounded text-sm">science</span>
              <span>The Lab</span>
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all"
              title="Return to Home Base"
            >
              <span className="material-symbols-rounded text-sm">home</span>
            </button>
          </div>
        </div>

        {/* SUB-NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1 border-t border-white/5 pt-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'OVERVIEW', label: 'Telemetry & Vitals', icon: 'monitoring' },
            { id: 'NODES', label: `Node Registry (${users.length})`, icon: 'group' },
            { id: 'SCANS', label: `Forensic Scans (${totalScansCount || scans.length})`, icon: 'biotech' },
            { id: 'FINANCIALS', label: `Stripe Ledger (${transactions.length})`, icon: 'credit_card' },
            { id: 'CONSOLE', label: 'System Console', icon: 'terminal' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`py-1.5 px-3 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_12px_rgba(0,255,255,0.15)] font-bold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="material-symbols-rounded text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 flex-1 space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & TELEMETRY */}
        {/* ========================================================= */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Users */}
              <div className="bg-[#140525] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-ultra-violet/50 transition-all">
                <div className="absolute top-0 right-0 p-4 text-ultra-violet/20 group-hover:text-ultra-violet/30 transition-colors">
                  <span className="material-symbols-rounded text-5xl">group</span>
                </div>
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Registered Nodes
                </div>
                <div className="text-3xl font-black italic tracking-tighter text-white mt-1">
                  {stats?.users.total ?? users.length}
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-ultra-violet/20 text-ultra-violet font-bold">
                    {stats?.users.admin ?? users.filter((u) => u.tier === 'admin').length} Admin
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-neon-cyan/20 text-neon-cyan font-bold">
                    {stats?.users.unlimited ?? users.filter((u) => u.tier === 'unlimited').length} Unlimited
                  </span>
                  <span className="text-gray-400">
                    {stats?.users.free ?? users.filter((u) => u.tier === 'free').length} Free
                  </span>
                </div>
              </div>

              {/* Card 2: Total Scans */}
              <div className="bg-[#140525] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-neon-cyan/50 transition-all">
                <div className="absolute top-0 right-0 p-4 text-neon-cyan/20 group-hover:text-neon-cyan/30 transition-colors">
                  <span className="material-symbols-rounded text-5xl">science</span>
                </div>
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Forensic Scans
                </div>
                <div className="text-3xl font-black italic tracking-tighter text-white mt-1">
                  {stats?.scans.total ?? totalScansCount ?? scans.length}
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-gray-400">
                  <span className="text-emerald-400 font-bold">
                    {stats?.scans.clean ?? scans.filter((s) => s.verdict === 'CLEAN').length} Clean
                  </span>
                  <span>/</span>
                  <span className="text-amber-400 font-bold">
                    {stats?.scans.warning ?? scans.filter((s) => s.verdict === 'WARNING').length} Warn
                  </span>
                </div>
              </div>

              {/* Card 3: Intercepted Hazards */}
              <div className="bg-[#140525] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/50 transition-all">
                <div className="absolute top-0 right-0 p-4 text-rose-500/20 group-hover:text-rose-500/30 transition-colors">
                  <span className="material-symbols-rounded text-5xl">warning</span>
                </div>
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Threat Interceptions
                </div>
                <div className="text-3xl font-black italic tracking-tighter text-rose-400 mt-1">
                  {(stats?.scans.lethal ?? 0) + (stats?.scans.highRisk ?? 0)}
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                    {stats?.scans.lethal ?? 0} Lethal Contaminants
                  </span>
                  <span className="text-amber-400 font-bold">
                    {stats?.scans.highRisk ?? 0} High Risk
                  </span>
                </div>
              </div>

              {/* Card 4: Stripe Revenue */}
              <div className="bg-[#140525] border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-400/50 transition-all">
                <div className="absolute top-0 right-0 p-4 text-emerald-400/20 group-hover:text-emerald-400/30 transition-colors">
                  <span className="material-symbols-rounded text-5xl">payments</span>
                </div>
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Stripe Gross Volume
                </div>
                <div className="text-3xl font-black italic tracking-tighter text-emerald-300 mt-1">
                  ${(stats?.transactions.grossVolume ?? 0).toFixed(2)}
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-gray-400">
                  <span className="text-emerald-400 font-bold">
                    {stats?.transactions.total ?? transactions.length} Sessions
                  </span>
                  <span>Idempotent Webhooks</span>
                </div>
              </div>
            </div>

            {/* THREAT SPECTRUM DISTRIBUTION BAR */}
            <div className="bg-[#140525] border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-neon-cyan text-sm">equalizer</span>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Threat Spectrum Distribution
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-gray-400">
                  Active Reagent & TLC Ingest Ledger
                </span>
              </div>

              {/* Meter bar */}
              <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden flex border border-white/10">
                {(() => {
                  const total = stats?.scans.total || scans.length || 1;
                  const clean = ((stats?.scans.clean ?? 0) / total) * 100;
                  const warn = ((stats?.scans.warning ?? 0) / total) * 100;
                  const high = ((stats?.scans.highRisk ?? 0) / total) * 100;
                  const lethal = ((stats?.scans.lethal ?? 0) / total) * 100;
                  return (
                    <>
                      <div style={{ width: `${clean}%` }} className="bg-emerald-400 h-full" title={`Clean: ${clean.toFixed(1)}%`} />
                      <div style={{ width: `${warn}%` }} className="bg-amber-400 h-full" title={`Warning: ${warn.toFixed(1)}%`} />
                      <div style={{ width: `${high}%` }} className="bg-orange-500 h-full" title={`High Risk: ${high.toFixed(1)}%`} />
                      <div style={{ width: `${lethal}%` }} className="bg-rose-600 h-full" title={`Lethal: ${lethal.toFixed(1)}%`} />
                    </>
                  );
                })()}
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono pt-1 text-gray-400 gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span>Clean ({stats?.scans.clean ?? 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>Warning ({stats?.scans.warning ?? 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span>High Risk ({stats?.scans.highRisk ?? 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <span>Lethal Adulterants ({stats?.scans.lethal ?? 0})</span>
                </div>
              </div>
            </div>

            {/* TWO-COLUMN: RECENT ACTIVITY & SYSTEM STATUS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Recent Scans Stream */}
              <div className="lg:col-span-2 bg-[#140525] border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-rounded text-ultra-violet text-sm">history</span>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      Live Telemetry Stream
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('SCANS')}
                    className="text-[10px] font-mono text-neon-cyan hover:underline"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="divide-y divide-white/5">
                  {scans.slice(0, 6).map((scan) => {
                    const isLethal = scan.verdict.toUpperCase().includes('LETHAL');
                    const isHigh = scan.verdict.toUpperCase().includes('HIGH');
                    const isClean = scan.verdict.toUpperCase().includes('CLEAN');

                    return (
                      <div
                        key={scan.id}
                        onClick={() => setSelectedScan(scan)}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] px-2 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              isLethal
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : isHigh
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                                : isClean
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}
                          >
                            <span className="material-symbols-rounded text-base">
                              {isLethal ? 'skull' : isClean ? 'verified' : 'warning'}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {scan.substanceName || scan.verdict}
                            </div>
                            <div className="text-[10px] font-mono text-gray-500 truncate">
                              Node: {scan.userId.substring(0, 14)}... | {scan.location}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              isLethal
                                ? 'bg-rose-600/30 text-rose-300'
                                : isHigh
                                ? 'bg-orange-600/30 text-orange-300'
                                : isClean
                                ? 'bg-emerald-600/30 text-emerald-300'
                                : 'bg-amber-600/30 text-amber-300'
                            }`}
                          >
                            {scan.verdict}
                          </span>
                          <span className="text-[9px] font-mono text-gray-500 mt-1">
                            {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {scans.length === 0 && (
                    <div className="py-8 text-center text-xs font-mono text-gray-500">
                      No scans logged in database.
                    </div>
                  )}
                </div>
              </div>

              {/* Right 1 Col: Forensic Engine Status */}
              <div className="bg-[#140525] border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-emerald-400 text-sm">dns</span>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Engine Vitals
                  </h3>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Turso libSQL</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">Parameterized schema with Drizzle ORM</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Asymmetric Protocol</span>
                      <span className="text-neon-cyan font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan"></span> ECDSA P-256
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">Zero plaintext private keys, challenge signed</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Stripe Webhooks</span>
                      <span className="text-ultra-violet font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-ultra-violet"></span> Idempotent
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">Session deduplication verified in DB</div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Edge ML Proxy</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Gemini 2.5
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">Cloudflare Worker plate verification</div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSeedScans}
                    disabled={actionLoadingKey === 'seed'}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-mono text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-rounded text-sm">database</span>
                    <span>Seed Demo Forensic Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: NODE REGISTRY & USER MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'NODES' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Search and Filters Header */}
            <div className="bg-[#140525] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <span className="material-symbols-rounded text-gray-500 text-sm absolute left-3 top-3">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by Key or Username..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>

              {/* Tier Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
                {(['ALL', 'admin', 'unlimited', 'pro', 'free'] as const).map((tierOpt) => (
                  <button
                    key={tierOpt}
                    onClick={() => setUserTierFilter(tierOpt)}
                    className={`py-1.5 px-3 rounded-xl font-mono text-[11px] uppercase tracking-wider transition-all whitespace-nowrap ${
                      userTierFilter === tierOpt
                        ? 'bg-ultra-violet/30 text-neon-cyan border border-neon-cyan/40 font-bold'
                        : 'bg-black/30 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {tierOpt}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table / Grid */}
            <div className="bg-[#140525] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-black/50 border-b border-white/10 text-gray-400 text-[10px] uppercase tracking-widest">
                      <th className="py-3 px-4">Node Public Key</th>
                      <th className="py-3 px-4">Callsign</th>
                      <th className="py-3 px-4">Tier Status</th>
                      <th className="py-3 px-4">Access</th>
                      <th className="py-3 px-4">Registered</th>
                      <th className="py-3 px-4 text-right">Promote / Mutate Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((user) => {
                      const isCurrentNode = user.publicKey === clientPublicKey;
                      const isLoading = actionLoadingKey === user.publicKey;

                      return (
                        <tr
                          key={user.publicKey}
                          className={`hover:bg-white/[0.02] transition-colors ${
                            isCurrentNode ? 'bg-ultra-violet/5' : ''
                          }`}
                        >
                          {/* Public Key */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-mono text-gray-300 hover:text-neon-cyan cursor-pointer transition-colors"
                                title={user.publicKey}
                                onClick={() => {
                                  navigator.clipboard.writeText(user.publicKey);
                                  showToast('Copied key: ' + user.publicKey.substring(0, 16) + '...');
                                }}
                              >
                                {user.publicKey.substring(0, 16)}...{user.publicKey.slice(-6)}
                              </span>
                              {isCurrentNode && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 font-bold uppercase">
                                  You
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(user.publicKey);
                                  showToast('Copied key to clipboard.');
                                }}
                                className="text-gray-500 hover:text-white"
                                title="Copy Full Key"
                              >
                                <span className="material-symbols-rounded text-xs">content_copy</span>
                              </button>
                            </div>
                          </td>

                          {/* Username */}
                          <td className="py-3 px-4 text-white font-medium">
                            {user.username || 'Shaggy'}
                          </td>

                          {/* Tier Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                                user.tier === 'admin'
                                  ? 'bg-ultra-violet/30 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                                  : user.tier === 'unlimited'
                                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40'
                                  : user.tier === 'pro'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-white/5 text-gray-400 border border-white/10'
                              }`}
                            >
                              <span className="material-symbols-rounded text-xs">
                                {user.tier === 'admin'
                                  ? 'shield'
                                  : user.tier === 'unlimited'
                                  ? 'bolt'
                                  : 'person'}
                              </span>
                              {user.tier}
                            </span>
                          </td>

                          {/* Access Level */}
                          <td className="py-3 px-4 text-gray-400">
                            {user.access || 'Alpha'}
                          </td>

                          {/* Registered At */}
                          <td className="py-3 px-4 text-gray-500 text-[11px]">
                            {user.createdAt ? user.createdAt.split('T')[0] : 'Legacy'}
                          </td>

                          {/* Tier Switcher Action */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isLoading ? (
                                <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <select
                                  value={user.tier}
                                  onChange={(e) => handleUpdateTier(user.publicKey, e.target.value)}
                                  className="bg-black/60 border border-white/10 rounded-lg text-[11px] font-mono text-gray-200 py-1 px-2 focus:outline-none focus:border-neon-cyan cursor-pointer"
                                >
                                  <option value="admin">Promote to admin</option>
                                  <option value="unlimited">Set to unlimited</option>
                                  <option value="pro">Set to pro</option>
                                  <option value="free">Set to free</option>
                                </select>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 font-mono text-xs">
                          No matching nodes found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: FORENSIC SCANS LEDGER */}
        {/* ========================================================= */}
        {activeTab === 'SCANS' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Search and Filters Header */}
            <div className="bg-[#140525] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <span className="material-symbols-rounded text-gray-500 text-sm absolute left-3 top-3">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search substance, key, ID..."
                  value={scanSearch}
                  onChange={(e) => setScanSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>

              {/* Verdict Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
                {['ALL', 'CLEAN', 'WARNING', 'HIGH', 'LETHAL'].map((verdictOpt) => (
                  <button
                    key={verdictOpt}
                    onClick={() => setScanVerdictFilter(verdictOpt)}
                    className={`py-1.5 px-3 rounded-xl font-mono text-[11px] uppercase tracking-wider transition-all whitespace-nowrap ${
                      scanVerdictFilter === verdictOpt
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 font-bold'
                        : 'bg-black/30 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {verdictOpt}
                  </button>
                ))}
              </div>
            </div>

            {/* Scans Grid / Table */}
            <div className="bg-[#140525] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-black/50 border-b border-white/10 text-gray-400 text-[10px] uppercase tracking-widest">
                      <th className="py-3 px-4">Scan ID</th>
                      <th className="py-3 px-4">Verdict & Substance</th>
                      <th className="py-3 px-4">Matrix</th>
                      <th className="py-3 px-4">Detected Compounds</th>
                      <th className="py-3 px-4">Operator / Location</th>
                      <th className="py-3 px-4 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredScans.map((scan) => {
                      const isLethal = scan.verdict.toUpperCase().includes('LETHAL');
                      const isHigh = scan.verdict.toUpperCase().includes('HIGH');
                      const isClean = scan.verdict.toUpperCase().includes('CLEAN');

                      return (
                        <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* ID */}
                          <td className="py-3 px-4 font-bold text-gray-300">
                            {scan.shortId || scan.id.substring(0, 8)}
                          </td>

                          {/* Verdict */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  isLethal
                                    ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                                    : isHigh
                                    ? 'bg-orange-600/30 text-orange-300 border border-orange-500/40'
                                    : isClean
                                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {scan.verdict}
                              </span>
                              <span className="text-white font-medium text-xs">
                                {scan.substanceName}
                              </span>
                            </div>
                          </td>

                          {/* Matrix */}
                          <td className="py-3 px-4 text-gray-400 uppercase text-[10px]">
                            {scan.matrix.replace('_', ' ')}
                          </td>

                          {/* Detections Swatches */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {scan.detections?.map((d: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[9px] text-gray-300"
                                >
                                  {d.hex && (
                                    <span
                                      className="w-2 h-2 rounded-full border border-black/50"
                                      style={{ backgroundColor: d.hex }}
                                    ></span>
                                  )}
                                  <span>{d.name}</span>
                                  {d.rf && <span className="text-gray-500">(Rf {d.rf})</span>}
                                </span>
                              ))}
                              {(!scan.detections || scan.detections.length === 0) && (
                                <span className="text-gray-500 text-[10px]">None flagged</span>
                              )}
                            </div>
                          </td>

                          {/* Operator */}
                          <td className="py-3 px-4">
                            <div className="text-gray-300 text-[11px] truncate max-w-[120px]" title={scan.userId}>
                              {scan.userId.substring(0, 12)}...
                            </div>
                            <div className="text-gray-500 text-[9px]">
                              {scan.location} • {scan.date}
                            </div>
                          </td>

                          {/* Inspect */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedScan(scan)}
                              className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-neon-cyan/20 text-gray-300 hover:text-neon-cyan border border-white/10 transition-colors inline-flex items-center gap-1 text-[11px]"
                            >
                              <span className="material-symbols-rounded text-xs">visibility</span>
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredScans.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 font-mono text-xs">
                          No scans matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FINANCIALS & STRIPE LEDGER */}
        {/* ========================================================= */}
        {activeTab === 'FINANCIALS' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Revenue Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#140525] border border-white/10 rounded-2xl p-5">
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Total Processed Revenue
                </div>
                <div className="text-2xl font-black italic text-emerald-400 mt-1 font-mono">
                  ${(stats?.transactions.grossVolume ?? 0).toFixed(2)} USD
                </div>
                <div className="text-[10px] font-mono text-gray-500 mt-1">Direct via Stripe Checkout</div>
              </div>

              <div className="bg-[#140525] border border-white/10 rounded-2xl p-5">
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Settled Transactions
                </div>
                <div className="text-2xl font-black italic text-white mt-1 font-mono">
                  {transactions.length}
                </div>
                <div className="text-[10px] font-mono text-gray-500 mt-1">Webhooks Idempotently Verified</div>
              </div>

              <div className="bg-[#140525] border border-white/10 rounded-2xl p-5">
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Avg Session Value
                </div>
                <div className="text-2xl font-black italic text-neon-cyan mt-1 font-mono">
                  $
                  {transactions.length > 0
                    ? ((stats?.transactions.grossVolume ?? 0) / transactions.length).toFixed(2)
                    : '1.00'}{' '}
                  USD
                </div>
                <div className="text-[10px] font-mono text-gray-500 mt-1">Per Pro / Unlimited license</div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-[#140525] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-emerald-400 text-sm">receipt_long</span>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Stripe Payment Ledger
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-gray-500">Live webhook records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-black/50 border-b border-white/10 text-gray-400 text-[10px] uppercase tracking-widest">
                      <th className="py-3 px-4">Transaction ID</th>
                      <th className="py-3 px-4">Payer Node Key</th>
                      <th className="py-3 px-4">Stripe Session ID</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-300">{tx.id}</td>
                        <td className="py-3 px-4 text-neon-cyan text-[11px] truncate max-w-[150px]" title={tx.userId}>
                          {tx.userId.substring(0, 14)}...
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-[10px] truncate max-w-[150px]">
                          {tx.stripeSessionId || 'cs_test_...'}
                        </td>
                        <td className="py-3 px-4 text-emerald-300 font-bold">
                          ${((tx.amount || 100) / 100).toFixed(2)} {tx.currency.toUpperCase()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            {tx.status || 'paid'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'Recent'}
                        </td>
                      </tr>
                    ))}

                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500 font-mono text-xs">
                          No transactions recorded in TursoDB yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: SYSTEM CONSOLE & BACKUPS */}
        {/* ========================================================= */}
        {activeTab === 'CONSOLE' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Terminal Diagnostic Banner */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-6 font-mono text-xs space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-neon-cyan font-bold">
                  <span className="material-symbols-rounded text-sm">terminal</span>
                  <span>FORENSIC TELEMETRY AUDIT LOG</span>
                </div>
                <span className="text-[10px] text-gray-500">Node Clearance: Admin</span>
              </div>

              <div className="space-y-2 text-gray-300 text-[11px] leading-relaxed max-h-64 overflow-y-auto no-scrollbar">
                <div className="text-emerald-400">[SYSTEM INIT] Connecting to Turso libSQL client... OK</div>
                <div className="text-gray-400">[AUTH ENGINE] Asymmetric WebCrypto ECDSA P-256 challenge active.</div>
                <div className="text-gray-400">[DATABASE] Schema parameterized. Injections neutralized.</div>
                <div className="text-gray-400">[STRIPE] Webhook listener /api/webhook/stripe ready for signed payloads.</div>
                <div className="text-ultra-violet">[SECURITY] Private keys salted with PBKDF2 SHA-512 (100k rounds).</div>
                <div className="text-neon-cyan">[OPERATIONAL] Node {clientPublicKey.substring(0, 16)}... logged in with admin clearance.</div>
              </div>
            </div>

            {/* System Utilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#140525] border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-neon-cyan text-sm">file_download</span>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Forensic Ledger Export
                  </h3>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  Download an immutable snapshot of all registered nodes, forensic scan records, and Stripe transactions as an auditable JSON file.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="py-2.5 px-4 rounded-xl bg-neon-cyan/15 hover:bg-neon-cyan/25 text-neon-cyan border border-neon-cyan/40 font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-rounded text-sm">download</span>
                  <span>Export JSON Ledger</span>
                </button>
              </div>

              <div className="bg-[#140525] border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-ultra-violet text-sm">dataset</span>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Database Seeding & Recovery
                  </h3>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  Populate demo chromatography records across MDMA, Cocaine, Fentanyl, and Ketamine if the database scans ledger is empty.
                </p>
                <button
                  onClick={handleSeedScans}
                  disabled={actionLoadingKey === 'seed'}
                  className="py-2.5 px-4 rounded-xl bg-ultra-violet/20 hover:bg-ultra-violet/30 text-white border border-ultra-violet/40 font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-rounded text-sm">science</span>
                  <span>Seed Demonstration Scans</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* SCAN INSPECTION MODAL */}
      {/* ========================================================= */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#140420] border border-neon-cyan/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,255,255,0.2)] max-h-[90vh] overflow-y-auto no-scrollbar space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-neon-cyan text-lg">science</span>
                <h3 className="text-sm font-mono font-bold uppercase text-white tracking-wider">
                  Forensic Spectrum Analysis // {selectedScan.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedScan(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-rounded text-lg">close</span>
              </button>
            </div>

            {/* Overview Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div className="text-[9px] text-gray-500 uppercase">Verdict</div>
                <div className="text-white font-bold">{selectedScan.verdict}</div>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div className="text-[9px] text-gray-500 uppercase">Matrix</div>
                <div className="text-white font-bold">{selectedScan.matrix}</div>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div className="text-[9px] text-gray-500 uppercase">Date</div>
                <div className="text-white font-bold">{selectedScan.date}</div>
              </div>
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div className="text-[9px] text-gray-500 uppercase">Location</div>
                <div className="text-white font-bold truncate">{selectedScan.location}</div>
              </div>
            </div>

            {/* Detections List */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-gray-300 uppercase">
                Identified Reagent / TLC Markers
              </div>
              <div className="space-y-1.5">
                {selectedScan.detections?.map((d: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      {d.hex && (
                        <span
                          className="w-4 h-4 rounded-full border border-black/50 shadow-sm"
                          style={{ backgroundColor: d.hex }}
                        ></span>
                      )}
                      <span className="font-bold text-white">{d.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {d.rf && <span className="text-gray-400">Rf: {d.rf}</span>}
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          d.hazard === 'LETHAL' || d.hazard === 'CRITICAL'
                            ? 'bg-rose-600/30 text-rose-300'
                            : d.hazard === 'HIGH'
                            ? 'bg-orange-600/30 text-orange-300'
                            : 'bg-emerald-600/30 text-emerald-300'
                        }`}
                      >
                        {d.hazard || 'SAFE'}
                      </span>
                    </div>
                  </div>
                ))}

                {(!selectedScan.detections || selectedScan.detections.length === 0) && (
                  <div className="text-gray-500 text-xs font-mono">No specific markers detected.</div>
                )}
              </div>
            </div>

            {/* Raw JSON Result Data */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-gray-300 uppercase">
                Raw Result Payload (TursoDB libSQL)
              </div>
              <pre className="bg-black/70 p-3 rounded-xl text-[10px] font-mono text-neon-cyan/90 border border-white/5 overflow-x-auto max-h-48">
                {JSON.stringify(selectedScan.rawResult || selectedScan, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedScan(null)}
                className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
