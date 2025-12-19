/**
 * VisualTuner - Live UI Adjustment Panel
 * 
 * Allows real-time tuning of visual parameters for field testing
 * on pharmacy hardware with different monitor configurations.
 */

import React, { useState, useEffect } from 'react';

interface TunerSettings {
    backgroundOpacity: number;
    blurIntensity: number;
    accentHue: number;
    fontSize: number;
}

const DEFAULT_SETTINGS: TunerSettings = {
    backgroundOpacity: 0.75,
    blurIntensity: 12,
    accentHue: 170, // Cyan-ish
    fontSize: 100,
};

const STORAGE_KEY = 'axora-visual-tuner-settings';

export const VisualTuner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [settings, setSettings] = useState<TunerSettings>(() => {
        // Load from localStorage if available
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return DEFAULT_SETTINGS;
            }
        }
        return DEFAULT_SETTINGS;
    });

    // Apply settings to CSS variables in real-time
    useEffect(() => {
        const root = document.documentElement;

        // Background opacity
        const bgColor = `rgba(10, 10, 15, ${settings.backgroundOpacity})`;
        root.style.setProperty('--glass-bg-dark', bgColor);

        // Blur intensity
        const blurValue = `blur(${settings.blurIntensity}px) saturate(1.1) brightness(1.05)`;
        root.style.setProperty('--backdrop-blur', `blur(${settings.blurIntensity}px)`);

        // Update .glass-panel directly via a custom property
        const panels = document.querySelectorAll('.glass-panel');
        panels.forEach((panel) => {
            (panel as HTMLElement).style.backdropFilter = blurValue;
        });

        // Accent hue shift (experimental)
        root.style.setProperty('--accent', `hsl(${settings.accentHue}, 80%, 55%)`);
        root.style.setProperty('--neon-cyan', `hsl(${settings.accentHue}, 100%, 50%)`);

        // Font size (percentage)
        root.style.fontSize = `${settings.fontSize}%`;

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const handleChange = (key: keyof TunerSettings, value: number) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 9999,
                background: 'rgba(15, 20, 30, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '24px',
                minWidth: '320px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                fontFamily: 'Inter, sans-serif',
                color: '#e8eef4',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '12px',
                }}
            >
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    🎨 Visual Tuner
                </h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '20px',
                        padding: '4px',
                    }}
                >
                    ×
                </button>
            </div>

            {/* Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Background Opacity */}
                <SliderControl
                    label="Opacité Fond"
                    value={settings.backgroundOpacity}
                    min={0}
                    max={1}
                    step={0.05}
                    displayValue={`${Math.round(settings.backgroundOpacity * 100)}%`}
                    onChange={(v) => handleChange('backgroundOpacity', v)}
                />

                {/* Blur Intensity */}
                <SliderControl
                    label="Intensité Flou"
                    value={settings.blurIntensity}
                    min={0}
                    max={30}
                    step={1}
                    displayValue={`${settings.blurIntensity}px`}
                    onChange={(v) => handleChange('blurIntensity', v)}
                />

                {/* Accent Hue */}
                <SliderControl
                    label="Teinte Accent"
                    value={settings.accentHue}
                    min={0}
                    max={360}
                    step={5}
                    displayValue={`${settings.accentHue}°`}
                    onChange={(v) => handleChange('accentHue', v)}
                />

                {/* Font Size */}
                <SliderControl
                    label="Taille Texte"
                    value={settings.fontSize}
                    min={80}
                    max={120}
                    step={5}
                    displayValue={`${settings.fontSize}%`}
                    onChange={(v) => handleChange('fontSize', v)}
                />
            </div>

            {/* Footer */}
            <div
                style={{
                    marginTop: '20px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <button
                    onClick={handleReset}
                    style={{
                        background: 'rgba(255, 100, 100, 0.2)',
                        border: '1px solid rgba(255, 100, 100, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: '#ff6b6b',
                        fontSize: '13px',
                        cursor: 'pointer',
                    }}
                >
                    Réinitialiser
                </button>
                <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center' }}>
                    Field Test Mode
                </span>
            </div>
        </div>
    );
};

// --- Slider Control Sub-Component ---
interface SliderControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    displayValue: string;
    onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
    label,
    value,
    min,
    max,
    step,
    displayValue,
    onChange,
}) => {
    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '13px',
                }}
            >
                <span style={{ color: '#b8c2cc' }}>{label}</span>
                <span style={{ color: '#2ee4c6', fontWeight: 500 }}>{displayValue}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                style={{
                    width: '100%',
                    height: '6px',
                    appearance: 'none',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                }}
            />
        </div>
    );
};

export default VisualTuner;
