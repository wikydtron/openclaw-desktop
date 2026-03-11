import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, Conversation } from '../types';

let convCounter = 0;

function createConversation(): Conversation {
  const id = `conv_${Date.now()}_${++convCounter}`;
  return {
    id,
    title: 'New Chat',
    messages: [],
    sessionKey: `desktop:${id}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function deriveTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'New Chat';
  const text = first.content.trim();
  return text.length > 40 ? text.slice(0, 40) + '...' : text;
}

interface UseChatOptions {
  sendRequest: (method: string, params: any, timeout?: number) => Promise<any>;
  setNodeEventHandler: (handler: ((payload: any) => void) | null) => void;
  isConnected: () => boolean;
  addLog: (level: 'info' | 'warn' | 'error' | 'debug', message: string) => void;
}

export function useChat({ sendRequest, setNodeEventHandler, isConnected, addLog }: UseChatOptions) {
  const [conversations, setConversations] = useState<Conversation[]>(() => [createConversation()]);
  const [activeId, setActiveId] = useState<string>(() => conversations[0]?.id || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const activeRunRef = useRef<string | null>(null);
  const streamBufferRef = useRef('');

  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  const updateConversation = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? updater(c) : c))
    );
  }, []);

  // Set up node event handler for streaming
  useEffect(() => {
    setNodeEventHandler((payload: any) => {
      if (!payload) return;

      const { state, message, runId, errorMessage } = payload;

      if (state === 'delta' && message?.content) {
        for (const block of message.content) {
          if (block.type === 'text' && block.text) {
            streamBufferRef.current = block.text;
            const currentBuffer = streamBufferRef.current;
            const currentActiveId = activeId;

            setConversations((prev) =>
              prev.map((c) => {
                if (c.id !== currentActiveId) return c;
                const msgs = [...c.messages];
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg?.role === 'assistant' && lastMsg.streaming) {
                  msgs[msgs.length - 1] = { ...lastMsg, content: currentBuffer };
                }
                return { ...c, messages: msgs, updatedAt: Date.now() };
              })
            );
          }
        }
      }

      if (state === 'final' || state === 'aborted' || state === 'error') {
        const finalContent = streamBufferRef.current;
        const errorMsg = errorMessage;
        const currentActiveId = activeId;

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== currentActiveId) return c;
            const msgs = [...c.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg?.role === 'assistant') {
              msgs[msgs.length - 1] = {
                ...lastMsg,
                content: state === 'error'
                  ? (errorMsg || 'An error occurred.')
                  : (finalContent || lastMsg.content),
                streaming: false,
              };
            }
            return { ...c, messages: msgs, updatedAt: Date.now() };
          })
        );

        setIsGenerating(false);
        activeRunRef.current = null;
        streamBufferRef.current = '';

        if (state === 'error') {
          addLog('error', `Agent error: ${errorMsg || 'Unknown'}`);
        }
      }
    });

    return () => setNodeEventHandler(null);
  }, [activeId, setNodeEventHandler, addLog]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !isConnected() || isGenerating) return;

      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}_u`,
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        streaming: true,
      };

      streamBufferRef.current = '';

      updateConversation(activeId, (c) => {
        const updated = {
          ...c,
          messages: [...c.messages, userMsg, assistantMsg],
          updatedAt: Date.now(),
          title: c.messages.length === 0 ? deriveTitle([userMsg]) : c.title,
        };
        return updated;
      });

      setIsGenerating(true);

      try {
        const idempotencyKey = `${activeId}_${Date.now()}`;
        const result = await sendRequest('chat.send', {
          sessionKey: activeConversation.sessionKey,
          message: text.trim(),
          idempotencyKey,
        }, 600000);

        addLog('info', `chat.send accepted for session ${activeConversation.sessionKey}`);
      } catch (err: any) {
        addLog('error', `chat.send failed: ${err.message}`);
        updateConversation(activeId, (c) => {
          const msgs = [...c.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.role === 'assistant' && lastMsg.streaming) {
            msgs[msgs.length - 1] = {
              ...lastMsg,
              content: `Error: ${err.message}`,
              streaming: false,
            };
          }
          return { ...c, messages: msgs };
        });
        setIsGenerating(false);
      }
    },
    [activeId, activeConversation, isConnected, isGenerating, sendRequest, updateConversation, addLog]
  );

  const stopGeneration = useCallback(async () => {
    try {
      await sendRequest('chat.abort', {
        sessionKey: activeConversation.sessionKey,
      });
    } catch {
      // may not support abort, just stop locally
    }
    setIsGenerating(false);
    updateConversation(activeId, (c) => {
      const msgs = [...c.messages];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.streaming) {
        msgs[msgs.length - 1] = { ...lastMsg, streaming: false };
      }
      return { ...c, messages: msgs };
    });
  }, [activeId, activeConversation, sendRequest, updateConversation]);

  const newChat = useCallback(() => {
    const conv = createConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  }, []);

  const selectChat = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteChat = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        if (filtered.length === 0) {
          const fresh = createConversation();
          filtered.push(fresh);
        }
        if (id === activeId) {
          setActiveId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeId]
  );

  return {
    conversations,
    activeConversation,
    activeId,
    isGenerating,
    sendMessage,
    stopGeneration,
    newChat,
    selectChat,
    deleteChat,
  };
}
