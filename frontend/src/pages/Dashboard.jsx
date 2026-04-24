import { useEffect, useState } from 'react';
import axios from 'axios';

function StatCard({ icon, label, value, sub, color = 'text-slate-100' }) {
  return (
    <div className="glass p-5 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{icon} {label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-slate-500 text-xs">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [leadStats, setLeadStats] = useState(null);
  const [msgStats, setMsgStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/leads/stats'),
      axios.get('/api/messages/stats'),
      axios.get('/api/campaigns'),
    ]).then(([ls, ms, cs]) => {
      setLeadStats(ls.data);
      setMsgStats(ms.data);
      setCampaigns(cs.data.slice(0, 5));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500 py-10 text-center">Loading…</div>;

  const hot = leadStats?.pipeline?.find((p) => p.status === 'Hot')?.count || 0;
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total Leads" value={leadStats?.total} />
        <StatCard icon="📣" label="Active Campaigns" value={activeCampaigns} color="text-indigo-300" />
        <StatCard icon="🔥" label="Hot Leads" value={hot} color="text-emerald-300" sub="INTERESTED or CALL_ME" />
        <StatCard icon="💬" label="Inbound Replies" value={msgStats?.total} color="text-violet-300" sub={`${msgStats?.interested || 0} interested`} />
      </div>

      {/* Pipeline */}
      <div className="glass p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Lead Pipeline</h2>
        <div className="grid grid-cols-5 gap-3">
          {(leadStats?.pipeline || []).map(({ status, count }) => {
            const colors = {
              New: 'text-slate-300 border-slate-500/30 bg-slate-500/10',
              Contacted: 'text-blue-300 border-blue-500/30 bg-blue-500/10',
              Replied: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10',
              Hot: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
              Closed: 'text-slate-500 border-slate-700/30 bg-slate-700/10',
            };
            return (
              <div key={status} className={`glass-dark p-4 text-center border ${colors[status]}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-medium mt-1">{status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reply breakdown */}
      <div className="glass p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Reply Classifications</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Interested', val: msgStats?.interested, cls: 'text-emerald-300' },
            { label: 'Call Me', val: msgStats?.callMe, cls: 'text-indigo-300' },
            { label: 'Not Interested', val: msgStats?.notInterested, cls: 'text-red-300' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="glass-dark p-4 text-center">
              <p className={`text-2xl font-bold ${cls}`}>{val ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign list snapshot */}
      {campaigns.length > 0 && (
        <div className="glass p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Recent Campaigns</h2>
          <div className="space-y-2">
            {campaigns.map((c) => (
              <div key={c._id} className="glass-dark p-3 flex items-center justify-between">
                <div>
                  <p className="text-slate-200 font-medium text-sm">{c.name}</p>
                  <p className="text-slate-500 text-xs">{c.steps?.length} steps · {c.stats?.enrolled} enrolled</p>
                </div>
                <span className={`badge ${
                  c.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                  c.status === 'paused' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                  'bg-slate-500/10 border-slate-500/30 text-slate-400'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
