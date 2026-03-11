import { useState, useEffect, useRef, useCallback } from 'react';
import type { ConnectionState, LogEntry } from '../types';

type WsFrame = {
  type: 'req' | 'res' | 'event';
  id?: string;
  method?: string;
  params?: any;
  ok?: boolean;
  payload?: any;
  error?: { message: string; code?: string } | null;
  event?: string;
  seq?: number;
};

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type NodeEventHandler = (payload: any) => void;

let idCounter = 0;
function nextId(): string {
  return `req_${Date.now()}_${++idCounter}`;
}

export function useGateway() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());
  const nodeEventHandlerRef = useRef<NodeEventHandler | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef<{ url: string; token: string }>({ url: '', token: '' });
  const isConnectedRef = useRef(false);
  const mountedRef = useRef(true);

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      level,
      message,
    };
    setLogs((prev) => [...prev.slice(-500), entry]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const sendRequest = useCallback(
    (method: string, params: any = {}, timeoutMs = 30000): Promise<any> => {
      return new Promise((resolve, reject) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket not connected'));
          return;
        }
        const id = nextId();
        const timeout = setTimeout(() => {
          pendingRef.current.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }, timeoutMs);

        pendingRef.current.set(id, { resolve, reject, timeout });

        const frame: WsFrame = { type: 'req', id, method, params };
        ws.send(JSON.stringify(frame));
      });
    },
    []
  );

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    const ws = wsRef.current;
    if (ws) {
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.close();
      wsRef.current = null;
    }
    isConnectedRef.current = false;
    // Reject all pending
    pendingRef.current.forEach((p) => {
      clearTimeout(p.timeout);
      p.reject(new Error('Disconnected'));
    });
    pendingRef.current.clear();
  }, []);

  const connect = useCallback(
    async (retryAttempt = false) => {
      if (!mountedRef.current) return;
      disconnect();

      const config = configRef.current;
      if (!config.url || !config.token) {
        setConnectionState('error');
        addLog('error', 'No gateway URL or token configured');
        return;
      }

      setConnectionState(retryAttempt ? 'reconnecting' : 'connecting');
      addLog('info', `Connecting to ${config.url}...`);

      const ws = new WebSocket(config.url);
      wsRef.current = ws;

      ws.onopen = () => {
        addLog('info', 'WebSocket opened, waiting for challenge...');
      };

      ws.onmessage = (event) => {
        let frame: WsFrame;
        try {
          frame = JSON.parse(event.data as string);
        } catch {
          addLog('warn', 'Received non-JSON message');
          return;
        }

        // Handle challenge → send connect
        if (frame.type === 'event' && frame.event === 'connect.challenge') {
          addLog('info', 'Received challenge, authenticating...');
          const connectReq: WsFrame = {
            type: 'req',
            id: nextId(),
            method: 'connect',
            params: {
              minProtocol: 3,
              maxProtocol: 3,
              client: {
                id: 'gateway-client',
                displayName: 'OpenClaw Desktop',
                version: '1.0.0',
                platform: 'win32',
                mode: 'backend',
              },
              auth: {
                token: config.token,
              },
              role: 'operator',
              scopes: ['operator.admin'],
            },
          };
          // Track this as pending
          const reqId = connectReq.id!;
          const timeout = setTimeout(() => {
            pendingRef.current.delete(reqId);
            addLog('error', 'Connect handshake timed out');
            setConnectionState('error');
          }, 10000);
          pendingRef.current.set(reqId, {
            resolve: (payload: any) => {
              isConnectedRef.current = true;
              setConnectionState('connected');
              addLog('info', 'Connected and authenticated');
            },
            reject: (err: any) => {
              addLog('error', `Auth failed: ${err.message}`);
              setConnectionState('error');
            },
            timeout,
          });
          ws.send(JSON.stringify(connectReq));
          return;
        }

        // Handle response frames
        if (frame.type === 'res' && frame.id) {
          const pending = pendingRef.current.get(frame.id);
          if (pending) {
            pendingRef.current.delete(frame.id);
            clearTimeout(pending.timeout);
            if (frame.ok) {
              pending.resolve(frame.payload);
            } else {
              pending.reject(
                new Error(frame.error?.message || 'Request failed')
              );
            }
          }
          return;
        }

        // Handle chat events (streaming)
        if (frame.type === 'event' && frame.event === 'chat') {
          nodeEventHandlerRef.current?.(frame.payload);
          return;
        }

        // Other events
        if (frame.type === 'event') {
          addLog('debug', `Event: ${frame.event}`);
        }
      };

      ws.onerror = () => {
        addLog('error', 'WebSocket error');
      };

      ws.onclose = (event) => {
        isConnectedRef.current = false;
        addLog('warn', `WebSocket closed (code: ${event.code})`);
        if (mountedRef.current && event.code !== 1000) {
          setConnectionState('reconnecting');
          addLog('info', 'Reconnecting in 3 seconds...');
          reconnectTimerRef.current = setTimeout(() => {
            connect(true);
          }, 3000);
        } else {
          setConnectionState('idle');
        }
      };
    },
    [disconnect, addLog]
  );

  const initialize = useCallback(async () => {
    setConnectionState('starting');
    addLog('info', 'Checking gateway status...');

    try {
      const config = await window.electronAPI.gateway.getConfig();
      configRef.current = { url: config.url, token: config.token };

      const health = await window.electronAPI.gateway.health();
      if (!health.ok) {
        addLog('info', 'Gateway not running, starting...');
        setConnectionState('starting');
        const startResult = await window.electronAPI.gateway.start();
        if (!startResult.ok) {
          addLog('error', `Failed to start gateway: ${startResult.error}`);
          setConnectionState('error');
          return;
        }
        addLog('info', 'Gateway started');
      } else {
        addLog('info', 'Gateway is running');
      }

      await connect();
    } catch (err: any) {
      addLog('error', `Init error: ${err.message}`);
      setConnectionState('error');
    }
  }, [connect, addLog]);

  const retry = useCallback(() => {
    initialize();
  }, [initialize]);

  const setNodeEventHandler = useCallback((handler: NodeEventHandler | null) => {
    nodeEventHandlerRef.current = handler;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    initialize();
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, []);

  return {
    connectionState,
    logs,
    clearLogs,
    addLog,
    sendRequest,
    connect,
    disconnect,
    retry,
    setNodeEventHandler,
    isConnected: () => isConnectedRef.current,
  };
}
