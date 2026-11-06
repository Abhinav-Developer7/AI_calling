import React, { useState } from 'react';
import { X, RotateCcw, XCircle, Ban } from 'lucide-react';
import { apiClient } from '../../../api/client';

export function CallingActionModals({ activeModal, process, onClose, onSuccess }) {
  const [actionReason, setActionReason] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  if (!activeModal || !process) return null;

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await apiClient.post(`/feedback-processes/${process._id}/cancel`, {
        reason: actionReason || 'Cancelled by staff',
      });
      if (res.data?.success) {
        onSuccess('Call process cancelled.');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel call.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleTime) return;
    setActionLoading(true);
    setError('');
    try {
      const res = await apiClient.post(`/feedback-processes/${process._id}/reschedule`, {
        scheduledTime: new Date(rescheduleTime).toISOString(),
      });
      if (res.data?.success) {
        onSuccess('Call process rescheduled.');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reschedule call.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOptOutSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await apiClient.post(`/feedback-processes/${process._id}/do-not-call`, {
        reason: actionReason || 'Customer requested Do-Not-Call',
      });
      if (res.data?.success) {
        onSuccess('Customer marked in Do-Not-Call suppression registry.');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record opt-out.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 font-sans">
      <div className="bg-surface rounded-[24px] border border-black/[0.04] dark:border-white/[0.06] p-6 w-full max-w-sm space-y-4 shadow-2xl text-xs">
        <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
          <h3 className="font-semibold text-ink text-sm flex items-center gap-2">
            {activeModal === 'reschedule' && <RotateCcw className="w-4 h-4 text-ink-soft" />}
            {activeModal === 'cancel' && <XCircle className="w-4 h-4 text-status-danger-ink" />}
            {activeModal === 'optout' && <Ban className="w-4 h-4 text-purple-600" />}
            <span>
              {activeModal === 'reschedule' && 'Reschedule Call'}
              {activeModal === 'cancel' && 'Cancel Call'}
              {activeModal === 'optout' && 'Do-Not-Call Suppression'}
            </span>
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full bg-surface-muted hover:bg-black/5 dark:hover:bg-white/5 text-ink transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-ink-soft text-xs leading-relaxed">
          {process.purchase?.customerName} — Invoice #{process.purchase?.invoiceNumber}
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-status-danger-bg text-status-danger-ink text-xs font-medium">
            {error}
          </div>
        )}

        {activeModal === 'reschedule' && (
          <form onSubmit={handleRescheduleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1">
                New Date & Time (IST) *
              </label>
              <input
                type="datetime-local"
                required
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
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
                {actionLoading ? 'Saving...' : 'Confirm Reschedule'}
              </button>
            </div>
          </form>
        )}

        {activeModal === 'cancel' && (
          <form onSubmit={handleCancelSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1">Cancellation Reason</label>
              <input
                type="text"
                placeholder="e.g. Customer requested cancellation"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-pill text-xs font-semibold text-ink-soft hover:text-ink hover:bg-surface-muted transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-pill text-xs font-semibold bg-status-danger-bg text-status-danger-ink border border-rose-500/20 shadow-soft hover:brightness-105 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </form>
        )}

        {activeModal === 'optout' && (
          <form onSubmit={handleOptOutSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1">Opt-out Reason</label>
              <input
                type="text"
                placeholder="e.g. Customer declined calling consent"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-xl p-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-pill text-xs font-semibold text-ink-soft hover:text-ink hover:bg-surface-muted transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-pill text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-soft active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Confirm DND'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
