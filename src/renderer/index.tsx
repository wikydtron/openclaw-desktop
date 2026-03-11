import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div
          style={{
            color: '#f4f4f5',
            padding: '40px',
            background: '#18181b',
            height: '100vh',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ color: '#f87171', fontSize: '18px', marginBottom: '12px' }}>
            ⚠ Renderer Error
          </div>
          <pre
            style={{
              fontSize: '12px',
              color: '#fca5a5',
              background: '#27272a',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {err.stack || String(err)}
          </pre>
          <div style={{ marginTop: '16px', fontSize: '13px', color: '#a1a1aa' }}>
            Open DevTools (F12) for more details.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
