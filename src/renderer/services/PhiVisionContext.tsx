import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Types (to be moved to types/ later if needed)
export interface PhiVisionAdvice {
    oral_sentence: string;
    written_points: string[];
}

export interface PhiVisionMed {
    dci: string;
    recommendation: string;
}

export interface PhiVisionCrossSell {
    name: string;
    reason: string;
}

export interface PhiVisionResult {
    analysis_context?: string;
    advices?: PhiVisionAdvice;
    meds?: PhiVisionMed[];
    cross_selling?: PhiVisionCrossSell[];
    chips?: string[];
    is_minor?: boolean;

    // Backward compatibility / Fallbacks
    detected_items?: string[];
    insights?: any[]; // Deprecated but kept to prevent immediate crash if UI still refs it
    capturedImage?: string;
    error?: string;
    isMock?: boolean;
}

interface PhiVisionContextType {
    isActive: boolean;
    isAnalyzing: boolean;
    result: PhiVisionResult | null;
    togglePhiVision: () => void;
    triggerAnalysis: (scenarioOverride?: string) => Promise<void>;
    closePhiVision: () => void;
}

const PhiVisionContext = createContext<PhiVisionContextType | undefined>(undefined);

export const PhiVisionProvider = ({ children }: { children: ReactNode }) => {
    const [isActive, setIsActive] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<PhiVisionResult | null>(null);

    const togglePhiVision = () => {
        const newActive = !isActive;
        setIsActive(newActive);

        if (newActive) {
            // Switch to PhiVision mode (Fullscreen Overlay)
            window.axora?.setMode('phivision');
        } else {
            // Revert to Compact
            window.axora?.setMode('compact');
            setResult(null);
        }
    };

    const triggerAnalysis = useCallback(async (scenarioOverride?: string) => {
        // Ensure we are in PhiVision mode
        setIsActive(true); // Always force active
        window.axora?.setMode('phivision');

        setIsAnalyzing(true);
        setResult(null);

        try {
            // @ts-ignore - window.electron is defined in preload
            const response = await window.electron.ipcRenderer.invoke('PHI_VISION_CAPTURE', scenarioOverride);

            if (response && response.success) {
                setResult(response.data);
            }
        } catch (error) {
            console.error('PhiVision Analysis Failed:', error);
            // Optionally set error state in result
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    // Listen for Global Shortcuts (Main -> Renderer)
    React.useEffect(() => {
        if (!window.axora?.onTriggerPhiVision) return;

        const cleanup = window.axora.onTriggerPhiVision(() => {
            console.log('PhiVision: Global Shortcut received - Triggering Analysis');
            triggerAnalysis();
        });

        return cleanup;
    }, [triggerAnalysis]);

    // Safety: Listen for external mode changes to keep state in sync (e.g. Minimize via Esc)
    React.useEffect(() => {
        if (!window.axora?.onModeChanged) return;

        const cleanup = window.axora.onModeChanged((mode) => {
            if (mode === 'compact' && isActive) {
                console.log('PhiVision: Mode changed to compact externally - Resetting active state');
                setIsActive(false);
            }
        });

        return () => {
            cleanup();
        };
    }, [isActive]);

    const closePhiVision = () => {
        setIsActive(false);
        setResult(null);
        window.axora?.setMode('compact');
    };

    return (
        <PhiVisionContext.Provider value={{
            isActive,
            isAnalyzing,
            result,
            togglePhiVision,
            triggerAnalysis,
            closePhiVision
        }}>
            {children}
        </PhiVisionContext.Provider>
    );
};

export const usePhiVision = () => {
    const context = useContext(PhiVisionContext);
    if (!context) {
        throw new Error('usePhiVision must be used within a PhiVisionProvider');
    }
    return context;
};
