import React from 'react';
import type { ConnectionState } from '../types';

const STATUS_COLORS: Record<ConnectionState, string> = {
  idle: 'bg-zinc-500',
  starting: 'bg-yellow-400 animate-pulse',
  connecting: 'bg-yellow-400 animate-pulse',
  connected: 'bg-emerald-400',
  reconnecting: 'bg-amber-400 animate-pulse',
  error: 'bg-red-400',
};

const STATUS_LABELS: Record<ConnectionState, string> = {
  idle: 'Idle',
  starting: 'Starting...',
  connecting: 'Connecting...',
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  error: 'Error',
};

interface Props {
  connectionState: ConnectionState;
}

export function TitleBar({ connectionState }: Props) {
  return (
    <div className="h-[38px] flex items-center px-4 bg-zinc-950/80 border-b border-zinc-800/50 select-none shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lobster-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d4d"/>
              <stop offset="100%" stopColor="#991b1b"/>
            </linearGradient>
          </defs>
          <path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#lobster-gradient)"/>
          <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#lobster-gradient)"/>
          <path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#lobster-gradient)"/>
          <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
          <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="45" cy="35" r="6" fill="#050810"/>
          <circle cx="75" cy="35" r="6" fill="#050810"/>
          <circle cx="46" cy="34" r="2.5" fill="#00e5cc"/>
          <circle cx="76" cy="34" r="2.5" fill="#00e5cc"/>
        </svg>
        <span className="text-sm font-semibold text-zinc-200 tracking-tight">OpenClaw</span>
      </div>

      <div className="flex-1" />

      {/* Connection status */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[connectionState]}`} />
        <span>{STATUS_LABELS[connectionState]}</span>
      </div>
    </div>
  );
}
