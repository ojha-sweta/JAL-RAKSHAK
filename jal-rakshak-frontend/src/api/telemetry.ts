import { apiFetch } from "./client";

export interface PointAData {
  tds: number;
  turbidity: number;
  temperature: number;
}

export interface PointBData {
  ph: number;
  tds: number;
  turbidity: number;
  temperature: number;
}

export interface LatestTelemetry {
  id: number;
  device_id: string;
  timestamp: string;

  point_a: PointAData;

  point_b: PointBData;

  flow_rate_l_min: number;
  pump_status: boolean;
}

export interface LatestTelemetryResponse {
  success: boolean;
  data: LatestTelemetry;
}

export async function getLatestTelemetry(
  deviceId?: string
): Promise<LatestTelemetryResponse> {
  const endpoint = deviceId
    ? `/api/telemetry/latest?device_id=${encodeURIComponent(deviceId)}`
    : '/api/telemetry/latest';

  return apiFetch<LatestTelemetryResponse>(endpoint);
}