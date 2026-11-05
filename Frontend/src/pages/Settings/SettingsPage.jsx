import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Clock,
  PhoneForwarded,
  Copy,
  Check,
  Bot,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const webhookUrl = `${window.location.origin}/api/v1/webhooks/voice-provider/events`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System & Calling Provider Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure calling rules, telephony provider adapters (Retell AI / Vapi), and webhook integration
        </p>
      </div>

      {/* Calling Delay & Retry Rules */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Calling Policy & Safeguards
          </h2>
          <p className="text-xs text-slate-500 mt-1">Non-negotiable timing controls established by system policy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Initial Call Delay
            </label>
            <input
              type="text"
              readOnly
              value="15 minutes post-purchase"
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Scheduled automatically upon bill generation</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Max Call Attempts
            </label>
            <input
              type="text"
              readOnly
              value="2 attempts maximum"
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">1 initial call + 1 permitted retry on busy/no-answer</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Permitted Calling Hours (IST)
            </label>
            <input
              type="text"
              readOnly
              value="10:00 AM - 08:00 PM IST"
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Calls outside hours are shifted to 10:15 AM next morning</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Active Telephony Adapter
            </label>
            <input
              type="text"
              readOnly
              value="Mock Provider (Dev) / Retell AI (Configured)"
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-medium"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Toggle via VOICE_PROVIDER in Backend/.env</span>
          </div>
        </div>
      </div>

      {/* Retell AI Voice Provider Guide */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" /> Connecting to Retell AI Service
            </h2>
            <p className="text-xs text-slate-500 mt-1">Follow these steps to enable live voice calling</p>
          </div>
          <a
            href="https://retellai.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
          >
            Retell Dashboard <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl space-y-2">
            <span className="font-bold text-slate-800 block">1. Inbound Webhook URL (Paste into Retell)</span>
            <p className="text-slate-500 text-[11px]">
              Set this URL in your Retell AI Dashboard under <strong>Settings &gt; Webhook URL</strong> to receive call lifecycle events and ratings:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 bg-white border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-800"
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="px-3 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-semibold flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              * Note: For local development, use an ngrok or cloudflare tunnel URL (e.g. <code>https://your-ngrok.ngrok-free.app/api/v1/webhooks/voice-provider/events</code>).
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-2">
            <span className="font-bold text-slate-800 block">2. Configure Backend Credentials</span>
            <p className="text-slate-500 text-[11px]">
              Open <code>Backend/.env</code> and set the following:
            </p>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto">
{`VOICE_PROVIDER=retell
RETELL_API_KEY=your_retell_api_key_here
RETELL_AGENT_ID=your_retell_agent_id_here
RETELL_WEBHOOK_SECRET=your_retell_webhook_secret_here`}
            </pre>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-2">
            <span className="font-bold text-slate-800 block">3. Voice Agent Prompt (Malayalam & English)</span>
            <p className="text-slate-500 text-[11px]">
              In your Retell Agent instructions, use this tested prompt for Kerala Malayalam & English:
            </p>
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed max-h-48 overflow-y-auto font-mono text-[10px]">
{`You are an AI assistant for Aurum Jewellery calling customer {{customer_name}} regarding their purchase of {{items_summary}} on invoice {{invoice_number}}.

Language rules:
- Greet in Malayalam: "Namaskaram {{customer_name}}, njan Aurum Jewellery-il ninnumulla AI assistant aanu. Thangalude recent purchase experience kurichu samsarikkan 2 minute samayam undo?"
- If customer speaks English, switch smoothly to polite Indian English.
- If customer speaks Malayalam or Manglish, speak natural Kerala Malayalam.

Questions:
1. Ask for overall shopping experience on a scale of 1 to 5: "Ningalude experience engane undayirunnu? 1 muthal 5 vare rating tharamo?"
2. Ask 1 brief optional question about staff behavior or collection.
3. If customer mentions any issue (e.g. stone loose, billing queue), acknowledge politely without making false promises or arguing.
4. If customer says "don't call me again", apologize politely, confirm their number will be removed, and end call.

Safeguards:
- NEVER ask for OTP, PIN, bank details, or passwords.
- NEVER promise discounts, refunds, or repairs.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
