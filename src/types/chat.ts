export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  tone?: 'balanced' | 'creative' | 'precise' | 'code';
}

export interface UserSettings {
  tone: 'balanced' | 'creative' | 'precise' | 'code';
  systemPrompt: string;
  autoSpeak: boolean;
  soundEffects: boolean;
  fontSize: 'normal' | 'large';
}
