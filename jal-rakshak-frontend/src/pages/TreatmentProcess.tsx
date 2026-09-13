import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  CheckCircle2,
  Circle,
  Droplets,
  Gauge,
  GitBranch,
  Info,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Thermometer,
  Waves,
  Wifi,
  WifiOff,
} from 'lucide-react';

import {
  getLatestTelemetry,
  type LatestTelemetry,
} from '../api/telemetry';

import {
  getDeviceCommand,
  type DeviceCommand,
} from '../api/device';

// ==================================================
// TYPES
// ==================================================

type StageState = 'ACTIVE' | 'MONITORING' | 'READY';

const POLL_INTERVAL_MS = 3000;

const DEVICE_ID = 'JAL-001';

// ==================================================
// HELPERS
// ==================================================

const formatValue = (
  value: number | null | undefined,
  decimals = 1,
) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return '—';
  }

  return value.toFixed(decimals);
};

const formatTime = (
  timestamp: string | null | undefined,
) => {
  if (!timestamp) return '—';

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const calculateEfficiency = (
  input: number | null | undefined,
  output: number | null | undefined,
) => {
  if (
    input === null ||
    input === undefined ||
    output === null ||
    output === undefined ||
    input <= 0
  ) {
    return null;
  }

  return ((input - output) / input) * 100;
};

// ==================================================
// STAGE CARD
// ==================================================

const StageCard: React.FC<{
  number: string;
  title: string;
  subtitle: string;
  description: string;
  state: StageState;
  icon: React.ElementType;
  metric?: string;
}> = ({
  number,
  title,
  subtitle,
  description,
  state,
  icon: Icon,
  metric,
}) => {
  const isActive = state === 'ACTIVE';

  return (
    <div
      className={`relative rounded-2xl border p-5 transition ${
        isActive
          ? 'border-cyan-500/30 bg-cyan-500/5 shadow-sm dark:bg-cyan-500/10'
          : 'border-slate-200/90 bg-white dark:border-slate-800/90 dark:bg-slate-900/60'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isActive
              ? 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Stage {number}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {isActive ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}

              {state}
            </span>
          </div>

          <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h3>

          <p className="mt-0.5 text-xs font-medium text-cyan-700 dark:text-cyan-300">
            {subtitle}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>

          {metric && (
            <div className="mt-3 inline-flex rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
              {metric}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================================================
// TREATMENT PROCESS
// ==================================================

const TreatmentProcess: React.FC = () => {
  // ------------------------------------------------
  // TELEMETRY STATE
  // ------------------------------------------------

  const [telemetry, setTelemetry] =
    useState<LatestTelemetry | null>(null);

  // ------------------------------------------------
  // DEVICE COMMAND STATE
  // ------------------------------------------------

  const [deviceCommand, setDeviceCommand] =
    useState<DeviceCommand | null>(null);

  // ------------------------------------------------
  // CONNECTION / UI STATE
  // ------------------------------------------------

  const [backendConnected, setBackendConnected] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [lastUpdated, setLastUpdated] =
    useState('—');

  // ==================================================
  // LOAD TELEMETRY
  // ==================================================

  const loadTelemetry = async () => {
    try {
      const response =
        await getLatestTelemetry(DEVICE_ID);

      if (
        !response.success ||
        !response.data
      ) {
        throw new Error(
          'No telemetry data available',
        );
      }

      setTelemetry(response.data);

      setBackendConnected(true);

      setLastUpdated(
        formatTime(
          response.data.timestamp,
        ),
      );
    } catch {
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // LOAD DEVICE COMMAND
  // ==================================================

  const loadDeviceCommand = async () => {
    try {
      const response =
        await getDeviceCommand(DEVICE_ID);

      if (
        response.success &&
        response.command_available &&
        response.command
      ) {
        setDeviceCommand(
          response.command,
        );
      } else {
        setDeviceCommand(null);
      }
    } catch {
      setDeviceCommand(null);
    }
  };

  // ==================================================
  // INITIAL LOAD + POLLING
  // ==================================================

  useEffect(() => {
    const initialLoad =
      window.setTimeout(() => {
        void loadTelemetry();
        void loadDeviceCommand();
      }, 0);

    const interval =
      window.setInterval(() => {
        void loadTelemetry();
        void loadDeviceCommand();
      }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, []);

  // ==================================================
  // EFFICIENCY
  // ==================================================

  const tdsEfficiency = useMemo(
    () =>
      calculateEfficiency(
        telemetry?.point_a.tds,
        telemetry?.point_b.tds,
      ),
    [telemetry],
  );

  const turbidityEfficiency =
    useMemo(
      () =>
        calculateEfficiency(
          telemetry?.point_a.turbidity,
          telemetry?.point_b.turbidity,
        ),
      [telemetry],
    );

  // ==================================================
  // PUMP
  // ==================================================

  const pumpRunning =
    telemetry?.pump_status ?? false;

  // ==================================================
  // COMMAND DISPLAY HELPERS
  // ==================================================

  const commandAvailable =
    deviceCommand !== null;

  const commandIsPending =
    deviceCommand?.status === 'PENDING';

  const commandIsExecuted =
    deviceCommand?.status === 'EXECUTED';

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800/80 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex flex-wrap items-center gap-2.5">

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Treatment Process
            </h1>

            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                backendConnected
                  ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300'
                  : 'bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300'
              }`}
            >
              {backendConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}

              {backendConnected
                ? 'LIVE PROCESS DATA'
                : 'BACKEND OFFLINE'}
            </span>

          </div>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Adaptive treatment flow, process state, and Point A → Point B performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
            <Waves className="h-3.5 w-3.5 text-cyan-500" />
            {telemetry?.device_id ?? DEVICE_ID}
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
            {lastUpdated}
          </div>

          <button
            type="button"
            onClick={() => {
              void loadTelemetry();
              void loadDeviceCommand();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-500/10 dark:text-cyan-300"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                loading ? 'animate-spin' : ''
              }`}
            />

            Refresh
          </button>

        </div>
      </div>

      {/* ==================================================
          PROCESS STATE
      ================================================== */}

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Current Process State
            </p>

            <div className="mt-2 flex items-center gap-3">

              <span
                className={`relative flex h-3 w-3 rounded-full ${
                  pumpRunning
                    ? 'bg-emerald-500'
                    : 'bg-slate-400'
                }`}
              >
                {pumpRunning && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-50" />
                )}
              </span>

              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {pumpRunning
                  ? 'PURIFICATION RUNNING'
                  : 'SYSTEM IDLE'}
              </h2>

            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {pumpRunning
                ? 'Pump is active and the treatment line is processing water.'
                : 'Pump is currently off; no active treatment flow is reported.'}
            </p>

          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Flow
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatValue(
                  telemetry?.flow_rate_l_min,
                  2,
                )}

                <span className="ml-1 text-[10px] font-medium text-slate-400">
                  L/min
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Pump
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                {pumpRunning ? 'ON' : 'OFF'}
              </p>
            </div>

            <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-1 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Data Source
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                {backendConnected ? 'LIVE' : '—'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          DEVICE COMMAND
      ================================================== */}

      <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 dark:bg-cyan-500/10">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />

              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Device Command
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Latest command generated by the backend treatment-control engine.
            </p>

          </div>

          {commandAvailable ? (
            <div className="flex flex-wrap items-center gap-3">

              <div className="rounded-xl border border-cyan-500/20 bg-white px-4 py-3 dark:border-cyan-500/20 dark:bg-slate-950/40">

                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Command
                </p>

                <p className="mt-1 text-lg font-bold text-cyan-700 dark:text-cyan-300">
                  {deviceCommand.command}
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">

                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </p>

                <p
                  className={`mt-1 text-sm font-bold ${
                    commandIsPending
                      ? 'text-amber-600 dark:text-amber-400'
                      : commandIsExecuted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {deviceCommand.status}
                </p>

              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">

                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Cycle
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {deviceCommand.cycle_number !== null
                    ? `#${deviceCommand.cycle_number}`
                    : '—'}
                </p>

              </div>

            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
              No pending device command
            </div>
          )}

        </div>
      </section>

      {/* ==================================================
          PROCESS FLOW
      ================================================== */}

      <section>

        <div className="mb-4">

          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Adaptive Treatment Flow
          </h2>

          <p className="mt-0.5 text-xs text-slate-400">
            The control logic is designed around measurement → treatment → verification → decision.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] xl:items-stretch">

          <StageCard
            number="01"
            title="Raw Water Intake"
            subtitle="POINT A · BASELINE"
            description="Raw-water indicators are captured before treatment to establish the incoming TDS, turbidity, and temperature condition."
            state={
              pumpRunning
                ? 'ACTIVE'
                : 'MONITORING'
            }
            icon={Droplets}
            metric={
              telemetry
                ? `TDS ${formatValue(
                    telemetry.point_a.tds,
                  )} ppm · Turbidity ${formatValue(
                    telemetry.point_a.turbidity,
                  )} NTU`
                : 'Awaiting telemetry'
            }
          />

          <div className="hidden items-center justify-center xl:flex">
            <ArrowDown className="h-5 w-5 -rotate-90 text-slate-300 dark:text-slate-700" />
          </div>

          <StageCard
            number="02"
            title="Adaptive Treatment"
            subtitle="SWAPPABLE MEDIA"
            description="The treatment stage can use swappable filtration media selected or tuned according to the contamination profile."
            state={
              pumpRunning
                ? 'ACTIVE'
                : 'READY'
            }
            icon={SlidersHorizontal}
            metric="Media configuration · Process control"
          />

          <div className="hidden items-center justify-center xl:flex">
            <ArrowDown className="h-5 w-5 -rotate-90 text-slate-300 dark:text-slate-700" />
          </div>

          <StageCard
            number="03"
            title="Treated Water Check"
            subtitle="POINT B · VERIFICATION"
            description="After treatment, pH, TDS, turbidity, temperature, and process flow are observed to verify the treatment outcome."
            state={
              backendConnected
                ? 'ACTIVE'
                : 'MONITORING'
            }
            icon={ShieldCheck}
            metric={
              telemetry
                ? `TDS ${formatValue(
                    telemetry.point_b.tds,
                  )} ppm · Turbidity ${formatValue(
                    telemetry.point_b.turbidity,
                  )} NTU`
                : 'Awaiting telemetry'
            }
          />

          <div className="hidden items-center justify-center xl:flex">
            <ArrowDown className="h-5 w-5 -rotate-90 text-slate-300 dark:text-slate-700" />
          </div>

          <StageCard
            number="04"
            title="Decision / Next Cycle"
            subtitle="CLOSED-LOOP CONTROL"
            description="Backend cycle logic compares treatment performance over completed cycles and can issue the next device command."
            state={
              commandAvailable
                ? 'ACTIVE'
                : 'READY'
            }
            icon={GitBranch}
            metric={
              commandAvailable
                ? `${deviceCommand.command} · ${deviceCommand.status}`
                : 'Measure → Calculate → Decide → Control'
            }
          />

        </div>
      </section>

      {/* ==================================================
          CURRENT READINGS
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">

          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">

            <Gauge className="h-4 w-4 text-cyan-500" />

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Treatment Performance
              </h2>

              <p className="text-[11px] text-slate-400">
                Current reading-level indicators
              </p>
            </div>

          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/40">

              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                TDS Removal
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {tdsEfficiency === null
                  ? '—'
                  : `${formatValue(
                      tdsEfficiency,
                    )}%`}
              </p>

              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <span>
                  {formatValue(
                    telemetry?.point_a.tds,
                  )}{' '}
                  →{' '}
                  {formatValue(
                    telemetry?.point_b.tds,
                  )}{' '}
                  ppm
                </span>
              </div>

            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/40">

              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Turbidity Removal
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {turbidityEfficiency === null
                  ? '—'
                  : `${formatValue(
                      turbidityEfficiency,
                    )}%`}
              </p>

              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <span>
                  {formatValue(
                    telemetry?.point_a.turbidity,
                  )}{' '}
                  →{' '}
                  {formatValue(
                    telemetry?.point_b.turbidity,
                  )}{' '}
                  NTU
                </span>
              </div>

            </div>

          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">

          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">

            <ActivityIcon />

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Process Telemetry
              </h2>

              <p className="text-[11px] text-slate-400">
                Current operating parameters
              </p>
            </div>

          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">

            <Metric
              icon={Gauge}
              label="Flow Rate"
              value={formatValue(
                telemetry?.flow_rate_l_min,
                2,
              )}
              unit="L/min"
            />

            <Metric
              icon={Droplets}
              label="Point B pH"
              value={formatValue(
                telemetry?.point_b.ph,
                2,
              )}
              unit="pH"
            />

            <Metric
              icon={Thermometer}
              label="Point A Temp"
              value={formatValue(
                telemetry?.point_a.temperature,
              )}
              unit="°C"
            />

            <Metric
              icon={Thermometer}
              label="Point B Temp"
              value={formatValue(
                telemetry?.point_b.temperature,
              )}
              unit="°C"
            />

          </div>
        </section>

      </div>

      {/* ==================================================
          CLOSED LOOP
      ================================================== */}

      <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 dark:bg-cyan-500/10">

        <div className="flex items-start gap-3">

          <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400" />

          <div>

            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Closed-Loop Treatment Logic
            </h2>

            <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-600 dark:text-slate-400">
              Each treatment cycle is built around the measured process response.
              FastAPI aggregates readings into cycles, calculates removal efficiency,
              evaluates improvement against previous completed cycles, and determines
              the backend action. The ESP32 can then receive and acknowledge that
              command before the next measurement cycle.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">

              {[
                'Measure',
                'Aggregate',
                'Calculate',
                'Evaluate',
                'Decide',
                'Control',
                'Measure Again',
              ].map((item, index) => (
                <React.Fragment key={item}>

                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 dark:border-slate-800 dark:bg-slate-950/50">
                    {item}
                  </span>

                  {index < 6 && (
                    <ArrowDown className="h-3 w-3 -rotate-90 text-cyan-500" />
                  )}

                </React.Fragment>
              ))}

            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          ENGINEERING NOTE
      ================================================== */}

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">

        <div className="flex items-start gap-2.5">

          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

          <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            Online prototype sensing covers pH, TDS, turbidity, temperature, and flow.
            Heavy-metal species are not directly measured by the current ESP32 sensor set;
            reference/laboratory characterization can inform future media selection.
            The frontend therefore does not fabricate heavy-metal sensor readings.
          </p>

        </div>

      </div>

    </div>
  );
};

// ==================================================
// SUPPORT COMPONENTS
// ==================================================

const ActivityIcon: React.FC = () => (
  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
    <Waves className="h-4 w-4" />
  </div>
);

const Metric: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
}> = ({
  icon: Icon,
  label,
  value,
  unit,
}) => (
  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/40">

    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-400">
      <Icon className="h-4 w-4" />
    </div>

    <div className="min-w-0">

      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
        {value}{' '}
        <span className="text-[10px] font-medium text-slate-400">
          {unit}
        </span>
      </p>

    </div>
  </div>
);

export default TreatmentProcess;