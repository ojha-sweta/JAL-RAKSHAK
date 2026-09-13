import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';

import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import TreatmentProcess from './pages/TreatmentProcess';
import WaterQuality from './pages/WaterQuality';
import CycleAnalytics from './pages/CycleAnalytics';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Device from './pages/Device';
import Settings from './pages/Settings';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<AppLayout />}>

          {/* Default */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Main pages */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/live"
            element={<LiveMonitoring />}
          />

          <Route
            path="/treatment"
            element={<TreatmentProcess />}
          />

          <Route
            path="/water-quality"
            element={<WaterQuality />}
          />

          <Route
            path="/cycles"
            element={<CycleAnalytics />}
          />

          <Route
            path="/alerts"
            element={<Alerts />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/device"
            element={<Device />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />

        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;