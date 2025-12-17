import { useState, useEffect, useCallback } from 'react';

// Types
export interface CardData {
    nir: string;
    cle: string;
    nom: string;
    prenom: string;
    dateNaissance: string;
    rang: string;
    regime: string;
}

export interface CardReaderState {
    isConnected: boolean;
    isReading: boolean;
    error: string | null;
    lastCardData: any | null;
    provider?: 'SIMULATION' | 'HARDWARE_PCSC';
}

class CardReaderServiceImpl {
    private ws: WebSocket | null = null;
    private listeners: ((state: CardReaderState) => void)[] = [];
    private state: CardReaderState = {
        isConnected: false,
        isReading: false,
        error: null,
        lastCardData: null
    };

    private notifyListeners() {
        this.listeners.forEach(listener => listener({ ...this.state }));
    }

    public subscribe(listener: (state: CardReaderState) => void) {
        this.listeners.push(listener);
        listener({ ...this.state });
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public connect(port: number = 3001) {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        try {
            this.ws = new WebSocket(`ws://localhost:${port}`);

            this.ws.onopen = () => {
                this.state.isConnected = true;
                this.state.error = null;
                this.notifyListeners();
            };

            this.ws.onclose = () => {
                this.state.isConnected = false;
                this.notifyListeners();
            };

            this.ws.onerror = (_error) => {
                this.state.error = "Connection failed. Is the local agent running?";
                this.notifyListeners();
            };

            this.ws.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);

                    if (response.type === 'CARD_DATA') {
                        this.state.isReading = false;
                        if (response.success) {
                            this.state.lastCardData = response.data;
                        } else {
                            this.state.error = response.message || "Unknown error reading card";
                        }
                    } else if (response.type === 'ERROR') {
                        this.state.isReading = false;
                        this.state.error = response.message;
                    }
                    this.notifyListeners();
                } catch (e) {
                    console.error("Error parsing WebSocket message", e);
                }
            };
        } catch (e) {
            this.state.error = "Failed to create WebSocket";
            this.notifyListeners();
        }
    }

    public readCard() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.state.error = "Not connected to card reader agent.";
            this.notifyListeners();
            return;
        }

        this.state.isReading = true;
        this.state.error = null;
        this.notifyListeners();

        this.ws.send(JSON.stringify({ type: 'READ_CARD' }));
    }

    public disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const CardReaderService = new CardReaderServiceImpl();

export function useCardReader() {
    const [state, setState] = useState<CardReaderState>({
        isConnected: false,
        isReading: false,
        error: null,
        lastCardData: null
    });

    useEffect(() => {
        const unsubscribe = CardReaderService.subscribe(setState);
        // Auto-connect on mount
        CardReaderService.connect();
        return unsubscribe;
    }, []);

    const readCard = useCallback(() => {
        CardReaderService.readCard();
    }, []);

    return {
        ...state,
        readCard
    };
}
