import React, { useState, useEffect } from 'react';
import { StatusDot } from './ui/StatusDot';
import { AxoraLogo } from './AxoraLogo';
import { SidecarConfig } from '../../config/sidecar.config';
import { usePhiVision } from '../services/PhiVisionContext';

/**
 * Interface définissant les propriétés (props) acceptées par le composant Sidecar.
 * @property mode - Le mode d'affichage actuel :
 *  - 'compact' : La petite barre flottante habituelle.
 *  - 'phivision' : Le mode analyse (la barre reste visible mais le comportement change).
 *  - 'hub' : Rarement utilisé ici car le Hub remplace le Sidecar, mais présent pour le typage.
 */
interface SidecarProps {
    mode?: 'compact' | 'hub' | 'phivision';
}

/**
 * Composant Sidecar (La "Pilule" Flottante)
 * C'est l'interface principale toujours visible de l'assistant.
 */
const Sidecar: React.FC<SidecarProps> = ({ mode = 'compact' }) => {
    // Hook personnalisé pour gérer l'intelligence visuelle (PhiVision)
    // isActive: si l'overlay est ouvert
    // isAnalyzing: si une analyse est en cours
    // triggerAnalysis: fonction pour lancer l'analyse
    // closePhiVision: fonction pour fermer l'overlay
    const { triggerAnalysis, isAnalyzing, isActive, closePhiVision } = usePhiVision();

    /**
     * Fonction pour changer le mode de l'application via le pont IPC (Inter-Process Communication).
     * Envoie un message au processus Main (Electron) pour redimensionner la fenêtre.
     */
    const switchMode = (newMode: 'hub' | 'compact') => {
        window.axora?.setMode(newMode);
    };

    /**
     * EFFET DE BORD : Gestion de la "cliquabilité" de la fenêtre Electron.
     * 
     * Quand on est en mode 'compact', on veut que la souris interagisse toujours.
     * En mode 'phivision', c'est géré dynamiquement (voir handleMouseEnter/Leave).
     */
    useEffect(() => {
        if (mode === 'compact') {
            // Dit à Electron : "Ne pas ignorer la souris" (la fenêtre capture les clics)
            window.axora?.setIgnoreMouse(false);
        }
    }, [mode]);

    /**
     * Gère l'entrée de la souris dans la zone du Sidecar.
     * CRITIQUE EN MODE PHIVISION :
     * En mode PhiVision (overlay plein écran), l'utilisateur doit pouvoir cliquer "au travers" 
     * de l'écran vide pour interagir avec son logiciel métier.
     * MAIS il doit aussi pouvoir cliquer sur le Sidecar.
     * Donc : Si la souris survole le Sidecar -> On active les clics (setIgnoreMouse false).
     */
    const handleMouseEnter = () => {
        if (mode === 'phivision') {
            window.axora?.setIgnoreMouse(false);
        }
    };

    /**
     * Gère la sortie de la souris du Sidecar.
     * Inverse de handleMouseEnter : Si on quitte le Sidecar en mode PhiVision,
     * on rend la main au logiciel métier derrière (setIgnoreMouse true).
     */
    const handleMouseLeave = () => {
        if (mode === 'phivision') {
            window.axora?.setIgnoreMouse(true);
        }
    };

    /**
     * Action du bouton principal (L'œil / Scanner).
     * - Si déjà actif (overlay ouvert) -> On ferme.
     * - Sinon -> On lance l'analyse (capture d'écran + IA).
     */
    const handlePhiVisionClick = () => {
        if (isActive) {
            closePhiVision();
        } else {
            triggerAnalysis();
        }
    };

    // --- GESTION DU DRAG & DROP (DÉPLACEMENT) ---

    // On ne peut déplacer la fenêtre qu'en mode 'compact'.
    const canDrag = SidecarConfig.behavior.isDraggable && mode === 'compact';

    // Style CSS spécial pour Electron qui rend la zone "agrippable".
    const dragStyle = canDrag ? {
        WebkitAppRegion: 'drag',
    } as React.CSSProperties : {};

    // Style CSS pour les boutons : ils ne doivent PAS être agrippables (sinon on ne peut pas cliquer dessus).
    const noDragStyle = {
        WebkitAppRegion: 'no-drag',
    } as React.CSSProperties;


    /**
     * Calcule le style du conteneur principal (la position sur l'écran).
     * Ce style change radicalement entre le mode Compact et PhiVision.
     */
    const getContainerStyle = (): React.CSSProperties => {
        // CAS 1 : MODE PHIVISION (Overlay Plein Écran)
        // Le Sidecar doit rester à sa place visuelle, mais techniquement il est dans une fenêtre plein écran.
        // On doit donc le positionner en "absolu" ou "fixed" pour simuler sa position habituelle.
        if (mode === 'phivision') {
            const { height: h, width: w } = SidecarConfig.visual;
            const { margins, xAxisAlign, yAxisAlign } = SidecarConfig.position;

            // Calcul de la position verticale (Top)
            let topCalc: string;
            if (yAxisAlign === 'top') {
                topCalc = (margins.top || 0) + 'px';
            } else if (yAxisAlign === 'bottom') {
                topCalc = `calc(100vh - ${h}px - ${margins.bottom || 0}px)`;
            } else if (yAxisAlign === 'upper-quarter') {
                topCalc = `calc(25vh - ${h / 2}px)`;
            } else {
                // centré par défaut
                topCalc = `calc(50vh - ${h / 2}px)`;
            }

            // Calcul de la position horizontale (Left/Right)
            const positionStyle: React.CSSProperties = xAxisAlign === 'left'
                ? { left: (margins.left || 0) + 'px' }
                : { right: (margins.right || 0) + 'px' };

            return {
                position: 'fixed',
                ...positionStyle,
                top: topCalc,
                width: `${w}px`,
                height: `${h}px`,
                zIndex: 10001, // Toujours au-dessus de l'overlay sombre
            };
        }

        // CAS 2 : MODE COMPACT (Fenêtre normale)
        // Ici, la fenêtre Electron fait exactement la taille nécessaire (ou un peu plus large pour l'ombre).
        // On utilise Flexbox pour centrer le visuel dans la fenêtre transparente.
        const { yAxisAlign, xAxisAlign } = SidecarConfig.position;

        let alignItems: 'flex-start' | 'center' | 'flex-end' = 'center';
        if (yAxisAlign === 'top') {
            alignItems = 'flex-start';
        } else if (yAxisAlign === 'bottom') {
            alignItems = 'flex-end';
        }

        return {
            width: '100vw',
            height: '100vh', // La div prend toute la place de la fenêtre Electron
            display: 'flex',
            alignItems: alignItems,
            // On centre horizontalement car la fenêtre Electron est ajustée pour être sur le bord
            justifyContent: 'center',
            background: 'transparent'
        };
    };

    // --- RENDU DU COMPOSANT (JSX/HTML) ---
    return (
        /* 
           DIV PRINCIPALE (Invisible)
           Sert à positionner la "pilule" dans l'espace disponible.
           Gère aussi la détection de survol souris pour le mode PhiVision.
        */
        <div
            style={getContainerStyle()}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* 
               DIV VISUELLE (La "Pilule" ou "Glass Panel")
               C'est l'élément visible avec l'effet de flou et les bords arrondis.
            */}
            <div
                className="glass-panel"
                style={{
                    // Dimensions depuis la config
                    width: `${SidecarConfig.visual.width}px`,
                    height: `${SidecarConfig.visual.height}px`,
                    boxSizing: 'border-box',
                    borderRadius: `${SidecarConfig.visual.borderRadius}px`,

                    // Effets visuels (Verre dépoli)
                    backdropFilter: `blur(${SidecarConfig.theme.blurIntensity}px)`,
                    background: SidecarConfig.theme.backgroundColor,
                    boxShadow: SidecarConfig.theme.shadow.enabled ? SidecarConfig.theme.shadow.size + ' ' + SidecarConfig.theme.shadow.color : 'none',
                    border: `1px solid ${SidecarConfig.theme.borderColor}`,

                    // Mise en page interne (Colonne verticale)
                    userSelect: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px 0',
                    gap: '0',
                    overflow: 'hidden',

                    // Application du style "agrippable" pour déplacer la fenêtre
                    ...dragStyle
                }}
            >
                {/* 
                    ELEMENT 1 : INDICATEUR DE STATUT (Le point vert/orange)
                    Montre si Axora est connecté ou occupé.
                */}
                <div
                    style={{
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                    }}
                    title="Axora Connecté"
                >
                    <StatusDot status={isAnalyzing ? 'busy' : 'connected'} size={12} />
                </div>

                {/* 
                    ELEMENT 2 : BOUTON PRINCIPAL (Logo Axora)
                    Permet d'ouvrir le Hub (Grand écran).
                */}
                <button
                    className="icon-button"
                    onClick={() => switchMode('hub')}
                    aria-label="Ouvrir le Hub Axora"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        ...noDragStyle // Le bouton doit être cliquable, pas "dragable"
                    }}
                    // Petit effet de zoom au survol
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <AxoraLogo size={38} />
                </button>

                {/* 
                    ELEMENT 3 : SEPARATEUR
                    Une fine ligne pour séparer les fonctions de navigation des fonctions d'analyse.
                */}
                <div style={{
                    width: '24px',
                    height: '1px',
                    background: 'rgba(255,255,255,0.15)',
                    marginBottom: '16px'
                }} />

                {/* 
                    ELEMENT 4 : BOUTON PHIVISION (Le Scanner / L'Oeil)
                    Bouton complexe avec animations CSS (rotation, scan).
                */}
                <button
                    id="btn-vision"
                    onClick={handlePhiVisionClick}
                    // Classes utilitaires Tailwind pour l'apparence et l'animation
                    className={`phivision-btn group relative outline-none ring-0 border-none focus:outline-none focus:ring-0 ${isAnalyzing ? 'animate-pulse' : ''}`}
                    disabled={isAnalyzing}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '10px',
                        cursor: isAnalyzing ? 'wait' : 'pointer',
                        ...noDragStyle
                    }}
                >
                    <div className="relative w-[38px] h-[38px] flex items-center justify-center">
                        {/* CERCLE EXTERNE (HUD Ring) : Tourne en permanence */}
                        <div
                            className="absolute inset-0 rounded-full border border-dashed border-cyan-500/30 w-full h-full"
                            style={{ animation: 'hud-spin 12s linear infinite' }}
                        />

                        {/* LENTILLE CENTRALE */}
                        <div className="relative w-[28px] h-[28px] rounded-full bg-[#050b14] shadow-inner flex items-center justify-center border border-cyan-500/20 overflow-hidden group-hover:border-cyan-400/50 transition-colors duration-300">
                            {/* IRIS : L'élément coloré au centre */}
                            <div className="eye-iris w-[16px] h-[16px] rounded-full border border-cyan-500/50 bg-gradient-to-br from-cyan-900 to-indigo-900 flex items-center justify-center relative shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all duration-300">
                                {/* SCAN LINE : Le trait qui balaie de haut en bas */}
                                <div
                                    className="absolute w-full h-[1px] bg-cyan-400 blur-[0.5px] shadow-[0_0_5px_cyan]"
                                    style={{ animation: 'scan-line 2s ease-in-out infinite' }}
                                />
                                {/* PUPILLE : Le point blanc central */}
                                <div className="eye-pupil w-[5px] h-[5px] bg-cyan-100 rounded-sm shadow-[0_0_8px_rgba(255,255,255,0.9)] transition-all duration-300"></div>
                            </div>
                        </div>
                    </div>

                    {/* INFOBULLE (Tooltip) : Apparaît au survol (hover) */}
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900/90 backdrop-blur-md text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-30 shadow-xl text-cyan-100">
                        {isAnalyzing ? "Analyse..." : "PhiVision v2.5"}
                    </div>
                </button>

            </div>
        </div>
    );
};

export default Sidecar;
