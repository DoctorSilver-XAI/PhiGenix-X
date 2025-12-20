import { NavLink } from 'react-router-dom';
import { MessageSquare, GraduationCap, Pill, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AxoraLogo } from './AxoraLogo';

import { Eye } from 'lucide-react';
import { usePhiVision } from '../services/PhiVisionContext';

/**
 * Composant Sidebar (La barre latérale gauche du Hub)
 * ---------------------------------------------------
 * C'est le menu de navigation principal de l'application en mode "Grand Écran" (Hub).
 * Il contient :
 * 1. Le branding (Logo + Nom)
 * 2. Le bouton d'activation rapide de PhiVision (L'œil)
 * 3. Les liens de navigation vers les différents modules (Assistant, Pharmacie, etc.)
 * 4. Le menu utilisateur en bas (Profil + Paramètres)
 */
export function Sidebar() {
    // Récupération du contexte PhiVision (l'IA visuelle)
    // - togglePhiVision : Ouvre/Ferme le panneau d'analyse
    // - triggerAnalysis : Lance une capture d'écran et l'analyse
    // - isActive : Est-ce que le panneau est ouvert ?
    // - isAnalyzing : Est-ce qu'une analyse est en cours (loading) ?
    const { togglePhiVision, triggerAnalysis, isActive, isAnalyzing } = usePhiVision();

    // État local pour gérer l'ouverture du petit menu "Utilisateur" (popup qui monte)
    const [showUserMenu, setShowUserMenu] = useState(false);

    /**
     * EFFET : Raccourci Clavier Global (Cmd+Shift+P ou Ctrl+Shift+P)
     * Permet à l'utilisateur de lancer PhiVision sans utiliser la souris.
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Détection : (Meta/Ctrl) + Shift + P
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
                if (!isActive) togglePhiVision(); // Ouvre si fermé
                triggerAnalysis(); // Lance l'analyse
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, togglePhiVision, triggerAnalysis]);

    // --- CONFIGURATION DES LIENS ---

    // Liens principaux (affichés en haut)
    const mainLinks = [
        { to: '/', icon: MessageSquare, label: 'Assistant' }, // Chatbot
        { to: '/pharma', icon: Pill, label: 'Outils Pharmacie' }, // Outils métier
        // { to: '/ppp', icon: GraduationCap, label: 'Formation' }, // (Commenté/Futur)
    ];

    // Liens secondaires (cachés dans le menu utilisateur du bas)
    const hiddenLinks = [
        { to: '/settings', icon: Settings, label: 'Paramètres' },
    ];

    return (
        /* CONTENEUR PRINCIPAL DE LA SIDEBAR */
        <div
            // Styles Tailwind : Largeur fixe (w-64), Hauteur écran (h-screen), Fond sombre semi-transparent
            className="w-64 h-screen bg-[#1a1c2e]/90 border-r border-[#2d323b] flex flex-col backdrop-blur-xl relative"

            // GESTION SOURIS (Spécifique Electron) :
            // Quand la souris est SUR la sidebar, on dit à la fenêtre de capturer les clics ("setIgnoreMouse(false)")
            // C'est utile si la fenêtre globale est transparente/click-through par défaut.
            onMouseEnter={() => {
                window.axora?.setIgnoreMouse(false);
            }}
            onMouseLeave={() => {
                window.axora?.setIgnoreMouse(true);
            }}
        >
            {/* 1. SECTION LOGO (Haut) */}
            <div className="p-6 flex items-center gap-3">
                <AxoraLogo size={42} />
                <div className="flex flex-col">
                    {/* Nom de l'application avec un effet de dégradé sur le texte */}
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 leading-none">
                        Axora Pro
                    </span>
                    {/* Version / Sous-titre */}
                    <span className="text-[10px] text-indigo-400 font-medium tracking-wider mt-1">
                        PHIGENIX 6.0
                    </span>
                </div>
            </div>

            {/* 2. BOUTON D'ACTION PHIVISION (Le gros bouton coloré) */}
            <div className="px-4 mb-4">
                <button
                    onClick={() => {
                        if (!isActive) togglePhiVision();
                        triggerAnalysis(); // Déclenche l'analyse immédiate (Vente libre ou autre)
                    }}
                    // Classes dynamiques : change de couleur si actif (Rouge/Rose) ou inactif (Cyan/Bleu)
                    className={`
                        w-full flex items-center justify-center gap-2 p-3 rounded-xl 
                        font-bold text-sm transition-all duration-300 shadow-lg
                        ${isActive
                            ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-red-500/20' // Style si actif (pour arrêter)
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02]' // Style par défaut
                        }
                    `}
                >
                    {/* Icône Oeil (anime-pulse si analyse en cours) */}
                    <Eye size={18} className={isAnalyzing ? 'animate-pulse' : ''} />
                    {/* Texte du bouton */}
                    {isAnalyzing ? 'Analyse...' : (isActive ? 'Arrêter PhiVision' : 'Activer PhiVision')}
                </button>
            </div>

            {/* 3. NAVIGATION PRINCIPALE (La liste des liens) */}
            <nav className="flex-1 px-4 py-4 space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                    Workspace
                </div>
                {mainLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        // Style conditionnel NavLink : Si le lien est actif (page courante), on le met en surbrillance
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10' // Actif
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200' // Inactif
                            }`
                        }
                    >
                        <link.icon size={18} />
                        <span className="font-medium">{link.label}</span>

                        {/* Petit point vert pour indiquer une notification ou un statut spécial sur la page Pharmacie */}
                        {link.to === '/pharma' && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        )}
                    </NavLink>
                ))}
            </nav>



            <nav className="flex-1 px-4 py-4 space-y-2 hidden"> {/* Spacer (espace vide) si besoin */}
            </nav>

            {/* 4. PIED DE SIDEBAR (Profil Utilisateur & Menu Paramètres) */}
            <div className="p-4 border-t border-[#2d323b] relative">

                {/* POPUP MENU UTILISATEUR (S'affiche au clic) */}
                <AnimatePresence>
                    {showUserMenu && (
                        <motion.div
                            // Animation d'apparition
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-4 right-4 mb-2 bg-[#1a1c2e] border border-[#2d323b] rounded-xl shadow-2xl overflow-hidden z-50 p-1"
                        >
                            {/* Liste des liens cachés (Paramètres) */}
                            {hiddenLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setShowUserMenu(false)} // Ferme le menu après clic
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

                {/* BOUTON PROFIL (Déclenche le menu) */}
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-3 w-full p-2 rounded-xl transition-colors text-left group ${showUserMenu ? 'bg-white/5' : 'hover:bg-white/5'}`}
                >
                    {/* Avatar (Initiales PV) */}
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-white/10 group-hover:border-white/20">
                        PV
                    </div>
                    {/* Nom et Rôle */}
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium text-gray-200 truncate">Pierre</div>
                        <div className="text-xs text-gray-500 truncate">Pharmacien</div>
                    </div>
                </button>

                {/* BOUTON REDUIRE (Retour au mode Sidecar/Compact) */}
                <button
                    onClick={() => {
                        // Appel IPC pour dire à Electron de revenir en mode "compact" (petite fenêtre)
                        if (window.axora) window.axora.setMode('compact');
                    }}
                    title="Réduire en Sidecar"
                    className="flex items-center justify-center p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                    {/* Icône personnalisée de réduction */}
                    <div className="w-5 h-5 border-2 border-current rounded-md flex items-center justify-center">
                        <div className="w-2 h-0.5 bg-current" />
                    </div>
                </button>
            </div>
        </div>
    );
}
