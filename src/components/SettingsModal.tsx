import React from 'react';
import {
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Code2,
  Sliders,
  Trash2,
  Download,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { UserSettings, Conversation } from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onClearHistory: () => void;
  conversations: Conversation[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearHistory,
  conversations,
}) => {
  if (!isOpen) return null;

  const toneOptions = [
    {
      id: 'balanced',
      label: 'Equilibrado',
      desc: 'Respuestas naturales, empáticas y versátiles.',
      icon: Sparkles,
    },
    {
      id: 'creative',
      label: 'Creativo',
      desc: 'Imaginativo, original para ideas y redacción.',
      icon: Zap,
    },
    {
      id: 'precise',
      label: 'Preciso',
      desc: 'Directo al grano, analítico y sintético.',
      icon: Sliders,
    },
    {
      id: 'code',
      label: 'Código',
      desc: 'Estructura técnica experta, modular y limpia.',
      icon: Code2,
    },
  ] as const;

  const handleExportData = () => {
    const exportData = {
      appName: 'PRENS IA',
      exportedAt: new Date().toISOString(),
      conversations,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prens-ia-historial-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#090A14] border border-purple-800/40 shadow-2xl shadow-purple-950/80 overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30 bg-purple-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold font-display text-white">Configuración</h2>
              <p className="text-xs text-purple-300/70">Personaliza la experiencia de PRENS IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-purple-900/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* AI Model Info */}
          <div>
            <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider font-mono block mb-2">
              Motor de Inteligencia Artificial
            </label>
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/30 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white font-display">Gemini 3.8 Flash</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    Servicio Gratuito
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Procesamiento en tiempo real con alta velocidad, baja latencia y análisis avanzado.
                </p>
              </div>
              <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 ml-2" />
            </div>
          </div>

          {/* Tone / Style */}
          <div>
            <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider font-mono block mb-2">
              Tono de respuesta
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {toneOptions.map((opt) => {
                const isSelected = settings.tone === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onUpdateSettings({ tone: opt.id })}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-900/30 border-purple-500 text-white shadow-sm shadow-purple-900/50'
                        : 'bg-[#0E0F1B] border-purple-900/20 text-slate-400 hover:text-slate-200 hover:border-purple-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-purple-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs font-semibold text-white">{opt.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom System Prompt */}
          <div>
            <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider font-mono block mb-1.5">
              Instrucción personalizada (opcional)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Indícale a PRENS IA cómo deseas que se comporte o qué formato prefieres siempre.
            </p>
            <textarea
              rows={3}
              value={settings.systemPrompt}
              onChange={(e) => onUpdateSettings({ systemPrompt: e.target.value })}
              placeholder="Ej: Siempre dame ejemplos prácticos en TypeScript y sé muy directo..."
              className="w-full p-3 rounded-xl bg-[#0E0F1B] text-xs text-slate-200 border border-purple-900/30 focus:outline-none focus:border-purple-500/60 placeholder-slate-600 resize-none transition-colors"
            />
          </div>

          {/* Sound & Audio Options */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider font-mono block">
              Audio y Accesibilidad
            </label>

            {/* Sound effects */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0E0F1B] border border-purple-900/25">
              <div className="flex items-center gap-2.5">
                {settings.soundEffects ? (
                  <Volume2 className="w-4 h-4 text-purple-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <p className="text-xs font-medium text-white">Efectos de sonido futuristas</p>
                  <p className="text-[11px] text-slate-400">Sonido al enviar y recibir respuestas</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            {/* Auto speak (TTS) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0E0F1B] border border-purple-900/25">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-xs font-medium text-white">Lectura de voz automática (TTS)</p>
                  <p className="text-[11px] text-slate-400">Leer en español la respuesta generada</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Data Management */}
          <div className="space-y-2 pt-2 border-t border-purple-900/30">
            <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider font-mono block">
              Gestión de Datos
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleExportData}
                disabled={conversations.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 border border-purple-700/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar historial (JSON)</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas eliminar todas las conversaciones? Esta acción no se puede deshacer.')) {
                    onClearHistory();
                    onClose();
                  }
                }}
                disabled={conversations.length === 0}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 border border-rose-800/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar todo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-purple-900/30 bg-purple-950/10 flex items-center justify-between">
          <span className="text-[11px] text-purple-300/80 font-medium">PRENS IA · Creada por Zynapse 💜</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
