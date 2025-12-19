import { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import 'tailwindcss/tailwind.css';
import './variables.css';
import './components.css';
import './App.css';
import Sidecar from './components/Sidecar';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/Home';
import { Pharmacy } from './pages/Pharmacy';
import { PreventionPlan } from './pages/PreventionPlan';
import Settings from './pages/Settings';
import Lab from './pages/Lab';
import { PhiVisionProvider } from './services/PhiVisionContext';
import { PhiVisionOverlay } from './components/PhiVision/PhiVisionOverlay';

function AppContent() {
  const [mode, setMode] = useState<'compact' | 'hub' | 'hidden' | 'phivision'>('compact');

  useEffect(() => {
    // Initial fetch
    if (window.axora) {
      window.axora.getMode().then(setMode);

      // Listen for changes
      const unsubscribe = window.axora.onModeChanged((newMode) => {
        setMode(newMode);
      });
      return () => {
        unsubscribe();
      };
    }
  }, []);

  if (mode === 'compact') {
    return <Sidecar mode="compact" />;
  }

  if (mode === 'phivision') {
    return (
      <>
        {/* Pass mode to Sidecar so it can position itself correctly in fullscreen */}
        <Sidecar mode="phivision" />
        <PhiVisionOverlay />
      </>
    );
  }

  if (mode === 'hidden') {
    return null;
  }

  // mode === 'hub'
  return (
    <>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/pharma" element={<Pharmacy />} />
          <Route path="/ppp" element={<PreventionPlan />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
      {/* Kept here just in case, but PhiVision is mostly for sidecar mode */}
      <PhiVisionOverlay />
    </>
  );
}

export default function App() {
  return (
    <PhiVisionProvider>
      <Router>
        <AppContent />
      </Router>
    </PhiVisionProvider>
  );
}

