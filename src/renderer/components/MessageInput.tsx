import React, { useState, useRef, useEffect } from 'react';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export function MessageInput({ onSend, onStop, isGenerating, disabled }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || disabled || isGenerating) return;
    onSend(text);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-zinc-800/60 rounded-2xl border border-zinc-700/40 px-4 py-2 focus-within:border-accent/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Waiting for connection...' : 'Send a message...'}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none outline-none py-1.5 max-h-[200px] disabled:opacity-50"
          />
          {isGenerating ? (
            <button
              onClick={onStop}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
              title="Stop generating"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!text.trim() || disabled}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:hover:bg-accent text-white transition-colors"
              title="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
