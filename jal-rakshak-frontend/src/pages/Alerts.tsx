import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Info,
  Radio,
  RefreshCw,
  ShieldAlert,
  Wifi,
} from 'lucide-react';

type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

type AlertCategory =
  | 'WATER QUALITY'
  | 'PROCESS'
  | 'DEVICE'
  | 'CONNECTIVITY'
  | 'SYSTEM';

interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category: AlertCategory;
  timestamp: string;
  source: string;
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'ALT-001',
    title: 'Elevated Raw Water TDS',
    description:
      'Point A TDS is currently above the configured monitoring level.',
    severity: 'WARNING',
    status: 'ACTIVE',
    category: 'WATER QUALITY',
    timestamp: '2 min ago',
    source: 'Point A TDS Sensor',
  },
  {
    id: 'ALT-002',
    title: 'Elevated Raw Water Turbidity',
    description:
      'Point A turbidity is currently flagged for monitoring.',
    severity: 'WARNING',
    status: 'ACTIVE',
    category: 'WATER QUALITY',
    timestamp: '4 min ago',
    source: 'Point A Turbidity Sensor',
  },
  {
    id: 'ALT-003',
    title: 'Treatment Cycle Improving',
    description:
      'Backend cycle analysis has detected positive efficiency improvement.',
    severity: 'INFO',
    status: 'ACKNOWLEDGED',
    category: 'PROCESS',
    timestamp: '8 min ago',
    source: 'Cycle Engine',
  },
  {
    id: 'ALT-004',
    title: 'ESP32 Connection Stable',
    description:
      'The treatment controller is connected and transmitting telemetry.',
    severity: 'INFO',
    status: 'RESOLVED',
    category: 'CONNECTIVITY',
    timestamp: '14 min ago',
    source: 'JAL-001',
  },
  {
    id: 'ALT-005',
    title: 'Treatment Process Active',
    description:
      'The treatment system is currently operating in the active cycle.',
    severity: 'INFO',
    status: 'ACTIVE',
    category: 'PROCESS',
    timestamp: '18 min ago',
    source: 'Treatment Controller',
  },
];

const severityConfig: Record<
  AlertSeverity,
  {
    label: string;
    icon: React.ReactNode;
    classes: string;
    iconClasses: string;
  }
> = {
  INFO: {
    label: 'INFO',
    icon: <Info className="h-4 w-4" />,
    classes:
      'border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    iconClasses: 'bg-cyan-500/10 text-cyan-500',
  },
  WARNING: {
    label: 'WARNING',
    icon: <AlertTriangle className="h-4 w-4" />,
    classes:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    iconClasses: 'bg-amber-500/10 text-amber-500',
  },
  CRITICAL: {
    label: 'CRITICAL',
    icon: <ShieldAlert className="h-4 w-4" />,
    classes:
      'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
    iconClasses: 'bg-red-500/10 text-red-500',
  },
};

const statusConfig: Record<
  AlertStatus,
  {
    label: string;
    classes: string;
  }
> = {
  ACTIVE: {
    label: 'ACTIVE',
    classes:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  ACKNOWLEDGED: {
    label: 'ACKNOWLEDGED',
    classes:
      'border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  },
  RESOLVED: {
    label: 'RESOLVED',
    classes:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
};

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [severityFilter, setSeverityFilter] = useState<
    'ALL' | AlertSeverity
  >('ALL');

  const [statusFilter, setStatusFilter] = useState<
    'ALL' | AlertStatus
  >('ALL');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const severityMatch =
        severityFilter === 'ALL' ||
        alert.severity === severityFilter;

      const statusMatch =
        statusFilter === 'ALL' ||
        alert.status === statusFilter;

      return severityMatch && statusMatch;
    });
  }, [alerts, severityFilter, statusFilter]);

  const activeCount = alerts.filter(
    (alert) => alert.status === 'ACTIVE',
  ).length;

  const warningCount = alerts.filter(
    (alert) => alert.severity === 'WARNING',
  ).length;

  const criticalCount = alerts.filter(
    (alert) => alert.severity === 'CRITICAL',
  ).length;

  const acknowledgeAlert = (id: string) => {
    setAlerts((previous) =>
      previous.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              status: 'ACKNOWLEDGED',
            }
          : alert,
      ),
    );
  };

  const resolveAlert = (id: string) => {
    setAlerts((previous) =>
      previous.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              status: 'RESOLVED',
            }
          : alert,
      ),
    );
  };

  return (
    <section className="min-h-full bg-slate-100/70 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />

                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              </span>

              <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                System Intelligence
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Alerts & Notifications
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Monitor water-quality events, treatment conditions,
              connectivity and system notifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              <Radio className="h-4 w-4 animate-pulse" />
              DEMO DATA
            </span>

            <span className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Bell className="h-4 w-4" />
              ALERT ENGINE READY
            </span>
          </div>
        </div>

        {/* Demo banner */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 dark:bg-amber-500/10">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />

            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Demo alert stream is active
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                These alerts are simulated for interface development.
                In the production architecture, FastAPI will generate
                alerts from telemetry, process conditions and backend
                decision logic.
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Alerts
              </p>

              <Bell className="h-5 w-5 text-amber-500" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              {activeCount}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Require attention
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Warnings
              </p>

              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              {warningCount}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Monitoring events
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Critical
              </p>

              <ShieldAlert className="h-5 w-5 text-red-500" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              {criticalCount}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Critical events
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Connectivity
              </p>

              <Wifi className="h-5 w-5 text-emerald-500" />
            </div>

            <p className="mt-3 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              ONLINE
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              ESP32 / backend channel
            </p>
          </div>
        </div>

        {/* Notification channels */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Notification Channels
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                External notification integrations will be controlled by
                the backend.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Dashboard
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  In-app alerts
                </p>
              </div>

              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-700 dark:text-emerald-300">
                ENABLED
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Telegram
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Backend notification channel
                </p>
              </div>

              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-cyan-700 dark:text-cyan-300">
                READY
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  SMS / Twilio
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Optional backend channel
                </p>
              </div>

              <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                OPTIONAL
              </span>
            </div>

          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Alert Stream
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Review current and historical system events.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              {/* Severity filter */}
              <div className="relative">
                <select
                  value={severityFilter}
                  onChange={(event) =>
                    setSeverityFilter(
                      event.target.value as 'ALL' | AlertSeverity,
                    )
                  }
                  className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                >
                  <option value="ALL">All Severity</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="CRITICAL">Critical</option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as 'ALL' | AlertStatus,
                    )
                  }
                  className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ACKNOWLEDGED">Acknowledged</option>
                  <option value="RESOLVED">Resolved</option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSeverityFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Alert list */}
        <div className="space-y-3">

          {filteredAlerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                No matching alerts
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Try changing the filters.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const severity = severityConfig[alert.severity];
              const status = statusConfig[alert.status];

              return (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">

                    {/* Icon */}
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${severity.iconClasses}`}
                    >
                      {severity.icon}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {alert.title}
                        </h4>

                        <span
                          className={`rounded-full border px-2 py-1 text-[9px] font-bold tracking-wider ${severity.classes}`}
                        >
                          {severity.label}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-1 text-[9px] font-bold tracking-wider ${status.classes}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {alert.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {alert.timestamp}
                        </span>

                        <span>
                          Source: {alert.source}
                        </span>

                        <span>
                          Category: {alert.category}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-2">
                      {alert.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-500/20 dark:text-cyan-300"
                        >
                          Acknowledge
                        </button>
                      )}

                      {alert.status === 'ACKNOWLEDGED' && (
                        <button
                          type="button"
                          onClick={() => resolveAlert(alert.id)}
                          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
                        >
                          Resolve
                        </button>
                      )}

                      {alert.status === 'RESOLVED' && (
                        <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

        </div>

        {/* Alert architecture */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Alert architecture
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                ESP32 telemetry will be received by FastAPI, where
                threshold evaluation, anomaly detection, process rules
                and notification decisions will be handled. The React
                application will display the resulting alerts rather
                than independently generating them.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Alerts;