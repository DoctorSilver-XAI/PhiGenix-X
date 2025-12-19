import React, { useState, useEffect } from 'react';
import { StatusDot } from './ui/StatusDot';
import { AxoraLogo } from './AxoraLogo';
import { SidecarConfig } from '../../config/sidecar.config';
import { usePhiVision } from '../services/PhiVisionContext';

interface SidecarProps {
    mode?: 'compact' | 'hub' | 'phivision'; // 'hub' is rarely used here but kept for types
}

const Sidecar: React.FC<SidecarProps> = ({ mode = 'compact' }) => {
    const { triggerAnalysis, isAnalyzing, isActive, closePhiVision } = usePhiVision();

    const switchMode = (newMode: 'hub' | 'compact') => {
        window.axora?.setMode(newMode);
    };

    // Ensure we start in INTERACTIVE mode for compact/hub, 
    // but for phivision, DualModeController sets it to ignored by default.
    useEffect(() => {
        if (mode === 'compact') {
            window.axora?.setIgnoreMouse(false);
        }
    }, [mode]);

    const handleMouseEnter = () => {
        // In phivision mode, we must explicitly enable mouse when hovering the tool
        if (mode === 'phivision') {
            window.axora?.setIgnoreMouse(false);
        }
    };

    const handleMouseLeave = () => {
        // In phivision mode, revert to ignore when leaving the tool
        if (mode === 'phivision') {
            window.axora?.setIgnoreMouse(true);
        }
    };

    const handlePhiVisionClick = () => {
        if (isActive) {
            closePhiVision();
        } else {
            triggerAnalysis();
        }
    };

    // Drag style if enabled (only in compact mode usually)
    const canDrag = SidecarConfig.behavior.isDraggable && mode === 'compact';
    const dragStyle = canDrag ? {
        WebkitAppRegion: 'drag',
    } as React.CSSProperties : {};

    // No-drag style for interactive elements
    const noDragStyle = {
        WebkitAppRegion: 'no-drag',
    } as React.CSSProperties;

    // Layout Style Helper
    const getContainerStyle = (): React.CSSProperties => {
        if (mode === 'phivision') {
            // Fullscreen overlay mode: Position absolutely to mimic the compact position
            // We use fixed to ensure it stays in place relative to the viewport
            const { height: h, width: w } = SidecarConfig.visual;
            const { margins, xAxisAlign, yAxisAlign } = SidecarConfig.position;

            // Calculate Top based on yAxisAlign config
            let topCalc: string;
            if (yAxisAlign === 'top') {
                topCalc = (margins.top || 0) + 'px';
            } else if (yAxisAlign === 'bottom') {
                topCalc = `calc(100vh - ${h}px - ${margins.bottom || 0}px)`;
            } else if (yAxisAlign === 'upper-quarter') {
                topCalc = `calc(25vh - ${h / 2}px)`;
            } else {
                // center
                topCalc = `calc(50vh - ${h / 2}px)`;
            }

            // Position based on xAxisAlign
            const positionStyle: React.CSSProperties = xAxisAlign === 'left'
                ? { left: (margins.left || 0) + 'px' }
                : { right: (margins.right || 0) + 'px' };

            return {
                position: 'fixed',
                ...positionStyle,
                top: topCalc,
                width: `${w}px`,
                height: `${h}px`,
                // Ensure z-index is above the overlay background
                zIndex: 10001,
            };
        }

        // Compact Mode: Position content based on config within the transparent window
        const { yAxisAlign, xAxisAlign } = SidecarConfig.position;

        // Determine vertical alignment based on config
        let alignItems: 'flex-start' | 'center' | 'flex-end' = 'center';
        if (yAxisAlign === 'top') {
            alignItems = 'flex-start';
        } else if (yAxisAlign === 'bottom') {
            alignItems = 'flex-end';
        }

        // Determine horizontal alignment based on config
        let justifyContent: 'flex-start' | 'center' | 'flex-end' = 'center';
        if (xAxisAlign === 'left') {
            justifyContent = 'flex-start';
        } else if (xAxisAlign === 'right') {
            justifyContent = 'flex-end';
        }

        return {
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: alignItems,
            justifyContent: justifyContent,
            background: 'transparent'
        };
    };

    return (
        /* Main Wrapper */
        <div
            style={getContainerStyle()}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="glass-panel"
                style={{
                    /* Configured Dimensions */
                    width: `${SidecarConfig.visual.width}px`,
                    height: `${SidecarConfig.visual.height}px`,
                    boxSizing: 'border-box',
                    borderRadius: `${SidecarConfig.visual.borderRadius}px`,

                    /* Visual Style */
                    backdropFilter: `blur(${SidecarConfig.theme.blurIntensity}px)`,
                    background: SidecarConfig.theme.backgroundColor,
                    boxShadow: SidecarConfig.theme.shadow.enabled ? SidecarConfig.theme.shadow.size + ' ' + SidecarConfig.theme.shadow.color : 'none',
                    border: `1px solid ${SidecarConfig.theme.borderColor}`,

                    /* Layout */
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px 0',
                    gap: '0',
                    overflow: 'hidden',

                    /* Draggable Region */
                    ...dragStyle
                }}
            >
                {/* 1. Status Indicator (Top) */}
                <div
                    style={{
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        ...noDragStyle
                    }}
                    title="Axora Connecté"
                >
                    <StatusDot status={isAnalyzing ? 'busy' : 'connected'} size={12} />
                </div>

                {/* 2. Main Action: Search/Hub (Center-Top) - NOW LOGO */}
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
                        ...noDragStyle
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <AxoraLogo size={38} />
                </button>

                {/* 3. Separator */}
                <div style={{
                    width: '24px',
                    height: '1px',
                    background: 'rgba(255,255,255,0.15)',
                    marginBottom: '16px'
                }} />

                {/* 4. PhiVision Trigger (Modernized v2.0) */}
                <button
                    id="btn-vision"
                    onClick={handlePhiVisionClick}
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
                        {/* HUD Ring */}
                        <div
                            className="absolute inset-0 rounded-full border border-dashed border-cyan-500/30 w-full h-full"
                            style={{ animation: 'hud-spin 12s linear infinite' }}
                        />
                        {/* Lens */}
                        <div className="relative w-[28px] h-[28px] rounded-full bg-[#050b14] shadow-inner flex items-center justify-center border border-cyan-500/20 overflow-hidden group-hover:border-cyan-400/50 transition-colors duration-300">
                            <div className="eye-iris w-[16px] h-[16px] rounded-full border border-cyan-500/50 bg-gradient-to-br from-cyan-900 to-indigo-900 flex items-center justify-center relative shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all duration-300">
                                <div
                                    className="absolute w-full h-[1px] bg-cyan-400 blur-[0.5px] shadow-[0_0_5px_cyan]"
                                    style={{ animation: 'scan-line 2s ease-in-out infinite' }}
                                />
                                <div className="eye-pupil w-[5px] h-[5px] bg-cyan-100 rounded-sm shadow-[0_0_8px_rgba(255,255,255,0.9)] transition-all duration-300"></div>
                            </div>
                        </div>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900/90 backdrop-blur-md text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-30 shadow-xl text-cyan-100">
                        {isAnalyzing ? "Analyse..." : "PhiVision v2.5"}
                    </div>
                </button>


            </div>
        </div>
    );
};

export default Sidecar;
