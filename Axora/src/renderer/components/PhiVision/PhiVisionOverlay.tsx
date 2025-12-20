import React, { useState } from 'react';
import { usePhiVision, PhiVisionResult } from '../../services/PhiVisionContext';

// --- Legacy UI Components ---

const PanelContainer = ({ children, title, className = '' }: { children: React.ReactNode, title?: string, className?: string }) => (
    <div className={`bg-[#0fa5e9]/[0.02] border border-[#0fa5e9]/20 rounded p-4 flex flex-col ${className}`}>
        {title && (
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                {title}
            </div>
        )}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
        </div>
    </div>
);

const SectionHeader = ({ title }: { title: string }) => (
    <div className="text-[11px] font-bold text-[#dbae59] uppercase tracking-widest border-b border-[#dbae59]/30 pb-1 mb-2 mt-1">
        {title}
    </div>
);

const ListWithBullets = ({ items, color = "bg-cyan-500" }: { items: string[], color?: string }) => (
    <ul className="space-y-2">
        {items.map((item, i) => (
            <li key={i} className="flex gap-3 text-xs text-gray-300 leading-relaxed font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${color} mt-1.5 shrink-0 shadow-[0_0_5px_currentColor] opacity-80`} />
                <span>{item}</span>
            </li>
        ))}
    </ul>
);

const FooterBadge = ({ label }: { label: string }) => {
    const isWarn = /(alerte|attention|danger|risque|interaction|contre|surveillance|urgence|vérification|incertitude|doute)/i.test(label || '');
    // Colors matching screenshot: Dark pill with colored border/text
    const style = isWarn
        ? 'border-amber-600/60 text-amber-500 bg-amber-900/20'
        : 'border-slate-600 text-gray-400 bg-slate-800/40';

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${style} backdrop-blur-sm whitespace-nowrap`}>
            {label}
        </span>
    );
};

export const PhiVisionOverlay: React.FC = () => {
    const { isActive, isAnalyzing, result } = usePhiVision();
    const [fontSize, setFontSize] = useState(1); // 1 = normal, 1.2 = large, 1.4 = extra large
    const [isMinimized, setIsMinimized] = useState(false);

    // --- Keyboard Shortcuts ---
    React.useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // ESCAPE -> Minimize
            if (e.key === 'Escape') {
                setIsMinimized(true);
            }
            // Ctrl/Cmd + M -> Toggle Minimize
            if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
                e.preventDefault();
                setIsMinimized(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive]);

    if (!isActive) return null;
    const data = result as PhiVisionResult;

    // --- MINIMIZED VIEW (Capsule) ---
    if (isMinimized && data && !isAnalyzing) {
        return (
            <div className={`fixed bottom-4 right-4 z-[9999] pointer-events-auto flex flex-col items-end gap-2 animate-in slide-in-from-bottom-4 duration-300`}>

                {/* Restore Button / Capsule */}
                <div
                    onClick={() => setIsMinimized(false)}
                    className="cursor-pointer group flex items-center gap-3 bg-[#0b1220]/90 border border-cyan-500/30 backdrop-blur-xl pl-2 pr-4 py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                >
                    {/* Pulsing Dot */}
                    <div className="relative w-3 h-3">
                        <span className="absolute inset-0 rounded-full bg-cyan-500 animate-ping opacity-75"></span>
                        <span className="relative block w-3 h-3 rounded-full bg-cyan-400"></span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-cyan-100 uppercase tracking-widest leading-none">
                            Analyse Prête
                        </span>
                        <span className="text-[9px] text-cyan-500/80 font-mono leading-none mt-1">
                            {data.meds?.length || 0} détectés • Cliquer pour ouvrir
                        </span>
                    </div>

                    {/* Mini Preview Icons (Optional) */}
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <div className="flex -space-x-1">
                        {data.is_minor && (
                            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-[8px] text-amber-500 font-bold" title="Patient Mineur">!</div>
                        )}
                        <div className="w-5 h-5 rounded-full bg-cyan-900/40 border border-cyan-500/40 flex items-center justify-center text-[8px] text-cyan-300">
                            👁️
                        </div>
                    </div>
                </div>

                {/* Keyboard Hint */}
                <span className="text-[9px] text-white/30 font-mono mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Appuyez sur 'M' ou cliquez pour agrandir
                </span>
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 z-[9999] pointer-events-none font-sans text-gray-100 p-4 flex flex-col gap-2 select-none transition-opacity duration-200 ${isMinimized ? 'opacity-0' : 'opacity-100'}`}>
            {/* Background */}
            <div className="absolute inset-0 bg-[#050910]/95 backdrop-blur-md -z-10" />

            {/* ERROR / MOCK STATUS */}
            {data?.isMock && !data.error && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-600/90 text-white px-3 py-0.5 rounded-b text-[10px] font-bold uppercase tracking-widest z-50">
                    Mode Démo
                </div>
            )}

            {/* LOADING SPINNER */}
            {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                    <div className="mt-4 text-cyan-400 font-bold animate-pulse tracking-widest text-sm">ANALYSE EN COURS...</div>
                </div>
            )}

            {!isAnalyzing && data && (
                <>
                    {/* --- HEADER (AXORA GLASSMORPHISM v2.4) --- */}
                    <div className="flex items-center justify-between pointer-events-auto select-none mb-1 shrink-0 bg-[#0b1220]/80 border-b border-cyan-500/20 backdrop-blur-xl -mx-4 -mt-4 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-40 relative overflow-hidden">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                        {/* Zone 1: Branding */}
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg p-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-white/10">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="flex flex-col justify-center">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-lg text-white tracking-tight leading-none drop-shadow-md">Axora</span>
                                    <span className="font-light text-cyan-400 tracking-[0.2em] text-[10px] uppercase shadow-cyan-500/20">PhiVision</span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono tracking-wide uppercase">PhiGenix Ecosystem • v2.4</span>
                            </div>
                        </div>

                        {/* Zone 2: Context / Status (Dynamic) */}
                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center z-10">
                            {data.is_minor ? (
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/50 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                    <span className="text-amber-500 font-bold text-[10px] uppercase tracking-wider">Patient Mineur Détecté</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-cyan-900/10 border border-cyan-500/20 rounded-full group hover:bg-cyan-900/20 transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] group-hover:shadow-[0_0_12px_rgba(52,211,153,0.8)] transition-shadow" />
                                    <span className="text-cyan-200/80 font-medium text-[10px] tracking-wide uppercase">Analyse OCA Terminée</span>
                                </div>
                            )}
                        </div>

                        {/* Zone 3: Utilities & Controls */}
                        <div className="flex items-center gap-2 relative z-10 pl-4 border-l border-white/10">
                            {/* Minimize Button */}
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
                                title="Réduire (Echap)"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-white transition-colors">
                                    <path d="M4 14h6v6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M20 10h-6V4" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M14 10l7-7" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* --- MAIN CONTENT (Scrollable if needed, but intended to fit single screen) --- */}
                    <div className="flex-1 flex flex-col gap-2 min-h-0 pointer-events-auto transition-all duration-200 ease-out" style={{ zoom: fontSize }}>

                        {/* SECTION 1 TITLE */}
                        <SectionHeader title="MÉDICAMENTS & NOS RECOMMANDATIONS" />

                        {/* SECTION 1 GRID (2x2) */}
                        <div className="flex-1 min-h-0 grid grid-cols-[45%_55%] grid-rows-[45%_55%] gap-2">

                            {/* TOP LEFT: CONSEIL ORAL */}
                            <PanelContainer title="CONSEIL ORAL">
                                <p className="text-base text-cyan-50 font-medium italic leading-relaxed">
                                    "{data.advices?.oral_sentence || 'Aucun conseil généré.'}"
                                </p>
                            </PanelContainer>

                            {/* TOP RIGHT: MEDICAMENTS (STOCK) */}
                            <PanelContainer title="MEDICAMENTS & PRODUITS EN STOCK">
                                <ListWithBullets
                                    items={data.meds?.map(m => m.dci).filter(Boolean) as string[] || []}
                                    color="bg-emerald-500"
                                />
                                {(!data.meds || data.meds.length === 0) && (
                                    <div className="flex flex-col items-center justify-center h-full opacity-50 mt-2">
                                        <div className="text-2xl mb-1">🔍</div>
                                        <span className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Aucun détecté</span>
                                    </div>
                                )}
                            </PanelContainer>

                            {/* BOTTOM LEFT: POINTS CLÉS PATIENT */}
                            <PanelContainer title="POINTS CLÉS PATIENT">
                                <ListWithBullets
                                    items={data.advices?.written_points || []}
                                    color="bg-white"
                                />
                            </PanelContainer>

                            {/* BOTTOM RIGHT: NOS RECOMMANDATIONS */}
                            <PanelContainer title="NOS RECOMMANDATIONS">
                                <ListWithBullets
                                    items={data.meds?.map(m => m.recommendation).filter(Boolean) as string[] || []}
                                    color="bg-cyan-500"
                                />
                            </PanelContainer>
                        </div>

                        {/* SECTION 2 TITLE */}
                        <SectionHeader title="PRODUITS COMPLÉMENTAIRES & POURQUOI" />

                        {/* SECTION 2 GRID (1x2 Split) - Fixed height for bottom section */}
                        <div className="h-40 shrink-0 grid grid-cols-[45%_55%] gap-2">
                            {/* LEFT: PRODUCTS */}
                            <PanelContainer title="NOS PRODUITS COMPLÉMENTAIRES">
                                <ListWithBullets
                                    items={data.cross_selling?.map(c => c.name).filter(Boolean) as string[] || []}
                                    color="bg-emerald-400"
                                />
                                {(!data.cross_selling || data.cross_selling.length === 0) && <span className="text-gray-600 text-xs italic">Aucune opportunité identifiée.</span>}
                            </PanelContainer>

                            {/* RIGHT: REASONS */}
                            <PanelContainer title="POURQUOI">
                                <ListWithBullets
                                    items={data.cross_selling?.map(c => c.reason).filter(Boolean) as string[] || []}
                                    color="bg-emerald-600" // Darker green for reasoning
                                />
                            </PanelContainer>
                        </div>

                    </div>

                    {/* --- FOOTER BADGES --- */}
                    <div className="h-10 shrink-0 pointer-events-auto flex items-center gap-2 overflow-x-auto custom-scrollbar px-1 mt-1 border-t border-white/5 pt-2 relative z-10">
                        {data.analysis_context && <FooterBadge label={data.analysis_context} />}
                        {data.is_minor && <FooterBadge label="Patient Mineur" />}
                        {data.chips?.map((badge, i) => <FooterBadge key={i} label={badge} />)}

                        <div className="flex-1" /> {/* Spacer */}

                        <div className="flex items-center gap-2 text-[9px] text-gray-500 font-mono">
                            <span>ESPACE = Confirmer</span>
                            <span>•</span>
                            <span>ECHAP = Réduire</span>
                        </div>
                    </div>

                    {/* Vision Input Feed (Fixed & Floating on top) */}
                    {result?.capturedImage && (
                        <div className="absolute bottom-5 right-5 z-[100] group flex items-center justify-end pointer-events-auto">
                            <div className="absolute bottom-full right-0 mb-2 w-64 bg-black/90 backdrop-blur-xl border border-white/20 p-1 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover:translate-y-0">
                                <img src={result.capturedImage} className="w-full h-auto rounded" alt="Vision Input" />
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                </div>
                                <div className="mt-1 text-[9px] text-gray-400 text-center font-mono uppercase tracking-wider">Flux Vision Direct</div>
                            </div>
                            <div className="h-6 w-10 bg-black/60 border border-white/20 rounded flex items-center justify-center cursor-help hover:bg-cyan-900/50 hover:border-cyan-500/80 transition-all shadow-lg backdrop-blur-sm">
                                <span className="text-[8px] text-gray-300 font-bold font-mono">REC</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1 animate-pulse" />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
