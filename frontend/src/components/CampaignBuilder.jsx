import { useState } from 'react';

const TEMPLATE_VARS = ['{name}', '{address}', '{city}', '{investor_name}'];

const EMPTY_STEP = {
  order: 0,
  channel: 'SMS',
  delayValue: 1,
  delayUnit: 'days',
  subject: '',
  body: '',
  sendOnlyIfNoReply: true,
};

function StepEditor({ step, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  function set(key, val) {
    onChange(index, { ...step, [key]: val });
  }

  function insertVar(v) {
    set('body', (step.body || '') + v);
  }

  return (
    <div className="glass-dark p-4 space-y-3 relative">
      {/* Step header */}
      <div className="flex items-center justify-between">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          step.channel === 'SMS' ? 'bg-blue-500/20 text-blue-300' : 'bg-violet-500/20 text-violet-300'
        }`}>{index + 1}</span>
        <div className="flex items-center gap-1">
          {!isFirst && <button onClick={onMoveUp} className="text-slate-500 hover:text-slate-300 px-1">↑</button>}
          {!isLast && <button onClick={onMoveDown} className="text-slate-500 hover:text-slate-300 px-1">↓</button>}
          <button onClick={onRemove} className="text-red-400/60 hover:text-red-400 px-1 ml-1">✕</button>
        </div>
      </div>

      {/* Channel + Delay */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Channel</label>
          <select className="select-field text-sm" value={step.channel} onChange={(e) => set('channel', e.target.value)}>
            <option value="SMS">📱 SMS</option>
            <option value="Email">✉ Email</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Wait</label>
          <input type="number" min="0" className="input-field text-sm" value={step.delayValue}
            onChange={(e) => set('delayValue', Number(e.target.value))} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Unit</label>
          <select className="select-field text-sm" value={step.delayUnit} onChange={(e) => set('delayUnit', e.target.value)}>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
      </div>

      {/* Email subject */}
      {step.channel === 'Email' && (
        <div>
          <label className="text-xs text-slate-500 block mb-1">Subject Line</label>
          <input className="input-field text-sm" placeholder="Investment offer for {address}" value={step.subject}
            onChange={(e) => set('subject', e.target.value)} />
        </div>
      )}

      {/* Body */}
      <div>
        <label className="text-xs text-slate-500 block mb-1">Message Body</label>
        <textarea
          className="input-field text-sm resize-none"
          rows={4}
          placeholder={step.channel === 'SMS'
            ? 'Hi {name}, I\'m interested in buying your property at {address}. Is it available?'
            : 'Dear {name},\n\nI saw your property at {address} and would love to make an offer…'}
          value={step.body}
          onChange={(e) => set('body', e.target.value)}
        />
        {/* Variable chips */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {TEMPLATE_VARS.map((v) => (
            <button key={v} type="button" onClick={() => insertVar(v)}
              className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all font-mono">
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional logic */}
      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-400">
        <input type="checkbox" className="accent-indigo-500 w-4 h-4" checked={step.sendOnlyIfNoReply}
          onChange={(e) => set('sendOnlyIfNoReply', e.target.checked)} />
        Send only if no reply received
      </label>
    </div>
  );
}

export default function CampaignBuilder({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [steps, setSteps] = useState(
    initial?.steps?.length
      ? initial.steps
      : [{ ...EMPTY_STEP }]
  );
  const [saving, setSaving] = useState(false);

  function addStep() {
    setSteps((prev) => [...prev, { ...EMPTY_STEP, order: prev.length }]);
  }

  function updateStep(i, updated) {
    setSteps((prev) => prev.map((s, idx) => idx === i ? updated : s));
  }

  function removeStep(i) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx })));
  }

  function moveStep(i, dir) {
    setSteps((prev) => {
      const next = [...prev];
      const target = i + dir;
      if (target < 0 || target >= next.length) return next;
      [next[i], next[target]] = [next[target], next[i]];
      return next.map((s, idx) => ({ ...s, order: idx }));
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!steps.length) return;
    setSaving(true);
    try {
      await onSave({ name, description, steps });
    } finally { setSaving(false); }
  }

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="relative z-10 w-full max-w-xl h-screen bg-[#0d0d20] border-l border-white/10 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold text-slate-100">{initial ? 'Edit Campaign' : 'New Campaign'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-xl leading-none">✕</button>
        </div>

        {/* Scrollable form */}
        <form id="cb-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Campaign Name *</label>
            <input className="input-field" placeholder="Motivated Seller Outreach" value={name}
              onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Description</label>
            <input className="input-field" placeholder="30-day SMS + email sequence for distressed owners" value={description}
              onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-400">Steps ({steps.length})</h3>
              <button type="button" onClick={addStep} className="btn-ghost text-xs">+ Add Step</button>
            </div>

            {steps.map((step, i) => (
              <StepEditor
                key={i}
                step={step}
                index={i}
                onChange={updateStep}
                onRemove={() => removeStep(i)}
                onMoveUp={() => moveStep(i, -1)}
                onMoveDown={() => moveStep(i, 1)}
                isFirst={i === 0}
                isLast={i === steps.length - 1}
              />
            ))}

            {steps.length === 0 && (
              <p className="text-slate-600 text-sm text-center py-4">Add at least one step.</p>
            )}
          </div>

          {/* Template variable reference */}
          <div className="glass p-4 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-400">Template Variables</p>
            <div className="grid grid-cols-2 gap-1 font-mono">
              {[
                ['{name}', 'Lead\'s name'],
                ['{address}', 'Property address'],
                ['{city}', 'City'],
                ['{investor_name}', 'Your name (env: INVESTOR_NAME)'],
              ].map(([v, d]) => (
                <div key={v} className="flex gap-2">
                  <span className="text-indigo-400">{v}</span>
                  <span className="text-slate-600">→ {d}</span>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 flex gap-3">
          <button type="submit" form="cb-form" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : (initial ? 'Update Campaign' : 'Create Campaign')}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  );
}
