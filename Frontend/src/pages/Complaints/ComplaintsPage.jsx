import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  MessageSquare,
  Check,
  UserCheck,
} from 'lucide-react';

export function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Resolution modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/complaints', {
        params: { status: statusFilter === 'all' ? undefined : statusFilter },
      });
      if (res.data.success) {
        setComplaints(res.data.complaints || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/complaints/${selectedComplaint._id}/resolve`, {
        resolutionNotes,
      });
      if (res.data.success) {
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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
            {priority}
          </span>
        );
      case 'medium':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 uppercase">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 uppercase">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> In Progress
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
          </span>
        );
      default:
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 capitalize">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Complaints & Follow-ups</h1>
          <p className="text-sm text-slate-500 mt-1">
            Negative feedback (ratings ≤ 2 or reported issues) flagged for store management action
          </p>
        </div>

        <button
          onClick={fetchComplaints}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Complaints
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['all', 'open', 'in_progress', 'resolved'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
              statusFilter === s
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Customer & Bill</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Issue Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Logged At</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && complaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading complaints...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p className="font-medium text-slate-700">No complaints found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Customer ratings ≤ 2 or reported issues will automatically appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition text-xs">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{c.purchase?.customerName || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{c.purchase?.phoneNumber}</p>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono mt-0.5 inline-block">
                        {c.purchase?.invoiceNumber}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="capitalize font-medium text-slate-700">
                        {c.category?.replace('_', ' ') || 'General'}
                      </span>
                    </td>

                    <td className="px-6 py-4">{getPriorityBadge(c.priority)}</td>

                    <td className="px-6 py-4 max-w-xs">
                      <p className="truncate text-slate-800" title={c.description}>
                        {c.description}
                      </p>
                      {c.resolutionNotes && (
                        <p className="text-[10px] text-emerald-700 font-medium truncate mt-0.5">
                          Resolution: {c.resolutionNotes}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(c.status)}</td>

                    <td className="px-6 py-4 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {c.status !== 'resolved' ? (
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setResolutionNotes('');
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs transition"
                        >
                          Resolve Issue
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-medium text-[11px] flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" /> Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Resolve Customer Complaint
            </h3>
            <p className="text-xs text-slate-500">
              Customer: <strong>{selectedComplaint.purchase?.customerName}</strong> ({selectedComplaint.purchase?.phoneNumber})
            </p>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-0.5">Reported Issue</span>
              <p>{selectedComplaint.description}</p>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Called customer back, apologized for billing delay, and offered store visit VIP greeting."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
