// ==================================================
// SENSOR ENUMS & REUSABLE TYPES
// ==================================================

export type SensorStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export type SensorTrend = 'UP' | 'DOWN' | 'STABLE';

export interface BaseSensorReading {
  value: number;
  unit: string;
  status: SensorStatus;
  trend: SensorTrend;
  timestamp: string;
}

// ==================================================
// POINT A — RAW WATER
// ==================================================

/**
 * Raw Water Sensor Readings (Point A)
 * Note: Point A does NOT contain a pH sensor.
 */
export interface PointAReading {
  tds: BaseSensorReading;
  turbidity: BaseSensorReading;
  temperature: BaseSensorReading;
}

// ==================================================
// POINT B — TREATED WATER
// ==================================================

/**
 * Treated Water Sensor Readings (Point B)
 * Note: Point B contains pH, TDS, Turbidity, and Temperature.
 */
export interface PointBReading {
  ph: BaseSensorReading;
  tds: BaseSensorReading;
  turbidity: BaseSensorReading;
  temperature: BaseSensorReading;
}

// ==================================================
// SYSTEM STATUS
// ==================================================

export type SystemHealthStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE';

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

export interface SystemStatus {
  system_status: SystemHealthStatus;
  esp32_connection: ConnectionStatus;
  backend_connection: ConnectionStatus;
  treatment_status: SystemHealthStatus;
  pump_status: boolean;
  last_updated: string;
}

// ==================================================
// TREATMENT PROCESS & STAGES
// ==================================================

export type TreatmentStage =
  | 'RAW_WATER'
  | 'PRE_TREATMENT'
  | 'FILTRATION'
  | 'PURIFICATION'
  | 'POST_TREATMENT'
  | 'OUTPUT';

export type ProcessOperationalStatus = 'RUNNING' | 'PAUSED' | 'IDLE' | 'ERROR';

export interface TreatmentProcessStatus {
  current_stage: TreatmentStage;
  pump_status: boolean;
  process_status: ProcessOperationalStatus;
}

// ==================================================
// CYCLE STATUS & BACKEND DECISIONS
// ==================================================

export type CycleState = 'ACTIVE' | 'COMPLETED' | 'IDLE';

export type BackendAction = 'OPTIMIZE' | 'CONTINUE' | 'HOLD' | 'NO_ACTION';

export interface CycleStatus {
  cycle_number: number;
  cycle_status: CycleState;
  cycle_start_time: string;
  elapsed_time: number; // Elapsed time in seconds
  completed_cycles: number;
  current_efficiency: number; // Percentage value (0-100) provided by FastAPI
  previous_cycle_efficiency: number; // Percentage value (0-100) provided by FastAPI
  consecutive_efficiency_improvement: number;
  max_cycle: number;
  improvement_condition: boolean;
  backend_action: BackendAction;
}

// ==================================================
// COMBINED DASHBOARD DATA MODEL
// ==================================================

export interface DashboardData {
  point_a: PointAReading;
  point_b: PointBReading;
  system: SystemStatus;
  cycle: CycleStatus;
  treatment: TreatmentProcessStatus;
}