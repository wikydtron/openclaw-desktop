import React, { useState, useRef, useEffect } from 'react';
import type { Attachment } from '../types';

interface Props {
  onSend: (text: string, attachments?: Attachment[]) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export function MessageInput({ onSend, onStop, isGenerating, disabled }: Props) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }
  }, [text]);

  const handleSend = () => {
    const hasContent = text.trim().length > 0 || attachments.length > 0;
    if (!hasContent || disabled || isGenerating) return;
    onSend(text, attachments.length ? attachments : undefined);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePickImage = async () => {
    try {
      const attachment = await window.electronAPI.dialog.openImage();
      if (attachment) {
        setAttachments((prev) => [...prev, attachment]);
      }
    } catch (err) {
      console.error('Failed to pick image', err);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not available.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join('');
      setText((prev) => {
        const base = prev.trimEnd();
        return base ? `${base} ${transcript}` : transcript;
      });
    };

    recognition.start();
  };

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled && !isGenerating;

  return (
    <div className="shrink-0 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* Image previews */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {attachments.map((att, i) => (
              <div key={i} className="relative group">
                <img
                  src={att.dataUrl}
                  alt={att.fileName}
                  className="h-16 w-16 object-cover rounded-lg border border-zinc-700"
                />
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-900 border border-zinc-600 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors text-[10px] font-bold leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-zinc-800/60 rounded-2xl border border-zinc-700/40 px-3 py-2 focus-within:border-accent/50 transition-colors">
          {/* Image picker */}
          <button
            onClick={handlePickImage}
            disabled={disabled || isGenerating}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 disabled:opacity-30 transition-colors"
            title="Attach image"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Mic button */}
          <button
            onClick={toggleMic}
            disabled={disabled || isGenerating}
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${
              isListening
                ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
            }`}
            title={isListening ? 'Stop recording' : 'Voice input'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isListening ? 'animate-pulse' : ''}
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

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
              disabled={!canSend}
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
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
