# OpenClaw Desktop

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-%E2%98%95-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://paypal.me/theboss3dfactory/)

A desktop client for [OpenClaw](https://openclaw.ai) — chat with your local OpenClaw gateway from a native Windows app instead of using the terminal.

![OpenClaw Desktop](assets/tray-icon.png)

## What it does

- Connects to your local OpenClaw gateway over WebSocket
- Chat interface with streaming responses
- Multiple conversations in the sidebar
- Lives in the system tray — minimize to tray, double-click to restore
- Auto-starts the gateway if it's not running
- Logs view for debugging connection issues
- Settings to configure gateway URL and auth token

## Requirements

- [OpenClaw](https://openclaw.ai) installed and configured (`openclaw gateway install` to register as a service)
- Windows 10/11 x64
- Node.js (for dev mode only)

## Quick start

### Run from source

```bash
npm install
npm run dev
```

### Build installer

```bash
npm run dist
```

Outputs `release/OpenClaw Desktop Setup 1.0.0.exe` — a standard NSIS installer.

## How it connects

The app reads your OpenClaw config from `~/.openclaw/openclaw.json` to get the gateway URL and auth token. If the gateway isn't running when the app starts, it calls `openclaw gateway start` to bring it up automatically.

The WebSocket connection uses the OpenClaw gateway protocol (protocol version 3, `gateway-client` client role).

## Project structure

```
src/
  main/
    main.ts          # Electron main process, IPC handlers, tray
    gateway.ts       # Gateway manager (health check, start/stop)
    startup.ts       # Windows startup registry
    preload.ts       # Context bridge
  renderer/
    App.tsx          # Root component
    hooks/
      useGateway.ts  # WebSocket connection + reconnect logic
      useChat.ts     # Chat state + streaming
    components/
      TitleBar.tsx
      Sidebar.tsx
      ChatView.tsx
      MessageInput.tsx
      Settings.tsx
      Logs.tsx
```

## Tech stack

- [Electron](https://www.electronjs.org/) 28
- [React](https://react.dev/) 18
- [Vite](https://vitejs.dev/) 5
- [Tailwind CSS](https://tailwindcss.com/) 3
- TypeScript

## License

MIT
---

## ☕ Support

If this project is useful to you, consider buying me a coffee!

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-%E2%98%95-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://paypal.me/theboss3dfactory/)

