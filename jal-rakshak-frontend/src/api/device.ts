import { apiFetch } from './client';

// ==================================================
// DEVICE COMMAND TYPES
// ==================================================

export interface DeviceCommand {
  id: number;
  device_id: string;
  command: string;
  status: string;
  cycle_number: number | null;
  created_at: string;
  executed_at?: string | null;
}

export interface DeviceCommandResponse {
  success: boolean;
  command_available: boolean;
  command: DeviceCommand | null;
}

// ==================================================
// GET NEXT DEVICE COMMAND
// ==================================================

export async function getDeviceCommand(
  deviceId: string
): Promise<DeviceCommandResponse> {
  return apiFetch<DeviceCommandResponse>(
    `/api/device/${encodeURIComponent(deviceId)}/command`
  );
}