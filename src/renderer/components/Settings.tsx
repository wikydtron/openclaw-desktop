import React, { useState, useEffect } from 'react';

export function Settings() {
  const [gatewayUrl, setGatewayUrl] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [launchOnStartup, setLaunchOnStartup] = useState(false);
  const [saved, setSaved] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const config = await window.electronAPI.gateway.getConfig();
        setGatewayUrl(config.url);
        setToken(config.token);
        const startup = await window.electronAPI.startup.get();
        setLaunchOnStartup(startup);
      } catch {
        // defaults
      }
    })();
  }, []);

  const handleSave = async () => {
    await window.electronAPI.gateway.updateConfig({ url: gatewayUrl, token });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await window.electronAPI.gateway.restart();
    } catch {
      // handled
    }
    setRestarting(false);
  };

  const handleStartupToggle = async () => {
    const newVal = !launchOnStartup;
    setLaunchOnStartup(newVal);
    await window.electronAPI.startup.set(newVal);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 mb-1">Settings</h1>
          <p className="text-sm text-zinc-400">Configure your OpenClaw Desktop connection</p>
        </div>

        {/* Gateway URL */}
        <Section title="Gateway Connection">
          <Field label="Gateway URL">
            <input
              type="text"
              value={gatewayUrl}
              onChange={(e) => setGatewayUrl(e.target.value)}
              className="w-full bg-zinc-800/60 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-accent/50 transition-colors"
              placeholder="ws://127.0.0.1:18789"
            />
          </Field>
          <Field label="Auth Token">
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-700/40 rounded-xl px-4 py-2.5 pr-16 text-sm text-zinc-100 outline-none focus:border-accent/50 transition-colors font-mono"
                placeholder="Token"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
            >
              {saved ? 'Saved!' : 'Save'}
            </button>
            <button
              onClick={handleRestart}
              disabled={restarting}
              className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors border border-zinc-700/40 disabled:opacity-50"
            >
              {restarting ? 'Restarting...' : 'Restart Gateway'}
            </button>
          </div>
        </Section>

        {/* Startup */}
        <Section title="General">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-200">Launch on startup</p>
              <p className="text-xs text-zinc-400 mt-0.5">Start OpenClaw Desktop when Windows boots</p>
            </div>
            <button
              onClick={handleStartupToggle}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                launchOnStartup ? 'bg-accent' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  launchOnStartup ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </Section>

        {/* About */}
        <Section title="About">
          <div className="space-y-2 text-sm text-zinc-400">
            <p>OpenClaw Desktop v1.0.0</p>
            <p>A friendly desktop client for your local OpenClaw gateway.</p>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">{title}</h2>
      <div className="bg-zinc-800/30 rounded-2xl border border-zinc-700/30 p-5 space-y-4">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-zinc-300 font-medium">{label}</label>
      {children}
    </div>
  );
}
