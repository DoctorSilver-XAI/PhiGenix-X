import { NavLink } from 'react-router-dom';
import { MessageSquare, GraduationCap, Pill, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AxoraLogo } from './AxoraLogo';

import { Eye } from 'lucide-react';
import { usePhiVision } from '../services/PhiVisionContext';

export function Sidebar() {
    const { togglePhiVision, triggerAnalysis, isActive, isAnalyzing } = usePhiVision();
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Keyboard Shortcut: Cmd+Shift+P to Trigger PhiVision
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
                if (!isActive) togglePhiVision();
                triggerAnalysis();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, togglePhiVision, triggerAnalysis]);

    const mainLinks = [
        { to: '/', icon: MessageSquare, label: 'Assistant' },
        { to: '/pharma', icon: Pill, label: 'Outils Pharmacie' },
    ];

    const hiddenLinks = [
        { to: '/settings', icon: Settings, label: 'Paramètres' },
    ];

    return (
        <div
            className="w-64 h-screen bg-[#1a1c2e]/90 border-r border-[#2d323b] flex flex-col backdrop-blur-xl relative"
            onMouseEnter={() => {
                window.axora?.setIgnoreMouse(false);
            }}
            onMouseLeave={() => {
                window.axora?.setIgnoreMouse(true);
            }}
        >
            <div className="p-6 flex items-center gap-3">
                <AxoraLogo size={42} />
                <div className="flex flex-col">
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 leading-none">
                        Axora Pro
                    </span>
                    <span className="text-[10px] text-indigo-400 font-medium tracking-wider mt-1">
                        PHIGENIX 6.0
                    </span>
                </div>
            </div>

            <div className="px-4 mb-4">
                <button
                    onClick={() => {
                        if (!isActive) togglePhiVision();
                        triggerAnalysis(); // Triggers default (Free Sale) or random
                    }}
                    className={`
                        w-full flex items-center justify-center gap-2 p-3 rounded-xl 
                        font-bold text-sm transition-all duration-300 shadow-lg
                        ${isActive
                            ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-red-500/20'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02]'
                        }
                    `}
                >
                    <Eye size={18} className={isAnalyzing ? 'animate-pulse' : ''} />
                    {isAnalyzing ? 'Analyse...' : (isActive ? 'Arrêter PhiVision' : 'Activer PhiVision')}
                </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                    Workspace
                </div>
                {mainLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10'
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                            }`
                        }
                    >
                        <link.icon size={18} />
                        <span className="font-medium">{link.label}</span>
                        {link.to === '/pharma' && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        )}
                    </NavLink>
                ))}
            </nav>



            <nav className="flex-1 px-4 py-4 space-y-2 hidden"> {/* Spacer or keeping nav structure if needed */}
            </nav>

            {/* User / Settings Footer with Popover Menu */}
            <div className="p-4 border-t border-[#2d323b] relative">
                <AnimatePresence>
                    {showUserMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-4 right-4 mb-2 bg-[#1a1c2e] border border-[#2d323b] rounded-xl shadow-2xl overflow-hidden z-50 p-1"
                        >

                            {hiddenLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setShowUserMenu(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${isActive
                                            ? 'bg-indigo-600/10 text-indigo-400'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                        }`
                                    }
                                >
                                    <link.icon size={16} />
                                    <span className="font-medium">{link.label}</span>
                                </NavLink>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-3 w-full p-2 rounded-xl transition-colors text-left group ${showUserMenu ? 'bg-white/5' : 'hover:bg-white/5'}`}
                >
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-white/10 group-hover:border-white/20">
                        PV
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium text-gray-200 truncate">Pierre</div>
                        <div className="text-xs text-gray-500 truncate">Pharmacien</div>
                    </div>
                </button>
                <button
                    onClick={() => {
                        if (window.axora) window.axora.setMode('compact');
                    }}
                    title="Réduire en Sidecar"
                    className="flex items-center justify-center p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                    <div className="w-5 h-5 border-2 border-current rounded-md flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-current" />
                    </div>
                </button>
            </div>
        </div>
    );
}
