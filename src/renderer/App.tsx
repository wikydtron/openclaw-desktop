import React, { useState } from 'react';
import { useGateway } from './hooks/useGateway';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { Settings } from './components/Settings';
import { Logs } from './components/Logs';
import { TitleBar } from './components/TitleBar';
import type { AppPage } from './types';

export default function App() {
  const [page, setPage] = useState<AppPage>('chat');

  const gateway = useGateway();
  const chat = useChat({
    sendRequest: gateway.sendRequest,
    setNodeEventHandler: gateway.setNodeEventHandler,
    isConnected: gateway.isConnected,
    addLog: gateway.addLog,
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-900">
      <TitleBar connectionState={gateway.connectionState} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          conversations={chat.conversations}
          activeId={chat.activeId}
          onSelect={chat.selectChat}
          onNew={chat.newChat}
          onDelete={chat.deleteChat}
          currentPage={page}
          onNavigate={setPage}
          connectionState={gateway.connectionState}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {page === 'chat' && (
            <ChatView
              conversation={chat.activeConversation}
              isGenerating={chat.isGenerating}
              onSend={chat.sendMessage}
              onStop={chat.stopGeneration}
              connectionState={gateway.connectionState}
              onRetry={gateway.retry}
            />
          )}
          {page === 'settings' && <Settings />}
          {page === 'logs' && (
            <Logs logs={gateway.logs} onClear={gateway.clearLogs} />
          )}
        </main>
      </div>
    </div>
  );
}
