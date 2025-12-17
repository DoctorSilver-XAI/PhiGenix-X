import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { db } from './storage.js';
import { orchestrator } from './orchestrator.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- API CONFIG ---
const MISTRAL_API_KEY = "I9V9dMbmD0RYTX9cWZR7kvRbiFaC6hfi";

// --- CONVERSATION ROUTES ---

// List conversations
app.get('/api/conversations', (req, res) => {
    const list = db.getConversations();
    res.json(list);
});

// Create conversation
app.post('/api/conversations', (req, res) => {
    const { title } = req.body;
    const newConv = db.createConversation(title);
    res.json(newConv);
});

// Get single conversation details + messages
app.get('/api/conversations/:id', (req, res) => {
    const { id } = req.params;
    const conversation = db.getConversation(id);
    if (!conversation) return res.status(404).json({ error: "Not found" });

    const messages = db.getMessages(id);
    res.json({ ...conversation, messages });
});

// Delete conversation
app.delete('/api/conversations/:id', (req, res) => {
    const { id } = req.params;
    db.deleteConversation(id);
    res.json({ success: true });
});

// --- DEBUG ROUTES ---
app.post('/api/debug/context', async (req, res) => {
    const { conversationId, message } = req.body;
    try {
        const data = await orchestrator.getDebugContext(conversationId, message || "");
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- CHAT ENDPOINT (ORCHESTRATED) ---
app.post('/api/chat', async (req, res) => {
    const { message, conversationId, model } = req.body;

    // 1. Create conversation if ID not provided (though Client should handle this)
    let finalConvId = conversationId;
    if (!finalConvId) {
        const newConv = db.createConversation();
        finalConvId = newConv.id;
    }

    try {
        // 2. Orchestrator: Build Context
        const messagesForAI = await orchestrator.buildContext(finalConvId, message);

        // 3. Call Mistral API
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: model || 'mistral-tiny',
                messages: messagesForAI,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Mistral API Error:', errorText);
            res.write(`data: ${JSON.stringify({ error: 'Mistral API Error: ' + response.statusText })}\n\n`);
            return res.end();
        }

        let fullAiResponse = "";

        // 4. Stream Handling
        for await (const chunk of response.body) {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices[0].delta.content;
                        if (content) {
                            fullAiResponse += content;
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {
                        // ignore partial JSON
                    }
                }
            }
        }
        res.end();

        // 5. Orchestrator: Post-Process & Storage
        // Store both user message and the full AI response
        await orchestrator.postProcess(finalConvId, message, fullAiResponse);

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Axora Backend (Orchestrator enabled) running at http://localhost:${port}`);
});
