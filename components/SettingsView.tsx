import React, { useEffect, useState } from 'react';

interface WebsiteSetting {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  sheet_link: string;
  script_link: string;
  gemini_api_key: string;
}

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<WebsiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    const setting = settings.find(s => s.id === id);
    if (!setting) return;

    setSaving(id);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting)
      });
      if (response.ok) {
        alert(`${setting.name} settings saved successfully!`);
      }
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  const handleChange = (id: string, field: keyof WebsiteSetting, value: string) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Website Configurations
        </h2>
        <button
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Back to Generator
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {settings.map((site) => (
            <div key={site.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest">{site.name}</h3>
                <button
                  onClick={() => handleSave(site.id)}
                  disabled={saving === site.id}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  {saving === site.id ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">API Base URL</label>
                  <input
                    type="text"
                    value={site.api_url}
                    onChange={(e) => handleChange(site.id, 'api_url', e.target.value)}
                    placeholder="https://api.example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-purple-500/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">API Key</label>
                  <input
                    type="password"
                    value={site.api_key}
                    onChange={(e) => handleChange(site.id, 'api_key', e.target.value)}
                    placeholder="Enter API Key"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-purple-500/50 outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Google Sheet CSV Link (Published)</label>
                  <input
                    type="text"
                    value={site.sheet_link}
                    onChange={(e) => handleChange(site.id, 'sheet_link', e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-purple-500/50 outline-none"
                  />
                  <p className="text-[10px] text-slate-600 italic ml-1">
                    Make sure the sheet is published to the web as CSV.
                  </p>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Google Apps Script URL (For Auto-Status Update)</label>
                  <input
                    type="text"
                    value={site.script_link || ''}
                    onChange={(e) => handleChange(site.id, 'script_link', e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-purple-500/50 outline-none"
                  />
                  <p className="text-[10px] text-slate-600 italic ml-1">
                    Used to automatically update status to "Published" in Google Sheet.
                  </p>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-emerald-500 uppercase ml-1">Gemini API Key (Optional Override)</label>
                  <input
                    type="password"
                    value={site.gemini_api_key || ''}
                    onChange={(e) => handleChange(site.id, 'gemini_api_key', e.target.value)}
                    placeholder="Enter Gemini API Key (Leave empty to use default)"
                    className="w-full bg-slate-950 border border-emerald-500/20 rounded-xl p-3 text-xs text-white focus:border-emerald-500/50 outline-none"
                  />
                  <p className="text-[10px] text-slate-600 italic ml-1">
                    If provided, this key will be used instead of the default environment variable for this website.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
