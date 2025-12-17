export interface AIModel {
    id: string;
    name: string;
    provider: 'online' | 'mistral'; // online=OpenAI, mistral=Mistral
    description: string;
}

export interface AIResponse {
    text: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}

export interface AIChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIService {
    initialize(): Promise<void>;
    generateResponse(messages: AIChatMessage[], modelId: string, options?: { conversationId?: string }): Promise<AIResponse>;
    streamResponse(messages: AIChatMessage[], modelId: string, onChunk: (chunk: string) => void, options?: { conversationId?: string }): Promise<void>;
    getAvailableModels(): AIModel[];
}
