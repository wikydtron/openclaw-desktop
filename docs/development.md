# Development and packaging

This guide describes the scripts and build layout currently in this repository.
For the supported Windows runtime and OpenClaw prerequisites, see the
[README](../README.md#requirements).

## Start a development session

Run these commands from the repository root after installing Node.js and npm:

```bash
npm ci
npm run dev
```

The lockfile is committed. `npm ci` installs the locked dependency tree, and
the project's `postinstall` script runs `electron-builder install-app-deps`.
The application can try to start your configured OpenClaw gateway when it opens;
use a development gateway if you need to keep a live session separate.

The [development launcher](../dev.js) performs these steps:

1. Compile `src/main/` with `tsconfig.main.json`.
2. Start the Vite server.
3. Wait up to 30 seconds for `http://localhost:5173`.
4. Launch Electron with `NODE_ENV=development`.

The main process loads that same URL and opens DevTools in development.
Keep port **5173** available: the launcher and Electron both use that exact port.
If another process occupies it, check the Vite output before trusting the window.

## Which changes require a restart?

| Files | Development behavior |
| --- | --- |
| `src/renderer/` | Served by Vite with the React plugin. |
| `src/main/`, including `preload.ts` | Compiled once when the launcher starts; stop and restart `npm run dev` after editing. |
| Build configuration or dependencies | Restart the launcher after making the relevant changes. |

There is no TypeScript watch process for the Electron main process in `dev.js`.
Press **Ctrl+C** in the launching terminal to stop its child processes.
Closing the app window normally hides it while the tray exists; the tray's
**Quit** command exits the application.

## Build output

```bash
npm run build
```

This runs the main-process TypeScript compiler followed by `vite build`:

| Output | Configuration |
| --- | --- |
| `dist/main/` | [tsconfig.main.json](../tsconfig.main.json) |
| `dist/renderer/` | [vite.config.ts](../vite.config.ts) |

Vite's root is `src/renderer`, and its relative base is `./` so the packaged
renderer can be loaded from a file. Treat the output directories as generated
artifacts. Keep source changes in `src/` and configuration files.

To build the configured installer:

```bash
npm run dist
```

The [package configuration](../package.json) runs the production build, then
Electron Builder. Its Windows target is NSIS, and installer output goes to
`release/`. Other operating-system packages are not configured there.

## Validation before a pull request

Run `npm run build`, then check the changed behavior in a Windows development
session. The package currently defines no `test` or `lint` script, so a successful
build is not evidence of automated test coverage.

For packaging changes, also inspect the generated installer and tray behavior on
Windows. Build success alone does not verify that packaged asset paths work.
Include the commands actually run and any manual checks in the pull request.
