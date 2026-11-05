import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  XCircle,
  Play,
  RotateCcw,
  Ban,
  Search,
  AlertCircle,
  History,
  Sparkles,
  Bot,
  ThumbsUp,
  ThumbsDown,
  PhoneOff,
} from 'lucide-react';

export function CallingManagementPage() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'cancel', 'reschedule', 'attempts', 'optout', 'simulate'
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Simulation form state
  const [simOutcome, setSimOutcome] = useState('5_stars');

  const fetchProcesses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/feedback-processes', {
        params: {
          status: filter === 'all' ? undefined : filter,
          search: search.trim() || undefined,
        },
      });
      if (res.data.success) {
        setProcesses(res.data.processes || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load calling processes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, [filter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProcesses();
  };

  const handleCallNow = async (processId) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post(`/feedback-processes/${processId}/call-now`);
      if (res.data.success) {
        setSuccessMsg('Outbound call initiated! Status is now Calling.');
        fetchProcesses();
      } else {
        setError(res.data.message || 'Call attempt could not be initiated.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Call initiation failed.');
    }
  };

  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProcess) return;
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      let payload = {
        processId: selectedProcess._id,
      };

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
        payload = {
          ...payload,
          eventType: 'no_answer',
        };
      } else if (simOutcome === 'busy') {
        payload = {
          ...payload,
          eventType: 'busy',
        };
      } else if (simOutcome === 'opt_out') {
        payload = {
          ...payload,
          eventType: 'completed',
          optOut: true,
          feedbackText: 'Customer requested not to receive feedback calls again.',
        };
      }

      const res = await apiClient.post('/webhooks/simulate', payload);
      if (res.data.success) {
        setSuccessMsg(`Simulated call outcome processed: ${res.data.result?.callStatus || 'completed'}`);
        setActiveModal(null);
        setSelectedProcess(null);
        fetchProcesses();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to simulate webhook outcome.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProcess) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/feedback-processes/${selectedProcess._id}/cancel`, {
        reason: actionReason || 'Cancelled by administrator',
      });
      if (res.data.success) {
        setSuccessMsg('Call process cancelled.');
        setActiveModal(null);
        setSelectedProcess(null);
        fetchProcesses();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel call.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProcess || !rescheduleTime) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/feedback-processes/${selectedProcess._id}/reschedule`, {
        scheduledTime: new Date(rescheduleTime).toISOString(),
      });
      if (res.data.success) {
        setSuccessMsg('Call process rescheduled.');
        setActiveModal(null);
        setSelectedProcess(null);
        fetchProcesses();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reschedule call.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOptOutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProcess) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/feedback-processes/${selectedProcess._id}/do-not-call`, {
        reason: actionReason || 'Customer requested Do-Not-Call',
      });
      if (res.data.success) {
        setSuccessMsg('Customer added to Do-Not-Call opt-out registry.');
        setActiveModal(null);
        setSelectedProcess(null);
        fetchProcesses();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record opt-out.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </span>
        );
      case 'calling':
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <PhoneCall className="w-3 h-3 text-blue-600" /> In Progress
          </span>
        );
      case 'retry_scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
            <RotateCcw className="w-3 h-3 text-orange-600" /> Retry Queued
          </span>
        );
      case 'no_answer':
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> {status.replace('_', ' ')}
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
            <XCircle className="w-3 h-3 text-slate-400" /> Skipped
          </span>
        );
      case 'opted_out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Ban className="w-3 h-3 text-purple-600" /> Opted Out
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 line-through">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 capitalize">
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
          <h1 className="text-2xl font-bold text-slate-900">AI Calling Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor automated feedback calls, test outbound dialing, and simulate voice agent responses
          </p>
        </div>

        <button
          onClick={fetchProcesses}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Calls
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-900">✕</button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs shadow-sm"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Processes' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'calling', label: 'Calling / In-Progress' },
            { id: 'completed', label: 'Completed' },
            { id: 'retry_scheduled', label: 'Retries' },
            { id: 'no_answer', label: 'No Answer' },
            { id: 'busy', label: 'Busy' },
            { id: 'failed', label: 'Failed' },
            { id: 'skipped', label: 'Skipped' },
            { id: 'opted_out', label: 'Opted Out' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                filter === item.id
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calling Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Customer & Bill</th>
                <th className="px-6 py-4">Scheduled At (IST)</th>
                <th className="px-6 py-4">Attempts</th>
                <th className="px-6 py-4">Call Status</th>
                <th className="px-6 py-4">Feedback Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && processes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading calling queue...
                  </td>
                </tr>
              ) : processes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <PhoneCall className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No calling processes match the criteria</p>
                    <p className="text-xs text-slate-400 mt-1">
                      New calls are automatically scheduled 15 minutes after each purchase.
                    </p>
                  </td>
                </tr>
              ) : (
                processes.map((proc) => {
                  const purchase = proc.purchase || {};
                  return (
                    <tr key={proc._id} className="hover:bg-slate-50/80 transition text-xs">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{purchase.customerName || 'Customer'}</p>
                        <p className="text-slate-400 font-mono text-[11px]">{purchase.phoneNumber}</p>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono mt-0.5 inline-block">
                          {purchase.invoiceNumber}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {proc.scheduledAt
                              ? new Date(proc.scheduledAt).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Immediate'}
                          </span>
                        </div>
                        {proc.nextAttemptAt && proc.callStatus === 'retry_scheduled' && (
                          <p className="text-[10px] text-orange-600 mt-0.5">
                            Retry: {new Date(proc.nextAttemptAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            proc.attemptCount >= proc.maxAttempts
                              ? 'bg-rose-100 text-rose-800'
                              : proc.attemptCount > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {proc.attemptCount} of {proc.maxAttempts} max
                        </span>
                      </td>

                      <td className="px-6 py-4">{getStatusBadge(proc.callStatus)}</td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                            proc.feedbackStatus === 'collected'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {proc.feedbackStatus.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1. Execute Call Now Button */}
                          {['scheduled', 'retry_scheduled', 'no_answer', 'busy', 'failed'].includes(proc.callStatus) &&
                            proc.attemptCount < proc.maxAttempts && (
                              <button
                                onClick={() => handleCallNow(proc._id)}
                                title="Execute Call Now (Test)"
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-sm transition flex items-center gap-1 text-[11px]"
                              >
                                <Play className="w-3 h-3 fill-slate-950" />
                                <span>Call Now</span>
                              </button>
                            )}

                          {/* 2. Simulate Outcome Button (Available for Calling, Scheduled, or Retry) */}
                          {proc.callStatus !== 'completed' && proc.callStatus !== 'opted_out' && (
                            <button
                              onClick={() => {
                                setSelectedProcess(proc);
                                setActiveModal('simulate');
                              }}
                              title="Simulate Voice Agent Webhook Outcome"
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition flex items-center gap-1 text-[11px]"
                            >
                              <Sparkles className="w-3 h-3 text-blue-600" />
                              <span>Simulate Result</span>
                            </button>
                          )}

                          {/* 3. Reschedule Button */}
                          {['scheduled', 'retry_scheduled', 'no_answer', 'busy', 'failed'].includes(proc.callStatus) &&
                            proc.attemptCount < proc.maxAttempts && (
                              <button
                                onClick={() => {
                                  setSelectedProcess(proc);
                                  setActiveModal('reschedule');
                                }}
                                title="Reschedule Call"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                          {/* 4. Cancel Button */}
                          {['scheduled', 'retry_scheduled', 'queued'].includes(proc.callStatus) && (
                            <button
                              onClick={() => {
                                setSelectedProcess(proc);
                                setActiveModal('cancel');
                              }}
                              title="Cancel Scheduled Call"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 5. Do Not Call / Opt-out Button */}
                          {!proc.doNotCall && proc.callStatus !== 'opted_out' && (
                            <button
                              onClick={() => {
                                setSelectedProcess(proc);
                                setActiveModal('optout');
                              }}
                              title="Mark Do-Not-Call (Customer Opt-out)"
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 6. View Attempts History */}
                          <button
                            onClick={() => {
                              setSelectedProcess(proc);
                              setActiveModal('attempts');
                            }}
                            title="View Call Attempts & Logs"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulation Modal */}
      {activeModal === 'simulate' && selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                Simulate Call Outcome (Webhook)
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Select a customer outcome to test how the system captures ratings, extracts Malayalam sentiment, schedules retries, or escalates complaints.
            </p>

            <form onSubmit={handleSimulateSubmit} className="space-y-3">
              <div className="space-y-2">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    simOutcome === '5_stars' ? 'bg-amber-50/60 border-amber-500' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="simOutcome"
                    value="5_stars"
                    checked={simOutcome === '5_stars'}
                    onChange={() => setSimOutcome('5_stars')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" /> 5 Stars — Excellent Experience
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Customer loved the jewellery and hospitality. Records positive feedback.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    simOutcome === '2_stars' ? 'bg-rose-50/60 border-rose-500' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="simOutcome"
                    value="2_stars"
                    checked={simOutcome === '2_stars'}
                    onChange={() => setSimOutcome('2_stars')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-600" /> 2 Stars — Triggers Complaint Review
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Customer reported delay at billing counter. Automatically creates a ticket in <strong>Complaints</strong>.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    simOutcome === 'no_answer' ? 'bg-orange-50/60 border-orange-500' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="simOutcome"
                    value="no_answer"
                    checked={simOutcome === 'no_answer'}
                    onChange={() => setSimOutcome('no_answer')}
                    className="mt-0.5 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <PhoneOff className="w-3.5 h-3.5 text-orange-600" /> No Answer — Triggers 30m Retry
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Customer phone rang with no answer. Schedules attempt #2 in 30 minutes.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    simOutcome === 'busy' ? 'bg-orange-50/60 border-orange-500' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="simOutcome"
                    value="busy"
                    checked={simOutcome === 'busy'}
                    onChange={() => setSimOutcome('busy')}
                    className="mt-0.5 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-800">Phone Busy — Triggers 30m Retry</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Customer line was engaged. Schedules attempt #2.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    simOutcome === 'opt_out' ? 'bg-purple-50/60 border-purple-500' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="simOutcome"
                    value="opt_out"
                    checked={simOutcome === 'opt_out'}
                    onChange={() => setSimOutcome('opt_out')}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-800">Customer Opted Out ("Don't call me again")</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Agent politely wraps up and marks customer in Do-Not-Call suppression registry.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow"
                >
                  {actionLoading ? 'Simulating...' : 'Submit Simulated Outcome'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {activeModal === 'reschedule' && selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-sm">Reschedule Call</h3>
            <p className="text-xs text-slate-500">
              Rescheduling feedback call for <strong>{selectedProcess.purchase?.customerName}</strong> ({selectedProcess.purchase?.invoiceNumber})
            </p>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Date & Time (IST)</label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {activeModal === 'cancel' && selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-sm">Cancel Scheduled Call</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel the scheduled feedback call for <strong>{selectedProcess.purchase?.customerName}</strong>?
            </p>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cancellation Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Customer requested cancellation"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow"
                >
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Do-Not-Call / Opt-Out Modal */}
      {activeModal === 'optout' && selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
              <Ban className="w-4 h-4 text-purple-600" /> Customer Opt-Out (Do-Not-Call)
            </h3>
            <p className="text-xs text-slate-500">
              This will immediately cancel all pending attempts and add phone{' '}
              <strong className="text-slate-800 font-mono">{selectedProcess.purchase?.phoneNumber}</strong> to the central suppression list.
            </p>
            <form onSubmit={handleOptOutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opt-out Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Customer requested Do-Not-Call"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-700 hover:bg-purple-600 text-white shadow"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Opt-Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attempts History Modal */}
      {activeModal === 'attempts' && selectedProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                Call Attempt Logs ({selectedProcess.purchase?.invoiceNumber})
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-3">
              {selectedProcess.attempts && selectedProcess.attempts.length > 0 ? (
                selectedProcess.attempts.map((att) => (
                  <div key={att._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Attempt #{att.attemptNumber}</span>
                      <span className="font-mono text-[10px] text-slate-500 uppercase">{att.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400">Provider:</span> {att.provider}
                      </div>
                      <div>
                        <span className="text-slate-400">Duration:</span> {att.durationSeconds || 0} seconds
                      </div>
                      <div className="col-span-2 font-mono truncate text-[10px]">
                        <span className="text-slate-400 font-sans">Provider Call ID:</span> {att.providerCallId || 'N/A'}
                      </div>
                      {att.telephonyError?.message && (
                        <div className="col-span-2 text-rose-600 font-medium">
                          Error: {att.telephonyError.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No call attempts have been initiated yet for this purchase.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
