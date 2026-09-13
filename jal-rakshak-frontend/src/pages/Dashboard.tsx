import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
  Activity,
  Droplets,
  Gauge,
  Thermometer,
  ShieldCheck,
  Cpu,
  Zap,
  ArrowRight,
  CircleCheck,
  AlertTriangle,
  Clock,
  Radio,
  Workflow,
  TrendingUp,
  CheckCircle2,
  Info,
} from 'lucide-react';

import type {
  SensorStatus,
  SensorTrend,
  TreatmentStage,
} from '../types/dashboard';

import {
  getLatestTelemetry,
  type LatestTelemetry,
} from '../api/telemetry';
import {
  getCycleHistory,
  getLatestCycle,
} from '../api/cycles';

// ==================================================
// DASHBOARD DATA TYPES
//
// FIX: These types are the reason for the
// "Type 'string' is not assignable to type
// 'SensorStatus' / 'SensorTrend'" errors.
//
// MOCK_DASHBOARD_DATA and the object built inside
// the `displayData` useMemo were plain object
// literals with no type annotation, so TypeScript
// widened string literals like 'NORMAL' / 'STABLE'
// to the generic `string` type instead of keeping
// them as the SensorStatus / SensorTrend unions.
//
// By declaring SensorReading + DashboardData below
// and annotating both objects with them, the
// literals are checked (and narrowed) against the
// correct union types at the point they're written.
// ==================================================

interface SensorReading {
  value: number;
  unit: string;
  status: SensorStatus;
  trend: SensorTrend;
  timestamp: string;
}

interface DashboardData {
  point_a: {
    tds: SensorReading;
    turbidity: SensorReading;
    temperature: SensorReading;
  };
  point_b: {
    ph: SensorReading;
    tds: SensorReading;
    turbidity: SensorReading;
    temperature: SensorReading;
  };
  system: {
    system_status: string;
    esp32_connection: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
    backend_connection: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
    treatment_status: string;
    pump_status: boolean;
    last_updated: string;
  };
  cycle: {
    cycle_number: number;
    cycle_status: string;
    cycle_start_time: string;
    elapsed_time: number;
    completed_cycles: number;
    current_efficiency: number | null;
    previous_cycle_efficiency: number | null;
    consecutive_efficiency_improvement: number | null;
    max_cycle: number;
    improvement_condition: boolean;
    backend_action: string;
  };
  treatment: {
    current_stage: TreatmentStage;
    pump_status: boolean;
    process_status: string;
  };
}

// ==================================================
// FALLBACK DEMO DATA
// ==================================================

const MOCK_DASHBOARD_DATA: DashboardData = {
  point_a: {
    tds: {
      value: 680,
      unit: 'ppm',
      status: 'WARNING',
      trend: 'UP',
      timestamp: '12:04:15 PM',
    },
    turbidity: {
      value: 14.2,
      unit: 'NTU',
      status: 'WARNING',
      trend: 'STABLE',
      timestamp: '12:04:15 PM',
    },
    temperature: {
      value: 26.4,
      unit: '°C',
      status: 'NORMAL',
      trend: 'STABLE',
      timestamp: '12:04:15 PM',
    },
  },

  point_b: {
    ph: {
      value: 7.2,
      unit: 'pH',
      status: 'NORMAL',
      trend: 'STABLE',
      timestamp: '12:04:18 PM',
    },
    tds: {
      value: 110,
      unit: 'ppm',
      status: 'NORMAL',
      trend: 'DOWN',
      timestamp: '12:04:18 PM',
    },
    turbidity: {
      value: 0.8,
      unit: 'NTU',
      status: 'NORMAL',
      trend: 'DOWN',
      timestamp: '12:04:18 PM',
    },
    temperature: {
      value: 25.8,
      unit: '°C',
      status: 'NORMAL',
      trend: 'STABLE',
      timestamp: '12:04:18 PM',
    },
  },

  system: {
    system_status: 'ONLINE',
    esp32_connection: 'CONNECTED',
    backend_connection: 'CONNECTED',
    treatment_status: 'ONLINE',
    pump_status: true,
    last_updated: 'Just now',
  },

  cycle: {
    cycle_number: 12,
    cycle_status: 'ACTIVE',
    cycle_start_time: '11:45:00 AM',
    elapsed_time: 1155,
    completed_cycles: 11,
    current_efficiency: 78.4,
    previous_cycle_efficiency: 74.2,
    consecutive_efficiency_improvement: 3,
    max_cycle: 20,
    improvement_condition: true,
    backend_action: 'OPTIMIZE',
  },

  treatment: {
    current_stage: 'PURIFICATION',
    pump_status: true,
    process_status: 'RUNNING',
  },
};

const FALLBACK_CHART_DATA = [
  { cycle: 'Cycle 7', efficiency: 62.1 },
  { cycle: 'Cycle 8', efficiency: 65.4 },
  { cycle: 'Cycle 9', efficiency: 68.9 },
  { cycle: 'Cycle 10', efficiency: 71.0 },
  { cycle: 'Cycle 11', efficiency: 74.2 },
  { cycle: 'Cycle 12', efficiency: 78.4 },
];

const FALLBACK_ACTIVITY_LOGS = [
  {
    id: 1,
    time: '12:04:18 PM',
    text: 'Point B reading updated (TDS: 110 ppm, pH: 7.2)',
    type: 'info',
  },
  {
    id: 2,
    time: '12:02:40 PM',
    text: 'Backend decision generated: OPTIMIZE',
    type: 'system',
  },
  {
    id: 3,
    time: '11:58:10 AM',
    text: 'Treatment stage changed to PURIFICATION',
    type: 'stage',
  },
  {
    id: 4,
    time: '11:45:00 AM',
    text: 'Cycle #12 initiated by control algorithm',
    type: 'cycle',
  },
  {
    id: 5,
    time: '11:44:50 AM',
    text: 'Point A initial telemetry captured (TDS: 680 ppm)',
    type: 'info',
  },
  {
    id: 6,
    time: '10:30:00 AM',
    text: 'ESP32 controller handshake verified',
    type: 'hardware',
  },
];

// ==================================================
// TREATMENT STAGES
// ==================================================

const TREATMENT_STAGES: {
  id: TreatmentStage;
  label: string;
}[] = [
  {
    id: 'RAW_WATER',
    label: 'Raw Water Input',
  },
  {
    id: 'PRE_TREATMENT',
    label: 'Pre-Treatment',
  },
  {
    id: 'FILTRATION',
    label: 'Filtration',
  },
  {
    id: 'PURIFICATION',
    label: 'Purification',
  },
  {
    id: 'POST_TREATMENT',
    label: 'Post-Treatment',
  },
  {
    id: 'OUTPUT',
    label: 'Treated Output',
  },
];

// ==================================================
// LOCAL TYPES
// ==================================================

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  status: SensorStatus;
  trend: SensorTrend;
  icon: React.ElementType;
}

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

// ==================================================
// HELPERS
// ==================================================

const getTimeString = (timestamp: string): string => {
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '—';
  }
};

const getSensorStatus = (
  type: 'tds' | 'turbidity' | 'ph' | 'temperature',
  value: number
): SensorStatus => {
  if (!Number.isFinite(value)) {
    return 'CRITICAL';
  }

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

const formatTime = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '—';
  }

  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);

  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
};

// ==================================================
// STATUS BADGE
// ==================================================

const StatusBadge: React.FC<{
  status: SensorStatus;
}> = ({ status }) => {
  switch (status) {
    case 'NORMAL':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <CircleCheck className="h-3 w-3" />
          Normal
        </span>
      );

    case 'WARNING':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Warning
        </span>
      );

    case 'CRITICAL':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
          <AlertTriangle className="h-3 w-3" />
          Critical
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-500/15 dark:text-slate-400">
          Offline
        </span>
      );
  }
};

// ==================================================
// TREND ICON
// ==================================================

const TrendIcon: React.FC<{
  trend: SensorTrend;
}> = ({ trend }) => {
  if (trend === 'UP') {
    return (
      <span className="text-xs font-bold text-amber-500 dark:text-amber-400">
        ↑
      </span>
    );
  }

  if (trend === 'DOWN') {
    return (
      <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">
        ↓
      </span>
    );
  }

  return (
    <span className="text-xs font-bold text-slate-400">
      →
    </span>
  );
};

// ==================================================
// SENSOR CARD
// ==================================================

const SensorCard: React.FC<SensorCardProps> = ({
  label,
  value,
  unit,
  status,
  trend,
  icon: Icon,
}) => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-slate-300 dark:border-slate-800/90 dark:bg-slate-900/60 dark:hover:border-slate-700">
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20 dark:bg-cyan-500/15 dark:text-cyan-400">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </div>

          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {Number.isFinite(value)
                ? value.toFixed(
                    value % 1 === 0 ? 0 : 1
                  )
                : '—'}
            </span>

            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {unit}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <StatusBadge status={status} />

        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Trend:</span>
          <TrendIcon trend={trend} />
        </div>
      </div>
    </div>
  );
};

// ==================================================
// MAIN DASHBOARD
// ==================================================

export const Dashboard: React.FC = () => {
  const [telemetry, setTelemetry] =
    useState<LatestTelemetry | null>(null);

  const [cycleHistory, setCycleHistory] =
    useState<CycleRecord[]>([]);

  const [latestCycle, setLatestCycle] =
    useState<CycleRecord | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [backendConnected, setBackendConnected] =
    useState(false);

  // --------------------------------------------------
  // LOAD DASHBOARD DATA
  // --------------------------------------------------

  const loadDashboardData = async () => {
    try {
      const [
        telemetryResponse,
        cycleHistoryResponse,
        latestCycleResponse,
      ] = await Promise.all([
        getLatestTelemetry('JAL-001'),
        getCycleHistory(20, 'JAL-001'),
        getLatestCycle('JAL-001'),
      ]);

      if (
        telemetryResponse?.success &&
        telemetryResponse?.data
      ) {
        setTelemetry(
          telemetryResponse.data
        );
      }

      if (
        cycleHistoryResponse?.success &&
        Array.isArray(
          cycleHistoryResponse.data
        )
      ) {
        setCycleHistory(
          cycleHistoryResponse.data
        );
      }

      if (
        latestCycleResponse?.success &&
        latestCycleResponse?.data
      ) {
        setLatestCycle(
          latestCycleResponse.data
        );
      }

      setBackendConnected(true);
    } catch (error) {
      console.error(
        'Dashboard backend request failed:',
        error
      );

      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // INITIAL LOAD + AUTO REFRESH
  // --------------------------------------------------

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadDashboardData();
    }, 0);

    const interval = window.setInterval(() => {
      void loadDashboardData();
    }, 3000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, []);

  // ==================================================
  // SORT CYCLE HISTORY BEFORE ANY CALCULATION
  // ==================================================

  const sortedCycleHistory = useMemo(() => {
    return [...cycleHistory].sort(
      (a, b) =>
        a.cycle_number - b.cycle_number
    );
  }, [cycleHistory]);

  // --------------------------------------------------
  // DETERMINE CURRENT CYCLE
  // --------------------------------------------------

  const currentCycle = useMemo(() => {
    if (latestCycle) {
      return latestCycle;
    }

    if (
      sortedCycleHistory.length > 0
    ) {
      return sortedCycleHistory[
        sortedCycleHistory.length - 1
      ];
    }

    return null;
  }, [
    latestCycle,
    sortedCycleHistory,
  ]);

  // ==================================================
  // PREVIOUS CYCLE
  //
  // 1. sort by cycle_number
  // 2. locate current cycle
  // 3. take the immediately previous cycle
  // ==================================================

  const previousCycle = useMemo(() => {
    if (!currentCycle) {
      return null;
    }

    const currentCycleIndex =
      sortedCycleHistory.findIndex(
        (item) =>
          item.cycle_number ===
          currentCycle.cycle_number
      );

    if (currentCycleIndex <= 0) {
      return null;
    }

    return sortedCycleHistory[
      currentCycleIndex - 1
    ];
  }, [
    currentCycle,
    sortedCycleHistory,
  ]);

  // --------------------------------------------------
  // CURRENT EFFICIENCY
  // --------------------------------------------------

  const currentEfficiency =
    currentCycle?.performance
      ?.tds_removal_efficiency ??
    null;

  // --------------------------------------------------
  // PREVIOUS EFFICIENCY
  // --------------------------------------------------

  const previousEfficiency =
    previousCycle?.performance
      ?.tds_removal_efficiency ??
    null;

  // --------------------------------------------------
  // ACTUAL NET IMPROVEMENT
  // --------------------------------------------------

  const netImprovement =
    currentEfficiency !== null &&
    previousEfficiency !== null
      ? currentEfficiency -
        previousEfficiency
      : null;

  // ==================================================
  // CHART: always render sorted cycle history.
  // ==================================================

  const chartData = useMemo(() => {
    if (
      sortedCycleHistory.length === 0
    ) {
      return FALLBACK_CHART_DATA;
    }

    const validHistory =
      sortedCycleHistory.filter(
        (item) =>
          item.performance
            ?.tds_removal_efficiency !==
          null &&
          item.performance
            ?.tds_removal_efficiency !==
          undefined
      );

    if (validHistory.length === 0) {
      return FALLBACK_CHART_DATA;
    }

    return validHistory.map((item) => ({
      cycle: `Cycle ${item.cycle_number}`,
      efficiency:
        item.performance
          ?.tds_removal_efficiency ?? 0,
    }));
  }, [sortedCycleHistory]);

  // ==================================================
  // BUILD DASHBOARD DATA
  // ==================================================

  const currentCycleNumber =
    currentCycle?.cycle_number ??
    MOCK_DASHBOARD_DATA.cycle.cycle_number;

  const maxCycle =
    sortedCycleHistory.length > 0
      ? Math.max(
          ...sortedCycleHistory.map(
            (item) => item.cycle_number
          )
        )
      : currentCycleNumber;

  // FIX: annotate the useMemo with <DashboardData> so every
  // literal below (status/trend/current_stage/etc.) is checked
  // against the correct union type instead of being widened to
  // `string` by inference.
  const displayData = useMemo<DashboardData>(() => {
    if (!telemetry) {
      return MOCK_DASHBOARD_DATA;
    }

    const timestamp = getTimeString(telemetry.timestamp);

    const cycleStatus =
      currentCycle?.status ?? 'COMPLETED';

    const action =
      currentCycle?.decision?.backend_action ??
      currentCycle?.performance?.backend_action ??
      'NO_ACTION';

    const improvementCondition =
      currentCycle?.decision?.improvement_condition ?? false;

    const elapsedTime = currentCycle?.elapsed_time ?? 0;

    const completedCycles = sortedCycleHistory.filter(
      (item) => item.status === 'COMPLETED'
    ).length;

    return {
      point_a: {
        tds: {
          value:
            telemetry.point_a.tds,
          unit: 'ppm',
          status:
            getSensorStatus(
              'tds',
              telemetry.point_a.tds
            ),
          trend: 'STABLE',
          timestamp,
        },

        turbidity: {
          value:
            telemetry.point_a
              .turbidity,
          unit: 'NTU',
          status:
            getSensorStatus(
              'turbidity',
              telemetry.point_a
                .turbidity
            ),
          trend: 'STABLE',
          timestamp,
        },

        temperature: {
          value:
            telemetry.point_a
              .temperature,
          unit: '°C',
          status:
            getSensorStatus(
              'temperature',
              telemetry.point_a
                .temperature
            ),
          trend: 'STABLE',
          timestamp,
        },
      },

      point_b: {
        ph: {
          value:
            telemetry.point_b.ph,
          unit: 'pH',
          status:
            getSensorStatus(
              'ph',
              telemetry.point_b.ph
            ),
          trend: 'STABLE',
          timestamp,
        },

        tds: {
          value:
            telemetry.point_b.tds,
          unit: 'ppm',
          status:
            getSensorStatus(
              'tds',
              telemetry.point_b.tds
            ),
          trend: 'DOWN',
          timestamp,
        },

        turbidity: {
          value:
            telemetry.point_b
              .turbidity,
          unit: 'NTU',
          status:
            getSensorStatus(
              'turbidity',
              telemetry.point_b
                .turbidity
            ),
          trend: 'DOWN',
          timestamp,
        },

        temperature: {
          value:
            telemetry.point_b
              .temperature,
          unit: '°C',
          status:
            getSensorStatus(
              'temperature',
              telemetry.point_b
                .temperature
            ),
          trend: 'STABLE',
          timestamp,
        },
      },

      system: {
        system_status:
          backendConnected
            ? 'ONLINE'
            : 'OFFLINE',

        esp32_connection:
          backendConnected
            ? 'CONNECTED'
            : 'UNKNOWN',

        backend_connection:
          backendConnected
            ? 'CONNECTED'
            : 'DISCONNECTED',

        treatment_status:
          telemetry.pump_status
            ? 'ONLINE'
            : 'IDLE',

        pump_status:
          telemetry.pump_status,

        last_updated: timestamp,
      },

      cycle: {
        cycle_number:
          currentCycleNumber,

        cycle_status:
          cycleStatus,

        cycle_start_time:
          currentCycle
            ?.start_time
            ? getTimeString(
                currentCycle.start_time
              )
            : '—',

        elapsed_time:
          elapsedTime,

        completed_cycles:
          completedCycles,

        current_efficiency:
          currentEfficiency,

        previous_cycle_efficiency:
          previousEfficiency,

        consecutive_efficiency_improvement:
          netImprovement,

        max_cycle:
          maxCycle,

        improvement_condition:
          improvementCondition,

        backend_action:
          action,
      },

      treatment: {
        current_stage:
          telemetry.pump_status
            ? 'PURIFICATION'
            : 'OUTPUT',

        pump_status:
          telemetry.pump_status,

        process_status:
          telemetry.pump_status
            ? 'RUNNING'
            : 'IDLE',
      },
    };
  }, [
    telemetry,
    backendConnected,
    currentCycle,
    currentEfficiency,
    previousEfficiency,
    netImprovement,
    maxCycle,
    sortedCycleHistory,
    currentCycleNumber,
  ]);

  // ==================================================
  // SAFETY DISPLAY VALUES
  // ==================================================

  const data: DashboardData =
    loading && !telemetry
      ? MOCK_DASHBOARD_DATA
      : displayData;

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.3,
      }}
      className="space-y-6"
    >
      {/* ==================================================
          1. PAGE HEADER
          ================================================== */}

      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              JAL-RAKSHAK Control Center
            </h1>

            <span className="inline-flex items-center rounded-md bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-700 ring-1 ring-inset ring-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-300">
              v1.0-IoT
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time water intelligence,
            treatment performance and
            process control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80">
            <Radio className="h-4 w-4 animate-pulse text-cyan-500" />

            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {backendConnected
                ? 'LIVE SENSOR DATA'
                : 'DEMO DATA'}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5" />

            <span>
              Updated:{' '}
              {data.system.last_updated}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================
          DATA SOURCE BANNER
          ================================================== */}

      <div
        className={`flex items-start gap-3 rounded-xl border p-4 ${
          backendConnected
            ? 'border-emerald-500/30 bg-emerald-500/5 dark:border-emerald-500/20 dark:bg-emerald-500/10'
            : 'border-cyan-500/30 bg-cyan-500/5 dark:border-cyan-500/20 dark:bg-cyan-500/10'
        }`}
      >
        <Info
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            backendConnected
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-cyan-600 dark:text-cyan-400'
          }`}
        />

        <div className="text-xs text-slate-700 dark:text-slate-300 sm:text-sm">
          {backendConnected ? (
            <>
              <strong className="font-semibold text-emerald-800 dark:text-emerald-300">
                LIVE SENSOR DATA:{' '}
              </strong>
              Dashboard telemetry is being
              received from the JAL-RAKSHAK
              FastAPI backend.
            </>
          ) : (
            <>
              <strong className="font-semibold text-cyan-900 dark:text-cyan-200">
                DEMO MODE:{' '}
              </strong>
              Backend telemetry is currently
              unavailable. Showing fallback
              demonstration values.
            </>
          )}
        </div>
      </div>

      {/* ==================================================
          2. SYSTEM OVERVIEW CARDS
          ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* SYSTEM STATUS */}

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>System Status</span>

            <ShieldCheck className="h-4 w-4 text-cyan-500" />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {data.system.system_status}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                backendConnected
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  backendConnected
                    ? 'animate-pulse bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />

              {backendConnected
                ? 'Backend Nominal'
                : 'Demo Mode'}
            </span>
          </div>
        </div>

        {/* ESP32 */}

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>ESP32 Hardware</span>

            <Cpu className="h-4 w-4 text-cyan-500" />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {data.system.esp32_connection}
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              {backendConnected
                ? 'Telemetry OK'
                : 'Demo'}
            </span>
          </div>
        </div>

        {/* TREATMENT */}

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Treatment State</span>

            <Workflow className="h-4 w-4 text-cyan-500" />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {data.treatment.process_status}
            </span>

            <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
              {data.treatment.current_stage}
            </span>
          </div>
        </div>

        {/* PUMP */}

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Dosing / Intake Pump</span>

            <Zap className="h-4 w-4 text-cyan-500" />
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {data.system.pump_status
                ? 'ACTIVE'
                : 'INACTIVE'}
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span
                className={`h-2 w-2 rounded-full ${
                  data.system.pump_status
                    ? 'animate-pulse bg-emerald-500'
                    : 'bg-slate-400'
                }`}
              />

              {data.system.pump_status
                ? 'Relay Engaged'
                : 'Relay Off'}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================
          3 & 4. POINT A / POINT B
          ================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* POINT A */}

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />

                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    POINT A
                  </h2>

                  <span className="text-xs font-semibold text-slate-400">
                    —
                  </span>

                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    RAW WATER INPUT
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Untreated intake water
                  quality metrics.
                </p>
              </div>

              <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                Pre-Filter
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <SensorCard
                label="TDS (Total Dissolved Solids)"
                value={
                  data.point_a.tds.value
                }
                unit={
                  data.point_a.tds.unit
                }
                status={
                  data.point_a.tds.status
                }
                trend={
                  data.point_a.tds.trend
                }
                icon={Gauge}
              />

              <SensorCard
                label="Turbidity"
                value={
                  data.point_a
                    .turbidity.value
                }
                unit={
                  data.point_a
                    .turbidity.unit
                }
                status={
                  data.point_a
                    .turbidity.status
                }
                trend={
                  data.point_a
                    .turbidity.trend
                }
                icon={Droplets}
              />

              <SensorCard
                label="Temperature"
                value={
                  data.point_a
                    .temperature.value
                }
                unit={
                  data.point_a
                    .temperature.unit
                }
                status={
                  data.point_a
                    .temperature.status
                }
                trend={
                  data.point_a
                    .temperature.trend
                }
                icon={Thermometer}
              />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200/60 bg-slate-50 p-2.5 text-center text-xs font-medium text-slate-500 dark:border-slate-800/60 dark:bg-slate-950/50 dark:text-slate-400">
            Note: Point A monitoring
            excludes pH sensor by hardware
            design.
          </div>
        </div>

        {/* POINT B */}

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />

                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    POINT B
                  </h2>

                  <span className="text-xs font-semibold text-slate-400">
                    —
                  </span>

                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    TREATED WATER OUTPUT
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Purified post-treatment
                  output analytics.
                </p>
              </div>

              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                Post-Purification
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SensorCard
                label="pH Level"
                value={
                  data.point_b.ph.value
                }
                unit={
                  data.point_b.ph.unit
                }
                status={
                  data.point_b.ph.status
                }
                trend={
                  data.point_b.ph.trend
                }
                icon={Activity}
              />

              <SensorCard
                label="TDS"
                value={
                  data.point_b.tds.value
                }
                unit={
                  data.point_b.tds.unit
                }
                status={
                  data.point_b.tds.status
                }
                trend={
                  data.point_b.tds.trend
                }
                icon={Gauge}
              />

              <SensorCard
                label="Turbidity"
                value={
                  data.point_b
                    .turbidity.value
                }
                unit={
                  data.point_b
                    .turbidity.unit
                }
                status={
                  data.point_b
                    .turbidity.status
                }
                trend={
                  data.point_b
                    .turbidity.trend
                }
                icon={Droplets}
              />

              <SensorCard
                label="Temperature"
                value={
                  data.point_b
                    .temperature.value
                }
                unit={
                  data.point_b
                    .temperature.unit
                }
                status={
                  data.point_b
                    .temperature.status
                }
                trend={
                  data.point_b
                    .temperature.trend
                }
                icon={Thermometer}
              />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-center text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            Treated water monitoring active
            • Point B telemetry
          </div>
        </div>
      </div>

      {/* ==================================================
          5. TREATMENT PIPELINE
          ================================================== */}

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Treatment Stage Pipeline
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active purification stage
              sequence from Intake (Point A)
              to Output (Point B).
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-600 dark:text-cyan-400">
            <span className="h-2 w-2 animate-ping rounded-full bg-cyan-500" />
            Stage Active
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TREATMENT_STAGES.map(
            (stage, idx) => {
              const activeIndex =
                TREATMENT_STAGES.findIndex(
                  (item) =>
                    item.id ===
                    data.treatment
                      .current_stage
                );

              const isActive =
                stage.id ===
                data.treatment
                  .current_stage;

              const isPassed =
                activeIndex > idx;

              return (
                <div
                  key={stage.id}
                  className="relative flex flex-col items-center"
                >
                  <div
                    className={`flex h-12 w-full flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                      isActive
                        ? 'border-cyan-500 bg-cyan-500/10 font-bold text-cyan-700 shadow-xs dark:bg-cyan-500/20 dark:text-cyan-300'
                        : isPassed
                        ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/40'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-75">
                      Step 0{idx + 1}
                    </span>

                    <span className="max-w-full truncate text-xs">
                      {stage.label}
                    </span>
                  </div>

                  {idx <
                    TREATMENT_STAGES.length -
                      1 && (
                    <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 dark:text-slate-700 lg:block">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* ==================================================
          6 & 7. CYCLE PERFORMANCE + CHART
          ================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CYCLE PERFORMANCE */}

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cycle Performance
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Batch metrics provided by
                  FastAPI decision engine.
                </p>
              </div>

              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                Cycle #
                {
                  data.cycle
                    .cycle_number
                }
              </span>
            </div>

            <div className="mt-4 space-y-3.5 text-sm">
              {/* CURRENT */}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Current Efficiency
                </span>

                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {data.cycle
                    .current_efficiency !==
                  null
                    ? `${data.cycle.current_efficiency.toFixed(
                        1
                      )}%`
                    : '—'}
                </span>
              </div>

              {/* PREVIOUS */}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Previous Cycle
                </span>

                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {data.cycle
                    .previous_cycle_efficiency !==
                  null
                    ? `${data.cycle.previous_cycle_efficiency.toFixed(
                        1
                      )}%`
                    : '—'}
                </span>
              </div>

              {/* NET IMPROVEMENT */}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Net Improvement
                </span>

                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    netImprovement !==
                      null &&
                    netImprovement < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />

                  {netImprovement !==
                  null
                    ? `${
                        netImprovement >=
                        0
                          ? '+'
                          : ''
                      }${netImprovement.toFixed(
                        2
                      )} pp`
                    : '—'}
                </span>
              </div>

              {/* ELAPSED */}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Elapsed Time
                </span>

                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatTime(
                    data.cycle
                      .elapsed_time
                  )}
                </span>
              </div>

              {/* FILTER HEALTH */}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Filter Health Score
                </span>

                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {currentCycle?.performance
                    ?.filter_health_score_pct !==
                  null &&
                  currentCycle?.performance
                    ?.filter_health_score_pct !==
                    undefined
                    ? `${currentCycle.performance.filter_health_score_pct.toFixed(
                        1
                      )}%`
                    : '—'}
                </span>
              </div>

              {/* CONDITION */}

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Condition
                </span>

                {data.cycle
                  .improvement_condition ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    SATISFIED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
                    <Info className="h-4 w-4" />
                    NOT SATISFIED
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* BACKEND DECISION */}

          <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3.5 dark:bg-cyan-500/15">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
              Backend Action Decision
            </div>

            <div className="mt-1 flex items-center justify-between">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {
                  data.cycle
                    .backend_action
                }
              </span>

              <span className="text-xs text-slate-600 dark:text-slate-300">
                FastAPI
              </span>
            </div>
          </div>
        </div>

        {/* EFFICIENCY CHART */}

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Treatment Efficiency
                Trajectory
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                TDS purification performance
                across treatment cycles.
              </p>
            </div>

            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {netImprovement !==
                null &&
              netImprovement > 0
                ? 'Positive Trend'
                : 'Current Trend'}
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="efficiencyGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#06b6d4"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="95%"
                      stopColor="#06b6d4"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#334155"
                  opacity={0.2}
                />

                <XAxis
                  dataKey="cycle"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#64748b',
                  }}
                />

                <YAxis
                  domain={[50, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#64748b',
                  }}
                  unit="%"
                />

                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(
                      1
                    )}%`,
                    'Efficiency',
                  ]}
                  contentStyle={{
                    backgroundColor:
                      '#0f172a',
                    borderColor:
                      '#1e293b',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#efficiencyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==================================================
          8. ML INTELLIGENCE
          ================================================== */}

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ML Intelligence
              </h2>
              <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-700 ring-1 ring-inset ring-cyan-500/20 dark:bg-cyan-500/15 dark:text-cyan-300">
                CatBoost
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Predictions generated by the FastAPI ML inference service for the latest treatment cycle.
            </p>
          </div>

          <span className="text-xs font-medium text-slate-400">
            Cycle #{data.cycle.cycle_number}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* FILTER HEALTH ML */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20 dark:bg-cyan-500/15 dark:text-cyan-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Filter Health Prediction
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    ML classification
                  </div>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  currentCycle?.ml?.filter_health?.prediction === 'HEALTHY'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : currentCycle?.ml?.filter_health?.prediction === 'MODERATE'
                    ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                    : currentCycle?.ml?.filter_health?.prediction === 'UNHEALTHY'
                    ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                    : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                }`}
              >
                {currentCycle?.ml?.filter_health?.prediction ?? 'NO DATA'}
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {currentCycle?.ml?.filter_health?.confidence != null
                    ? `${currentCycle.ml.filter_health.confidence.toFixed(2)}%`
                    : '—'}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Model confidence
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Filter model
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, currentCycle?.ml?.filter_health?.confidence ?? 0))}%`,
                }}
              />
            </div>
          </div>

          {/* WATER QUALITY ML */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20 dark:bg-cyan-500/15 dark:text-cyan-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Water Quality Prediction
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Point B classification
                  </div>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  currentCycle?.ml?.water_quality?.prediction === 'SAFE'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : currentCycle?.ml?.water_quality?.prediction === 'WARNING'
                    ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                    : currentCycle?.ml?.water_quality?.prediction === 'CRITICAL'
                    ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                    : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                }`}
              >
                {currentCycle?.ml?.water_quality?.prediction ?? 'NO DATA'}
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {currentCycle?.ml?.water_quality?.confidence != null
                    ? `${currentCycle.ml.water_quality.confidence.toFixed(2)}%`
                    : '—'}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Model confidence
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Quality model
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, currentCycle?.ml?.water_quality?.confidence ?? 0))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          9. ACTIVITY LOG
          ================================================== */}

      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800/90 dark:bg-slate-900/60">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Live Control Activity Log
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time sequence of
              operational state changes and
              system triggers.
            </p>
          </div>

          <span className="text-xs font-medium text-slate-400">
            {backendConnected
              ? 'Backend Telemetry'
              : 'Demo Stream'}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {FALLBACK_ACTIVITY_LOGS.map(
            (log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-2.5 text-xs dark:border-slate-800/60 dark:bg-slate-950/40"
              >
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />

                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {log.text}
                  </span>
                </div>

                <span className="ml-2 shrink-0 font-mono text-[11px] text-slate-400">
                  {log.time}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;