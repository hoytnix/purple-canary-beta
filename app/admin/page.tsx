'use client';

import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboard').then((mod) => mod.AdminDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0d0214] text-neon-cyan font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
          <span>INITIALIZING ROOT FORENSIC CONSOLE...</span>
        </div>
      </div>
    ),
  }
);

export default function AdminPage() {
  return <AdminDashboard />;
}
