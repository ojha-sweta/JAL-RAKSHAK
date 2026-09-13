import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Droplets,
  Gauge,
  Thermometer,
  Radio,
  Wifi,
  WifiOff,
  Clock3,
  RefreshCw,
  CircleCheck,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Minus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import {
  getLatestTelemetry,
  type LatestTelemetry,
} from '../api/telemetry';

type SensorStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

interface HistoryPoint {
  time: string;
  tdsA: number;
  turbidityA: number;
  tdsB: number;
  turbidityB: number;
  flow: number;
}

const MAX_HISTORY = 30;
const POLL_INTERVAL_MS = 2000;

const getSensorStatus = (
  type: 'tds' | 'turbidity' | 'ph' | 'temperature',
  value: number,
): SensorStatus => {
  if (!Number.isFinite(value)) return 'CRITICAL';

  switch (type) {
    case 'tds':
      if (value <= 500) return 'NORMAL';
      if (value <= 1000) return 'WARNING';
      return 'CRITICAL';

    case 'turbidity':
      if (value <= 5) return 'NORMAL';
      if (value <= 10) return 'WARNING';
      return 'CRITICAL';

    case 'ph':
      if (value >= 6.5 && value <= 8.5) return 'NORMAL';
      if (value >= 6 && value <= 9) return 'WARNING';
      return 'CRITICAL';

    case 'temperature':
      if (value >= 15 && value <= 35) return 'NORMAL';
      if (value >= 10 && value <= 40) return 'WARNING';
      return 'CRITICAL';

    default:
      return 'NORMAL';
  }
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatValue = (value: number, decimals = 1) => {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(decimals);
};

const StatusBadge: React.FC<{ status: SensorStatus }> = ({ status }) => {
  if (status === 'NORMAL') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <CircleCheck className="h-3 w-3" />
        Normal
      </span>
    );
  }

  if (status === 'WARNING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3 w-3" />
        Warning
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
      <AlertTriangle className="h-3 w-3" />
      Critical
    </span>
  );
};

const SensorCard: React.FC<{
  label: string;
  value: number;
  unit: string;
  type: 'tds' | 'turbidity' | 'ph' | 'temperature';
  icon: React.ElementType;
}> = ({ label, value, unit, type, icon: Icon }) => {
  const status = getSensorStatus(type, value);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400">
            <Icon className="h-4.5 w-4.5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {formatValue(value, type === 'ph' ? 2 : 1)}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {unit}
              </span>
            </div>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>
    </div>
  );
};

const LiveMonitoring: React.FC = () => {
  const [telemetry, setTelemetry] = useState<LatestTelemetry | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastPoll, setLastPoll] = useState<string>('—');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const historyRef = useRef<HistoryPoint[]>([]);

  const loadTelemetry = async () => {
    try {
      const response = await getLatestTelemetry();

      if (!response.success || !response.data) {
        throw new Error('No telemetry data available');
      }

      const next = response.data;
      const time = formatTime(next.timestamp);

      const point: HistoryPoint = {
        time,
        tdsA: next.point_a.tds,
        turbidityA: next.point_a.turbidity,
        tdsB: next.point_b.tds,
        turbidityB: next.point_b.turbidity,
        flow: next.flow_rate_l_min,
      };

      historyRef.current = [...historyRef.current, point].slice(-MAX_HISTORY);

      setTelemetry(next);
      setHistory(historyRef.current);
      setBackendConnected(true);
      setLastPoll(time);
      setErrorMessage('');
    } catch (error) {
      setBackendConnected(false);
      setErrorMessage(
        error instanceof Error ? error.message : 'Backend unavailable',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadTelemetry();
    }, 0);

    const interval = window.setInterval(() => {
      void loadTelemetry();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, []);

  const removalEfficiency = useMemo(() => {
    if (!telemetry || telemetry.point_a.tds <= 0) return null;

    return (
      ((telemetry.point_a.tds - telemetry.point_b.tds) /
        telemetry.point_a.tds) *
      100
    );
  }, [telemetry]);

  const turbidityEfficiency = useMemo(() => {
    if (!telemetry || telemetry.point_a.turbidity <= 0) return null;

    return (
      ((telemetry.point_a.turbidity - telemetry.point_b.turbidity) /
        telemetry.point_a.turbidity) *
      100
    );
  }, [telemetry]);

  const dataSource = backendConnected
    ? 'LIVE SENSOR DATA'
    : 'BACKEND OFFLINE';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800/80 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Live Monitoring
            </h1>

            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                backendConnected
                  ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300'
                  : 'bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300'
              }`}
            >
              {backendConnected ? (
                <Radio className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {dataSource}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time telemetry from Point A, treatment flow, and Point B.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
            {backendConnected ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-amber-500" />
            )}
            FastAPI
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
            <Clock3 className="h-3.5 w-3.5" />
            {lastPoll}
          </div>

          <button
            type="button"
            onClick={() => void loadTelemetry()}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-500/10 dark:text-cyan-300"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Connection banner */}
      <div
        className={`rounded-xl border p-4 ${
          backendConnected
            ? 'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10'
            : 'border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10'
        }`}
      >
        <div className="flex items-start gap-3">
          {backendConnected ? (
            <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}

          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {backendConnected
                ? `Device ${telemetry?.device_id ?? 'JAL-001'} telemetry stream connected`
                : 'Waiting for FastAPI telemetry'}
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {backendConnected
                ? 'React is receiving the latest reading through FastAPI. The browser does not connect directly to ESP32.'
                : errorMessage ||
                  'Start the FastAPI backend and ensure telemetry has been posted to the backend.'}
            </p>
          </div>
        </div>
      </div>

      {/* Current telemetry */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Current Telemetry
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Latest values returned by <code>/api/telemetry/latest</code>
            </p>
          </div>

          <span className="text-xs font-medium text-slate-400">
            Pump:{' '}
            <span
              className={
                telemetry?.pump_status
                  ? 'font-semibold text-emerald-500'
                  : 'font-semibold text-slate-500'
              }
            >
              {telemetry?.pump_status ? 'ACTIVE' : 'OFF'}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SensorCard
            label="Point A · TDS"
            value={telemetry?.point_a.tds ?? 0}
            unit="ppm"
            type="tds"
            icon={Gauge}
          />

          <SensorCard
            label="Point A · Turbidity"
            value={telemetry?.point_a.turbidity ?? 0}
            unit="NTU"
            type="turbidity"
            icon={Droplets}
          />

          <SensorCard
            label="Point B · TDS"
            value={telemetry?.point_b.tds ?? 0}
            unit="ppm"
            type="tds"
            icon={Gauge}
          />

          <SensorCard
            label="Point B · Turbidity"
            value={telemetry?.point_b.turbidity ?? 0}
            unit="NTU"
            type="turbidity"
            icon={Droplets}
          />

          <SensorCard
            label="Point B · pH"
            value={telemetry?.point_b.ph ?? 0}
            unit="pH"
            type="ph"
            icon={Activity}
          />

          <SensorCard
            label="Point A · Temperature"
            value={telemetry?.point_a.temperature ?? 0}
            unit="°C"
            type="temperature"
            icon={Thermometer}
          />

          <SensorCard
            label="Point B · Temperature"
            value={telemetry?.point_b.temperature ?? 0}
            unit="°C"
            type="temperature"
            icon={Thermometer}
          />

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 dark:bg-cyan-500/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Process Flow
                </p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatValue(telemetry?.flow_rate_l_min ?? 0, 2)}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    L/min
                  </span>
                </div>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <Droplets className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="mt-3 text-[11px] font-medium text-cyan-700 dark:text-cyan-300">
              Pump limit: 2.00 L/min
            </div>
          </div>
        </div>
      </section>

      {/* Performance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            TDS Removal Efficiency
          </p>

          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {removalEfficiency !== null
                ? `${formatValue(removalEfficiency, 1)}%`
                : '—'}
            </span>
            <ArrowDown className="h-5 w-5 text-emerald-500" />
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Calculated from current Point A → Point B TDS.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Turbidity Removal Efficiency
          </p>

          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {turbidityEfficiency !== null
                ? `${formatValue(turbidityEfficiency, 1)}%`
                : '—'}
            </span>
            <ArrowDown className="h-5 w-5 text-emerald-500" />
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Current process indicator; cycle averages remain backend-owned.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Treatment State
          </p>

          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {telemetry?.pump_status ? 'RUNNING' : 'IDLE'}
            </span>

            {telemetry?.pump_status ? (
              <ArrowUp className="h-5 w-5 text-emerald-500" />
            ) : (
              <Minus className="h-5 w-5 text-slate-400" />
            )}
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Based on the latest pump status reported by ESP32 telemetry.
          </p>
        </div>
      </div>

      {/* Trend chart */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Live Process Trend
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Last {MAX_HISTORY} telemetry points held in the browser for visualization.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              Point A TDS
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Point B TDS
            </span>
          </div>
        </div>

        <div className="mt-4 h-72 w-full">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={history}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="liveTdsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#334155"
                  opacity={0.15}
                />

                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={35}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '11px',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="tdsA"
                  name="Point A TDS"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#liveTdsGradient)"
                  fillOpacity={1}
                />

                <Area
                  type="monotone"
                  dataKey="tdsB"
                  name="Point B TDS"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950/30">
              {loading
                ? 'Waiting for telemetry...'
                : 'No live telemetry points available.'}
            </div>
          )}
        </div>
      </section>

      {/* Data provenance */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Data path
        </p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          ESP32 → FastAPI → SQLite → React Live Monitoring
        </p>
      </div>
    </div>
  );
};

export default LiveMonitoring;
