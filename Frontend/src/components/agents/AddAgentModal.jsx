import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Bot, X, Sparkles, AlertCircle, CheckCircle2, Clock, Volume2 } from 'lucide-react';

const VOICE_OPTIONS = [
  { id: 'meera', label: 'Meera (Default · Female)', tone: 'Soft & Warm' },
  { id: 'nisha', label: 'Nisha (Female)', tone: 'Expressive & Energetic' },
  { id: 'siya', label: 'Siya (Female)', tone: 'Friendly & Professional' },
  { id: 'rohan', label: 'Rohan (Male)', tone: 'Calm & Reassuring' },
  { id: 'dev', label: 'Dev (Male)', tone: 'Clear & Confident' },
  { id: 'vikram', label: 'Vikram (Male)', tone: 'Deep & Authoritative' },
];

const LANGUAGE_OPTIONS = [
  { id: 'English', label: 'English (Default)' },
  { id: 'Malayalam', label: 'Malayalam' },
  { id: 'Malayalam & English', label: 'Malayalam & English (Kerala Bilingual)' },
  { id: 'Hindi', label: 'Hindi' },
  { id: 'Tamil', label: 'Tamil' },
  { id: 'Telugu', label: 'Telugu' },
];

export function AddAgentModal({
  isOpen,
  onClose,
  onAgentSaved,
  initialAgent = null,
  agentsList = [],
  mode = 'add',
}) {
  const [availableAgents, setAvailableAgents] = useState(agentsList || []);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('English');
  const [voice, setVoice] = useState('meera');
  const [firstMessage, setFirstMessage] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [maxCall, setMaxCall] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const populateFields = (agent) => {
    if (!agent) return;
    setName(agent.name || '');
    setLanguage(agent.language || 'English');
    setVoice(agent.voice || 'meera');
    setFirstMessage(agent.first_message || '');
    setAgentPrompt(agent.agent_prompt || '');
    setMaxCall(
      agent.max_call !== null && agent.max_call !== undefined
        ? String(agent.max_call)
        : ''
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit') {
      // Fetch latest list of agents to populate the Select Agent dropdown
      apiClient
        .get('/agents')
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.agents) && res.data.agents.length > 0) {
            const list = res.data.agents;
            setAvailableAgents(list);

            // Select initial agent or active agent or the first in list
            const current =
              (initialAgent?._id && list.find((a) => a._id === initialAgent._id)) ||
              list.find((a) => a.isActive) ||
              list[0];

            if (current) {
              setSelectedAgentId(current._id);
              populateFields(current);
            }
          } else if (initialAgent) {
            setSelectedAgentId(initialAgent._id || '');
            populateFields(initialAgent);
          }
        })
        .catch(() => {
          if (agentsList && agentsList.length > 0) {
            setAvailableAgents(agentsList);
            const current =
              (initialAgent?._id && agentsList.find((a) => a._id === initialAgent._id)) ||
              agentsList[0];
            setSelectedAgentId(current._id);
            populateFields(current);
          } else if (initialAgent) {
            setSelectedAgentId(initialAgent._id || '');
            populateFields(initialAgent);
          }
        });
    } else {
      setSelectedAgentId('');
      setName('');
      setLanguage('English');
      setVoice('meera');
      setFirstMessage('');
      setAgentPrompt('');
      setMaxCall('');
    }

    setError('');
    setSuccess('');
  }, [isOpen, mode, initialAgent, agentsList]);

  if (!isOpen) return null;

  const handleSelectAgentChange = (e) => {
    const nextId = e.target.value;
    setSelectedAgentId(nextId);
    setError('');
    setSuccess('');

    const targetAgent = availableAgents.find((a) => a._id === nextId);
    if (targetAgent) {
      populateFields(targetAgent);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Agent name is required');
      return;
    }

    if (!firstMessage.trim()) {
      setError('Initial first message is required');
      return;
    }

    if (!agentPrompt.trim()) {
      setError('Agent system prompt is required');
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      language: language || 'English',
      voice: voice || 'meera',
      first_message: firstMessage.trim(),
      agent_prompt: agentPrompt.trim(),
      max_call: maxCall !== '' ? Number(maxCall) : null,
      isActive: true,
    };

    try {
      let res;
      const targetId = selectedAgentId || initialAgent?._id;
      if (mode === 'edit' && targetId) {
        res = await apiClient.put(`/agents/${targetId}`, payload);
      } else {
        res = await apiClient.post('/agents', payload);
      }

      if (res.data?.success) {
        const savedAgent = res.data.agent;
        setSuccess(
          mode === 'edit'
            ? `Agent "${payload.name}" updated successfully.`
            : `New Agent "${payload.name}" created and set active.`
        );

        if (savedAgent) {
          setAvailableAgents((prev) => {
            const idx = prev.findIndex((a) => a._id === savedAgent._id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = savedAgent;
              return copy;
            }
            return [savedAgent, ...prev];
          });
        }

        if (onAgentSaved) {
          onAgentSaved(savedAgent);
        }

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.data?.message || 'Failed to save agent details.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        'Error submitting agent form'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-3 sm:p-4 overflow-hidden font-sans">
      {/* Click backdrop to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="bg-surface rounded-[28px] md:rounded-[32px] border border-black/[0.04] dark:border-white/[0.06] shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-black/[0.04] dark:border-white/[0.06] shrink-0 bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/20 text-accent-ink font-bold flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-accent-ink" />
            </div>
            <div>
              <h2 className="font-bold text-base text-ink tracking-tight">
                {mode === 'edit' ? 'Edit AI Voice Agent' : 'Add New Voice Agent'}
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Configure telephony persona, initial greeting, and system guidelines.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-full bg-surface-muted hover:bg-black/5 dark:hover:bg-white/5 text-ink transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {/* Form Container with Scrollable Body and Fixed Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {error && (
              <div className="p-3.5 bg-status-danger-bg border border-rose-500/20 text-status-danger-ink rounded-2xl flex items-center gap-2.5 text-xs font-medium shadow-soft">
                <AlertCircle className="w-4 h-4 shrink-0 stroke-[2]" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 bg-status-success-bg border border-emerald-500/20 text-status-success-ink rounded-2xl flex items-center gap-2.5 text-xs font-medium shadow-soft">
                <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2]" />
                <span>{success}</span>
              </div>
            )}

          {/* Select Agent Field on Edit Agent Form */}
          {mode === 'edit' && (
            <div className="p-3.5 bg-surface-muted rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
              <label className="block text-[11px] font-semibold text-ink flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-accent stroke-[2]" />
                  Select Agent *
                </span>
                {availableAgents.length > 0 && (
                  <span className="text-[10px] text-accent font-medium">
                    {availableAgents.length} {availableAgents.length === 1 ? 'agent' : 'agents'} available
                  </span>
                )}
              </label>
              <select
                value={selectedAgentId}
                onChange={handleSelectAgentChange}
                className="w-full bg-surface border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-ink font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              >
                {availableAgents.length > 0 ? (
                  availableAgents.map((ag) => (
                    <option key={ag._id} value={ag._id}>
                      {ag.name} — Voice: {ag.voice || 'meera'} ({ag.language || 'English'}{ag.isActive ? ' · Active' : ''})
                    </option>
                  ))
                ) : (
                  <option value={initialAgent?._id || ''}>
                    {name || initialAgent?.name || 'Default Agent'} (Active)
                  </option>
                )}
              </select>
              <p className="text-[10px] text-ink-soft">
                Choose which voice agent persona you want to configure or update.
              </p>
            </div>
          )}

          {/* Row 1: Name & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
                Agent Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Meera, Anjali, Rohan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
                Language (Default: English) *
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Voice Selection & Max Call Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
                Voice Selection (Default: Meera) *
              </label>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} — {v.tone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1.5 flex items-center justify-between">
                <span>Max Call Time (Minutes)</span>
                <span className="text-[10px] text-ink-soft/70">Optional</span>
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 absolute left-3 top-3 text-ink-soft stroke-[1.75]" />
                <input
                  type="number"
                  min="1"
                  max="60"
                  placeholder="max calling time"
                  value={maxCall}
                  onChange={(e) => setMaxCall(e.target.value)}
                  className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-ink tabular-nums focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* First Message Greeting */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-medium text-ink-soft">
                First Message *
              </label>
              <span className="text-[10px] text-ink-soft font-mono tabular-nums">
                {firstMessage.length} / 5,000
              </span>
            </div>
            <textarea
              required
              rows={3}
              maxLength={5000}
              placeholder="Initial spoken greeting when recipient answers (max 5,000 characters). Supports {{customer_name}}."
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-3 text-xs text-ink placeholder-ink-soft/50 focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
            />
          </div>

          {/* Agent Prompt Instructions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-medium text-ink-soft">
                Agent Prompt *
              </label>
              <span className="text-[10px] text-ink-soft font-mono tabular-nums">
                {agentPrompt.length} / 45,000
              </span>
            </div>
            <textarea
              required
              rows={6}
              maxLength={45000}
              placeholder="Full system instructions, prompt guidelines, objection handling, and pricing tables (up to 45,000 characters)."
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-3 text-xs text-ink placeholder-ink-soft/50 focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed font-sans"
            />
          </div>

          {/* Telephony Engine Pill Badge */}
          <div className="p-3 bg-surface-muted rounded-2xl border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-ink">
              <Volume2 className="w-4 h-4 text-accent stroke-[2]" />
              <span>
                Selected Voice: <strong className="capitalize">{voice}</strong> ·{' '}
                <span className="text-ink-soft">
                  {VOICE_OPTIONS.find((v) => v.id === voice)?.tone || 'Neural Voice'}
                </span>
              </span>
            </div>
            <span className="text-ink-soft text-[10px] font-medium">Supports Vistara AI Telephony</span>
          </div>
        </div>

        {/* Fixed Footer Actions */}
        <div className="px-6 py-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-end gap-2.5 shrink-0 bg-surface">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-pill text-xs font-semibold text-ink-soft hover:text-ink hover:bg-surface-muted transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim() || !firstMessage.trim() || !agentPrompt.trim()}
            className="px-6 py-2.5 rounded-pill text-xs font-semibold bg-accent text-accent-ink shadow-soft hover:brightness-105 active:scale-[0.98] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />
                <span>Submitting to API...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 stroke-[2]" />
                <span>{mode === 'edit' ? 'Update Agent' : 'Create & Activate Agent'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
);
}

