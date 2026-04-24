import { useEffect, useState } from 'react';
import axios from 'axios';

const CLASS_CONFIG = {
  INTERESTED:     { cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', icon: '✅' },
  CALL_ME:        { cls: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',   icon: '📞' },
  NOT_INTERESTED: { cls: 'bg-red-500/15 border-red-500/30 text-red-300',            icon: '🚫' },
  WRONG_NUMBER:   { cls: 'bg-orange-500/15 border-orange-500/30 text-orange-300',   icon: '❓' },
  UNKNOWN:        { cls: 'bg-slate-500/15 border-slate-500/30 text-slate-400',      icon: '💬' },
};

function ClassBadge({ label }) {
  const cfg = CLASS_CONFIG[label] || CLASS_CONFIG.UNKNOWN;
  return (
    <span className={`badge ${cfg.cls}`}>
      {cfg.icon} {label?.replace('_', ' ')}
    </span>
  );
}

export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const params = filter ? { classification: filter } : {};
      const { data } = await axios.get('/api/messages', { params });
      setMessages(data.messages || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  const FILTERS = ['', 'INTERESTED', 'CALL_ME', 'NOT_INTERESTED', 'WRONG_NUMBER', 'UNKNOWN'];

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="glass p-3 flex flex-wrap gap-2 items-center">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mr-1">Filter:</span>
        {FILTERS.map((f) => (
          <button
            key={f || 'all'}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              filter === f
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {f || 'All'} {f && CLASS_CONFIG[f]?.icon}
          </button>
        ))}
        <span className="ml-auto text-slate-600 text-xs">{total} replies</span>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="text-slate-500 py-10 text-center">Loading inbox…</div>
      ) : messages.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="text-4xl mb-3 opacity-30">💬</p>
          <p className="text-slate-500">No inbound replies yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg._id} className={`glass p-4 space-y-3 ${
              msg.classification === 'INTERESTED' || msg.classification === 'CALL_ME'
                ? 'border-emerald-500/20'
                : ''
            }`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-slate-200 font-semibold text-sm">
                    {msg.leadId?.name || msg.leadId?.phone || 'Unknown Lead'}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {msg.leadId?.phone || ''} · {msg.channel} ·{' '}
                    {new Date(msg.sentAt).toLocaleString()}
                    {msg.campaignId && ` · ${msg.campaignId.name}`}
                  </p>
                </div>
                <ClassBadge label={msg.classification} />
              </div>
              <p className="text-slate-300 text-sm bg-black/20 rounded-xl px-4 py-3 leading-relaxed">
                "{msg.body}"
              </p>
              {(msg.classification === 'INTERESTED' || msg.classification === 'CALL_ME') && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span>🔥</span>
                  <span>Lead flagged as Hot — visible in Lead Pipeline</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
