/**
 * @file sidecar.config.ts
 * @description Configuration centrale pour le composant Sidecar (barre latérale flottante).
 * Ce fichier permet de contrôler l'apparence, la position et le comportement de la fenêtre.
 */

export const SidecarConfig = {
    /**
     * ---------------------------------------------------------------------------
     * 1. DIMENSIONS VISUELLES (Le "conteneur" visible)
     * ---------------------------------------------------------------------------
     * Ce sont les dimensions de la "pilule" visible à l'écran.
     */
    visual: {
        width: 68,          // Largeur en pixels (ex: 68px pour une barre fine)
        height: 220,        // Hauteur en pixels
        borderRadius: 34,   // Rayon des coins (34px = arrondi complet pour largeur 68px)
    },

    /**
     * ---------------------------------------------------------------------------
     * 2. APPARENCE & THÈME
     * ---------------------------------------------------------------------------
     * Contrôle les couleurs, la transparence et les effets de verre.
     */
    theme: {
        // Couleur de fond (arrière-plan) en format RGBA
        // Le dernier chiffre (0.85) est l'opacité (0 = invisible, 1 = opaque)
        backgroundColor: 'rgba(12, 16, 24, 0.85)',

        // Couleur de la bordure (contour fin)
        borderColor: 'rgba(255, 255, 255, 0.1)',

        // Intensité du flou d'arrière-plan (effet verre dépoli)
        // Plus la valeur est haute, plus l'arrière-plan est flou.
        blurIntensity: 16,  // en pixels (px)

        // Ombre portée (Shadow)
        shadow: {
            enabled: true,    // Activer ou désactiver l'ombre
            color: 'rgba(0, 0, 0, 0.5)', // Couleur de l'ombre
            // Taille ajustée pour la window de 80px (marge latérale de ~6px)
            // 0 4px 12px reste esthétique sans être violemment coupé
            size: '0 4px 6px',
        }
    },

    /**
     * ---------------------------------------------------------------------------
     * 3. FENÊTRE SYSTÈME (Electron)
     * ---------------------------------------------------------------------------
     * Paramètres techniques de la fenêtre transparente qui contient le Sidecar.
     * NOTE : La fenêtre doit être plus grande que le visuel pour afficher l'ombre sans coupure.
     */
    window: {
        width: 80,   // Largeur réduite: 68px (visuel) + 12px de marge pour l'ombre
        height: 300, // Hauteur totale de la fenêtre invisible (doit être > visual.height)
    },

    /**
     * ---------------------------------------------------------------------------
     * 4. POSITIONNEMENT
     * ---------------------------------------------------------------------------
     * Où placer le Sidecar sur l'écran.
     */
    position: {
        // Ancrage vertical : 'top', 'center', 'bottom', 'upper-quarter' (25%)
        yAxisAlign: 'top',

        // Ancrage horizontal : 'left' ou 'right'
        xAxisAlign: 'right',

        // Marges (espace entre le Sidecar et le bord de l'écran)
        margins: {
            left: 0,    // Espace depuis le bord gauche
            right: 0,   // Espace depuis le bord droit (0 = collé au bord)
            top: 0,     // Espace depuis le haut (0 = collé au bord)
            bottom: 20, // Espace depuis le bas (utilisé si yAxisAlign = 'bottom')
        }
    },

    /**
     * ---------------------------------------------------------------------------
     * 5. COMPORTEMENT & ANIMATIONS
     * ---------------------------------------------------------------------------
     */
    behavior: {
        // Permet-il de déplacer la fenêtre avec la souris ? (Drag & Drop)
        isDraggable: true,

        // Animation au survol de la souris (Hover)
        hoverAnimation: {
            scale: 1.0, // Agrandissement au survol (1.0 = pas de changement, 1.05 = +5%)
            duration: '0.3s', // Vitesse de transition
        }
    }
};
