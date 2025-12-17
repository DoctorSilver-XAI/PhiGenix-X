import { AIService, AIModel, AIResponse, AIChatMessage } from "./types";

export class MistralProvider implements AIService {

    // No need for client-side key configuration anymore due to Backend Proxy

    async initialize(): Promise<void> {
        // No-op for now, everything is handled by backend proxy
    }

    async generateResponse(_messages: AIChatMessage[], _modelId: string, _options?: { conversationId?: string }): Promise<AIResponse> {
        // For non-streaming, we just default to streaming and accumulating, or call API
        // But for MVP we primarily use streaming.
        return { text: "Not implemented for orchestrator mode, use streaming." };
    }

    async streamResponse(
        messages: AIChatMessage[],
        modelId: string,
        onChunk: (chunk: string) => void,
        options?: { conversationId?: string }
    ): Promise<void> {
        // Extract the last user message to send to Orchestrator
        // The Orchestrator manages history, so we don't send the full array.
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.role !== 'user') {
            console.error("MistralProvider: No user message found to send to Orchestrator");
            return;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelId || 'mistral-tiny',
                    message: lastMessage.content,
                    conversationId: options?.conversationId
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Proxy Logic Error: ${error}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error("No reader available");

            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Process SSE lines
                const lines = buffer.split('\n');
                // Keep the last partial line in the buffer
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        const dataStr = line.trim().slice(6);
                        if (dataStr === '[DONE]') continue;

                        try {
                            const data = JSON.parse(dataStr);
                            if (data.content) {
                                onChunk(data.content);
                            }
                            if (data.error) {
                                console.error("Stream SSE Error:", data.error);
                                onChunk(`\n[Erreur: ${data.error}]`);
                            }
                        } catch (e) {
                            console.warn("Failed to parse SSE data:", dataStr);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("MistralProvider Stream Error:", error);
            throw error;
        }
    }

    getAvailableModels(): AIModel[] {
        return [
            { id: 'ministral-3b-2512', name: 'Ministral 3 3B', provider: 'mistral', description: 'Le plus efficient et compact (Edge).' },
            { id: 'ministral-14b-2512', name: 'Ministral 3 14B', provider: 'mistral', description: 'Performance optimale (Edge puissant).' },
            { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', description: 'Le plus puissant (similaire GPT-4).' },
            { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'mistral', description: 'Rapide et efficace.' },
            { id: 'codestral-latest', name: 'Codestral', provider: 'mistral', description: 'Spécialisé pour le code.' },
        ];
    }
}
