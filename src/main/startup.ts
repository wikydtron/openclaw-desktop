import { app } from 'electron';

export function setStartup(enabled: boolean) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
  });
}

export function getStartup(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}
