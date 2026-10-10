import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  Square,
  Mic,
  MicOff,
  Sparkles,
  Code2,
  HelpCircle,
  Lightbulb,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Menu,
  Plus,
  ArrowUp,
  Download,
  Trash2,
} from 'lucide-react';
import { Message, Conversation, UserSettings } from '../types/chat';
import { PrensLogo } from './PrensLogo';
import { MarkdownRenderer } from './MarkdownRenderer';
import { speakSpanish, stopSpeaking, createSpeechRecognizer, playAudioChime } from '../utils/speech';

interface ChatAreaProps {
  conversation: Conversation | null;
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onStopGeneration: () => void;
  onRegenerate: () => void;
  onNewChat: () => void;
  onClearCurrentChat: () => void;
  onOpenMobileSidebar: () => void;
  settings: UserSettings;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  onSendMessage,
  isLoading,
  onStopGeneration,
  onRegenerate,
  onNewChat,
  onClearCurrentChat,
  onOpenMobileSidebar,
  settings,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechRecognizer, setSpeechRecognizer] = useState<any>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = conversation?.messages || [];

  // Auto-scroll on new message or stream chunk
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Setup speech recognition
  useEffect(() => {
    const recognizer = createSpeechRecognizer(
      (transcript) => {
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
    setSpeechRecognizer(recognizer);

    return () => {
      if (recognizer) {
        try {
          recognizer.stop();
        } catch {
          // ignore
        }
      }
      stopSpeaking();
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (!speechRecognizer) {
      alert('El reconocimiento de voz no es compatible con este navegador.');
      return;
    }

    if (isListening) {
      speechRecognizer.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognizer.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    if (settings.soundEffects) {
      playAudioChime('send');
    }
    onSendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleToggleSpeak = (id: string, content: string) => {
    if (speakingMessageId === id) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(id);
      speakSpanish(content, () => {
        setSpeakingMessageId(null);
      });
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInputText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleExportCurrent = () => {
    if (!conversation) return;
    const markdown = `# ${conversation.title}\n\n` +
      conversation.messages
        .map(
          (m) =>
            `### ${m.role === 'user' ? 'Usuario' : 'PRENS IA'} (${new Date(
              m.timestamp
            ).toLocaleTimeString()})\n\n${m.content}\n`
        )
        .join('\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#06070B] relative overflow-hidden">
      {/* Background radial gradient mesh */}
      <div className="absolute inset-0 pointer-events-none bg-cosmic-radial" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-purple-900/20 bg-[#07080F]/80 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-purple-900/20 transition-colors"
            title="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm sm:text-base text-slate-100 font-display truncate">
              {conversation ? conversation.title : 'Nueva conversación'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {conversation && conversation.messages.length > 0 && (
            <>
              <button
                onClick={handleExportCurrent}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-300 hover:text-white hover:bg-purple-900/30 border border-purple-800/30 transition-all cursor-pointer"
                title="Descargar conversación en Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar</span>
              </button>

              <button
                onClick={onClearCurrentChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                title="Vaciar este chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-600/30 hover:border-purple-500/50 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo chat</span>
          </button>
        </div>
      </header>

      {/* Main Content Area: Home Screen vs Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 relative z-10">
        <div className="max-w-3xl mx-auto h-full flex flex-col">
          {messages.length === 0 ? (
            /* HOME SCREEN */
            <div className="flex-1 flex flex-col justify-center items-center text-center py-8 sm:py-12 animate-in fade-in duration-500">
              {/* Futuristic Logo & Title */}
              <div className="mb-4">
                <PrensLogo size="xl" animated />
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display tracking-tight text-white mb-2">
                PRENS{' '}
                <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-300 bg-clip-text text-transparent glow-text-purple">
                  IA
                </span>
              </h1>

              {/* Required Welcome Message */}
              <p className="text-base sm:text-xl text-purple-200/90 font-medium max-w-xl mb-8 font-display">
                Hola, soy PRENS IA. ¿En qué puedo ayudarte hoy?
              </p>

              {/* 3 Main Required Suggestion Buttons */}
              <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {/* 1. Crear código */}
                <button
                  onClick={() =>
                    handleSuggestionClick(
                      'Crea una función en TypeScript para validar y formatear fechas con soporte de zonas horarias'
                    )
                  }
                  className="group p-4 rounded-2xl bg-gradient-to-b from-[#101222] to-[#0A0B16] border border-purple-700/30 hover:border-purple-500/70 hover:shadow-lg hover:shadow-purple-950/60 transition-all text-left cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-3 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-display text-white group-hover:text-purple-300 transition-colors">
                      Crear código
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Algoritmos, APIs, interfaces web y depuración técnica.
                    </p>
                  </div>
                </button>

                {/* 2. Resolver preguntas */}
                <button
                  onClick={() =>
                    handleSuggestionClick(
                      '¿Cómo funciona la computación cuántica y cuáles son sus aplicaciones más prometedoras?'
                    )
                  }
                  className="group p-4 rounded-2xl bg-gradient-to-b from-[#101222] to-[#0A0B16] border border-purple-700/30 hover:border-purple-500/70 hover:shadow-lg hover:shadow-purple-950/60 transition-all text-left cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-3 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-display text-white group-hover:text-purple-300 transition-colors">
                      Resolver preguntas
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Ciencia, historia, conceptos abstractos y dudas cotidianas.
                    </p>
                  </div>
                </button>

                {/* 3. Generar ideas */}
                <button
                  onClick={() =>
                    handleSuggestionClick(
                      'Genera 5 ideas innovadoras para una startup tecnológica en 2026 enfocada en sostenibilidad'
                    )
                  }
                  className="group p-4 rounded-2xl bg-gradient-to-b from-[#101222] to-[#0A0B16] border border-purple-700/30 hover:border-purple-500/70 hover:shadow-lg hover:shadow-purple-950/60 transition-all text-left cursor-pointer flex flex-col justify-between"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-3 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold font-display text-white group-hover:text-purple-300 transition-colors">
                      Generar ideas
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Estrategias de negocio, lluvia de ideas y proyectos creativos.
                    </p>
                  </div>
                </button>
              </div>

              {/* Additional quick starter prompts */}
              <div className="w-full max-w-2xl">
                <p className="text-[11px] font-mono uppercase tracking-wider text-purple-400/60 mb-2.5">
                  Sugerencias rápidas
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    '¿Quién te creó?',
                    'Explica la teoría de la relatividad general de Einstein',
                    'Escribe un plan de entrenamiento de fuerza para principiantes',
                    'Redacta un correo profesional solicitando una reunión ejecutiva',
                    'Diseña una arquitectura de microservicios escalable',
                  ].map((samplePrompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(samplePrompt)}
                      className="px-3 py-1.5 rounded-full bg-[#0D0F1B] hover:bg-purple-950/40 text-xs text-slate-300 hover:text-white border border-purple-900/30 hover:border-purple-600/40 transition-all cursor-pointer"
                    >
                      {samplePrompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* CONVERSATION MESSAGES */
            <div className="space-y-6 pb-4">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                const isCopied = copiedMessageId === message.id;
                const isSpeaking = speakingMessageId === message.id;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 sm:gap-4 ${
                      isUser ? 'justify-end' : 'justify-start'
                    } animate-in fade-in duration-300`}
                  >
                    {!isUser && (
                      <div className="shrink-0 mt-1">
                        <PrensLogo size="sm" />
                      </div>
                    )}

                    <div
                      className={`relative group rounded-2xl max-w-[88%] sm:max-w-[80%] ${
                        isUser
                          ? 'bg-gradient-to-br from-purple-800/80 to-purple-950/90 text-white px-4 py-3 rounded-tr-sm border border-purple-500/30 shadow-md shadow-purple-950/50'
                          : 'bg-[#0B0D18]/90 text-slate-100 px-5 py-4 rounded-tl-sm border border-purple-900/30 shadow-lg shadow-black/40'
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                          {message.content}
                        </div>
                      ) : (
                        <MarkdownRenderer content={message.content} />
                      )}

                      {/* Message Footer Actions */}
                      <div
                        className={`flex items-center gap-2 mt-2 pt-2 border-t text-[11px] font-mono ${
                          isUser
                            ? 'border-purple-600/20 text-purple-200/60 justify-end'
                            : 'border-purple-900/20 text-slate-500 justify-between'
                        }`}
                      >
                        <span>
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {!isUser && (
                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="p-1 rounded text-slate-400 hover:text-purple-300 hover:bg-purple-900/30 transition-colors"
                              title="Copiar texto"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Speak button */}
                            <button
                              onClick={() => handleToggleSpeak(message.id, message.content)}
                              className="p-1 rounded text-slate-400 hover:text-purple-300 hover:bg-purple-900/30 transition-colors"
                              title={isSpeaking ? 'Detener lectura' : 'Escuchar respuesta en voz alta'}
                            >
                              {isSpeaking ? (
                                <VolumeX className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading State Animation */}
              {isLoading && (
                <div className="flex gap-3 sm:gap-4 items-start animate-in fade-in duration-300">
                  <div className="shrink-0 mt-1">
                    <PrensLogo size="sm" animated />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-sm bg-[#0B0D18]/90 border border-purple-800/40 shadow-lg shadow-purple-950/40">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                      </div>
                      <span className="text-xs text-purple-300/80 font-medium">
                        PRENS IA está procesando tu respuesta...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Large Bottom Input Bar */}
      <div className="relative z-20 px-4 sm:px-6 pb-4 sm:pb-6 pt-2 bg-gradient-to-t from-[#06070B] via-[#06070B]/95 to-transparent">
        <div className="max-w-3xl mx-auto">
          {/* Main Floating Input Container */}
          <div className="relative rounded-2xl bg-[#0D0E1A]/95 border border-purple-800/30 shadow-2xl shadow-purple-950/50 p-2 sm:p-2.5 focus-within:border-purple-500/70 focus-within:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Envía un mensaje a PRENS IA..."
              className="w-full px-3 py-2 bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base resize-none focus:outline-none min-h-[44px] max-h-[180px] leading-relaxed"
            />

            {/* Input Toolbar */}
            <div className="flex items-center justify-between pt-1 px-1">
              {/* Left Utilities */}
              <div className="flex items-center gap-1.5">
                {/* Speech Recognition Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                      : 'text-slate-400 hover:text-purple-300 hover:bg-purple-900/30'
                  }`}
                  title={isListening ? 'Detener dictado' : 'Dictar por voz en español'}
                >
                  {isListening ? (
                    <Mic className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                {/* Tone tag */}
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono text-purple-300/80 bg-purple-950/40 border border-purple-800/30">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>
                    {settings.tone === 'balanced'
                      ? 'Equilibrado'
                      : settings.tone === 'creative'
                      ? 'Creativo'
                      : settings.tone === 'precise'
                      ? 'Preciso'
                      : 'Código'}
                  </span>
                </span>
              </div>

              {/* Right Send / Stop Actions */}
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <button
                    onClick={onStopGeneration}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 text-white text-xs font-semibold border border-purple-500/40 transition-all cursor-pointer active:scale-95"
                    title="Detener respuesta"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Detener</span>
                  </button>
                ) : (
                  <>
                    {messages.length > 0 && !inputText && (
                      <button
                        onClick={onRegenerate}
                        className="hidden sm:flex items-center gap-1 p-2 rounded-xl text-slate-400 hover:text-purple-300 hover:bg-purple-900/30 transition-colors"
                        title="Regenerar última respuesta"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                        inputText.trim()
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/60 active:scale-95'
                          : 'bg-purple-950/30 text-purple-500/40 cursor-not-allowed'
                      }`}
                      title="Enviar mensaje"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-center gap-1.5">
            <span>PRENS IA · Creada por Zynapse 💜</span>
            <span>·</span>
            <span>Verifica información importante</span>
          </p>
        </div>
      </div>
    </div>
  );
};
