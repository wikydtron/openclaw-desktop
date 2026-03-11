export type ConnectionState =
  | 'idle'
  | 'starting'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  streaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  sessionKey: string;
  createdAt: number;
  updatedAt: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export type AppPage = 'chat' | 'settings' | 'logs';

declare global {
  interface Window {
    electronAPI: {
      gateway: {
        health: () => Promise<{ ok: boolean; data?: any; error?: string }>;
        start: () => Promise<{ ok: boolean; error?: string }>;
        restart: () => Promise<{ ok: boolean; error?: string }>;
        getConfig: () => Promise<{ url: string; token: string; port: number }>;
        updateConfig: (config: { url?: string; token?: string }) => Promise<boolean>;
      };
      startup: {
        get: () => Promise<boolean>;
        set: (enabled: boolean) => Promise<boolean>;
      };
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
      };
      shell: {
        openExternal: (url: string) => Promise<void>;
      };
    };
  }
}
