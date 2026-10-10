import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Settings,
  Trash2,
  Check,
  X,
  Search,
  Sparkles,
  ChevronLeft,
  Edit2,
} from 'lucide-react';
import { PrensLogo } from './PrensLogo';
import { Conversation } from '../types/chat';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenSettings,
  isOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Group conversations by time period
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS = 7 * ONE_DAY;

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groups: { label: string; items: Conversation[] }[] = [
    {
      label: 'Hoy',
      items: filteredConversations.filter((c) => now - c.updatedAt < ONE_DAY),
    },
    {
      label: 'Ayer',
      items: filteredConversations.filter(
        (c) => now - c.updatedAt >= ONE_DAY && now - c.updatedAt < 2 * ONE_DAY
      ),
    },
    {
      label: 'Últimos 7 días',
      items: filteredConversations.filter(
        (c) => now - c.updatedAt >= 2 * ONE_DAY && now - c.updatedAt < SEVEN_DAYS
      ),
    },
    {
      label: 'Anteriores',
      items: filteredConversations.filter((c) => now - c.updatedAt >= SEVEN_DAYS),
    },
  ].filter((g) => g.items.length > 0);

  const handleStartRename = (e: React.MouseEvent, c: Conversation) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const handleSaveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-[280px] sm:w-[300px] z-50 flex flex-col bg-[#07080F] border-r border-purple-900/25 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Close on Mobile */}
        <div className="p-4 flex items-center justify-between border-b border-purple-950/40">
          <PrensLogo size="sm" showText animated />
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-purple-900/30 transition-colors"
            title="Cerrar barra lateral"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Action: Nuevo Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700/80 via-purple-600/70 to-indigo-600/70 hover:from-purple-600 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-purple-950/40 border border-purple-400/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo chat</span>
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-mono bg-black/30 text-purple-200 rounded border border-white/10">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Search Historial */}
        {conversations.length > 2 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar conversaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#0D0E1A] text-xs text-slate-200 placeholder-slate-500 rounded-lg border border-purple-900/20 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversations History */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-purple-400/70 font-mono">
            <span>Historial</span>
            <span className="text-[10px] text-slate-500 font-mono tabular-nums">
              {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
            </span>
          </div>

          {conversations.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto text-purple-500/30 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Sin chats previos</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Escribe un mensaje para iniciar una conversación con PRENS IA.
              </p>
            </div>
          ) : groups.length === 0 ? (
            <div className="py-6 px-3 text-center text-xs text-slate-500">
              No se encontraron resultados para &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((c) => {
                    const isActive = c.id === activeConversationId;
                    const isEditing = editingId === c.id;

                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectConversation(c.id);
                          onCloseMobile();
                        }}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                          isActive
                            ? 'bg-purple-950/40 text-purple-100 border border-purple-500/30 shadow-sm shadow-purple-950/50'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-purple-950/20'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(e as any, c.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                              className="w-full bg-[#131422] text-xs text-white px-2 py-1 rounded border border-purple-500 focus:outline-none"
                            />
                            <button
                              onClick={(e) => handleSaveRename(e, c.id)}
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                              title="Guardar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelRename}
                              className="p-1 text-slate-400 hover:text-slate-200"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 min-w-0 pr-1.5">
                              <MessageSquare
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-purple-400/80'
                                }`}
                              />
                              <span className="truncate text-slate-200">{c.title}</span>
                            </div>

                            {/* Item Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleStartRename(e, c)}
                                className="p-1 rounded text-slate-400 hover:text-purple-300 hover:bg-purple-900/40"
                                title="Renombrar conversación"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(c.id);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                                title="Eliminar conversación"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Model status indicator */}
        <div className="px-3 py-2 mx-3 mb-2 rounded-xl bg-purple-950/25 border border-purple-900/30 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-slate-300 font-medium">Por Zynapse</span>
          </div>
          <span className="text-[10px] font-mono text-purple-300/80">PRENS IA</span>
        </div>

        {/* Bottom Bar: Configuración */}
        <div className="p-3 border-t border-purple-950/40">
          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-purple-950/30 border border-transparent hover:border-purple-800/30 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-purple-400" />
            <span>Configuración</span>
          </button>
        </div>
      </aside>
    </>
  );
};
