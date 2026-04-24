import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Leads from './pages/Leads';
import Inbox from './pages/Inbox';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'campaigns', label: 'Campaigns', icon: '📣' },
  { id: 'leads', label: 'Leads', icon: '👥' },
  { id: 'inbox', label: 'Inbox', icon: '💬' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#080818] relative overflow-x-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-32 w-96 h-96 bg-indigo-900/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-violet-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl">
              📨
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-violet-300 to-slate-200 bg-clip-text text-transparent">
                Automated Drip Campaigner
              </h1>
              <p className="text-slate-500 text-xs">SMS + Email sequences · AI reply classification · node-cron scheduler</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="glass p-1.5 flex gap-1 w-fit rounded-2xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-btn flex items-center gap-2 ${tab === t.id ? 'tab-active' : 'tab-inactive'}`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Page content */}
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'campaigns' && <Campaigns />}
        {tab === 'leads' && <Leads />}
        {tab === 'inbox' && <Inbox />}
      </div>
    </div>
  );
}
