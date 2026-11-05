import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { BarChart3, Download, Calendar, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

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

      // Create download anchor
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `jewellery-feedback-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      setStatusMsg('Report downloaded successfully with masked phone numbers.');
    } catch (err) {
      setErrorMsg('Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Data Export</h1>
          <p className="text-sm text-slate-500 mt-1">Export customer feedback reports, call outcomes, and rating distributions</p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-sm shadow-md transition disabled:opacity-50"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              Generating CSV...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Export CSV Report
            </>
          )}
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-800 mb-1">Export Options & Compliance Settings</h2>
          <p className="text-xs text-slate-500">
            Reports strictly protect customer privacy: phone numbers are masked in exported CSVs (e.g. +91 98765*****).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="font-bold text-slate-800 block">Post-Purchase Feedback CSV</span>
            <p className="text-slate-500 leading-relaxed">
              Contains customer name, masked phone number, invoice number, 1–5 star rating, sentiment, language, conversation summary, and complaint flags.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="font-bold text-slate-800 block">PII & Data Retention Guardrails</span>
            <p className="text-slate-500 leading-relaxed">
              Card credentials, bank details, and OTPs are strictly excluded and never gathered during feedback calling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
