import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Gauge,
  Info,
  BrainCircuit,
  Thermometer,
  Waves,
} from "lucide-react";

import { getLatestTelemetry } from "../api/telemetry";
import type { LatestTelemetry } from "../api/telemetry";

import { getLatestCycle } from "../api/cycles";
import type { TreatmentCycle } from "../api/cycles";

type QualityClass = "SAFE" | "WARNING" | "CRITICAL";

const DEVICE_ID = "JAL-001";
const POLL_INTERVAL_MS = 3000;

/* =========================================================
   FALLBACK CLASSIFICATION
   Used only when backend ML prediction is unavailable.
   These are prototype/application thresholds.
   ========================================================= */

const classifyWater = (data: LatestTelemetry): QualityClass => {
  const { ph, tds, turbidity } = data.point_b;

  const critical =
    ph < 5.5 ||
    ph > 9.0 ||
    tds > 1000 ||
    turbidity > 10;

  const warning =
    ph < 6.5 ||
    ph > 8.5 ||
    tds > 500 ||
    turbidity > 5;

  if (critical) return "CRITICAL";
  if (warning) return "WARNING";

  return "SAFE";
};

/* =========================================================
   QUALITY META
   ========================================================= */

const qualityMeta: Record<
  QualityClass,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  SAFE: {
    label: "SAFE",
    description:
      "Treated-water readings are within the prototype safe band.",
    icon: <CheckCircle2 size={20} />,
  },

  WARNING: {
    label: "WARNING",
    description:
      "One or more treated-water parameters need attention before acceptance.",
    icon: <AlertTriangle size={20} />,
  },

  CRITICAL: {
    label: "CRITICAL",
    description:
      "Treated-water readings are outside the prototype critical limits.",
    icon: <AlertTriangle size={20} />,
  },
};

/* =========================================================
   HELPERS
   ========================================================= */

const normalizeQualityClass = (
  prediction: string | null | undefined
): QualityClass | null => {
  if (!prediction) return null;

  const normalized = prediction.toUpperCase();

  if (
    normalized === "SAFE" ||
    normalized === "WARNING" ||
    normalized === "CRITICAL"
  ) {
    return normalized as QualityClass;
  }

  return null;
};

/* =========================================================
   METRIC CARD
   ========================================================= */

const MetricCard = ({
  icon,
  label,
  value,
  unit,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  status?: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
        {icon}
      </div>

      {status && (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-500">
          {status}
        </span>
      )}
    </div>

    <div className="mt-5 text-sm font-medium text-slate-500">
      {label}
    </div>

    <div className="mt-1 flex items-baseline gap-1">
      <span className="text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </span>

      {unit && (
        <span className="text-sm text-slate-500">
          {unit}
        </span>
      )}
    </div>
  </div>
);

/* =========================================================
   COMPARISON BAR
   ========================================================= */

const ComparisonBar = ({
  label,
  raw,
  treated,
  unit,
  efficiency,
  lowerIsBetter = true,
}: {
  label: string;
  raw: number;
  treated: number;
  unit: string;
  efficiency: number | null;
  lowerIsBetter?: boolean;
}) => {
  const max = Math.max(raw, treated, 1);

  const rawWidth = Math.min((raw / max) * 100, 100);
  const treatedWidth = Math.min((treated / max) * 100, 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {label}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Point A → Point B · {unit}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold text-slate-900">
            {efficiency === null
              ? "—"
              : `${efficiency.toFixed(1)}%`}
          </p>

          <p className="text-[10px] font-bold tracking-wider text-slate-400">
            REMOVAL
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Point A · Raw</span>
            <span>{raw.toFixed(1)}</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-400 transition-all"
              style={{ width: `${rawWidth}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Point B · Treated</span>
            <span>{treated.toFixed(1)}</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all"
              style={{ width: `${treatedWidth}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Activity size={13} />

        <span>
          {lowerIsBetter
            ? "Lower treated value indicates treatment reduction."
            : "Parameter is evaluated against its acceptable operating band."}
        </span>
      </div>
    </div>
  );
};

/* =========================================================
   WATER QUALITY PAGE
   ========================================================= */

const WaterQuality: React.FC = () => {
  const [telemetry, setTelemetry] =
    useState<LatestTelemetry | null>(null);

  const [latestCycle, setLatestCycle] =
    useState<TreatmentCycle | null>(null);

  const [backendOnline, setBackendOnline] =
    useState(false);

  const [mlOnline, setMlOnline] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [error, setError] = useState("");

  /* =======================================================
     LIVE DATA LOADER
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [telemetryResponse, cycleResponse] =
          await Promise.all([
            getLatestTelemetry(DEVICE_ID),
            getLatestCycle(DEVICE_ID),
          ]);

        if (!mounted) return;

        /* ---------------- TELEMETRY ---------------- */

        if (
          telemetryResponse.success &&
          telemetryResponse.data
        ) {
          setTelemetry(telemetryResponse.data);
          setBackendOnline(true);
          setLastUpdated(new Date());
          setError("");
        } else {
          setBackendOnline(false);
        }

        /* ---------------- ML / CYCLE ---------------- */

        if (
          cycleResponse.success &&
          cycleResponse.data
        ) {
          setLatestCycle(cycleResponse.data);

          const prediction =
            cycleResponse.data.ml?.water_quality?.prediction;

          setMlOnline(Boolean(prediction));
        } else {
          setLatestCycle(null);
          setMlOnline(false);
        }
      } catch {
        if (!mounted) return;

        setBackendOnline(false);
        setMlOnline(false);

        setError(
          "FastAPI backend is unavailable. Showing demo/fallback data."
        );
      }
    };

    load();

    const interval = window.setInterval(
      load,
      POLL_INTERVAL_MS
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  /* =======================================================
     DEMO TELEMETRY
     ======================================================= */

  const demoTelemetry: LatestTelemetry = useMemo(
    () => ({
      id: 0,
      device_id: "DEMO-JAL-001",
      timestamp: new Date().toISOString(),

      point_a: {
        tds: 620,
        turbidity: 34,
        temperature: 26.4,
      },

      point_b: {
        ph: 7.2,
        tds: 285,
        turbidity: 2.1,
        temperature: 26.1,
      },

      flow_rate_l_min: 1.65,
      pump_status: true,
    }),
    []
  );

  const data = telemetry ?? demoTelemetry;

  /* =======================================================
     ML WATER QUALITY RESULT
     ======================================================= */

  const mlPrediction =
    normalizeQualityClass(
      latestCycle?.ml?.water_quality?.prediction
    );

  const mlConfidence =
    latestCycle?.ml?.water_quality?.confidence ?? null;

  /*
   * ML is the primary cycle-level classification.
   * If no ML result exists, use the deterministic fallback.
   */

  const quality: QualityClass =
    mlPrediction ?? classifyWater(data);

  const meta = qualityMeta[quality];

  /* =======================================================
     CURRENT READING EFFICIENCY
     ======================================================= */

  const tdsEfficiency =
    data.point_a.tds > 0
      ? ((data.point_a.tds - data.point_b.tds) /
          data.point_a.tds) *
        100
      : null;

  const turbidityEfficiency =
    data.point_a.turbidity > 0
      ? ((data.point_a.turbidity -
          data.point_b.turbidity) /
          data.point_a.turbidity) *
        100
      : null;

  const sourceLabel = backendOnline
    ? "LIVE SENSOR DATA"
    : "DEMO DATA";

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-cyan-700">
              <Droplets size={15} />

              WATER QUALITY INTELLIGENCE
            </div>

            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Treated Water Quality
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Point B is the primary acceptance point. The
              system evaluates measured pH, TDS, turbidity
              and temperature, while Point A provides the
              raw-water baseline for treatment performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {/* BACKEND STATUS */}

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold tracking-wider ${
                backendOnline
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  backendOnline
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />

              {sourceLabel}
            </span>

            {/* ML STATUS */}

            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold tracking-wider ${
                mlOnline
                  ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <BrainCircuit size={14} />

              {mlOnline ? "ML ONLINE" : "ML WAITING"}
            </span>

            {lastUpdated && backendOnline && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                Updated{" "}
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* =================================================
            QUALITY STATUS
            ================================================= */}

        <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid lg:grid-cols-[1fr_auto]">

            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4">

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    quality === "SAFE"
                      ? "bg-emerald-50 text-emerald-600"
                      : quality === "WARNING"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {meta.icon}
                </div>

                <div>
                  <p className="text-xs font-bold tracking-[0.16em] text-slate-400">
                    CURRENT QUALITY CLASS
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold">
                      {meta.label}
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-500">
                      POINT B
                    </span>

                    {mlPrediction && (
                      <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-cyan-700">
                        ML CLASSIFIED
                      </span>
                    )}
                  </div>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    {meta.description}
                  </p>

                  {/* ML CONFIDENCE */}

                  {mlPrediction && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">

                      <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3">
                        <p className="text-[10px] font-bold tracking-wider text-cyan-700">
                          ML CONFIDENCE
                        </p>

                        <p className="mt-1 text-xl font-semibold text-slate-900">
                          {mlConfidence === null
                            ? "—"
                            : `${mlConfidence.toFixed(2)}%`}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-bold tracking-wider text-slate-400">
                          MODEL SCOPE
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          Latest completed cycle
                        </p>

                        {latestCycle && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            Cycle {latestCycle.cycle_number}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PROCESS STATE */}

            <div className="border-t border-slate-200 bg-slate-50 p-6 lg:w-80 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500">
                <Gauge size={15} />

                PROCESS STATE
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-semibold">
                    {data.flow_rate_l_min.toFixed(2)}
                  </p>

                  <p className="text-xs text-slate-500">
                    L/min flow
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    data.pump_status
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {data.pump_status
                    ? "PUMP ON"
                    : "PUMP OFF"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            ML INTELLIGENCE PANEL
            ================================================= */}

        <div className="mt-6 rounded-3xl border border-cyan-100 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <BrainCircuit size={21} />
              </div>

              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-cyan-700">
                  MACHINE LEARNING
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Water Quality Intelligence
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  CatBoost prediction generated from the
                  latest completed treatment cycle.
                </p>
              </div>
            </div>

            {latestCycle && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold tracking-wider text-slate-400">
                  ANALYSIS CYCLE
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Cycle {latestCycle.cycle_number}
                </p>
              </div>
            )}
          </div>

          {mlPrediction ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">

              {/* PREDICTION */}

              <div
                className={`rounded-2xl border p-5 ${
                  mlPrediction === "SAFE"
                    ? "border-emerald-200 bg-emerald-50/60"
                    : mlPrediction === "WARNING"
                      ? "border-amber-200 bg-amber-50/60"
                      : "border-red-200 bg-red-50/60"
                }`}
              >
                <p className="text-xs font-bold tracking-wider text-slate-500">
                  PREDICTION
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {mlPrediction}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Backend ML classification
                </p>
              </div>

              {/* CONFIDENCE */}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold tracking-wider text-slate-500">
                  CONFIDENCE
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {mlConfidence === null
                    ? "—"
                    : `${mlConfidence.toFixed(2)}%`}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  CatBoost model confidence
                </p>
              </div>

              {/* SOURCE */}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold tracking-wider text-slate-500">
                  DATA SOURCE
                </p>

                <p className="mt-2 text-lg font-semibold">
                  Cycle Engine
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Aggregated Point A + Point B telemetry
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <Info
                  size={18}
                  className="mt-0.5 shrink-0 text-slate-500"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    ML prediction not available yet
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The deterministic water-quality classification
                    remains active until a completed cycle with an
                    ML prediction is available.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50/50 px-4 py-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              Model note:
            </span>{" "}
            The ML prediction is based on the latest completed
            treatment cycle. Live sensor values below continue
            to update independently every 3 seconds.
          </div>
        </div>

        {/* =================================================
            POINT B METRICS
            ================================================= */}

        <div className="mt-6">

          <div className="mb-4 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />

            <h2 className="text-sm font-bold tracking-[0.14em] text-slate-500">
              TREATED WATER · POINT B
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <MetricCard
              icon={<Activity size={20} />}
              label="pH"
              value={data.point_b.ph.toFixed(2)}
              status="PRIMARY"
            />

            <MetricCard
              icon={<Waves size={20} />}
              label="TDS"
              value={data.point_b.tds.toFixed(0)}
              unit="ppm"
              status="PRIMARY"
            />

            <MetricCard
              icon={<Droplets size={20} />}
              label="Turbidity"
              value={data.point_b.turbidity.toFixed(2)}
              unit="NTU"
              status="PRIMARY"
            />

            <MetricCard
              icon={<Thermometer size={20} />}
              label="Temperature"
              value={data.point_b.temperature.toFixed(1)}
              unit="°C"
              status="SUPPORTING"
            />
          </div>
        </div>

        {/* =================================================
            A/B COMPARISON
            ================================================= */}

        <div className="mt-8">

          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Treatment impact
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Raw-water baseline versus treated-water output.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">

            <ComparisonBar
              label="TDS"
              raw={data.point_a.tds}
              treated={data.point_b.tds}
              unit="ppm"
              efficiency={tdsEfficiency}
            />

            <ComparisonBar
              label="Turbidity"
              raw={data.point_a.turbidity}
              treated={data.point_b.turbidity}
              unit="NTU"
              efficiency={turbidityEfficiency}
            />
          </div>
        </div>

        {/* =================================================
            SUPPORTING TELEMETRY
            ================================================= */}

        <div className="mt-8 grid gap-4 lg:grid-cols-3">

          {/* POINT A */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-xs font-bold tracking-wider text-slate-400">
              POINT A · RAW BASELINE
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3">

              <div>
                <p className="text-xs text-slate-400">
                  TDS
                </p>

                <p className="mt-1 font-semibold">
                  {data.point_a.tds.toFixed(0)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Turbidity
                </p>

                <p className="mt-1 font-semibold">
                  {data.point_a.turbidity.toFixed(1)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Temp.
                </p>

                <p className="mt-1 font-semibold">
                  {data.point_a.temperature.toFixed(1)}°C
                </p>
              </div>

            </div>
          </div>

          {/* DEVICE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-xs font-bold tracking-wider text-slate-400">
              DEVICE
            </p>

            <div className="mt-4 flex items-center justify-between">

              <div>
                <p className="font-semibold">
                  {data.device_id}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Telemetry ID #{data.id}
                </p>
              </div>

              <div
                className={`h-3 w-3 rounded-full ${
                  backendOnline
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
              />
            </div>
          </div>

          {/* LIMITATION NOTE */}

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">

            <div className="flex gap-3">

              <Info
                className="mt-0.5 shrink-0 text-cyan-700"
                size={18}
              />

              <div>

                <p className="text-sm font-semibold text-slate-900">
                  Classification note
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  SAFE / WARNING / CRITICAL is an
                  application-level prototype classification.
                  It is not a regulatory certification of
                  drinking-water safety. Heavy metals are not
                  directly measured by the current ESP32 sensor
                  set and should be verified through
                  laboratory/manual testing.
                </p>

              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {error}
          </div>
        )}

        {/* =================================================
            DATA PATH
            ================================================= */}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">

          <span className="font-semibold text-slate-700">
            Data path:
          </span>{" "}

          ESP32 → FastAPI → SQLite → Cycle Engine → ML →
          Water Quality

          <span className="ml-1">
            · Frontend remains presentation-only.
          </span>
        </div>

      </div>
    </div>
  );
};

export default WaterQuality;