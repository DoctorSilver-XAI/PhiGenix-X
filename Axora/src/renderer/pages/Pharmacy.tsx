import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ToolCard } from '../components/ui/ToolCard';
import { GlassCard } from '../components/ui/GlassCard';
import { StatusDot } from '../components/ui/StatusDot';
import { motion } from 'framer-motion';

export function Pharmacy() {
    const navigate = useNavigate();
    return (
        <div className="p-8 h-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Outils Officine
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        V 2.0
                    </span>
                </h1>
                <p className="text-white/50">
                    Suite d'outils cliniques pour la Grande Pharmacie de Tassigny.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ToolCard
                    title="Plan Personnalisé de Prévention"
                    description="Générer un bilan personnalisé complet pour le patient."
                    icon="📋"
                    colorVar="var(--mint)"
                    status="beta"
                    onClick={() => navigate('/ppp')}
                />
                <ToolCard
                    title="TROD Angine"
                    description="Dépistage angines à streptocoque A. Protocole complet."
                    icon="🌡️"
                    colorVar="var(--cyan)"
                    status="ready"
                    onClick={() => console.log('Open TROD')}
                />
                <ToolCard
                    title="Prescription Vaccinale"
                    description="Éligibilité et bon de vaccination."
                    icon="💉"
                    colorVar="var(--iris)"
                    status="ready"
                    onClick={() => console.log('Open Vaccin')}
                />
                <ToolCard
                    title="Ordonnance Sécurisée"
                    description="Analyse des interactions et contre-indications."
                    icon="🛡️"
                    colorVar="var(--amber)"
                    status="soon"
                />
            </div>

            {/* Context Widget */}
            <div className="mt-12">
                <h2 className="text-lg font-semibold mb-4 text-white/80">État du système</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard variant="default" className="flex items-center justify-between p-4 bg-white/5 border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="text-2xl">💳</div>
                            <div>
                                <div className="font-semibold text-sm">Lecteur Vitale</div>
                                <div className="text-xs text-white/50">En attente de carte...</div>
                            </div>
                        </div>
                        <StatusDot status="busy" size={10} />
                    </GlassCard>

                    <GlassCard variant="default" className="flex items-center justify-between p-4 bg-white/5 border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="text-2xl">☁️</div>
                            <div>
                                <div className="font-semibold text-sm">Synchronisation Cloud</div>
                                <div className="text-xs text-white/50">À jour</div>
                            </div>
                        </div>
                        <StatusDot status="connected" size={10} />
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
