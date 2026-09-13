import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  LayoutDashboard,
  Activity,
  GitMerge,
  Droplets,
  LineChart,
  Bell,
  FileText,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Live Monitoring', path: '/live', icon: Activity },
  { label: 'Treatment Process', path: '/treatment', icon: GitMerge },
  { label: 'Water Quality', path: '/water-quality', icon: Droplets },
  { label: 'Cycle Analytics', path: '/cycles', icon: LineChart },
  { label: 'Alerts', path: '/alerts', icon: Bell },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Device & Hardware', path: '/device', icon: Cpu },
  { label: 'Settings', path: '/settings', icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}) => {
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      {/* Brand & Header Section */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 dark:border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col truncate">
                <span className="font-semibold tracking-wider text-slate-900 dark:text-slate-100 text-sm">
                  JAL-RAKSHAK
                </span>
                <span className="text-[10px] font-medium tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                  Smart Water Intelligence
                </span>
              </div>
            )}
          </div>

          {/* Close button for Mobile Drawer */}
          {isMobileOpen && (
            <button
              onClick={onMobileClose}
              aria-label="Close menu"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="mt-4 space-y-1 px-3" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.path}
                className="relative"
                onMouseEnter={() => isCollapsed && !isMobileOpen && setHoveredTooltip(item.label)}
                onMouseLeave={() => setHoveredTooltip(null)}
              >
                <NavLink
                  to={item.path}
                  onClick={() => {
                    if (isMobileOpen) onMobileClose();
                  }}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-cyan-500 ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300 font-semibold'
                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </NavLink>

                {/* Desktop Collapsed Tooltip */}
                {isCollapsed && !isMobileOpen && hoveredTooltip === item.label && (
                  <div className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-100 shadow-md dark:bg-slate-100 dark:text-slate-900 whitespace-nowrap pointer-events-none">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* System Status Section & Desktop Collapse Toggle */}
      <div className="border-t border-slate-200/80 p-3 dark:border-slate-800/80">
        <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800/80 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-2">
            {(!isCollapsed || isMobileOpen) && (
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                System Status
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {(!isCollapsed || isMobileOpen) && 'System Online'}
            </span>
          </div>

          {(!isCollapsed || isMobileOpen) && (
            <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>ESP32</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Backend</span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Demo Mode
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle Button */}
        {!isMobileOpen && (
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="mt-3 flex w-full items-center justify-center rounded-lg border border-slate-200 py-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden md:flex flex-col fixed top-0 bottom-0 left-0 z-30 border-r border-slate-200/80 dark:border-slate-800/80"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-slate-950 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-50 dark:bg-slate-950 md:hidden shadow-xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};