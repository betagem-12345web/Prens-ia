import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, UserSettings } from './types/chat';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { playAudioChime, speakSpanish } from './utils/speech';

const STORAGE_KEY_CHATS = 'prens_ia_conversations_v1';
const STORAGE_KEY_SETTINGS = 'prens_ia_settings_v1';

const defaultSettings: UserSettings = {
  tone: 'balanced',
  systemPrompt: '',
  autoSpeak: false,
  soundEffects: true,
  fontSize: 'normal',
};

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHATS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHATS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(conversations));
    } catch (e) {
      console.error('Error saving chats to localStorage:', e);
    }
  }, [conversations]);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
    }
  }, [settings]);

  // Global keyboard shortcuts (Ctrl+K or Cmd+K for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null;

  const handleNewChat = () => {
    setActiveConversationId(null);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (activeConversationId === id) {
        setActiveConversationId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  const handleClearHistory = () => {
    setConversations([]);
    setActiveConversationId(null);
  };

  const handleClearCurrentChat = () => {
    if (!activeConversationId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? { ...c, messages: [], updatedAt: Date.now() }
          : c
      )
    );
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let targetConvId = activeConversationId;
    let currentConv = activeConversation;

    // Create a new conversation if none is active or current has no ID
    if (!targetConvId || !currentConv) {
      const generatedTitle =
        text.length > 32 ? text.substring(0, 32).trim() + '...' : text;
      const newConv: Conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: generatedTitle,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tone: settings.tone,
      };

      currentConv = newConv;
      targetConvId = newConv.id;

      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(targetConvId);
    }

    const userMessage: Message = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const assistantMessageId = `msg_a_${Date.now() + 1}`;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
    };

    // Update conversation with user message and placeholder assistant message
    const updatedMessages = [...(currentConv.messages || []), userMessage];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              messages: [...updatedMessages, initialAssistantMessage],
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          tone: settings.tone,
          systemPrompt: settings.systemPrompt,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No se recibió cuerpo de respuesta del servidor.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace(/^data:\s*/, '').trim();
            if (dataStr === '[DONE]') {
              break;
            }
            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  accumulatedText += parsed.text;

                  // Update UI with accumulated streaming text
                  setConversations((prev) =>
                    prev.map((c) => {
                      if (c.id !== targetConvId) return c;
                      return {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantMessageId
                            ? { ...m, content: accumulatedText }
                            : m
                        ),
                      };
                    })
                  );
                }
              } catch (parseError: any) {
                if (parseError.message && !dataStr.startsWith('{')) {
                  // Ignore partial SSE split lines
                } else if (parseError.message) {
                  throw parseError;
                }
              }
            }
          }
        }
      }

      // Finish generation
      if (settings.soundEffects) {
        playAudioChime('receive');
      }

      if (settings.autoSpeak && accumulatedText) {
        speakSpanish(accumulatedText);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generación detenida por el usuario.');
      } else {
        console.error('Error al generar respuesta:', err);
        const errorExplanation =
          `⚠️ **Ocurrió un error al conectar con PRENS IA:**\n\n` +
          `*${err.message || 'No se pudo contactar el servicio de inteligencia artificial.'}*\n\n` +
          `Por favor, verifica la conexión y vuelve a intentar.`;

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== targetConvId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: m.content
                        ? `${m.content}\n\n${errorExplanation}`
                        : errorExplanation,
                    }
                  : m
              ),
            };
          })
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = async () => {
    if (!activeConversation || activeConversation.messages.length < 2 || isLoading) return;

    // Find last user message
    const msgs = activeConversation.messages;
    const lastUserMsgIdx = [...msgs].reverse().findIndex((m) => m.role === 'user');
    if (lastUserMsgIdx === -1) return;

    const actualIdx = msgs.length - 1 - lastUserMsgIdx;
    const userMessage = msgs[actualIdx];

    // Remove everything from the assistant response after this user message
    const trimmedMessages = msgs.slice(0, actualIdx);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, messages: trimmedMessages, updatedAt: Date.now() }
          : c
      )
    );

    // Resend user prompt
    setTimeout(() => {
      handleSendMessage(userMessage.content);
    }, 50);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#06070B] text-slate-100 font-sans">
      {/* Sidebar with Historial, Nuevo Chat, Configuración */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Chat Interface */}
      <ChatArea
        conversation={activeConversation}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onStopGeneration={handleStopGeneration}
        onRegenerate={handleRegenerate}
        onNewChat={handleNewChat}
        onClearCurrentChat={handleClearCurrentChat}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        settings={settings}
      />

      {/* Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) =>
          setSettings((prev) => ({ ...prev, ...newSettings }))
        }
        onClearHistory={handleClearHistory}
        conversations={conversations}
      />
    </div>
  );
}
