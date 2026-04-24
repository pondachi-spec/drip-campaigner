import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const STATUSES = ['New', 'Contacted', 'Replied', 'Hot', 'Closed'];

const STATUS_COLORS = {
  New:       'bg-slate-500/10 border-slate-500/30 text-slate-300',
  Contacted: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  Replied:   'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
  Hot:       'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  Closed:    'bg-slate-700/10 border-slate-700/30 text-slate-500',
};

function LeadCard({ lead, onSendAlisha, onStatusChange }) {
  const [sending, setSending] = useState(false);

  async function handleAlisha() {
    setSending(true);
    try {
      await onSendAlisha(lead._id);
      toast.success('Sent to Alisha!');
    } catch { toast.error('Failed to send to Alisha'); }
    finally { setSending(false); }
  }

  return (
    <div className={`glass-dark p-3 space-y-2 ${lead.isHotFlagged ? 'border border-emerald-500/20' : ''}`}>
      {lead.isHotFlagged && <span className="text-xs text-emerald-400">🔥 Hot</span>}
      <p className="text-slate-200 font-medium text-sm leading-tight">{lead.name}</p>
      {lead.phone && <p className="text-slate-500 text-xs">{lead.phone}</p>}
      {lead.address && <p className="text-slate-600 text-xs truncate">{lead.address}</p>}
      <p className="text-slate-600 text-xs capitalize">{lead.source}</p>

      <select
        value={lead.status}
        onChange={(e) => onStatusChange(lead._id, e.target.value)}
        className="w-full text-xs bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {(lead.status === 'Hot' || lead.isHotFlagged) && (
        <button onClick={handleAlisha} disabled={sending}
          className="w-full text-xs py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 transition-all disabled:opacity-40">
          {sending ? '…' : '→ Send to Alisha'}
        </button>
      )}
    </div>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importingAlisha, setImportingAlisha] = useState(false);
  const fileRef = useRef();

  async function load() {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/leads');
      setLeads(data);
    } catch { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await axios.post('/api/leads/import/csv', form);
      toast.success(`Imported ${data.imported} leads (${data.skipped} skipped)`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'CSV import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  async function handleAlishaImport() {
    setImportingAlisha(true);
    try {
      const { data } = await axios.post('/api/leads/import/alisha');
      toast.success(`Imported ${data.imported} qualified leads from Alisha`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not reach Alisha');
    } finally { setImportingAlisha(false); }
  }

  async function handleSendAlisha(id) {
    await axios.post(`/api/leads/${id}/alisha`);
  }

  async function handleStatusChange(id, status) {
    try {
      await axios.put(`/api/leads/${id}`, { status });
      setLeads((prev) => prev.map((l) => l._id === id ? { ...l, status } : l));
    } catch { toast.error('Status update failed'); }
  }

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Import bar */}
      <div className="glass p-4 flex flex-wrap gap-3 items-center">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mr-2">Import Leads</h2>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
        <button onClick={() => fileRef.current?.click()} disabled={importing} className="btn-ghost text-sm">
          {importing ? 'Importing…' : '📁 Upload CSV'}
        </button>
        <button onClick={handleAlishaImport} disabled={importingAlisha} className="btn-ghost text-sm">
          {importingAlisha ? 'Importing…' : '⚡ Import from Alisha'}
        </button>
        <span className="ml-auto text-slate-600 text-xs">{leads.length} total leads</span>
      </div>

      {/* Pipeline board */}
      {loading ? (
        <div className="text-slate-500 py-10 text-center">Loading leads…</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {STATUSES.map((status) => (
            <div key={status} className="glass p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`badge ${STATUS_COLORS[status]}`}>{status}</span>
                <span className="text-slate-500 text-xs font-bold">{byStatus[status].length}</span>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {byStatus[status].length === 0 && (
                  <p className="text-slate-700 text-xs text-center py-4">Empty</p>
                )}
                {byStatus[status].map((lead) => (
                  <LeadCard
                    key={lead._id}
                    lead={lead}
                    onSendAlisha={handleSendAlisha}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
