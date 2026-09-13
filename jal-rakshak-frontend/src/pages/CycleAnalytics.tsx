import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getCycleHistory, getLatestCycle } from "../api/cycles";

interface CycleRecord {
  id?: number;
  device_id?: string;
  cycle_number: number;
  status: string;
  start_time?: string | null;
  end_time?: string | null;
  elapsed_time?: number | null;
  reading_count?: number | null;
  averages?: {
    point_a_tds?: number | null;
    point_a_turbidity?: number | null;
    point_a_temperature?: number | null;
    point_b_ph?: number | null;
    point_b_tds?: number | null;
    point_b_turbidity?: number | null;
    point_b_temperature?: number | null;
    flow_rate_l_min?: number | null;
  };
  performance?: {
    tds_removal_efficiency?: number | null;
    turbidity_removal_efficiency?: number | null;
    filter_health_score_pct?: number | null;
    efficiency_improvement?: number | null;
    backend_action?: string | null;
  };
  decision?: {
    improvement_condition?: boolean | null;
    backend_action?: string | null;
  };
  ml?: {
    filter_health?: {
      prediction?: string | null;
      confidence?: number | null;
    };
    water_quality?: {
      prediction?: string | null;
      confidence?: number | null;
    };
  };
}

const DEMO_CYCLES: CycleRecord[] = Array.from({ length: 8 }, (_, index) => {
  const cycle = index + 1;
  const tdsEfficiency = 79.8 + cycle * 0.85;
  const turbidityEfficiency = 89.5 + cycle * 0.65;
  const filterHealth = 77 + cycle * 1.4;

  return {
    id: cycle,
    device_id: "DEMO-JAL-001",
    cycle_number: cycle,
    status: "COMPLETED",
    reading_count: 12,
    start_time: new Date(Date.now() - (8 - cycle) * 12 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - (8 - cycle) * 12 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
    averages: {
      point_a_tds: 620,
      point_a_turbidity: 34,
      point_a_temperature: 26.4,
      point_b_ph: 7.1 + cycle * 0.01,
      point_b_tds: 620 * (1 - tdsEfficiency / 100),
      point_b_turbidity: 34 * (1 - turbidityEfficiency / 100),
      point_b_temperature: 26.1,
      flow_rate_l_min: 1.45 + cycle * 0.025,
    },
    performance: {
      tds_removal_efficiency: tdsEfficiency,
      turbidity_removal_efficiency: turbidityEfficiency,
      filter_health_score_pct: filterHealth,
      efficiency_improvement: cycle === 1 ? null : 0.7 + cycle * 0.03,
      backend_action: cycle <= 3 ? "NO_ACTION" : "CONTINUE",
    },
    decision: {
      improvement_condition: cycle > 3,
      backend_action: cycle <= 3 ? "NO_ACTION" : "CONTINUE",
    },
  };
});

const numberOr = (value: number | null | undefined, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const actionLabel = (action?: string | null) => {
  switch (action) {
    case "OPTIMIZE":
      return "OPTIMIZE";
    case "CONTINUE":
      return "CONTINUE";
    case "HOLD":
      return "HOLD";
    default:
      return "NO ACTION";
  }
};

const actionClass = (action?: string | null) => {
  switch (action) {
    case "OPTIMIZE":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "HOLD":
      return "bg-red-50 text-red-700 border-red-200";
    case "CONTINUE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const StatCard = ({
  icon,
  label,
  value,
  unit,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  subtext: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
      {icon}
    </div>
    <p className="mt-4 text-xs font-bold tracking-wider text-slate-400">{label}</p>
    <div className="mt-1 flex items-baseline gap-1">
      <span className="text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </span>
      {unit && <span className="text-sm text-slate-500">{unit}</span>}
    </div>
    <p className="mt-1 text-xs text-slate-500">{subtext}</p>
  </div>
);

const CycleAnalytics: React.FC = () => {
  const [cycles, setCycles] = useState<CycleRecord[]>([]);
  const [latestCycle, setLatestCycle] = useState<CycleRecord | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [historyResponse, latestResponse] = await Promise.all([
          getCycleHistory(30, "JAL-001"),
          getLatestCycle("JAL-001"),
        ]);

        if (!mounted) return;

        if (
          historyResponse?.success &&
          Array.isArray(historyResponse.data)
        ) {
          setCycles(historyResponse.data);
        }

        if (latestResponse?.success && latestResponse.data) {
          setLatestCycle(latestResponse.data);
        }

        setBackendOnline(
          Boolean(historyResponse?.success || latestResponse?.success)
        );
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Cycle analytics backend request failed:", error);
        if (!mounted) return;
        setBackendOnline(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const sortedCycles = useMemo(() => {
    const source = cycles.length ? cycles : DEMO_CYCLES;
    return [...source].sort((a, b) => a.cycle_number - b.cycle_number);
  }, [cycles]);

  const displayLatest =
    latestCycle ??
    (sortedCycles.length ? sortedCycles[sortedCycles.length - 1] : null);

  const chartData = useMemo(
    () =>
      sortedCycles.map((cycle) => ({
        cycle: cycle.cycle_number,
        tds: numberOr(cycle.performance?.tds_removal_efficiency),
        turbidity: numberOr(
          cycle.performance?.turbidity_removal_efficiency
        ),
        health: numberOr(cycle.performance?.filter_health_score_pct),
        improvement: numberOr(cycle.performance?.efficiency_improvement),
      })),
    [sortedCycles]
  );

  const completedCycles = sortedCycles.filter(
    (cycle) => cycle.status === "COMPLETED"
  );

  const avgTdsEfficiency =
    completedCycles.length > 0
      ? completedCycles.reduce(
          (sum, cycle) =>
            sum + numberOr(cycle.performance?.tds_removal_efficiency),
          0
        ) / completedCycles.length
      : 0;

  const avgTurbidityEfficiency =
    completedCycles.length > 0
      ? completedCycles.reduce(
          (sum, cycle) =>
            sum + numberOr(cycle.performance?.turbidity_removal_efficiency),
          0
        ) / completedCycles.length
      : 0;

  const filterHealthCycles = completedCycles.filter(
    (cycle) =>
      typeof cycle.performance?.filter_health_score_pct === "number" &&
      Number.isFinite(cycle.performance.filter_health_score_pct) &&
      cycle.performance.filter_health_score_pct > 0
  );

  const avgFilterHealth =
    filterHealthCycles.length > 0
      ? filterHealthCycles.reduce(
          (sum, cycle) =>
            sum + numberOr(cycle.performance?.filter_health_score_pct),
          0
        ) / filterHealthCycles.length
      : 0;

  const latestImprovement = numberOr(
    displayLatest?.performance?.efficiency_improvement,
    0
  );

  const currentAction =
    displayLatest?.decision?.backend_action ??
    displayLatest?.performance?.backend_action ??
    "NO_ACTION";

  const mlFilterHealth =
    displayLatest?.ml?.filter_health?.prediction ?? null;
  const mlFilterConfidence =
    displayLatest?.ml?.filter_health?.confidence ?? null;
  const mlWaterQuality =
    displayLatest?.ml?.water_quality?.prediction ?? null;
  const mlWaterConfidence =
    displayLatest?.ml?.water_quality?.confidence ?? null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-cyan-700">
              <BarChart3 size={15} />
              CYCLE PERFORMANCE INTELLIGENCE
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Cycle Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Cycle-level treatment performance, efficiency improvement,
              filter-health scoring and backend control decisions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold tracking-wider ${
                backendOnline
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  backendOnline ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {backendOnline ? "LIVE BACKEND DATA" : "DEMO DATA"}
            </span>

            {lastUpdated && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Latest decision */}
        <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <Zap size={21} />
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-slate-400">
                  LATEST BACKEND DECISION
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold">
                    {actionLabel(currentAction)}
                  </h2>
                  <span
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wider ${actionClass(
                      currentAction
                    )}`}
                  >
                    CYCLE {displayLatest?.cycle_number ?? "—"}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  The backend evaluates completed cycles after aggregation.
                  Decisions remain backend-owned and are exposed here for
                  monitoring and operator visibility.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-107.5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold tracking-wider text-slate-400">
                  TDS EFFICIENCY
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {numberOr(
                    displayLatest?.performance?.tds_removal_efficiency
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold tracking-wider text-slate-400">
                  IMPROVEMENT
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {latestImprovement.toFixed(2)}
                  <span className="text-xs text-slate-500"> pp</span>
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[10px] font-bold tracking-wider text-slate-400">
                  CONDITION
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {displayLatest?.decision?.improvement_condition
                    ? "TRUE"
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ML intelligence */}
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
                  Cycle Intelligence
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Backend CatBoost predictions for the latest completed cycle.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold tracking-wider text-slate-400">
                ANALYSIS CYCLE
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Cycle {displayLatest?.cycle_number ?? "—"}
              </p>
            </div>
          </div>

          {mlFilterHealth || mlWaterQuality ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400">
                      FILTER HEALTH
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {mlFilterHealth ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold tracking-wider text-slate-400">
                      CONFIDENCE
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {mlFilterConfidence == null
                        ? "—"
                        : `${mlFilterConfidence.toFixed(2)}%`}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  ML prediction from cycle-level process and efficiency features.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400">
                      WATER QUALITY
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {mlWaterQuality ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold tracking-wider text-slate-400">
                      CONFIDENCE
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {mlWaterConfidence == null
                        ? "—"
                        : `${mlWaterConfidence.toFixed(2)}%`}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  ML prediction from aggregated Point A + Point B telemetry.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-500">
              ML predictions are not available for the latest completed cycle.
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Activity size={20} />}
            label="COMPLETED CYCLES"
            value={String(completedCycles.length)}
            subtext="Aggregated by the backend cycle engine"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="AVG TDS REMOVAL"
            value={avgTdsEfficiency.toFixed(1)}
            unit="%"
            subtext="Across completed cycles"
          />
          <StatCard
            icon={<Waves size={20} />}
            label="AVG TURBIDITY REMOVAL"
            value={avgTurbidityEfficiency.toFixed(1)}
            unit="%"
            subtext="Treatment performance"
          />
          <StatCard
            icon={<ShieldCheck size={20} />}
            label="AVG FILTER HEALTH"
            value={avgFilterHealth.toFixed(1)}
            unit="%"
            subtext="Calculated cycles only"
          />
        </div>

        {/* Charts */}
        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Removal efficiency trend</h2>
                <p className="mt-1 text-xs text-slate-500">
                  TDS and turbidity removal by completed cycle.
                </p>
              </div>
              <div className="rounded-xl bg-cyan-50 p-2 text-cyan-700">
                <TrendingUp size={17} />
              </div>
            </div>

            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="cycle"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                    }}
                    formatter={(value, name) => {
                      const safeValue =
                        typeof value === "number"
                          ? value
                          : typeof value === "string"
                            ? Number(value)
                            : 0;

                      return [
                        `${safeValue.toFixed(1)}%`,
                        name === "tds" ? "TDS" : "Turbidity",
                      ];
                    }}
                    labelFormatter={(cycle) => `Cycle ${cycle}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="tds"
                    stroke="#0891b2"
                    fill="#cffafe"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="turbidity"
                    stroke="#64748b"
                    fill="#f1f5f9"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Filter health trajectory</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Flow + turbidity-efficiency engineering score.
                </p>
              </div>
              <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                <Gauge size={17} />
              </div>
            </div>

            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="cycle"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                    }}
                    formatter={(value) => [
                      `${Number(value ?? 0).toFixed(1)}%`,
                      "Filter health",
                    ]}
                    labelFormatter={(cycle) => `Cycle ${cycle}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="health"
                    stroke="#0f766e"
                    fill="#ccfbf1"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cycle table */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Cycle history</h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest backend-aggregated treatment cycles.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw size={14} />
              Auto-refresh: 5 s
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] font-bold tracking-wider text-slate-400">
                  <th className="px-5 py-3">CYCLE</th>
                  <th className="px-5 py-3">STATUS</th>
                  <th className="px-5 py-3">READINGS</th>
                  <th className="px-5 py-3">TDS EFF.</th>
                  <th className="px-5 py-3">TURBIDITY EFF.</th>
                  <th className="px-5 py-3">FILTER HEALTH</th>
                  <th className="px-5 py-3">IMPROVEMENT</th>
                  <th className="px-5 py-3">ML QUALITY</th>
                  <th className="px-5 py-3">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {[...sortedCycles].reverse().map((cycle) => {
                  const improvement =
                    cycle.performance?.efficiency_improvement;
                  const action =
                    cycle.decision?.backend_action ??
                    cycle.performance?.backend_action ??
                    "NO_ACTION";

                  return (
                    <tr
                      key={cycle.id ?? cycle.cycle_number}
                      className="border-t border-slate-100 text-sm"
                    >
                      <td className="px-5 py-4 font-semibold">
                        #{cycle.cycle_number}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-700">
                          {cycle.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {cycle.reading_count ?? "—"}
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {numberOr(
                          cycle.performance?.tds_removal_efficiency
                        ).toFixed(1)}
                        %
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {numberOr(
                          cycle.performance?.turbidity_removal_efficiency
                        ).toFixed(1)}
                        %
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {numberOr(
                          cycle.performance?.filter_health_score_pct
                        ).toFixed(1)}
                        %
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            improvement === null ||
                            improvement === undefined
                              ? "text-slate-400"
                              : improvement >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                          }`}
                        >
                          {improvement !== null &&
                          improvement !== undefined ? (
                            improvement >= 0 ? (
                              <ArrowUpRight size={14} />
                            ) : (
                              <ArrowDownRight size={14} />
                            )
                          ) : null}
                          {improvement === null ||
                          improvement === undefined
                            ? "—"
                            : `${improvement.toFixed(2)} pp`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-cyan-700">
                          {cycle.ml?.water_quality?.prediction ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider ${actionClass(
                            action
                          )}`}
                        >
                          {actionLabel(action)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formula / architecture note */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-cyan-700" size={19} />
              <div>
                <p className="text-sm font-semibold">Filter-health engineering score</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  H = 0.4 × (Q / 2.0) + 0.6 × (turbidity-efficiency / 80)
                  <br />
                  The flow sensor is the process-line measurement immediately
                  before Point B. This score is used for engineering
                  monitoring, not as a circular ML input.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={19} />
              <div>
                <p className="text-sm font-semibold">Closed-loop sequence</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Measure → Aggregate → Calculate → Evaluate → Decide →
                  Control → Measure again. Cycle Analytics visualizes the
                  backend result; it does not make the control decision.
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
            <RefreshCw size={13} className="animate-spin" />
            Loading cycle history…
          </div>
        )}
      </div>
    </div>
  );
};

export default CycleAnalytics;
