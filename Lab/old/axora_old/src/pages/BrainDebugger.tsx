import React, { useState, useEffect } from 'react';
import { ArrowLeft, Cpu, Database, Layers, Play, RefreshCw, Terminal, MessageSquare } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface BrainState {
    system_global: string;
    summary: string;
    memory_context: string;
    recent_history: { role: string, content: string }[];
    user_input: string;
}

export function BrainDebugger() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session');

    const [debugData, setDebugData] = useState<BrainState | null>(null);
    const [simulatedInput, setSimulatedInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (sessionId) {
            fetchDebugContext();
        }
    }, [sessionId]);

    const fetchDebugContext = async (inputOverride?: string) => {
        if (!sessionId) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/debug/context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: sessionId,
                    message: inputOverride || simulatedInput || "(Message utilisateur...)"
                })
            });
            const data = await res.json();
            setDebugData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f16] text-white font-mono p-6">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-lg transition">
                    <ArrowLeft />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-400">
                        <Cpu className="animate-pulse" />
                        Axora Brain Inspector
                    </h1>
                    <div className="text-xs text-white/40 flex gap-4 mt-1">
                        <span>Session: {sessionId || 'None'}</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Orchestrator Active</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Simulation Controls */}
                <div className="bg-[#181825] rounded-xl p-6 border border-white/5 space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-white/80">
                        <Terminal size={18} />
                        Simulation
                    </h2>
                    <p className="text-sm text-white/50">
                        Simulez un message utilisateur pour voir comment l'Orchestrateur construit le prompt.
                    </p>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-white/30">User Input</label>
                        <textarea
                            value={simulatedInput}
                            onChange={(e) => setSimulatedInput(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none min-h-[100px]"
                            placeholder="Tapez un message..."
                        />
                    </div>

                    <button
                        onClick={() => fetchDebugContext(simulatedInput)}
                        disabled={!sessionId}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                        {isLoading ? <RefreshCw className="animate-spin" /> : <Play size={16} />}
                        Générer le Contexte
                    </button>
                </div>

                {/* 2. The Sandwich Visualizer */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-white/80 mb-4">
                        <Layers size={18} />
                        Prompt Architecture (The Sandwich)
                    </h2>

                    {!debugData ? (
                        <div className="text-white/30 text-center py-10 border border-dashed border-white/10 rounded-xl">
                            Sélectionnez une session ou lancez une simulation.
                        </div>
                    ) : (
                        <div className="space-y-3 relative">
                            {/* Arrows */}
                            <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gradient-to-b from-indigo-500/50 to-purple-500/50 -z-10"></div>

                            {/* Layer 1: System */}
                            <LayerBlock title="1. System Prompt (Global)" color="border-indigo-500/50 bg-indigo-500/10">
                                {debugData.system_global}
                            </LayerBlock>

                            {/* Layer 2: Summary */}
                            <LayerBlock title="2. Conversation Summary (State)" color="border-orange-500/50 bg-orange-500/10" empty={!debugData.summary}>
                                {debugData.summary || "(Aucun résumé pour l'instant - Conversation trop courte)"}
                            </LayerBlock>

                            {/* Layer 3: Memory */}
                            <LayerBlock title="3. Long Term Memory (RAG)" color="border-emerald-500/50 bg-emerald-500/10" empty={!debugData.memory_context}>
                                {debugData.memory_context || "(Aucune mémoire pertinente trouvée)"}
                            </LayerBlock>

                            {/* Layer 4: History */}
                            <div className="ml-12 space-y-2">
                                <div className="text-xs uppercase font-bold text-white/30 mb-1">4. Sliding Window ({debugData.recent_history?.length || 0} messages)</div>
                                {(debugData.recent_history || []).map((msg, idx) => (
                                    <div key={idx} className={`p-3 rounded border text-sm ${msg.role === 'user' ? 'bg-white/5 border-white/10 ml-8' : 'bg-[#1e1e2e] border-indigo-500/20 mr-8'}`}>
                                        <div className="text-[10px] opacity-50 uppercase mb-1">{msg.role}</div>
                                        {msg.content.substring(0, 150)}{msg.content.length > 150 ? "..." : ""}
                                    </div>
                                ))}
                            </div>

                            {/* Layer 5: Input */}
                            <LayerBlock title="5. New User Input (Trigger)" color="border-pink-500/50 bg-pink-500/10">
                                {debugData.user_input}
                            </LayerBlock>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LayerBlock({ title, children, color, empty }: any) {
    return (
        <div className={`relative ml-12 p-4 rounded-xl border ${color} backdrop-blur-sm transition-all hover:scale-[1.01] ${empty ? 'opacity-50 grayscale' : ''}`}>
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0f0f16] border border-white/10 flex items-center justify-center text-xs font-bold text-white/50 z-10">
                {title.split('.')[0]}
            </div>
            <div className="text-xs uppercase font-bold text-white/60 mb-2">{title}</div>
            <pre className="whitespace-pre-wrap text-sm text-white/80 font-mono overflow-x-auto">
                {children}
            </pre>
        </div>
    );
}
