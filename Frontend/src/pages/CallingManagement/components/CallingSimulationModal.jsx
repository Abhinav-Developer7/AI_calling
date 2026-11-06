import React, { useState } from 'react';
import { Bot, ThumbsUp, ThumbsDown, PhoneOff, X } from 'lucide-react';
import { apiClient } from '../../../api/client';

export function CallingSimulationModal({ isOpen, process, onClose, onSuccess }) {
  const [simOutcome, setSimOutcome] = useState('5_stars');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !process) return null;

  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      let payload = { processId: process._id };

      if (simOutcome === '5_stars') {
        payload = {
          ...payload,
          eventType: 'completed',
          rating: 5,
          sentiment: 'positive',
          feedbackText: 'Loved the gold necklace collection and the staff hospitality was wonderful.',
        };
      } else if (simOutcome === '2_stars') {
        payload = {
          ...payload,
          eventType: 'completed',
          rating: 2,
          sentiment: 'negative',
          complaint: true,
          feedbackText: 'Billing took more than 30 minutes. The waiting area was crowded.',
        };
      } else if (simOutcome === 'no_answer') {
        payload = { ...payload, eventType: 'no_answer' };
      } else if (simOutcome === 'busy') {
        payload = { ...payload, eventType: 'busy' };
      } else if (simOutcome === 'opt_out') {
        payload = {
          ...payload,
          eventType: 'completed',
          optOut: true,
          feedbackText: 'Customer requested not to receive feedback calls again.',
        };
      }

      const res = await apiClient.post('/webhooks/simulate', payload);
      if (res.data?.success) {
        onSuccess(`Simulated call outcome processed: ${res.data.result?.callStatus || 'completed'}`);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to simulate webhook outcome.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 font-sans">
      <div className="bg-surface rounded-[24px] border border-black/[0.04] dark:border-white/[0.06] p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
          <h3 className="font-semibold text-ink text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-ink-soft stroke-[1.75]" />
            <span>Simulate Call Outcome</span>
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full bg-surface-muted hover:bg-black/5 dark:hover:bg-white/5 text-ink transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-ink-soft">
          Select an outcome to test sentiment extraction, retry scheduling, or complaint escalation.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-status-danger-bg text-status-danger-ink text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSimulateSubmit} className="space-y-3 text-xs">
          <div className="space-y-2">
            {[
              {
                id: '5_stars',
                title: '5 Stars — Positive Experience',
                desc: 'Customer satisfied. Generates positive sentiment.',
                icon: ThumbsUp,
                color: 'text-emerald-600',
              },
              {
                id: '2_stars',
                title: '2 Stars — Flagged Complaint',
                desc: 'Customer dissatisfied. Creates escalation ticket.',
                icon: ThumbsDown,
                color: 'text-rose-600',
              },
              {
                id: 'no_answer',
                title: 'No Answer — Schedules 30m Retry',
                desc: 'Phone rang with no answer. Triggers retry #2.',
                icon: PhoneOff,
                color: 'text-amber-600',
              },
              {
                id: 'opt_out',
                title: 'Customer Opted Out (DND)',
                desc: 'Customer requested suppression. Stops all calls.',
                icon: X,
                color: 'text-purple-600',
              },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = simOutcome === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3.5 rounded-[16px] border cursor-pointer transition ${
                    isSelected
                      ? 'bg-accent/10 border-accent/60 text-ink shadow-sm'
                      : 'bg-surface-elevated border-black/[0.04] dark:border-white/[0.06] text-ink-soft hover:text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="simOutcome"
                    value={opt.id}
                    checked={isSelected}
                    onChange={() => setSimOutcome(opt.id)}
                    className="mt-0.5 accent-ink"
                  />
                  <div>
                    <span className="font-semibold text-xs flex items-center gap-1.5 text-ink">
                      <Icon className={`w-3.5 h-3.5 ${opt.color}`} />
                      <span>{opt.title}</span>
                    </span>
                    <p className="text-[11px] text-ink-soft mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-pill text-xs font-semibold text-ink-soft hover:text-ink hover:bg-surface-muted transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-pill text-xs font-semibold bg-accent text-accent-ink shadow-soft hover:brightness-105 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? 'Simulating...' : 'Submit Simulation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
