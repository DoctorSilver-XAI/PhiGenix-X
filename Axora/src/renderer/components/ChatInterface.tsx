import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, Menu, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, ChatSession } from '../types';
import { useNavigate } from 'react-router-dom';
import { aiManager } from '../services/ai/manager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatSidebar } from './ChatSidebar';
import { AIChatMessage } from '../services/ai/types';
import { AXORA_SYSTEM_PROMPT } from '../data/assistant_prompts';

export function ChatInterface() {
    const navigate = useNavigate();
    // -------------------------------------------------------------------------
    // STATE MANAGEMENT
    // -------------------------------------------------------------------------
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // UI state
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // -------------------------------------------------------------------------
    // API SYNCHRONIZATION
    // -------------------------------------------------------------------------

    const fetchSessions = async () => {
        try {
            // Mocking for now as we don't have the backend server from axora_old
            // In a real port, we would use Electron IPC or local storage
            const savedSessions = localStorage.getItem('axora_chat_sessions');
            let data: ChatSession[] = savedSessions ? JSON.parse(savedSessions) : [];

            if (data) {
                setSessions(prev => {
                    // Create a map of existing sessions for preservation
                    const prevMap = new Map(prev.map(s => [s.id, s]));

                    return data.map(newSession => {
                        const existing = prevMap.get(newSession.id);
                        return {
                            ...newSession,
                            // Preserve messages if they exist locally but not in the new summary data
                            messages: (newSession.messages && newSession.messages.length > 0)
                                ? newSession.messages
                                : (existing?.messages || [])
                        };
                    });
                });

                // If no sessions, create one
                if (data.length === 0) {
                    createNewSession();
                } else if (!currentSessionId) {
                    // Load the first one if none selected
                    const mostRecent = data.sort((a, b) => b.updatedAt - a.updatedAt)[0];
                    setCurrentSessionId(mostRecent.id);
                }
            }
        } catch (e) {
            console.error("Failed to fetch sessions", e);
        }
    };

    const fetchFullSession = async (id: string) => {
        // Local storage handled in fetchSessions for now (all in one)
        // In real backend, we would fetch details.
    };

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('axora_chat_sessions', JSON.stringify(sessions));
        }
    }, [sessions]);

    // Initial load
    useEffect(() => {
        fetchSessions();
    }, []);

    // Load messages when currentSessionId changes
    useEffect(() => {
        if (currentSessionId) {
            fetchFullSession(currentSessionId);
        }
    }, [currentSessionId]);

    // Scroll behavior
    useEffect(() => {
        scrollToBottom();
    }, [sessions, currentSessionId, isTyping]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // -------------------------------------------------------------------------
    // ACTIONS
    // -------------------------------------------------------------------------
    const createNewSession = async () => {
        try {
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: 'Nouvelle conversation',
                updatedAt: Date.now(),
                messages: [{
                    id: 'init',
                    role: 'assistant',
                    content: 'Bonjour ! Je suis Axora (Mode Orchestrator). Comment puis-je vous aider ?',
                    timestamp: Date.now()
                }]
            };

            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newSession.id);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        } catch (e) {
            console.error("Failed to create session", e);
        }
    };

    const deleteSession = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const newSessions = sessions.filter(s => s.id !== id);
            setSessions(newSessions);

            if (currentSessionId === id) {
                if (newSessions.length > 0) {
                    setCurrentSessionId(newSessions[0].id);
                } else {
                    createNewSession();
                }
            }
        } catch (error) {
            console.error("Failed to delete session", error);
        }
    };

    const getCurrentMessages = () => {
        return sessions.find(s => s.id === currentSessionId)?.messages || [];
    };

    // -------------------------------------------------------------------------
    // CHAT LOGIC
    // -------------------------------------------------------------------------
    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || !currentSessionId) return;

        const timestamp = Date.now();
        const userMessage: Message = {
            id: timestamp.toString(),
            role: 'user',
            content: inputValue,
            timestamp: timestamp,
        };

        // Update UI immediately (Optimistic)
        setInputValue('');
        setIsTyping(true);

        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return {
                    ...s,
                    messages: [...(s.messages || []), userMessage],
                    updatedAt: timestamp
                };
            }
            return s;
        }));

        try {
            // Placeholder for AI response
            const aiMessageId = (timestamp + 1).toString();
            let aiContent = "";

            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    return {
                        ...s,
                        messages: [...(s.messages || []), {
                            id: aiMessageId,
                            role: 'assistant',
                            content: '',
                            timestamp: Date.now()
                        }]
                    };
                }
                return s;
            }));

            // We still pass the "apiMessages" array to satisfy the interface, 
            // but we ALSO pass the conversationId so MistralProvider knows to use the Orchestrator.
            // The provider will ignore the array when conversationId is present (for Mistral).
            // For OpenAI/WebLLM, they will use the array.
            const currentSession = sessions.find(s => s.id === currentSessionId);
            const historyForAI = currentSession ? [...(currentSession.messages || []), userMessage] : [userMessage];
            // import { AXORA_SYSTEM_PROMPT } from '../data/assistant_prompts';

            const apiMessages: AIChatMessage[] = [
                { role: 'system', content: AXORA_SYSTEM_PROMPT },
                ...historyForAI.map(m => ({
                    role: m.role as 'user' | 'assistant' | 'system',
                    content: m.content
                }))
            ];

            await aiManager.streamResponse(
                apiMessages,
                (chunk) => {
                    aiContent += chunk;
                    setSessions(prev => prev.map(s => {
                        if (s.id === currentSessionId) {
                            return {
                                ...s,
                                messages: s.messages.map(m =>
                                    m.id === aiMessageId ? { ...m, content: aiContent } : m
                                )
                            };
                        }
                        return s;
                    }));
                },
                { conversationId: currentSessionId } // <--- CRITICAL: Pass ID to Orchestrator
            );

        } catch (error: any) {
            console.error("Chat Error:", error);
            const errorMessage = "Erreur: " + (error.message || "Impossible de joindre l'IA.");
            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    return {
                        ...s,
                        messages: [...s.messages, {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: errorMessage,
                            timestamp: Date.now()
                        }]
                    };
                }
                return s;
            }));
        } finally {
            setIsTyping(false);
        }
    };

    const handleClearCurrent = () => {
        if (currentSessionId) {
            deleteSession(currentSessionId, { stopPropagation: () => { } } as any);
        }
    };

    return (
        <div className="flex h-screen bg-[#0f0f16] overflow-hidden">
            <ChatSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={(id) => {
                    setCurrentSessionId(id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                onNewChat={createNewSession}
                onDeleteSession={deleteSession}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full w-full relative">

                {/* Header */}
                <header className="flex items-center gap-3 py-3 px-4 md:px-6 border-b border-white/5 bg-[#0f0f16]/90 backdrop-blur z-10">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-2 -ml-2 text-white/70 hover:text-white"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                            Axora
                        </h1>
                    </div>

                    <div className="ml-auto flex gap-2">
                        <button
                            onClick={() => currentSessionId && navigate(`/brain?session=${currentSessionId}`)}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-indigo-400 transition-colors"
                            title="Inspecter le cerveau (Debug)"
                            disabled={!currentSessionId}
                        >
                            <span className="text-lg">🧠</span>
                        </button>
                        <button
                            onClick={handleClearCurrent}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-red-400 transition-colors"
                            title="Réinitialiser cette conversation"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto space-y-4 p-4 md:p-6 custom-scrollbar scroll-smooth">
                    <AnimatePresence mode='popLayout'>
                        {getCurrentMessages().map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl backdrop-blur-md border ${msg.role === 'user'
                                        ? 'bg-indigo-600/20 border-indigo-500/30 rounded-br-sm text-indigo-50'
                                        : 'bg-white/5 border-white/10 rounded-bl-sm text-gray-200'
                                        }`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="flex items-center gap-2 mb-2 opacity-50 text-xs uppercase tracking-wider font-semibold">
                                            <Bot size={12} />
                                            Axora
                                        </div>
                                    )}
                                    <div className="leading-relaxed text-[15px] overflow-hidden">
                                        {msg.role === 'user' ? (
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        ) : (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ children }: any) => <p className="mb-4 last:mb-0">{children}</p>,
                                                    h1: ({ children }: any) => <h1 className="text-xl font-bold mb-4 mt-6 text-indigo-300 border-b border-indigo-500/30 pb-2">{children}</h1>,
                                                    h2: ({ children }: any) => <h2 className="text-lg font-bold mb-3 mt-5 text-indigo-200">{children}</h2>,
                                                    h3: ({ children }: any) => <h3 className="text-base font-bold mb-2 mt-4 text-indigo-100">{children}</h3>,
                                                    ul: ({ children }: any) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
                                                    ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
                                                    li: ({ children }: any) => <li className="pl-1">{children}</li>,
                                                    strong: ({ children }: any) => <strong className="font-bold text-indigo-200">{children}</strong>,
                                                    a: ({ href, children }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">{children}</a>,
                                                    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-indigo-500/40 pl-4 py-1 my-4 bg-indigo-900/10 italic text-white/80 rounded-r">{children}</blockquote>,
                                                    code: ({ inline, className, children, ...props }: any) => {
                                                        const match = /language-(\w+)/.exec(className || '')
                                                        return !inline ? (
                                                            <div className="my-4 rounded-lg overflow-hidden border border-white/10 bg-[#1e1e2e]">
                                                                <div className="bg-white/5 px-3 py-1 text-xs text-white/50 border-b border-white/5 font-mono">
                                                                    {match?.[1] || 'code'}
                                                                </div>
                                                                <div className="p-3 overflow-x-auto text-sm font-mono text-gray-300">
                                                                    <code className={className} {...props}>
                                                                        {children}
                                                                    </code>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-200" {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    },
                                                    table: ({ children }: any) => <div className="overflow-x-auto my-4 rounded-lg border border-white/10"><table className="w-full text-sm text-left">{children}</table></div>,
                                                    thead: ({ children }: any) => <thead className="bg-white/5 text-xs uppercase text-white/70 font-semibold">{children}</thead>,
                                                    tbody: ({ children }: any) => <tbody className="divide-y divide-white/5">{children}</tbody>,
                                                    tr: ({ children }: any) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
                                                    th: ({ children }: any) => <th className="px-4 py-3 border-b border-white/10">{children}</th>,
                                                    td: ({ children }: any) => <td className="px-4 py-3">{children}</td>,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                    <div className={`text-[10px] mt-2 opacity-30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex justify-start w-full"
                        >
                            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm p-4 flex gap-1.5 items-center backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-indigo-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 pt-2">
                    <form
                        onSubmit={handleSendMessage}
                        className="relative group glass-panel rounded-2xl p-1.5 flex items-center gap-2 transition-all duration-300 focus-within:border-indigo-500/50 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                    >
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Écrivez votre message..."
                            className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder-white/20"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isTyping}
                            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-500/20"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                    <div className="text-center mt-2 text-xs text-white/20 select-none">
                        Axora AI Assistant • v0.1.0 Alpha
                    </div>
                </div>
            </div>
        </div>
    );
}
