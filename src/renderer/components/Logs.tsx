import React, { useRef, useEffect } from 'react';
import type { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
  onClear: () => void;
}

const LEVEL_STYLES: Record<string, string> = {
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  debug: 'text-zinc-500',
};

export function Logs({ logs, onClear }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const handleCopy = () => {
    const text = logs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] ${l.message}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Diagnostics</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{logs.length} entries</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors border border-zinc-700/40"
          >
            Copy All
          </button>
          <button
            onClick={onClear}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors border border-zinc-700/40"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            No log entries yet
          </div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((entry) => (
              <div key={entry.id} className="flex gap-3 py-0.5 hover:bg-zinc-800/30 px-2 rounded">
                <span className="text-zinc-600 shrink-0 w-[72px]">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`shrink-0 w-[44px] uppercase font-semibold ${
                    LEVEL_STYLES[entry.level] || 'text-zinc-400'
                  }`}
                >
                  {entry.level}
                </span>
                <span className="text-zinc-300 break-all">{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
