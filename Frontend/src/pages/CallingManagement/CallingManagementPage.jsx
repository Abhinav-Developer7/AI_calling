import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { formatDateTimeIST, formatTimeIST } from '../../utils/date';
import { maskPhoneNumber } from '../../utils/phone';
import { StatusPill } from '../../components/ui/StatusPill';
import { Pagination } from '../../components/ui/Pagination';
import { CallingSimulationModal } from './components/CallingSimulationModal';
import { CallingActionModals } from './components/CallingActionModals';
import { CallingAttemptsDrawer } from './components/CallingAttemptsDrawer';
import {
  PhoneCall,
  RefreshCw,
  Play,
  RotateCcw,
  AlertCircle,
  History,
  Bot,
  Eye,
  EyeOff,
} from 'lucide-react';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Calls' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'calling', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'retry_scheduled', label: 'Retries' },
  { id: 'no_answer', label: 'No Answer' },
  { id: 'busy', label: 'Busy' },
  { id: 'failed', label: 'Failed' },
  { id: 'opted_out', label: 'Opted Out' },
];

export function CallingManagementPage() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 5 });
  const [revealedPhones, setRevealedPhones] = useState({});

  const [activeModal, setActiveModal] = useState(null); // 'cancel' | 'reschedule' | 'optout' | 'simulate' | 'attempts'
  const [selectedProcess, setSelectedProcess] = useState(null);

  const fetchProcesses = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/feedback-processes', {
        params: {
          status: filter === 'all' ? undefined : filter,
          search: search.trim() || undefined,
          page: targetPage,
          limit: 5,
        },
      });
      if (res.data?.success) {
        setProcesses(res.data.processes || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load calling queue');
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => {
    fetchProcesses(page);
  }, [page, fetchProcesses]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleCallNow = async (processId) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post(`/feedback-processes/${processId}/call-now`);
      if (res.data?.success) {
        setSuccessMsg('Outbound call initiated.');
        fetchProcesses(page);
      } else {
        setError(res.data?.message || 'Call attempt could not be started.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Call initiation failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      {/* Topbar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Calling Queue</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Monitor automated feedback calls, dispatch immediate dials, and test webhook outcomes.
          </p>
        </div>
        <button
          onClick={() => { setPage(1); fetchProcesses(1); }}
          disabled={loading}
          aria-label="Refresh queue"
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

      {/* Filter Segmented Controls */}
      <div className="flex items-center gap-1.5 p-1.5 bg-surface rounded-pill shadow-soft border border-black/[0.04] dark:border-white/[0.06] overflow-x-auto text-xs">
        {FILTER_OPTIONS.map((item) => {
          const isActive = filter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleFilterChange(item.id)}
              className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-accent text-accent-ink shadow-soft'
                  : 'text-ink-soft hover:text-ink hover:bg-surface-muted'
              }`}
            >
              {item.label}
            </button>
          );
        })}
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
                <th className="px-4 py-3.5 min-w-[150px]">Scheduled (IST)</th>
                <th className="px-4 py-3.5 min-w-[110px]">Attempts</th>
                <th className="px-4 py-3.5 min-w-[130px]">Call Status</th>
                <th className="px-4 py-3.5 min-w-[120px]">Feedback</th>
                <th className="px-4 py-3.5 text-right min-w-[160px] sticky right-0 bg-surface z-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
              {loading && processes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-ink-soft">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs font-medium">Loading calling queue...</p>
                  </td>
                </tr>
              ) : processes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-ink-soft">
                    <p className="text-sm font-semibold text-ink">No calls in this queue</p>
                    <p className="text-xs mt-1">Outbound feedback calls are scheduled automatically after billing.</p>
                  </td>
                </tr>
              ) : (
                processes.map((proc) => {
                  const purchase = proc.purchase || {};
                  const isRevealed = Boolean(revealedPhones[proc._id]);
                  const displayedPhone = isRevealed ? purchase.phoneNumber : maskPhoneNumber(purchase.phoneNumber);

                  return (
                    <tr key={proc._id} className="hover:bg-surface-muted/50 transition group">
                      <td className="px-4 py-3.5 sticky left-0 bg-surface group-hover:bg-surface-muted/50 z-10">
                        <p className="font-semibold text-ink text-xs truncate max-w-[160px]">
                          {purchase.customerName || 'Customer'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">
                            {displayedPhone}
                          </span>
                          {purchase.phoneNumber && (
                            <button
                              type="button"
                              onClick={() => setRevealedPhones((p) => ({ ...p, [proc._id]: !p[proc._id] }))}
                              aria-label={isRevealed ? 'Mask phone' : 'Reveal phone'}
                              className="text-ink-soft hover:text-ink p-0.5 transition cursor-pointer"
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-ink-secondary bg-surface-muted px-2 py-0.5 rounded-pill mt-1 inline-block">
                          {purchase.invoiceNumber}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-mono tabular-nums text-ink text-xs">
                        {proc.scheduledAt ? formatDateTimeIST(proc.scheduledAt) : 'Immediate'}
                        {proc.nextAttemptAt && proc.callStatus === 'retry_scheduled' && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-sans font-medium">
                            Retry: {formatTimeIST(proc.nextAttemptAt)}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap tabular-nums text-xs">
                        <span className="font-semibold text-ink">{proc.attemptCount}</span>
                        <span className="text-ink-soft"> of {proc.maxAttempts}</span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusPill status={proc.callStatus} />
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap capitalize text-ink-soft text-xs">
                        {proc.feedbackStatus?.replace('_', ' ') || 'Pending'}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap sticky right-0 bg-surface group-hover:bg-surface-muted/50 z-10">
                        <div className="flex items-center justify-end gap-1.5">
                          {['scheduled', 'retry_scheduled', 'no_answer', 'busy', 'failed'].includes(proc.callStatus) &&
                            proc.attemptCount < proc.maxAttempts && (
                              <button
                                onClick={() => handleCallNow(proc._id)}
                                title="Execute Call Now"
                                className="px-3 py-1 bg-accent text-accent-ink font-semibold rounded-pill text-[11px] shadow-soft hover:brightness-105 active:scale-[0.98] transition flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-accent-ink" />
                                <span>Call</span>
                              </button>
                            )}

                          {proc.callStatus !== 'completed' && proc.callStatus !== 'opted_out' && (
                            <button
                              onClick={() => { setSelectedProcess(proc); setActiveModal('simulate'); }}
                              title="Simulate Webhook"
                              className="px-2.5 py-1 bg-surface-muted hover:bg-black/5 dark:hover:bg-white/5 text-ink font-medium rounded-pill text-[11px] transition flex items-center gap-1 cursor-pointer"
                            >
                              <Bot className="w-3 h-3 text-ink-soft" />
                              <span>Simulate</span>
                            </button>
                          )}

                          {['scheduled', 'retry_scheduled'].includes(proc.callStatus) && (
                            <button
                              onClick={() => { setSelectedProcess(proc); setActiveModal('reschedule'); }}
                              title="Reschedule"
                              className="p-1.5 text-ink-soft hover:text-ink rounded-full hover:bg-surface-muted transition cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => { setSelectedProcess(proc); setActiveModal('attempts'); }}
                            title="View Attempt Logs"
                            className="p-1.5 text-ink-soft hover:text-ink rounded-full hover:bg-surface-muted transition cursor-pointer"
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

      {/* Pagination Bar */}
      <Pagination
        page={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || 0}
        limit={5}
        onPageChange={(newPage) => setPage(newPage)}
        loading={loading}
      />

      {/* Modals & Drawers */}
      <CallingSimulationModal
        isOpen={activeModal === 'simulate'}
        process={selectedProcess}
        onClose={() => setActiveModal(null)}
        onSuccess={(msg) => { setSuccessMsg(msg); fetchProcesses(page); }}
      />
      <CallingActionModals
        activeModal={['reschedule', 'cancel', 'optout'].includes(activeModal) ? activeModal : null}
        process={selectedProcess}
        onClose={() => setActiveModal(null)}
        onSuccess={(msg) => { setSuccessMsg(msg); fetchProcesses(page); }}
      />
      <CallingAttemptsDrawer
        isOpen={activeModal === 'attempts'}
        process={selectedProcess}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
