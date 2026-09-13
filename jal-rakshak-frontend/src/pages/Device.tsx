import React from 'react';
import {
  Activity,
  Cpu,
  Droplets,
  Gauge,
  Globe,
  Radio,
  RefreshCw,
  Server,
  Settings2,
  Thermometer,
  Wifi,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SensorCardProps {
  name: string;
  location: string;
  value: string;
  status: 'ONLINE' | 'WARNING' | 'OFFLINE';
  icon: React.ReactNode;
}

const SensorCard: React.FC<SensorCardProps> = ({
  name,
  location,
  value,
  status,
  icon,
}) => {
  const statusStyles = {
    ONLINE:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400',
    WARNING:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400',
    OFFLINE:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
          {icon}
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {name}
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {location}
        </p>

        <p className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </p>
      </div>
    </div>
  );
};

const Device: React.FC = () => {
  return (
    <div className="min-h-full bg-slate-100/70 px-4 py-5 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400">
                  <Cpu size={20} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                    Hardware Control
                  </p>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                    Device & Hardware
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Monitor the JAL-RAKSHAK controller, sensor channels,
                process pump, and backend communication status.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
              <AlertTriangle size={15} />
              DEMO DATA
            </div>
          </div>
        </section>

        {/* Device Overview */}
        <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Controller
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    JAL-001
                  </h2>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ONLINE
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Wifi size={16} />
                  <span className="text-xs font-medium">Network</span>
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Wi-Fi
                </p>

                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Connected
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Server size={16} />
                  <span className="text-xs font-medium">Backend</span>
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  FastAPI
                </p>

                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Connected
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Radio size={16} />
                  <span className="text-xs font-medium">Protocol</span>
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  HTTP
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  REST telemetry
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <RefreshCw size={16} />
                  <span className="text-xs font-medium">Heartbeat</span>
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  2 sec ago
                </p>

                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Healthy
                </p>
              </div>

            </div>
          </div>

          {/* Command Channel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Settings2 size={19} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Control Channel
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Backend → ESP32
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={18}
                  className="text-emerald-600 dark:text-emerald-400"
                />

                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Command channel ready
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-emerald-700/80 dark:text-emerald-400/80">
                FastAPI will generate control decisions and the ESP32
                will poll for pending commands.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Current action
                </span>

                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  OPTIMIZE
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Command status
                </span>

                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  READY
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Sensor Channels */}
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Telemetry Channels
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                Sensor Status
              </h2>
            </div>

            <span className="text-xs text-slate-400">
              7 channels configured
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            <SensorCard
              name="TDS Sensor"
              location="Point A · Raw Water"
              value="680 ppm"
              status="ONLINE"
              icon={<Droplets size={20} />}
            />

            <SensorCard
              name="Turbidity Sensor"
              location="Point A · Raw Water"
              value="14.2 NTU"
              status="ONLINE"
              icon={<Gauge size={20} />}
            />

            <SensorCard
              name="Temperature Sensor"
              location="Point A · Raw Water"
              value="26.4 °C"
              status="ONLINE"
              icon={<Thermometer size={20} />}
            />

            <SensorCard
              name="pH Sensor"
              location="Point B · Treated Water"
              value="7.2 pH"
              status="ONLINE"
              icon={<Activity size={20} />}
            />

            <SensorCard
              name="TDS Sensor"
              location="Point B · Treated Water"
              value="110 ppm"
              status="ONLINE"
              icon={<Droplets size={20} />}
            />

            <SensorCard
              name="Turbidity Sensor"
              location="Point B · Treated Water"
              value="0.8 NTU"
              status="ONLINE"
              icon={<Gauge size={20} />}
            />

            <SensorCard
              name="Temperature Sensor"
              location="Point B · Treated Water"
              value="25.8 °C"
              status="ONLINE"
              icon={<Thermometer size={20} />}
            />

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Cpu size={20} />
              </div>

              <p className="mt-5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Additional channels
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Reserved for future hardware expansion and
                additional process instrumentation.
              </p>
            </div>

          </div>
        </section>

        {/* Process Hardware */}
        <section className="grid gap-4 lg:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
                <Droplets size={19} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Process Hardware
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Treatment Pump
                </h2>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Pump status
                </p>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Controlled through ESP32
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                ON
              </div>
            </div>
          </div>

          {/* Firmware */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                <Globe size={19} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Device Information
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Controller Details
                </h2>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs text-slate-400">Device ID</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  JAL-001
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs text-slate-400">Controller</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  ESP32
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs text-slate-400">Firmware</p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Demo v1.0
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs text-slate-400">Telemetry</p>
                <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  READY
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Radio size={19} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Hardware Communication Architecture
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                The frontend does not communicate directly with the
                ESP32. FastAPI remains the central processing and
                control layer.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950/40">
              <Cpu className="mx-auto text-cyan-600 dark:text-cyan-400" size={22} />
              <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                ESP32
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Measure
              </p>
            </div>

            <div className="hidden items-center justify-center md:flex">
              <div className="h-px w-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950/40">
              <Wifi className="mx-auto text-cyan-600 dark:text-cyan-400" size={22} />
              <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                HTTP
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Telemetry
              </p>
            </div>

            <div className="hidden items-center justify-center md:flex">
              <div className="h-px w-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950/40">
              <Server className="mx-auto text-indigo-600 dark:text-indigo-400" size={22} />
              <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                FastAPI
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Process & Decide
              </p>
            </div>

          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-950/40">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              FastAPI → command queue → ESP32 → physical action → next telemetry cycle
            </p>
          </div>
        </section>

        {/* Demo Notice */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex gap-3">
            <AlertTriangle
              size={19}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />

            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Hardware integration is currently in demo mode.
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700/80 dark:text-amber-400/80">
                The values and connectivity indicators shown on this page
                are simulated frontend data. Once the FastAPI backend and
                ESP32 are connected, these fields will be populated from
                real telemetry and device heartbeat data.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Device;