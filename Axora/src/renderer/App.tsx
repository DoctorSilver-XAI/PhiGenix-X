import { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './variables.css';
import './components.css';
import './App.css';
import Sidecar from './components/Sidecar';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/Home';
import { Pharmacy } from './pages/Pharmacy';

function AppContent() {
  const [mode, setMode] = useState<'compact' | 'hub' | 'hidden'>('compact');

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
    return <Sidecar />;
  }

  if (mode === 'hidden') {
    return null;
  }

  // mode === 'hub'
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/pharma" element={<Pharmacy />} />
        {/* Fallback or other routes */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
