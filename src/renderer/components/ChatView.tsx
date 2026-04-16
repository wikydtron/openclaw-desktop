import React, { useRef, useEffect, useState } from 'react';
import type { Attachment, Conversation, ConnectionState } from '../types';
import { MessageInput } from './MessageInput';

interface Props {
  conversation: Conversation;
  isGenerating: boolean;
  onSend: (text: string, attachments?: Attachment[]) => void;
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
                    <div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {msg.attachments.map((att, i) => (
                            <img
                              key={i}
                              src={att.dataUrl}
                              alt={att.fileName}
                              className="max-h-48 max-w-xs rounded-lg object-contain border border-white/10"
                            />
                          ))}
                        </div>
                      )}
                      {msg.content && (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      )}
                    </div>
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

const FUNNY_LINES = [
  "Trained on the entire internet. Still can't find my keys.",
  "I was going to make a joke about AI, but I'm still processing it.",
  "I can write code, poems, and existential crises — often in the same response.",
  "Proudly hallucinating since 2023.",
  "Warning: may occasionally be helpful.",
  "I've read every book ever written. Still haven't found the remote.",
  "99% of the time I know what I'm talking about. The other 1% I'm very confident.",
  "Ask me anything. I'll either help or sound convincingly like I am.",
  "I don't sleep. I don't eat. I just… wait for you.",
  "My context window is limited. My enthusiasm is not.",
  "Powered by electricity, coffee metaphors, and sheer mathematical audacity.",
  "Not a search engine. Not a calculator. Somehow worse and better at both.",
  "I have opinions. I'm also completely made up.",
  "Statistically likely to give good advice.",
  "Certified good at things that don't matter at 3 AM.",
];

function EmptyState({ connectionState, onRetry }: { connectionState: ConnectionState; onRetry: () => void }) {
  const [tagline] = useState(() => FUNNY_LINES[Math.floor(Math.random() * FUNNY_LINES.length)]);
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
      <svg width="72" height="72" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-5 opacity-90">
        <defs>
          <linearGradient id="lobster-gradient-empty" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d4d"/>
            <stop offset="100%" stopColor="#991b1b"/>
          </linearGradient>
        </defs>
        <path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#lobster-gradient-empty)"/>
        <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#lobster-gradient-empty)"/>
        <path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#lobster-gradient-empty)"/>
        <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
        <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="45" cy="35" r="6" fill="#050810"/>
        <circle cx="75" cy="35" r="6" fill="#050810"/>
        <circle cx="46" cy="34" r="2.5" fill="#00e5cc"/>
        <circle cx="76" cy="34" r="2.5" fill="#00e5cc"/>
      </svg>
      <h2 className="text-xl font-semibold text-zinc-100 mb-2">What can I help with?</h2>
      <p className="text-sm text-zinc-500 max-w-sm italic mb-1">{tagline}</p>
      <p className="text-xs text-zinc-600 max-w-md mt-2">
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
