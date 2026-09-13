import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileBarChart,
  FileText,
  Gauge,
  Info,
  Radio,
  RefreshCw,
  ShieldCheck,
  Thermometer,
  Droplets,
} from 'lucide-react';

type ReportPeriod = 'CURRENT_CYCLE' | 'TODAY' | 'LAST_7_DAYS';

const REPORT_PERIODS: Record<ReportPeriod, string> = {
  CURRENT_CYCLE: 'Current Cycle',
  TODAY: 'Today',
  LAST_7_DAYS: 'Last 7 Days',
};

const Reports: React.FC = () => {
  const [period, setPeriod] =
    useState<ReportPeriod>('CURRENT_CYCLE');

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);

    window.setTimeout(() => {
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <section className="min-h-full bg-slate-100/70 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />

              <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                Operational Intelligence
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Reports
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Treatment-cycle summaries, water-quality observations,
              alerts and system performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              <Radio className="h-4 w-4 animate-pulse" />
              DEMO DATA
            </span>

            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}

              {isGenerating ? 'Preparing...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Data notice */}
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 dark:bg-cyan-500/10">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-500" />

            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Report data source
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                The current report view uses simulated data. In the
                production system, report values will be retrieved from
                FastAPI and the database using backend-generated records.
              </p>
            </div>
          </div>
        </div>

        {/* Period selector */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reporting Period
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Select the time range for the operational summary.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(REPORT_PERIODS) as ReportPeriod[]).map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPeriod(key)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      period === key
                        ? 'bg-cyan-500 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {REPORT_PERIODS[key]}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Cycle
              </p>

              <Activity className="h-5 w-5 text-cyan-500" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              #12
            </p>

            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              Process active
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Efficiency
              </p>

              <Gauge className="h-5 w-5 text-cyan-500" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              78.4%
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Backend-provided value
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Alerts
              </p>

              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              2
            </p>

            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Active warnings
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                System
              </p>

              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>

            <p className="mt-3 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              ONLINE
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Device and backend connected
            </p>
          </div>
        </div>

        {/* Report preview */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">

          <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <FileBarChart className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Operational Report
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {REPORT_PERIODS[period]} summary
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                JAL-RAKSHAK / JAL-001
              </span>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">

            {/* Water quality */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-500" />

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Water Quality Summary
                </h4>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Point A TDS
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Raw water
                    </p>
                  </div>

                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    680 ppm
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Point B TDS
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Treated water
                    </p>
                  </div>

                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    110 ppm
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Point A Turbidity
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Raw water
                    </p>
                  </div>

                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    14.2 NTU
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Point B pH
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Treated water
                    </p>
                  </div>

                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    7.2
                  </span>
                </div>
              </div>
            </div>

            {/* Process summary */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-500" />

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Treatment Summary
                </h4>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Current Stage
                  </span>

                  <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                    Purification
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Process Status
                  </span>

                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    RUNNING
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Pump
                  </span>

                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ON
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Backend Decision
                  </span>

                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    OPTIMIZE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sensor health */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Sensor Health
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Reported sensor-channel state
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-500" />

                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  TDS
                </span>
              </div>

              <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ONLINE
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-500" />

                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Turbidity
                </span>
              </div>

              <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ONLINE
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-cyan-500" />

                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Temperature
                </span>
              </div>

              <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ONLINE
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-cyan-500" />

                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  pH
                </span>
              </div>

              <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ONLINE
              </p>
            </div>
          </div>
        </div>

        {/* Alerts and metadata */}
        <div className="grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Alert Summary
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Events included in this report
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Active warnings
                </span>

                <span className="font-bold text-amber-600 dark:text-amber-400">
                  2
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Critical events
                </span>

                <span className="font-bold text-slate-900 dark:text-white">
                  0
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Resolved events
                </span>

                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  1
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-cyan-500" />

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Report Metadata
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Report identification information
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">
                  System
                </span>

                <span className="font-semibold text-slate-900 dark:text-white">
                  JAL-RAKSHAK
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">
                  Device
                </span>

                <span className="font-semibold text-slate-900 dark:text-white">
                  JAL-001
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500 dark:text-slate-400">
                  Period
                </span>

                <span className="font-semibold text-slate-900 dark:text-white">
                  {REPORT_PERIODS[period]}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  Data mode
                </span>

                <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                  DEMO
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-slate-200 pt-4 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
          <BarChart3 className="h-3.5 w-3.5" />

          Report generation and persistent report storage will be
          handled by the backend when API integration is enabled.
        </div>

      </div>
    </section>
  );
};

export default Reports;