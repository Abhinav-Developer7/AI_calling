import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Bot,
  UserPlus,
  Edit3,
} from 'lucide-react';
import { AddAgentModal } from '../../components/agents/AddAgentModal';

export function SettingsPage() {
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
    aiAgentName: 'Meera',
    aiVoiceLanguage: 'English',
    aiAgentTone: 'Voice: meera',
    aiAgentGreeting: 'Namaskaram! This is Meera from Aurum Jewellery regarding your recent jewellery purchase.',
  });

  // Dedicated Agent Modal State
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentModalMode, setAgentModalMode] = useState('add');
  const [currentAgent, setCurrentAgent] = useState(null);
  const [agentsList, setAgentsList] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      apiClient.get('/settings'),
      apiClient.get('/agents'),
    ])
      .then(([settingsRes, agentsRes]) => {
        if (
          settingsRes.status === 'fulfilled' &&
          settingsRes.value.data?.success &&
          settingsRes.value.data.data
        ) {
          setSettings((prev) => ({
            ...prev,
            ...settingsRes.value.data.data,
          }));
        }

        if (
          agentsRes.status === 'fulfilled' &&
          agentsRes.value.data?.success &&
          Array.isArray(agentsRes.value.data.agents) &&
          agentsRes.value.data.agents.length > 0
        ) {
          const agents = agentsRes.value.data.agents;
          setAgentsList(agents);
          const active = agents.find((a) => a.isActive) || agents[0];
          setCurrentAgent(active);
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
        setSettings((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddAgent = () => {
    setAgentModalMode('add');
    setIsAgentModalOpen(true);
  };

  const handleOpenEditAgent = () => {
    setAgentModalMode('edit');
    setIsAgentModalOpen(true);
  };

  const handleAgentSaved = (savedAgent) => {
    setCurrentAgent(savedAgent);
    if (savedAgent) {
      setAgentsList((prev) => {
        const idx = prev.findIndex((a) => a._id === savedAgent._id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = savedAgent;
          return copy;
        }
        return [savedAgent, ...prev];
      });
    }
    setSettings((prev) => ({
      ...prev,
      aiAgentName: savedAgent.name,
      aiVoiceLanguage: savedAgent.language,
      aiAgentGreeting: savedAgent.first_message,
      aiAgentTone: `Voice: ${savedAgent.voice}`,
    }));
    setSuccessMsg(
      agentModalMode === 'add'
        ? `New Voice Agent "${savedAgent.name}" created and set as active caller.`
        : `Voice Agent "${savedAgent.name}" configuration updated successfully.`
    );
  };

  const agentForEditing = currentAgent || {
    name: settings.aiAgentName || 'Meera',
    language: settings.aiVoiceLanguage || 'English',
    voice: 'meera',
    first_message:
      settings.aiAgentGreeting ||
      `Namaskaram! This is ${settings.aiAgentName || 'Meera'} from ${settings.brandDisplayName || 'Aurum Jewellery'} regarding your recent jewellery purchase.`,
    agent_prompt:
      'You are an AI customer feedback assistant for Aurum Jewellery. Confirm if the customer has 1 minute, ask for rating 1 to 5, collect comments, and thank them warmly.',
    max_call: 5,
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
      <form
        onSubmit={handleSave}
        className="bg-surface rounded-[24px] shadow-soft border border-black/[0.04] dark:border-white/[0.06] p-6 space-y-6 text-xs"
      >
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

        {/* Bottom of Store Profile Div: AI Agent Controls (Add Agent & Edit Agent) */}
        <div className="pt-5 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/20 text-accent-ink font-bold flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-accent-ink" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink text-sm">
                  {currentAgent?.name || settings.aiAgentName || 'Meera'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[10px] font-semibold bg-status-success-bg text-status-success-ink">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Active Voice Agent
                </span>
              </div>
              <p className="text-[11px] text-ink-soft mt-0.5">
                Voice: <span className="capitalize">{currentAgent?.voice || 'Meera'}</span> · Language: {currentAgent?.language || settings.aiVoiceLanguage || 'English'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Button 1: Add Agent */}
            <button
              type="button"
              onClick={handleOpenAddAgent}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface hover:bg-surface-muted border border-black/[0.08] dark:border-white/[0.1] text-ink font-semibold rounded-pill text-xs shadow-soft transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2] text-ink-soft" />
              <span>Add Agent</span>
            </button>

            {/* Button 2: Edit Agent */}
            <button
              type="button"
              onClick={handleOpenEditAgent}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-accent-ink font-semibold rounded-pill text-xs shadow-soft transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Edit Agent</span>
            </button>
          </div>
        </div>
      </form>

      {/* Dedicated Separate Agent Adding & Editing Form Modal */}
      <AddAgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        mode={agentModalMode}
        initialAgent={agentForEditing}
        agentsList={agentsList}
        onAgentSaved={handleAgentSaved}
      />
    </div>
  );
}
