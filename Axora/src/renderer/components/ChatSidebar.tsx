import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChatSession } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

export function ChatSidebar({
    isOpen,
    onClose,
    sessions,
    currentSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession
}: ChatSidebarProps) {
    const [isCompact, setIsCompact] = useState(false);

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                layout
                className={`fixed top-0 left-0 h-full ${isCompact ? 'md:w-20' : 'md:w-72'} w-72 bg-[#181825] border-r border-white/5 z-50 flex flex-col transition-[width] duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:relative`}

            >
                {/* Header */}
                <div className={`p-4 border-b border-white/5 flex items-center ${isCompact ? 'justify-center' : 'justify-between'}`}>
                    <button
                        onClick={onNewChat}
                        title="Nouvelle discussion"
                        className={`flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/10 font-medium text-sm ${isCompact ? 'p-3 w-10 h-10' : 'flex-1 p-3'}`}
                    >
                        <Plus size={18} />
                        {!isCompact && <span>Nouvelle discussion</span>}
                    </button>
                    {!isCompact && (
                        <button onClick={onClose} className="md:hidden ml-2 p-2 text-white/50 hover:text-white">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {sessions.length === 0 ? (
                        <div className={`text-center text-white/20 text-sm mt-10 ${isCompact ? 'hidden' : ''}`}>
                            Aucune conversation
                        </div>
                    ) : (
                        sessions.sort((a, b) => b.updatedAt - a.updatedAt).map((session) => (
                            <button
                                key={session.id}
                                onClick={() => onSelectSession(session.id)}
                                title={isCompact ? (session.title || "Nouvelle conversation") : undefined}
                                className={`w-full text-left rounded-xl flex items-center transition-colors group relative ${isCompact ? 'justify-center p-3' : 'gap-3 p-3'
                                    } ${currentSessionId === session.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <MessageSquare size={16} className="shrink-0" />

                                {!isCompact && (
                                    <>
                                        <div className="truncate text-sm font-medium flex-1">
                                            {session.title || "Nouvelle conversation"}
                                        </div>

                                        {/* Delete Button (Visible on hover or active) */}
                                        <div
                                            onClick={(e) => onDeleteSession(session.id, e)}
                                            className={`absolute right-2 p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all ${currentSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                }`}
                                        >
                                            <Trash2 size={14} />
                                        </div>
                                    </>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 text-xs text-white/20 flex items-center justify-between">
                    {!isCompact && (
                        <span className="truncate">Axora AI • v1.0</span>
                    )}
                    <button
                        onClick={() => setIsCompact(!isCompact)}
                        className={`p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors ${isCompact ? 'mx-auto' : ''}`}
                    >
                        {isCompact ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>
            </motion.div>
        </>
    );
}
