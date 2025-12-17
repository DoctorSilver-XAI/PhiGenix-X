import { CreditCard } from 'lucide-react';
import { useCardReader } from '../../services/CardReaderService';

interface CardReaderControlProps {
    variant?: 'default' | 'header';
}

export default function CardReaderControl({ variant = 'default' }: CardReaderControlProps) {
    const { isConnected: _isConnected, isReading: _isReading, error: _error, readCard: _readCard, lastCardData: _lastCardData, provider: _provider } = useCardReader();

    // Reset logic or "New Read" could be handled here if we want to clear data.
    // For now, "Lire Carte Vitale" just overwrites.

    if (variant === 'header') {
        return (
            <div className="flex items-center space-x-3 bg-[#1a1c2e] border border-white/10 p-1.5 pl-3 rounded-lg shadow-xl">
                {/* Development Status Indicator */}
                <div className="flex items-center space-x-2 mr-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <span className="text-xs text-amber-500/80 font-medium hidden lg:inline">
                        En développement
                    </span>
                </div>

                {/* Disabled Action Button */}
                <button
                    disabled={true}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                >
                    <CreditCard className="w-4 h-4 opacity-50" />
                    <span>Bientôt disponible</span>
                </button>
            </div>
        );
    }

    // Default Variant (for inside forms)
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium text-gray-700">
                        Module en cours de développement
                    </span>
                </div>
                <button
                    disabled={true}
                    className="flex items-center space-x-2 px-4 py-2 rounded-md transition-colors text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                    <CreditCard className="w-4 h-4" />
                    <span>Bientôt disponible</span>
                </button>
            </div>


        </div>
    );
}
