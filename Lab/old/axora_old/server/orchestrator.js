import { db } from './storage.js';

export class Orchestrator {
    constructor() {
        this.MAX_CONTEXT_MESSAGES = 10; // "Sliding window" size (Section 3 Bloc 6)
    }

    /**
     * Builds the "Sandwich Prompt" defined in the architecture.
     * Order:
     * 1. System Global
     * 2. System Profile (User/Domain)
     * 3. Long Term Memory (Stub for MVP)
     * 4. Conversation Summary (State)
     * 5. Recent Window
     * 6. User Message (Latest)
     */
    async buildContext(conversationId, userMessageText) {
        const debug = await this.getDebugContext(conversationId, userMessageText);

        // Assemble flattened list for Mistral
        const messagesForAI = [
            { role: 'system', content: debug.system_global + debug.summary + debug.memory_context },
            ...debug.recent_history.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: debug.user_input }
        ];

        return messagesForAI;
    }

    /**
     * Introspection method for the Brain Debugger
     */
    async getDebugContext(conversationId, userMessageText) {
        const conversation = db.getConversation(conversationId);
        // Fallback for new simulations
        const safeConv = conversation || { summary: "" };

        const allMessages = conversationId ? db.getMessages(conversationId) : [];

        // --- 1 & 2. System Profiles ---
        const systemPrompt = `Tu es Axora, un assistant IA expert en pharmacie clinique et officinale.
- Tu assistes le pharmacien dans ses tâches quotidiennes : analyse d'ordonnances, validation pharmaceutique, conseil patient et bon usage du médicament.
- Tes réponses sont toujours précises, structurées, basées sur des données validées et conformes à la réglementation française.
- Tu adoptes un ton professionnel, confraternel et pédagogique.
- Tu réponds en Markdown riche (tableaux, listes, gras pour les molécules et dosages).`;

        // --- 3. Long Term Memory (MVP Stub) ---
        const memoryContext = "";

        // --- 4. Conversation Summary ---
        const summaryContext = safeConv.summary
            ? `\n### Résumé de la conversation précédente :\n${safeConv.summary}\n`
            : "";

        // --- 5. Recent Window ---
        const recentMessages = allMessages.slice(-this.MAX_CONTEXT_MESSAGES);

        return {
            system_global: systemPrompt,
            summary: summaryContext,
            memory_context: memoryContext,
            recent_history: recentMessages,
            user_input: userMessageText
        };
    }

    /**
     * Called AFTER AI responds to maintain the "State".
     * - Stores the user message and AI response.
     * - Updates Summary if needed (Incremental Summarization - Section 5).
     */
    async postProcess(conversationId, userText, aiText) {
        // 1. Store messages (User + assistant)
        db.addMessage(conversationId, 'user', userText);
        db.addMessage(conversationId, 'assistant', aiText);

        // 2. Auto-Title (if new)
        const conversation = db.getConversation(conversationId);
        const totalMessages = db.getMessages(conversationId).length;

        if (totalMessages <= 2 && conversation.title === 'Nouvelle conversation') {
            const newTitle = userText.substring(0, 30) + (userText.length > 30 ? '...' : '');
            db.updateConversation(conversationId, { title: newTitle });
        }

        // 3. Update Summary (MVP: Stub or simple concatenation for now)
        // In a real V2, we would call a "Summarizer Agent" here if totalMessages > 20
        /*
        if (totalMessages % 10 === 0) {
            // Trigger background summarization
        }
        */
    }
}

export const orchestrator = new Orchestrator();
