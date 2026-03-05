import { useState } from 'react';
import { Save, Settings, Image, Bell, Lock, Table, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { AdminSettings as AdminSettingsType } from '../types';
import { getAdminSettings, saveAdminSettings, testDiscordWebhook } from '../store';

interface Props {
  onSaved: () => void;
}

export default function AdminSettingsPanel({ onSaved }: Props) {
  const [settings, setSettings] = useState<AdminSettingsType>(getAdminSettings());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'form' | 'security' | 'notifications' | 'sheets'>('general');
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [discordResult, setDiscordResult] = useState<'success' | 'fail' | null>(null);

  const update = (key: keyof AdminSettingsType, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveAdminSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  };

  const handleTestDiscord = async () => {
    if (!settings.discordWebhook) return;
    setTestingDiscord(true);
    setDiscordResult(null);
    // Save first so test uses current settings
    saveAdminSettings(settings);
    const ok = await testDiscordWebhook(settings.discordWebhook);
    setDiscordResult(ok ? 'success' : 'fail');
    setTestingDiscord(false);
    setTimeout(() => setDiscordResult(null), 5000);
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'form' as const, label: 'Form', icon: Image },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'sheets' as const, label: 'Google Sheets', icon: Table },
  ];

  return (
    <div className="fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-zinc-500 text-sm">Manage everything from here — no code or backend needed</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/5 pb-0 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white/5 text-white border-b-2 border-violet-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* General */}
      {activeTab === 'general' && (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h3 className="font-bold">Company Branding</h3>
            <p className="text-xs text-zinc-500">These settings are shown to <span className="text-white font-medium">all visitors</span> on the submission form</p>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={e => update('companyName', e.target.value)}
                className="input-dark w-full px-4 py-3 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Company Logo URL</label>
              <input
                type="url"
                value={settings.companyLogo}
                onChange={e => update('companyLogo', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="input-dark w-full px-4 py-3 rounded-xl"
              />
              {settings.companyLogo && (
                <div className="mt-3 flex items-center gap-4 bg-zinc-900/60 rounded-xl p-4">
                  <img src={settings.companyLogo} alt="Logo preview" className="h-16 w-16 object-contain rounded-lg bg-black/40 p-1" />
                  <div>
                    <p className="text-sm font-medium">{settings.companyName}</p>
                    <p className="text-xs text-zinc-500">This is how it appears to artists</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-sm text-violet-400">💡 How Logo Visibility Works</h4>
            <div className="text-xs text-zinc-400 space-y-2">
              <p>When you save settings, the logo and company name update <span className="text-white font-medium">immediately</span> for:</p>
              <p>✅ <span className="text-white">Same device</span> — Instant, saved locally</p>
              <p>✅ <span className="text-white">All devices worldwide</span> — If Google Sheets is connected (Settings → Google Sheets tab), branding is synced globally so every visitor sees your logo</p>
              <p className="text-zinc-500 mt-2">👉 For best results, connect Google Sheets — it takes 5 minutes and makes your branding work everywhere</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Settings */}
      {activeTab === 'form' && (
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h3 className="font-bold">Submission Form Text</h3>
          <p className="text-xs text-zinc-500">Customize the text artists see on the submission page</p>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Welcome Title</label>
            <input
              type="text"
              value={settings.formWelcomeText}
              onChange={e => update('formWelcomeText', e.target.value)}
              className="input-dark w-full px-4 py-3 rounded-xl"
              placeholder="Submit Your Release"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Form Description</label>
            <textarea
              value={settings.formDescription}
              onChange={e => update('formDescription', e.target.value)}
              rows={3}
              className="input-dark w-full px-4 py-3 rounded-xl resize-none"
              placeholder="Fill out the form below to submit your music release."
            />
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h3 className="font-bold">Admin Credentials</h3>
          <p className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">⚠️ Change your default credentials for security</p>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Admin Username</label>
            <input
              type="text"
              value={settings.adminUsername}
              onChange={e => update('adminUsername', e.target.value)}
              className="input-dark w-full px-4 py-3 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Admin Password</label>
            <input
              type="password"
              value={settings.adminPassword}
              onChange={e => update('adminPassword', e.target.value)}
              className="input-dark w-full px-4 py-3 rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h3 className="font-bold">Discord Notifications</h3>
            <p className="text-xs text-zinc-500">Get a rich notification in your Discord server every time someone submits a release</p>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Discord Webhook URL</label>
              <input
                type="url"
                value={settings.discordWebhook || ''}
                onChange={e => update('discordWebhook', e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="input-dark w-full px-4 py-3 rounded-xl"
              />
            </div>

            {settings.discordWebhook && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestDiscord}
                  disabled={testingDiscord}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium hover:bg-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {testingDiscord ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending test...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Test Message</>
                  )}
                </button>
                {discordResult === 'success' && (
                  <span className="flex items-center gap-1 text-emerald-400 text-sm"><CheckCircle2 className="w-4 h-4" /> Sent! Check your Discord</span>
                )}
                {discordResult === 'fail' && (
                  <span className="flex items-center gap-1 text-red-400 text-sm"><XCircle className="w-4 h-4" /> Failed — check URL</span>
                )}
              </div>
            )}
          </div>

          {/* Discord Setup Guide */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm">📋 How to Set Up Discord Notifications</h3>
            <div className="space-y-3 text-sm text-zinc-400">
              <div className="bg-zinc-900/60 rounded-xl p-4 space-y-2">
                <p className="text-white font-medium">Step 1: Open Discord</p>
                <p>Go to your Discord server → pick the channel for notifications</p>
              </div>
              <div className="bg-zinc-900/60 rounded-xl p-4 space-y-2">
                <p className="text-white font-medium">Step 2: Create Webhook</p>
                <p>Right-click channel → <span className="text-violet-400">Edit Channel</span> → <span className="text-violet-400">Integrations</span> → <span className="text-violet-400">Webhooks</span> → <span className="text-violet-400">New Webhook</span></p>
              </div>
              <div className="bg-zinc-900/60 rounded-xl p-4 space-y-2">
                <p className="text-white font-medium">Step 3: Copy & Paste</p>
                <p>Click <span className="text-violet-400">Copy Webhook URL</span> → paste it above → click <span className="text-violet-400">Send Test Message</span> to verify</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-emerald-400 font-medium">✅ That's it!</p>
                <p>Every new submission will send a rich embed notification to your Discord channel automatically.</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h3 className="font-bold">Email Notifications</h3>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Notification Email</label>
              <input
                type="email"
                value={settings.notificationEmail || ''}
                onChange={e => update('notificationEmail', e.target.value)}
                placeholder="team@yourlabel.com"
                className="input-dark w-full px-4 py-3 rounded-xl"
              />
              <p className="text-xs text-zinc-600 mt-1">Note: Email requires an email service. Discord is recommended for instant zero-setup notifications.</p>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets */}
      {activeTab === 'sheets' && (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h3 className="font-bold flex items-center gap-2">
              <Table className="w-5 h-5 text-emerald-400" />
              Google Sheets Database
            </h3>
            <p className="text-sm text-zinc-400">
              Connect Google Sheets to: save all submissions as backup, sync your branding (logo/name) to all visitors worldwide, and share data with your team.
            </p>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Google Apps Script Web App URL</label>
              <input
                type="url"
                value={settings.googleSheetsWebhook || ''}
                onChange={e => update('googleSheetsWebhook', e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="input-dark w-full px-4 py-3 rounded-xl"
              />
            </div>
            {settings.googleSheetsWebhook && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <p className="text-emerald-400 text-sm font-medium">✅ Connected — submissions + branding will sync to Google Sheets</p>
              </div>
            )}
          </div>

          {/* Setup Instructions */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm">📋 How to Set Up Google Sheets (5 minutes)</h3>
            <div className="space-y-3 text-sm text-zinc-400">
              <div className="bg-zinc-900/60 rounded-xl p-4 space-y-2">
                <p className="text-white font-medium">Step 1: Create Google Sheet</p>
                <p>Go to <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">sheets.google.com</a> → Create new spreadsheet</p>
                <p>Rename the first sheet tab to <span className="text-violet-400 font-medium">Releases</span> and add these headers in Row 1:</p>
                <code className="block bg-black/40 text-xs text-emerald-400 p-2 rounded-lg overflow-x-auto">
                  ID | Submitted | Status | Artist | Collabs | Features | Type | Title | Date | Genre | Explicit | Tracks | Track Names | Cover Art | Promo | Drive Folder
                </code>
              </div>

              <div className="bg-zinc-900/60 rounded-xl p-4 space-y-2">
                <p className="text-white font-medium">Step 2: Create Apps Script</p>
                <p>In your sheet → <span className="text-violet-400">Extensions</span> → <span className="text-violet-400">Apps Script</span></p>
                <p>Delete everything and paste this code:</p>
                <pre className="block bg-black/40 text-xs text-emerald-400 p-3 rounded-lg overflow-x-auto whitespace-pre">{`function doGet(e) {
  if (e.parameter.action === 'getSettings') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Settings');
    if (sheet) {
      var data = {
        companyName: sheet.getRange('B1').getValue(),
        companyLogo: sheet.getRange('B2').getValue(),
        formWelcomeText: sheet.getRange('B3').getValue(),
        formDescription: sheet.getRange('B4').getValue()
      };
      return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify({error:'not found'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);

  if (data.action === 'saveSettings') {
    var sheet = ss.getSheetByName('Settings');
    if (!sheet) {
      sheet = ss.insertSheet('Settings');
      sheet.getRange('A1:A4').setValues([
        ['companyName'],['companyLogo'],
        ['formWelcomeText'],['formDescription']
      ]);
    }
    sheet.getRange('B1').setValue(data.companyName);
    sheet.getRange('B2').setValue(data.companyLogo);
    sheet.getRange('B3').setValue(data.formWelcomeText);
    sheet.getRange('B4').setValue(data.formDescription);
    return ContentService
      .createTextOutput(JSON.stringify({result:'ok'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = ss.getSheetByName('Releases')
    || ss.getActiveSheet();
  sheet.appendRow([
    data.id, data.submittedAt, data.status,
    data.mainArtist, data.collaborations,
    data.features, data.releaseType,
    data.releaseTitle, data.releaseDate,
    data.genre, data.explicit,
    data.trackCount, data.tracks,
    data.coverArtLink, data.promoLink,
    data.driveFolderLink
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({result:'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
              </div>

              <div className="bg-zinc-900/60 rounded-xl p-4 space-y-2">
                <p className="text-white font-medium">Step 3: Deploy</p>
                <p>Click <span className="text-violet-400">Deploy</span> → <span className="text-violet-400">New deployment</span></p>
                <p>⚙️ Type: <span className="text-white">Web app</span></p>
                <p>👤 Execute as: <span className="text-white">Me</span></p>
                <p>🌍 Who has access: <span className="text-white">Anyone</span></p>
                <p>Click <span className="text-violet-400">Deploy</span> → Copy the URL → Paste above ☝️</p>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-emerald-400 font-medium">✅ Done!</p>
                <p className="text-zinc-400">Submissions save to Google Sheets + your logo/branding is visible to all visitors worldwide. No backend or server needed!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        className={`px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-all ${
          saved
            ? 'bg-emerald-600 text-white'
            : 'btn-primary'
        }`}
      >
        {saved ? (
          <><CheckCircle2 className="w-4 h-4" /> Settings Saved!</>
        ) : (
          <><Save className="w-4 h-4" /> Save Settings</>
        )}
      </button>
    </div>
  );
}
