# Connection troubleshooting

Start with the **Logs** page. The messages distinguish gateway startup,
WebSocket connection, and authentication failures. Keep auth tokens out of
screenshots, copied configuration, and issue reports.

## Configuration loaded at startup

The [gateway manager](../src/main/gateway.ts) reads `.openclaw/openclaw.json`
under `USERPROFILE`, or under `HOME` when `USERPROFILE` is absent. It uses:

| JSON field | Desktop behavior |
| --- | --- |
| `gateway.port` | Connect to `ws://127.0.0.1:<port>`; defaults to `18789`. |
| `gateway.auth.token` | Supply the token to the WebSocket handshake. |

If reading or parsing the file fails, the manager falls back to
`ws://127.0.0.1:18789` and an empty token. An empty token prevents the renderer
from attempting authentication.

The current code constructs a loopback URL from the port; it does not read an
arbitrary gateway URL from that JSON file.

## Use the log message to choose the next check

| Log message | What to check |
| --- | --- |
| `No gateway URL or token configured` | Verify the gateway's configuration file and the values shown in Settings. |
| `Failed to start gateway: Gateway did not start in time` | Verify that the OpenClaw CLI is installed, available to the desktop process, and that its gateway can start. |
| `WebSocket error` | Verify the saved WebSocket URL and that the intended gateway is reachable. |
| `Connect handshake timed out` | A socket opened, but authentication did not complete within 10 seconds; inspect the gateway's own logs. |
| `Auth failed: ...` | Check the returned reason in Logs and verify that the token belongs to the intended gateway. |
| `Connected and authenticated` | The desktop's protocol handshake succeeded. |

The startup health check is a TCP connection to `127.0.0.1` on the initially
loaded port, with a two-second timeout. A successful TCP check means something
is listening; the WebSocket handshake still has to succeed separately.

When that check fails, startup invokes `openclaw gateway start`
(`openclaw.cmd` on Windows), then makes up to 30 health-check attempts with a
500 ms delay before each attempt. Each TCP check can also take up to two seconds,
so repeated timeouts can extend the wait beyond 15 seconds.
The spawned command's output is ignored, so investigate CLI errors in a terminal
or the gateway's own logs if the desktop only reports a startup timeout.

## Save settings, then retry

The **Save** button updates the gateway manager in memory. It does not write
`openclaw.json` or immediately reconnect an existing socket. The chat view's
**Retry** action reloads the manager's current values before connecting again.

Changes made with Save are lost when the desktop process exits. For persistent
configuration, use your normal OpenClaw configuration process and relaunch the
desktop after confirming the file contains the intended values.

The current `updateConfig` implementation accepts only nonempty URL/token values
and does not update the port used by the TCP health check. Changing the URL in
Settings therefore does not retarget automatic startup or health checks to a
different host or port. Account for this when diagnosing a custom endpoint.

**Restart Gateway** stops and starts the gateway through the OpenClaw CLI.
It can interrupt an active gateway session; it is not required just to save
desktop settings.

## Reconnection and closing the app

An abnormal WebSocket close schedules another connection attempt after three
seconds. A normal close with code `1000` returns the connection state to idle.
An authentication error on an open socket is not the same as a close event.

Closing the window normally hides it in the tray. To reload startup configuration,
use the tray's **Quit** command and then reopen the app.

## Report enough detail to reproduce a problem

Include the desktop version, Windows version, whether it is a source or packaged
build, and the log messages around the failure. Say whether the gateway was
already running and whether default or custom connection settings were used.
Redact tokens and private hostnames before sharing logs.

Implementation references: [connection hook](../src/renderer/hooks/useGateway.ts),
[Settings](../src/renderer/components/Settings.tsx),
[chat retry wiring and Logs page](../src/renderer/App.tsx), and
[tray lifecycle](../src/main/main.ts).
