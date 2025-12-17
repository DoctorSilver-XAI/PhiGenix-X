import React, { useState } from 'react';
import { StatusDot } from './ui/StatusDot';
import { AxoraLogo } from './AxoraLogo';
import { SidecarConfig } from '../../config/sidecar.config';

const Sidecar: React.FC = () => {
    const switchMode = (mode: 'hub' | 'compact') => {
        window.axora?.setMode(mode);
    };

    // Ensure we start in INTERACTIVE mode
    React.useEffect(() => {
        window.axora?.setIgnoreMouse(false);
    }, []);

    // Drag style if enabled
    const dragStyle = SidecarConfig.behavior.isDraggable ? {
        WebkitAppRegion: 'drag',
    } as React.CSSProperties : {};

    // No-drag style for interactive elements
    const noDragStyle = {
        WebkitAppRegion: 'no-drag',
    } as React.CSSProperties;

    return (
        /* Main Wrapper - Invisible, handles centering */
        <div
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent'
            }}
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
                        ...noDragStyle // Ensure status is clickable if needed, or just consistent
                    }}
                    title="Axora Connecté"
                >
                    <StatusDot status="connected" size={12} />
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
                        padding: '4px', // Reduced padding for logo
                        borderRadius: '12px',
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy scale
                        ...noDragStyle // CRITICAL: clickable buttons must be no-drag
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

                {/* 4. New Action (Plus) */}
                <button
                    className="icon-button"
                    aria-label="Nouvelle Action"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
                        color: 'var(--text-secondary)',
                        padding: '4px',
                        marginBottom: '10px',
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        opacity: 0.8,
                        transition: 'all 0.2s',
                        ...noDragStyle
                    }}
                >
                    <span>+</span>
                </button>


            </div>
        </div>
    );
};

export default Sidecar;
