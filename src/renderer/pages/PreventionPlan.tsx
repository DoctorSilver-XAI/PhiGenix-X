import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Sparkles, Upload, Eraser, Settings, X, Save, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Strict Migration Imports
import { themes, OPENAI_CONFIG, DEFAULT_AGE_RANGE } from '../data/ppp/config';
import { templates } from '../data/ppp/templates';
import { SYSTEM_PROMPT } from '../data/ppp/prompts';
import { getThemeStyles, detectAgeBucket, sanitizeJson, sanitizeList } from '../utils/pppLogic';

// Local Storage Keys
const PROMPT_STORAGE_KEY = "pppCustomPrompt";
const API_KEY_STORAGE_KEY = "openaiApiKey";

interface PPPData {
    priorities: string[];
    freins: string[];
    conseils: string[];
    ressources: string[];
    suivi: string[];
}

export function PreventionPlan() {
    const navigate = useNavigate();

    // Core State
    const [ageRange, setAgeRange] = useState(DEFAULT_AGE_RANGE);
    const [pppData, setPPPData] = useState<PPPData>({
        priorities: [], freins: [], conseils: [], ressources: [], suivi: []
    });

    // UI State
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [showAssistant, setShowAssistant] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // Settings State
    const [customSystemPrompt, setCustomSystemPrompt] = useState(SYSTEM_PROMPT);
    const [customApiKey, setCustomApiKey] = useState('');

    // Refs for scrolling to errors if needed
    const assistantRef = useRef<HTMLDivElement>(null);

    // Load Settings on Mount
    useEffect(() => {
        const savedPrompt = localStorage.getItem(PROMPT_STORAGE_KEY);
        const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (savedPrompt) setCustomSystemPrompt(savedPrompt);
        if (savedKey) setCustomApiKey(savedKey);
    }, []);

    // Save Settings
    const handleSaveSettings = () => {
        if (customSystemPrompt.trim()) {
            localStorage.setItem(PROMPT_STORAGE_KEY, customSystemPrompt);
        } else {
            localStorage.removeItem(PROMPT_STORAGE_KEY);
            setCustomSystemPrompt(SYSTEM_PROMPT);
        }

        if (customApiKey.trim()) {
            localStorage.setItem(API_KEY_STORAGE_KEY, customApiKey);
        } else {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
        }
        setShowSettings(false);
        // Toast logic would go here
    };

    const handleResetSettings = () => {
        setCustomSystemPrompt(SYSTEM_PROMPT);
        localStorage.removeItem(PROMPT_STORAGE_KEY);
    };

    // Auto-detect Age from Notes
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNotes(value);
        const detected = detectAgeBucket(value);
        if (detected && detected !== ageRange) {
            setAgeRange(detected);
        }
    };

    // Template Logic (Strict Match)
    const fillExample = () => {
        const tpl = templates[ageRange];
        if (tpl) {
            setPPPData({
                priorities: [...tpl.priorities],
                freins: [...tpl.freins],
                conseils: [...tpl.conseils],
                ressources: [...tpl.ressources],
                suivi: tpl.suivi ? [...tpl.suivi] : []
            });
        }
    };

    const clearAll = () => {
        setPPPData({
            priorities: [], freins: [], conseils: [], ressources: [], suivi: []
        });
    };

    const handlePrint = () => {
        window.print();
    };

    // AI Generation Logic (Strict Port from openai.js)
    const handleGenerate = async () => {
        if (!notes.trim()) {
            alert("Veuillez entrer des notes pour générer le bilan.");
            return;
        }

        const apiKey = customApiKey || OPENAI_CONFIG.API_KEY;
        if (!apiKey) {
            alert("Clé API manquante. Veuillez la configurer dans les paramètres.");
            setShowSettings(true);
            return;
        }

        setLoading(true);
        try {
            const userText = `Tranche d'âge: ${ageRange}\nNotes d'entretien: ${notes}`;
            const messages = [
                { role: "system", content: customSystemPrompt },
                { role: "user", content: userText }
            ];

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: OPENAI_CONFIG.MODEL,
                    max_tokens: OPENAI_CONFIG.MAX_TOKENS,
                    response_format: { type: "json_object" },
                    messages
                })
            });

            if (!response.ok) throw new Error(`Erreur API: ${response.statusText}`);

            const json = await response.json();
            const content = json.choices?.[0]?.message?.content;
            if (!content) throw new Error("Réponse vide");

            const cleanedJson = sanitizeJson(content);
            if (!cleanedJson) throw new Error("Format JSON invalide");
            const data = JSON.parse(cleanedJson);

            // Fill Data (Strict Mapping)
            setPPPData({
                priorities: sanitizeList([...(data.priorities || []), ...(data.vaccins_depistages || [])]),
                freins: sanitizeList(data.freins || []),
                conseils: sanitizeList(data.conseils || []),
                ressources: sanitizeList(data.ressources || []),
                suivi: sanitizeList(data.suivi || [])
            });

            setShowAssistant(false);

        } catch (error) {
            console.error(error);
            alert("Erreur lors de la génération. Vérifiez la console.");
        } finally {
            setLoading(false);
        }
    };

    // Styled Components Helper
    const themeStyles = getThemeStyles(ageRange);

    return (
        <div
            className={`h-full flex flex-col ${previewMode ? 'bg-white text-black p-0' : 'p-8 overflow-y-auto'}`}
            style={themeStyles as any}
        >
            {/* CSS Variables Injection for Dynamic Theming */}
            <style>{`
                .ppp-theme-text { color: var(--primary-color) !important; }
                .ppp-theme-bg { background-color: var(--primary-color) !important; }
                .ppp-theme-border { border-color: var(--primary-color) !important; }
                .ppp-accent-bg-soft { background-color: var(--accent-shadow) !important; }
                .ppp-accent-border { border-color: var(--dotted) !important; }
                .ppp-accent-text { color: var(--accent-color) !important; }
            `}</style>

            {/* --- PRINT HEADER (Legacy Format) --- */}
            <div className={`print-header ${previewMode ? 'block' : 'hidden'} print:block mb-8`}>
                <div className="flex justify-between items-start mb-6 border-b-2 border-slate-800 pb-4">
                    <div className="flex items-center gap-4">
                        {/* Placeholder for Logo */}
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-xs">Logo</div>
                        <div className="font-bold text-xl uppercase tracking-wider text-slate-800">Grande Pharmacie de Tassigny</div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Mon Bilan Prévention</h1>
                        <div className="text-xl font-medium ppp-theme-text">{ageRange} ans</div>
                    </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200 mb-2">
                    <div className="flex gap-2">
                        <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">Patient :</span>
                        <span className="font-semibold text-slate-900 border-b border-dotted border-slate-400 min-w-[200px]" contentEditable suppressContentEditableWarning></span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">Pharmacien :</span>
                        <span className="font-semibold text-slate-900">Pierre Gil</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">Date :</span>
                        <span className="font-semibold text-slate-900">{new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>
            </div>

            {/* --- APP HEADER --- */}
            <header className={`mb-8 flex items-center justify-between ${previewMode ? 'hidden' : 'print:hidden'}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
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
                        {Object.keys(themes).map(range => (
                            <option key={range} value={range}>{range} ans</option>
                        ))}
                    </select>

                    <button onClick={fillExample} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                        <Sparkles size={16} /> <span className="text-sm font-medium">Exemple</span>
                    </button>

                    <button onClick={clearAll} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                        <Eraser size={16} /> <span className="text-sm font-medium">Effacer</span>
                    </button>

                    <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors">
                        <Printer size={16} /> <span className="text-sm font-medium">Imprimer</span>
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

                    {/* Settings Trigger */}
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {/* --- SETTINGS MODAL (Strict Port) --- */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden"
                    >
                        <GlassCard className="w-full max-w-2xl p-6 bg-[#13141f] border-slate-700">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Paramètres IA (Prompt)</h2>
                                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Clé API OpenAI</label>
                                    <input
                                        type="password"
                                        value={customApiKey}
                                        onChange={(e) => setCustomApiKey(e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full bg-[#1a1c2e] border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Prompt Système</label>
                                    <textarea
                                        value={customSystemPrompt}
                                        onChange={(e) => setCustomSystemPrompt(e.target.value)}
                                        className="w-full h-64 bg-[#1a1c2e] border border-slate-700 rounded-lg p-3 text-sm text-gray-300 font-mono focus:border-indigo-500 outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={handleResetSettings} className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 flex items-center gap-2">
                                    <RotateCcw size={16} /> Réinitialiser
                                </button>
                                <button onClick={handleSaveSettings} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
                                    <Save size={16} /> Enregistrer
                                </button>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- ASSISTANT PANEL --- */}
            <AnimatePresence>
                {showAssistant && (
                    <motion.div ref={assistantRef}
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden print:hidden"
                    >
                        <GlassCard className="p-6 border-indigo-500/20 bg-indigo-500/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Notes de l'entretien (Détection âge auto)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={handleNotesChange}
                                        placeholder="Ex: Patient de 22 ans, sommeil perturbé..."
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

            {/* --- MAIN GRID (Dynamic Theming) --- */}
            <div className={`grid grid-cols-4 gap-4 flex-1 ${previewMode ? 'text-black' : ''}`}>
                {/* Column 1: Priorities */}
                <div className="flex flex-col gap-2">
                    <div className="ppp-accent-bg-soft border ppp-accent-border p-3 rounded-t-lg flex items-center gap-2 print:border-slate-300 print:bg-transparent print:border-b-2">
                        <span className="ppp-theme-text font-bold">★</span>
                        <h3 className="font-semibold ppp-theme-text uppercase text-sm tracking-wider">Mes priorités santé<sup>1</sup></h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-b-lg p-2 min-h-[400px] flex-1 print:bg-transparent print:border-r print:border-slate-300 rounded-none">
                        <ul className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} className="p-2 border-b border-white/5 print:border-slate-200 min-h-[40px] text-sm text-gray-300 print:text-black focus:outline-none focus:bg-white/5 rounded" contentEditable suppressContentEditableWarning>
                                    {pppData.priorities[i] || ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Column 2: Freins */}
                <div className="flex flex-col gap-2">
                    <div className="ppp-accent-bg-soft border ppp-accent-border p-3 rounded-t-lg flex items-center gap-2 print:border-slate-300 print:bg-transparent print:border-b-2">
                        <span className="ppp-theme-text font-bold">⚠</span>
                        <h3 className="font-semibold ppp-theme-text uppercase text-sm tracking-wider">Freins rencontrés</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-b-lg p-2 min-h-[400px] flex-1 print:bg-transparent print:border-r print:border-slate-300 rounded-none">
                        <ul className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} className="p-2 border-b border-white/5 print:border-slate-200 min-h-[40px] text-sm text-gray-300 print:text-black focus:outline-none focus:bg-white/5 rounded" contentEditable suppressContentEditableWarning>
                                    {pppData.freins[i] || ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Column 3: Conseils */}
                <div className="flex flex-col gap-2">
                    <div className="ppp-accent-bg-soft border ppp-accent-border p-3 rounded-t-lg flex items-center gap-2 print:border-slate-300 print:bg-transparent print:border-b-2">
                        <span className="ppp-theme-text font-bold">✓</span>
                        <h3 className="font-semibold ppp-theme-text uppercase text-sm tracking-wider">Conseils, modalités<sup>2</sup></h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-b-lg p-2 min-h-[400px] flex-1 print:bg-transparent print:border-r print:border-slate-300 rounded-none">
                        <ul className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} className="p-2 border-b border-white/5 print:border-slate-200 min-h-[40px] text-sm text-gray-300 print:text-black focus:outline-none focus:bg-white/5 rounded" contentEditable suppressContentEditableWarning>
                                    {pppData.conseils[i] || ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Column 4: Ressources */}
                <div className="flex flex-col gap-2">
                    <div className="ppp-accent-bg-soft border ppp-accent-border p-3 rounded-t-lg flex items-center gap-2 print:border-slate-300 print:bg-transparent print:border-b-2">
                        <span className="ppp-theme-text font-bold">➜</span>
                        <h3 className="font-semibold ppp-theme-text uppercase text-sm tracking-wider">Ressources</h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-b-lg p-2 min-h-[400px] flex-1 print:bg-transparent print:border-l print:border-slate-300 rounded-none">
                        <ul className="space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} className="p-2 border-b border-white/5 print:border-slate-200 min-h-[40px] text-sm text-gray-300 print:text-black focus:outline-none focus:bg-white/5 rounded" contentEditable suppressContentEditableWarning>
                                    {pppData.ressources[i] || ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* --- LEGAL & FOOTER (Strict Match) --- */}
            <div className={`mt-8 pt-4 border-t-2 border-slate-800 ${previewMode ? 'block text-black' : 'hidden'} print:block`}>
                <div className="flex justify-between items-start gap-8">
                    <div className="flex-1 text-[10px] text-slate-500 leading-tight space-y-1">
                        <p className="font-bold text-slate-700 uppercase mb-1">Mentions informatives</p>
                        <ul className="list-disc pl-3 space-y-0.5">
                            <li>Document à disposition du patient à l'issue du bilan de prévention.</li>
                            <li>Données issues du dossier pharmaceutique et de l'entretien.</li>
                            <li>Document pouvant être partagé avec le médecin traitant uniquement après accord du patient.</li>
                        </ul>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-4 h-4 border border-slate-400 rounded-sm"></div>
                            <span>Je m'oppose à ce que ce document soit communiqué à mon médecin traitant.</span>
                        </div>
                    </div>

                    <div className="flex-1 text-[10px] text-slate-500 space-y-1">
                        <p><span className="font-bold mr-1">1</span>Les priorités sont définies avec l'appui du professionnel de santé.</p>
                        <p><span className="font-bold mr-1">2</span>Exemples : Appeler écoute tabac, consulter un spécialiste...</p>
                    </div>

                    <div className="flex-1 border border-slate-300 rounded p-2 h-24 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-700 uppercase">Cachet et Signature</span>
                        <div className="self-end text-[10px] text-slate-400 italic">Professionnel de santé</div>
                    </div>
                </div>
                <div className="text-center mt-4 text-[10px] text-slate-400 uppercase tracking-widest">
                    © PhiGenix 6.0 — {new Date().getFullYear()}
                </div>
            </div>

            {/* Print Styles Injection */}
            <style>{`
                @media print {
                    @page { size: A4 landscape !important; margin: 5mm !important; }
                    body { background: white !important; color: black !important; }
                    .print\\:block { display: block !important; }
                    .print\\:hidden, header { display: none !important; }
                    .p-8, .overflow-y-auto { padding: 0 !important; overflow: visible !important; height: auto !important; }
                    .text-white\\/50 { color: #666 !important; }
                    .text-gray-300 { color: black !important; }
                }
            `}</style>
        </div>
    );
}
