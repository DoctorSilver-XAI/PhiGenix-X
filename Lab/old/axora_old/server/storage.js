import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const CONV_FILE = path.join(DATA_DIR, 'conversations.json');
const MSGS_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure data files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(CONV_FILE)) fs.writeFileSync(CONV_FILE, '[]');
if (!fs.existsSync(MSGS_FILE)) fs.writeFileSync(MSGS_FILE, '[]');

export class Storage {
    constructor() {
        this.cache = {
            conversations: JSON.parse(fs.readFileSync(CONV_FILE, 'utf-8')),
            messages: JSON.parse(fs.readFileSync(MSGS_FILE, 'utf-8'))
        };
    }

    _save(type) {
        if (type === 'conversations') {
            fs.writeFileSync(CONV_FILE, JSON.stringify(this.cache.conversations, null, 2));
        } else {
            fs.writeFileSync(MSGS_FILE, JSON.stringify(this.cache.messages, null, 2));
        }
    }

    // Conversations
    getConversations() {
        return this.cache.conversations.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    getConversation(id) {
        return this.cache.conversations.find(c => c.id === id);
    }

    createConversation(title = "Nouvelle conversation") {
        const id = Date.now().toString(); // Simple ID
        const newConv = {
            id,
            title,
            userId: 'user-default',
            summary: "",
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.cache.conversations.push(newConv);
        this._save('conversations');
        return newConv;
    }

    deleteConversation(id) {
        this.cache.conversations = this.cache.conversations.filter(c => c.id !== id);
        // Also delete messages for this conversation
        this.cache.messages = this.cache.messages.filter(m => m.conversationId !== id);
        this._save('conversations');
        this._save('messages');
    }

    updateConversation(id, updates) {
        const idx = this.cache.conversations.findIndex(c => c.id === id);
        if (idx !== -1) {
            this.cache.conversations[idx] = { ...this.cache.conversations[idx], ...updates, updatedAt: Date.now() };
            this._save('conversations');
        }
    }

    // Messages
    getMessages(conversationId) {
        return this.cache.messages
            .filter(m => m.conversationId === conversationId)
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    addMessage(conversationId, role, content) {
        const msg = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            conversationId,
            role,
            content,
            timestamp: Date.now()
        };
        this.cache.messages.push(msg);
        this._save('messages');

        // Update conversation timestamp
        this.updateConversation(conversationId, {});

        return msg;
    }
}

export const db = new Storage();
