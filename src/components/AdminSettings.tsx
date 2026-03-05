import { useState } from 'react';
import { Save, Settings, Image, Bell, Lock } from 'lucide-react';
import { AdminSettings as AdminSettingsType } from '../types';
import { getAdminSettings, saveAdminSettings } from '../store';

interface Props {
  onSaved: () => void;
}

export default function AdminSettingsPanel({ onSaved }: Props) {
  const [settings, setSettings] = useState<AdminSettingsType>(getAdminSettings());
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'form' | 'security' | 'notifications'>('general');

  const update = (key: keyof AdminSettingsType, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveAdminSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Settings },
    { id: 'form' as const, label: 'Form', icon: Image },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-zinc-500 text-sm">Manage your label dashboard configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
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
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h3 className="font-bold">Company Information</h3>
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
              <div className="mt-3 flex items-center gap-3">
                <img src={settings.companyLogo} alt="Logo preview" className="h-12 w-12 object-contain rounded-lg bg-zinc-900" />
                <span className="text-xs text-zinc-500">Logo preview</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Settings */}
      {activeTab === 'form' && (
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h3 className="font-bold">Submission Form</h3>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Welcome Title</label>
            <input
              type="text"
              value={settings.formWelcomeText}
              onChange={e => update('formWelcomeText', e.target.value)}
              className="input-dark w-full px-4 py-3 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Form Description</label>
            <textarea
              value={settings.formDescription}
              onChange={e => update('formDescription', e.target.value)}
              rows={3}
              className="input-dark w-full px-4 py-3 rounded-xl resize-none"
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
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h3 className="font-bold">Notifications</h3>
          <p className="text-xs text-zinc-500">Configure notification integrations (requires backend setup)</p>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Notification Email</label>
            <input
              type="email"
              value={settings.notificationEmail || ''}
              onChange={e => update('notificationEmail', e.target.value)}
              placeholder="team@yourlabel.com"
              className="input-dark w-full px-4 py-3 rounded-xl"
            />
          </div>
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
        </div>
      )}

      <button
        onClick={handleSave}
        className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        {saved ? '✓ Settings Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
