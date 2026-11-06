import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Copy, Check, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [settings, setSettings] = useState({
    storeName: 'Aurum Jewellery',
    brandDisplayName: 'Aurum Jewellery',
    branchName: 'Ernakulam Flagship Store',
    callingHoursStart: '10:00',
    callingHoursEnd: '20:00',
    timezone: 'Asia/Kolkata',
    retentionDays: 90,
  });

  const webhookUrl = `${window.location.origin}/api/v1/webhooks/vistara`;

  useEffect(() => {
    setLoading(true);
    apiClient
      .get('/settings')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setSettings(res.data.data);
        }
      })
      .catch(() => {
        setErrorMsg('Failed to load store settings.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await apiClient.put('/settings', settings);
      if (res.data?.success) {
        setSuccessMsg('Store settings saved successfully.');
        setSettings(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans pb-10">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Settings & Configuration</h1>
        <p className="text-xs text-ink-soft mt-0.5">
          Store profile, TRAI calling window, telephony webhooks, and retention policy.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-status-success-bg border border-emerald-500/20 text-status-success-ink rounded-2xl text-xs flex items-center gap-2.5 shadow-soft">
          <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2]" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-status-danger-bg border border-rose-500/20 text-status-danger-ink rounded-2xl text-xs flex items-center gap-2.5 shadow-soft">
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[2]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Store Profile & Calling Hours Form */}
      <form onSubmit={handleSave} className="bg-surface rounded-[24px] shadow-soft border border-black/[0.04] dark:border-white/[0.06] p-6 space-y-6 text-xs">
        <div className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-ink uppercase tracking-wider">
              Store Profile & Calling Hours
            </h2>
            <p className="text-[11px] text-ink-soft mt-0.5">
              Source of truth for store branding and legal outbound calling times.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-accent text-accent-ink font-semibold rounded-pill text-xs shadow-soft hover:brightness-105 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 stroke-[2]" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
              Store Legal Name *
            </label>
            <input
              type="text"
              required
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
              Brand Display Name (Spoken by AI Voice Agent) *
            </label>
            <input
              type="text"
              required
              value={settings.brandDisplayName}
              onChange={(e) => setSettings({ ...settings, brandDisplayName: e.target.value })}
              className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
              Showroom Branch Reference *
            </label>
            <input
              type="text"
              required
              value={settings.branchName}
              onChange={(e) => setSettings({ ...settings, branchName: e.target.value })}
              className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
              Timezone
            </label>
            <input
              type="text"
              readOnly
              value={settings.timezone}
              className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-ink-soft opacity-70"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
              Calling Window Start (IST) *
            </label>
            <input
              type="time"
              required
              value={settings.callingHoursStart}
              onChange={(e) => setSettings({ ...settings, callingHoursStart: e.target.value })}
              className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <span className="text-[10px] text-ink-soft mt-1 block">TRAI permissible start time</span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
              Calling Window End (IST) *
            </label>
            <input
              type="time"
              required
              value={settings.callingHoursEnd}
              onChange={(e) => setSettings({ ...settings, callingHoursEnd: e.target.value })}
              className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <span className="text-[10px] text-ink-soft mt-1 block">TRAI permissible end time (20:00)</span>
          </div>
        </div>
      </form>

      {/* Telephony & Webhook Endpoints */}
      <div className="bg-surface rounded-[24px] shadow-soft border border-black/[0.04] dark:border-white/[0.06] p-6 space-y-4 text-xs">
        <div>
          <h2 className="text-xs font-semibold text-ink uppercase tracking-wider mb-1">
            Inbound Telephony Webhook Endpoint
          </h2>
          <p className="text-xs text-ink-soft">
            Configure this URL in the Vistara AI or Retell dashboard to receive call completion webhooks and transcripts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2.5 font-mono text-[11px] text-ink"
          />
          <button
            type="button"
            onClick={handleCopyWebhook}
            className="px-5 py-2.5 bg-surface hover:bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-pill text-ink font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-soft"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-status-success-ink" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
