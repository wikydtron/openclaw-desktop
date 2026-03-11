import React, { useRef, useEffect } from 'react';
import type { Conversation, ConnectionState } from '../types';
import { MessageInput } from './MessageInput';

interface Props {
  conversation: Conversation;
  isGenerating: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  connectionState: ConnectionState;
  onRetry: () => void;
}

export function ChatView({ conversation, isGenerating, onSend, onStop, connectionState, onRetry }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isConnected = connectionState === 'connected';

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [conversation.messages]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {conversation.messages.length === 0 ? (
          <EmptyState connectionState={connectionState} onRetry={onRetry} />
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
            {conversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent text-white rounded-br-md'
                      : 'bg-zinc-800/80 text-zinc-100 rounded-bl-md border border-zinc-700/30'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="message-content">
                      {msg.streaming && !msg.content ? (
                        <ThinkingDots />
                      ) : (
                        <FormattedContent content={msg.content} />
                      )}
                      {msg.streaming && msg.content && (
                        <span className="inline-block w-1.5 h-4 bg-accent ml-0.5 animate-pulse rounded-sm" />
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput
        onSend={onSend}
        onStop={onStop}
        isGenerating={isGenerating}
        disabled={!isConnected}
      />
    </div>
  );
}

function EmptyState({ connectionState, onRetry }: { connectionState: ConnectionState; onRetry: () => void }) {
  if (connectionState === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-200 mb-1">Connection Error</h3>
        <p className="text-sm text-zinc-400 mb-4 max-w-sm">
          Could not connect to the OpenClaw gateway. Make sure the gateway is running.
        </p>
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (connectionState !== 'connected') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent animate-spin">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-200 mb-1">
          {connectionState === 'starting' ? 'Starting OpenClaw...' : 'Connecting...'}
        </h3>
        <p className="text-sm text-zinc-400">Setting up your session</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-accent">
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"
            fill="currentColor"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-zinc-100 mb-2">What can I help with?</h2>
      <p className="text-sm text-zinc-400 max-w-md">
        Send a message to start a conversation with your OpenClaw agent.
      </p>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  // Simple markdown-like rendering
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const inner = part.slice(3, -3);
          const newlineIdx = inner.indexOf('\n');
          const code = newlineIdx >= 0 ? inner.slice(newlineIdx + 1) : inner;
          return (
            <pre key={i}>
              <code>{code}</code>
            </pre>
          );
        }

        // Process inline formatting
        return (
          <span key={i}>
            {part.split('\n').map((line, j, arr) => (
              <React.Fragment key={j}>
                <InlineLine text={line} />
                {j < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      })}
    </>
  );
}

function InlineLine({ text }: { text: string }) {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        // Inline code
        const codeParts = part.split(/(`[^`]+`)/g);
        return codeParts.map((cp, j) => {
          if (cp.startsWith('`') && cp.endsWith('`')) {
            return <code key={`${i}-${j}`}>{cp.slice(1, -1)}</code>;
          }
          return <React.Fragment key={`${i}-${j}`}>{cp}</React.Fragment>;
        });
      })}
    </>
  );
}
