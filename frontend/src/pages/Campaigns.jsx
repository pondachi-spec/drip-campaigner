import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CampaignBuilder from '../components/CampaignBuilder';

const STATUS_CFG = {
  active: { cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', label: 'Active' },
  paused: { cls: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300', label: 'Paused' },
  draft:  { cls: 'bg-slate-500/10 border-slate-500/30 text-slate-400', label: 'Draft' },
};

function CampaignCard({ campaign, onEdit, onDelete, onToggle }) {
  const cfg = STATUS_CFG[campaign.status] || STATUS_CFG.draft;
  return (
    <div className="glass p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-100">{campaign.name}</h3>
          {campaign.description && <p className="text-slate-500 text-xs mt-0.5">{campaign.description}</p>}
        </div>
        <span className={`badge ${cfg.cls} shrink-0`}>{cfg.label}</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {[
          { label: 'Steps', val: campaign.steps?.length },
          { label: 'Enrolled', val: campaign.stats?.enrolled },
          { label: 'Sent', val: campaign.stats?.sent },
          { label: 'Hot', val: campaign.stats?.hot },
        ].map(({ label, val }) => (
          <div key={label} className="glass-dark p-2 rounded-xl">
            <p className="text-slate-200 font-bold">{val ?? 0}</p>
            <p className="text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Steps preview */}
      <div className="space-y-1">
        {(campaign.steps || []).slice(0, 3).map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step.channel === 'SMS' ? 'bg-blue-500/20 text-blue-300' : 'bg-violet-500/20 text-violet-300'
            }`}>{i + 1}</span>
            <span>{step.channel}</span>
            <span>·</span>
            <span>Wait {step.delayValue} {step.delayUnit}</span>
            {step.sendOnlyIfNoReply && <span className="text-slate-600">· if no reply</span>}
          </div>
        ))}
        {campaign.steps?.length > 3 && (
          <p className="text-slate-600 text-xs pl-7">+{campaign.steps.length - 3} more steps</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onToggle(campaign)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
            campaign.status === 'active'
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
          }`}>
          {campaign.status === 'active' ? '⏸ Pause' : '▶ Activate'}
        </button>
        <button onClick={() => onEdit(campaign)} className="btn-ghost text-xs">✏ Edit</button>
        <button onClick={() => onDelete(campaign._id)} className="btn-danger text-xs">🗑 Delete</button>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/campaigns');
      setCampaigns(data);
    } catch { toast.error('Failed to load campaigns'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this campaign and all its enrollments?')) return;
    try {
      await axios.delete(`/api/campaigns/${id}`);
      toast.success('Campaign deleted');
      load();
    } catch { toast.error('Delete failed'); }
  }

  async function handleToggle(c) {
    const next = c.status === 'active' ? 'paused' : 'active';
    try {
      await axios.patch(`/api/campaigns/${c._id}/status`, { status: next });
      setCampaigns((prev) => prev.map((x) => x._id === c._id ? { ...x, status: next } : x));
    } catch { toast.error('Status change failed'); }
  }

  function handleEdit(c) {
    setEditing(c);
    setShowBuilder(true);
  }

  function handleNew() {
    setEditing(null);
    setShowBuilder(true);
  }

  async function handleSave(data) {
    try {
      if (editing) {
        await axios.put(`/api/campaigns/${editing._id}`, data);
        toast.success('Campaign updated');
      } else {
        await axios.post('/api/campaigns', data);
        toast.success('Campaign created');
      }
      setShowBuilder(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">{campaigns.length} campaigns</p>
        <button onClick={handleNew} className="btn-primary text-sm">+ New Campaign</button>
      </div>

      {loading ? (
        <div className="text-slate-500 py-10 text-center">Loading…</div>
      ) : campaigns.length === 0 ? (
        <div className="glass p-12 text-center space-y-3">
          <p className="text-4xl opacity-30">📣</p>
          <p className="text-slate-500">No campaigns yet.</p>
          <button onClick={handleNew} className="btn-primary text-sm">Create your first campaign</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <CampaignCard key={c._id} campaign={c} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </div>
      )}

      {showBuilder && (
        <CampaignBuilder
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowBuilder(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
