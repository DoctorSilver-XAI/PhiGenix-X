import React, { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Sparkles, Upload, Eraser, Eye, Save } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { OpenAIProvider } from '../services/ai/openai';
import { PPP_SYSTEM_PROMPT } from '../services/ai/prompts';

interface PPPData {
    priorities: string[];
    freins: string[];
    conseils: string[];
    ressources: string[];
    suivi: string[];
}

export function PreventionPlan() {
    const navigate = useNavigate();
    const [pppData, setPPPData] = useState<PPPData>({
        priorities: [],
        freins: [],
        conseils: [],
        ressources: [],
        suivi: []
    });
    const [loading, setLoading] = useState(false);
    const [ageRange, setAgeRange] = useState('45-50');
    const [notes, setNotes] = useState('');
    const [showAssistant, setShowAssistant] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    const [aiProvider] = useState(() => new OpenAIProvider());

    // Mock implementation for filling example data - adapt from old pppGenerator.js
    const fillExample = () => {
        setPPPData({
            priorities: ["Arrêt du tabac", "Activité physique régulière", "Alimentation équilibrée"],
            freins: ["Stress au travail", "Manque de temps", "Motivation fluctuante"],
            conseils: ["Substituts nicotiniques", "30min de marche rapide/jour", "Fruits et légumes à chaque repas"],
            ressources: ["Tabac Info Service (3989)", "Association sportive locale", "Consultation diététicienne"],
            suivi: ["RDV dans 1 mois", "Carnet de bord consommation"]
        });
    };

    const clearAll = () => {
        setPPPData({
            priorities: [],
            freins: [],
            conseils: [],
            ressources: [],
            suivi: []
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleGenerate = async () => {
        if (!notes.trim()) {
            // Very basic validation, in real app we might want a toast
            alert("Veuillez entrer des notes ou charger une image (non implémenté) pour générer le bilan.");
            return;
        }

        setLoading(true);
        try {
            await aiProvider.initialize();

            // Construct the messages
            const messages = [
                { role: 'system', content: PPP_SYSTEM_PROMPT },
                { role: 'user', content: `Tranche d'âge: ${ageRange}\n\nNotes du pharmacien:\n${notes}` }
            ];

            // Use GPT-4o or default to o1-preview if configured, but let's stick to gpt-4o for JSON reliability usually
            const response = await aiProvider.generateResponse(
                messages as any, // Type mismatch in existing service def vs strict role usage, casting for now
                'gpt-4o'
            );

            // Clean markdown code fences if present
            let jsonStr = response.text.trim();
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
            } else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');
            }

            const data = JSON.parse(jsonStr);
            console.log("AI Data:", data);

            setPPPData({
                priorities: data.priorities || [],
                freins: data.freins || [],
                conseils: data.conseils || [],
                ressources: data.ressources || [],
                suivi: data.suivi || []
            });
            setShowAssistant(false);

        } catch (error) {
            console.error("Erreur génération:", error);
            alert("Erreur lors de la génération. Vérifiez la clé API.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`h-full flex flex-col ${previewMode ? 'bg-white text-black p-0' : 'p-8 overflow-y-auto'}`}>
            {/* Header - Hidden in Print/Preview if needed, or styled differently */}
            <header className={`mb-8 flex items-center justify-between ${previewMode ? 'hidden' : ''}`}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                Mon Bilan Prévention
                            </span>
                        </h1>
                        <p className="text-white/50">Plan Personnalisé de Prévention</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={ageRange}
                        onChange={(e) => setAgeRange(e.target.value)}
                        className="bg-[#1a1c2e] border border-[#2d323b] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                    >
                        <option value="18-25">18-25 ans</option>
                        <option value="45-50">45-50 ans</option>
                        <option value="60-65">60-65 ans</option>
                        <option value="70-75">70-75 ans</option>
                    </select>

                    <button
                        onClick={fillExample}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                        <Sparkles size={16} />
                        <span className="text-sm font-medium">Exemple</span>
                    </button>

                    <button
                        onClick={clearAll}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                        <Eraser size={16} />
                        <span className="text-sm font-medium">Effacer</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                    >
                        <Printer size={16} />
                        <span className="text-sm font-medium">Imprimer</span>
                    </button>

                    <button
                        onClick={() => setShowAssistant(!showAssistant)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${showAssistant
                            ? 'bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/50'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25'
                            }`}
                    >
                        <Sparkles size={18} className={showAssistant ? "text-indigo-400" : "text-amber-300"} />
                        <span className="font-semibold">Assistant IA</span>
                    </button>
                </div>
            </header>

            {/* Assistant Panel */}
            <AnimatePresence>
                {showAssistant && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <GlassCard className="p-6 border-indigo-500/20 bg-indigo-500/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Notes de l'entretien
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Décrivez le déroulé du bilan, les sujets abordés..."
                                        className="w-full h-32 bg-[#13141f] border border-[#2d323b] rounded-xl p-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-[#2d323b] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500/50 hover:bg-[#13141f] transition-all cursor-pointer group">
                                        <div className="w-12 h-12 rounded-full bg-[#1a1c2e] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <Upload className="text-gray-400 group-hover:text-indigo-400" size={24} />
                                        </div>
                                        <p className="text-sm text-gray-400 group-hover:text-gray-300">
                                            Glisser une capture du dossier pharmaceutique
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Génération...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                Générer le PPP
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Grid content */}
            <div className={`grid grid-cols-4 gap-4 flex-1 ${previewMode ? 'text-black' : ''}`}>
                {/* Column 1: Priorities */}
                <div className="flex flex-col gap-2">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-t-lg flex items-center gap-2">
                        <span className="text-emerald-400">★</span>
                        <h3 className="font-semibold text-emerald-400 uppercase text-sm tracking-wider">Priorités</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-b-lg p-2 min-h-[400px] flex-1">
                        <ul className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} className="p-2 border-b border-white/5 min-h-[40px] text-sm text-gray-300 focus:outline-none focus:bg-white/5 rounded" contentEditable suppressContentEditableWarning>
                                    {pppData.priorities[i] || ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Column 2: Freins */}
                <div className="flex flex-col gap-2">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-t-lg flex items-center gap-2">
                        <span className="text-amber-400">⚠</span>
                        <h3 className="font-semibold text-amber-400 uppercase text-sm tracking-wider">Freins</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-b-lg p-2 min-h-[400px] flex-1">
                        <ul className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} className="p-2 border-b border-white/5 min-h-[40px] text-sm text-gray-300 focus:outline-none focus:bg-white/5 rounded" contentEditable suppressContentEditableWarning>
                                    {pppData.freins[i] || ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Column 3: Conseils */}
                <div className="flex flex-col gap-2">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-t-lg flex items-center gap-2">
                        <span className="text-blue-400">✓</span>
                        <h3 className="font-semibold text-blue-400 uppercase text-sm tracking-wider">Conseils</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-b-lg p-2 min-h-[400px] flex-1">
                        <ul className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} className="p-2 border-b border-white/5 min-h-[40px] text-sm text-gray-300 focus:outline-none focus:bg-white/5 rounded" contentEditable suppressContentEditableWarning>
                                    {pppData.conseils[i] || ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Column 4: Ressources */}
                <div className="flex flex-col gap-2">
                    <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-t-lg flex items-center gap-2">
                        <span className="text-purple-400">➜</span>
                        <h3 className="font-semibold text-purple-400 uppercase text-sm tracking-wider">Ressources</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-b-lg p-2 min-h-[400px] flex-1">
                        <ul className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} className="p-2 border-b border-white/5 min-h-[40px] text-sm text-gray-300 focus:outline-none focus:bg-white/5 rounded" contentEditable suppressContentEditableWarning>
                                    {pppData.ressources[i] || ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Print Styles Injection */}
            <style>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                     /* Reset for print */
                    .bg-white\\/5 {
                        background: transparent !important;
                        border: 1px solid #ccc !important;
                    }
                    .text-gray-300 {
                        color: black !important;
                    }
                    /* Hide header buttons */
                    header div.flex.items-center.gap-3 {
                        display: none !important;
                    }
                    /* Force black text colors for headers */
                    .text-emerald-400, .text-amber-400, .text-blue-400, .text-purple-400 {
                        color: black !important;
                        font-weight: bold;
                    }
                }
            `}</style>
        </div>
    );
}
