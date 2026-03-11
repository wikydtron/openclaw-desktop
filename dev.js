#!/usr/bin/env node
/**
 * dev.js — cross-platform dev launcher for OpenClaw Desktop
 * 1. Compiles the Electron main process (tsc)
 * 2. Starts Vite dev server
 * 3. Waits for Vite to be ready
 * 4. Launches Electron
 * 5. Keeps everything running; Ctrl+C kills all processes cleanly
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

const isWin = process.platform === 'win32';

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, {
    stdio: 'inherit',
    shell: isWin,
    ...opts,
  });
}

function waitForPort(url, maxMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function attempt() {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on('error', () => {
          if (Date.now() - start > maxMs) return reject(new Error(`Timed out waiting for ${url}`));
          setTimeout(attempt, 500);
        });
    }
    attempt();
  });
}

async function main() {
  // Step 1: compile main process
  console.log('🔨 Compiling main process...');
  try {
    execSync('npx tsc -p tsconfig.main.json', { stdio: 'inherit' });
  } catch {
    process.exit(1);
  }

  // Step 2: start Vite
  console.log('⚡ Starting Vite dev server...');
  const vite = run('npx', ['vite']);

  // Step 3: wait for Vite
  console.log('⏳ Waiting for Vite on http://localhost:5173...');
  try {
    await waitForPort('http://localhost:5173');
  } catch (err) {
    console.error('❌', err.message);
    vite.kill();
    process.exit(1);
  }

  // Step 4: launch Electron using the Node.js binary directly (avoids .cmd wrapper issue on Windows)
  console.log('🚀 Launching Electron...');
  const electronPath = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
  const electronBin = isWin ? electronPath : require('electron');

  const electron = spawn(electronBin, ['.'], {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, NODE_ENV: 'development' },
  });

  electron.on('close', (code) => {
    console.log(`Electron exited (code ${code}), stopping Vite...`);
    vite.kill();
    process.exit(code || 0);
  });

  vite.on('close', (code) => {
    if (code !== null && code !== 0) {
      console.log(`Vite exited (code ${code}), stopping Electron...`);
      electron.kill();
      process.exit(code);
    }
  });

  // Clean shutdown on Ctrl+C
  process.on('SIGINT', () => {
    electron.kill();
    vite.kill();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    electron.kill();
    vite.kill();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Dev launcher error:', err);
  process.exit(1);
});
