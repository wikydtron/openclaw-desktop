import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import net from 'net';

const CONFIG_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  '.openclaw',
  'openclaw.json'
);

interface GatewayConfig {
  url: string;
  token: string;
  port: number;
}

export class GatewayManager {
  private config: GatewayConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): GatewayConfig {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      const port = parsed.gateway?.port || 18789;
      const token = parsed.gateway?.auth?.token || '';
      return {
        url: `ws://127.0.0.1:${port}`,
        token,
        port,
      };
    } catch {
      return { url: 'ws://127.0.0.1:18789', token: '', port: 18789 };
    }
  }

  getConfig(): GatewayConfig {
    return { ...this.config };
  }

  updateConfig(updates: { url?: string; token?: string }) {
    if (updates.url) this.config.url = updates.url;
    if (updates.token) this.config.token = updates.token;
  }

  async checkHealth(): Promise<{ ok: boolean; data?: any; error?: string }> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.on('connect', () => {
        socket.destroy();
        resolve({ ok: true });
      });
      socket.on('error', () => resolve({ ok: false, error: 'Gateway not reachable' }));
      socket.on('timeout', () => {
        socket.destroy();
        resolve({ ok: false, error: 'Gateway timeout' });
      });
      socket.connect(this.config.port, '127.0.0.1');
    });
  }

  async startGateway(): Promise<{ ok: boolean; error?: string }> {
    try {
      const health = await this.checkHealth();
      if (health.ok) return { ok: true };

      // Find openclaw executable
      const cmd = process.platform === 'win32' ? 'openclaw.cmd' : 'openclaw';
      const child = spawn(cmd, ['gateway', 'start'], {
        detached: true,
        stdio: 'ignore',
        shell: true,
        windowsHide: true,
      });
      child.unref();

      // Wait for gateway to come up (up to 15s)
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 500));
        const h = await this.checkHealth();
        if (h.ok) return { ok: true };
      }

      return { ok: false, error: 'Gateway did not start in time' };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  async restartGateway(): Promise<{ ok: boolean; error?: string }> {
    try {
      const cmd = process.platform === 'win32' ? 'openclaw.cmd' : 'openclaw';
      execSync(`${cmd} gateway stop`, { timeout: 10000, windowsHide: true, stdio: 'ignore' });
    } catch {
      // may not be running
    }
    await new Promise((r) => setTimeout(r, 1000));
    return this.startGateway();
  }
}
