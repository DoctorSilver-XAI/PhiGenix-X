import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/Home';
import { Thesis } from './pages/Thesis';
import { Pharmacy } from './pages/Pharmacy';
import { Settings } from './pages/Settings';
import { BrainDebugger } from './pages/BrainDebugger'; // Added import for BrainDebugger
import BonPriseEnCharge from './components/Vaccination/BonPriseEnCharge';
import TrodAngine from './components/TrodAngine/TrodAngine';
import { aiManager } from './services/ai/manager';

function App() {
    useEffect(() => {
        aiManager.initialize();
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<Home />} />
                    <Route path="thesis" element={<Thesis />} />
                    <Route path="pharma" element={<Pharmacy />} />
                    <Route path="brain" element={<BrainDebugger />} /> {/* Added new route */}
                    <Route path="/vaccination/bon-prise-en-charge" element={<BonPriseEnCharge />} />
                    <Route path="/trod" element={<TrodAngine />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
