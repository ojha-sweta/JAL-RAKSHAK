import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Database,
  Globe,
  Moon,
  Save,
  Server,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sun,
  Wifi,
} from 'lucide-react';

const Settings: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [telegram, setTelegram] = useState(true);
  const [sms, setSms] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="min-h-full bg-slate-100/70 px-4 py-5 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <section>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400">
                  <Settings2 size={20} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                    Configuration
                  </p>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                    Settings
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Configure JAL-RAKSHAK operating preferences, notifications,
                connectivity, and demonstration settings.
              </p>
            </div>

            <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
              DEMO CONFIGURATION
            </div>
          </div>
        </section>

        {/* Save Status */}
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 size={17} />
            Settings saved for this demo session.
          </div>
        )}

        {/* System Configuration */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Server
                size={19}
                className="text-cyan-600 dark:text-cyan-400"
              />

              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  System Configuration
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Core JAL-RAKSHAK system information.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <Database size={16} />
                <span className="text-xs">Backend</span>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                FastAPI
              </p>

              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                Configured
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <Wifi size={16} />
                <span className="text-xs">Communication</span>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                HTTP / REST
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                ESP32 ↔ FastAPI
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <Globe size={16} />
                <span className="text-xs">Device</span>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                JAL-001
              </p>

              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                Online
              </p>
            </div>

          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Bell
                size={19}
                className="text-indigo-600 dark:text-indigo-400"
              />

              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  Notifications
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Configure how system alerts should be delivered.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">

            {/* Dashboard */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-start gap-3">
                <Bell
                  size={18}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Dashboard alerts
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Show active warnings and critical alerts inside the dashboard.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNotifications((prev) => !prev)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  notifications
                    ? 'bg-cyan-600'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle dashboard notifications"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                    notifications ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Telegram */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-start gap-3">
                <Smartphone
                  size={18}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Telegram notifications
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Backend-delivered notifications for important events.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTelegram((prev) => !prev)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  telegram
                    ? 'bg-cyan-600'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle Telegram notifications"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                    telegram ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-start gap-3">
                <Smartphone
                  size={18}
                  className="mt-0.5 text-slate-400"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    SMS / Twilio
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Optional SMS alert channel for critical events.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSms((prev) => !prev)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  sms
                    ? 'bg-cyan-600'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle SMS notifications"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                    sms ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

          </div>
        </section>

        {/* Appearance */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Sun
                size={19}
                className="text-amber-500"
              />

              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  Appearance
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Interface appearance is controlled from the header theme switch.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2">

            <div className="flex items-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50/60 p-4 dark:border-cyan-900/60 dark:bg-cyan-950/20">
              <Sun
                size={18}
                className="text-cyan-600 dark:text-cyan-400"
              />

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Light / System
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Use the global theme control.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <Moon
                size={18}
                className="text-slate-500 dark:text-slate-400"
              />

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Dark Mode
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Available through the header toggle.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Demo Mode */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between gap-5 p-5">

            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
              />

              <div>
                <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                  Demonstration Mode
                </h2>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-amber-800/80 dark:text-amber-400/80">
                  Demo mode keeps simulated sensor values visible until
                  the FastAPI backend and ESP32 telemetry pipeline are connected.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDemoMode((prev) => !prev)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                demoMode
                  ? 'bg-amber-500'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label="Toggle demo mode"
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                  demoMode ? 'left-6' : 'left-1'
                }`}
              />
            </button>

          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end pb-4">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500"
          >
            <Save size={17} />
            Save Settings
          </button>
        </div>

        {/* Backend Note */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex gap-3">
            <Server
              size={18}
              className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400"
            />

            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Integration note
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                In the production integration, settings such as notification
                preferences, device configuration, and operational parameters
                will be persisted by the backend. API credentials and service
                secrets should remain on the server and must not be stored in
                the React frontend.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Settings;