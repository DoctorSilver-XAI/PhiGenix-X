import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { OPENAI_CONFIG, DEFAULT_AGE_RANGE, PHARMACISTS, PHARMACY_NAME, themes } from '../data/ppp/config';
import { templates } from '../data/ppp/templates';
import { SYSTEM_PROMPT } from '../data/ppp/prompts';
import { detectAgeBucket, sanitizeJson, sanitizeList } from '../utils/pppLogic';
import './ppp.css';

// --- HELPER to convert hex to RGB/RGBA ---
const hexToRgb = (hex: string) => {
    const normalized = hex.replace("#", "");
    const bigint = parseInt(normalized.length === 3 ? normalized.split("").map(c => c + c).join("") : normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
};

const withAlpha = (hex: string, alpha: number) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// --- TYPES ---
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

    // UI Logic State
    const [notes, setNotes] = useState('');
    const [showAssistant, setShowAssistant] = useState(false); // inputSection hidden toggle
    const [previewMode, setPreviewMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Header Info
    const [patientName, setPatientName] = useState('');
    const [selectedPharmacist, setSelectedPharmacist] = useState('');
    const [date, setDate] = useState(new Date().toLocaleDateString('fr-FR'));

    // Upload
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Apply Theme CSS Variables properly to the container
    const containerRef = useRef<HTMLDivElement>(null);

    const applyThemeVariables = (range: string) => {
        if (!containerRef.current) return;
        const theme = themes[range] || themes[DEFAULT_AGE_RANGE];
        const el = containerRef.current;

        el.style.setProperty("--primary-color", theme.primaryColor);
        el.style.setProperty("--accent-color", theme.accentColor);
        el.style.setProperty("--bg-color", theme.backgroundColor);

        // Derived vars
        el.style.setProperty("--accent-shadow", withAlpha(theme.accentColor, 0.2));
        el.style.setProperty("--dotted", withAlpha(theme.accentColor, 0.55));
    };

    useEffect(() => {
        applyThemeVariables(ageRange);
    }, [ageRange]);

    // Handle Image Upload
    const handleImageDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setImageBase64(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Loader Logic (Phased)
    useEffect(() => {
        let timer: any;
        if (loading) {
            setProgress(5);
            const phases = [
                { target: 35, min: 2, max: 10, delayMin: 250, delayMax: 600 },
                { target: 65, min: 1, max: 5, delayMin: 350, delayMax: 780 },
                { target: 92, min: 0.5, max: 4, delayMin: 300, delayMax: 650 }
            ];

            const step = () => {
                const phase = phases.find(p => progress < p.target) || phases[phases.length - 1];
                const increment = phase.min + Math.random() * (phase.max - phase.min);
                setProgress(prev => Math.min(prev + increment, phase.target));

                if (progress < 92) {
                    const delay = phase.delayMin + Math.random() * (phase.delayMax - phase.delayMin);
                    timer = setTimeout(step, delay);
                }
            };
            timer = setTimeout(step, 250);
        } else {
            if (progress > 0) setProgress(100);
            setTimeout(() => setProgress(0), 500);
        }
        return () => clearTimeout(timer);
    }, [loading, progress]);

    // API Generation (Mock/Real)
    const handleGenerate = async () => {
        if (!notes && !imageBase64) {
            alert("Ajoutez au moins une note ou une capture.");
            return;
        }
        // Check mandatory fields (Legacy Strict Behavior)
        const patientNameEl = document.querySelector('.id-value[contenteditable]');
        const patientNameVal = patientNameEl?.textContent?.trim();
        const pharmacienEl = document.querySelector('.ppp-select');

        let isValid = true;
        let firstInvalidEl = null;

        if (!patientNameVal) {
            isValid = false;
            patientNameEl?.classList.add("input-error");
            patientNameEl?.addEventListener("input", () => patientNameEl.classList.remove("input-error"), { once: true });
            if (!firstInvalidEl) firstInvalidEl = patientNameEl;
        }

        if (!previewMode && !selectedPharmacist) { // Logic from main.js checks value
            isValid = false;
            pharmacienEl?.classList.add("input-error");
            pharmacienEl?.addEventListener("change", () => pharmacienEl.classList.remove("input-error"), { once: true });
            if (!firstInvalidEl) firstInvalidEl = pharmacienEl;
        }

        if (!isValid) {
            alert("Veuillez remplir les champs obligatoires (Patient, Pharmacien).");
            if (firstInvalidEl) (firstInvalidEl as HTMLElement).focus();
            return;
        }

        setLoading(true);
        try {
            let apiKey = localStorage.getItem("openaiApiKey");
            if (!apiKey) apiKey = OPENAI_CONFIG.API_KEY;
            apiKey = apiKey?.trim();

            const systemPrompt = localStorage.getItem("pppCustomPrompt") || SYSTEM_PROMPT;

            if (!apiKey) throw new Error("Clé API manquante");

            const messages: any[] = [{ role: "system", content: systemPrompt }];
            const userContent = `Tranche d'âge: ${ageRange || "non précisée"}\nNotes d'entretien: ${notes || "Aucune note fournie."}`;
            if (imageBase64) {
                messages.push({
                    role: "user",
                    content: [
                        { type: "text", text: userContent },
                        { type: "image_url", image_url: { url: imageBase64 } }
                    ]
                });
            } else {
                messages.push({ role: "user", content: userContent });
            }

            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: OPENAI_CONFIG.MODEL,
                    max_tokens: OPENAI_CONFIG.MAX_TOKENS,
                    response_format: { type: "json_object" },
                    messages
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Erreur OpenAI (${res.status}): ${errText}`);
            }

            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) throw new Error("Réponse vide de l'IA");

            const sanitized = sanitizeJson(content);
            if (!sanitized) throw new Error("Impossible de nettoyer le JSON");

            const parsed = JSON.parse(sanitized);

            if (parsed) {
                setPPPData({
                    priorities: sanitizeList([...(parsed.priorities || []), ...(parsed.vaccins_depistages || [])]),
                    freins: sanitizeList(parsed.freins || []),
                    conseils: sanitizeList(parsed.conseils || []),
                    ressources: sanitizeList(parsed.ressources || []),
                    suivi: sanitizeList(parsed.suivi || [])
                });
                setShowAssistant(false);
            }

        } catch (error: any) {
            console.error("❌ [PPP] Global Error:", error);
            alert(`Erreur: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const fillExample = () => {
        const tpl = templates[ageRange as any]; // Cast to any to suppress index error
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

    return (
        <div className={`ppp-container ${previewMode ? 'preview-mode-active' : ''}`} ref={containerRef}>

            {previewMode && (
                <div className="preview-controls screen-only" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', gap: '10px' }}>
                    <button className="btn" onClick={() => window.print()} style={{ background: 'white', border: '1px solid #ccc' }}>🖨️ Lancer l'impression</button>
                    <button className="btn fill close-preview-btn" onClick={() => setPreviewMode(false)}>
                        Fermer l'aperçu
                    </button>
                </div>
            )}

            <div className="ppp-page">
                {/* HEADER */}
                <header className="ppp-page-header">
                    <div className="header-top-row">
                        <div className="pharmacy-branding">
                            {/* Placeholder Logo */}
                            <div className="pharmacy-logo" style={{ background: 'linear-gradient(135deg, #1e3a8a, #06b6d4)', borderRadius: '8px' }}></div>
                            <div className="pharmacy-name" contentEditable>{PHARMACY_NAME}</div>
                        </div>
                        <div className="header-right">
                            <div className="report-title">Mon Bilan Prévention</div>
                            <div className="age" style={{ color: 'var(--primary-color)' }}>{ageRange} ans</div>
                        </div>
                    </div>

                    <div className="header-info-row">
                        <div className="info-item">
                            <span className="label">Patient :</span>
                            <span className="id-value" contentEditable onInput={(e) => setPatientName(e.currentTarget.textContent || "")} />
                        </div>
                        <div className="info-item">
                            <span className="label">Pharmacien :</span>
                            <select className="ppp-select screen-only" value={selectedPharmacist} onChange={e => setSelectedPharmacist(e.target.value)}>
                                <option value="" disabled>Sélectionner...</option>
                                {PHARMACISTS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <span className="id-value print-only" style={{ borderBottom: 'none' }}>{selectedPharmacist}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Date :</span>
                            <span className="id-value" contentEditable>{date}</span>
                        </div>
                    </div>

                    <div className="header-controls screen-only">
                        <div className="age-select">
                            <label>Tranche d'âge :</label>
                            <select className="age-select-input" value={ageRange} onChange={e => setAgeRange(e.target.value)}>
                                {Object.keys(themes).map(r => <option key={r} value={r}>{r} ans</option>)}
                            </select>
                        </div>
                        <div className="action-buttons">
                            <button className="btn fill" onClick={fillExample}>📄 Remplir l'exemple</button>
                            <button className="btn" onClick={() => setPPPData({ priorities: [], freins: [], conseils: [], ressources: [], suivi: [] })}>🧹 Effacer</button>
                            <button className="btn" onClick={() => setPreviewMode(true)}>👁️ Aperçu</button>
                            <button className="btn ghost" onClick={handlePrint}>🖨️ Imprimer</button>
                            <button className="btn ghost" onClick={() => navigate(-1)}>🔙 Sortir</button>
                        </div>
                    </div>
                </header>

                {/* ASSISTANT SECTION */}
                <section className="input-toggle screen-only">
                    <button className="btn ghost" onClick={() => setShowAssistant(!showAssistant)}>
                        {showAssistant ? "🔒 Masquer l'assistant PhiGenix 6.0" : "🤖 Ouvrir l'assistant PhiGenix 6.0"}
                    </button>
                </section>

                {showAssistant && (
                    <section className="input-section screen-only">
                        <div
                            className={`upload-zone ${isDragging ? 'dragover' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleImageDrop}
                            onClick={() => document.getElementById('ppp-file')?.click()}
                        >
                            <input type="file" id="ppp-file" hidden accept="image/*" onChange={e => {
                                if (e.target.files?.[0]) {
                                    const r = new FileReader();
                                    r.onload = (ev) => setImageBase64(ev.target?.result as string);
                                    r.readAsDataURL(e.target.files[0]);
                                }
                            }} />
                            {imageBase64 ? <img src={imageBase64} alt="Preview" style={{ maxHeight: 200, borderRadius: 8 }} /> : (
                                <p>📷 Cliquez ou glissez la capture du dossier pharmaceutique</p>
                            )}
                        </div>

                        <div className="notes-zone">
                            <label>Notes de l'entretien :</label>
                            <textarea rows={4} value={notes} onChange={e => {
                                setNotes(e.target.value);
                                const det = detectAgeBucket(e.target.value);
                                if (det && det !== ageRange) setAgeRange(det);
                            }} placeholder="Décrivez le déroulé du bilan..."></textarea>
                        </div>

                        <button className="btn fill" onClick={handleGenerate} disabled={loading}>
                            {loading ? "Génération en cours..." : "✍️ Finaliser le PPP"}
                        </button>

                        {loading && (
                            <div className="loading">
                                <div className="spinner">
                                    <div className="dot"></div><div className="dot dot2"></div><div className="dot dot3"></div>
                                </div>
                                <div className="loading-progress">
                                    <div className="loading-progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* HERO */}
                <section className="hero">
                    <h1>Plan Personnalisé de Prévention</h1>
                    <p>Rédaction partagée (par la personne et le professionnel de santé), à l'issue de l'intervention brève.</p>
                </section>

                {/* GRID */}
                <section className="ppp-grid">
                    <div className="column">
                        <div className="col-title" data-ico="★">Mes priorités santé<sup>1</sup></div>
                        <ul className="lines">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} contentEditable suppressContentEditableWarning>{pppData.priorities[i] || ""}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="column">
                        <div className="col-title" data-ico="⚠">Freins rencontrés</div>
                        <ul className="lines">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} contentEditable suppressContentEditableWarning>{pppData.freins[i] || ""}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="column">
                        <div className="col-title" data-ico="✓">Conseils, modalités<sup>2</sup></div>
                        <ul className="lines">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} contentEditable suppressContentEditableWarning>{pppData.conseils[i] || ""}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="column">
                        <div className="col-title" data-ico="➜">Ressources</div>
                        <ul className="lines">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <li key={i} contentEditable suppressContentEditableWarning>{pppData.ressources[i] || ""}</li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* FOLLOW UP */}
                <section className="follow-up">
                    <div className="follow-title">Modalités de suivi</div>
                    <div className="follow-line" contentEditable suppressContentEditableWarning>{pppData.suivi[0] || ""}</div>
                    <div className="follow-line" contentEditable suppressContentEditableWarning>{pppData.suivi[1] || ""}</div>
                </section>

                <div className="separator" style={{ borderBottom: '1px dotted #c5c5c5', margin: '6px 0 10px' }}></div>

                <p className="motivation">
                    Changer d'habitude n'est pas facile. Échanger avec une ou plusieurs personnes de confiance sur vos objectifs est un facteur de succès important.
                </p>

                <div className="checkbox-row">
                    <label className="checkbox-label">
                        <input type="checkbox" className="checkbox-input" />
                        <span className="checkbox"></span>
                        <span style={{ fontSize: '0.75rem' }}>Je m'oppose à ce que ce document soit communiqué à mon médecin traitant.</span>
                    </label>
                </div>

                <div className="footer-grid">
                    <section className="legal-mentions">
                        <div className="legal-title">Mentions informatives</div>
                        <ul>
                            <li>Document à disposition du patient à l'issue du bilan.</li>
                            <li>Données issues du dossier pharmaceutique et de l'entretien.</li>
                            <li>Partage médecin traitant uniquement après accord.</li>
                        </ul>
                    </section>

                    <div className="footer-notes">
                        <div className="item"><span className="n">1</span>Priorités définies avec l'appui du pro.</div>
                        <div className="item"><span className="n">2</span>Ex: Appeler ligne écoute, consulter spécialiste...</div>
                    </div>

                    <div className="signature-block">
                        <div className="sig-label">Cachet et Signature</div>
                        <div className="sig-area"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
