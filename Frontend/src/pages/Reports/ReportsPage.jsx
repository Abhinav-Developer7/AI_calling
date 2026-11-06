import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { Download, CheckCircle2, AlertCircle } from 'lucide-react';

export function ReportsPage() {
  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleExportCSV = async () => {
    setDownloading(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const response = await apiClient.get('/reports/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `aurum-feedback-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      setStatusMsg('Report exported successfully with masked customer phone numbers.');
    } catch (err) {
      setErrorMsg('Failed to export report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">Reports & Data Export</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Export customer feedback, call outcomes, and rating distributions in CSV format.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-ink font-semibold rounded-pill text-xs shadow-soft hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
        >
          {downloading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />
              <span>Generating CSV...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 stroke-[2]" />
              <span>Export CSV</span>
            </>
          )}
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-status-success-bg border border-emerald-500/20 text-status-success-ink rounded-2xl text-xs flex items-center gap-2.5 shadow-soft">
          <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2]" />
          <span>{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-status-danger-bg border border-rose-500/20 text-status-danger-ink rounded-2xl text-xs flex items-center gap-2.5 shadow-soft">
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[2]" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-surface rounded-[24px] shadow-soft border border-black/[0.04] dark:border-white/[0.06] p-6 space-y-5">
        <div>
          <h2 className="text-xs font-semibold text-ink uppercase tracking-wider mb-1.5">
            Data Governance & Compliance Guardrails
          </h2>
          <p className="text-xs text-ink-soft leading-relaxed">
            Exports follow India's Digital Personal Data Protection (DPDP) Act: customer phone numbers are masked by default (`+91 80869•••23`).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-[18px] space-y-1.5">
            <span className="font-semibold text-ink block text-xs">Customer Feedback Dataset</span>
            <p className="text-ink-soft leading-relaxed text-[11px]">
              Includes customer name, masked phone number, invoice reference, 1–5 star rating, sentiment classification, language used, and AI conversation summary.
            </p>
          </div>

          <div className="p-4 bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-[18px] space-y-1.5">
            <span className="font-semibold text-ink block text-xs">Financial Privacy Safeguard</span>
            <p className="text-ink-soft leading-relaxed text-[11px]">
              Card numbers, bank details, and OTPs are never collected or stored during automated feedback conversations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
