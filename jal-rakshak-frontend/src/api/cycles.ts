import { apiFetch } from './client';

// ==================================================
// CYCLE TYPES
// ==================================================

export interface CyclePointAverages {
  tds: number | null;
  turbidity: number | null;
  temperature: number | null;
}

export interface CyclePointBAverages {
  ph: number | null;
  tds: number | null;
  turbidity: number | null;
  temperature: number | null;
}

export interface CycleAverages {
  point_a: CyclePointAverages;
  point_b: CyclePointBAverages;
  flow_rate_l_min: number | null;
}

export interface CyclePerformance {
  tds_removal_efficiency: number | null;
  turbidity_removal_efficiency: number | null;
  filter_health_score_pct: number | null;
  efficiency_improvement: number | null;
}

export interface CycleDecision {
  improvement_condition: boolean | null;
  backend_action: string | null;
}

export interface MLPrediction {
  prediction: string | null;
  confidence: number | null;
}

export interface CycleML {
  filter_health: MLPrediction;
  water_quality: MLPrediction;
}

export interface TreatmentCycle {
  id: number;
  device_id: string;
  cycle_number: number;
  status: string;
  start_time: string;
  end_time: string | null;
  elapsed_time: number | null;
  reading_count: number;

  averages: CycleAverages;
  performance: CyclePerformance;
  decision: CycleDecision;
  ml: CycleML;
}

// ==================================================
// BACKEND RAW RESPONSE
// ==================================================

interface RawTreatmentCycle {
  id: number;
  device_id: string;
  cycle_number: number;
  status: string;
  start_time: string;
  end_time: string | null;
  elapsed_time: number | null;
  reading_count: number;

  point_a?: {
    tds?: number | null;
    turbidity?: number | null;
    temperature?: number | null;
  };

  point_b?: {
    ph?: number | null;
    tds?: number | null;
    turbidity?: number | null;
    temperature?: number | null;
  };

  flow_rate_l_min?: number | null;

  tds_removal_efficiency?: number | null;
  turbidity_removal_efficiency?: number | null;
  filter_health_score_pct?: number | null;
  efficiency_improvement?: number | null;

  improvement_condition?: boolean | null;
  backend_action?: string | null;

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
// NORMALIZE BACKEND RESPONSE
// ==================================================

function normalizeCycle(
  raw: RawTreatmentCycle
): TreatmentCycle {
  return {
    id: raw.id,

    device_id: raw.device_id,

    cycle_number: raw.cycle_number,

    status: raw.status,

    start_time: raw.start_time,

    end_time: raw.end_time ?? null,

    elapsed_time: raw.elapsed_time ?? null,

    reading_count: raw.reading_count,

    // ----------------------------------------------
    // AVERAGES
    // ----------------------------------------------

    averages: {
      point_a: {
        tds: raw.point_a?.tds ?? null,

        turbidity:
          raw.point_a?.turbidity ?? null,

        temperature:
          raw.point_a?.temperature ?? null,
      },

      point_b: {
        ph: raw.point_b?.ph ?? null,

        tds: raw.point_b?.tds ?? null,

        turbidity:
          raw.point_b?.turbidity ?? null,

        temperature:
          raw.point_b?.temperature ?? null,
      },

      flow_rate_l_min:
        raw.flow_rate_l_min ?? null,
    },

    // ----------------------------------------------
    // PERFORMANCE
    // ----------------------------------------------

    performance: {
      tds_removal_efficiency:
        raw.tds_removal_efficiency ?? null,

      turbidity_removal_efficiency:
        raw.turbidity_removal_efficiency ?? null,

      filter_health_score_pct:
        raw.filter_health_score_pct ?? null,

      efficiency_improvement:
        raw.efficiency_improvement ?? null,
    },

    // ----------------------------------------------
    // DECISION
    // ----------------------------------------------

    decision: {
      improvement_condition:
        raw.improvement_condition ?? null,

      backend_action:
        raw.backend_action ?? null,
    },

    // ----------------------------------------------
    // ML
    // ----------------------------------------------

    ml: {
      filter_health: {
        prediction:
          raw.ml?.filter_health?.prediction ??
          null,

        confidence:
          raw.ml?.filter_health?.confidence ??
          null,
      },

      water_quality: {
        prediction:
          raw.ml?.water_quality?.prediction ??
          null,

        confidence:
          raw.ml?.water_quality?.confidence ??
          null,
      },
    },
  };
}

// ==================================================
// RESPONSE TYPES
// ==================================================

export interface LatestCycleResponse {
  success: boolean;
  message?: string;
  data: TreatmentCycle | null;
}

export interface CycleHistoryResponse {
  success: boolean;
  count: number;
  data: TreatmentCycle[];
}

// ==================================================
// GET LATEST CYCLE
// ==================================================

export async function getLatestCycle(
  deviceId?: string
): Promise<LatestCycleResponse> {
  const endpoint = deviceId
    ? `/api/cycles/latest?device_id=${encodeURIComponent(
        deviceId
      )}`
    : '/api/cycles/latest';

  const response =
    await apiFetch<{
      success: boolean;
      message?: string;
      data: RawTreatmentCycle | null;
    }>(endpoint);

  return {
    success: response.success,

    message: response.message,

    data: response.data
      ? normalizeCycle(response.data)
      : null,
  };
}

// ==================================================
// GET CYCLE HISTORY
// ==================================================

export async function getCycleHistory(
  limit = 10,
  deviceId?: string
): Promise<CycleHistoryResponse> {
  const params = new URLSearchParams();

  params.set('limit', String(limit));

  if (deviceId) {
    params.set('device_id', deviceId);
  }

  const response =
    await apiFetch<{
      success: boolean;
      count: number;
      data: RawTreatmentCycle[];
    }>(
      `/api/cycles/history?${params.toString()}`
    );

  return {
    success: response.success,

    count: response.count,

    data: Array.isArray(response.data)
      ? response.data.map(normalizeCycle)
      : [],
  };
}