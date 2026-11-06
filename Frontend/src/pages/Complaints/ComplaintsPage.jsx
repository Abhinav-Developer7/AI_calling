import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { formatDateTimeIST } from '../../utils/date';
import { maskPhoneNumber } from '../../utils/phone';
import { Drawer } from '../../components/ui/Drawer';
import { StatusPill } from '../../components/ui/StatusPill';
import {
  RefreshCw,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';

export function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [revealedPhones, setRevealedPhones] = useState({});

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/complaints', {
        params: { status: statusFilter === 'all' ? undefined : statusFilter },
      });
      if (res.data?.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/complaints/${selectedComplaint._id}/resolve`, {
        resolutionNotes,
      });
      if (res.data?.success) {
        setSuccessMsg('Complaint marked as resolved.');
        setSelectedComplaint(null);
        setResolutionNotes('');
        fetchComplaints();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resolve complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      {/* Topbar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Customer Complaints</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Dissatisfaction flags (ratings ≤ 2 or reported issues) requiring showroom follow-up.
          </p>
        </div>
        <button
          onClick={fetchComplaints}
          disabled={loading}
          aria-label="Refresh complaints"
          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-muted text-ink font-semibold rounded-pill text-xs shadow-soft transition cursor-pointer border border-black/[0.04] dark:border-white/[0.06]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-ink' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-status-success-bg border border-emerald-500/20 text-status-success-ink rounded-2xl text-xs flex justify-between items-center shadow-soft">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="font-semibold hover:underline">Dismiss</button>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-status-danger-bg border border-rose-500/20 text-status-danger-ink rounded-2xl text-xs flex justify-between items-center shadow-soft">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Segmented Filter */}
      <div className="flex items-center gap-1.5 p-1.5 bg-surface rounded-pill shadow-soft border border-black/[0.04] dark:border-white/[0.06] overflow-x-auto text-xs">
        {['all', 'open', 'in_progress', 'resolved'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-pill text-xs font-semibold capitalize transition cursor-pointer ${
              statusFilter === s
                ? 'bg-accent text-accent-ink shadow-soft'
                : 'text-ink-soft hover:text-ink hover:bg-surface-muted'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-surface rounded-[24px] shadow-soft border border-black/[0.04] dark:border-white/[0.06] p-2 md:p-4 overflow-hidden">
        <div className="overflow-x-auto relative">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-[11px] uppercase font-semibold text-ink-soft border-b border-black/[0.04] dark:border-white/[0.06] sticky top-0 z-20">
              <tr>
                <th className="px-4 py-3.5 sticky left-0 bg-surface z-30 min-w-[180px]">
                  Customer & Invoice
                </th>
                <th className="px-4 py-3.5 min-w-[110px]">Category</th>
                <th className="px-4 py-3.5 min-w-[100px]">Priority</th>
                <th className="px-4 py-3.5 min-w-[260px] max-w-sm">Description</th>
                <th className="px-4 py-3.5 min-w-[120px]">Status</th>
                <th className="px-4 py-3.5 min-w-[140px]">Logged (IST)</th>
                <th className="px-4 py-3.5 text-right min-w-[120px] sticky right-0 bg-surface z-20">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
              {loading && complaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-ink-soft">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs font-medium">Loading complaints...</p>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-ink-soft">
                    <p className="text-sm font-semibold text-ink">No customer complaints</p>
                    <p className="text-xs mt-1">Dissatisfaction flags will appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                complaints.map((c) => {
                  const rawPhone = c.purchase?.phoneNumber || '';
                  const isRevealed = Boolean(revealedPhones[c._id]);
                  const displayedPhone = isRevealed ? rawPhone : maskPhoneNumber(rawPhone);

                  return (
                    <tr key={c._id} className="hover:bg-surface-muted/50 transition group">
                      <td className="px-4 py-3.5 sticky left-0 bg-surface group-hover:bg-surface-muted/50 z-10">
                        <p className="font-semibold text-ink text-xs truncate max-w-[160px]">
                          {c.purchase?.customerName || 'Customer'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
                            {displayedPhone}
                          </span>
                          {rawPhone && (
                            <button
                              type="button"
                              onClick={() => setRevealedPhones((p) => ({ ...p, [c._id]: !p[c._id] }))}
                              aria-label={isRevealed ? 'Mask phone' : 'Reveal phone'}
                              className="text-ink-soft hover:text-ink p-0.5 transition cursor-pointer"
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-ink-secondary bg-surface-muted px-2 py-0.5 rounded-pill mt-1 inline-block">
                          {c.purchase?.invoiceNumber}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap capitalize text-ink text-xs font-medium">
                        {c.category?.replace('_', ' ') || 'General'}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusPill status={c.priority} />
                      </td>

                      <td className="px-4 py-3.5 max-w-sm">
                        <p className="line-clamp-2 text-ink-soft text-xs leading-relaxed" title={c.description}>
                          {c.description}
                        </p>
                        {c.resolutionNotes && (
                          <p className="text-[11px] text-status-success-ink font-medium truncate mt-1">
                            Resolved: {c.resolutionNotes}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusPill status={c.status} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-mono tabular-nums text-ink-soft text-xs">
                        {formatDateTimeIST(c.createdAt)}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-surface group-hover:bg-surface-muted/50 z-10">
                        {c.status !== 'resolved' ? (
                          <button
                            onClick={() => { setSelectedComplaint(c); setResolutionNotes(''); }}
                            className="px-3 py-1 bg-surface-muted hover:bg-black/5 dark:hover:bg-white/5 text-ink font-semibold rounded-pill text-xs transition cursor-pointer"
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="text-status-success-ink font-semibold text-xs flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" /> Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Drawer */}
      <Drawer
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        title="Resolve Customer Issue"
        subtitle={selectedComplaint?.purchase?.customerName}
        width="max-w-md"
      >
        {selectedComplaint && (
          <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs font-sans">
            <div className="p-4 bg-surface-muted rounded-[18px] border border-black/[0.04] dark:border-white/[0.06] text-ink-soft space-y-1.5">
              <span className="text-ink-soft/70 text-[10px] uppercase font-semibold tracking-wider block">Customer Issue</span>
              <p className="text-ink text-xs leading-relaxed">{selectedComplaint.description}</p>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-ink-soft mb-1.5">
                Resolution Notes *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Action taken (e.g. called customer, apologized for billing counter delay, scheduled showroom follow-up)..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-[16px] p-3 text-xs text-ink placeholder-ink-soft/50 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-black/[0.04] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 rounded-pill text-xs font-semibold text-ink-soft hover:text-ink hover:bg-surface-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-pill text-xs font-semibold bg-accent text-accent-ink shadow-soft hover:brightness-105 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Confirm Resolution'}
              </button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}
