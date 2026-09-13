import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, Bell, Radio } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export interface HeaderProps {
  onOpenMobileMenu: () => void;
}

interface PageMeta {
  title: string;
  subtitle: string;
}

const ROUTE_META: Record<string, PageMeta> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Real-time overview of JAL-RAKSHAK water treatment operations.',
  },
  '/live': {
    title: 'Live Monitoring',
    subtitle: 'Real-time sensor readings and active treatment telemetry.',
  },
  '/treatment': {
    title: 'Treatment Process',
    subtitle: 'Multi-stage treatment and process control overview.',
  },
  '/water-quality': {
    title: 'Water Quality',
    subtitle: 'Water quality parameters and analytical diagnostics.',
  },
  '/cycles': {
    title: 'Cycle Analytics',
    subtitle: 'Treatment efficiency and cycle performance history.',
  },
  '/alerts': {
    title: 'Alerts',
    subtitle: 'System anomalies, threshold breaches, and notifications.',
  },
  '/reports': {
    title: 'Reports',
    subtitle: 'Operational reports, compliance logs, and summaries.',
  },
  '/device': {
    title: 'Device & Hardware',
    subtitle: 'ESP32 controller, sensors, and device connectivity.',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'System configuration and notification preferences.',
  },
};

const DEFAULT_META: PageMeta = {
  title: 'Dashboard',
  subtitle: 'Real-time overview of JAL-RAKSHAK water treatment operations.',
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const currentMeta = ROUTE_META[location.pathname] || DEFAULT_META;

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md transition-colors dark:border-slate-800/80 dark:bg-slate-950/80 lg:px-6">
      {/* Left Section: Mobile Menu Trigger & Page Meta */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open sidebar menu"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 md:hidden dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col justify-center">
          <h1 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">
            {currentMeta.title}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Section: Status Indicators, Actions, Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* LIVE / DEMO Indicator */}
        <div className="hidden items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-cyan-700 md:flex dark:text-cyan-300">
          <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-500" />
          <span>LIVE / DEMO</span>
        </div>

        {/* SYSTEM ONLINE Indicator */}
        <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-emerald-700 lg:flex dark:text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>System Online</span>
        </div>

        {/* Notification Icon Button */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-white dark:ring-slate-950" />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Avatar Placeholder */}
        <div className="flex items-center">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold tracking-wider text-slate-100 ring-2 ring-cyan-500/40 dark:bg-slate-100 dark:text-slate-900"
            aria-label="User profile: JR"
          >
            JR
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;